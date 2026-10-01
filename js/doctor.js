/**
 * Flujo 2: Portal Médico Mobile-First (Página 4 del documento)
 * Diseñado para operar en pantalla táctil de un Xiaomi Redmi Note (390x844px)
 * Incluye cronograma de rutas con advertencia de traslado en ámbar,
 * botón de guardia de emergencia con reagendamiento asistido,
 * buscador reactivo de fichas clínicas, recetario digital y registro de gastos en 2 toques.
 */

import { CLINICS, DEMO_USERS, store } from './state.js';

export function setupDoctorPortal(showToast) {
  let activeDoctorTab = 'agenda'; // 'agenda', 'fichas', 'recetas', 'gastos'
  let activeDate = '2026-09-19';  // Sábado, 19 Septiembre 2026

  // Elementos de la barra de navegación (Móvil, Pestañas Superiores y Bottom Nav)
  const bottomNavButtons = document.querySelectorAll('.doctor-bottom-nav .bottom-nav-item');
  const mobilePillButtons = document.querySelectorAll('.doc-mobile-pill');
  const desktopNavButtons = document.querySelectorAll('#nav-menu-doctor .nav-tab-btn');
  const doctorPanes = document.querySelectorAll('.doctor-pane-view');

  // Botones de guardia y modales
  const btnEmergencyFab = document.getElementById('btn-emergency-guard-fab');
  const btnMobileQuickGuard = document.getElementById('btn-mobile-quick-guard');
  const emergencyModal = document.getElementById('emergency-guard-modal');
  const btnCloseEmergencyModal = document.getElementById('btn-close-emergency-modal');
  const emergencyActionsList = document.getElementById('emergency-affected-list');
  const emergencyBanner = document.getElementById('doctor-emergency-active-banner');

  // Navegación unificada de pestañas (Móvil y Escritorio)
  function switchDoctorTab(tabKey) {
    activeDoctorTab = tabKey;

    // Actualizar botones de la barra inferior móvil
    bottomNavButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === activeDoctorTab);
    });

    // Actualizar botones del menú móvil segmentado superior
    mobilePillButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === activeDoctorTab);
    });

    // Actualizar botones de la barra de navegación superior dinámica
    desktopNavButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === activeDoctorTab);
    });

    // Mostrar el panel correspondiente
    doctorPanes.forEach(pane => {
      pane.style.display = (pane.dataset.pane === activeDoctorTab) ? 'flex' : 'none';
    });

    // Ocultar FAB de emergencia si está en pestaña de recetas o gastos para que no estorbe en móvil
    if (btnEmergencyFab) {
      btnEmergencyFab.style.display = (activeDoctorTab === 'agenda') ? 'flex' : 'none';
    }

    if (activeDoctorTab === 'agenda') renderTimeline();
    if (activeDoctorTab === 'fichas') renderMedicalRecords();
    if (activeDoctorTab === 'recetas') setupPrescriptionTab();
    if (activeDoctorTab === 'gastos') renderExpensesTab();
    if (activeDoctorTab === 'ingresos') renderIngresosTab();
  }

  bottomNavButtons.forEach(btn => {
    btn.addEventListener('click', () => switchDoctorTab(btn.dataset.tab));
  });

  mobilePillButtons.forEach(btn => {
    btn.addEventListener('click', () => switchDoctorTab(btn.dataset.tab));
  });

  // Conectar botones de la barra de navegación superior dinámica
  desktopNavButtons.forEach(btn => {
    btn.addEventListener('click', () => switchDoctorTab(btn.dataset.tab));
  });

  // Conectar botón rápido de guardia en la cabecera móvil
  if (btnMobileQuickGuard) {
    btnMobileQuickGuard.addEventListener('click', () => {
      if (emergencyModal) emergencyModal.classList.add('active');
    });
  }

  // --- 1. CRONOGRAMA DIARIO & RUTAS (Timeline Vertical) ---
  function renderTimeline() {
    const timelineEl = document.getElementById('doctor-timeline-list');
    if (!timelineEl) return;

    const state = store.getState();
    const isGuardActive = state.emergencyGuard.isActive;

    // Actualizar banner si la guardia está activa
    if (emergencyBanner) {
      emergencyBanner.style.display = isGuardActive ? 'flex' : 'none';
    }

    const todayAppointments = state.appointments
      .filter(a => a.date === activeDate && a.status !== 'cancelada')
      .sort((a, b) => a.time.localeCompare(b.time));

    const travelBuffers = state.travelBuffers.filter(t => t.date === activeDate);

    // Combinar citas y traslados cronológicamente
    const timelineItems = [];

    todayAppointments.forEach(apt => {
      timelineItems.push({ type: 'appointment', data: apt, sortTime: apt.time });
    });

    travelBuffers.forEach(trv => {
      timelineItems.push({ type: 'travel', data: trv, sortTime: trv.startTime });
    });

    timelineItems.sort((a, b) => a.sortTime.localeCompare(b.sortTime));

    if (timelineItems.length === 0) {
      timelineEl.innerHTML = `
        <div style="text-align: center; padding: 40px 20px; color: #64748b;">
          <span style="font-size: 2.5rem;">📅</span>
          <p style="margin-top: 10px; font-weight: 600;">No hay citas agendadas para esta fecha.</p>
        </div>
      `;
      return;
    }

    timelineEl.innerHTML = timelineItems.map(item => {
      if (item.type === 'travel') {
        const trv = item.data;
        return `
          <div class="travel-warning-card">
            <div class="travel-icon-box">🚗</div>
            <div class="travel-text-content">
              <div class="travel-title">${trv.bufferLabel}</div>
              <div class="travel-subtitle">Franja horaria: ${trv.startTime} - ${trv.endTime} (Vía rápida)</div>
            </div>
            <span class="badge-sede badge-hospital" style="font-size: 0.68rem;">EN RUTA</span>
          </div>
        `;
      }

      const apt = item.data;
      const clinic = CLINICS[apt.clinicId] || CLINICS.ceibos;
      const isEmergencyInterrupted = apt.status === 'en_guardia';

      return `
        <div class="timeline-card ${apt.clinicId} ${isEmergencyInterrupted ? 'en_guardia' : ''}">
          <div class="timeline-time-col">
            <span class="timeline-time-text">${apt.time}</span>
            <span class="timeline-duration-badge">${apt.durationMinutes || 45} min</span>
          </div>
          <div class="timeline-body-col">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <h4 class="timeline-patient-name">${apt.patientName}</h4>
              <span class="badge-sede ${clinic.badgeClass}">${clinic.name.split(' ')[1] || clinic.name}</span>
            </div>
            <p class="timeline-patient-reason">📋 ${apt.reason || 'Consulta General'}</p>
            <div class="timeline-meta-row">
              <span class="timeline-consultorio">📍 ${clinic.consultorio}</span>
              ${isEmergencyInterrupted ? 
                '<span class="badge-sede badge-emergency">🚨 En Guardia</span>' : 
                `<span style="font-size: 0.72rem; font-weight: 700; color: #10b981;">$${apt.totalPaid.toFixed(2)} (${apt.paymentMethod})</span>`
              }
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // --- 2. BOTÓN DE GUARDIA Y REAGENDAMIENTO ASISTIDO (Página 4) ---
  if (btnEmergencyFab) {
    btnEmergencyFab.addEventListener('click', () => {
      openEmergencyModal();
    });
  }

  const btnNavDoctorGuard = document.getElementById('btn-nav-doctor-guard-btn');
  if (btnNavDoctorGuard) {
    btnNavDoctorGuard.addEventListener('click', () => {
      openEmergencyModal();
    });
  }

  if (btnCloseEmergencyModal) {
    btnCloseEmergencyModal.addEventListener('click', () => {
      emergencyModal.classList.remove('active');
    });
  }

  function openEmergencyModal() {
    const state = store.getState();
    let affected = state.appointments.filter(
      a => a.date === activeDate && a.clinicId !== 'hospital' && (a.status === 'confirmada' || a.status === 'en_guardia')
    );

    // Si aún no está activada, activar la guardia
    if (!state.emergencyGuard.isActive) {
      store.activateEmergencyGuard('Convocatoria urgente a Sala de Choque y Triaje de Hospital Ceibos');
      showToast('🚨 Modo Guardia activado. Gestiona las citas afectadas.', 'danger');
    }

    renderEmergencyModalList();
    emergencyModal.classList.add('active');
  }

  function renderEmergencyModalList() {
    const state = store.getState();
    const affected = state.appointments.filter(
      a => a.date === activeDate && a.clinicId !== 'hospital' && (a.status === 'confirmada' || a.status === 'en_guardia')
    );

    if (affected.length === 0) {
      emergencyActionsList.innerHTML = `
        <div style="text-align: center; padding: 20px; color: #10b981;">
          <h4>✅ Todas las citas del día han sido resueltas.</h4>
          <p style="font-size: 0.8rem; color: #64748b; margin-top: 6px;">Ya puedes dirigirte al Hospital Público sin conflictos de agenda.</p>
        </div>
      `;
      return;
    }

    emergencyActionsList.innerHTML = affected.map(apt => {
      const clinic = CLINICS[apt.clinicId];
      return `
        <div style="background: #fff1f2; border: 1px solid #fecdd3; border-radius: 12px; padding: 12px; display: flex; flex-direction: column; gap: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <strong style="font-size: 0.9rem; color: #991b1b;">${apt.time} - ${apt.patientName}</strong>
            <span class="badge-sede ${clinic.badgeClass}">${clinic.name}</span>
          </div>
          <p style="font-size: 0.78rem; color: #7f1d1d;">Motivo: ${apt.reason}</p>
          <div style="display: flex; gap: 8px; margin-top: 4px;">
            <button type="button" class="btn-primary btn-reschedule-auto" data-id="${apt.id}" style="flex: 1; padding: 6px 10px; font-size: 0.76rem;">
              🔄 Reagendar al Lunes
            </button>
            <button type="button" class="btn-danger btn-cancel-force" data-id="${apt.id}" style="flex: 1; padding: 6px 10px; font-size: 0.76rem;">
              ✕ Cancelar Fuerza Mayor
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Acciones de los botones de reagendamiento con 1 toque
    emergencyActionsList.querySelectorAll('.btn-reschedule-auto').forEach(btn => {
      btn.addEventListener('click', () => {
        const aptId = btn.dataset.id;
        store.resolveEmergencyAppointment(aptId, 'reschedule');
        showToast('Cita reagendada automáticamente para el lunes 21. Notificación enviada al paciente por SMS/WhatsApp.', 'success');
        renderEmergencyModalList();
        renderTimeline();
      });
    });

    emergencyActionsList.querySelectorAll('.btn-cancel-force').forEach(btn => {
      btn.addEventListener('click', () => {
        const aptId = btn.dataset.id;
        store.resolveEmergencyAppointment(aptId, 'cancel');
        showToast('Cita cancelada por fuerza mayor médica. Paciente notificado formalmente.', 'warning');
        renderEmergencyModalList();
        renderTimeline();
      });
    });
  }

  // --- 3. FICHAS CLÍNICAS RÁPIDAS (Página 4) ---
  function renderMedicalRecords() {
    const listEl = document.getElementById('medical-records-list');
    const searchInput = document.getElementById('search-patient-records');
    if (!listEl) return;

    const query = (searchInput ? searchInput.value.trim().toLowerCase() : '');
    const state = store.getState();

    const filteredRecords = state.medicalRecords.filter(r => 
      r.patientName.toLowerCase().includes(query) ||
      r.patientId.includes(query)
    );

    if (filteredRecords.length === 0) {
      listEl.innerHTML = `<div style="text-align: center; padding: 30px; color: #64748b;">No se encontraron fichas para "${query}".</div>`;
      return;
    }

    listEl.innerHTML = filteredRecords.map(rec => {
      return `
        <div class="patient-record-card" data-id="${rec.id}">
          <div class="patient-record-header">
            <div>
              <div class="record-name">${rec.patientName}</div>
              <div class="record-ci">C.I: ${rec.patientId} | Edad: ${rec.age} años | Tipo: ${rec.bloodType}</div>
            </div>
            <button class="btn-ghost-sm btn-view-full-record" data-id="${rec.id}">Ver Ficha →</button>
          </div>
          <div class="allergy-alert-tag">
            <span>⚠️ ALERGIAS:</span>
            <span>${rec.allergies}</span>
          </div>
          <div class="past-diagnosis-snippet">
            <strong>Último Diagnóstico:</strong> ${rec.lastDiagnosis}
          </div>
        </div>
      `;
    }).join('');

    // Modal de Ficha Completa
    listEl.querySelectorAll('.patient-record-card').forEach(card => {
      card.addEventListener('click', () => {
        const record = state.medicalRecords.find(r => r.id === card.dataset.id);
        if (record) openRecordModal(record);
      });
    });
  }

  const searchInput = document.getElementById('search-patient-records');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      renderMedicalRecords();
    });
  }

  function openRecordModal(record) {
    const modal = document.getElementById('patient-detail-modal');
    const modalBody = document.getElementById('patient-detail-modal-body');
    if (!modal || !modalBody) return;

    modalBody.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 14px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">
          <div>
            <h3 style="font-size: 1.15rem; color: #0f172a;">${record.patientName}</h3>
            <p style="font-size: 0.8rem; color: #64748b;">Cédula: ${record.patientId} | Edad: ${record.age} | Tipo Sangre: ${record.bloodType}</p>
          </div>
        </div>
        <div style="background: #fee2e2; border-radius: 8px; padding: 10px; border: 1px solid #fecaca; color: #991b1b; font-size: 0.84rem; font-weight: 700;">
          ⚠️ Alergias Críticas: ${record.allergies}
        </div>
        <div>
          <h5 style="font-size: 0.84rem; color: #0f172a; font-weight: 700;">Antecedentes Médicos:</h5>
          <p style="font-size: 0.84rem; color: #334155; margin-top: 4px;">${record.history}</p>
        </div>
        <div>
          <h5 style="font-size: 0.84rem; color: #0f172a; font-weight: 700;">Historial de Consultas Previas:</h5>
          <div style="display: flex; flex-direction: column; gap: 6px; margin-top: 6px;">
            ${record.consultationHistory.map(h => `
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px; font-size: 0.8rem;">
                <div style="display: flex; justify-content: space-between; font-weight: 700; color: #0284c7;">
                  <span>${h.date} - ${h.sede}</span>
                  <span>PA: ${h.pa}</span>
                </div>
                <div style="color: #475569; margin-top: 2px;">${h.motivo}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    modal.classList.add('active');
  }

  const btnCloseDetailModal = document.getElementById('btn-close-patient-detail');
  if (btnCloseDetailModal) {
    btnCloseDetailModal.addEventListener('click', () => {
      document.getElementById('patient-detail-modal').classList.remove('active');
    });
  }

  // --- 4. RECETARIO DIGITAL (Página 4) ---
  function setupPrescriptionTab() {
    const selectPatient = document.getElementById('rx-select-patient');
    const state = store.getState();

    if (selectPatient) {
      selectPatient.innerHTML = state.medicalRecords.map(r => 
        `<option value="${r.patientId}">${r.patientName} (${r.patientId})</option>`
      ).join('');
    }

    const btnAddMed = document.getElementById('btn-add-rx-drug');
    const medList = document.getElementById('rx-drug-items-list');
    const formRx = document.getElementById('doctor-prescription-form');

    if (btnAddMed && medList) {
      btnAddMed.onclick = () => {
        const row = document.createElement('div');
        row.className = 'rx-med-item-row';
        row.innerHTML = `
          <input type="text" class="form-input rx-drug-name" placeholder="Medicamento y presentación (ej. Amoxicilina 875mg)" required />
          <input type="text" class="form-input rx-drug-dose" placeholder="Dosis y posología (ej. 1 tableta cada 8 horas por 7 días)" required />
          <button type="button" class="btn-ghost-sm" style="align-self: flex-end; color: #ef4444;" onclick="this.parentElement.remove()">Eliminar</button>
        `;
        medList.appendChild(row);
      };
    }

    if (formRx) {
      formRx.onsubmit = (e) => {
        e.preventDefault();
        const patId = selectPatient.value;
        const patient = state.medicalRecords.find(r => r.patientId === patId) || { patientName: 'Paciente General' };
        const diagnosis = document.getElementById('rx-diagnosis-input').value.trim();
        const indications = document.getElementById('rx-indications-input').value.trim();

        const drugs = [];
        document.querySelectorAll('.rx-med-item-row').forEach(row => {
          const dName = row.querySelector('.rx-drug-name').value.trim();
          const dDose = row.querySelector('.rx-drug-dose').value.trim();
          if (dName) drugs.push({ drug: dName, dose: dDose });
        });

        if (drugs.length === 0) {
          showToast('Agrega al menos un medicamento a la receta.', 'warning');
          return;
        }

        const newRx = store.addPrescription({
          patientId: patId,
          patientName: patient.patientName,
          diagnosis,
          items: drugs,
          indications
        });

        showToast(`Receta #${newRx.code} generada exitosamente. Código MSP: ${newRx.doctorCode}`, 'success');

        // Mostrar modal de receta lista con PDF / WhatsApp
        openPrescriptionSuccessModal(newRx);
      };
    }
  }

  function openPrescriptionSuccessModal(rx) {
    const modal = document.getElementById('prescription-success-modal');
    const body = document.getElementById('prescription-modal-body');
    if (!modal || !body) return;

    body.innerHTML = `
      <div class="official-rx-printable" id="printable-rx-ticket">
        <div class="rx-header">
          <div>
            <h4 style="color: #0284c7; font-size: 1.1rem; font-weight: 800;">DR. CARLOS CAMPOVERDE</h4>
            <p style="font-size: 0.78rem; color: #64748b;">Medicina General | MSP Código: <strong>${rx.doctorCode}</strong></p>
          </div>
          <div class="rx-seal">
            <span style="font-size: 0.8rem; font-weight: 700; color: #0f172a;">${rx.code}</span><br>
            <span>Fecha: ${rx.date}</span>
          </div>
        </div>
        <div style="margin-bottom: 12px; font-size: 0.84rem;">
          <strong>Paciente:</strong> ${rx.patientName} (${rx.patientId})<br>
          <strong>Diagnóstico Clínico:</strong> ${rx.diagnosis}
        </div>
        <div style="background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 12px;">
          <h5 style="font-size: 0.82rem; text-transform: uppercase; color: #0284c7; margin-bottom: 6px;">Rp / Tratamiento Farmacológico:</h5>
          <ul style="padding-left: 18px; font-size: 0.84rem; display: flex; flex-direction: column; gap: 6px;">
            ${rx.items.map(it => `<li><strong>${it.drug}</strong><br><span style="color: #475569;">${it.dose}</span></li>`).join('')}
          </ul>
        </div>
        <div style="font-size: 0.8rem; color: #334155; margin-bottom: 16px;">
          <strong>Indicaciones Generales:</strong> ${rx.indications}
        </div>
        <div class="rx-footer">
          <div style="font-size: 0.72rem; color: #94a3b8;">Documento médico con validez oficial para dispensación farmacéutica.</div>
          <div style="text-align: center; border-top: 1px solid #0f172a; width: 180px; padding-top: 4px; font-size: 0.74rem;">Firma y Sello MSP</div>
        </div>
      </div>
      <div style="display: flex; gap: 10px; margin-top: 16px;">
        <button type="button" class="btn-primary" style="flex: 1;" onclick="window.print()">🖨️ Imprimir / Guardar PDF</button>
        <button type="button" class="btn-secondary" style="flex: 1;" id="btn-share-whatsapp">💬 Enviar WhatsApp</button>
      </div>
    `;

    modal.classList.add('active');

    const btnWhatsApp = document.getElementById('btn-share-whatsapp');
    if (btnWhatsApp) {
      btnWhatsApp.onclick = () => {
        const text = encodeURIComponent(`Hola ${rx.patientName}, adjunto su receta médica oficial #${rx.code} emitida por el Dr. Carlos Campoverde (MSP: ${rx.doctorCode}). Diagnóstico: ${rx.diagnosis}.`);
        window.open(`https://api.whatsapp.com/send?phone=593987654321&text=${text}`, '_blank');
      };
    }
  }

  const btnCloseRxModal = document.getElementById('btn-close-prescription-modal');
  if (btnCloseRxModal) {
    btnCloseRxModal.addEventListener('click', () => {
      document.getElementById('prescription-success-modal').classList.remove('active');
    });
  }

  // --- 5. REGISTRO DE GASTOS EN 2 TOQUES (Página 4) ---
  function renderExpensesTab() {
    const listEl = document.getElementById('doctor-expenses-history-list');
    const state = store.getState();

    // Botones de Presets Rápidos
    const btnTaxi = document.getElementById('btn-preset-taxi');
    const btnGas = document.getElementById('btn-preset-gas');
    const btnHospital = document.getElementById('btn-preset-hospital');

    if (btnTaxi) {
      btnTaxi.onclick = () => {
        store.addExpense({
          category: 'Transporte',
          description: 'Carrera de Taxi entre clínicas',
          amount: 4.00,
          quickLogged: true
        });
        showToast('Gasto de Taxi ($4.00) registrado en 2 toques.', 'success');
        renderExpensesTab();
      };
    }

    if (btnGas) {
      btnGas.onclick = () => {
        store.addExpense({
          category: 'Transporte',
          description: 'Combustible / Gasolina de traslado',
          amount: 15.00,
          quickLogged: true
        });
        showToast('Gasto de Gasolina ($15.00) registrado con éxito.', 'success');
        renderExpensesTab();
      };
    }

    if (btnHospital) {
      btnHospital.onclick = () => {
        store.addExpense({
          category: 'Suministros Hospital',
          description: 'Insumos médicos de emergencia asumidos en hospital',
          amount: 12.00,
          quickLogged: true
        });
        showToast('Insumos de Hospital ($12.00) guardados para deducción tributaria.', 'success');
        renderExpensesTab();
      };
    }

    // Formulario de gasto manual personalizado
    const customExpForm = document.getElementById('custom-expense-form');
    if (customExpForm) {
      customExpForm.onsubmit = (e) => {
        e.preventDefault();
        const desc = document.getElementById('custom-exp-desc').value.trim();
        const amount = parseFloat(document.getElementById('custom-exp-amount').value);
        const cat = document.getElementById('custom-exp-cat').value;

        if (!desc || isNaN(amount) || amount <= 0) {
          showToast('Ingresa un monto y concepto válido.', 'danger');
          return;
        }

        store.addExpense({
          category: cat,
          description: desc,
          amount: amount,
          quickLogged: false
        });

        customExpForm.reset();
        showToast(`Gasto de $${amount.toFixed(2)} (${cat}) registrado para contabilidad.`, 'success');
        renderExpensesTab();
      };
    }

    if (listEl) {
      listEl.innerHTML = state.expenses.slice(0, 10).map(exp => `
        <div class="expense-log-item">
          <div>
            <strong style="color: #0f172a;">${exp.description}</strong>
            <div style="font-size: 0.72rem; color: #64748b;">${exp.date} • <span class="badge-sede badge-mapasingue" style="padding: 1px 6px; font-size: 0.65rem;">${exp.category}</span></div>
          </div>
          <span style="font-size: 0.95rem; font-weight: 800; color: #ef4444;">-$${exp.amount.toFixed(2)}</span>
        </div>
      `).join('');
    }
  }

  // --- 5. MÓDULO DE INGRESOS MÉDICOS POR SEDE Y DÍA ---
  let ingresosFilter = 'todas'; // 'hoy', 'semana', 'mes', 'todas', 'personalizado'
  let customDateStart = '';
  let customDateEnd = '';
  let isIngresosTabInitialized = false;

  function setupIngresosTabEvents() {
    if (isIngresosTabInitialized) return;
    isIngresosTabInitialized = true;

    // Filtros de fecha (Pills)
    const pillButtons = document.querySelectorAll('#ingresos-filter-pills-group .ingresos-pill-btn');
    const customBox = document.getElementById('ingresos-custom-range-box');
    const inputStart = document.getElementById('ingresos-date-start');
    const inputEnd = document.getElementById('ingresos-date-end');
    const btnApplyDates = document.getElementById('btn-apply-custom-dates');

    pillButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        pillButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        ingresosFilter = btn.dataset.range;

        if (ingresosFilter === 'personalizado') {
          if (customBox) customBox.classList.add('active');
        } else {
          if (customBox) customBox.classList.remove('active');
          renderIngresosTab();
        }
      });
    });

    if (btnApplyDates) {
      btnApplyDates.addEventListener('click', () => {
        customDateStart = inputStart ? inputStart.value : '';
        customDateEnd = inputEnd ? inputEnd.value : '';
        if (!customDateStart || !customDateEnd) {
          showToast('Selecciona la fecha inicial y final para el rango personalizado.', 'warning');
          return;
        }
        renderIngresosTab();
      });
    }

    // Modal de Registro de Consulta / Pago
    const btnOpenModal = document.getElementById('btn-open-registrar-pago');
    const modalPago = document.getElementById('modal-registrar-pago');
    const btnCloseModal = document.getElementById('btn-close-payment-modal');
    const formPago = document.getElementById('form-registrar-consulta-pago');

    const selSede = document.getElementById('reg-pago-sede');
    const inpFecha = document.getElementById('reg-pago-fecha');
    const inpPrecio = document.getElementById('reg-pago-precio');
    const selMetodo = document.getElementById('reg-pago-metodo');
    const prevBruto = document.getElementById('prev-bruto');
    const prevRecargo = document.getElementById('prev-recargo');
    const prevComPct = document.getElementById('prev-com-pct');
    const prevComision = document.getElementById('prev-comision');
    const prevNeto = document.getElementById('prev-neto');

    function updatePaymentPreview() {
      const sedeKey = selSede ? selSede.value : 'mapasingue';
      const precio = parseFloat(inpPrecio ? inpPrecio.value : 0) || 0;
      const metodo = selMetodo ? selMetodo.value : 'efectivo';

      const clinic = CLINICS[sedeKey] || { retentionRate: 0.05, name: 'Sede', realCost: 20.00, basePrice: 21.95 };
      const retentionRate = clinic.retentionRate;

      const listPrice = precio;
      let descuentoDirecto = 0;
      let totalCobrado = listPrice;

      if (metodo === 'efectivo' || metodo === 'transferencia') {
        const realTarget = (clinic.realCost && Math.abs(listPrice - (clinic.listPrice || clinic.basePrice)) < 0.1)
          ? clinic.realCost
          : +(listPrice / 1.0975).toFixed(2);
        descuentoDirecto = +(listPrice - realTarget).toFixed(2);
        totalCobrado = realTarget;
      } else {
        descuentoDirecto = 0;
        totalCobrado = listPrice;
      }

      // Base para calcular la comisión de la sede (sobre costo real / base de la consulta)
      const comisionBase = (clinic.realCost && Math.abs(listPrice - (clinic.listPrice || clinic.basePrice)) < 0.1) ? clinic.realCost : +(totalCobrado / 1.0975).toFixed(2);
      const isHospital = sedeKey === 'hospital';
      const comisionMonto = isHospital ? 0 : +(comisionBase * retentionRate).toFixed(2);
      const netoDoctor = isHospital ? 0 : +(comisionBase - comisionMonto).toFixed(2);

      if (prevBruto) prevBruto.textContent = `$${listPrice.toFixed(2)}`;
      if (prevRecargo) {
        prevRecargo.textContent = (metodo === 'efectivo' || metodo === 'transferencia')
          ? `-$${descuentoDirecto.toFixed(2)} (9.75% directo)`
          : '$0.00 (Precio de lista)';
      }
      const elCobrado = document.getElementById('prev-cobrado');
      if (elCobrado) elCobrado.textContent = `$${totalCobrado.toFixed(2)}`;
      if (prevComPct) prevComPct.textContent = `${(retentionRate * 100).toFixed(0)}%`;
      if (prevComision) prevComision.textContent = `-$${comisionMonto.toFixed(2)}`;
      if (prevNeto) prevNeto.textContent = isHospital ? '$0.00 (Sueldo Fijo)' : `$${netoDoctor.toFixed(2)}`;
    }

    if (selSede) {
      selSede.addEventListener('change', () => {
        const cKey = selSede.value;
        const clinic = CLINICS[cKey] || { basePrice: 21.95 };
        if (inpPrecio) {
          inpPrecio.value = clinic.basePrice.toFixed(2);
        }
        updatePaymentPreview();
      });
    }

    if (inpPrecio) inpPrecio.addEventListener('input', updatePaymentPreview);
    if (selMetodo) selMetodo.addEventListener('change', updatePaymentPreview);

    if (btnOpenModal && modalPago) {
      btnOpenModal.addEventListener('click', () => {
        if (inpFecha) inpFecha.value = activeDate || new Date().toISOString().split('T')[0];
        updatePaymentPreview();
        modalPago.classList.add('active');
      });
    }

    if (btnCloseModal && modalPago) {
      btnCloseModal.addEventListener('click', () => {
        modalPago.classList.remove('active');
      });
    }

    if (formPago) {
      formPago.addEventListener('submit', (e) => {
        e.preventDefault();
        const sede = selSede.value;
        const fecha = inpFecha.value;
        const nombre = document.getElementById('reg-pago-nombre').value.trim();
        const cedula = document.getElementById('reg-pago-cedula').value.trim();
        const precio = parseFloat(inpPrecio.value);
        const metodo = selMetodo.value;
        const motivo = document.getElementById('reg-pago-motivo').value.trim();

        if (!sede || !fecha || !nombre || isNaN(precio)) {
          showToast('Por favor completa todos los campos requeridos.', 'warning');
          return;
        }

        const clinic = CLINICS[sede] || { retentionRate: 0.05, realCost: 20.00, basePrice: 21.95 };
        const realTarget = (clinic.realCost && Math.abs(precio - (clinic.listPrice || clinic.basePrice)) < 0.1)
          ? clinic.realCost
          : +(precio / 1.0975).toFixed(2);
        const totalCobrado = (metodo === 'tarjeta') ? precio : realTarget;
        const discountAmount = +(precio - totalCobrado).toFixed(2);

        store.addAppointment({
          patientName: nombre,
          patientId: cedula || '0000000000',
          clinicId: sede,
          date: fecha,
          time: new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', hour12: false }) || '11:00',
          basePrice: realTarget,
          listPrice: precio,
          discountAmount: discountAmount,
          discountLabel: (discountAmount > 0) ? 'Descuento especial por pago directo del 9.75%' : null,
          paymentMethod: metodo,
          totalPaid: totalCobrado,
          reason: motivo || 'Consulta médica general'
        });

        showToast(`Consulta registrada para ${nombre} en ${CLINICS[sede]?.name}. Guardada en Supabase.`, 'success');
        modalPago.classList.remove('active');
        formPago.reset();
        renderIngresosTab();
      });
    }
  }

  function renderIngresosTab() {
    setupIngresosTabEvents();

    const kpisRoot = document.getElementById('ingresos-kpis-root');
    const daysContainer = document.getElementById('ingresos-days-container');
    if (!kpisRoot || !daysContainer) return;

    const state = store.getState();
    const allAppointments = state.appointments.filter(a => a.status !== 'cancelada');

    // Filtrar citas según el rango de fechas seleccionado
    const refDate = activeDate || '2026-09-19';
    let filteredAppointments = allAppointments;

    if (ingresosFilter === 'hoy') {
      filteredAppointments = allAppointments.filter(a => a.date === refDate);
    } else if (ingresosFilter === 'semana') {
      // Semana activa: 7 días de la semana en curso
      const dRef = new Date(refDate);
      const dayOfWeek = (dRef.getDay() + 6) % 7; // Lunes = 0
      const monday = new Date(dRef);
      monday.setDate(dRef.getDate() - dayOfWeek);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      const monStr = monday.toISOString().split('T')[0];
      const sunStr = sunday.toISOString().split('T')[0];
      filteredAppointments = allAppointments.filter(a => a.date >= monStr && a.date <= sunStr);
    } else if (ingresosFilter === 'mes') {
      const monthPrefix = refDate.substring(0, 7); // ej '2026-09'
      filteredAppointments = allAppointments.filter(a => a.date && a.date.startsWith(monthPrefix));
    } else if (ingresosFilter === 'personalizado') {
      if (customDateStart && customDateEnd) {
        filteredAppointments = allAppointments.filter(a => a.date >= customDateStart && a.date <= customDateEnd);
      }
    }

    // 1. Cálculos de Totales Globales
    let totalConsultas = filteredAppointments.length;
    let totalBruto = 0;
    let totalComisiones = 0;
    let totalRecargoTarjeta = 0;
    let totalNeto = 0;
    let hospitalConsultas = 0;

    filteredAppointments.forEach(apt => {
      const clinic = CLINICS[apt.clinicId] || { retentionRate: 0.05 };
      const base = Number(apt.basePrice) || 0;
      const rate = clinic.retentionRate;
      const comision = +(base * rate).toFixed(2);
      const neto = +(base - comision).toFixed(2);
      const cardFee = (apt.paymentMethod === 'tarjeta' && base > 0) ? (Number(apt.feeAmount) || +(base * 0.0975).toFixed(2)) : 0;

      totalBruto += base;
      totalComisiones += comision;
      totalRecargoTarjeta += cardFee;
      totalNeto += neto;
      if (apt.clinicId === 'hospital') {
        hospitalConsultas++;
      }
    });

    // Renderizar KPIs Globales
    kpisRoot.innerHTML = `
      <div class="ingresos-kpi-box" style="--kpi-border: #0284c7;">
        <span class="ingresos-kpi-label">Total Consultas</span>
        <div class="ingresos-kpi-val">${totalConsultas} <span style="font-size: 0.85rem; font-weight: 500; color: #64748b;">turnos</span></div>
        <span class="ingresos-kpi-sub">${hospitalConsultas > 0 ? `${hospitalConsultas} en Hospital Público (0% com.)` : 'En sedes privadas activas'}</span>
      </div>

      <div class="ingresos-kpi-box" style="--kpi-border: #3b82f6;">
        <span class="ingresos-kpi-label">Total Bruto Generado</span>
        <div class="ingresos-kpi-val">$${totalBruto.toFixed(2)}</div>
        <span class="ingresos-kpi-sub">Consultas × Tarifa base</span>
      </div>

      <div class="ingresos-kpi-box" style="--kpi-border: #ef4444;">
        <span class="ingresos-kpi-label">Comisiones Retenidas</span>
        <div class="ingresos-kpi-val" style="color: #dc2626;">-$${totalComisiones.toFixed(2)}</div>
        <span class="ingresos-kpi-sub">Descuento de sedes (5%, 25%, 10%)</span>
      </div>

      <div class="ingresos-kpi-box" style="--kpi-border: #f59e0b;">
        <span class="ingresos-kpi-label">Recargos Tarjeta Datafast</span>
        <div class="ingresos-kpi-val" style="color: #b45309;">+$${totalRecargoTarjeta.toFixed(2)}</div>
        <span class="ingresos-kpi-sub">9.75% bancario • No afecta comisión sede</span>
      </div>

      <div class="ingresos-kpi-box" style="--kpi-border: #10b981; background: linear-gradient(180deg, #ffffff 0%, #f0fdf4 100%);">
        <span class="ingresos-kpi-label" style="color: #15803d;">Ingreso Neto del Médico</span>
        <div class="ingresos-kpi-val" style="color: #10b981;">$${totalNeto.toFixed(2)}</div>
        <span class="ingresos-kpi-sub" style="color: #166534; font-weight: 600;">+ $1,200.00 sueldo fijo hospitalario</span>
      </div>
    `;

    // 2. Agrupación por Días y por Sedes
    if (filteredAppointments.length === 0) {
      daysContainer.innerHTML = `
        <div style="background: #ffffff; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 32px 16px; text-align: center; color: #64748b;">
          <div style="font-size: 2.2rem; margin-bottom: 8px;">📊</div>
          <h4 style="color: #0f172a; margin-bottom: 4px;">No se encontraron consultas en este rango</h4>
          <p style="font-size: 0.82rem; margin-bottom: 14px;">Cambia el filtro de fechas o registra un nuevo turno con el botón superior.</p>
        </div>
      `;
      return;
    }

    // Días únicos ordenados desc
    const uniqueDays = [...new Set(filteredAppointments.map(a => a.date))].sort((a, b) => b.localeCompare(a));

    let htmlDays = '';

    uniqueDays.forEach(dayStr => {
      const dayApts = filteredAppointments.filter(a => a.date === dayStr);

      let dayBruto = 0;
      let dayComisiones = 0;
      let dayNeto = 0;

      dayApts.forEach(a => {
        const c = CLINICS[a.clinicId] || { retentionRate: 0.05 };
        const base = Number(a.basePrice) || 0;
        const com = +(base * c.retentionRate).toFixed(2);
        dayBruto += base;
        dayComisiones += com;
        dayNeto += +(base - com).toFixed(2);
      });

      // Formato fecha en español
      const [year, month, day] = dayStr.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day);
      const dayName = dateObj.toLocaleDateString('es-EC', { weekday: 'long' });
      const dayNameCap = dayName.charAt(0).toUpperCase() + dayName.slice(1);
      const fullDateStr = dateObj.toLocaleDateString('es-EC', { day: 'numeric', month: 'long', year: 'numeric' });

      // Agrupar por sede dentro del día: mapasingue, ceibos, alborada, hospital
      const clinicKeys = ['mapasingue', 'ceibos', 'alborada', 'hospital'];
      let clinicCardsHtml = '';

      clinicKeys.forEach(cKey => {
        const cApts = dayApts.filter(a => (a.clinicId || 'ceibos') === cKey);
        if (cApts.length === 0) return;

        const clinic = CLINICS[cKey] || { name: cKey, retentionRate: 0.05, color: '#0284c7', basePrice: 20 };
        const cCount = cApts.length;
        const cBasePriceSample = cApts[0].basePrice || clinic.basePrice;
        let cBruto = 0;
        let cComision = 0;
        let cNeto = 0;

        // Métodos de pago
        let countEfectivo = 0, sumEfectivo = 0;
        let countTarjeta = 0, sumTarjeta = 0, sumTarjetaRecargo = 0;
        let countTransferencia = 0, sumTransferencia = 0;

        cApts.forEach(apt => {
          const b = Number(apt.basePrice) || 0;
          const com = +(b * clinic.retentionRate).toFixed(2);
          cBruto += b;
          cComision += com;
          cNeto += +(b - com).toFixed(2);

          if (apt.paymentMethod === 'tarjeta') {
            countTarjeta++;
            sumTarjeta += b;
            const r = Number(apt.feeAmount) || +(b * 0.0975).toFixed(2);
            sumTarjetaRecargo += r;
          } else if (apt.paymentMethod === 'transferencia') {
            countTransferencia++;
            sumTransferencia += b;
          } else {
            countEfectivo++;
            sumEfectivo += b;
          }
        });

        const isHospital = cKey === 'hospital';
        const comisionPercentLabel = isHospital ? '0%' : `${(clinic.retentionRate * 100).toFixed(0)}%`;

        let paymentPills = [];
        if (countEfectivo > 0) {
          paymentPills.push(`<span class="payment-pill efectivo">💵 Efectivo: ${countEfectivo} ($${sumEfectivo.toFixed(2)})</span>`);
        }
        if (countTarjeta > 0) {
          paymentPills.push(`<span class="payment-pill tarjeta">💳 Tarjeta Datafast: ${countTarjeta} ($${sumTarjeta.toFixed(2)} + $${sumTarjetaRecargo.toFixed(2)} recargo 9.75%)</span>`);
        }
        if (countTransferencia > 0) {
          paymentPills.push(`<span class="payment-pill transferencia">🏦 Transferencia: ${countTransferencia} ($${sumTransferencia.toFixed(2)})</span>`);
        }

        // Listado detallado de pacientes
        const patientsListHtml = cApts.map(apt => `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 5px 0; border-bottom: 1px dashed #e2e8f0;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-family: monospace; font-weight: 700; color: #0284c7;">#${apt.code || apt.id}</span>
              <span style="font-weight: 600; color: #1e293b;">${apt.patientName}</span>
              <span style="font-size: 0.7rem; color: #64748b;">⏰ ${apt.time}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 0.72rem; color: #64748b;">${apt.paymentMethod === 'tarjeta' ? '💳 Tarjeta (+9.75%)' : (apt.paymentMethod === 'transferencia' ? '🏦 Transferencia' : '💵 Efectivo')}</span>
              <strong style="color: #0f172a;">$${(apt.basePrice || 0).toFixed(2)}</strong>
            </div>
          </div>
        `).join('');

        clinicCardsHtml += `
          <div class="ingresos-clinic-row-card" style="--clinic-border-color: ${clinic.color};">
            <div class="ingresos-clinic-top-row">
              <div class="ingresos-clinic-name">
                <span style="width: 12px; height: 12px; border-radius: 50%; background: ${clinic.color};"></span>
                <span>${clinic.name} — ${dayNameCap}</span>
                <span class="badge-sede ${clinic.badgeClass}" style="font-size: 0.68rem; padding: 2px 8px;">
                  ${isHospital ? '0% Comisión (Convenio Sueldo Fijo)' : `${comisionPercentLabel} Comisión Sede`}
                </span>
              </div>
              <div style="font-size: 0.8rem; font-weight: 700; color: #64748b;">
                ${dayStr}
              </div>
            </div>

            <!-- Flujo de Cálculo Exacto Solicitado por el Usuario -->
            <div class="ingresos-formula-flow">
              <div class="formula-step">
                <span class="formula-step-label">Consultas</span>
                <span class="formula-step-val" style="color: #0f172a;">${cCount} turno${cCount > 1 ? 's' : ''}</span>
              </div>

              <span class="formula-arrow">×</span>

              <div class="formula-step">
                <span class="formula-step-label">Precio Consulta</span>
                <span class="formula-step-val" style="color: #475569;">$${cBasePriceSample.toFixed(2)}</span>
              </div>

              <span class="formula-arrow">→</span>

              <div class="formula-step">
                <span class="formula-step-label">Total Generado</span>
                <span class="formula-step-val" style="color: #0284c7;">$${cBruto.toFixed(2)}</span>
              </div>

              <span class="formula-arrow">−</span>

              <div class="formula-step">
                <span class="formula-step-label">Comisión (${comisionPercentLabel})</span>
                <span class="formula-step-val" style="color: #dc2626;">-$${cComision.toFixed(2)}</span>
              </div>

              <span class="formula-arrow">→</span>

              <div class="formula-step">
                <span class="formula-step-label" style="color: #15803d;">Ingreso Neto Médico</span>
                <span class="formula-step-val" style="color: #10b981; font-size: 1.05rem;">
                  $${isHospital ? '0.00 (Sueldo Fijo)' : cNeto.toFixed(2)}
                </span>
              </div>
            </div>

            <!-- Desglose de Métodos de Pago -->
            <div class="ingresos-payment-breakdown">
              <strong style="color: #334155;">Métodos de Pago:</strong>
              ${paymentPills.join(' ')}
            </div>

            <!-- Detalle de Pacientes del Turno -->
            <details style="margin-top: 4px; cursor: pointer;">
              <summary style="font-size: 0.74rem; font-weight: 700; color: #0284c7; outline: none;">
                👁️ Ver desglose de ${cCount} paciente${cCount > 1 ? 's' : ''} (${clinic.name})
              </summary>
              <div class="ingresos-patients-detail">
                ${patientsListHtml}
              </div>
            </details>
          </div>
        `;
      });

      htmlDays += `
        <div class="ingresos-day-card">
          <div class="ingresos-day-header-bar">
            <div class="ingresos-day-title">
              <span>📅 ${dayNameCap}, ${fullDateStr}</span>
            </div>
            <div class="ingresos-day-summary-badges">
              <span class="badge-day-stat" style="background: #eff6ff; color: #1e40af;">${dayApts.length} consultas</span>
              <span class="badge-day-stat" style="background: #f1f5f9; color: #334155;">$${dayBruto.toFixed(2)} bruto</span>
              <span class="badge-day-stat" style="background: #fef2f2; color: #b91c1c;">-$${dayComisiones.toFixed(2)} comisiones</span>
              <span class="badge-day-stat" style="background: #f0fdf4; color: #15803d; font-weight: 800;">$${dayNeto.toFixed(2)} netos</span>
            </div>
          </div>

          <div class="ingresos-day-clinics-list">
            ${clinicCardsHtml}
          </div>
        </div>
      `;
    });

    daysContainer.innerHTML = htmlDays;
  }

  // Escuchar cuando el médico entra a su portal o cambia el estado para renderizar
  store.subscribe((state) => {
    if (state.activeView === 'doctor') {
      switchDoctorTab(activeDoctorTab);
    }
  });

  // Inicializar vista de cronograma inicial si ya está en vista doctor
  if (store.getActiveView() === 'doctor') {
    switchDoctorTab('agenda');
  } else {
    renderTimeline();
  }
}
