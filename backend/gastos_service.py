"""
gastos_service.py
Módulo de Gestión Financiera y Control de Gastos Operativos (Semana 3)
Plataforma SaaS: Montepiedra Salud

Implementa la lógica de negocio para:
1. Registro ultrarrápido y tipado de gastos de transporte (movilidad en ruta) e insumos médicos por sede.
2. Atribución estricta a sedes (Mapasingue 5%, Ceibos 25%, Alborada 10%, Hospital Público 0%).
3. Flag de Pagador: Reembolso a favor del médico vs. Deducción a la sede.
4. Consulta reactiva con KPIs y agregaciones semanales.
5. Protección contra borrado de egresos en liquidaciones semanales cerradas.
"""

from decimal import Decimal, ROUND_HALF_UP
from datetime import datetime, date, timedelta, timezone
from typing import Dict, Any, List, Optional, Union
import uuid

# Sedes Oficiales Soportadas en Montepiedra Salud
SEDES_VALIDAS = {
    "MAPASINGUE": {"nombre": "Consultorio Mapasingue", "retencion": Decimal("0.05")},
    "CEIBOS": {"nombre": "Clínica Ceibos", "retencion": Decimal("0.25")},
    "ALBORADA": {"nombre": "Consultorio Alborada", "retencion": Decimal("0.10")},
    "HOSPITAL": {"nombre": "Hospital Público Ceibos", "retencion": Decimal("0.00")},
    "GENERAL": {"nombre": "Traslado General / Inter-Sedes", "retencion": Decimal("0.00")}
}

TIPOS_TRANSPORTE = {
    "GASOLINA": "Gasolina / Combustible",
    "TAXI_APP": "Taxi / App de Movilidad (Uber, Cabify, Indrive)",
    "PEAJE": "Peaje",
    "PARQUEADERO": "Parqueadero",
    "OTRO": "Otro Transporte"
}

CATEGORIAS_INSUMO = {
    "INSUMOS_MEDICOS_BASICOS": "Insumos Médicos Básicos (guantes, alcohol, jeringas)",
    "MATERIAL_QUIRURGICO": "Material Quirúrgico / Especializado",
    "PAPELERIA_IMPRESIONES": "Papelería / Impresiones",
    "LIMPIEZA_DESINFECCION": "Limpieza / Desinfección",
    "MANTENIMIENTO": "Mantenimiento",
    "OTROS": "Otros Insumos"
}

ORIGENES_FONDO = {
    "MEDICO_PERSONAL": "Dinero propio del médico (Reembolso en liquidación)",
    "CAJA_CHICA_SEDE": "Caja chica / fondo de la sede (Deducción a la sede)"
}

TIPOS_COMPROBANTE = {
    "FACTURA_RUC": "Factura con RUC",
    "NOTA_VENTA": "Nota de Venta",
    "SIN_COMPROBANTE": "Sin Comprobante / Ticket Informal"
}


class GastoValidationError(ValueError):
    """Error disparado cuando los datos de un gasto violan las reglas contables."""
    pass


class GastoLiquidadoError(PermissionError):
    """Error disparado cuando se intenta editar o eliminar un gasto en liquidación cerrada."""
    pass


