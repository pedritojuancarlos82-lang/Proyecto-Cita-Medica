"""
motor_calendario.py
Núcleo Backend y Lógica de Negocio - Semana 2 (24 Sep - 30 Sep, 2026)
Plataforma SaaS: Gestión Médica Multisede (Montepiedra Salud)

Incluye:
1. Motor Algorítmico de Prevención de Choques y Tránsito Interurbano (4 pasos secuenciales).
2. Micro-módulo de Liquidación Financiera con precisión Decimal estricta.
"""

from decimal import Decimal, ROUND_HALF_UP
from datetime import datetime, timedelta, time
from typing import Dict, Any, Optional, List
import zoneinfo

# Zona Horaria Oficial para Operaciones Clínicas
ECUADOR_TZ = zoneinfo.ZoneInfo("America/Guayaquil")

# Matriz de tiempos de amortiguamiento (fallback en memoria cuando no hay DB conectada)
MATRIZ_BUFFERS_DEFAULT = {
    ("MAPASINGUE", "CEIBOS"): 35,
    ("MAPASINGUE", "ALBORADA"): 50,
    ("MAPASINGUE", "HOSPITAL"): 40,
    ("CEIBOS", "MAPASINGUE"): 35,
    ("CEIBOS", "ALBORADA"): 60,
    ("CEIBOS", "HOSPITAL"): 20,
    ("ALBORADA", "MAPASINGUE"): 50,
    ("ALBORADA", "CEIBOS"): 60,
    ("ALBORADA", "HOSPITAL"): 65,
    ("HOSPITAL", "MAPASINGUE"): 40,
    ("HOSPITAL", "CEIBOS"): 20,
    ("HOSPITAL", "ALBORADA"): 65,
}

# Comisiones y tarifas base por defecto
COMISIONES_SEDES = {
    "MAPASINGUE": Decimal("0.0500"),  # 5%
    "CEIBOS": Decimal("0.2500"),      # 25% (consultorio privado)
    "ALBORADA": Decimal("0.1000"),    # 10% (tercer local privado)
    "HOSPITAL": Decimal("0.0000"),    # 0% (sueldo fijo mensual $1,200)
}

TARIFAS_BASE_SEDES = {
    "MAPASINGUE": Decimal("20.00"),
    "CEIBOS": Decimal("20.00"),
    "ALBORADA": Decimal("10.00"),
    "HOSPITAL": Decimal("0.00"),
}

TASA_RECARGO_TARJETA = Decimal("0.0975")  # 9.75% Datafast


