import sys

file_path = "index.html"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Desktop Nav Button
desktop_btn = """      <button type="button" class="nav-tab-btn" data-tab="ingresos" id="nav-btn-doc-ingresos">
        <span>💸 Ingresos</span>
      </button>
"""
content = content.replace(
    '<button type="button" class="nav-tab-btn" data-tab="gastos" id="nav-btn-doc-gastos">\n        <span>💰 Gastos en Ruta</span>\n      </button>',
    '<button type="button" class="nav-tab-btn" data-tab="gastos" id="nav-btn-doc-gastos">\n        <span>💰 Gastos en Ruta</span>\n      </button>\n' + desktop_btn
)

# 2. Mobile Nav Pill
mobile_pill = """              <button type="button" class="doc-mobile-pill" data-tab="ingresos" id="pill-doc-ingresos">
                <span class="pill-text">Ingresos</span>
              </button>
"""
content = content.replace(
    '<button type="button" class="doc-mobile-pill" data-tab="gastos" id="pill-doc-gastos">\n                <span class="pill-text">Gastos</span>\n              </button>',
    '<button type="button" class="doc-mobile-pill" data-tab="gastos" id="pill-doc-gastos">\n                <span class="pill-text">Gastos</span>\n              </button>\n' + mobile_pill
)

# 3. Mobile Bottom Nav Item
bottom_nav = """            <button type="button" class="bottom-nav-item" data-tab="ingresos">
              <span>💸 Ingresos</span>
            </button>
"""
content = content.replace(
    '<button type="button" class="bottom-nav-item" data-tab="gastos">\n              <span>Gastos</span>\n            </button>',
    '<button type="button" class="bottom-nav-item" data-tab="gastos">\n              <span>Gastos</span>\n            </button>\n' + bottom_nav
)

# 4. Pane HTML
pane_html = """
            <!-- PESTAÑA INGRESOS -->
            <div class="doctor-pane-view" data-pane="ingresos" style="display: none; flex-direction: column; gap: 14px;">
              <div class="dashboard-header" style="margin-bottom: 0;">
                <h2 style="font-size: 1.25rem; margin-bottom: 4px;">Mis Ingresos</h2>
                <p style="color: #64748b; font-size: 0.85rem;">Consulta tus ganancias por sede y registra pagos.</p>
              </div>

              <!-- Filtro de Fechas -->
              <div class="form-group">
                <label class="form-label">Rango de Fechas</label>
                <select id="ingresos-date-filter" class="form-input">
                  <option value="hoy">Hoy</option>
                  <option value="semana">Esta Semana</option>
                  <option value="mes">Este Mes</option>
                  <option value="personalizado">Personalizado</option>
                </select>
              </div>

              <!-- Resumen Total -->
              <div class="kpi-grid" id="ingresos-kpi-container" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <!-- Filled via JS -->
              </div>

              <!-- Registro de Pago -->
              <div class="login-card-container" style="padding: 16px;">
                <h3 style="font-size: 1rem; margin-bottom: 12px;">Registrar Pago de Consulta</h3>
                <form id="form-registrar-pago" style="display: flex; flex-direction: column; gap: 10px;">
                  <select id="pago-sede" class="form-input" required>
                    <option value="" disabled selected>Seleccione la sede</option>
                    <option value="mapasingue">Local de Mapasingue</option>
                    <option value="ceibos">Local de Ceibos (Consultorio Privado)</option>
                    <option value="alborada">Último local privado</option>
                    <option value="hospital">Hospital Público</option>
                  </select>
                  <input type="date" id="pago-fecha" class="form-input" required />
                  <input type="number" id="pago-precio" class="form-input" placeholder="Precio de consulta ($)" required step="0.01" />
                  <select id="pago-metodo" class="form-input" required>
                    <option value="" disabled selected>Método de Pago</option>
                    <option value="efectivo">Efectivo</option>
                    <option value="tarjeta">Tarjeta de Crédito (Datafast +9.75%)</option>
                    <option value="otro">Otro</option>
                  </select>
                  <button type="submit" class="btn-primary" style="padding: 10px;">Registrar Ingreso</button>
                </form>
              </div>

              <!-- Lista por Día y Sede -->
              <div id="ingresos-lista" style="display: flex; flex-direction: column; gap: 16px;">
                <!-- Filled via JS -->
              </div>
            </div>
"""
# Insert before <!-- KPI 3: Gastos Operativos Acumulados --> or at the end of the panes.
# We can search for the end of the "gastos" pane, which might be hard. Let's just insert it before the bottom nav.
content = content.replace(
    '<nav class="mobile-bottom-nav">',
    pane_html + '\n          <nav class="mobile-bottom-nav">'
)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Done")
