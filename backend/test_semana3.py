"""
test_semana3.py
Suite de Pruebas Unitarias y de Integración - Semana 3 (01 Oct - 07 Oct, 2026)
Hito 2: "Pacientes agendando con ticket QR y recibiendo confirmación formal por email"
Plataforma SaaS: Gestión Médica Multisede (Montepiedra Salud)

Verifica exhaustivamente:
1. Prevención del "Phantom Booking" (Hold temporal con TTL y liberación de slots expirados).
2. Prevención de duplicidad de expedientes (Conciliación e idempotencia por Cédula/Email/Teléfono).
3. Seguridad Criptográfica del Ticket QR (Generación y Detección de Falsificaciones con HMAC-SHA256).
4. Controlador de Admisión en Recepción (Transición de estado a 'EN_SALA' y rechazo de citas canceladas).
5. Resiliencia e Idempotencia del Worker de Recordatorios 24h (Ventana 23-25h y prevención de spam).
6. Exactitud del desglose financiero en la emisión del comprobante digital.
"""

import unittest
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from backend.portal_pacientes import (
    PortalPacientesService,
    GeneradorTokenQRSeguro,
    RepositorioMemoriaSaaS
)
from backend.email_service import ServicioEmailTransaccional


class TestSemana3PortalPacientes(unittest.TestCase):

    def setUp(self):
        """Reiniciar repositorios en memoria antes de cada test."""
        RepositorioMemoriaSaaS.reset()
        self.portal = PortalPacientesService()

    # -------------------------------------------------------------------------
    # TEST 1: PREVENCIÓN DE PHANTOM BOOKING (HOLD TEMPORAL)
    # -------------------------------------------------------------------------
    def test_creacion_y_expiracion_hold_temporal(self):
        # 1. Crear hold exitoso para las 09:00 en Ceibos
        res_hold = self.portal.crear_hold_temporal(
            medico_id="dr_campoverde",
            sede_id="ceibos",
            sala_id="sala_ceibos_1",
            fecha="2026-10-05",
            hora="09:00",
            duracion_minutos=45,
            ttl_minutos=10
        )
        self.assertTrue(res_hold["exito"])
        hold_id = res_hold["hold_id"]
        self.assertIn(hold_id, RepositorioMemoriaSaaS.holds_temporales)

        # 2. Intentar bloquear el mismo turno por otro paciente mientras el hold está activo
        res_colision = self.portal.crear_hold_temporal(
            medico_id="dr_campoverde",
            sede_id="ceibos",
            sala_id="sala_ceibos_1",
            fecha="2026-10-05",
            hora="09:00",
            duracion_minutos=45,
            ttl_minutos=10
        )
        self.assertFalse(res_colision["exito"])
        self.assertIn("temporalmente bloqueado", res_colision["error"])

        # 3. Simular paso del tiempo: forzar expiración del hold (+11 minutos)
        RepositorioMemoriaSaaS.holds_temporales[hold_id]["expira_at"] = (
            datetime.now(timezone.utc) - timedelta(minutes=1)
        )

        # 4. Comprobar que el recolector de basura (garbage collector) lo libera
        liberados = self.portal.liberar_holds_expirados()
        self.assertEqual(liberados, 1)
        self.assertNotIn(hold_id, RepositorioMemoriaSaaS.holds_temporales)

        # 5. Tras la expiración, el slot queda disponible nuevamente
        res_nuevo_hold = self.portal.crear_hold_temporal(
            medico_id="dr_campoverde",
            sede_id="ceibos",
            sala_id="sala_ceibos_1",
            fecha="2026-10-05",
            hora="09:00",
            duracion_minutos=45,
            ttl_minutos=10
        )
        self.assertTrue(res_nuevo_hold["exito"])

    # -------------------------------------------------------------------------
    # TEST 2: CONCILIACIÓN DE EXPEDIENTES (ANTI-DUPLICADOS / DATA SILOING)
    # -------------------------------------------------------------------------
    def test_conciliacion_expedientes_pacientes(self):
        # Primer registro de paciente con cédula 0923456789
        paciente_inicial = {
            "identificacion": "0923456789",
            "nombre": "Ana María García",
            "email": "ana.garcia@test.ec",
            "telefono": "0991234567",
            "alergias": "Penicilina"
        }
        exp1 = self.portal.conciliar_expediente(paciente_inicial)
        exp_id_original = exp1["id"]
        self.assertEqual(exp1["identificacion"], "0923456789")

        # Segundo ingreso: paciente ingresa su nombre abreviado y correo en mayúsculas
        paciente_variante = {
            "identificacion": "0923456789",
            "nombre": "Ana Garcia",
            "email": "ANA.GARCIA@TEST.EC",
            "telefono": "0991234567",
            "alergias": "Penicilina y AINES"
        }
        exp2 = self.portal.conciliar_expediente(paciente_variante)

        # Debe consolidar en el mismo expediente, no crear un nuevo ID huérfano
        self.assertEqual(exp2["id"], exp_id_original)
        self.assertEqual(exp2["alergias"], "Penicilina y AINES")
        self.assertEqual(len(RepositorioMemoriaSaaS.expedientes_pacientes), 1)

    # -------------------------------------------------------------------------
    # TEST 3: SEGURIDAD CRIPTOGRÁFICA DEL TICKET QR (HMAC-SHA256)
    # -------------------------------------------------------------------------
    def test_verificacion_y_tampering_token_qr(self):
        # 1. Generar token legítimo
        token_valido = GeneradorTokenQRSeguro.generar_token(
            cita_id="APT-88A9B1",
            codigo="MED-39401",
            fecha="2026-10-03",
            hora="10:30",
            sede_id="ceibos"
        )
        verif = GeneradorTokenQRSeguro.verificar_token(token_valido)
        self.assertTrue(verif["valido"])
        self.assertEqual(verif["cita_id"], "APT-88A9B1")
        self.assertEqual(verif["codigo"], "MED-39401")

        # 2. Intentar ataque de manipulación (Tampering): cambiar la hora o ID de cita
        partes = token_valido.split('|')
        partes_falsificadas = list(partes)
        partes_falsificadas[3] = "11:30"  # Paciente intenta adelantarse o cambiar de turno
        token_falsificado = "|".join(partes_falsificadas)

        verif_falso = GeneradorTokenQRSeguro.verificar_token(token_falsificado)
        self.assertFalse(verif_falso["valido"])
        self.assertIn("Firma criptográfica inválida", verif_falso["error"])

        # 3. Intentar token truncado o con payload malformado
        verif_malformado = GeneradorTokenQRSeguro.verificar_token("token_invalido_sin_pipes")
        self.assertFalse(verif_malformado["valido"])
        self.assertIn("Formato de token inválido", verif_malformado["error"])

    # -------------------------------------------------------------------------
    # TEST 4: ESCANEO EN RECEPCIÓN (TRANSICIÓN DE ESTADO A 'EN_SALA')
    # -------------------------------------------------------------------------
    def test_admision_en_sala_por_recepcion(self):
        # Crear y confirmar una cita
        hold = self.portal.crear_hold_temporal(
            medico_id="dr_campoverde",
            sede_id="alborada",
            sala_id="sala_alborada_1",
            fecha="2026-10-04",
            hora="14:00"
        )
        res_conf = self.portal.confirmar_cita(
            hold_id=hold["hold_id"],
            medico_id="dr_campoverde",
            sede_id="alborada",
            fecha="2026-10-04",
            hora="14:00",
            paciente_datos={
                "identificacion": "0918273645",
                "nombre": "Jorge Morales",
                "email": "jorge.morales@test.ec",
                "telefono": "0987654321"
            },
            metodo_pago="EFECTIVO"
        )
        self.assertTrue(res_conf["exito"])
        token = res_conf["token_seguro"]
        cita_id = res_conf["cita"]["id"]

        self.assertEqual(RepositorioMemoriaSaaS.citas[cita_id]["estado"], "CONFIRMADA")

        # Escanear en recepción con token firmado
        res_escaneo = self.portal.recepcion_escanear_qr(token)
        self.assertTrue(res_escaneo["exito"])
        self.assertEqual(RepositorioMemoriaSaaS.citas[cita_id]["estado"], "EN_SALA")
        self.assertIsNotNone(RepositorioMemoriaSaaS.citas[cita_id].get("admitido_en_sala_at"))

        # Segundo escaneo (idempotente): no debe dar error, sino confirmar que ya está en sala
        res_segundo_escaneo = self.portal.recepcion_escanear_qr(token)
        self.assertTrue(res_segundo_escundo := res_segundo_escaneo["exito"])
        self.assertIn("ya había sido registrado", res_segundo_escaneo["mensaje"])

        # Intentar admitir una cita CANCELADA
        RepositorioMemoriaSaaS.citas[cita_id]["estado"] = "CANCELADA"
        res_cancelada = self.portal.recepcion_escanear_qr(token)
        self.assertFalse(res_cancelada["exito"])
        self.assertIn("CANCELADA", res_cancelada["error"])

    # -------------------------------------------------------------------------
    # TEST 5: WORKER IDEMPOTENTE DE RECORDATORIOS 24H (VENTANA 23-25H)
    # -------------------------------------------------------------------------
    def test_worker_recordatorios_24h_idempotente(self):
        fecha_base = datetime(2026, 10, 2, 10, 0, 0)

        # Cita A: exactamente dentro de 24 horas (2026-10-03 10:00) -> DEBE RECIBIR RECORDATORIO
        hold_a = self.portal.crear_hold_temporal("dr_campoverde", "ceibos", "s1", "2026-10-03", "10:00")
        res_a = self.portal.confirmar_cita(
            hold_id=hold_a["hold_id"],
            medico_id="dr_campoverde",
            sede_id="ceibos",
            fecha="2026-10-03",
            hora="10:00",
            paciente_datos={"identificacion": "0900000001", "nombre": "Paciente A", "email": "a@test.ec", "telefono": "0991"},
            metodo_pago="TARJETA"
        )
        cita_a_id = res_a["cita"]["id"]

        # Cita B: dentro de 5 horas (menos de 23h de anticipación) -> NO DEBE RECIBIR EN ESTE CICLO
        hold_b = self.portal.crear_hold_temporal("dr_campoverde", "mapasingue", "s2", "2026-10-02", "15:00")
        res_b = self.portal.confirmar_cita(
            hold_id=hold_b["hold_id"],
            medico_id="dr_campoverde",
            sede_id="mapasingue",
            fecha="2026-10-02",
            hora="15:00",
            paciente_datos={"identificacion": "0900000002", "nombre": "Paciente B", "email": "b@test.ec", "telefono": "0992"},
            metodo_pago="EFECTIVO"
        )
        cita_b_id = res_b["cita"]["id"]

        # Cita C: dentro de 72 horas (fuera de la ventana superior de 25h) -> NO DEBE RECIBIR
        hold_c = self.portal.crear_hold_temporal("dr_campoverde", "ceibos", "s1", "2026-10-05", "10:00")
        res_c = self.portal.confirmar_cita(
            hold_id=hold_c["hold_id"],
            medico_id="dr_campoverde",
            sede_id="ceibos",
            fecha="2026-10-05",
            hora="10:00",
            paciente_datos={"identificacion": "0900000003", "nombre": "Paciente C", "email": "c@test.ec", "telefono": "0993"},
            metodo_pago="EFECTIVO"
        )
        cita_c_id = res_c["cita"]["id"]

        # Ejecutar worker con fecha_base
        res_worker = self.portal.ejecutar_worker_recordatorios_24h(fecha_referencia=fecha_base)

        self.assertEqual(res_worker["citas_evaluadas_en_ventana"], 1)
        self.assertEqual(res_worker["recordatorios_despachados"], 1)

        # Verificar que Cita A pasó a RECORDATORIO_ENVIADO con timestamp
        self.assertEqual(RepositorioMemoriaSaaS.citas[cita_a_id]["estado"], "RECORDATORIO_ENVIADO")
        self.assertIsNotNone(RepositorioMemoriaSaaS.citas[cita_a_id]["recordatorio_24h_enviado_at"])

        # Verificar que Cita B y C no fueron alteradas
        self.assertEqual(RepositorioMemoriaSaaS.citas[cita_b_id]["estado"], "CONFIRMADA")
        self.assertIsNone(RepositorioMemoriaSaaS.citas[cita_b_id]["recordatorio_24h_enviado_at"])
        self.assertEqual(RepositorioMemoriaSaaS.citas[cita_c_id]["estado"], "CONFIRMADA")

        # Ejecutar worker nuevamente (comprobar IDEMPOTENCIA: 0 nuevos envíos)
        res_worker_repetido = self.portal.ejecutar_worker_recordatorios_24h(fecha_referencia=fecha_base)
        self.assertEqual(res_worker_repetido["recordatorios_despachados"], 0)

    # -------------------------------------------------------------------------
    # TEST 6: DESGLOSE FINANCIERO Y TRANSPARENCIA CONTABLE
    # -------------------------------------------------------------------------
    def test_desglose_financiero_tarjeta_vs_efectivo(self):
        # Caso Tarjeta: Tarifa Base $20.00 + Recargo 9.75% ($1.95) = $21.95 Total
        hold_t = self.portal.crear_hold_temporal("dr_campoverde", "ceibos", "s1", "2026-10-06", "11:00")
        res_t = self.portal.confirmar_cita(
            hold_id=hold_t["hold_id"],
            medico_id="dr_campoverde",
            sede_id="ceibos",
            fecha="2026-10-06",
            hora="11:00",
            paciente_datos={"identificacion": "0911111111", "nombre": "Laura Peña", "email": "l@test.ec", "telefono": "0994"},
            metodo_pago="TARJETA"
        )
        cita_t = res_t["cita"]
        self.assertEqual(cita_t["monto_base"], 20.00)
        self.assertEqual(cita_t["monto_recargo"], 1.95)
        self.assertEqual(cita_t["total_cobrado"], 21.95)

        # Caso Efectivo: Precio Lista $21.95 - Descuento 9.75% ($1.95) = $20.00 Total
        hold_e = self.portal.crear_hold_temporal("dr_campoverde", "ceibos", "s1", "2026-10-06", "12:00")
        res_e = self.portal.confirmar_cita(
            hold_id=hold_e["hold_id"],
            medico_id="dr_campoverde",
            sede_id="ceibos",
            fecha="2026-10-06",
            hora="12:00",
            paciente_datos={"identificacion": "0922222222", "nombre": "Marcos Silva", "email": "m@test.ec", "telefono": "0995"},
            metodo_pago="EFECTIVO"
        )
        cita_e = res_e["cita"]
        self.assertEqual(cita_e["precio_lista_oficial"], 21.95)
        self.assertEqual(cita_e["monto_descuento_directo"], 1.95)
        self.assertEqual(cita_e["total_cobrado"], 20.00)


if __name__ == "__main__":
    unittest.main()
