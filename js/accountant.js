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

    // 2.2 PANE 1: Flujo de Caja & Liquidaciones Semanales
    renderFridaySettlementTable(summary);
    renderRecentConsultationsList(state);

    // 2.3 PANE 2: Revisión y Clasificación Contable de Gastos
    renderExpensesClassificationModule(state, summary);

    // 2.4 PANE 3: Auditoría de Comprobantes y Facturas SRI
    renderVouchersAuditModule(state);

    // 2.5 PANE 4: Rentabilidad por Sedes, Centros de Costo y Rutas
    renderProfitabilityAndRoutesModule(summary);

    // 2.6 PANE 5: Declaración Tributaria SRI (Formulario 102)
    renderTaxReportModule(summary);
  }

  // --- MÓDULO 1: Liquidación de los Viernes & Flujo de Caja ---
  function renderFridaySettlementTable(summary) {
    const settlementTableBody = document.getElementById('friday-settlement-table-body');
    if (!settlementTableBody) return;

    const breakdown = summary.clinicBreakdown;
    settlementTableBody.innerHTML = Object.keys(breakdown).map(clinicKey => {
      const cData = breakdown[clinicKey];
      const clinic = CLINICS[clinicKey] || { color: '#0284c7' };
      const isHospital = clinicKey === 'hospital';

      let badgeHtml = '';
      if (isHospital) {
        badgeHtml = `<span class="badge-status-pill sueldo-fijo">🏛️ Sueldo Fijo ($1,200)</span>`;
      } else if (cData.status === 'Liquidado') {
        badgeHtml = `<span class="badge-status-pill liquidado" data-clinic="${clinicKey}">✓ Liquidado</span>`;
      } else {
        badgeHtml = `<span class="badge-status-pill pendiente" data-clinic="${clinicKey}">⏳ Pendiente</span>`;
      }

      const retentionPct = isHospital ? '0%' : `${(cData.retentionRate * 100).toFixed(0)}%`;
      const netTransfer = isHospital ? summary.hospitalFixedSalary : cData.netDoctor;

      return `
        <tr>
          <td>
            <strong style="color: #0f172a; display: flex; align-items: center; gap: 8px;">
              <span style="width: 10px; height: 10px; border-radius: 50%; background: ${clinic.color};"></span>
              ${cData.name}
            </strong>
          </td>
          <td>${isHospital ? 'Turnos Guardia' : `${cData.patientsCount} citas`}</td>
          <td>${isHospital ? 'Convenio MSP' : `$${cData.gross.toFixed(2)}`}</td>
          <td style="color: #b91c1c; font-weight: 700;">${isHospital ? '$0.00 (0%)' : `-$${cData.retentions.toFixed(2)} (${retentionPct})`}</td>
          <td style="font-weight: 800; color: #0284c7;">$${netTransfer.toFixed(2)}</td>
          <td>${badgeHtml}</td>
        </tr>
      `;
    }).join('');

    // Toggle de estado de liquidación al hacer clic
    settlementTableBody.querySelectorAll('.badge-status-pill:not(.sueldo-fijo)').forEach(pill => {
      pill.addEventListener('click', () => {
        const cKey = pill.dataset.clinic;
        if (summary.clinicBreakdown[cKey]) {
          summary.clinicBreakdown[cKey].status = 
            summary.clinicBreakdown[cKey].status === 'Liquidado' ? 'Pendiente' : 'Liquidado';
          showToast(`Estado de liquidación actualizado para ${summary.clinicBreakdown[cKey].name}.`, 'info');
          renderAccountantDashboard();
        }
      });
    });
  }

  function renderRecentConsultationsList(state) {
    const listRoot = document.getElementById('acc-recent-consultations-list');
    if (!listRoot) return;

    if (state.appointments.length === 0) {
      listRoot.innerHTML = `<p style="font-size: 0.8rem; color: #64748b; padding: 10px;">No hay consultas registradas para este período.</p>`;
      return;
    }

    listRoot.innerHTML = state.appointments.slice(0, 6).map(apt => {
      const clinic = CLINICS[apt.clinicId] || { name: 'Sede' };
      const fee = apt.totalPaid || apt.basePrice || 20.00;
      const com = apt.retentionAmount || (fee * (clinic.retentionRate || 0.10));
      const net = apt.netClinicYield || (fee - com);

      return `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 0.8rem;">
          <div>
            <strong style="color: #0f172a;">${apt.patientName}</strong>
            <div style="font-size: 0.72rem; color: #64748b;">📍 ${clinic.name} • ${apt.date} ${apt.time}</div>
          </div>
          <div style="text-align: right;">
            <span style="font-weight: 800; color: #059669;">+$${net.toFixed(2)}</span>
            <div style="font-size: 0.70rem; color: #b91c1c;">(Com. -$${com.toFixed(2)})</div>
          </div>
        </div>
      `;
    }).join('');
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