class RepositorioGastosMemoria:
    """Almacén en memoria volátil para pruebas unitarias y microservicio backend."""
    _gastos: Dict[str, Dict[str, Any]] = {}

    @classmethod
    def reset(cls):
        cls._gastos.clear()

    @classmethod
    def seed_default_data(cls):
        hoy = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        cls._gastos = {
            "EXP-G001": {
                "id": "EXP-G001",
                "tipo_gasto": "TRANSPORTE",
                "sede_codigo": "CEIBOS",
                "tipo_transporte": "GASOLINA",
                "monto": Decimal("15.00"),
                "fecha_hora": f"{hoy}T08:15:00",
                "motivo": "Gasolina Super para ruta Ceibos - Alborada",
                "origen_fondo": "MEDICO_PERSONAL",
                "es_reembolso_medico": True,
                "comprobante_url": "factura_gasolina_101.jpg",
                "estado_liquidacion": "PENDIENTE"
            },
            "EXP-G002": {
                "id": "EXP-G002",
                "tipo_gasto": "TRANSPORTE",
                "sede_codigo": "HOSPITAL",
                "tipo_transporte": "TAXI_APP",
                "monto": Decimal("4.50"),
                "fecha_hora": f"{hoy}T13:40:00",
                "motivo": "Taxi de urgencia por guardia hospitalaria en Ceibos",
                "origen_fondo": "MEDICO_PERSONAL",
                "es_reembolso_medico": True,
                "comprobante_url": "recibo_uber_042.pdf",
                "estado_liquidacion": "PENDIENTE"
            },
            "EXP-G003": {
                "id": "EXP-G003",
                "tipo_gasto": "INSUMOS",
                "sede_codigo": "CEIBOS",
                "categoria_insumo": "INSUMOS_MEDICOS_BASICOS",
                "detalle": "Caja de guantes nitrilo y alcohol en gel 1L",
                "monto": Decimal("12.50"),
                "tipo_comprobante": "FACTURA_RUC",
                "numero_comprobante": "001-002-000492819",
                "origen_fondo": "CAJA_CHICA_SEDE",
                "es_reembolso_medico": False,
                "adjunto_url": "factura_difare_ceibos.pdf",
                "fecha_hora": f"{hoy}T10:30:00",
                "estado_liquidacion": "PENDIENTE"
            },
            "EXP-G004": {
                "id": "EXP-G004",
                "tipo_gasto": "INSUMOS",
                "sede_codigo": "MAPASINGUE",
                "categoria_insumo": "PAPELERIA_IMPRESIONES",
                "detalle": "Talonarios de recetas médicas membretadas (200 hojas)",
                "monto": Decimal("8.00"),
                "tipo_comprobante": "NOTA_VENTA",
                "numero_comprobante": "NV-004-9182",
                "origen_fondo": "MEDICO_PERSONAL",
                "es_reembolso_medico": True,
                "adjunto_url": "nota_venta_imprenta.jpg",
                "fecha_hora": f"{hoy}T11:00:00",
                "estado_liquidacion": "LIQUIDADO"  # Gasto cerrado para probar protección de eliminación
            }
        }


