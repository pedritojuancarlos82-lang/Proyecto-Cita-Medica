"""
portal_pacientes.py
Núcleo de Servicios del Portal Público de Pacientes - Semana 3 (01 Oct - 07 Oct, 2026)
Plataforma SaaS: Gestión Médica Multisede (Montepiedra Salud)

Implementa:
1. Mecanismo de Hold Temporal (Anti Phantom-Booking) con TTL de 10 minutos.
2. Conciliación e Idempotencia de Expedientes Clínicos (Anti Duplicados / Data Siloing).
3. Generación y Validación de Tickets QR Firmados Criptográficamente (HMAC-SHA256).
4. Controlador de Escaneo de Recepción (Transición de Estado a EN_SALA).
5. Worker / Cron Job Idempotente para Notificaciones y Recordatorios 24h.
"""

import hmac
import hashlib
import uuid
import json
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional, List
from decimal import Decimal

from backend.motor_calendario import MotorCalendarioInteligente, ServicioLiquidacionFinanciera
from backend.email_service import ServicioEmailTransaccional

SECRET_KEY_QR = "montepiedra-salud-secret-key-2026-msp-ec"

class RepositorioMemoriaSaaS:
    """
    Repositorio de datos en memoria para ejecución, pruebas unitarias y sincronización.
    """
    sedes = {
        "ceibos": {
            "id": "ceibos",
            "nombre": "Clínica Ceibos",
            "consultorio": "Consultorio 2",
            "direccion": "Av. del Bombero, Edif. Ceibos Plaza, Piso 3",
            "tarifa_base": Decimal("20.00"),
            "comision": Decimal("0.2500")
        },
        "mapasingue": {
            "id": "mapasingue",
            "nombre": "Consultorio Mapasingue",
            "consultorio": "Consultorio 1A",
            "direccion": "Av. Primera y Calle 3ra, Mapasingue Oeste",
            "tarifa_base": Decimal("20.00"),
            "comision": Decimal("0.0500")
        },
        "alborada": {
            "id": "alborada",
            "nombre": "Consultorio Alborada",
            "consultorio": "Consultorio 4",
            "direccion": "Av. Rodolfo Baquerizo Nazur, Alborada Etapa 8",
            "tarifa_base": Decimal("10.00"),
            "comision": Decimal("0.1000")
        },
        "hospital": {
            "id": "hospital",
            "nombre": "Hospital Público de Ceibos",
            "consultorio": "Área de Triaje y Guardia",
            "direccion": "Vía a la Costa km 6.5, Hospital General",
            "tarifa_base": Decimal("0.00"),
            "comision": Decimal("0.0000")
        }
    }

    holds_temporales: Dict[str, Dict[str, Any]] = {}
    citas: Dict[str, Dict[str, Any]] = {}
    expedientes_pacientes: Dict[str, Dict[str, Any]] = {}

    @classmethod
    def reset(cls):
        cls.holds_temporales.clear()
        cls.citas.clear()
        cls.expedientes_pacientes.clear()