class MotorCalendarioInteligente:
    """
    Motor Algorítmico de Disponibilidad y Prevención de Conflictos Espacio-Temporales.
    """

    def __init__(self, db_conn=None):
        self.db = db_conn

    def validar_disponibilidad(
        self,
        medico_id: str,
        sede_solicitada_id: str,
        sala_solicitada_id: str,
        fecha_hora_propuesta_inicio: datetime,
        duracion_minutos: int,
        citas_existentes: Optional[List[Dict[str, Any]]] = None,
        horarios_rotacion: Optional[List[Dict[str, Any]]] = None,
        matriz_distancias: Optional[Dict[tuple, int]] = None
    ) -> Dict[str, Any]:
        """
        Ejecuta el pipeline de validaciones lógicas en 4 pasos estrictos:
        1. Validar horario de rotación del médico en la sede solicitada.
        2. Validar disponibilidad de la sala física compartida.
        3. Validar tiempos de amortiguamiento y traslado (citas previas y posteriores).
        4. Retornar aprobación o rechazo estructurado.
        """
        matriz = matriz_distancias or MATRIZ_BUFFERS_DEFAULT

        # Asegurar zona horaria UTC y conversión local para evaluar día/hora de rotación
        if fecha_hora_propuesta_inicio.tzinfo is None:
            inicio_utc = fecha_hora_propuesta_inicio.replace(tzinfo=zoneinfo.ZoneInfo("UTC"))
        else:
            inicio_utc = fecha_hora_propuesta_inicio.astimezone(zoneinfo.ZoneInfo("UTC"))

        fin_utc = inicio_utc + timedelta(minutes=duracion_minutos)
        inicio_local = inicio_utc.astimezone(ECUADOR_TZ)
        fin_local = fin_utc.astimezone(ECUADOR_TZ)

        dia_semana_map = {
            0: "LUNES", 1: "MARTES", 2: "MIERCOLES", 3: "JUEVES",
            4: "VIERNES", 5: "SABADO", 6: "DOMINGO"
        }
        dia_semana_nombre = dia_semana_map[inicio_local.weekday()]
        hora_inicio_local = inicio_local.time()
        hora_fin_local = fin_local.time()

        # ====================================================================
        # PASO 1: Validar horario de rotación configurado del médico
        # ====================================================================
        if horarios_rotacion is not None:
            en_horario = False
            for h in horarios_rotacion:
                if (
                    h.get("medico_id") == medico_id
                    and h.get("sede_id") == sede_solicitada_id
                    and h.get("dia_semana") == dia_semana_nombre
                ):
                    h_ini = h.get("hora_inicio")
                    h_fin = h.get("hora_fin")
                    if isinstance(h_ini, str):
                        h_ini = time.fromisoformat(h_ini)
                    if isinstance(h_fin, str):
                        h_fin = time.fromisoformat(h_fin)

                    if h_ini <= hora_inicio_local and h_fin >= hora_fin_local:
                        en_horario = True
                        break

            if not en_horario:
                return {
                    "valido": False,
                    "razon_rechazo": (
                        f"El médico no tiene turno rotativo activo en la sede {sede_solicitada_id} "
                        f"los días {dia_semana_nombre} en la franja {hora_inicio_local} - {hora_fin_local}."
                    ),
                    "tiempo_buffer_requerido": None,
                    "codigo_error": "FUERA_DE_ROTACION"
                }

        # ====================================================================
        # PASO 2: Validar que la sala física compartida esté libre
        # ====================================================================
        lista_citas = citas_existentes if citas_existentes is not None else []
        for c in lista_citas:
            if c.get("estado") in ("CANCELADA", "REAGENDADA"):
                continue

            c_inicio = c["inicio"]
            c_fin = c["fin"]
            if c_inicio.tzinfo is None:
                c_inicio = c_inicio.replace(tzinfo=zoneinfo.ZoneInfo("UTC"))
            if c_fin.tzinfo is None:
                c_fin = c_fin.replace(tzinfo=zoneinfo.ZoneInfo("UTC"))

            # Detección de solapamiento temporal: max(ini1, ini2) < min(fin1, fin2)
            traslape_sala = (
                c.get("sala_id") == sala_solicitada_id
                and max(inicio_utc, c_inicio) < min(fin_utc, c_fin)
            )

            if traslape_sala:
                return {
                    "valido": False,
                    "razon_rechazo": (
                        f"La sala de atención física {sala_solicitada_id} se encuentra ocupada por otra atención "
                        f"entre {c_inicio.isoformat()} y {c_fin.isoformat()}."
                    ),
                    "tiempo_buffer_requerido": None,
                    "codigo_error": "SALA_OCUPADA"
                }

        # ====================================================================
        # PASO 3: Validar tiempos de amortiguamiento y traslado (Buffer Times)
        # ====================================================================
        # 3.A. Cita previa más reciente del médico
        citas_medico_previas = [
            c for c in lista_citas
            if c.get("medico_id") == medico_id
            and c.get("estado") not in ("CANCELADA", "REAGENDADA")
            and (c["fin"].replace(tzinfo=zoneinfo.ZoneInfo("UTC")) if c["fin"].tzinfo is None else c["fin"]) <= inicio_utc
        ]

        if citas_medico_previas:
            citas_medico_previas.sort(key=lambda x: x["fin"])
            ultima_previa = citas_medico_previas[-1]
            sede_origen = ultima_previa.get("sede_id")

            if sede_origen != sede_solicitada_id:
                buffer_minutos = matriz.get((sede_origen, sede_solicitada_id), 30)
                tiempo_disp = (inicio_utc - (ultima_previa["fin"].replace(tzinfo=zoneinfo.ZoneInfo("UTC")) if ultima_previa["fin"].tzinfo is None else ultima_previa["fin"])).total_seconds() / 60

                if tiempo_disp < buffer_minutos:
                    return {
                        "valido": False,
                        "razon_rechazo": (
                            f"Tiempo de traslado insuficiente desde sede {sede_origen}. "
                            f"Se requieren {buffer_minutos} min de amortiguamiento vial (disponibles: {int(tiempo_disp)} min)."
                        ),
                        "tiempo_buffer_requerido": buffer_minutos,
                        "codigo_error": "TRASLADO_INSUFICIENTE_PRE"
                    }

        # 3.B. Cita posterior inmediata del médico
        citas_medico_posteriores = [
            c for c in lista_citas
            if c.get("medico_id") == medico_id
            and c.get("estado") not in ("CANCELADA", "REAGENDADA")
            and (c["inicio"].replace(tzinfo=zoneinfo.ZoneInfo("UTC")) if c["inicio"].tzinfo is None else c["inicio"]) >= fin_utc
        ]

        if citas_medico_posteriores:
            citas_medico_posteriores.sort(key=lambda x: x["inicio"])
            primera_posterior = citas_medico_posteriores[0]
            sede_destino = primera_posterior.get("sede_id")

            if sede_destino != sede_solicitada_id:
                buffer_minutos = matriz.get((sede_solicitada_id, sede_destino), 30)
                tiempo_disp = ((primera_posterior["inicio"].replace(tzinfo=zoneinfo.ZoneInfo("UTC")) if primera_posterior["inicio"].tzinfo is None else primera_posterior["inicio"]) - fin_utc).total_seconds() / 60

                if tiempo_disp < buffer_minutos:
                    return {
                        "valido": False,
                        "razon_rechazo": (
                            f"Tiempo de traslado insuficiente hacia la cita siguiente en sede {sede_destino}. "
                            f"Se requieren {buffer_minutos} min de traslado (disponibles: {int(tiempo_disp)} min)."
                        ),
                        "tiempo_buffer_requerido": buffer_minutos,
                        "codigo_error": "TRASLADO_INSUFICIENTE_POST"
                    }

        # ====================================================================
        # PASO 4: Aprobación Integral
        # ====================================================================
        return {
            "valido": True,
            "razon_rechazo": None,
            "tiempo_buffer_requerido": 0
        }


