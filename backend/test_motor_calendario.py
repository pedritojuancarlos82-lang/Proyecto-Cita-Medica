"""
test_motor_calendario.py
Matriz de Pruebas Unitarias Automatizadas para el Motor de Citas y Liquidaciones
Semana 2: Hito 1 de Aceptación
"""

import unittest
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

if __name__ == "__main__":
    unittest.main()