class GeneradorTokenQRSeguro:
    """
    Genera y verifica tokens firmados con HMAC-SHA256 para prevenir
    la falsificación o enumeración de tickets de citas médicas.
    """
    @staticmethod
    def generar_token(cita_id: str, codigo: str, fecha: str, hora: str, sede_id: str) -> str:
        payload = f"{cita_id}|{codigo}|{fecha}|{hora}|{sede_id}"
        firma = hmac.new(
            SECRET_KEY_QR.encode('utf-8'),
            payload.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()[:16]
        return f"{payload}|{firma}"

    @staticmethod
    def verificar_token(token: str) -> Dict[str, Any]:
        partes = token.split('|')
        if len(partes) != 6:
            return {"valido": False, "error": "Formato de token inválido"}

        cita_id, codigo, fecha, hora, sede_id, firma_recibida = partes
        payload = f"{cita_id}|{codigo}|{fecha}|{hora}|{sede_id}"
        firma_esperada = hmac.new(
            SECRET_KEY_QR.encode('utf-8'),
            payload.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()[:16]

        if not hmac.compare_digest(firma_esperada, firma_recibida):
            return {"valido": False, "error": "Firma criptográfica inválida. Ticket falsificado."}

        return {
            "valido": True,
            "cita_id": cita_id,
            "codigo": codigo,
            "fecha": fecha,
            "hora": hora,
            "sede_id": sede_id
        }


class PortalPacientesService:
    """
    Controlador y Casos de Uso del Portal Público de Pacientes (Semana 3).
    """

    def __init__(self, motor_calendario: Optional[MotorCalendarioInteligente] = None):
        self.motor = motor_calendario or MotorCalendarioInteligente()

    # -------------------------------------------------------------------------
    # 1. HOLD TEMPORAL (Anti Phantom-Booking)
    # -------------------------------------------------------------------------
    def crear_hold_temporal(
        self,
        medico_id: str,
        sede_id: str,
        sala_id: str,
        fecha: str,
        hora: str,
        duracion_minutos: int = 45,
        ttl_minutos: int = 10
    ) -> Dict[str, Any]:
        """
        Bloquea temporalmente un slot por 10 minutos mientras el paciente
        completa sus datos y método de pago en el checkout.
        """
        self.liberar_holds_expirados()

        inicio_dt = datetime.fromisoformat(f"{fecha}T{hora}:00")
        fin_dt = inicio_dt + timedelta(minutes=duracion_minutos)

        # Verificar si hay una cita confirmada en ese slot
        for c in RepositorioMemoriaSaaS.citas.values():
            if c.get("estado") in ("CONFIRMADA", "RECORDATORIO_ENVIADO", "EN_SALA"):
                if c["sede_id"] == sede_id and c["date"] == fecha:
                    c_ini = datetime.fromisoformat(f"{c['date']}T{c['time']}:00")
                    c_fin = c_ini + timedelta(minutes=c.get("durationMinutes", 45))
                    if max(inicio_dt, c_ini) < min(fin_dt, c_fin):
                        return {
                            "exito": False,
                            "error": "El horario ya se encuentra reservado y confirmado."
                        }

        # Verificar si hay otro hold temporal activo sobre la misma sala u horario
        for h in RepositorioMemoriaSaaS.holds_temporales.values():
            if h["sede_id"] == sede_id and h["fecha"] == fecha and h["hora"] == hora:
                if datetime.now(timezone.utc) < h["expira_at"]:
                    return {
                        "exito": False,
                        "error": "Este turno está temporalmente bloqueado por otro paciente en proceso de reserva."
                    }

        hold_id = f"HOLD-{uuid.uuid4().hex[:8].upper()}"
        expira_at = datetime.now(timezone.utc) + timedelta(minutes=ttl_minutos)

        hold_obj = {
            "id": hold_id,
            "medico_id": medico_id,
            "sede_id": sede_id,
            "sala_id": sala_id,
            "fecha": fecha,
            "hora": hora,
            "duracion_minutos": duracion_minutos,
            "creado_at": datetime.now(timezone.utc),
            "expira_at": expira_at,
            "estado": "ACTIVO"
        }
        RepositorioMemoriaSaaS.holds_temporales[hold_id] = hold_obj

        return {
            "exito": True,
            "hold_id": hold_id,
            "expira_at": expira_at.isoformat(),
            "ttl_segundos": ttl_minutos * 60
        }

    def liberar_holds_expirados(self) -> int:
        """
        Recolector de basura (Garbage Collection): libera slots abandonados.
        """
        ahora = datetime.now(timezone.utc)
        expirados = [
            k for k, v in RepositorioMemoriaSaaS.holds_temporales.items()
            if ahora >= v["expira_at"]
        ]
        for k in expirados:
            del RepositorioMemoriaSaaS.holds_temporales[k]
        return len(expirados)

    # -------------------------------------------------------------------------
    # 2. CONCILIACIÓN DE EXPEDIENTES (Anti-Duplicidad / Data Siloing)
    # -------------------------------------------------------------------------
    def conciliar_expediente(self, datos_paciente: Dict[str, Any]) -> Dict[str, Any]:
        """
        Garantiza que un paciente recurrente no genere expedientes huérfanos.
        Idempotencia basada en cédula (Módulo 10) y normalización de correo y teléfono.
        """
        cedula = datos_paciente.get("identificacion", "").strip()
        email_norm = datos_paciente.get("email", "").strip().lower()
        telefono = datos_paciente.get("telefono", "").strip()
        nombre = datos_paciente.get("nombre", "").strip()

        # Buscar por cédula como identificador unívoco principal
        expediente = RepositorioMemoriaSaaS.expedientes_pacientes.get(cedula)

        if not expediente:
            # Buscar por email o teléfono si no se localizó por cédula
            for exp in RepositorioMemoriaSaaS.expedientes_pacientes.values():
                if exp["email"] == email_norm or exp["telefono"] == telefono:
                    expediente = exp
                    break

        if expediente:
            # Actualizar datos de contacto y consolidar historial
            expediente["nombre"] = nombre or expediente["nombre"]
            expediente["telefono"] = telefono or expediente["telefono"]
            expediente["email"] = email_norm or expediente["email"]
            if "alergias" in datos_paciente and datos_paciente["alergias"]:
                expediente["alergias"] = datos_paciente["alergias"]
            expediente["actualizado_at"] = datetime.now(timezone.utc).isoformat()
        else:
            expediente_id = f"EXP-{uuid.uuid4().hex[:6].upper()}"
            expediente = {
                "id": expediente_id,
                "identificacion": cedula,
                "nombre": nombre,
                "email": email_norm,
                "telefono": telefono,
                "alergias": datos_paciente.get("alergias", "Ninguna declarada"),
                "historial_citas": [],
                "creado_at": datetime.now(timezone.utc).isoformat()
            }
            RepositorioMemoriaSaaS.expedientes_pacientes[cedula] = expediente

        return expediente

    # -------------------------------------------------------------------------
    # 3. CONFIRMACIÓN DEFINITIVA Y EMISIÓN DE TICKET QR
    # -------------------------------------------------------------------------
    def confirmar_cita(
        self,
        hold_id: Optional[str],
        medico_id: str,
        sede_id: str,
        fecha: str,
        hora: str,
        paciente_datos: Dict[str, Any],
        metodo_pago: str = "EFECTIVO",
        duracion_minutos: int = 45
    ) -> Dict[str, Any]:
        """
        Valida el hold, concilia expediente, aplica cálculo financiero (Semana 2),
        genera token criptográfico firmado para el QR y despacha el correo transaccional.
        """
        self.liberar_holds_expirados()

        if hold_id:
            hold = RepositorioMemoriaSaaS.holds_temporales.get(hold_id)
            if not hold:
                return {
                    "exito": False,
                    "error": "El bloqueo temporal de este turno ha expirado por inactividad. Por favor selecciona nuevamente el horario."
                }
            # Consumir el hold
            del RepositorioMemoriaSaaS.holds_temporales[hold_id]

        # Conciliar o consolidar expediente del paciente
        expediente = self.conciliar_expediente(paciente_datos)

        # Liquidación Financiera
        liq = ServicioLiquidacionFinanciera.liquidar_honorarios_consulta(
            sede_codigo=sede_id.upper(),
            metodo_pago=metodo_pago
        )

        cita_id = f"APT-{uuid.uuid4().hex[:8].upper()}"
        codigo_cita = f"MED-{uuid.uuid4().hex[:5].upper()}"

        # Generar Token Criptográfico Firmado (HMAC-SHA256)
        token_seguro = GeneradorTokenQRSeguro.generar_token(
            cita_id=cita_id,
            codigo=codigo_cita,
            fecha=fecha,
            hora=hora,
            sede_id=sede_id
        )

        sede_info = RepositorioMemoriaSaaS.sedes.get(sede_id, {})

        cita_obj = {
            "id": cita_id,
            "codigo_cita": codigo_cita,
            "medico_id": medico_id,
            "medico_nombre": "Dr. Carlos Campoverde",
            "sede_id": sede_id,
            "sede_nombre": sede_info.get("nombre", sede_id),
            "sede_consultorio": sede_info.get("consultorio", "Consultorio Principal"),
            "sede_direccion": sede_info.get("direccion", "Guayaquil"),
            "date": fecha,
            "time": hora,
            "durationMinutes": duracion_minutos,
            "paciente_identificacion": expediente["identificacion"],
            "paciente_nombre": expediente["nombre"],
            "paciente_email": expediente["email"],
            "paciente_telefono": expediente["telefono"],
            "metodo_pago": metodo_pago.upper(),
            "monto_base": liq["monto_base"],
            "precio_lista_oficial": liq["precio_lista_oficial"],
            "monto_recargo": liq["monto_recargo"],
            "monto_descuento_directo": liq["monto_descuento_directo"],
            "total_cobrado": liq["total_cobrado_paciente"],
            "monto_comision_sede": liq["monto_comision_sede"],
            "ingreso_neto_medico": liq["ingreso_neto_medico"],
            "token_seguro": token_seguro,
            "qr_url": f"https://montepiedrasalud.ec/verificar?t={token_seguro}",
            "estado": "CONFIRMADA",
            "recordatorio_24h_enviado_at": None,
            "created_at": datetime.now(timezone.utc).isoformat()
        }

        # Guardar en repositorio
        RepositorioMemoriaSaaS.citas[cita_id] = cita_obj
        expediente["historial_citas"].append(codigo_cita)

        # Despachar Correo Transaccional de Confirmación Inmediata
        if expediente["email"]:
            ServicioEmailTransaccional.enviar_confirmacion_reserva(cita_obj)

        return {
            "exito": True,
            "cita": cita_obj,
            "token_seguro": token_seguro
        }

    # -------------------------------------------------------------------------
    # 4. CONTROLADOR DE ESCANEO QR EN RECEPCIÓN (Admisión Rápida)
    # -------------------------------------------------------------------------
    def recepcion_escanear_qr(self, token_escaneado: str) -> Dict[str, Any]:
        """
        Escaneado por el recepcionista en la puerta de la clínica.
        Verifica autenticidad y pasa el estado de la cita a 'EN_SALA'.
        """
        verif = GeneradorTokenQRSeguro.verificar_token(token_escaneado)
        if not verif["valido"]:
            return {
                "exito": False,
                "error": f"Acceso Denegado: {verif['error']}"
            }

        cita_id = verif["cita_id"]
        cita = RepositorioMemoriaSaaS.citas.get(cita_id)
        if not cita:
            return {
                "exito": False,
                "error": "Cita no encontrada en el sistema."
            }

        if cita["estado"] == "CANCELADA":
            return {
                "exito": False,
                "error": "Esta cita fue previamente CANCELADA por el paciente o dirección médica."
            }

        if cita["estado"] == "EN_SALA":
            return {
                "exito": True,
                "mensaje": "El paciente ya había sido registrado en sala previamente.",
                "cita": cita
            }

        # Transición de estado a 'EN_SALA'
        cita["estado"] = "EN_SALA"
        cita["admitido_en_sala_at"] = datetime.now(timezone.utc).isoformat()

        return {
            "exito": True,
            "mensaje": f"Pase de Admisión Válido: Paciente {cita['paciente_nombre']} registrado con éxito en sala.",
            "cita": cita
        }

    # -------------------------------------------------------------------------
    # 5. CRON / WORKER IDEMPOTENTE DE RECORDATORIOS 24 HORAS ANTES
    # -------------------------------------------------------------------------
    def ejecutar_worker_recordatorios_24h(self, fecha_referencia: Optional[datetime] = None) -> Dict[str, Any]:
        """
        Worker idempotente para despachar recordatorios a citas que ocurrirán
        en la ventana de 23 a 25 horas posteriores.
        Evita duplicados mediante el flag 'recordatorio_24h_enviado_at'.
        """
        ahora = fecha_referencia or datetime.now(timezone.utc)
        ventana_inicio = ahora + timedelta(hours=23)
        ventana_fin = ahora + timedelta(hours=25)

        procesadas = 0
        enviadas = 0

        for cita in RepositorioMemoriaSaaS.citas.values():
            if cita["estado"] not in ("CONFIRMADA",):
                continue

            if cita.get("recordatorio_24h_enviado_at") is not None:
                continue

            # Parsear fecha y hora de la cita
            cita_dt = datetime.fromisoformat(f"{cita['date']}T{cita['time']}:00")

            if ventana_inicio <= cita_dt <= ventana_fin:
                procesadas += 1
                if cita.get("paciente_email"):
                    res = ServicioEmailTransaccional.enviar_recordatorio_24h(cita)
                    if res.get("exito"):
                        cita["recordatorio_24h_enviado_at"] = datetime.now(timezone.utc).isoformat()
                        cita["estado"] = "RECORDATORIO_ENVIADO"
                        enviadas += 1

        return {
            "ventana_inicio": ventana_inicio.isoformat(),
            "ventana_fin": ventana_fin.isoformat(),
            "citas_evaluadas_en_ventana": procesadas,
            "recordatorios_despachados": enviadas
        }
