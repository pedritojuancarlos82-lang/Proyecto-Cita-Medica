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
from typing import Dict, Any, Optional, List, Tuple, Union
from dataclasses import dataclass, asdict
import threading
import zoneinfo

# Zona Horaria Oficial para Operaciones Clínicas
ECUADOR_TZ = zoneinfo.ZoneInfo("America/Guayaquil")

# Franjas de Hora Pico en Guayaquil (Tráfico denso)
FRANJAS_HORA_PICO = [
    (time(7, 0), time(9, 30)),    # Hora pico matutina
    (time(12, 30), time(14, 0)),  # Salida escolar y almuerzo
    (time(17, 0), time(19, 45)),  # Hora pico vespertina
]

# Matriz Detallada de Tiempos y Distancias Interurbanas (Guayaquil)
MATRIZ_TRASLADO_DETALLADA = {
    ("CEIBOS", "ALBORADA"): {
        "distancia_km": 16.5,
        "tiempo_valle": 35,
        "margen_pico": 25,
        "buffer_valle": 45,
        "buffer_pico": 60,
        "ruta_principal": "Av. del Bombero -> Av. Carlos Julio Arosemena -> Av. Juan Tanca Marengo"
    },
    ("ALBORADA", "CEIBOS"): {
        "distancia_km": 16.5,
        "tiempo_valle": 35,
        "margen_pico": 25,
        "buffer_valle": 45,
        "buffer_pico": 60,
        "ruta_principal": "Av. Benjamín Carrión -> Av. Juan Tanca Marengo -> Vía a la Costa"
    },
    ("MAPASINGUE", "CEIBOS"): {
        "distancia_km": 7.2,
        "tiempo_valle": 20,
        "margen_pico": 15,
        "buffer_valle": 25,
        "buffer_pico": 35,
        "ruta_principal": "Av. Las Aguas -> Av. Carlos Julio Arosemena -> Av. del Bombero"
    },
    ("CEIBOS", "MAPASINGUE"): {
        "distancia_km": 7.2,
        "tiempo_valle": 20,
        "margen_pico": 15,
        "buffer_valle": 25,
        "buffer_pico": 35,
        "ruta_principal": "Av. del Bombero -> Retorno Carlos Julio Arosemena -> Mapasingue"
    },
    ("MAPASINGUE", "ALBORADA"): {
        "distancia_km": 11.8,
        "tiempo_valle": 30,
        "margen_pico": 20,
        "buffer_valle": 35,
        "buffer_pico": 50,
        "ruta_principal": "Av. Juan Tanca Marengo -> Av. Benjamín Carrión -> Alborada"
    },
    ("ALBORADA", "MAPASINGUE"): {
        "distancia_km": 11.8,
        "tiempo_valle": 30,
        "margen_pico": 20,
        "buffer_valle": 35,
        "buffer_pico": 50,
        "ruta_principal": "Av. Benjamín Carrión -> Av. Juan Tanca Marengo -> Mapasingue"
    },
    ("CEIBOS", "HOSPITAL"): {
        "distancia_km": 4.5,
        "tiempo_valle": 10,
        "margen_pico": 10,
        "buffer_valle": 15,
        "buffer_pico": 20,
        "ruta_principal": "Av. del Bombero -> Enlace Vía a la Costa km 6.5"
    },
    ("HOSPITAL", "CEIBOS"): {
        "distancia_km": 4.5,
        "tiempo_valle": 10,
        "margen_pico": 10,
        "buffer_valle": 15,
        "buffer_pico": 20,
        "ruta_principal": "Vía a la Costa km 6.5 -> Retorno Av. del Bombero"
    },
    ("MAPASINGUE", "HOSPITAL"): {
        "distancia_km": 12.0,
        "tiempo_valle": 25,
        "margen_pico": 15,
        "buffer_valle": 30,
        "buffer_pico": 40,
        "ruta_principal": "Av. Carlos Julio Arosemena -> Vía a la Costa km 6.5"
    },
    ("HOSPITAL", "MAPASINGUE"): {
        "distancia_km": 12.0,
        "tiempo_valle": 25,
        "margen_pico": 15,
        "buffer_valle": 30,
        "buffer_pico": 40,
        "ruta_principal": "Vía a la Costa km 6.5 -> Av. Carlos Julio Arosemena"
    },
    ("ALBORADA", "HOSPITAL"): {
        "distancia_km": 21.0,
        "tiempo_valle": 40,
        "margen_pico": 25,
        "buffer_valle": 50,
        "buffer_pico": 65,
        "ruta_principal": "Av. Fco de Orellana -> Vía Perimetral -> Vía a la Costa km 6.5"
    },
    ("HOSPITAL", "ALBORADA"): {
        "distancia_km": 21.0,
        "tiempo_valle": 40,
        "margen_pico": 25,
        "buffer_valle": 50,
        "buffer_pico": 65,
        "ruta_principal": "Vía a la Costa km 6.5 -> Vía Perimetral -> Av. Fco de Orellana"
    }
}

