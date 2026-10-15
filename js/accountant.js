/**
 * Flujo 3: Panel Administrativo de la Contadora (Página 5 del documento)
 * Lcda. Morales - Auditoría Médica & Conciliación Tributaria SRI
 *
 * Módulos integrados:
 * 1. Supervisar flujo de caja diario y semanal con liquidaciones y comisiones (5%, 25%, 10%).
 * 2. Revisar y clasificar gastos operativos en: Ingresos, Egresos, Costos, Gastos, Activos o Patrimonio.
 * 3. Auditar comprobantes y facturas electrónicas SRI (Aprobado, Pendiente, Observado).
 * 4. Analizar rentabilidad por sedes, centros de costos y sugerencias de optimización de rutas.
 * 5. Generar y exportar reportes para declaraciones tributarias (Formulario SRI 102).
 */

import { CLINICS, store } from './state.js';

export function setupAccountantPortal(showToast) {
  const btnExportTax = document.getElementById('btn-export-tax-report');
  const taxModal = document.getElementById('tax-report-modal');
  const btnCloseTaxModal = document.getElementById('btn-close-tax-modal');
  const btnDownloadCSV = document.getElementById('btn-download-csv');

  // --- 1. GESTIÓN DE PESTAÑAS DEL PORTAL CONTABLE ---
  const accountantTabs = document.querySelectorAll('#nav-menu-accountant .nav-tab-btn');
  const accountantPanes = document.querySelectorAll('.accountant-tab-pane');

  function switchAccountantTab(targetTab) {
    accountantTabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.target === targetTab);
    });

    accountantPanes.forEach(pane => {
      pane.style.display = (pane.dataset.pane === targetTab) ? 'block' : 'none';
    });

    renderAccountantDashboard();
  }

  accountantTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      switchAccountantTab(tab.dataset.target);
    });
  });

  // --- ESTADO LOCAL DEL MÓDULO DE BALANCE CONTABLE (Semana 5 - Parte 1) ---
  let activeBalancePeriod = 'SEM-4';
  let isBalanceEventsInitialized = false;

  // --- ESTADO LOCAL DEL MÓDULO DE LIQUIDACIONES SEMANALES (Semana 4 - Parte 4) ---
  let activeSettlementPeriod = 'SEM-4';
  let activeSettlementClinic = 'TODAS';
  let isSettlementEventsInitialized = false;

  // --- 2. RENDER PRINCIPAL DEL PANEL CONTABLE ---
  function renderAccountantDashboard() {
    const summary = store.getFinancialSummary();
    const state = store.getState();

    // 2.1 KPIs Superiores Globales
    const kpiGross = document.getElementById('kpi-gross-revenue');
    const kpiRetentions = document.getElementById('kpi-retentions-total');
    const kpiExpenses = document.getElementById('kpi-expenses-total');
    const kpiNet = document.getElementById('kpi-net-income');

    if (kpiGross) kpiGross.textContent = `$${summary.totalGrossRevenue.toFixed(2)}`;
    if (kpiRetentions) kpiRetentions.textContent = `-$${summary.totalRetentions.toFixed(2)}`;
    if (kpiExpenses) kpiExpenses.textContent = `-$${summary.totalExpenses.toFixed(2)}`;
    if (kpiNet) kpiNet.textContent = `$${summary.realNetIncome.toFixed(2)}`;

    // 2.2 PANE 0: Tablero Contable Consolidado & Balance de Caja (Semana 5 - Parte 1)
    renderAccountingBalanceDashboard(state, summary);

    // 2.3 PANE 1: Motor de Liquidación Semanal por Consultorio (Semana 4 - Parte 4)
    renderWeeklySettlementModule(state, summary);

    // 2.4 PANE 2: Revisión y Clasificación Contable de Gastos
    renderExpensesClassificationModule(state, summary);

    // 2.5 PANE 3: Auditoría de Comprobantes y Facturas SRI
    renderVouchersAuditModule(state);

    // 2.6 PANE 4: Rentabilidad por Sedes, Centros de Costo y Rutas
    renderProfitabilityAndRoutesModule(summary);

    // 2.7 PANE 5: Declaración Tributaria SRI (Formulario 102)
    renderTaxReportModule(summary);
  }

  // --- MÓDULO 0: TABLERO CONTABLE EJECUTIVO & BALANCE DE CAJA (Semana 5 - Parte 1) ---
  function renderAccountingBalanceDashboard(state, summary) {
    const balance = store.getAccountingBalance(activeBalancePeriod);

    // 0.1 Sincronizar selector de período de balance
    const periodSelect = document.getElementById('acc-balance-period-select');
    if (periodSelect && periodSelect.value !== activeBalancePeriod) {
      periodSelect.value = activeBalancePeriod;
    }

    // 0.2 Actualizar las 4 Tarjetas Principales de Balance de Caja
    const kpiRevenue = document.getElementById('bal-kpi-total-revenue');
    const kpiRevenueSub = document.getElementById('bal-kpi-total-revenue-sub');
    const kpiRevenueMicro = document.getElementById('bal-kpi-revenue-micro');

    const kpiRetentions = document.getElementById('bal-kpi-total-retentions');
    const kpiRetentionsSub = document.getElementById('bal-kpi-total-retentions-sub');
    const kpiRetentionsMicro = document.getElementById('bal-kpi-retentions-micro');

    const kpiExpenses = document.getElementById('bal-kpi-total-expenses');
    const kpiExpensesSub = document.getElementById('bal-kpi-total-expenses-sub');
    const kpiExpensesMicro = document.getElementById('bal-kpi-expenses-micro');

    const kpiNetProfit = document.getElementById('bal-kpi-net-profit');
    const kpiNetProfitSub = document.getElementById('bal-kpi-net-profit-sub');
    const kpiProfitMicro = document.getElementById('bal-kpi-profit-micro');

    if (kpiRevenue) kpiRevenue.textContent = `$${balance.totalRevenue.toFixed(2)}`;
    if (kpiRevenueSub) kpiRevenueSub.textContent = `${balance.citasCount} citas registradas • Recargo tarjeta 9.75%`;
    if (kpiRevenueMicro) {
      kpiRevenueMicro.textContent = `Tarifa Base: $${balance.baseRevenue.toFixed(2)} | Recargo Procesadora: +$${balance.totalSurcharges.toFixed(2)}`;
    }

    if (kpiRetentions) kpiRetentions.textContent = `-$${balance.totalCommissions.toFixed(2)}`;
    if (kpiRetentionsSub) kpiRetentionsSub.textContent = `Ceibos (25%), Alborada (10%), Mapasingue (5%)`;
    if (kpiRetentionsMicro) {
      kpiRetentionsMicro.textContent = `Fondo acumulado de comisión por consultorio privado`;
    }

    if (kpiExpenses) kpiExpenses.textContent = `-$${balance.totalExpenses.toFixed(2)}`;
    if (kpiExpensesSub) kpiExpensesSub.textContent = `${balance.gastosCount} comprobantes auditados (transporte/insumos)`;
    if (kpiExpensesMicro) {
      kpiExpensesMicro.textContent = `Taxis/Gasolina: $${balance.expensesByCategory.transporte.toFixed(2)} | Insumos: $${balance.expensesByCategory.insumos.toFixed(2)}`;
    }

    if (kpiNetProfit) {
      kpiNetProfit.textContent = `$${balance.netProfit.toFixed(2)}`;
      kpiNetProfit.style.color = balance.netProfit >= 0 ? '#10b981' : '#dc2626';
    }
    if (kpiNetProfitSub) kpiNetProfitSub.textContent = `(Base de Citas - Retenciones) - Gastos Reembolsados`;
    if (kpiProfitMicro) {
      kpiProfitMicro.textContent = `Margen disponible para tesorería institucional`;
    }

    // 0.3 Badge de estado de conciliación para el período activo
    const badgeContainer = document.getElementById('acc-balance-reconciliation-badge');
    if (badgeContainer) {
      const recRecord = balance.reconciliationHistory.find(r => r.periodKey === activeBalancePeriod);
      if (recRecord) {
        badgeContainer.innerHTML = `<span class="badge-status-pill liquidado" id="badge-balance-reconciled" title="Conciliado formalmente el ${new Date(recRecord.reconciledAt).toLocaleDateString()} por ${recRecord.auditor}">✓ Conciliado SRI (${recRecord.id})</span>`;
      } else {
        badgeContainer.innerHTML = `<span class="badge-status-pill observado" id="badge-balance-reconciled" title="Período pendiente de auditoría y cierre formal">⏳ Período Abierto / Auditoría en Curso</span>`;
      }
    }

    // 0.4 Gráfica 1: Distribución de Ingresos y Margen por Sede
    renderVenueDistributionChart(balance);

    // 0.5 Gráfica 2: Mix de Medios de Pago (Donut SVG Nativo y Leyenda)
    renderPaymentMixDonutChart(balance);

    // 0.6 Historial de Conciliaciones y Cierres de Ejercicio Contable
    renderReconciliationHistoryTable(balance);

    // 0.7 Inicializar eventos interactivos del módulo de balance (una sola vez)
    if (!isBalanceEventsInitialized) {
      setupBalanceDashboardEvents();
      isBalanceEventsInitialized = true;
    }
  }

  // --- SUB-MÓDULO: Gráfica de Distribución de Ingresos por Sede ---
  function renderVenueDistributionChart(balance) {
    const venueChartRoot = document.getElementById('venue-distribution-chart-root');
    const venueBadge = document.getElementById('bal-venue-lead-badge');
    if (!venueChartRoot) return;

    const venues = [
      balance.venueDistribution.ceibos,
      balance.venueDistribution.alborada,
      balance.venueDistribution.mapasingue,
      balance.venueDistribution.hospital
    ];

    // Hallar sede con mejor margen
    let bestMarginVenue = venues[2]; // Default Mapasingue (5% retención = 95% margen)
    venues.forEach(v => {
      if (parseFloat(v.marginRate) > parseFloat(bestMarginVenue.marginRate) && v.gross > 0) {
        bestMarginVenue = v;
      }
    });

    if (venueBadge) {
      venueBadge.textContent = `${bestMarginVenue.name}: ${bestMarginVenue.marginRate}% Margen Neto`;
    }

    venueChartRoot.innerHTML = venues.map(v => {
      const pct = v.percentage || 0;
      const retRatePct = (v.rate * 100).toFixed(0);
      return `
        <div class="venue-bar-row">
          <div class="venue-bar-header">
            <div class="venue-bar-info">
              <span class="venue-bar-name" style="font-weight: 700; color: #1e293b; display: flex; align-items: center; gap: 6px;">
                <span class="venue-color-indicator" style="width: 10px; height: 10px; border-radius: 50%; background: ${v.color};"></span>
                ${v.name}
              </span>
              <span class="badge-sede" style="font-size: 0.68rem; padding: 2px 6px;">${retRatePct}% Retención</span>
              <span style="font-size: 0.72rem; color: #64748b;">${v.count} ${v.count === 1 ? 'cita' : 'citas'}</span>
            </div>
            <div class="venue-bar-figures">
              <span style="font-size: 0.76rem; color: #64748b;">Bruto: <strong style="color: #0f172a;">$${v.gross.toFixed(2)}</strong></span>
              <span style="font-size: 0.76rem; color: #dc2626;">Deducción: <strong>-$${v.retentions.toFixed(2)}</strong></span>
              <span style="font-size: 0.8rem; font-weight: 800; color: #16a34a;">Neto: $${v.net.toFixed(2)} (${v.marginRate}%)</span>
            </div>
          </div>
          <div class="venue-bar-track">
            <div class="venue-bar-fill" style="width: ${Math.min(100, Math.max(pct, pct > 0 ? 5 : 0))}%; background: ${v.color};"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  // --- SUB-MÓDULO: Donut SVG Nativo y Mix de Medios de Pago ---
  function renderPaymentMixDonutChart(balance) {
    const donutSvg = document.getElementById('payment-donut-svg');
    const donutCenterTotal = document.getElementById('donut-center-total');
    const legendRoot = document.getElementById('payment-mix-legend-root');
    const paymentLeadBadge = document.getElementById('bal-payment-lead-badge');

    if (donutCenterTotal) {
      donutCenterTotal.textContent = `$${balance.totalRevenue.toFixed(0)}`;
    }

    const pMix = [
      { key: 'efectivo', ...balance.paymentMix.efectivo },
      { key: 'transferencia', ...balance.paymentMix.transferencia },
      { key: 'tarjeta', ...balance.paymentMix.tarjeta }
    ];

    if (paymentLeadBadge) {
      const highestPay = [...pMix].sort((a, b) => b.totalAmount - a.totalAmount)[0];
      if (highestPay && highestPay.totalAmount > 0) {
        paymentLeadBadge.textContent = `${highestPay.icon} Predominante: ${highestPay.label.split(' ')[0]} (${highestPay.percentage.toFixed(0)}%)`;
      } else {
        paymentLeadBadge.textContent = `Cobro 100% Conciliado`;
      }
    }

    // Dibujar arcos con SVG nativo sin librerías externas pesadas
    if (donutSvg) {
      const radius = 15.91549430918954; // C = 2 * PI * r = 100
      let circlesHtml = `<circle cx="21" cy="21" r="${radius}" fill="transparent" stroke="#f1f5f9" stroke-width="5"></circle>`;
      let accumulatedPct = 0;

      if (balance.totalRevenue > 0) {
        pMix.forEach(item => {
          const pct = item.percentage;
          if (pct > 0) {
            const dashArray = `${pct.toFixed(2)} ${(100 - pct).toFixed(2)}`;
            const dashOffset = (-accumulatedPct).toFixed(2);
            circlesHtml += `
              <circle cx="21" cy="21" r="${radius}" fill="transparent"
                stroke="${item.color}" stroke-width="5"
                stroke-dasharray="${dashArray}"
                stroke-dashoffset="${dashOffset}">
                <title>${item.label}: $${item.totalAmount.toFixed(2)} (${pct.toFixed(1)}%)</title>
              </circle>
            `;
            accumulatedPct += pct;
          }
        });
      } else {
        circlesHtml += `<circle cx="21" cy="21" r="${radius}" fill="transparent" stroke="#cbd5e1" stroke-width="4" stroke-dasharray="100 0"></circle>`;
      }

      donutSvg.innerHTML = circlesHtml;
    }

    // Renderizar leyenda interactiva
    if (legendRoot) {
      legendRoot.innerHTML = pMix.map(item => {
        const surchargeInfo = item.key === 'tarjeta' && item.surchargeAmount > 0
          ? `<span style="font-size: 0.68rem; color: #7c3aed; display: block;">(incluye +$${item.surchargeAmount.toFixed(2)} recargo 9.75%)</span>`
          : '';
        return `
          <div class="payment-mix-legend-item" style="display: flex; align-items: center; justify-content: space-between; padding: 6px 10px; border-radius: 6px; background: #f8fafc; border: 1px solid #e2e8f0;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 1.1rem;">${item.icon}</span>
              <div>
                <span style="font-size: 0.78rem; font-weight: 700; color: #1e293b;">${item.label}</span>
                <span style="font-size: 0.68rem; color: #64748b; margin-left: 4px;">(${item.count} ops)</span>
                ${surchargeInfo}
              </div>
            </div>
            <div style="text-align: right;">
              <span style="font-size: 0.82rem; font-weight: 800; color: #0f172a;">$${item.totalAmount.toFixed(2)}</span>
              <span style="font-size: 0.72rem; color: #64748b; margin-left: 4px;">(${item.percentage.toFixed(1)}%)</span>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  // --- SUB-MÓDULO: Historial de Conciliaciones y Cierres ---
  function renderReconciliationHistoryTable(balance) {
    const tbody = document.getElementById('acc-reconciliation-history-tbody');
    const countBadge = document.getElementById('acc-reconciliation-count-badge');
    const history = balance.reconciliationHistory || [];

    if (countBadge) {
      countBadge.textContent = `${history.length} ${history.length === 1 ? 'Cierre Registrado' : 'Cierres Registrados'}`;
    }

    if (tbody) {
      if (history.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="9" style="text-align: center; padding: 24px; color: #64748b;">
              Sin registros de cierres formales previos. Presiona "🔒 Cierre de Ejercicio / Conciliación" para asentar el primer corte.
            </td>
          </tr>
        `;
      } else {
        tbody.innerHTML = history.map(rec => {
          const d = new Date(rec.reconciledAt);
          const formattedDate = `${d.toLocaleDateString('es-EC')} ${d.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}`;
          return `
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="font-weight: 700; color: #1e293b; font-family: monospace;">${rec.id}</td>
              <td style="font-size: 0.78rem; color: #64748b;">${formattedDate}</td>
              <td><span class="badge-sede badge-ceibos" style="font-size: 0.72rem;">${rec.period}</span></td>
              <td style="text-align: right; font-weight: 700; color: #0f172a;">$${Number(rec.totalRevenue).toFixed(2)}</td>
              <td style="text-align: right; font-weight: 700; color: #dc2626;">-$${Number(rec.totalCommissions).toFixed(2)}</td>
              <td style="text-align: right; font-weight: 700; color: #d97706;">-$${Number(rec.totalExpenses).toFixed(2)}</td>
              <td style="text-align: right; font-weight: 800; color: #16a34a;">$${Number(rec.netProfit).toFixed(2)}</td>
              <td style="font-size: 0.76rem; color: #475569;">${rec.auditor}</td>
              <td><span class="badge-status-pill liquidado" style="font-size: 0.7rem;">✓ ${rec.status || 'CONCILIADO_SRI'}</span></td>
            </tr>
          `;
        }).join('');
      }
    }
  }

  // --- SUB-MÓDULO: Configuración de Eventos del Tablero Contable ---
  function setupBalanceDashboardEvents() {
    // 1. Selector de Rango de Fechas / Período
    const periodSelect = document.getElementById('acc-balance-period-select');
    if (periodSelect) {
      periodSelect.addEventListener('change', (e) => {
        activeBalancePeriod = e.target.value;
        renderAccountingBalanceDashboard(store.getState(), store.getFinancialSummary());
      });
    }

    // 2. Modal de Cierre de Ejercicio / Conciliación
    const btnOpenCierre = document.getElementById('btn-close-accounting-period');
    const modalCierre = document.getElementById('modal-cierre-ejercicio');
    const btnCloseCierre = document.getElementById('btn-close-cierre-modal');
    const btnCancelCierre = document.getElementById('btn-cancel-cierre');
    const btnConfirmCierre = document.getElementById('btn-confirm-cierre');
    const modalCierreBody = document.getElementById('modal-cierre-body');
    const txtObservaciones = document.getElementById('txt-cierre-observaciones');

    function openCierreModal() {
      const balance = store.getAccountingBalance(activeBalancePeriod);
      const periodLabel = periodSelect ? periodSelect.options[periodSelect.selectedIndex].text : activeBalancePeriod;

      if (modalCierreBody) {
        modalCierreBody.innerHTML = `
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px;">
            <div style="font-size: 0.8rem; color: #64748b; font-weight: 700; text-transform: uppercase;">Período a Conciliar:</div>
            <div style="font-size: 1.05rem; font-weight: 800; color: #0f172a; margin-top: 2px;">${periodLabel}</div>
            <div style="font-size: 0.75rem; color: #64748b; margin-top: 4px;">
              Responsable: <strong>Lcda. Patricia Morales (CPA-38491)</strong> • Fecha: <strong>${new Date().toLocaleDateString('es-EC')}</strong>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px;">
              <span style="font-size: 0.74rem; color: #64748b;">Total Ingresos Facturados:</span>
              <div style="font-size: 1.1rem; font-weight: 800; color: #0284c7;">$${balance.totalRevenue.toFixed(2)}</div>
              <span style="font-size: 0.68rem; color: #64748b;">${balance.citasCount} citas registradas</span>
            </div>
            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px;">
              <span style="font-size: 0.74rem; color: #64748b;">Retenciones por Sedes:</span>
              <div style="font-size: 1.1rem; font-weight: 800; color: #6366f1;">-$${balance.totalCommissions.toFixed(2)}</div>
              <span style="font-size: 0.68rem; color: #64748b;">Deducciones por consultorio</span>
            </div>
            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px;">
              <span style="font-size: 0.74rem; color: #64748b;">Gastos Operativos Deducibles:</span>
              <div style="font-size: 1.1rem; font-weight: 800; color: #f59e0b;">-$${balance.totalExpenses.toFixed(2)}</div>
              <span style="font-size: 0.68rem; color: #64748b;">${balance.gastosCount} comprobantes auditados</span>
            </div>
            <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 10px;">
              <span style="font-size: 0.74rem; color: #166534; font-weight: 700;">Balance Neto / Utilidad Operativa:</span>
              <div style="font-size: 1.15rem; font-weight: 900; color: #15803d;">$${balance.netProfit.toFixed(2)}</div>
              <span style="font-size: 0.68rem; color: #166534;">Disponible en tesorería</span>
            </div>
          </div>

          <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 10px 14px; font-size: 0.74rem; color: #1e40af;">
            ℹ️ Al confirmar el cierre, los comprobantes y pagos del período serán bloqueados y marcados formalmente como <strong>AUDITADOS Y CONCILIADOS ANTE EL SRI</strong>.
          </div>
        `;
      }

      if (txtObservaciones) {
        txtObservaciones.value = `Conciliación de caja conforme a extractos bancarios y facturación electrónica autorizada por el SRI sin descuadres para ${periodLabel}.`;
      }

      if (modalCierre) modalCierre.classList.add('active');
    }

    if (btnOpenCierre) btnOpenCierre.addEventListener('click', openCierreModal);
    if (btnCloseCierre) btnCloseCierre.addEventListener('click', () => modalCierre && modalCierre.classList.remove('active'));
    if (btnCancelCierre) btnCancelCierre.addEventListener('click', () => modalCierre && modalCierre.classList.remove('active'));

    if (btnConfirmCierre) {
      btnConfirmCierre.addEventListener('click', () => {
        const obs = txtObservaciones ? txtObservaciones.value : '';
        const rec = store.reconcileAccountingPeriod(activeBalancePeriod, obs);
        if (modalCierre) modalCierre.classList.remove('active');
        showToast(`Cierre formal ${rec.id} registrado y conciliado con éxito ante el SRI.`, 'success');
        renderAccountantDashboard();
      });
    }

    // 3. Modal de Reporte Financiero Completo (CSV / Imprimible)
    const btnOpenReporte = document.getElementById('btn-export-financial-report');
    const modalReporte = document.getElementById('modal-reporte-financiero-imprimible');
    const btnCloseReporte = document.getElementById('btn-close-reporte-modal');
    const btnReporteClose = document.getElementById('btn-reporte-modal-close');
    const btnReporteCSV = document.getElementById('btn-reporte-modal-csv');
    const btnReportePrint = document.getElementById('btn-reporte-modal-print');
    const modalReporteBody = document.getElementById('modal-reporte-body');

    function openReporteModal() {
      const balance = store.getAccountingBalance(activeBalancePeriod);
      const periodLabel = periodSelect ? periodSelect.options[periodSelect.selectedIndex].text : activeBalancePeriod;

      if (modalReporteBody) {
        modalReporteBody.innerHTML = `
          <div class="acta-sheet" style="font-family: inherit; color: #0f172a; padding: 12px 16px;">
            <!-- Cabecera Institucional Oficial -->
            <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 14px;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 2.2rem;">🩺</span>
                <div>
                  <h2 style="font-size: 1.25rem; font-weight: 800; margin: 0; color: #0f172a;">MONTEPIEDRA SALUD</h2>
                  <p style="font-size: 0.76rem; color: #64748b; margin: 2px 0 0 0;">Red de Atención Médica Integral • Departamento de Contabilidad y Auditoría Fiscal</p>
                  <p style="font-size: 0.72rem; color: #64748b; margin: 1px 0 0 0;">RUC: 0992384712001 • Guayaquil, Ecuador</p>
                </div>
              </div>
              <div style="text-align: right;">
                <div style="display: inline-block; background: #f0fdf4; border: 1px solid #86efac; color: #166534; font-weight: 800; font-size: 0.75rem; padding: 4px 8px; border-radius: 6px;">
                  INFORME CONTABLE OFICIAL SRI
                </div>
                <div style="font-size: 0.74rem; color: #64748b; margin-top: 4px;">Fecha: ${new Date().toLocaleDateString('es-EC')} ${new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}</div>
                <div style="font-size: 0.72rem; color: #64748b;">Período: <strong>${periodLabel}</strong></div>
              </div>
            </div>

            <!-- Resumen de 4 Balances de Caja -->
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px;">
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px;">
                <span style="font-size: 0.7rem; color: #64748b; text-transform: uppercase; font-weight: 700;">Ingresos Brutos:</span>
                <div style="font-size: 1.05rem; font-weight: 800; color: #0284c7;">$${balance.totalRevenue.toFixed(2)}</div>
                <span style="font-size: 0.66rem; color: #64748b;">${balance.citasCount} consultas atendidas</span>
              </div>
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px;">
                <span style="font-size: 0.7rem; color: #64748b; text-transform: uppercase; font-weight: 700;">Retenciones Sedes:</span>
                <div style="font-size: 1.05rem; font-weight: 800; color: #6366f1;">-$${balance.totalCommissions.toFixed(2)}</div>
                <span style="font-size: 0.66rem; color: #64748b;">Ceibos/Alborada/Mapasingue</span>
              </div>
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px;">
                <span style="font-size: 0.7rem; color: #64748b; text-transform: uppercase; font-weight: 700;">Gastos Deducibles:</span>
                <div style="font-size: 1.05rem; font-weight: 800; color: #f59e0b;">-$${balance.totalExpenses.toFixed(2)}</div>
                <span style="font-size: 0.66rem; color: #64748b;">${balance.gastosCount} egresos validados</span>
              </div>
              <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 10px;">
                <span style="font-size: 0.7rem; color: #166534; text-transform: uppercase; font-weight: 800;">Utilidad Operativa:</span>
                <div style="font-size: 1.15rem; font-weight: 900; color: #15803d;">$${balance.netProfit.toFixed(2)}</div>
                <span style="font-size: 0.66rem; color: #166534;">Excedente líquido</span>
              </div>
            </div>

            <!-- Tabla 1: Desglose por Sede -->
            <h4 style="font-size: 0.88rem; margin: 12px 0 6px 0; color: #0f172a;">1. Desglose de Rendimiento por Sedes y Consultorios</h4>
            <table style="width: 100%; border-collapse: collapse; font-size: 0.76rem; margin-bottom: 14px;">
              <thead>
                <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
                  <th style="padding: 6px 8px; text-align: left;">Sede / Consultorio</th>
                  <th style="padding: 6px 8px; text-align: center;">Tasa Retención</th>
                  <th style="padding: 6px 8px; text-align: right;">Ingreso Bruto</th>
                  <th style="padding: 6px 8px; text-align: right;">Retención Sede</th>
                  <th style="padding: 6px 8px; text-align: right;">Neto Doctor</th>
                  <th style="padding: 6px 8px; text-align: center;">Citas</th>
                  <th style="padding: 6px 8px; text-align: right;">Margen</th>
                </tr>
              </thead>
              <tbody>
                ${Object.values(balance.venueDistribution).map(v => `
                  <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 6px 8px; font-weight: 700;">${v.name}</td>
                    <td style="padding: 6px 8px; text-align: center;">${(v.rate * 100).toFixed(0)}%</td>
                    <td style="padding: 6px 8px; text-align: right;">$${v.gross.toFixed(2)}</td>
                    <td style="padding: 6px 8px; text-align: right; color: #dc2626;">-$${v.retentions.toFixed(2)}</td>
                    <td style="padding: 6px 8px; text-align: right; font-weight: 700; color: #16a34a;">$${v.net.toFixed(2)}</td>
                    <td style="padding: 6px 8px; text-align: center;">${v.count}</td>
                    <td style="padding: 6px 8px; text-align: right;">${v.marginRate}%</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <!-- Tabla 2: Mix de Medios de Pago -->
            <h4 style="font-size: 0.88rem; margin: 12px 0 6px 0; color: #0f172a;">2. Mix de Medios de Pago y Cobranza</h4>
            <table style="width: 100%; border-collapse: collapse; font-size: 0.76rem; margin-bottom: 14px;">
              <thead>
                <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
                  <th style="padding: 6px 8px; text-align: left;">Medio de Pago</th>
                  <th style="padding: 6px 8px; text-align: center;">Operaciones</th>
                  <th style="padding: 6px 8px; text-align: right;">Base Imponible</th>
                  <th style="padding: 6px 8px; text-align: right;">Recargo Procesadora (9.75%)</th>
                  <th style="padding: 6px 8px; text-align: right;">Total Facturado</th>
                  <th style="padding: 6px 8px; text-align: right;">% del Mix</th>
                </tr>
              </thead>
              <tbody>
                ${Object.values(balance.paymentMix).map(p => `
                  <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 6px 8px; font-weight: 700;">${p.icon} ${p.label}</td>
                    <td style="padding: 6px 8px; text-align: center;">${p.count}</td>
                    <td style="padding: 6px 8px; text-align: right;">$${p.baseAmount.toFixed(2)}</td>
                    <td style="padding: 6px 8px; text-align: right; color: #7c3aed;">+$${p.surchargeAmount ? p.surchargeAmount.toFixed(2) : '0.00'}</td>
                    <td style="padding: 6px 8px; text-align: right; font-weight: 800;">$${p.totalAmount.toFixed(2)}</td>
                    <td style="padding: 6px 8px; text-align: right;">${p.percentage.toFixed(1)}%</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <!-- Certificación de Auditoría y Firmas Oficiales -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-top: 28px; padding-top: 10px;">
              <div style="text-align: center; border-top: 1px dashed #94a3b8; padding-top: 8px;">
                <div style="font-size: 0.82rem; font-weight: 800; color: #0f172a;">Lcda. Patricia Morales</div>
                <div style="font-size: 0.72rem; color: #64748b;">Auditora Contable Externa • CPA Reg. 38491</div>
                <div style="font-size: 0.68rem; color: #059669; font-weight: 700; margin-top: 2px;">✓ Sello de Certificación SRI Homologado</div>
              </div>
              <div style="text-align: center; border-top: 1px dashed #94a3b8; padding-top: 8px;">
                <div style="font-size: 0.82rem; font-weight: 800; color: #0f172a;">Dr. Carlos Campoverde</div>
                <div style="font-size: 0.72rem; color: #64748b;">Médico Titular • MSP Reg. 09182374</div>
                <div style="font-size: 0.68rem; color: #2563eb; font-weight: 700; margin-top: 2px;">Conforme con Liquidación Semanal</div>
              </div>
            </div>
          </div>
        `;
      }

      if (modalReporte) modalReporte.classList.add('active');
    }

    if (btnOpenReporte) btnOpenReporte.addEventListener('click', openReporteModal);
    if (btnCloseReporte) btnCloseReporte.addEventListener('click', () => modalReporte && modalReporte.classList.remove('active'));
    if (btnReporteClose) btnReporteClose.addEventListener('click', () => modalReporte && modalReporte.classList.remove('active'));

    if (btnReporteCSV) {
      btnReporteCSV.addEventListener('click', () => {
        const balance = store.getAccountingBalance(activeBalancePeriod);
        downloadFinancialReportCSV(balance);
        showToast('Reporte financiero exportado en formato CSV exitosamente.', 'success');
      });
    }

    if (btnReportePrint) {
      btnReportePrint.addEventListener('click', () => {
        window.print();
      });
    }
  }

  // --- SUB-MÓDULO: Descarga de Archivo CSV de Balance Contable ---
  function downloadFinancialReportCSV(balance) {
    let csv = "data:text/csv;charset=utf-8,";
    csv += "=== REPORTE FINANCIERO Y BALANCE DE CAJA - MONTEPIEDRA SALUD ===\r\n";
    csv += `PERIODO:,"${balance.periodKey}"\r\n`;
    csv += `FECHA DE EMISION:,"${new Date().toLocaleString('es-EC')}"\r\n`;
    csv += `AUDITORA:,"Lcda. Patricia Morales (CPA-38491)"\r\n\r\n`;
    csv += "--- CONSOLIDADO DE BALANCE DE CAJA ---\r\n";
    csv += `TOTAL INGRESOS FACTURADOS:,$${balance.totalRevenue.toFixed(2)}\r\n`;
    csv += `TARIFA BASE CONSULTAS:,$${balance.baseRevenue.toFixed(2)}\r\n`;
    csv += `RECARGOS PROCESADORA (9.75%):,$${balance.totalSurcharges.toFixed(2)}\r\n`;
    csv += `TOTAL RETENCIONES POR SEDES:,-$${balance.totalCommissions.toFixed(2)}\r\n`;
    csv += `TOTAL GASTOS DEDUCIBLES REEMBOLSADOS:,-$${balance.totalExpenses.toFixed(2)}\r\n`;
    csv += `BALANCE NETO DE CAJA / UTILIDAD OPERATIVA:,$${balance.netProfit.toFixed(2)}\r\n\r\n`;

    csv += "--- DESGLOSE POR SEDE Y CONSULTORIO ---\r\n";
    csv += "SEDE,TASA_RETENCION,TOTAL_BRUTO,TOTAL_RETENCIONES,NETO_FINAL,CITAS_ATENDIDAS,MARGEN_NETO\r\n";
    Object.values(balance.venueDistribution).forEach(v => {
      csv += `"${v.name}",${(v.rate * 100).toFixed(0)}%,$${v.gross.toFixed(2)},-$${v.retentions.toFixed(2)},$${v.net.toFixed(2)},${v.count},${v.marginRate}%\r\n`;
    });
    csv += "\r\n";

    csv += "--- MIX DE MEDIOS DE PAGO ---\r\n";
    csv += "MEDIO_PAGO,OPERACIONES,BASE_IMPONIBLE,RECARGO_BANCARIO,TOTAL_FACTURADO,PORCENTAJE\r\n";
    Object.values(balance.paymentMix).forEach(p => {
      const sur = p.surchargeAmount ? p.surchargeAmount.toFixed(2) : '0.00';
      csv += `"${p.label}",${p.count},$${p.baseAmount.toFixed(2)},$${sur},$${p.totalAmount.toFixed(2)},${p.percentage.toFixed(1)}%\r\n`;
    });
    csv += "\r\n";

    csv += "--- DETALLE DE ATENCIONES MEDICAS CONCILIADAS ---\r\n";
    csv += "FECHA,ID,PACIENTE,SEDE,MEDIO_PAGO,BASE,RECARGO,TOTAL_PAGADO,RETENCION,NETO_MEDICO,ESTADO\r\n";
    balance.appointments.forEach(a => {
      const clinic = CLINICS[a.clinicId] || { name: a.clinicId };
      const base = Number(a.basePrice != null ? a.basePrice : 20.00);
      const fee = Number(a.feeAmount != null ? a.feeAmount : (a.paymentMethod === 'tarjeta' ? base * 0.0975 : 0));
      const paid = Number(a.totalPaid != null ? a.totalPaid : (base + fee));
      const ret = Number(a.retentionAmount != null ? a.retentionAmount : 0);
      const net = base - ret;
      csv += `"${a.date}","${a.id}","${a.patientName}","${clinic.name}","${a.paymentMethod || 'efectivo'}",$${base.toFixed(2)},$${fee.toFixed(2)},$${paid.toFixed(2)},-$${ret.toFixed(2)},$${net.toFixed(2)},"${a.settlementStatus || 'Auditado'}"\r\n`;
    });
    csv += "\r\n";

    csv += "--- DETALLE DE GASTOS OPERATIVOS DEDUCIBLES ---\r\n";
    csv += "FECHA,ID,DESCRIPCION,CATEGORIA,MONTO,CENTRO_COSTOS,ESTADO_AUDITORIA\r\n";
    balance.expenses.forEach(e => {
      const amt = Number(e.amount || e.monto || 0);
      csv += `"${e.date || ''}","${e.id || ''}","${e.description || e.descripcion || ''}","${e.category || e.tipoGasto || ''}",-$${amt.toFixed(2)},"${e.costCenter || ''}","${e.auditStatus || 'Aprobado'}"\r\n`;
    });

    const encodedUri = encodeURI(csv);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Reporte_Financiero_Balance_${balance.periodKey}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // --- MÓDULO 1: Motor de Liquidación Semanal con Deducción Automática por Consultorio ---
  function renderWeeklySettlementModule(state, summary) {
    const calc = store.calculateWeeklySettlement(activeSettlementPeriod, activeSettlementClinic);

    // 1.1 Sincronizar selectores si no fueron cambiados por el usuario
    const periodSelect = document.getElementById('acc-settlement-period-select');
    if (periodSelect && periodSelect.value !== activeSettlementPeriod) {
      periodSelect.value = activeSettlementPeriod;
    }

    const clinicSelect = document.getElementById('acc-settlement-clinic-select');
    if (clinicSelect && clinicSelect.value !== activeSettlementClinic) {
      clinicSelect.value = activeSettlementClinic;
    }

    // 1.2 Métricas Clave de la Semana (4 KPI Cards)
    const kpiWeeklyGross = document.getElementById('acc-weekly-gross');
    const kpiWeeklyGrossSub = document.getElementById('acc-weekly-gross-sub');
    const kpiWeeklyRetentions = document.getElementById('acc-weekly-retentions');
    const kpiWeeklyRetentionsSub = document.getElementById('acc-weekly-retentions-sub');
    const kpiWeeklyExpenses = document.getElementById('acc-weekly-expenses');
    const kpiWeeklyExpensesSub = document.getElementById('acc-weekly-expenses-sub');
    const kpiWeeklyNet = document.getElementById('acc-weekly-net');
    const weeklyCountBadge = document.getElementById('acc-weekly-count-badge');

    if (kpiWeeklyGross) kpiWeeklyGross.textContent = `$${calc.ingresosBrutos.toFixed(2)}`;
    if (kpiWeeklyGrossSub) kpiWeeklyGrossSub.textContent = `${calc.citasCount} ${calc.citasCount === 1 ? 'consulta atendida' : 'consultas atendidas'}`;

    if (kpiWeeklyRetentions) kpiWeeklyRetentions.textContent = `-$${calc.totalRetenciones.toFixed(2)}`;
    if (kpiWeeklyRetentionsSub) {
      kpiWeeklyRetentionsSub.textContent = `Ceibos: -$${calc.deduccionesSede.ceibos.toFixed(2)} | Alb: -$${calc.deduccionesSede.alborada.toFixed(2)} | Map: -$${calc.deduccionesSede.mapasingue.toFixed(2)}`;
    }

    if (kpiWeeklyExpenses) kpiWeeklyExpenses.textContent = `-$${calc.gastosOperativos.toFixed(2)}`;
    if (kpiWeeklyExpensesSub) kpiWeeklyExpensesSub.textContent = `${calc.gastosCount} egresos deducibles (Semana 3)`;

    if (kpiWeeklyNet) kpiWeeklyNet.textContent = `$${calc.netoAPagar.toFixed(2)}`;
    if (weeklyCountBadge) {
      weeklyCountBadge.textContent = `${calc.citasCount} ${calc.citasCount === 1 ? 'Consulta Registrada' : 'Consultas Registradas'}`;
    }

    // 1.3 Badge de Estado y Botón de Cierre
    const badgeStateEl = document.getElementById('acc-badge-settlement-state');
    const btnCloseSettlement = document.getElementById('btn-acc-close-settlement');

    if (badgeStateEl) {
      if (calc.estado === 'liquidada') {
        const dateStr = calc.fechaCorte ? new Date(calc.fechaCorte).toLocaleDateString('es-EC') : 'Aprobada';
        badgeStateEl.className = 'badge-status-pill liquidado';
        badgeStateEl.innerHTML = `✓ Liquidada (${dateStr})`;
      } else {
        badgeStateEl.className = 'badge-status-pill pendiente';
        badgeStateEl.innerHTML = '⏳ Pendiente de Corte';
      }
    }

    if (btnCloseSettlement) {
      if (calc.estado === 'liquidada') {
        btnCloseSettlement.innerHTML = '✓ Liquidación Aprobada';
        btnCloseSettlement.style.opacity = '0.7';
        btnCloseSettlement.title = 'Esta liquidación ya fue aprobada y no admite duplicidad';
      } else {
        btnCloseSettlement.innerHTML = '🔒 Cerrar y Aprobar Liquidación';
        btnCloseSettlement.style.opacity = '1';
        btnCloseSettlement.title = 'Cerrar formalmente el corte semanal e impedir duplicidad';
      }
    }

    // 1.4 Tabla de Resumen por Sede (Friday Settlement Table)
    const fridayTbody = document.getElementById('friday-settlement-table-body');
    if (fridayTbody) {
      const breakdown = calc.clinicBreakdown || summary.clinicBreakdown;
      fridayTbody.innerHTML = Object.keys(breakdown).map(clinicKey => {
        const cData = breakdown[clinicKey];
        const clinic = CLINICS[clinicKey] || { color: '#0284c7' };
        const isHospital = clinicKey === 'hospital';

        let badgeHtml = '';
        if (isHospital) {
          badgeHtml = `<span class="badge-status-pill sueldo-fijo">🏛️ 0% Convenio</span>`;
        } else if (calc.estado === 'liquidada' || cData.status === 'Liquidado') {
          badgeHtml = `<span class="badge-status-pill liquidado">✓ Liquidado</span>`;
        } else {
          badgeHtml = `<span class="badge-status-pill pendiente">⏳ Pendiente</span>`;
        }

        const pct = (cData.rate * 100).toFixed(0);

        return `
          <tr>
            <td>
              <strong style="color: #0f172a; display: flex; align-items: center; gap: 8px;">
                <span style="width: 10px; height: 10px; border-radius: 50%; background: ${clinic.color};"></span>
                ${cData.name}
              </strong>
            </td>
            <td>${cData.count} citas</td>
            <td>$${cData.gross.toFixed(2)}</td>
            <td style="color: #b91c1c; font-weight: 700;">-$${cData.retentions.toFixed(2)} (${pct}%)</td>
            <td style="font-weight: 800; color: #0284c7;">$${cData.netDoctor.toFixed(2)}</td>
            <td>${badgeHtml}</td>
          </tr>
        `;
      }).join('');
    }

    // 1.5 TABLA DESGLOSADA DE LIQUIDACIÓN SEMANAL
    const weeklyTbody = document.getElementById('acc-weekly-settlement-table-body');
    const weeklyTfoot = document.getElementById('acc-weekly-settlement-table-foot');

    if (weeklyTbody) {
      if (calc.citas.length === 0) {
        weeklyTbody.innerHTML = `
          <tr>
            <td colspan="7" style="text-align: center; padding: 24px; color: #64748b;">
              No hay citas atendidas registradas para ${calc.periodInfo.name} con el filtro "${activeSettlementClinic}".
            </td>
          </tr>
        `;
      } else {
        weeklyTbody.innerHTML = calc.citas.map(c => {
          let badgeClass = 'badge-hospital';
          if (c.clinicId === 'ceibos') badgeClass = 'badge-ceibos';
          else if (c.clinicId === 'alborada') badgeClass = 'badge-alborada';
          else if (c.clinicId === 'mapasingue') badgeClass = 'badge-mapasingue';

          const payLabel = c.paymentMethod === 'tarjeta' ? '💳 Tarjeta' : '💵 Efectivo';

          return `
            <tr>
              <td>
                <span style="font-weight: 600; color: #1e293b;">${c.date}</span>
                <div style="font-size: 0.72rem; color: #64748b;">${c.time}</div>
              </td>
              <td>
                <strong style="color: #0f172a;">${c.patientName}</strong>
                <div style="font-size: 0.72rem; color: #64748b;">C.I. ${c.patientId} • ID: ${c.code}</div>
              </td>
              <td>
                <span style="display: inline-flex; align-items: center; gap: 6px; font-weight: 700; color: #0f172a; font-size: 0.8rem;">
                  <span style="width: 8px; height: 8px; border-radius: 50%; background: ${c.clinicColor};"></span>
                  ${c.clinicName}
                </span>
                <div style="font-size: 0.70rem; color: #64748b;">${payLabel}</div>
              </td>
              <td style="text-align: right; font-weight: 700; color: #0f172a;">$${c.basePrice.toFixed(2)}</td>
              <td style="text-align: center;">
                <span class="badge-sede ${badgeClass}" style="font-size: 0.74rem;">${c.retentionPct}%</span>
              </td>
              <td style="text-align: right; font-weight: 700; color: #dc2626;">-$${c.retentionAmount.toFixed(2)}</td>
              <td style="text-align: right; font-weight: 800; color: #059669;">+$${c.netDoctor.toFixed(2)}</td>
            </tr>
          `;
        }).join('');
      }
    }

    if (weeklyTfoot) {
      const totalNetoConsultas = calc.ingresosBrutos - calc.totalRetenciones;
      weeklyTfoot.innerHTML = `
        <tr>
          <td colspan="3" style="padding: 12px 10px; font-weight: 900; color: #0f172a;">
            TOTALES DE LA SEMANA (${calc.citasCount} citas)
          </td>
          <td style="text-align: right; padding: 12px 10px; font-weight: 900; color: #0f172a;">
            $${calc.ingresosBrutos.toFixed(2)}
          </td>
          <td style="text-align: center; padding: 12px 10px; font-weight: 700; color: #64748b; font-size: 0.76rem;">
            Deducción Sede
          </td>
          <td style="text-align: right; padding: 12px 10px; font-weight: 900; color: #dc2626;">
            -$${calc.totalRetenciones.toFixed(2)}
          </td>
          <td style="text-align: right; padding: 12px 10px; font-weight: 900; color: #059669; font-size: 0.95rem;">
            +$${totalNetoConsultas.toFixed(2)}
          </td>
        </tr>
      `;
    }

    // 1.6 Event Listeners del Módulo de Liquidación Semanal
    if (!isSettlementEventsInitialized) {
      isSettlementEventsInitialized = true;

      const selPeriod = document.getElementById('acc-settlement-period-select');
      if (selPeriod) {
        selPeriod.addEventListener('change', (e) => {
          activeSettlementPeriod = e.target.value;
          renderAccountantDashboard();
        });
      }

      const selClinic = document.getElementById('acc-settlement-clinic-select');
      if (selClinic) {
        selClinic.addEventListener('change', (e) => {
          activeSettlementClinic = e.target.value;
          renderAccountantDashboard();
        });
      }

      const btnClose = document.getElementById('btn-acc-close-settlement');
      if (btnClose) {
        btnClose.addEventListener('click', () => {
          const currentCalc = store.calculateWeeklySettlement(activeSettlementPeriod, activeSettlementClinic);
          if (currentCalc.estado === 'liquidada') {
            showToast('Esta liquidación ya fue formalmente aprobada y liquidada. No se permite duplicidad de pagos.', 'warning');
            return;
          }

          store.closeAndApproveSettlement(activeSettlementPeriod, currentCalc);
          showToast(`Liquidación ${currentCalc.periodInfo.name} cerrada y aprobada formalmente. Corte registrado.`, 'success');
          renderAccountantDashboard();
        });
      }

      const btnActa = document.getElementById('btn-acc-generate-acta');
      if (btnActa) {
        btnActa.addEventListener('click', () => {
          const currentCalc = store.calculateWeeklySettlement(activeSettlementPeriod, activeSettlementClinic);
          openActaSettlementModal(currentCalc);
        });
      }
    }
  }

  // --- 1.7 MODAL DE ACTA OFICIAL DE CORTE SEMANAL ---
  function openActaSettlementModal(calc) {
    const modal = document.getElementById('acta-settlement-modal');
    const modalBody = document.getElementById('acta-settlement-modal-body');
    const btnClose = document.getElementById('btn-close-acta-modal');
    const btnPrintClose = document.getElementById('btn-print-acta-close');
    const btnPrintDirect = document.getElementById('btn-print-acta-direct');

    if (!modal || !modalBody) return;

    const fechaEmision = new Date().toLocaleString('es-EC', { dateStyle: 'full', timeStyle: 'short' });
    const totalNetoConsultas = calc.ingresosBrutos - calc.totalRetenciones;

    modalBody.innerHTML = `
      <div class="acta-document-sheet">
        <!-- Membrete Institucional -->
        <div class="acta-header-letterhead">
          <div>
            <h3 class="acta-brand-title">MONTEPIEDRA SALUD S.A.</h3>
            <div class="acta-brand-subtitle">Red Integral de Atención Médica Multisede • Auditoría Contable y Tributaria</div>
            <div style="font-size: 0.72rem; color: #64748b; margin-top: 2px;">RUC: 0993847291001 • Autorización MSP / SRI Ecuador</div>
          </div>
          <div class="acta-meta-badge">
            <strong style="color: #0284c7; font-size: 0.9rem;">ACTA #ACTA-${calc.periodKey}-2026</strong><br>
            <span>Emisión: ${fechaEmision}</span><br>
            <span class="badge-status-pill ${calc.estado === 'liquidada' ? 'liquidado' : 'pendiente'}" style="margin-top: 4px; display: inline-block;">
              ${calc.estado === 'liquidada' ? '✓ LIQUIDACIÓN APROBADA' : '⏳ EN REVISIÓN'}
            </span>
          </div>
        </div>

        <!-- Metadatos de Partes Contractuales -->
        <div class="acta-info-grid">
          <div class="acta-info-block">
            <strong>MÉDICO TITULAR:</strong><br>
            <span>Dr. Carlos Campoverde</span><br>
            <span>Cédula: 0930860044 • Reg. MSP: MSP-REG-84729</span><br>
            <span>Especialidad: Medicina General</span>
          </div>
          <div class="acta-info-block">
            <strong>AUDITORA RESPONSABLE:</strong><br>
            <span>Lcda. Patricia Morales</span><br>
            <span>Cédula: 0912345678 • Reg. Contable: CPA-38491</span><br>
            <span>Período: ${calc.periodInfo.name}</span>
          </div>
        </div>

        <!-- 1. Desglose de Consultas y Retenciones por Sede -->
        <div>
          <h4 style="margin: 0 0 8px 0; font-size: 0.9rem; color: #0f172a; font-weight: 800;">
            1. Desglose de Consultas Atendidas y Deducciones Contractuales por Sede
          </h4>
          <table class="acta-table">
            <thead>
              <tr>
                <th>Sede / Consultorio</th>
                <th style="text-align: center;">Citas</th>
                <th style="text-align: right;">Tarifa Base Facturada</th>
                <th style="text-align: center;">% Retención Sede</th>
                <th style="text-align: right;">Deducción Clínica ($)</th>
                <th style="text-align: right;">Neto Médico ($)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Clínica Ceibos</strong></td>
                <td style="text-align: center;">${calc.clinicBreakdown.ceibos.count}</td>
                <td style="text-align: right;">$${calc.clinicBreakdown.ceibos.gross.toFixed(2)}</td>
                <td style="text-align: center; color: #6366f1; font-weight: 700;">25%</td>
                <td style="text-align: right; color: #dc2626; font-weight: 700;">-$${calc.clinicBreakdown.ceibos.retentions.toFixed(2)}</td>
                <td style="text-align: right; font-weight: 800; color: #0f172a;">$${calc.clinicBreakdown.ceibos.netDoctor.toFixed(2)}</td>
              </tr>
              <tr>
                <td><strong>Consultorio Alborada</strong></td>
                <td style="text-align: center;">${calc.clinicBreakdown.alborada.count}</td>
                <td style="text-align: right;">$${calc.clinicBreakdown.alborada.gross.toFixed(2)}</td>
                <td style="text-align: center; color: #10b981; font-weight: 700;">10%</td>
                <td style="text-align: right; color: #dc2626; font-weight: 700;">-$${calc.clinicBreakdown.alborada.retentions.toFixed(2)}</td>
                <td style="text-align: right; font-weight: 800; color: #0f172a;">$${calc.clinicBreakdown.alborada.netDoctor.toFixed(2)}</td>
              </tr>
              <tr>
                <td><strong>Consultorio Mapasingue</strong></td>
                <td style="text-align: center;">${calc.clinicBreakdown.mapasingue.count}</td>
                <td style="text-align: right;">$${calc.clinicBreakdown.mapasingue.gross.toFixed(2)}</td>
                <td style="text-align: center; color: #0284c7; font-weight: 700;">5%</td>
                <td style="text-align: right; color: #dc2626; font-weight: 700;">-$${calc.clinicBreakdown.mapasingue.retentions.toFixed(2)}</td>
                <td style="text-align: right; font-weight: 800; color: #0f172a;">$${calc.clinicBreakdown.mapasingue.netDoctor.toFixed(2)}</td>
              </tr>
              <tr>
                <td><strong>Hospital Público Ceibos</strong></td>
                <td style="text-align: center;">${calc.clinicBreakdown.hospital.count}</td>
                <td style="text-align: right;">$0.00</td>
                <td style="text-align: center; color: #f59e0b; font-weight: 700;">0%</td>
                <td style="text-align: right;">$0.00</td>
                <td style="text-align: right; font-weight: 800; color: #0f172a;">$0.00</td>
              </tr>
            </tbody>
            <tfoot>
              <tr style="background: #f8fafc; font-weight: 800; border-top: 2px solid #cbd5e1;">
                <td>SUBTOTAL CONSULTAS</td>
                <td style="text-align: center;">${calc.citasCount}</td>
                <td style="text-align: right;">$${calc.ingresosBrutos.toFixed(2)}</td>
                <td style="text-align: center;">-</td>
                <td style="text-align: right; color: #dc2626;">-$${calc.totalRetenciones.toFixed(2)}</td>
                <td style="text-align: right; color: #059669;">$${totalNetoConsultas.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- 2. Deducciones por Gastos Operativos de Movilidad e Insumos (Semana 3) -->
        <div>
          <h4 style="margin: 0 0 8px 0; font-size: 0.9rem; color: #0f172a; font-weight: 800;">
            2. Gastos Operativos de Traslado e Insumos Médicos Aplicados (Semana 3)
          </h4>
          <table class="acta-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Concepto / Proveedor</th>
                <th>Centro de Costo</th>
                <th style="text-align: right;">Comprobante</th>
                <th style="text-align: right;">Monto Deducible ($)</th>
              </tr>
            </thead>
            <tbody>
              ${calc.gastos.length === 0 ? `
                <tr><td colspan="5" style="text-align: center; color: #64748b; padding: 10px;">No se registraron gastos operativos deducibles en el período.</td></tr>
              ` : calc.gastos.map(g => `
                <tr>
                  <td>${g.date}</td>
                  <td>${g.description || g.motivo || 'Gasto Operativo'}</td>
                  <td>${g.costCenter || g.sedeCodigo || 'Ruta Multisede'}</td>
                  <td style="text-align: right;"><code style="font-size: 0.72rem;">${g.numeroComprobante || g.voucherNumber || 'VAL-S/N'}</code></td>
                  <td style="text-align: right; font-weight: 700; color: #b91c1c;">-$${Number(g.amount || g.monto).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr style="background: #f8fafc; font-weight: 800; border-top: 1px solid #cbd5e1;">
                <td colspan="4">TOTAL GASTOS OPERATIVOS DEDUCIBLES</td>
                <td style="text-align: right; color: #b91c1c;">-$${calc.gastosOperativos.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- 3. Liquidación Neta Final -->
        <div class="acta-summary-box">
          <div>
            <div class="summary-label">HONORARIOS NETOS A TRANSFERIR AL PROFESIONAL MÉDICO:</div>
            <div style="font-size: 0.75rem; color: #166534; margin-top: 2px;">
              Fórmula: (Ingresos Brutos $${calc.ingresosBrutos.toFixed(2)} - Retenciones Sede $${calc.totalRetenciones.toFixed(2)}) - Gastos Deducibles $${calc.gastosOperativos.toFixed(2)}
            </div>
          </div>
          <div class="summary-amount">$${calc.netoAPagar.toFixed(2)}</div>
        </div>

        <div style="font-size: 0.74rem; color: #64748b; line-height: 1.4;">
          <strong>Declaración de Conformidad:</strong> Las partes suscriben la presente acta en señal de total aceptación respecto de los valores liquidados, comisiones retenidas y gastos auditados conforme a los contratos de prestación de servicios médicos vigentes y resoluciones tributarias del Servicio de Rentas Internas (SRI).
        </div>

        <!-- Firmas Oficiales -->
        <div class="acta-signatures-row">
          <div class="acta-signature-box">
            <div style="font-family: 'Brush Script MT', cursive, sans-serif; font-size: 1.6rem; color: #1e3a8a; height: 38px;">
              Dr. C. Campoverde
            </div>
            <div class="signer-title">DR. CARLOS CAMPOVERDE</div>
            <div class="signer-sub">Médico Titular • C.I. 0930860044<br>Registro MSP: 84729</div>
          </div>

          <div class="acta-signature-box">
            <div style="font-family: 'Brush Script MT', cursive, sans-serif; font-size: 1.6rem; color: #047857; height: 38px;">
              Lcda. P. Morales
            </div>
            <div class="signer-title">LCDA. PATRICIA MORALES</div>
            <div class="signer-sub">Auditora Contable & Conciliación Fiscal SRI<br>C.I. 0912345678 • Montepiedra Salud</div>
          </div>
        </div>
      </div>
    `;

    modal.classList.add('active');

    const closeModal = () => modal.classList.remove('active');
    if (btnClose) btnClose.onclick = closeModal;
    if (btnPrintClose) btnPrintClose.onclick = closeModal;
    if (btnPrintDirect) btnPrintDirect.onclick = () => window.print();
  }

  // --- MÓDULO 2: Revisar y Clasificar Gastos Operativos ---
  function renderExpensesClassificationModule(state, summary) {
    // Resumen de Clasificación (Chips de totales)
    const chipsRoot = document.getElementById('acc-classification-summary-chips');
    if (chipsRoot) {
      const totals = summary.accountingClassificationTotals || {
        Costos: 32.00,
        Gastos: 42.50,
        Egresos: 0.00,
        Activos: 0.00,
        Patrimonio: 0.00,
        Ingresos: 0.00
      };

      const categoriesInfo = [
        { key: 'Costos', label: 'Costos Médicos', icon: '🩺', color: '#ea580c', bg: '#fff7ed' },
        { key: 'Gastos', label: 'Gastos Ruta/Movilidad', icon: '⛽', color: '#7c3aed', bg: '#f5f3ff' },
        { key: 'Egresos', label: 'Egresos Operacionales', icon: '📉', color: '#dc2626', bg: '#fef2f2' },
        { key: 'Activos', label: 'Activos / Bienes', icon: '🏢', color: '#0284c7', bg: '#f0f9ff' },
        { key: 'Patrimonio', label: 'Patrimonio Neto', icon: '🏛️', color: '#475569', bg: '#f8fafc' },
        { key: 'Ingresos', label: 'Ingresos Contables', icon: '💵', color: '#16a34a', bg: '#f0fdf4' }
      ];

      chipsRoot.innerHTML = categoriesInfo.map(cat => {
        const val = totals[cat.key] || 0.00;
        return `
          <div style="background: ${cat.bg}; border: 1px solid rgba(0,0,0,0.06); border-radius: 10px; padding: 10px 12px; display: flex; flex-direction: column; gap: 4px;">
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.74rem; font-weight: 700; color: ${cat.color};">
              <span>${cat.icon} ${cat.label}</span>
            </div>
            <div style="font-size: 1.15rem; font-weight: 800; color: #0f172a;">$${val.toFixed(2)}</div>
          </div>
        `;
      }).join('');
    }

    // Tabla con selectores de clasificación interactivos
    const tbody = document.getElementById('acc-expenses-classification-table-body');
    if (!tbody) return;

    const expenses = state.expenses || [];
    if (expenses.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 20px; color: #64748b;">No hay gastos cargados por el médico.</td></tr>`;
      return;
    }

    tbody.innerHTML = expenses.map(exp => {
      const currentCat = exp.accountingCategory || (exp.category === 'Insumos Hospital' ? 'Costos' : 'Gastos');
      const costCenter = exp.costCenter || (exp.category === 'Insumos Hospital' ? 'Hospital Público' : 'Rutas / Movilidad');

      return `
        <tr>
          <td><span style="font-weight: 600; color: #334155;">${exp.date}</span></td>
          <td>
            <strong style="color: #0f172a;">${exp.description}</strong>
            <div style="font-size: 0.72rem; color: #64748b;">ID: EXP-${exp.id}</div>
          </td>
          <td><span class="badge-sede badge-hospital" style="font-size: 0.74rem;">${costCenter}</span></td>
          <td style="font-weight: 800; color: #dc2626;">-$${exp.amount.toFixed(2)}</td>
          <td><span style="font-size: 0.78rem; font-weight: 700; color: #475569;">${exp.category}</span></td>
          <td>
            <select class="form-input acc-classification-select" data-expense-id="${exp.id}" style="padding: 4px 8px; font-size: 0.8rem; font-weight: 700; background: #ffffff; border-color: #cbd5e1;">
              <option value="Costos" ${currentCat === 'Costos' ? 'selected' : ''}>🩺 Costos (Atención e Insumos)</option>
              <option value="Gastos" ${currentCat === 'Gastos' ? 'selected' : ''}>⛽ Gastos (Transporte y Ruta)</option>
              <option value="Egresos" ${currentCat === 'Egresos' ? 'selected' : ''}>📉 Egresos (Operacionales)</option>
              <option value="Activos" ${currentCat === 'Activos' ? 'selected' : ''}>🏢 Activos (Equipo y Mantenimiento)</option>
              <option value="Patrimonio" ${currentCat === 'Patrimonio' ? 'selected' : ''}>🏛️ Patrimonio</option>
              <option value="Ingresos" ${currentCat === 'Ingresos' ? 'selected' : ''}>💵 Ingresos</option>
            </select>
          </td>
        </tr>
      `;
    }).join('');

    // Escuchar cambio en selectores de clasificación
    tbody.querySelectorAll('.acc-classification-select').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const expenseId = parseInt(e.target.dataset.expenseId, 10);
        const newCategory = e.target.value;
        store.updateExpenseClassification(expenseId, newCategory);
        showToast(`Gasto clasificado contablemente como "${newCategory}".`, 'success');
        renderAccountantDashboard();
      });
    });
  }

  // --- MÓDULO 3: Auditar Comprobantes y Facturas SRI ---
  function renderVouchersAuditModule(state) {
    const expenses = state.expenses || [];
    const countRoot = document.getElementById('acc-audit-badges-count');
    if (countRoot) {
      const aprobados = expenses.filter(e => (e.auditStatus || 'Aprobado') === 'Aprobado').length;
      const pendientes = expenses.filter(e => (e.auditStatus || 'Aprobado') === 'Pendiente').length;
      const observados = expenses.filter(e => (e.auditStatus || 'Aprobado') === 'Observado').length;

      countRoot.innerHTML = `
        <span class="badge-status-pill liquidado">✓ Aprobados: ${aprobados}</span>
        <span class="badge-status-pill pendiente">⏳ Pendientes: ${pendientes}</span>
        <span class="badge-status-pill" style="background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5;">⚠️ Observados: ${observados}</span>
      `;
    }

    const tbody = document.getElementById('acc-audit-vouchers-table-body');
    if (!tbody) return;

    if (expenses.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 20px; color: #64748b;">No hay comprobantes para auditar.</td></tr>`;
      return;
    }

    tbody.innerHTML = expenses.map(exp => {
      const auditStatus = exp.auditStatus || 'Aprobado';
      const voucherType = exp.voucherType || 'Factura Electrónica';
      const voucherNum = exp.voucherNumber || '001-002-8394821';
      const provider = exp.providerName || 'Proveedor Autorizado';
      const ruc = exp.providerRuc || '0990000000001';

      let statusBadge = '';
      if (auditStatus === 'Aprobado') {
        statusBadge = `<span class="badge-status-pill liquidado" data-exp-id="${exp.id}" title="Clic para conmutar estado">✓ APROBADO SRI</span>`;
      } else if (auditStatus === 'Observado') {
        statusBadge = `<span class="badge-status-pill" data-exp-id="${exp.id}" style="background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; cursor: pointer;" title="Clic para conmutar estado">⚠️ OBSERVADO</span>`;
      } else {
        statusBadge = `<span class="badge-status-pill pendiente" data-exp-id="${exp.id}" title="Clic para conmutar estado">⏳ PENDIENTE</span>`;
      }

      return `
        <tr>
          <td><strong style="color: #0284c7;">#EXP-${exp.id}</strong></td>
          <td><span style="font-size: 0.78rem; font-weight: 700; color: #334155;">${voucherType}</span></td>
          <td><code style="font-size: 0.74rem; background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">${voucherNum}</code></td>
          <td>
            <div style="font-weight: 700; color: #0f172a;">${provider}</div>
            <div style="font-size: 0.70rem; color: #64748b;">RUC: ${ruc}</div>
          </td>
          <td>
            <div style="color: #1e293b;">${exp.description}</div>
            <div style="font-size: 0.72rem; color: #64748b;">Centro: ${exp.costCenter || 'Hospital'}</div>
          </td>
          <td style="font-weight: 800; color: #0f172a;">$${exp.amount.toFixed(2)}</td>
          <td>${statusBadge}</td>
          <td>
            <button type="button" class="btn-ghost-sm btn-toggle-audit-status" data-exp-id="${exp.id}" style="font-size: 0.74rem; padding: 3px 8px;">
              🔄 Cambiar Estado
            </button>
          </td>
        </tr>
      `;
    }).join('');

    // Conmutar estado de auditoría
    tbody.querySelectorAll('.badge-status-pill, .btn-toggle-audit-status').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const expId = parseInt(btn.dataset.expId, 10);
        const exp = expenses.find(x => x.id === expId);
        if (!exp) return;

        const current = exp.auditStatus || 'Aprobado';
        let next = 'Aprobado';
        if (current === 'Aprobado') next = 'Observado';
        else if (current === 'Observado') next = 'Pendiente';
        else next = 'Aprobado';

        store.auditExpenseVoucher(expId, next, exp.auditNotes || '');
        showToast(`Comprobante #EXP-${expId} actualizado a estado "${next}".`, 'info');
        renderAccountantDashboard();
      });
    });
  }

  // --- MÓDULO 4: Rentabilidad por Sedes & Optimización de Rutas ---
  function renderProfitabilityAndRoutesModule(summary) {
    const profitabilityList = document.getElementById('clinic-profitability-container');
    if (profitabilityList) {
      const breakdown = summary.clinicBreakdown;
      const maxNet = Math.max(...Object.values(breakdown).map(b => b.netDoctor), 1);

      profitabilityList.innerHTML = Object.keys(breakdown).map(k => {
        const item = breakdown[k];
        const clinic = CLINICS[k] || { color: '#0284c7' };
        const isHospital = k === 'hospital';
        const netVal = isHospital ? summary.hospitalFixedSalary : item.netDoctor;
        const pctWidth = Math.min(100, Math.max(20, (netVal / (maxNet + 1200)) * 100));

        let viabilityBadge = '<span class="badge-sede badge-alborada" style="font-size: 0.70rem;">ÓPTIMA (95% margen)</span>';
        if (k === 'ceibos') {
          viabilityBadge = '<span class="badge-sede badge-ceibos" style="font-size: 0.70rem;">MEDIA (75% margen)</span>';
        } else if (k === 'hospital') {
          viabilityBadge = '<span class="badge-sede badge-hospital" style="font-size: 0.70rem;">FIJA (Sin comisión)</span>';
        }

        return `
          <div class="profitability-item" style="margin-bottom: 12px;">
            <div class="profitability-header-row" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="color: #0f172a; font-weight: 700;">${item.name}</span>
                ${viabilityBadge}
              </div>
              <span style="color: ${clinic.color}; font-weight: 800;">$${netVal.toFixed(2)} Neto</span>
            </div>
            <div class="progress-bar-track">
              <div class="progress-bar-fill" style="width: ${pctWidth}%; background: ${clinic.color};"></div>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 0.72rem; color: #64748b; margin-top: 2px;">
              <span>Facturado Bruto: $${isHospital ? 'Convenio MSP' : item.gross.toFixed(2)}</span>
              <span>Retención de Sede: ${isHospital ? '$0.00 (0%)' : `-$${item.retentions.toFixed(2)} (${(item.retentionRate * 100)}%)`}</span>
            </div>
          </div>
        `;
      }).join('');
    }

    // Sugerencias de Optimización de Rutas
    const routesList = document.getElementById('acc-route-optimizations-list');
    if (routesList) {
      const recommendations = summary.routeOptimizations || [
        {
          title: 'Agrupamiento Matutino Ceibos ↔ Hospital',
          desc: 'Agrupar citas privadas en Ceibos antes del inicio de guardias hospitalarias para evitar desplazamientos dobles.',
          saving: '$8.00 / día en taxi',
          impact: 'Ahorro mensual aprox. $160.00'
        },
        {
          title: 'Ruta Alborada y Mapasingue en Horas Valles',
          desc: 'Planificar traslados entre Mapasingue y Alborada fuera del horario pico de la Av. Juan Tanca Marengo (18:00 - 19:30).',
          saving: '45 minutos y $6.00 de combustible',
          impact: 'Menor desgaste vehicular y menor retraso en buffer'
        },
        {
          title: 'Compra Consolidada de Suministros Hospitalarios',
          desc: 'Cargar facturas mensuales de insumos con crédito tributario del 15% directamente a nombre del RUC del médico.',
          saving: '15% de crédito tributario en IVA',
          impact: 'Deducción legal en Formulario 102 SRI'
        }
      ];

      routesList.innerHTML = recommendations.map(rec => `
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid var(--primary-blue); border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 4px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <strong style="color: #0f172a; font-size: 0.85rem;">💡 ${rec.title}</strong>
            <span class="badge-sede badge-alborada" style="font-size: 0.70rem;">${rec.saving}</span>
          </div>
          <p style="font-size: 0.78rem; color: #475569; margin: 0; line-height: 1.4;">${rec.desc}</p>
          <span style="font-size: 0.72rem; color: #15803d; font-weight: 700;">✓ Impacto: ${rec.impact}</span>
        </div>
      `).join('');
    }
  }

  // --- MÓDULO 5: Reportes para Declaraciones Tributarias SRI ---
  function renderTaxReportModule(summary) {
    const previewContainer = document.getElementById('acc-tax-report-preview-container');
    if (!previewContainer) return;

    previewContainer.innerHTML = `
      <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 18px; margin-top: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 12px;">
          <div>
            <h4 style="margin: 0; font-size: 1rem; color: #0f172a; font-weight: 800;">SERVICIO DE RENTAS INTERNAS (SRI) - FORMULARIO 102</h4>
            <span style="font-size: 0.76rem; color: #64748b;">Declaración Consolidada de Impuesto a la Renta de Personas Naturales</span>
          </div>
          <div style="text-align: right; font-size: 0.78rem;">
            <strong>RUC:</strong> 0930860044001<br>
            <strong>Médico:</strong> Dr. Carlos Campoverde
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 0.82rem;">
          <thead>
            <tr style="background: #e2e8f0; border-bottom: 1px solid #cbd5e1;">
              <th style="padding: 8px; text-align: left;">Casillero SRI</th>
              <th style="padding: 8px; text-align: left;">Concepto Contable Tributario</th>
              <th style="padding: 8px; text-align: right;">Monto Consolidado ($)</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 8px; font-weight: 700; color: #0284c7;">[301]</td>
              <td style="padding: 8px;">Ingresos Brutos por Actividad Profesional Privada (Ceibos, Mapasingue, Alborada)</td>
              <td style="padding: 8px; text-align: right; font-weight: 700;">$${summary.totalGrossRevenue.toFixed(2)}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 8px; font-weight: 700; color: #0284c7;">[302]</td>
              <td style="padding: 8px;">Ingresos Bajo Relación de Dependencia (Sueldo Fijo Hospital Ceibos)</td>
              <td style="padding: 8px; text-align: right; font-weight: 700;">$${summary.hospitalFixedSalary.toFixed(2)}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0; background: #fff1f2;">
              <td style="padding: 8px; font-weight: 700; color: #dc2626;">[401]</td>
              <td style="padding: 8px; color: #991b1b;">(-) Gastos Operativos Deducibles de Movilidad e Insumos (Justificados)</td>
              <td style="padding: 8px; text-align: right; font-weight: 700; color: #dc2626;">-$${summary.totalExpenses.toFixed(2)}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 8px; font-weight: 700; color: #6366f1;">[501]</td>
              <td style="padding: 8px;">Retenciones en la Fuente Aplicadas por las Clínicas (5%, 25%, 10%)</td>
              <td style="padding: 8px; text-align: right; font-weight: 700; color: #6366f1;">-$${summary.totalRetentions.toFixed(2)}</td>
            </tr>
            <tr style="background: #f0fdf4; border-top: 2px solid #16a34a; font-size: 0.9rem;">
              <td style="padding: 10px; font-weight: 800; color: #166534;">[601]</td>
              <td style="padding: 10px; font-weight: 800; color: #166534;">BASE IMPONIBLE NETA LIQUIDABLE:</td>
              <td style="padding: 10px; text-align: right; font-weight: 800; color: #166534;">$${summary.realNetIncome.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 14px; font-size: 0.74rem; color: #64748b;">
          <span>✓ Datos auditados sin requerir recopilación manual de recibos.</span>
          <span>SRI Ecuador • Año Gravable 2026</span>
        </div>
      </div>
    `;

    const btnPrintDirect = document.getElementById('btn-acc-print-sri-direct');
    if (btnPrintDirect) {
      btnPrintDirect.onclick = () => window.print();
    }

    const btnExportDirect = document.getElementById('btn-acc-export-tax-direct');
    if (btnExportDirect) {
      btnExportDirect.onclick = () => openTaxReportModal();
    }
  }

  // --- 3. MODAL DE INFORME TRIBUTARIO SRI ---
  if (btnExportTax) {
    btnExportTax.addEventListener('click', openTaxReportModal);
  }

  if (btnCloseTaxModal) {
    btnCloseTaxModal.addEventListener('click', () => {
      taxModal.classList.remove('active');
    });
  }

  function openTaxReportModal() {
    const summary = store.getFinancialSummary();
    const modalBody = document.getElementById('tax-report-modal-body');
    if (!modalBody || !taxModal) return;

    modalBody.innerHTML = `
      <div class="sri-report-modal-content">
        <div class="sri-header">
          <div>
            <h3 style="font-size: 1.15rem; color: #0f172a; font-weight: 800;">SERVICIO DE RENTAS INTERNAS (SRI) - ECUADOR</h3>
            <p style="font-size: 0.78rem; color: #64748b;">Informe de Conciliación Tributaria para Servicios Médicos Profesionales</p>
          </div>
          <div style="text-align: right; font-size: 0.8rem;">
            <strong>Período Fiscal:</strong> Septiembre - Octubre 2026<br>
            <strong>Cédula / RUC:</strong> 0930860044001
          </div>
        </div>

        <div style="font-size: 0.84rem; color: #334155; line-height: 1.5;">
          <strong>Contribuyente:</strong> DR. CARLOS CAMPOVERDE<br>
          <strong>Actividad:</strong> Servicios de Medicina General en Clínicas Privadas y Sector Público.
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 0.82rem; margin-top: 10px;">
          <thead>
            <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
              <th style="padding: 8px; text-align: left;">Rubro Fiscal</th>
              <th style="padding: 8px; text-align: right;">Base Imponible / Bruto</th>
              <th style="padding: 8px; text-align: right;">Retención / Deducción</th>
              <th style="padding: 8px; text-align: right;">Subtotal Neto</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 8px;">Facturación Mapasingue (Retención 5%)</td>
              <td style="padding: 8px; text-align: right;">$${summary.clinicBreakdown.mapasingue.gross.toFixed(2)}</td>
              <td style="padding: 8px; text-align: right; color: #b91c1c;">-$${summary.clinicBreakdown.mapasingue.retentions.toFixed(2)}</td>
              <td style="padding: 8px; text-align: right; font-weight: 700;">$${summary.clinicBreakdown.mapasingue.netDoctor.toFixed(2)}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 8px;">Facturación Ceibos (Retención 25%)</td>
              <td style="padding: 8px; text-align: right;">$${summary.clinicBreakdown.ceibos.gross.toFixed(2)}</td>
              <td style="padding: 8px; text-align: right; color: #b91c1c;">-$${summary.clinicBreakdown.ceibos.retentions.toFixed(2)}</td>
              <td style="padding: 8px; text-align: right; font-weight: 700;">$${summary.clinicBreakdown.ceibos.netDoctor.toFixed(2)}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 8px;">Facturación Alborada (Retención 10%)</td>
              <td style="padding: 8px; text-align: right;">$${summary.clinicBreakdown.alborada.gross.toFixed(2)}</td>
              <td style="padding: 8px; text-align: right; color: #b91c1c;">-$${summary.clinicBreakdown.alborada.retentions.toFixed(2)}</td>
              <td style="padding: 8px; text-align: right; font-weight: 700;">$${summary.clinicBreakdown.alborada.netDoctor.toFixed(2)}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0; background: #fafafa;">
              <td style="padding: 8px;">Sueldo Fijo Hospital Público Ceibos (Bajo Rol de Pagos)</td>
              <td style="padding: 8px; text-align: right;">$${summary.hospitalFixedSalary.toFixed(2)}</td>
              <td style="padding: 8px; text-align: right;">$0.00</td>
              <td style="padding: 8px; text-align: right; font-weight: 700;">$${summary.hospitalFixedSalary.toFixed(2)}</td>
            </tr>
            <tr style="border-bottom: 2px solid #0f172a; background: #fef2f2;">
              <td style="padding: 8px;"><strong>(-) Total Gastos Deducibles de Transporte e Insumos</strong></td>
              <td style="padding: 8px; text-align: right;">-</td>
              <td style="padding: 8px; text-align: right; color: #b91c1c; font-weight: 700;">-$${summary.totalExpenses.toFixed(2)}</td>
              <td style="padding: 8px; text-align: right; color: #b91c1c; font-weight: 800;">-$${summary.totalExpenses.toFixed(2)}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr style="background: #f0fdf4; font-size: 0.95rem;">
              <td style="padding: 10px; font-weight: 800; color: #166534;" colspan="3">INGRESO NETO REAL LIQUIDABLE:</td>
              <td style="padding: 10px; text-align: right; font-weight: 800; color: #166534;">$${summary.realNetIncome.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>

        <div style="font-size: 0.72rem; color: #64748b; margin-top: 10px;">
          Certifico que las retenciones aplicadas en los consultorios privados y los gastos de movilidad concuerdan con los registros bancarios y facturas electrónicas autorizadas por el SRI.
        </div>
      </div>
    `;

    taxModal.classList.add('active');
  }

  // --- 4. EXPORTACIÓN A EXCEL / CSV ---
  if (btnDownloadCSV) {
    btnDownloadCSV.addEventListener('click', () => {
      const summary = store.getFinancialSummary();
      const state = store.getState();

      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "FECHA,TIPO,DESCRIPCION/PACIENTE,SEDE,BRUTO,RETENCION/COMISION,NETO_FINAL,ESTADO,CLASIFICACION_CONTABLE\r\n";

      // Citas
      state.appointments.forEach(a => {
        const clinic = CLINICS[a.clinicId];
        csvContent += `"${a.date}","CITA MEDICA","${a.patientName}","${clinic.name}",${a.basePrice.toFixed(2)},${a.retentionAmount.toFixed(2)},${a.netClinicYield.toFixed(2)},"${a.settlementStatus}","Ingresos"\r\n`;
      });

      // Sueldo Hospital
      csvContent += `"2026-09-30","SUELDO FIJO","Haber Mensual de Medicina General","Hospital Público Ceibos",${summary.hospitalFixedSalary.toFixed(2)},0.00,${summary.hospitalFixedSalary.toFixed(2)},"Liquidado","Ingresos"\r\n`;

      // Gastos
      state.expenses.forEach(e => {
        csvContent += `"${e.date}","GASTO OPERATIVO","${e.description}","${e.costCenter || e.category}",-${e.amount.toFixed(2)},0.00,-${e.amount.toFixed(2)},"${e.auditStatus || 'Aprobado'}","${e.accountingCategory || 'Gastos'}"\r\n`;
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Auditoria_Contable_SRI_Septiembre_2026.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast('Archivo CSV generado y listo para abrir en Microsoft Excel.', 'success');
    });
  }

  // Suscribirse al store para refrescar la tabla en tiempo real si el doctor o paciente interactúan
  store.subscribe(() => {
    if (store.getActiveView() === 'contador' || store.getActiveView() === 'accountant') {
      renderAccountantDashboard();
    }
  });

  renderAccountantDashboard();
}
