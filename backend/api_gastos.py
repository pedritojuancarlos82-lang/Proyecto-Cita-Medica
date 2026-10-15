"""
api_gastos.py
Servidor y Endpoints REST API para el Módulo de Gastos Operativos (Semana 3)
Montepiedra Salud - Sistema de Liquidación y Contabilidad Multisede

Endpoints implementados:
- POST   /api/gastos           Registrar nuevo egreso de transporte o insumos (con soporte de comprobante)
- GET    /api/gastos           Listar egresos filtrados por sede, rango (hoy/semana) y tipo, con KPIs agregados
- DELETE /api/gastos/<id>      Eliminar un egreso (bloqueado si el estado_liquidacion es 'LIQUIDADO')

Compatible con WSGI / Flask o standalone con el servidor HTTP nativo de Python.
"""

import json
from decimal import Decimal
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import traceback

from backend.gastos_service import (
    ServicioGastosFinanciero,
    GastoValidationError,
    GastoLiquidadoError,
    SEDES_VALIDAS,
    TIPOS_TRANSPORTE,
    CATEGORIAS_INSUMO,
    ORIGENES_FONDO,
    TIPOS_COMPROBANTE
)

# Instancia singleton del servicio financiero de gastos
servicio_gastos = ServicioGastosFinanciero()
servicio_gastos.inicializar_datos_demo()


class DecimalEncoder(json.JSONEncoder):
    """Serializador JSON para objetos Decimal y tipos especiales."""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super().default(obj)


