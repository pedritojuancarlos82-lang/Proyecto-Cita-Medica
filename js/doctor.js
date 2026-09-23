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