class ServicioLiquidacionFinanciera:
    """
    Micro-módulo de Liquidación Contable y Conciliación de Honorarios Médicos.
    Garantiza precisión en coma fija (DECIMAL de 10 dígitos y 2 decimales).
    """

    @staticmethod
    def liquidar_honorarios_consulta(
        sede_codigo: str,
        metodo_pago: str,
        tarifa_base_personalizada: Optional[Decimal] = None
    ) -> Dict[str, Any]:
        """
        Calcula la liquidación financiera determinista para una cita médica:
        - Tarifa Base según sede (Mapasingue: $20, Ceibos: $20, Alborada: $10, Hospital: $0)
        - Recargo 9.75% por tarjeta o Descuento directo por pago en efectivo/transferencia
        - Retención de sede: 5% Mapasingue, 25% Ceibos, 10% Alborada, 0% Hospital
        - Ingreso Neto del médico
        """
        sede = sede_codigo.upper()
        metodo = metodo_pago.upper()

        tarifa_base = tarifa_base_personalizada or TARIFAS_BASE_SEDES.get(sede, Decimal("20.00"))
        pct_comision = COMISIONES_SEDES.get(sede, Decimal("0.0500"))
        es_hospital = (sede == "HOSPITAL") or (pct_comision == Decimal("0.0000"))

        # 1. Precio oficial de lista (+9.75% sobre costo real)
        precio_lista = (tarifa_base * (Decimal("1.0") + TASA_RECARGO_TARJETA)).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )

        monto_recargo = Decimal("0.00")
        monto_descuento_directo = Decimal("0.00")
        total_cobrado = Decimal("0.00")
        pct_recargo = Decimal("0.0000")

        if metodo == "TARJETA":
            # Tarjeta paga el 100% del precio de lista (absorbe el costo de procesamiento)
            pct_recargo = TASA_RECARGO_TARJETA
            monto_recargo = (tarifa_base * TASA_RECARGO_TARJETA).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )
            total_cobrado = (tarifa_base + monto_recargo).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )
        else:
            # Efectivo o Transferencia: Descuento directo regresando al costo real
            monto_descuento_directo = (precio_lista - tarifa_base).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )
            total_cobrado = tarifa_base.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        # 2. Retención/Comisión de la sede (se aplica EXCLUSIVAMENTE sobre la tarifa base)
        if es_hospital:
            monto_comision_sede = Decimal("0.00")
            ingreso_neto_medico = Decimal("0.00")  # Sueldo fijo de $1,200.00/mes
        else:
            monto_comision_sede = (tarifa_base * pct_comision).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )
            ingreso_neto_medico = (tarifa_base - monto_comision_sede).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )

        # 3. Asiento contable preliminar (Partida Doble)
        asientos_contables = []
        if total_cobrado > Decimal("0.00"):
            cuenta_debe = "1.1.01.01 Caja General" if metodo == "EFECTIVO" else "1.1.01.02 Bancos / Pasarela Datafast"
            asientos_contables.append({
                "cuenta": cuenta_debe,
                "debe": float(total_cobrado),
                "haber": 0.00,
                "glosa": f"Recaudación por consulta en {sede} ({metodo})"
            })
            if monto_recargo > Decimal("0.00"):
                asientos_contables.append({
                    "cuenta": "2.1.03.01 Pasivos por Recargo Bancario Datafast",
                    "debe": 0.00,
                    "haber": float(monto_recargo),
                    "glosa": "Retención tarifa servicio pasarela digital 9.75%"
                })
            asientos_contables.append({
                "cuenta": "4.1.01.01 Ingresos por Servicios Médicos (Bruto)",
                "debe": 0.00,
                "haber": float(tarifa_base),
                "glosa": "Honorario base devengado de consulta"
            })
            if monto_comision_sede > Decimal("0.00"):
                asientos_contables.append({
                    "cuenta": "5.2.01.01 Gasto por Comisión de Infraestructura de Sede",
                    "debe": float(monto_comision_sede),
                    "haber": 0.00,
                    "glosa": f"Retención por uso de instalaciones sede ({pct_comision * 100}%)"
                })
                asientos_contables.append({
                    "cuenta": "2.1.02.01 Cuentas por Pagar a Clínica Sede",
                    "debe": 0.00,
                    "haber": float(monto_comision_sede),
                    "glosa": f"Provisión de comisión clínica ({sede})"
                })

        return {
            "sede": sede,
            "metodo_pago": metodo,
            "monto_base": float(tarifa_base),
            "precio_lista_oficial": float(precio_lista),
            "porcentaje_recargo": float(pct_recargo),
            "monto_recargo": float(monto_recargo),
            "monto_descuento_directo": float(monto_descuento_directo),
            "total_cobrado_paciente": float(total_cobrado),
            "porcentaje_comision_sede": float(pct_comision),
            "monto_comision_sede": float(monto_comision_sede),
            "ingreso_neto_medico": float(ingreso_neto_medico),
            "es_hospital_sueldo_fijo": es_hospital,
            "asiento_contable_preliminar": asientos_contables
        }