class GastosAPIHandler(BaseHTTPRequestHandler):
    """Manejador HTTP REST para los endpoints de /api/gastos."""

    def _set_headers(self, status_code=200, content_type="application/json"):
        self.send_response(status_code)
        self.send_header("Content-Type", f"{content_type}; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
        self.end_headers()

    def do_OPTIONS(self):
        """Preflight CORS."""
        self._set_headers(204)

    def do_GET(self):
        """
        GET /api/gastos?sede_id=X&rango=semana&tipo=transporte
        Retorna la lista de egresos y los KPIs calculados.
        """
        parsed_url = urlparse(self.path)
        path = parsed_url.path

        if path == "/api/gastos" or path == "/api/gastos/":
            query_params = parse_qs(parsed_url.query)
            sede_id = query_params.get("sede_id", [None])[0]
            rango = query_params.get("rango", ["semana"])[0]
            tipo = query_params.get("tipo", [None])[0]

            try:
                resultado = servicio_gastos.listar_gastos(sede_id=sede_id, rango=rango, tipo=tipo)
                self._set_headers(200)
                self.wfile.write(json.dumps(resultado, cls=DecimalEncoder, ensure_ascii=False).encode("utf-8"))
            except Exception as e:
                self._set_headers(500)
                self.wfile.write(json.dumps({
                    "exito": False,
                    "error": str(e),
                    "traceback": traceback.format_exc()
                }).encode("utf-8"))
        elif path == "/api/gastos/catalogos":
            # Endpoint auxiliar para los selectores del frontend
            catalogos = {
                "sedes": {k: v["nombre"] for k, v in SEDES_VALIDAS.items()},
                "tipos_transporte": TIPOS_TRANSPORTE,
                "categorias_insumo": CATEGORIAS_INSUMO,
                "origenes_fondo": ORIGENES_FONDO,
                "tipos_comprobante": TIPOS_COMPROBANTE
            }
            self._set_headers(200)
            self.wfile.write(json.dumps({"exito": True, "catalogos": catalogos}, ensure_ascii=False).encode("utf-8"))
        else:
            self._set_headers(404)
            self.wfile.write(json.dumps({"exito": False, "error": "Endpoint no encontrado"}).encode("utf-8"))

    def do_POST(self):
        """
        POST /api/gastos
        Registra un nuevo gasto de Transporte o de Insumos.
        """
        parsed_url = urlparse(self.path)
        if parsed_url.path not in ["/api/gastos", "/api/gastos/"]:
            self._set_headers(404)
            self.wfile.write(json.dumps({"exito": False, "error": "Endpoint no encontrado"}).encode("utf-8"))
            return

        try:
            content_length = int(self.headers.get("Content-Length", 0))
            if content_length == 0:
                self._set_headers(400)
                self.wfile.write(json.dumps({"exito": False, "error": "Payload vacío"}).encode("utf-8"))
                return

            body = self.rfile.read(content_length)
            payload = json.loads(body.decode("utf-8"))

            nuevo_gasto = servicio_gastos.registrar_gasto(payload)
            self._set_headers(201)
            self.wfile.write(json.dumps({
                "exito": True,
                "mensaje": "Gasto registrado correctamente para conciliación contable.",
                "gasto": nuevo_gasto
            }, cls=DecimalEncoder, ensure_ascii=False).encode("utf-8"))

        except GastoValidationError as e:
            self._set_headers(422)  # Unprocessable Entity
            self.wfile.write(json.dumps({"exito": False, "tipo_error": "VALIDATION_ERROR", "error": str(e)}).encode("utf-8"))
        except json.JSONDecodeError:
            self._set_headers(400)
            self.wfile.write(json.dumps({"exito": False, "error": "JSON malformado"}).encode("utf-8"))
        except Exception as e:
            self._set_headers(500)
            self.wfile.write(json.dumps({
                "exito": False,
                "error": str(e),
                "traceback": traceback.format_exc()
            }).encode("utf-8"))

    def do_DELETE(self):
        """
        DELETE /api/gastos/:id
        Elimina un egreso. Retorna 403 Forbidden si el gasto ya fue liquidado.
        """
        parsed_url = urlparse(self.path)
        path_parts = [p for p in parsed_url.path.split("/") if p]

        # Esperado: ['api', 'gastos', '<id>']
        if len(path_parts) != 3 or path_parts[0] != "api" or path_parts[1] != "gastos":
            self._set_headers(400)
            self.wfile.write(json.dumps({"exito": False, "error": "Ruta inválida. Formato: DELETE /api/gastos/:id"}).encode("utf-8"))
            return

        gasto_id = path_parts[2]
        try:
            res = servicio_gastos.eliminar_gasto(gasto_id)
            self._set_headers(200)
            self.wfile.write(json.dumps(res).encode("utf-8"))
        except KeyError:
            self._set_headers(404)
            self.wfile.write(json.dumps({"exito": False, "error": f"Gasto con ID {gasto_id} no existe."}).encode("utf-8"))
        except GastoLiquidadoError as e:
            self._set_headers(403)  # Forbidden - cerrado contablemente
            self.wfile.write(json.dumps({
                "exito": False,
                "tipo_error": "GASTO_LIQUIDADO_BLOQUEADO",
                "error": str(e)
            }).encode("utf-8"))
        except Exception as e:
            self._set_headers(500)
            self.wfile.write(json.dumps({"exito": False, "error": str(e)}).encode("utf-8"))


# --- Integración Flask Opcional (Si el entorno de producción tiene Flask) ---
try:
    from flask import Flask, request, jsonify

    flask_app = Flask("montepiedra_gastos_api")

    @flask_app.route("/api/gastos", methods=["GET"])
    def flask_listar_gastos():
        sede_id = request.args.get("sede_id")
        rango = request.args.get("rango", "semana")
        tipo = request.args.get("tipo")
        try:
            resultado = servicio_gastos.listar_gastos(sede_id=sede_id, rango=rango, tipo=tipo)
            return jsonify(json.loads(json.dumps(resultado, cls=DecimalEncoder))), 200
        except Exception as e:
            return jsonify({"exito": False, "error": str(e)}), 500

    @flask_app.route("/api/gastos", methods=["POST"])
    def flask_crear_gasto():
        try:
            payload = request.get_json(force=True)
            nuevo_gasto = servicio_gastos.registrar_gasto(payload)
            return jsonify(json.loads(json.dumps({
                "exito": True,
                "mensaje": "Gasto registrado correctamente",
                "gasto": nuevo_gasto
            }, cls=DecimalEncoder))), 201
        except GastoValidationError as ve:
            return jsonify({"exito": False, "tipo_error": "VALIDATION_ERROR", "error": str(ve)}), 422
        except Exception as e:
            return jsonify({"exito": False, "error": str(e)}), 500

    @flask_app.route("/api/gastos/<string:gasto_id>", methods=["DELETE"])
    def flask_eliminar_gasto(gasto_id):
        try:
            res = servicio_gastos.eliminar_gasto(gasto_id)
            return jsonify(res), 200
        except KeyError:
            return jsonify({"exito": False, "error": "Gasto no encontrado"}), 404
        except GastoLiquidadoError as gle:
            return jsonify({"exito": False, "tipo_error": "GASTO_LIQUIDADO_BLOQUEADO", "error": str(gle)}), 403
        except Exception as e:
            return jsonify({"exito": False, "error": str(e)}), 500

except ImportError:
    flask_app = None


def iniciar_servidor_standalone(puerto: int = 8000):
    """Inicia el servidor HTTP nativo sin dependencias externas."""
    server_address = ("", puerto)
    httpd = HTTPServer(server_address, GastosAPIHandler)
    print(f"🚀 Servidor API de Gastos Montepiedra iniciado en http://localhost:{puerto}/api/gastos")
    httpd.serve_forever()


if __name__ == "__main__":
    iniciar_servidor_standalone(puerto=8000)