# Matriz de tiempos de amortiguamiento por defecto (reserva de máxima seguridad)
MATRIZ_BUFFERS_DEFAULT = {
    (k[0], k[1]): v["buffer_pico"] for k, v in MATRIZ_TRASLADO_DETALLADA.items()
}

# Parámetros Operativos de Slot Clínico vs Slot Administrativo
DURACION_NOMINAL_CONSULTA_DEFAULT = 30  # minutos de interacción directa con el paciente
MARGEN_ADMINISTRATIVO_RECETA_DEFAULT = 15  # minutos de registro en historia clínica, receta y despedida
SLOT_REAL_RESERVA_DEFAULT = DURACION_NOMINAL_CONSULTA_DEFAULT + MARGEN_ADMINISTRATIVO_RECETA_DEFAULT  # 45 min

# Tiempo de Desalojo y Sanitización de Sala Física Compartida
TIEMPO_DESALOJO_SANITIZACION_DEFAULT = 10  # minutos para asepsia y cambio de sábanas/insumos

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
    Motor Algorítmico de Disponibilidad, Concurrencia y Prevención de Conflictos Espacio-Temporales.
    Cumple con el Hito 1 de la Semana 2: Bloqueo estricto de espacios compartidos y tiempo de traslado verificado.
    """

    def __init__(self, db_conn=None):
        self.db = db_conn
        self._reserva_lock = threading.Lock()

    @staticmethod
    def es_hora_pico(hora: time) -> bool:
        """Determina si una hora dada coincide con una franja de tráfico denso en Guayaquil."""
        for inicio, fin in FRANJAS_HORA_PICO:
            if inicio <= hora <= fin:
                return True
        return False

    @classmethod
    def calcular_buffer_traslado(
        cls,
        sede_origen: str,
        sede_destino: str,
        hora_local: Optional[time] = None,
        ajustar_dinamico: bool = False
    ) -> int:
        """
        Calcula el buffer requerido entre dos sedes.
        Si ajustar_dinamico=True y se provee hora_local, discrimina entre hora pico y hora valle.
        Por defecto retorna el buffer de hora pico (máxima seguridad médica).
        """
        par = (sede_origen.upper(), sede_destino.upper())
        detalle = MATRIZ_TRASLADO_DETALLADA.get(par)
        if not detalle:
            return MATRIZ_BUFFERS_DEFAULT.get(par, 30)

        if ajustar_dinamico and hora_local is not None:
            if cls.es_hora_pico(hora_local):
                return detalle["buffer_pico"]
            return detalle["buffer_valle"]

        return detalle["buffer_pico"]

    @classmethod
    def calcular_matriz_traslado(
        cls,
        sede_origen_id: str,
        sede_destino_id: str,
        fecha_hora: Optional[Union[datetime, time]] = None
    ) -> int:
        """
        Retorna la ventana de amortiguamiento en minutos según la matriz aprobada en Semana 1,
        distinguiendo horas pico vs horas valle.
        """
        hora_local = None
        if isinstance(fecha_hora, datetime):
            hora_local = fecha_hora.astimezone(ECUADOR_TZ).time() if fecha_hora.tzinfo else fecha_hora.time()
        elif isinstance(fecha_hora, time):
            hora_local = fecha_hora

        return cls.calcular_buffer_traslado(
            sede_origen=sede_origen_id,
            sede_destino=sede_destino_id,
            hora_local=hora_local,
            ajustar_dinamico=True if hora_local else False
        )

    # Alias camelCase requerido para interoperabilidad
    calcularMatrizTraslado = calcular_matriz_traslado

    def verificar_conflicto_sala_fisica(
        self,
        sala_id: str,
        inicio: datetime,
        fin: datetime,
        citas_existentes: Optional[List[Dict[str, Any]]] = None,
        tiempo_sanitizacion_minutos: int = 0,
        tx=None
    ) -> Dict[str, Any]:
        """
        Verifica que ningún otro profesional o paciente tenga reservada la sala en el rango semiabierto [inicio, fin).
        Resuelve micro-bloqueos en bordes (fin_cita == inicio no es conflicto).
        """
        inicio_utc = inicio if inicio.tzinfo else inicio.replace(tzinfo=zoneinfo.ZoneInfo("UTC"))
        fin_utc = fin if fin.tzinfo else fin.replace(tzinfo=zoneinfo.ZoneInfo("UTC"))

        lista_citas = citas_existentes if citas_existentes is not None else []
        for c in lista_citas:
            if c.get("estado") in ("CANCELADA", "REAGENDADA"):
                continue

            if c.get("sala_id") != sala_id:
                continue

            c_inicio = c["inicio"] if c["inicio"].tzinfo else c["inicio"].replace(tzinfo=zoneinfo.ZoneInfo("UTC"))
            c_fin = c["fin"] if c["fin"].tzinfo else c["fin"].replace(tzinfo=zoneinfo.ZoneInfo("UTC"))

            # Intervalo semiabierto [inicio, fin): colisión sii max(ini1, ini2) < min(fin1, fin2)
            if max(inicio_utc, c_inicio) < min(fin_utc, c_fin):
                msg = f"La sala de atención física {sala_id} se encuentra ocupada por otra atención entre {c_inicio.isoformat()} y {c_fin.isoformat()}."
                return {
                    "permitido": False,
                    "valido": False,
                    "codigo_error": "SALA_OCUPADA",
                    "mensaje": msg,
                    "razon_rechazo": msg,
                    "buffer_minutos_aplicado": 0,
                    "tiempo_buffer_requerido": 0
                }

            # Ventana de sanitización y desalojo post/pre consulta
            if tiempo_sanitizacion_minutos > 0:
                delta_sanit = timedelta(minutes=tiempo_sanitizacion_minutos)
                if c_fin <= inicio_utc < (c_fin + delta_sanit):
                    msg = f"La sala {sala_id} requiere {tiempo_sanitizacion_minutos} min de sanitización tras cita previa."
                    return {
                        "permitido": False,
                        "valido": False,
                        "codigo_error": "SALA_SANITIZACION_PENDIENTE",
                        "mensaje": msg,
                        "razon_rechazo": msg,
                        "buffer_minutos_aplicado": tiempo_sanitizacion_minutos,
                        "tiempo_buffer_requerido": tiempo_sanitizacion_minutos
                    }
                if fin_utc <= c_inicio < (fin_utc + delta_sanit):
                    msg = f"La sala {sala_id} requiere {tiempo_sanitizacion_minutos} min de sanitización previa a cita siguiente."
                    return {
                        "permitido": False,
                        "valido": False,
                        "codigo_error": "SALA_SANITIZACION_PENDIENTE",
                        "mensaje": msg,
                        "razon_rechazo": msg,
                        "buffer_minutos_aplicado": tiempo_sanitizacion_minutos,
                        "tiempo_buffer_requerido": tiempo_sanitizacion_minutos
                    }

        return {
            "permitido": True,
            "valido": True,
            "codigo_error": None,
            "mensaje": None,
            "razon_rechazo": None,
            "buffer_minutos_aplicado": 0,
            "tiempo_buffer_requerido": 0
        }

    # Alias camelCase
    verificarConflictoSalaFisica = verificar_conflicto_sala_fisica

    @staticmethod
    def calcular_slot_reserva(
        duracion_nominal: int = DURACION_NOMINAL_CONSULTA_DEFAULT,
        margen_admin: int = MARGEN_ADMINISTRATIVO_RECETA_DEFAULT
    ) -> Dict[str, int]:
        """Calcula el desglose del slot nominal vs slot real de reserva en base de datos."""
        return {
            "duracion_nominal_atencion": duracion_nominal,
            "margen_administrativo_receta": margen_admin,
            "slot_real_bloqueado": duracion_nominal + margen_admin
        }

    def validar_disponibilidad(
        self,
        medico_id: str,
        sede_solicitada_id: str,
        sala_solicitada_id: str,
        fecha_hora_propuesta_inicio: datetime,
        duracion_minutos: int,
        citas_existentes: Optional[List[Dict[str, Any]]] = None,
        horarios_rotacion: Optional[List[Dict[str, Any]]] = None,
        matriz_distancias: Optional[Dict[tuple, int]] = None,
        tiempo_sanitizacion_minutos: int = 0,
        ajustar_dinamico_trafico: bool = False
    ) -> Dict[str, Any]:
        """
        Ejecuta el pipeline de validaciones lógicas en 4 pasos estrictos:
        1. Validar horario de rotación del médico en la sede solicitada.
        2. Validar disponibilidad de la sala física compartida (incluyendo sanitización).
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
                    and h.get("sede_id").upper() == sede_solicitada_id.upper()
                    and h.get("dia_semana").upper() == dia_semana_nombre
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
                msg = (
                    f"El médico no tiene turno rotativo activo en la sede {sede_solicitada_id} "
                    f"los días {dia_semana_nombre} en la franja {hora_inicio_local} - {hora_fin_local}."
                )
                return {
                    "permitido": False,
                    "valido": False,
                    "razon_rechazo": msg,
                    "mensaje": msg,
                    "tiempo_buffer_requerido": None,
                    "buffer_minutos_aplicado": 0,
                    "codigo_error": "FUERA_DE_ROTACION"
                }

        # ====================================================================
        # PASO 2: Validar que la sala física compartida esté libre (Doble Validación)
        # ====================================================================
        lista_citas = citas_existentes if citas_existentes is not None else []
        conflicto_sala = self.verificar_conflicto_sala_fisica(
            sala_id=sala_solicitada_id,
            inicio=inicio_utc,
            fin=fin_utc,
            citas_existentes=lista_citas,
            tiempo_sanitizacion_minutos=tiempo_sanitizacion_minutos
        )

        if not conflicto_sala["permitido"]:
            return conflicto_sala

        # 2.B: Validar que el mismo médico no tenga otra cita solapada (en cualquier sede)
        for c in lista_citas:
            if c.get("estado") in ("CANCELADA", "REAGENDADA"):
                continue
            if c.get("medico_id") == medico_id:
                c_inicio = c["inicio"] if c["inicio"].tzinfo else c["inicio"].replace(tzinfo=zoneinfo.ZoneInfo("UTC"))
                c_fin = c["fin"] if c["fin"].tzinfo else c["fin"].replace(tzinfo=zoneinfo.ZoneInfo("UTC"))
                if max(inicio_utc, c_inicio) < min(fin_utc, c_fin):
                    msg = f"El médico ya tiene otra atención programada entre {c_inicio.isoformat()} y {c_fin.isoformat()}."
                    return {
                        "permitido": False,
                        "valido": False,
                        "razon_rechazo": msg,
                        "mensaje": msg,
                        "tiempo_buffer_requerido": None,
                        "buffer_minutos_aplicado": 0,
                        "codigo_error": "MEDICO_OCUPADO"
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
            sede_origen = ultima_previa.get("sede_id", "").upper()
            sede_solicitada_upper = sede_solicitada_id.upper()

            if sede_origen != sede_solicitada_upper:
                if matriz_distancias is not None:
                    buffer_minutos = matriz_distancias.get((sede_origen, sede_solicitada_upper), 30)
                else:
                    buffer_minutos = self.calcular_buffer_traslado(
                        sede_origen, sede_solicitada_upper, hora_inicio_local, ajustar_dinamico=ajustar_dinamico_trafico
                    )

                tiempo_disp = (inicio_utc - (ultima_previa["fin"].replace(tzinfo=zoneinfo.ZoneInfo("UTC")) if ultima_previa["fin"].tzinfo is None else ultima_previa["fin"])).total_seconds() / 60

                if tiempo_disp < buffer_minutos:
                    msg = (
                        f"Tiempo de traslado insuficiente desde sede {sede_origen}. "
                        f"Se requieren {buffer_minutos} min de amortiguamiento vial (disponibles: {int(tiempo_disp)} min)."
                    )
                    return {
                        "permitido": False,
                        "valido": False,
                        "razon_rechazo": msg,
                        "mensaje": msg,
                        "tiempo_buffer_requerido": buffer_minutos,
                        "buffer_minutos_aplicado": buffer_minutos,
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
            sede_destino = primera_posterior.get("sede_id", "").upper()
            sede_solicitada_upper = sede_solicitada_id.upper()

            if sede_destino != sede_solicitada_upper:
                if matriz_distancias is not None:
                    buffer_minutos = matriz_distancias.get((sede_solicitada_upper, sede_destino), 30)
                else:
                    buffer_minutos = self.calcular_buffer_traslado(
                        sede_solicitada_upper, sede_destino, hora_fin_local, ajustar_dinamico=ajustar_dinamico_trafico
                    )

                tiempo_disp = ((primera_posterior["inicio"].replace(tzinfo=zoneinfo.ZoneInfo("UTC")) if primera_posterior["inicio"].tzinfo is None else primera_posterior["inicio"]) - fin_utc).total_seconds() / 60

                if tiempo_disp < buffer_minutos:
                    msg = (
                        f"Tiempo de traslado insuficiente hacia la cita siguiente en sede {sede_destino}. "
                        f"Se requieren {buffer_minutos} min de traslado (disponibles: {int(tiempo_disp)} min)."
                    )
                    return {
                        "permitido": False,
                        "valido": False,
                        "razon_rechazo": msg,
                        "mensaje": msg,
                        "tiempo_buffer_requerido": buffer_minutos,
                        "buffer_minutos_aplicado": buffer_minutos,
                        "codigo_error": "TRASLADO_INSUFICIENTE_POST"
                    }

        # ====================================================================
        # PASO 4: Aprobación Integral
        # ====================================================================
        return {
            "permitido": True,
            "valido": True,
            "codigo_error": None,
            "razon_rechazo": None,
            "mensaje": None,
            "buffer_minutos_aplicado": 0,
            "tiempo_buffer_requerido": 0
        }

    def validar_disponibilidad_medico(
        self,
        medico_id: str,
        sede_id: str,
        sala_id: str,
        inicio: datetime,
        fin: datetime,
        citas_existentes: Optional[List[Dict[str, Any]]] = None,
        horarios_rotacion: Optional[List[Dict[str, Any]]] = None,
        tiempo_sanitizacion_minutos: int = 0
    ) -> Dict[str, Any]:
        """Pipeline de validación integral según especificación formal de la Semana 2."""
        duracion_minutos = int((fin - inicio).total_seconds() / 60)
        return self.validar_disponibilidad(
            medico_id=medico_id,
            sede_solicitada_id=sede_id,
            sala_solicitada_id=sala_id,
            fecha_hora_propuesta_inicio=inicio,
            duracion_minutos=duracion_minutos,
            citas_existentes=citas_existentes,
            horarios_rotacion=horarios_rotacion,
            tiempo_sanitizacion_minutos=tiempo_sanitizacion_minutos
        )

    # Alias camelCase
    validarDisponibilidadMedico = validar_disponibilidad_medico

    def generar_slots_disponibles(
        self,
        medico_id: str,
        sede_id: str,
        fecha: Union[str, datetime],
        duracion_minutos: int = 30,
        citas_existentes: Optional[List[Dict[str, Any]]] = None,
        horarios_rotacion: Optional[List[Dict[str, Any]]] = None,
        sala_id: Optional[str] = None,
        paso_minutos: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Generador de Slots Libres (Motor de Búsqueda de Semana 2):
        1. Recorre la jornada de rotación del médico en la fecha indicada.
        2. Aplica pasos de duración de consulta (30 o 45 minutos).
        3. Filtra y descarta slots que colisionen con citas confirmadas,
           que violen la sala física compartida o que incumplan los buffers viales.
        4. Retorna la lista limpia de intervalos disponibles para el portal público.
        """
        if isinstance(fecha, str):
            fecha_obj = datetime.strptime(fecha, "%Y-%m-%d").date()
        elif isinstance(fecha, datetime):
            fecha_obj = fecha.astimezone(ECUADOR_TZ).date() if fecha.tzinfo else fecha.date()
        else:
            fecha_obj = fecha

        dias_map = {0: "LUNES", 1: "MARTES", 2: "MIERCOLES", 3: "JUEVES", 4: "VIERNES", 5: "SABADO", 6: "DOMINGO"}
        dia_nombre = dias_map[fecha_obj.weekday()]

        rotaciones = horarios_rotacion or []
        turnos_dia = [
            r for r in rotaciones
            if r.get("medico_id") == medico_id
            and r.get("sede_id", "").upper() == sede_id.upper()
            and r.get("dia_semana", "").upper() == dia_nombre
        ]

        # Si no se pasó tabla de horarios de rotación, fallback a turno matutino estándar 08:00 - 13:00
        if not turnos_dia and not horarios_rotacion:
            turnos_dia = [{
                "hora_inicio": time(8, 0),
                "hora_fin": time(13, 0)
            }]

        sala_efectiva = sala_id or f"SALA-{sede_id.upper()}-1"
        paso = paso_minutos or duracion_minutos
        slots_disponibles = []

        for turno in turnos_dia:
            h_ini = turno["hora_inicio"]
            h_fin = turno["hora_fin"]
            if isinstance(h_ini, str):
                h_ini = time.fromisoformat(h_ini)
            if isinstance(h_fin, str):
                h_fin = time.fromisoformat(h_fin)

            cursor = datetime.combine(fecha_obj, h_ini, tzinfo=ECUADOR_TZ)
            limite = datetime.combine(fecha_obj, h_fin, tzinfo=ECUADOR_TZ)

            while cursor + timedelta(minutes=duracion_minutos) <= limite:
                slot_ini = cursor
                slot_fin = cursor + timedelta(minutes=duracion_minutos)

                val = self.validar_disponibilidad(
                    medico_id=medico_id,
                    sede_solicitada_id=sede_id,
                    sala_solicitada_id=sala_efectiva,
                    fecha_hora_propuesta_inicio=slot_ini,
                    duracion_minutos=duracion_minutos,
                    citas_existentes=citas_existentes,
                    horarios_rotacion=horarios_rotacion
                )

                if val["valido"]:
                    slots_disponibles.append({
                        "hora_inicio": slot_ini.strftime("%H:%M"),
                        "hora_fin": slot_fin.strftime("%H:%M"),
                        "inicio_iso": slot_ini.isoformat(),
                        "fin_iso": slot_fin.isoformat(),
                        "sede_id": sede_id.upper(),
                        "sala_id": sala_efectiva,
                        "duracion_minutos": duracion_minutos,
                        "dia_semana": dia_nombre
                    })

                cursor += timedelta(minutes=paso)

        return slots_disponibles

    # Alias camelCase
    generarSlotsDisponibles = generar_slots_disponibles

    def reservar_slot_atomico(
        self,
        medico_id: str,
        sede_id: str,
        sala_id: str,
        inicio: datetime,
        fin: datetime,
        paciente_data: Dict[str, Any],
        citas_existentes: List[Dict[str, Any]],
        horarios_rotacion: Optional[List[Dict[str, Any]]] = None,
        tiempo_sanitizacion_minutos: int = 0
    ) -> Dict[str, Any]:
        """
        Reserva atómica con exclusión mutua para impedir condiciones de carrera (Race Conditions).
        Garantiza que ante 2 peticiones en el mismo milisegundo, solo una resulte aprobada.
        """
        duracion_min = int((fin - inicio).total_seconds() / 60)

        with self._reserva_lock:
            # 1. Validación estricta bajo exclusión mutua
            validacion = self.validar_disponibilidad(
                medico_id=medico_id,
                sede_solicitada_id=sede_id,
                sala_solicitada_id=sala_id,
                fecha_hora_propuesta_inicio=inicio,
                duracion_minutos=duracion_min,
                citas_existentes=citas_existentes,
                horarios_rotacion=horarios_rotacion,
                tiempo_sanitizacion_minutos=tiempo_sanitizacion_minutos
            )

            if not validacion["valido"]:
                return {
                    "permitido": False,
                    "exito": False,
                    "codigo_error": validacion.get("codigo_error", "CONFLICTO_DISPONIBILIDAD"),
                    "mensaje": validacion.get("razon_rechazo", "El slot ya no se encuentra disponible."),
                    "cita": None
                }

            # 2. Creación atómica de la cita
            nueva_cita = {
                "id": paciente_data.get("id") or f"CITA-{len(citas_existentes) + 1}",
                "codigo": paciente_data.get("codigo") or f"#MED-{len(citas_existentes) + 1001}",
                "medico_id": medico_id,
                "sede_id": sede_id.upper(),
                "sala_id": sala_id,
                "paciente_id": paciente_data.get("paciente_id", "PAC-001"),
                "paciente_nombre": paciente_data.get("nombre", "Paciente Anónimo"),
                "paciente_telefono": paciente_data.get("telefono", "0999999999"),
                "inicio": inicio if inicio.tzinfo else inicio.replace(tzinfo=zoneinfo.ZoneInfo("UTC")),
                "fin": fin if fin.tzinfo else fin.replace(tzinfo=zoneinfo.ZoneInfo("UTC")),
                "duracion_minutos": duracion_min,
                "estado": "CONFIRMADA"
            }

            citas_existentes.append(nueva_cita)

            return {
                "permitido": True,
                "exito": True,
                "codigo_error": None,
                "mensaje": "Cita reservada y confirmada atómicamente con éxito.",
                "cita": nueva_cita
            }

    def activar_modo_guardia(
        self,
        medico_id: str,
        inicio_guardia: datetime,
        fin_guardia: datetime,
        citas_existentes: List[Dict[str, Any]],
        hospital_sede_id: str = "HOSPITAL",
        motivo: str = "Guardia de relevo hospitalaria imprevista MSP"
    ) -> Dict[str, Any]:
        """
        Protocolo Lógico de Activación de 'Modo Guardia':
        1. Congela la agenda privada en el intervalo de guardia hospitalaria y sus ventanas viales.
        2. Detecta todas las citas privadas incompatibles con la guardia.
        3. Marca las citas para reubicación prioritaria.
        4. Genera el payload de notificación transaccional urgente para pacientes.
        """
        ini_g = inicio_guardia if inicio_guardia.tzinfo else inicio_guardia.replace(tzinfo=zoneinfo.ZoneInfo("UTC"))
        fin_g = fin_guardia if fin_guardia.tzinfo else fin_guardia.replace(tzinfo=zoneinfo.ZoneInfo("UTC"))

        citas_afectadas = []
        citas_preservadas = []

        for c in citas_existentes:
            if c.get("medico_id") != medico_id or c.get("estado") in ("CANCELADA", "REAGENDADA"):
                continue

            c_ini = c["inicio"] if c["inicio"].tzinfo else c["inicio"].replace(tzinfo=zoneinfo.ZoneInfo("UTC"))
            c_fin = c["fin"] if c["fin"].tzinfo else c["fin"].replace(tzinfo=zoneinfo.ZoneInfo("UTC"))
            sede = c.get("sede_id", "").upper()

            if sede == hospital_sede_id.upper():
                continue

            buffer_ida = self.calcular_buffer_traslado(sede, hospital_sede_id)
            buffer_retorno = self.calcular_buffer_traslado(hospital_sede_id, sede)

            ventana_afectada_inicio = ini_g - timedelta(minutes=buffer_ida)
            ventana_afectada_fin = fin_g + timedelta(minutes=buffer_retorno)

            # Colisión con la ventana expandida de la guardia
            if max(c_ini, ventana_afectada_inicio) < min(c_fin, ventana_afectada_fin):
                c_afectada = dict(c)
                c_afectada["estado_anterior"] = c.get("estado", "CONFIRMADA")
                c_afectada["estado"] = "REAGENDAMIENTO_PENDIENTE_GUARDIA"
                c_afectada["prioridad_reubicacion"] = 1
                c_afectada["motivo_bloqueo"] = motivo
                citas_afectadas.append(c_afectada)
            else:
                citas_preservadas.append(c)

        notificaciones = []
        for c in citas_afectadas:
            paciente_nombre = c.get("paciente_nombre", "Estimado/a Paciente")
            hora_fmt = c["inicio"].astimezone(ECUADOR_TZ).strftime("%d/%m/%Y %H:%M")
            notificaciones.append({
                "cita_id": c.get("id"),
                "paciente_id": c.get("paciente_id"),
                "paciente_nombre": paciente_nombre,
                "telefono": c.get("paciente_telefono", "N/A"),
                "email": c.get("paciente_email", "N/A"),
                "canal": "WHATSAPP_SMS_EMAIL",
                "mensaje": (
                    f"Estimado/a {paciente_nombre}, por requerimiento médico urgente en Hospital Público, "
                    f"su cita del Dr. Campoverde para el {hora_fmt} ha sido puesta en espera de reubicación prioritaria."
                )
            })

        return {
            "modo_guardia_activo": True,
            "medico_id": medico_id,
            "inicio_guardia": ini_g.isoformat(),
            "fin_guardia": fin_g.isoformat(),
            "total_afectadas": len(citas_afectadas),
            "citas_afectadas": citas_afectadas,
            "notificaciones_urgentes": notificaciones
        }

    def validar_sobrecupo(
        self,
        medico_id: str,
        sede_id: str,
        sala_id: str,
        fecha_hora_inicio: datetime,
        duracion_minutos: int,
        citas_existentes: List[Dict[str, Any]],
        horarios_rotacion: Optional[List[Dict[str, Any]]] = None,
        max_sobrecupos_por_turno: int = 1
    ) -> Dict[str, Any]:
        """
        Reglas de Negocio Estrictas para Sobrecupo de Emergencia:
        1. El médico DEBE tener un bloque activo en la misma sede y jornada.
        2. NO se permite sobrecupo si implica traslado interurbano adicional.
        3. Máximo 1 cita de sobrecupo por jornada de 4 horas para no comprometer calidad clínica.
        4. No debe colisionar con la ventana de traslado hacia la sede siguiente.
        """
        c_ini_utc = fecha_hora_inicio if fecha_hora_inicio.tzinfo else fecha_hora_inicio.replace(tzinfo=zoneinfo.ZoneInfo("UTC"))
        fecha_str = c_ini_utc.astimezone(ECUADOR_TZ).strftime("%Y-%m-%d")

        sobrecupos_dia = [
            c for c in citas_existentes
            if c.get("medico_id") == medico_id
            and c.get("sede_id") == sede_id
            and c.get("es_sobrecupo", False)
            and c.get("estado") not in ("CANCELADA", "REAGENDADA")
            and (c["inicio"].astimezone(ECUADOR_TZ).strftime("%Y-%m-%d") if c["inicio"].tzinfo else c["inicio"].strftime("%Y-%m-%d")) == fecha_str
        ]

        if len(sobrecupos_dia) >= max_sobrecupos_por_turno:
            return {
                "valido": False,
                "codigo_error": "LIMITE_SOBRECUPO_EXCEDIDO",
                "razon_rechazo": f"Se ha alcanzado el límite máximo de sobrecupos ({max_sobrecupos_por_turno}) para esta jornada.",
                "tiempo_buffer_requerido": None
            }

        return self.validar_disponibilidad(
            medico_id=medico_id,
            sede_solicitada_id=sede_id,
            sala_solicitada_id=sala_id,
            fecha_hora_propuesta_inicio=c_ini_utc,
            duracion_minutos=duracion_minutos,
            citas_existentes=citas_existentes,
            horarios_rotacion=horarios_rotacion
        )


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
