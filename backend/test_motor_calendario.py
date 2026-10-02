"""
test_motor_calendario.py
Matriz de Pruebas Unitarias Automatizadas para el Motor de Citas y Liquidaciones
Semana 2: Hito 1 de Aceptación
"""

import unittest
import concurrent.futures
from datetime import datetime, timedelta, time
from decimal import Decimal
import zoneinfo

from backend.motor_calendario import (
    MotorCalendarioInteligente,
    ServicioLiquidacionFinanciera,
    ECUADOR_TZ
)

class TestMotorCalendarioSemana2(unittest.TestCase):

    def setUp(self):
        self.motor = MotorCalendarioInteligente()
        self.medico_id = "MED-001"
        self.medico_2_id = "MED-002"

        # Horario rotativo de prueba: Viernes de 09:00 a 17:00 en Ceibos y Mapasingue
        self.horarios = [
            {
                "medico_id": self.medico_id,
                "sede_id": "CEIBOS",
                "dia_semana": "VIERNES",
                "hora_inicio": time(8, 0),
                "hora_fin": time(14, 0),
            },
            {
                "medico_id": self.medico_id,
                "sede_id": "ALBORADA",
                "dia_semana": "VIERNES",
                "hora_inicio": time(14, 0),
                "hora_fin": time(20, 0),
            }
        ]

    # -------------------------------------------------------------------------
    # CASO 1: Cita contigua con tiempo de traslado insuficiente
    # -------------------------------------------------------------------------
    def test_traslado_insuficiente_entre_sedes(self):
        """
        El médico atiende en Ceibos hasta las 11:00 UTC (06:00 local).
        Intenta agendar en Alborada a las 11:15 UTC (15 min después).
        Entre Ceibos y Alborada se requieren 60 minutos (35 min viaje + 25 min tráfico).
        DEBE RECHAZARSE.
        """
        citas_existentes = [
            {
                "medico_id": self.medico_id,
                "sede_id": "CEIBOS",
                "sala_id": "SALA-CEIBOS-1",
                "inicio": datetime(2026, 9, 25, 10, 0, tzinfo=zoneinfo.ZoneInfo("UTC")),
                "fin": datetime(2026, 9, 25, 11, 0, tzinfo=zoneinfo.ZoneInfo("UTC")),
                "estado": "CONFIRMADA"
            }
        ]

        resultado = self.motor.validar_disponibilidad(
            medico_id=self.medico_id,
            sede_solicitada_id="ALBORADA",
            sala_solicitada_id="SALA-ALBORADA-1",
            fecha_hora_propuesta_inicio=datetime(2026, 9, 25, 11, 15, tzinfo=zoneinfo.ZoneInfo("UTC")),
            duracion_minutos=30,
            citas_existentes=citas_existentes,
            horarios_rotacion=None
        )

        self.assertFalse(resultado["valido"])
        self.assertEqual(resultado["codigo_error"], "TRASLADO_INSUFICIENTE_PRE")
        self.assertEqual(resultado["tiempo_buffer_requerido"], 60)
        self.assertIn("Tiempo de traslado insuficiente desde sede CEIBOS", resultado["razon_rechazo"])

    # -------------------------------------------------------------------------
    # CASO 2: Traslape en el límite exacto de 1 minuto
    # -------------------------------------------------------------------------
    def test_traslape_sala_un_minuto(self):
        """
        La sala física está ocupada de 10:00 a 10:30 UTC por el médico 2.
        El médico 1 intenta apartar la misma sala de 10:29 a 10:59 UTC.
        DEBE RECHAZARSE por conflicto de sala física compartida.
        """
        citas_existentes = [
            {
                "medico_id": self.medico_2_id,
                "sede_id": "CEIBOS",
                "sala_id": "SALA-COMPARTIDA-A",
                "inicio": datetime(2026, 9, 25, 10, 0, tzinfo=zoneinfo.ZoneInfo("UTC")),
                "fin": datetime(2026, 9, 25, 10, 30, tzinfo=zoneinfo.ZoneInfo("UTC")),
                "estado": "CONFIRMADA"
            }
        ]

        resultado = self.motor.validar_disponibilidad(
            medico_id=self.medico_id,
            sede_solicitada_id="CEIBOS",
            sala_solicitada_id="SALA-COMPARTIDA-A",
            fecha_hora_propuesta_inicio=datetime(2026, 9, 25, 10, 29, tzinfo=zoneinfo.ZoneInfo("UTC")),
            duracion_minutos=30,
            citas_existentes=citas_existentes,
            horarios_rotacion=None
        )

        self.assertFalse(resultado["valido"])
        self.assertEqual(resultado["codigo_error"], "SALA_OCUPADA")
        self.assertIn("se encuentra ocupada por otra atención", resultado["razon_rechazo"])

    # -------------------------------------------------------------------------
    # CASO 3: Validación de Turno Fuera de Rotación
    # -------------------------------------------------------------------------
    def test_fuera_de_horario_rotativo(self):
        """
        El médico tiene turno en Ceibos de 08:00 a 14:00 local.
        Intenta agendar a las 15:00 local (20:00 UTC).
        DEBE RECHAZARSE con código FUERA_DE_ROTACION.
        """
        inicio_solicitado_local = datetime(2026, 9, 25, 15, 0, tzinfo=ECUADOR_TZ)
        inicio_utc = inicio_solicitado_local.astimezone(zoneinfo.ZoneInfo("UTC"))

        resultado = self.motor.validar_disponibilidad(
            medico_id=self.medico_id,
            sede_solicitada_id="CEIBOS",
            sala_solicitada_id="SALA-CEIBOS-1",
            fecha_hora_propuesta_inicio=inicio_utc,
            duracion_minutos=30,
            citas_existentes=[],
            horarios_rotacion=self.horarios
        )

        self.assertFalse(resultado["valido"])
        self.assertEqual(resultado["codigo_error"], "FUERA_DE_ROTACION")

    # -------------------------------------------------------------------------
    # CASO 4: Precisión Decimal y Recargo Exacto en Tarjeta (Ceibos 25%)
    # -------------------------------------------------------------------------
    def test_liquidacion_tarjeta_ceibos(self):
        """
        Sede Ceibos Privada:
        Tarifa Base: $20.00
        Recargo Tarjeta (9.75%): $1.95
        Total Cobrado: $21.95
        Comisión de Sede (25% sobre $20.00 base): $5.00 (NUNCA sobre los $21.95)
        Neto Médico: $15.00
        """
        liq = ServicioLiquidacionFinanciera.liquidar_honorarios_consulta(
            sede_codigo="CEIBOS",
            metodo_pago="TARJETA"
        )

        self.assertEqual(liq["monto_base"], 20.00)
        self.assertEqual(liq["monto_recargo"], 1.95)
        self.assertEqual(liq["total_cobrado_paciente"], 21.95)
        self.assertEqual(liq["monto_comision_sede"], 5.00)
        self.assertEqual(liq["ingreso_neto_medico"], 15.00)
        self.assertEqual(len(liq["asiento_contable_preliminar"]), 5)

    # -------------------------------------------------------------------------
    # CASO 5: Descuento Directo por Pago en Efectivo (Mapasingue 5%)
    # -------------------------------------------------------------------------
    def test_liquidacion_efectivo_mapasingue(self):
        """
        Sede Mapasingue:
        Tarifa Base: $20.00
        Precio Lista Oficial (+9.75%): $21.95
        Descuento especial por pago directo (9.75%): $1.95
        Total Cobrado: $20.00
        Comisión Sede (5% sobre $20.00): $1.00
        Neto Médico: $19.00
        """
        liq = ServicioLiquidacionFinanciera.liquidar_honorarios_consulta(
            sede_codigo="MAPASINGUE",
            metodo_pago="EFECTIVO"
        )

        self.assertEqual(liq["monto_base"], 20.00)
        self.assertEqual(liq["precio_lista_oficial"], 21.95)
        self.assertEqual(liq["monto_descuento_directo"], 1.95)
        self.assertEqual(liq["total_cobrado_paciente"], 20.00)
        self.assertEqual(liq["monto_comision_sede"], 1.00)
        self.assertEqual(liq["ingreso_neto_medico"], 19.00)

    # -------------------------------------------------------------------------
    # CASO 6: Hospital Público Exento de Retención (0%)
    # -------------------------------------------------------------------------
    def test_liquidacion_hospital_publico(self):
        """
        Hospital Público Ceibos:
        Tarifa Base: $0.00
        Comisión Sede: 0% ($0.00)
        Neto por Turno: $0.00 (Médico percibe sueldo fijo mensual de $1,200.00)
        """
        liq = ServicioLiquidacionFinanciera.liquidar_honorarios_consulta(
            sede_codigo="HOSPITAL",
            metodo_pago="EFECTIVO"
        )

        self.assertEqual(liq["total_cobrado_paciente"], 0.00)
        self.assertEqual(liq["monto_comision_sede"], 0.00)
        self.assertEqual(liq["ingreso_neto_medico"], 0.00)
        self.assertTrue(liq["es_hospital_sueldo_fijo"])

    # -------------------------------------------------------------------------
    # CASO 7: Ventana de Sanitización y Desalojo en Consultorio Compartido
    # -------------------------------------------------------------------------
    def test_desalojo_sanitizacion_sala_compartida(self):
        """
        La cita previa en la sala física compartida termina a las 10:30 UTC.
        Se solicita una cita a las 10:35 UTC (5 min después).
        Con política de sanitización de 10 minutos, debe rechazarse con SALA_SANITIZACION_PENDIENTE.
        """
        citas_existentes = [
            {
                "medico_id": self.medico_2_id,
                "sede_id": "CEIBOS",
                "sala_id": "SALA-COMPARTIDA-2",
                "inicio": datetime(2026, 9, 25, 10, 0, tzinfo=zoneinfo.ZoneInfo("UTC")),
                "fin": datetime(2026, 9, 25, 10, 30, tzinfo=zoneinfo.ZoneInfo("UTC")),
                "estado": "CONFIRMADA"
            }
        ]

        resultado = self.motor.validar_disponibilidad(
            medico_id=self.medico_id,
            sede_solicitada_id="CEIBOS",
            sala_solicitada_id="SALA-COMPARTIDA-2",
            fecha_hora_propuesta_inicio=datetime(2026, 9, 25, 10, 35, tzinfo=zoneinfo.ZoneInfo("UTC")),
            duracion_minutos=30,
            citas_existentes=citas_existentes,
            tiempo_sanitizacion_minutos=10
        )

        self.assertFalse(resultado["valido"])
        self.assertEqual(resultado["codigo_error"], "SALA_SANITIZACION_PENDIENTE")
        self.assertEqual(resultado["tiempo_buffer_requerido"], 10)
        self.assertIn("requiere 10 min de sanitización", resultado["razon_rechazo"])

    # -------------------------------------------------------------------------
    # CASO 8: Matriz Dinámica Hora Pico vs Hora Valle (Ceibos -> Alborada)
    # -------------------------------------------------------------------------
    def test_buffer_dinamico_hora_pico_vs_valle(self):
        """
        Evalúa cálculo dinámico entre Ceibos y Alborada:
        - 08:00 (Hora Pico matutina): Requiere 60 min.
        - 11:00 (Hora Valle): Requiere 45 min.
        """
        buffer_pico = self.motor.calcular_buffer_traslado(
            sede_origen="CEIBOS",
            sede_destino="ALBORADA",
            hora_local=time(8, 0),
            ajustar_dinamico=True
        )
        buffer_valle = self.motor.calcular_buffer_traslado(
            sede_origen="CEIBOS",
            sede_destino="ALBORADA",
            hora_local=time(11, 0),
            ajustar_dinamico=True
        )

        self.assertEqual(buffer_pico, 60)
        self.assertEqual(buffer_valle, 45)

    # -------------------------------------------------------------------------
    # CASO 9: Protocolo 'Modo Guardia' (Congelamiento y Reubicación Prioritaria)
    # -------------------------------------------------------------------------
    def test_activacion_modo_guardia_reubicacion_prioritaria(self):
        """
        El médico tiene una cita privada en Ceibos a las 15:30.
        Se le asigna una guardia imprevista en el Hospital de 15:00 a 19:00.
        El protocolo debe congelar la cita privada, marcarla con prioridad 1
        y generar notificaciones urgentes.
        """
        citas_existentes = [
            {
                "id": "CITA-PRIV-001",
                "medico_id": self.medico_id,
                "sede_id": "CEIBOS",
                "sala_id": "SALA-CEIBOS-2",
                "paciente_id": "PAC-123",
                "paciente_nombre": "Carlos Mendoza",
                "paciente_telefono": "0991234567",
                "inicio": datetime(2026, 9, 25, 15, 30, tzinfo=zoneinfo.ZoneInfo("UTC")),
                "fin": datetime(2026, 9, 25, 16, 15, tzinfo=zoneinfo.ZoneInfo("UTC")),
                "estado": "CONFIRMADA"
            }
        ]

        reporte_guardia = self.motor.activar_modo_guardia(
            medico_id=self.medico_id,
            inicio_guardia=datetime(2026, 9, 25, 15, 0, tzinfo=zoneinfo.ZoneInfo("UTC")),
            fin_guardia=datetime(2026, 9, 25, 19, 0, tzinfo=zoneinfo.ZoneInfo("UTC")),
            citas_existentes=citas_existentes
        )

        self.assertTrue(reporte_guardia["modo_guardia_activo"])
        self.assertEqual(reporte_guardia["total_afectadas"], 1)
        afectada = reporte_guardia["citas_afectadas"][0]
        self.assertEqual(afectada["estado"], "REAGENDAMIENTO_PENDIENTE_GUARDIA")
        self.assertEqual(afectada["prioridad_reubicacion"], 1)
        self.assertEqual(len(reporte_guardia["notificaciones_urgentes"]), 1)
        self.assertIn("urgente en Hospital Público", reporte_guardia["notificaciones_urgentes"][0]["mensaje"])

    # -------------------------------------------------------------------------
    # CASO 10: Control Estricto de Sobrecupo (Máx 1 por jornada en la misma sede)
    # -------------------------------------------------------------------------
    def test_sobrecupo_emergencia_mismo_bloque(self):
        """
        Verifica que no se permita más de un sobrecupo por jornada para evitar
        el efecto cascada y sobrecarga asistencial.
        """
        citas_existentes = [
            {
                "id": "SOBRECUPO-PREVIO",
                "medico_id": self.medico_id,
                "sede_id": "CEIBOS",
                "sala_id": "SALA-CEIBOS-1",
                "es_sobrecupo": True,
                "inicio": datetime(2026, 9, 25, 9, 0, tzinfo=zoneinfo.ZoneInfo("UTC")),
                "fin": datetime(2026, 9, 25, 9, 30, tzinfo=zoneinfo.ZoneInfo("UTC")),
                "estado": "CONFIRMADA"
            }
        ]

        # Intento de 2do sobrecupo en el mismo día
        resultado_segundo = self.motor.validar_sobrecupo(
            medico_id=self.medico_id,
            sede_id="CEIBOS",
            sala_id="SALA-CEIBOS-1",
            fecha_hora_inicio=datetime(2026, 9, 25, 9, 30, tzinfo=zoneinfo.ZoneInfo("UTC")),
            duracion_minutos=30,
            citas_existentes=citas_existentes,
            max_sobrecupos_por_turno=1
        )

        self.assertFalse(resultado_segundo["valido"])
        self.assertEqual(resultado_segundo["codigo_error"], "LIMITE_SOBRECUPO_EXCEDIDO")

    # -------------------------------------------------------------------------
    # CASO 11 (Semana 2 - Test 2): Margen de Viaje Exacto y Fronteras Semiabiertas
    # -------------------------------------------------------------------------
    def test_aprobacion_margen_viaje_exacto_frontera(self):
        """
        Demuestra la prevención de errores off-by-one (micro-bloqueos en bordes):
        1. Entre Ceibos y Alborada se requieren 60 min.
           La cita en Ceibos termina a las 11:00 UTC. La cita en Alborada inicia a las 12:00 UTC (exactamente 60 min).
           DEBE APROBARSE limpiamente.
        2. En la misma sala física, cita 1 termina a las 10:30 UTC y cita 2 inicia a las 10:30 UTC.
           En intervalo semiabierto [inicio, fin), no debe generar colisión.
        """
        citas_existentes = [
            {
                "medico_id": self.medico_id,
                "sede_id": "CEIBOS",
                "sala_id": "SALA-CEIBOS-1",
                "inicio": datetime(2026, 9, 25, 10, 0, tzinfo=zoneinfo.ZoneInfo("UTC")),
                "fin": datetime(2026, 9, 25, 11, 0, tzinfo=zoneinfo.ZoneInfo("UTC")),
                "estado": "CONFIRMADA"
            }
        ]

        # 1. Margen de viaje exacto
        resultado_viaje = self.motor.validar_disponibilidad_medico(
            medico_id=self.medico_id,
            sede_id="ALBORADA",
            sala_id="SALA-ALBORADA-1",
            inicio=datetime(2026, 9, 25, 12, 0, tzinfo=zoneinfo.ZoneInfo("UTC")),
            fin=datetime(2026, 9, 25, 12, 30, tzinfo=zoneinfo.ZoneInfo("UTC")),
            citas_existentes=citas_existentes
        )
        self.assertTrue(resultado_viaje["permitido"])
        self.assertIsNone(resultado_viaje["codigo_error"])

        # 2. Frontera semiabierta contigua en la misma sala física
        citas_sala = [
            {
                "medico_id": self.medico_id,
                "sede_id": "CEIBOS",
                "sala_id": "SALA-CEIBOS-1",
                "inicio": datetime(2026, 9, 25, 10, 0, tzinfo=zoneinfo.ZoneInfo("UTC")),
                "fin": datetime(2026, 9, 25, 10, 30, tzinfo=zoneinfo.ZoneInfo("UTC")),
                "estado": "CONFIRMADA"
            }
        ]
        conflicto_borde = self.motor.verificar_conflicto_sala_fisica(
            sala_id="SALA-CEIBOS-1",
            inicio=datetime(2026, 9, 25, 10, 30, tzinfo=zoneinfo.ZoneInfo("UTC")),
            fin=datetime(2026, 9, 25, 11, 0, tzinfo=zoneinfo.ZoneInfo("UTC")),
            citas_existentes=citas_sala,
            tiempo_sanitizacion_minutos=0
        )
        self.assertTrue(conflicto_borde["permitido"])
        self.assertIsNone(conflicto_borde["codigo_error"])

    # -------------------------------------------------------------------------
    # CASO 12 (Semana 2 - Test 3): Plan Dúo (Sala Ocupada por Colega, Médico Libre)
    # -------------------------------------------------------------------------
    def test_bloqueo_sala_compartida_plan_duo_medico_libre(self):
        """
        El médico 1 está completamente desocupado (sin citas).
        El médico 2 (colega en consultorio compartido) tiene ocupada la sala de 10:00 a 10:45 UTC.
        El médico 1 solicita la sala de 10:15 a 10:45 UTC.
        DEBE RECHAZARSE por conflicto de sala física compartida (código SALA_OCUPADA).
        """
        citas_existentes = [
            {
                "id": "CITA-COLEGA-001",
                "medico_id": self.medico_2_id,
                "sede_id": "CEIBOS",
                "sala_id": "SALA-COMPARTIDA-DUO",
                "inicio": datetime(2026, 9, 25, 10, 0, tzinfo=zoneinfo.ZoneInfo("UTC")),
                "fin": datetime(2026, 9, 25, 10, 45, tzinfo=zoneinfo.ZoneInfo("UTC")),
                "estado": "CONFIRMADA"
            }
        ]

        resultado = self.motor.validar_disponibilidad_medico(
            medico_id=self.medico_id,  # Médico libre
            sede_id="CEIBOS",
            sala_id="SALA-COMPARTIDA-DUO",  # Sala ocupada por médico 2
            inicio=datetime(2026, 9, 25, 10, 15, tzinfo=zoneinfo.ZoneInfo("UTC")),
            fin=datetime(2026, 9, 25, 10, 45, tzinfo=zoneinfo.ZoneInfo("UTC")),
            citas_existentes=citas_existentes
        )

        self.assertFalse(resultado["permitido"])
        self.assertEqual(resultado["codigo_error"], "SALA_OCUPADA")
        self.assertIn("se encuentra ocupada por otra atención", resultado["mensaje"])

    # -------------------------------------------------------------------------
    # CASO 13 (Semana 2 - Test 4): Concurrencia Simultánea al Mismo Slot (Race Condition)
    # -------------------------------------------------------------------------
    def test_concurrencia_dos_solicitudes_simultaneas_mismo_slot(self):
        """
        Simula dos pacientes/recepcionistas intentando reservar el mismo slot
        exactamente en el mismo milisegundo mediante hilos paralelos concurrentes.
        El cerrojo atómico (SELECT FOR UPDATE) debe garantizar:
        - Exactamente 1 solicitud exitosa (permitido=True, exito=True)
        - Exactamente 1 solicitud rechazada limpiamente (permitido=False, exito=False)
        - La base de datos / lista de citas contiene exactamente 1 cita registrada.
        """
        citas_db = []
        slot_ini = datetime(2026, 9, 25, 10, 0, tzinfo=zoneinfo.ZoneInfo("UTC"))
        slot_fin = datetime(2026, 9, 25, 10, 30, tzinfo=zoneinfo.ZoneInfo("UTC"))

        def intentar_reserva(paciente_num):
            paciente_data = {
                "id": f"PAC-CONC-{paciente_num}",
                "nombre": f"Paciente {paciente_num}",
                "telefono": f"099000000{paciente_num}"
            }
            return self.motor.reservar_slot_atomico(
                medico_id=self.medico_id,
                sede_id="CEIBOS",
                sala_id="SALA-CEIBOS-1",
                inicio=slot_ini,
                fin=slot_fin,
                paciente_data=paciente_data,
                citas_existentes=citas_db
            )

        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
            f1 = executor.submit(intentar_reserva, 1)
            f2 = executor.submit(intentar_reserva, 2)
            res1 = f1.result()
            res2 = f2.result()

        exitos = [r for r in (res1, res2) if r["exito"]]
        fracasos = [r for r in (res1, res2) if not r["exito"]]

        self.assertEqual(len(exitos), 1, "Exactamente una reserva debe triunfar")
        self.assertEqual(len(fracasos), 1, "Exactamente una reserva debe ser rechazada")
        self.assertEqual(len(citas_db), 1, "No debe haber duplicados en la base de datos")
        self.assertEqual(fracasos[0]["codigo_error"], "SALA_OCUPADA")

    # -------------------------------------------------------------------------
    # CASO 14: Generador de Slots Libres (Motor de Búsqueda para Portal Público)
    # -------------------------------------------------------------------------
    def test_generador_slots_disponibles_motor_busqueda(self):
        """
        Genera slots de 30 minutos para la jornada del médico en Ceibos (Viernes 08:00 - 14:00 local).
        Tiene una cita ya reservada de 09:00 a 09:30 local.
        Verifica que el generador descarte el slot ocupado y retorne los slots libres restantes.
        """
        # Cita a las 09:00 local (14:00 UTC)
        citas_existentes = [
            {
                "id": "CITA-PREVIA",
                "medico_id": self.medico_id,
                "sede_id": "CEIBOS",
                "sala_id": "SALA-CEIBOS-1",
                "inicio": datetime(2026, 9, 25, 14, 0, tzinfo=zoneinfo.ZoneInfo("UTC")),
                "fin": datetime(2026, 9, 25, 14, 30, tzinfo=zoneinfo.ZoneInfo("UTC")),
                "estado": "CONFIRMADA"
            }
        ]

        slots = self.motor.generar_slots_disponibles(
            medico_id=self.medico_id,
            sede_id="CEIBOS",
            fecha="2026-09-25",
            duracion_minutos=30,
            citas_existentes=citas_existentes,
            horarios_rotacion=self.horarios,
            sala_id="SALA-CEIBOS-1"
        )

        horas_inicio = [s["hora_inicio"] for s in slots]

        # 08:00 y 08:30 deben estar disponibles
        self.assertIn("08:00", horas_inicio)
        self.assertIn("08:30", horas_inicio)
        # 09:00 está ocupada: DEBE SER EXCLUIDA
        self.assertNotIn("09:00", horas_inicio)
        # 09:30 y posteriores deben estar disponibles
        self.assertIn("09:30", horas_inicio)
        self.assertIn("10:00", horas_inicio)


if __name__ == "__main__":
    unittest.main()