class ServicioGastosFinanciero:
    """
    Servicio de Dominio que procesa los endpoints de la API de Gastos:
    - POST /api/gastos
    - GET /api/gastos
    - DELETE /api/gastos/:id
    """

    def __init__(self, repo=RepositorioGastosMemoria):
        self.repo = repo
        if not self.repo._gastos:
            self.repo.seed_default_data()

    # -------------------------------------------------------------------------
    # 1. REGISTRAR GASTO (POST /api/gastos)
    # -------------------------------------------------------------------------
    def registrar_gasto(self, payload: Dict[str, Any], archivo: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Registra un egreso de Transporte o Insumos con validación matemática y contable.
        """
        tipo_gasto = str(payload.get("tipo_gasto", "")).upper().strip()
        if tipo_gasto not in ("TRANSPORTE", "INSUMOS"):
            raise GastoValidationError("El campo 'tipo_gasto' debe ser 'TRANSPORTE' o 'INSUMOS'.")

        # Validación de monto > 0.00
        try:
            monto_raw = payload.get("monto", payload.get("monto_total", 0))
            monto = Decimal(str(monto_raw)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            if monto <= Decimal("0.00"):
                raise GastoValidationError("El monto del gasto debe ser estrictamente mayor a $0.00.")
        except Exception as e:
            if isinstance(e, GastoValidationError):
                raise e
            raise GastoValidationError("Monto numérico inválido.")

        # Validación de Fecha y Hora (No permite fechas futuras)
        fecha_hora_str = payload.get("fecha_hora")
        now_utc = datetime.now(timezone.utc)
        if fecha_hora_str:
            try:
                # Soporta formatos ISO o 'YYYY-MM-DDTHH:MM'
                clean_iso = fecha_hora_str.replace("Z", "+00:00")
                if len(clean_iso) == 16:  # YYYY-MM-DDTHH:MM
                    fecha_hora = datetime.fromisoformat(clean_iso).replace(tzinfo=timezone.utc)
                else:
                    fecha_hora = datetime.fromisoformat(clean_iso)
                    if fecha_hora.tzinfo is None:
                        fecha_hora = fecha_hora.replace(tzinfo=timezone.utc)
            except ValueError:
                raise GastoValidationError("Formato de fecha_hora inválido (Use ISO-8601).")

            # Margen de 5 minutos de holgura por desfase de reloj
            if fecha_hora > now_utc + timedelta(minutes=5):
                raise GastoValidationError("No se permite registrar gastos con fecha y hora futura.")
        else:
            fecha_hora = now_utc
            fecha_hora_str = fecha_hora.strftime("%Y-%m-%dT%H:%M:%S")

        # Origen de Fondo (Quién pagó)
        origen_fondo = str(payload.get("origen_fondo", "MEDICO_PERSONAL")).upper().strip()
        if origen_fondo not in ORIGENES_FONDO:
            raise GastoValidationError(f"Origen de fondo inválido. Opciones: {list(ORIGENES_FONDO.keys())}")
        es_reembolso_medico = (origen_fondo == "MEDICO_PERSONAL")

        # Generar Identificador Único
        gasto_id = f"EXP-G{len(self.repo._gastos) + 1:03d}"

        # URL o referencia del archivo adjunto
        comprobante_url = payload.get("comprobante_url", payload.get("adjunto_url"))
        if archivo and "filename" in archivo:
            comprobante_url = archivo["filename"]

        # Validaciones específicas según el Tipo de Gasto
        if tipo_gasto == "TRANSPORTE":
            sede_codigo = str(payload.get("sede_codigo", payload.get("sede_asociada", "GENERAL"))).upper().strip()
            if sede_codigo not in SEDES_VALIDAS:
                raise GastoValidationError(f"Sede de transporte inválida. Opciones: {list(SEDES_VALIDAS.keys())}")

            tipo_transporte = str(payload.get("tipo_transporte", "")).upper().strip()
            if tipo_transporte not in TIPOS_TRANSPORTE:
                raise GastoValidationError(f"Tipo de transporte inválido. Opciones: {list(TIPOS_TRANSPORTE.keys())}")

            motivo = str(payload.get("motivo", payload.get("motivo_justificacion", ""))).strip()
            if not motivo:
                raise GastoValidationError("El motivo o justificación del traslado es obligatorio.")

            registro = {
                "id": gasto_id,
                "codigo": gasto_id,
                "tipo_gasto": "TRANSPORTE",
                "sede_codigo": sede_codigo,
                "sede_nombre": SEDES_VALIDAS[sede_codigo]["nombre"],
                "tipo_transporte": tipo_transporte,
                "tipo_transporte_label": TIPOS_TRANSPORTE[tipo_transporte],
                "monto": monto,
                "fecha_hora": fecha_hora_str,
                "motivo": motivo,
                "origen_fondo": origen_fondo,
                "es_reembolso_medico": es_reembolso_medico,
                "comprobante_url": comprobante_url,
                "estado_liquidacion": "PENDIENTE",
                "created_at": now_utc.isoformat()
            }

        else:  # INSUMOS
            sede_codigo = str(payload.get("sede_codigo", payload.get("sede_destino", ""))).upper().strip()
            if sede_codigo not in ("MAPASINGUE", "CEIBOS", "ALBORADA", "HOSPITAL"):
                raise GastoValidationError("Para insumos médicos debe especificar un consultorio o sede destino válida.")

            categoria_insumo = str(payload.get("categoria_insumo", "")).upper().strip()
            if categoria_insumo not in CATEGORIAS_INSUMO:
                raise GastoValidationError(f"Categoría de insumo inválida. Opciones: {list(CATEGORIAS_INSUMO.keys())}")

            detalle = str(payload.get("detalle", payload.get("detalle_descripcion", ""))).strip()
            if not detalle:
                raise GastoValidationError("El detalle o descripción de los insumos es obligatorio.")

            tipo_comprobante = str(payload.get("tipo_comprobante", "FACTURA_RUC")).upper().strip()
            if tipo_comprobante not in TIPOS_COMPROBANTE:
                raise GastoValidationError(f"Tipo de comprobante inválido. Opciones: {list(TIPOS_COMPROBANTE.keys())}")

            numero_comprobante = str(payload.get("numero_comprobante", "")).strip()
            if tipo_comprobante in ("FACTURA_RUC", "NOTA_VENTA") and not numero_comprobante:
                raise GastoValidationError("El número de comprobante es obligatorio para Factura con RUC y Nota de Venta.")

            registro = {
                "id": gasto_id,
                "codigo": gasto_id,
                "tipo_gasto": "INSUMOS",
                "sede_codigo": sede_codigo,
                "sede_nombre": SEDES_VALIDAS[sede_codigo]["nombre"],
                "categoria_insumo": categoria_insumo,
                "categoria_insumo_label": CATEGORIAS_INSUMO[categoria_insumo],
                "detalle": detalle,
                "monto": monto,
                "tipo_comprobante": tipo_comprobante,
                "tipo_comprobante_label": TIPOS_COMPROBANTE[tipo_comprobante],
                "numero_comprobante": numero_comprobante,
                "origen_fondo": origen_fondo,
                "es_reembolso_medico": es_reembolso_medico,
                "adjunto_url": comprobante_url,
                "comprobante_url": comprobante_url,
                "fecha_hora": fecha_hora_str,
                "estado_liquidacion": "PENDIENTE",
                "created_at": now_utc.isoformat()
            }

        # Guardar en repositorio
        self.repo._gastos[gasto_id] = registro
        return {
            "exito": True,
            "mensaje": f"Gasto {gasto_id} registrado exitosamente ({'Reembolso médico' if es_reembolso_medico else 'Deducción sede'}).",
            "gasto": registro
        }

    # -------------------------------------------------------------------------
    # 2. LISTAR GASTOS CON KPIS (GET /api/gastos)
    # -------------------------------------------------------------------------
    def listar_gastos(
        self,
        sede_id: Optional[str] = None,
        rango: Optional[str] = "semana",
        tipo: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Retorna la lista de egresos filtrados y los KPIs financieros agregados.
        """
        hoy_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        fecha_limite = datetime.now(timezone.utc) - timedelta(days=7)

        resultados = []
        total_transporte = Decimal("0.00")
        total_insumos = Decimal("0.00")
        total_reembolso_medico = Decimal("0.00")
        total_deduccion_sedes = Decimal("0.00")

        for g in self.repo._gastos.values():
            # Filtro por Sede
            if sede_id and sede_id.upper() != "TODAS":
                if g["sede_codigo"] != sede_id.upper():
                    continue

            # Filtro por Tipo de Gasto
            if tipo and tipo.upper() != "TODOS":
                if g["tipo_gasto"] != tipo.upper():
                    continue

            # Filtro por Rango Temporal
            g_fecha = g.get("fecha_hora", "")[:10]
            if rango == "hoy" and g_fecha != hoy_str:
                continue
            elif rango == "semana":
                try:
                    dt = datetime.fromisoformat(g["fecha_hora"][:10]).replace(tzinfo=timezone.utc)
                    if dt < fecha_limite:
                        continue
                except ValueError:
                    pass

            resultados.append(g)

            # Acumuladores de KPIs
            monto = g["monto"]
            if g["tipo_gasto"] == "TRANSPORTE":
                total_transporte += monto
            elif g["tipo_gasto"] == "INSUMOS":
                total_insumos += monto

            if g.get("es_reembolso_medico", False):
                total_reembolso_medico += monto
            else:
                total_deduccion_sedes += monto

        gran_total = total_transporte + total_insumos

        return {
            "exito": True,
            "total_registros": len(resultados),
            "kpis": {
                "total_transporte_semana": float(total_transporte),
                "total_insumos_semana": float(total_insumos),
                "gran_total_egresos": float(gran_total),
                "total_reembolso_medico": float(total_reembolso_medico),
                "total_deduccion_sedes": float(total_deduccion_sedes)
            },
            "gastos": sorted(resultados, key=lambda x: x.get("fecha_hora", ""), reverse=True)
        }

    # -------------------------------------------------------------------------
    # 3. ELIMINAR GASTO CON VALIDACIÓN (DELETE /api/gastos/:id)
    # -------------------------------------------------------------------------
    def eliminar_gasto(self, gasto_id: str) -> Dict[str, Any]:
        """
        Elimina un egreso solo si su estado_liquidacion es 'PENDIENTE'.
        Si ya fue liquidado en un cierre semanal, aborta con excepción.
        """
        if gasto_id not in self.repo._gastos:
            raise KeyError(f"Gasto con ID '{gasto_id}' no encontrado.")

        gasto = self.repo._gastos[gasto_id]
        if gasto.get("estado_liquidacion") == "LIQUIDADO":
            raise GastoLiquidadoError(
                "No se puede eliminar un gasto que ya ha sido procesado en una liquidación semanal cerrada."
            )

        del self.repo._gastos[gasto_id]
        return {
            "exito": True,
            "mensaje": f"Gasto {gasto_id} eliminado exitosamente."
        }
