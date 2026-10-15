"""
test_gastos.py
Suite de Pruebas Unitarias - Módulo de Gastos de Transporte e Insumos (Semana 3)
Plataforma SaaS: Montepiedra Salud
"""

import unittest
from decimal import Decimal
from datetime import datetime, timedelta, timezone

from backend.gastos_service import (
    ServicioGastosFinanciero,
    RepositorioGastosMemoria,
    GastoValidationError,
    GastoLiquidadoError
)


class TestModuloGastosSemana3(unittest.TestCase):

    def setUp(self):
        RepositorioGastosMemoria.reset()
        RepositorioGastosMemoria.seed_default_data()
        self.servicio = ServicioGastosFinanciero()

    # 1. Registro exitoso de transporte
    def test_registro_transporte_valido(self):
        payload = {
            "tipo_gasto": "TRANSPORTE",
            "sede_codigo": "CEIBOS",
            "tipo_transporte": "GASOLINA",
            "monto": 20.00,
            "motivo": "Gasolina Super para ruta Ceibos - Alborada",
            "origen_fondo": "MEDICO_PERSONAL"
        }
        res = self.servicio.registrar_gasto(payload)
        self.assertTrue(res["exito"])
        gasto = res["gasto"]
        self.assertEqual(gasto["tipo_gasto"], "TRANSPORTE")
        self.assertEqual(gasto["monto"], Decimal("20.00"))
        self.assertTrue(gasto["es_reembolso_medico"])

    # 2. Registro exitoso de insumos médicos
    def test_registro_insumo_valido(self):
        payload = {
            "tipo_gasto": "INSUMOS",
            "sede_codigo": "MAPASINGUE",
            "categoria_insumo": "INSUMOS_MEDICOS_BASICOS",
            "detalle": "Guantes de nitrilo y alcohol quirúrgico 1L",
            "monto_total": 15.75,
            "tipo_comprobante": "FACTURA_RUC",
            "numero_comprobante": "001-002-000847291",
            "origen_fondo": "CAJA_CHICA_SEDE"
        }
        res = self.servicio.registrar_gasto(payload)
        self.assertTrue(res["exito"])
        gasto = res["gasto"]
        self.assertEqual(gasto["tipo_gasto"], "INSUMOS")
        self.assertEqual(gasto["monto"], Decimal("15.75"))
        self.assertFalse(gasto["es_reembolso_medico"])

    # 3. Bloqueo de montos negativos o en cero
    def test_bloqueo_monto_invalido(self):
        payload = {
            "tipo_gasto": "TRANSPORTE",
            "sede_codigo": "CEIBOS",
            "tipo_transporte": "TAXI_APP",
            "monto": 0.00,
            "motivo": "Taxi a clínica"
        }
        with self.assertRaises(GastoValidationError) as ctx:
            self.servicio.registrar_gasto(payload)
        self.assertIn("estrictamente mayor a $0.00", str(ctx.exception))

        payload["monto"] = -10.50
        with self.assertRaises(GastoValidationError):
            self.servicio.registrar_gasto(payload)

    # 4. Bloqueo de fechas futuras
    def test_bloqueo_fecha_futura(self):
        fecha_futura = (datetime.now(timezone.utc) + timedelta(days=2)).isoformat()
        payload = {
            "tipo_gasto": "TRANSPORTE",
            "sede_codigo": "CEIBOS",
            "tipo_transporte": "GASOLINA",
            "monto": 10.00,
            "fecha_hora": fecha_futura,
            "motivo": "Gasolina"
        }
        with self.assertRaises(GastoValidationError) as ctx:
            self.servicio.registrar_gasto(payload)
        self.assertIn("fecha y hora futura", str(ctx.exception))

    # 5. Validación de número de comprobante para facturas
    def test_insumos_requiere_numero_factura(self):
        payload = {
            "tipo_gasto": "INSUMOS",
            "sede_codigo": "ALBORADA",
            "categoria_insumo": "MATERIAL_QUIRURGICO",
            "detalle": "Suturas seda 3-0",
            "monto_total": 25.00,
            "tipo_comprobante": "FACTURA_RUC",
            "numero_comprobante": ""  # Vacío
        }
        with self.assertRaises(GastoValidationError) as ctx:
            self.servicio.registrar_gasto(payload)
        self.assertIn("número de comprobante es obligatorio", str(ctx.exception))

    # 6. Listado y cálculo de KPIs acumulados
    def test_listar_gastos_y_kpis(self):
        res = self.servicio.listar_gastos(rango="semana")
        self.assertTrue(res["exito"])
        kpis = res["kpis"]
        self.assertGreater(kpis["gran_total_egresos"], 0)
        self.assertGreaterEqual(kpis["total_reembolso_medico"], 0)
        self.assertGreaterEqual(kpis["total_deduccion_sedes"], 0)

    # 7. Bloqueo de eliminación para gasto liquidado
    def test_bloqueo_eliminacion_gasto_liquidado(self):
        # EXP-G004 está marcado como 'LIQUIDADO' en los seeds
        with self.assertRaises(GastoLiquidadoError) as ctx:
            self.servicio.eliminar_gasto("EXP-G004")
        self.assertIn("liquidación semanal cerrada", str(ctx.exception))

    # 8. Eliminación exitosa de gasto pendiente
    def test_eliminacion_exitosa_gasto_pendiente(self):
        # EXP-G001 es PENDIENTE
        res = self.servicio.eliminar_gasto("EXP-G001")
        self.assertTrue(res["exito"])
        self.assertNotIn("EXP-G001", RepositorioGastosMemoria._gastos)


if __name__ == "__main__":
    unittest.main()
