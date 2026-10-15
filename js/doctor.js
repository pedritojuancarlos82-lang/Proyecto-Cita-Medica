/**
 * Flujo 2: Portal Médico Mobile-First (Página 4 del documento)
 * Diseñado para operar en pantalla táctil de un Xiaomi Redmi Note (390x844px)
 * Incluye cronograma de rutas con advertencia de traslado en ámbar,
 * botón de guardia de emergencia con reagendamiento asistido,
 * buscador reactivo de fichas clínicas, recetario digital y registro de gastos en 2 toques.
 */
import { CLINICS, DEMO_USERS, getTodayDateStr, store } from './state.js';
import { EmailService } from './services/email-service.js';

export function setupDoctorPortal(showToast) {
  let activeDoctorTab = 'agenda'; // 'agenda', 'fichas', 'recetas', 'gastos', 'ingresos', 'notificaciones'
  let activeDate = getTodayDateStr(); // Inicializar SIEMPRE con la fecha de hoy automáticamente

  // Elementos de la barra de navegación (Móvil, Pestañas Superiores y Bottom Nav)
  const bottomNavButtons = document.querySelectorAll('.doctor-bottom-nav .bottom-nav-item');
  const mobilePillButtons = document.querySelectorAll('.doc-mobile-pill');
  const desktopNavButtons = document.querySelectorAll('#nav-menu-doctor .nav-tab-btn');
  const doctorPanes = document.querySelectorAll('.doctor-pane-view');

  // Botones de guardia y modales (Soporte dual: modal-guardia-imprevista y emergency-guard-modal)
  const btnEmergencyFab = document.getElementById('btn-emergency-guard-fab');
  const btnMobileQuickGuard = document.getElementById('btn-mobile-quick-guard');
  const emergencyModal = document.getElementById('modal-guardia-imprevista') || document.getElementById('emergency-guard-modal');
  const btnCloseEmergencyModal = document.getElementById('btn-close-guardia-modal') || document.getElementById('btn-close-emergency-modal');
  const emergencyActionsList = document.getElementById('guardia-affected-list') || document.getElementById('emergency-affected-list');
  const emergencyBanner = document.getElementById('doctor-emergency-active-banner');

  // Controles de Configuración de Guardia Imprevista
  const inputGuardiaFecha = document.getElementById('guardia-fecha-input');
  const selectGuardiaFranja = document.getElementById('guardia-franja-select');
  const selectGuardiaMotivo = document.getElementById('guardia-motivo-select');
  const customRangeBox = document.getElementById('guardia-custom-range');
  const inputHoraInicio = document.getElementById('guardia-hora-inicio');
  const inputHoraFin = document.getElementById('guardia-hora-fin');
  const guardiaAffectedCount = document.getElementById('guardia-affected-count');
  const btnBatchReschedule = document.getElementById('btn-guardia-batch-reprogramar');
  const btnBatchCancel = document.getElementById('btn-guardia-batch-cancelar');

  // Funciones de navegación de fecha (Día anterior, Hoy, Día siguiente)
  function shiftActiveDate(days) {
    const parts = activeDate.split('-');
    const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    d.setDate(d.getDate() + days);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    activeDate = `${y}-${m}-${day}`;
    renderTimeline();
  }

  function setTodayDate() {
    activeDate = getTodayDateStr();
    renderTimeline();
    showToast('Fecha de agenda restablecida al día de hoy.', 'info');
  }

  function formatSpanishDate(dateStr) {
    const parts = dateStr.split('-');
    const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const isToday = dateStr === getTodayDateStr();
    return `${days[d.getDay()]}, ${d.getDate()} de ${months[d.getMonth()]} de ${d.getFullYear()}${isToday ? ' (HOY)' : ''}`;
  }

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
    if (activeDoctorTab === 'notificaciones') renderNotificationsTab();
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

  // Inicializar eventos del modal de prescripción médica oficial (Semana 4 - Parte 2)
  initPrescriptionModalEvents();

  // Inicializar eventos de relevo médico y alertas del sistema (Semana 5 - Parte 2)
  initReliefModalEvents();
  initSystemAlertsEvents();
  renderSystemAlertsBadge();

  // --- 1. CRONOGRAMA DIARIO & RUTAS (Timeline Vertical con Navegación de Fechas) ---
  function renderTimeline() {
    const timelineEl = document.getElementById('doctor-timeline-list');
    const agendaHeaderContainer = document.getElementById('doctor-agenda-header-toolbar');
    const state = store.getState();
    const isGuardActive = state.emergencyGuard.isActive;
    const isToday = activeDate === getTodayDateStr();

    // Actualizar banner si la guardia está activa
    if (emergencyBanner) {
      emergencyBanner.style.display = isGuardActive ? 'flex' : 'none';
    }

    const todayAppointments = state.appointments
      .filter(a => a.date === activeDate && a.status !== 'cancelada')
      .sort((a, b) => a.time.localeCompare(b.time));

    const travelBuffers = state.travelBuffers.filter(t => t.date === activeDate);

    // Actualizar o inyectar la barra de herramientas de fechas del Doctor
    if (agendaHeaderContainer) {
      agendaHeaderContainer.innerHTML = `
        <div class="doctor-date-nav-card" style="background: #ffffff; border: 1px solid var(--border-light); border-radius: 12px; padding: 12px 16px; margin-bottom: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 1.25rem;">📅</span>
              <div>
                <strong style="color: var(--dark-navy); font-size: 0.95rem;">${formatSpanishDate(activeDate)}</strong>
                <div style="font-size: 0.74rem; color: #64748b; margin-top: 1px;">
                  ${todayAppointments.length} ${todayAppointments.length === 1 ? 'consulta agendada' : 'consultas agendadas'} • ${travelBuffers.length} ${travelBuffers.length === 1 ? 'traslado intersede' : 'traslados intersedes'}
                </div>
              </div>
            </div>
            
            <!-- Botones de Navegación de Fecha, Guardia de Emergencia y Relevo Médico -->
            <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
              <button type="button" class="btn-relief-trigger" id="btn-doctor-trigger-relevo" style="background: linear-gradient(135deg, #0284c7, #2563eb); color: #ffffff; padding: 6px 13px; font-size: 0.78rem; font-weight: 700; border-radius: 8px; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 2px 6px rgba(37, 99, 235, 0.3);">
                <span style="font-size: 0.9rem;">🔄</span>
                <span>Asignar Médico de Relevo</span>
              </button>
              <button type="button" class="btn-emergency-guard-trigger" id="btn-doctor-trigger-guardia" style="background: linear-gradient(135deg, #ef4444, #dc2626); color: #ffffff; padding: 6px 13px; font-size: 0.78rem; font-weight: 700; border-radius: 8px; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 2px 6px rgba(220, 38, 38, 0.3);">
                <span style="font-size: 0.9rem;">🚨</span>
                <span>Activar Guardia / Bloqueo</span>
              </button>
              <button type="button" class="btn-secondary" id="btn-doc-date-prev" style="padding: 6px 12px; font-size: 0.78rem; font-weight: 700;">
                ◀ Anterior
              </button>
              <button type="button" class="${isToday ? 'btn-primary' : 'btn-secondary'}" id="btn-doc-date-today" style="padding: 6px 14px; font-size: 0.78rem; font-weight: 700;">
                📅 Hoy
              </button>
              <button type="button" class="btn-secondary" id="btn-doc-date-next" style="padding: 6px 12px; font-size: 0.78rem; font-weight: 700;">
                Siguiente ▶
              </button>
              <input type="date" id="input-doc-date-picker" value="${activeDate}" style="padding: 5px 8px; font-size: 0.78rem; border: 1px solid #cbd5e1; border-radius: 6px; color: #334155; cursor: pointer;" title="Seleccionar fecha específica" />
            </div>
          </div>
        </div>
      `;

      // Escuchadores de la barra de navegación de fecha y relevo
      const btnRelevoTrigger = document.getElementById('btn-doctor-trigger-relevo');
      const btnGuardiaTrigger = document.getElementById('btn-doctor-trigger-guardia');
      const btnPrev = document.getElementById('btn-doc-date-prev');
      const btnToday = document.getElementById('btn-doc-date-today');
      const btnNext = document.getElementById('btn-doc-date-next');
      const inputPicker = document.getElementById('input-doc-date-picker');

      if (btnRelevoTrigger) btnRelevoTrigger.addEventListener('click', () => openReliefModal());
      if (btnGuardiaTrigger) btnGuardiaTrigger.addEventListener('click', () => openEmergencyModal());
      if (btnPrev) btnPrev.addEventListener('click', () => shiftActiveDate(-1));
      if (btnToday) btnToday.addEventListener('click', () => setTodayDate());
      if (btnNext) btnNext.addEventListener('click', () => shiftActiveDate(1));
      if (inputPicker) {
        inputPicker.addEventListener('change', (e) => {
          if (e.target.value) {
            activeDate = e.target.value;
            renderTimeline();
          }
        });
      }
    }

    if (!timelineEl) return;

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
        <div style="text-align: center; padding: 40px 20px; background: #ffffff; border-radius: 12px; border: 1px dashed #cbd5e1; color: #64748b;">
          <span style="font-size: 2.5rem;">📅</span>
          <p style="margin-top: 10px; font-weight: 700; color: #334155; font-size: 1rem;">No hay citas agendadas para esta fecha (${formatSpanishDate(activeDate)}).</p>
          <p style="font-size: 0.82rem; margin-top: 4px;">Utilice los botones de navegación superiores para consultar otros días o el botón "📅 Hoy" para volver a la fecha actual.</p>
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
      const isReliefAssigned = apt.status === 'relevo_asignado';

      return `
        <div class="timeline-card ${apt.clinicId} ${isEmergencyInterrupted ? 'en_guardia' : ''} ${isReliefAssigned ? 'relevo_asignado' : ''}">
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
                (isReliefAssigned ? 
                  `<span class="badge-sede" style="background: #e0f2fe; color: #0369a1; border: 1px solid #7dd3fc; font-weight: 700;">🔄 Relevo: ${apt.reliefDoctor || 'Colega Asignado'}</span>` : 
                  `<span style="font-size: 0.72rem; font-weight: 700; color: #10b981;">$${apt.totalPaid.toFixed(2)} (${apt.paymentMethod})</span>`
                )}
            </div>
            ${isReliefAssigned ? `
              <div style="font-size: 0.73rem; color: #0369a1; background: #f0f9ff; padding: 5px 8px; border-radius: 6px; margin-top: 6px; border: 1px dashed #bae6fd;">
                👨‍⚕️ Cubierto por <strong>${apt.reliefDoctor || 'Colega Relevo'}</strong> (${apt.reliefDoctorCode || 'MSP'}). Paciente notificado. Sede y horario preservados.
              </div>
            ` : ''}
            <div style="margin-top: 8px; display: flex; gap: 6px; flex-wrap: wrap;">
              <button type="button" class="btn-timeline-open-record" data-id="${apt.id}" data-patient-id="${apt.patientId}" style="min-height: 38px; border: 1px solid #bfdbfe; background: #eff6ff; color: #0284c7; font-size: 0.76rem; font-weight: 700; border-radius: 6px; padding: 6px 10px; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">
                📋 Abrir Expediente & SOAP →
              </button>
              <button type="button" class="btn-timeline-open-rx" data-id="${apt.id}" data-patient-id="${apt.patientId}" style="min-height: 38px; border: 1px solid #bbf7d0; background: #f0fdf4; color: #166534; font-size: 0.76rem; font-weight: 700; border-radius: 6px; padding: 6px 10px; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">
                💊 Receta MSP →
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    timelineEl.querySelectorAll('.btn-timeline-open-record').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const pId = btn.dataset.patientId;
        const aptId = btn.dataset.id;
        const state = store.getState();
        let record = state.medicalRecords.find(r => r.patientId === pId || r.patientCedula === pId);
        if (!record) {
          const apt = state.appointments.find(a => a.id === aptId);
          record = store.addMedicalRecord({
            patientId: pId,
            patientCedula: pId,
            patientName: apt ? apt.patientName : 'Paciente',
            motivo: apt ? apt.reason : 'Consulta General',
            sede: apt && CLINICS[apt.clinicId] ? CLINICS[apt.clinicId].name : 'Clínica Ceibos'
          });
        }
        openRecordModal({
          ...record,
          appointmentId: aptId
        });
      });
    });

    timelineEl.querySelectorAll('.btn-timeline-open-rx').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const pId = btn.dataset.patientId;
        const aptId = btn.dataset.id;
        const state = store.getState();
        const apt = state.appointments.find(a => a.id === aptId);
        const record = state.medicalRecords.find(r => r.patientId === pId || r.patientCedula === pId) || {};
        const clinic = apt ? (CLINICS[apt.clinicId] || CLINICS.ceibos) : CLINICS.ceibos;

        openPrescriptionModal({
          patientId: pId,
          patientCedula: record.patientCedula || pId,
          patientName: apt ? apt.patientName : (record.patientName || 'Paciente'),
          age: record.age || 44,
          sede: clinic.name,
          diagnosis: apt ? apt.reason : (record.lastDiagnosis || 'Consulta de Medicina General'),
          appointmentId: aptId
        });
      });
    });
  }



  // --- 2. MECANISMO DE GUARDIA IMPREVISTA Y REPROGRAMACIÓN ÁGIL (Semana 4 - Parte 3) ---
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
      if (emergencyModal) emergencyModal.classList.remove('active');
    });
  }

  // Sincronización de eventos de configuración de guardia
  if (inputGuardiaFecha) {
    inputGuardiaFecha.addEventListener('change', () => {
      renderEmergencyModalList();
    });
  }

  if (selectGuardiaFranja) {
    selectGuardiaFranja.addEventListener('change', (e) => {
      if (customRangeBox) {
        customRangeBox.style.display = (e.target.value === 'personalizado') ? 'block' : 'none';
      }
      renderEmergencyModalList();
    });
  }

  if (inputHoraInicio) {
    inputHoraInicio.addEventListener('change', () => renderEmergencyModalList());
  }
  if (inputHoraFin) {
    inputHoraFin.addEventListener('change', () => renderEmergencyModalList());
  }

  // Acciones Masivas (En Lote)
  if (btnBatchReschedule) {
    btnBatchReschedule.addEventListener('click', () => {
      const affected = getAffectedAppointments().filter(a => a.status !== 'reprogramada_guardia');
      if (affected.length === 0) {
        showToast('No hay citas pendientes de reprogramar en la franja seleccionada.', 'info');
        return;
      }
      const motivo = selectGuardiaMotivo ? selectGuardiaMotivo.value : 'Llamado a Guardia Hospitalaria';
      affected.forEach(apt => {
        store.rescheduleAppointmentForGuard(apt.id, null, null, motivo);
      });
      showToast(`⚡ ${affected.length} citas reprogramadas ágilmente con notificación prioritaria a los pacientes.`, 'success');
      renderEmergencyModalList();
      renderTimeline();
      if (activeDoctorTab === 'notificaciones') renderNotificationsTab();
    });
  }

  if (btnBatchCancel) {
    btnBatchCancel.addEventListener('click', () => {
      const affected = getAffectedAppointments();
      if (affected.length === 0) {
        showToast('No hay citas que cancelar en esta franja.', 'info');
        return;
      }
      if (!confirm(`¿Está seguro de cancelar las ${affected.length} citas seleccionadas y emitir tickets de reembolso prioritario?`)) {
        return;
      }
      const motivo = selectGuardiaMotivo ? selectGuardiaMotivo.value : 'Llamado a Guardia Hospitalaria';
      affected.forEach(apt => {
        store.cancelAppointmentForGuard(apt.id, motivo);
      });
      showToast(`🚫 ${affected.length} citas canceladas y registradas para reprogramación prioritaria sin costo.`, 'warning');
      renderEmergencyModalList();
      renderTimeline();
      if (activeDoctorTab === 'notificaciones') renderNotificationsTab();
    });
  }

  function getContingencyTimeRange() {
    const franja = selectGuardiaFranja ? selectGuardiaFranja.value : 'tarde';
    let start = '14:00';
    let end = '18:00';

    if (franja === 'completo') {
      start = '00:00';
      end = '23:59';
    } else if (franja === 'manana') {
      start = '08:00';
      end = '13:00';
    } else if (franja === 'tarde') {
      start = '14:00';
      end = '18:00';
    } else if (franja === 'noche') {
      start = '18:00';
      end = '21:00';
    } else if (franja === 'personalizado') {
      start = (inputHoraInicio && inputHoraInicio.value) || '14:00';
      end = (inputHoraFin && inputHoraFin.value) || '18:00';
    }

    return { start, end };
  }

  function getAffectedAppointments() {
    const targetDate = (inputGuardiaFecha && inputGuardiaFecha.value) || activeDate;
    const { start, end } = getContingencyTimeRange();
    const state = store.getState();

    return state.appointments.filter(a => {
      if (a.date !== targetDate) return false;
      if (a.clinicId === 'hospital') return false; // La guardia se atiende en el Hospital
      if (a.status === 'cancelada' || a.status === 'cancelada_guardia') return false;
      const aptTime = a.time;
      return aptTime >= start && aptTime <= end;
    }).sort((a, b) => a.time.localeCompare(b.time));
  }

  function openEmergencyModal() {
    const state = store.getState();
    if (inputGuardiaFecha) {
      inputGuardiaFecha.value = activeDate;
    }

    // Activar modo guardia en el estado si no estaba activo
    if (!state.emergencyGuard.isActive) {
      const motivo = selectGuardiaMotivo ? selectGuardiaMotivo.value : 'Convocatoria urgente a Guardia Hospitalaria';
      store.activateEmergencyGuard(motivo);
      showToast('🚨 Modo Guardia Activado. Bloqueo de agenda y gestión de contingencia.', 'danger');
    }

    renderEmergencyModalList();
    if (emergencyModal) emergencyModal.classList.add('active');
  }

  function renderEmergencyModalList() {
    if (!emergencyActionsList) return;
    const affected = getAffectedAppointments();
    const motivo = selectGuardiaMotivo ? selectGuardiaMotivo.value : 'Llamado a Guardia Hospitalaria';

    if (guardiaAffectedCount) {
      guardiaAffectedCount.textContent = `${affected.length} Cita${affected.length === 1 ? '' : 's'}`;
    }

    if (affected.length === 0) {
      emergencyActionsList.innerHTML = `
        <div style="text-align: center; padding: 28px 16px; background: #f0fdf4; border: 1px dashed #86efac; border-radius: 12px; color: #166534;">
          <div style="font-size: 1.8rem; margin-bottom: 6px;">✅</div>
          <strong style="font-size: 0.95rem;">No hay citas en conflicto en este horario</strong>
          <p style="font-size: 0.8rem; color: #4b5563; margin-top: 4px;">El Dr. Campoverde puede acudir a su guardia hospitalaria sin interferir con turnos de pacientes.</p>
        </div>
      `;
      return;
    }

    emergencyActionsList.innerHTML = affected.map(apt => {
      const clinic = CLINICS[apt.clinicId] || { name: 'Sede Privada', badgeClass: 'badge-ceibos' };
      const isRescheduled = apt.status === 'reprogramada_guardia';

      return `
        <div class="guardia-affected-item" style="background: ${isRescheduled ? '#eff6ff' : '#fff1f2'}; border: 1px solid ${isRescheduled ? '#bfdbfe' : '#fecdd3'}; border-radius: 12px; padding: 12px 14px; display: flex; flex-direction: column; gap: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <strong style="font-size: 0.92rem; color: ${isRescheduled ? '#1e40af' : '#991b1b'};">⏰ ${apt.time} • ${apt.patientName}</strong>
              <span class="badge-sede ${clinic.badgeClass}" style="font-size: 0.72rem; padding: 2px 7px; border-radius: 6px;">${clinic.name}</span>
            </div>
            ${isRescheduled ? `
              <span style="font-size: 0.72rem; font-weight: 700; background: #dbeafe; color: #1e40af; padding: 3px 8px; border-radius: 9999px;">
                ✓ Reprogramada Ágilmente
              </span>
            ` : `
              <span style="font-size: 0.72rem; font-weight: 700; background: #fee2e2; color: #991b1b; padding: 3px 8px; border-radius: 9999px;">
                ⚠️ En Conflicto de Guardia
              </span>
            `}
          </div>

          <div style="font-size: 0.78rem; color: #475569; display: flex; justify-content: space-between;">
            <span>Motivo Consulta: <strong>${apt.reason || 'Medicina General'}</strong></span>
            <span>Tel/Correo: <strong>${apt.patientPhone || apt.patientEmail || 'Registrado'}</strong></span>
          </div>

          ${apt.notes ? `
            <div style="font-size: 0.74rem; color: #64748b; background: rgba(255,255,255,0.7); padding: 5px 8px; border-radius: 6px;">
              ${apt.notes}
            </div>
          ` : ''}

          <div style="display: flex; gap: 8px; margin-top: 4px;">
            <button type="button" class="btn-reschedule-guardia" data-id="${apt.id}" style="flex: 1; padding: 7px 10px; font-size: 0.76rem; font-weight: 700; background: #2563eb; color: #ffffff; border: none; border-radius: 8px; cursor: pointer; display: inline-flex; justify-content: center; align-items: center; gap: 4px;">
              <span>⚡ ${isRescheduled ? 'Cambiar Nuevo Horario' : 'Reprogramar Ágilmente'}</span>
            </button>
            <button type="button" class="btn-cancel-guardia" data-id="${apt.id}" style="flex: 1; padding: 7px 10px; font-size: 0.76rem; font-weight: 700; background: #ef4444; color: #ffffff; border: none; border-radius: 8px; cursor: pointer; display: inline-flex; justify-content: center; align-items: center; gap: 4px;">
              <span>🚫 Cancelar con Prioridad</span>
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Escuchadores unitarios de Reprogramación y Cancelación
    emergencyActionsList.querySelectorAll('.btn-reschedule-guardia').forEach(btn => {
      btn.addEventListener('click', () => {
        const aptId = btn.dataset.id;
        store.rescheduleAppointmentForGuard(aptId, null, null, motivo);
        showToast('Su turno ha sido reprogramado debido a una guardia hospitalaria imprevista del Dr. Campoverde. Se ha reservado su espacio prioritario.', 'success');
        renderEmergencyModalList();
        renderTimeline();
        if (activeDoctorTab === 'notificaciones') renderNotificationsTab();
      });
    });

    emergencyActionsList.querySelectorAll('.btn-cancel-guardia').forEach(btn => {
      btn.addEventListener('click', () => {
        const aptId = btn.dataset.id;
        store.cancelAppointmentForGuard(aptId, motivo);
        showToast('Turno cancelado por contingencia de guardia. Se emitió ticket de reagendamiento prioritario para el paciente.', 'warning');
        renderEmergencyModalList();
        renderTimeline();
        if (activeDoctorTab === 'notificaciones') renderNotificationsTab();
      });
    });
  }

  // --- 2.1 MECANISMO DE RELEVO MÉDICO ENTRE COLEGAS (Semana 5 - Parte 2 - Jorge) ---
  function openReliefModal() {
    const modal = document.getElementById('modal-asignar-relevo-medico');
    if (!modal) return;

    const state = store.getState();
    const todayAppointments = (state.appointments || [])
      .filter(a => a.date === activeDate && a.status !== 'cancelada' && a.status !== 'cancelada_guardia')
      .sort((a, b) => a.time.localeCompare(b.time));

    const listContainer = document.getElementById('relief-appointments-list');
    const specificScopeBtn = document.getElementById('btn-scope-specific');
    const fullScopeBtn = document.getElementById('btn-scope-full');
    const selectionBox = document.getElementById('relief-appointments-selection-box');
    let currentScope = 'citas_especificas';

    // Switcher de franja
    if (specificScopeBtn && fullScopeBtn) {
      specificScopeBtn.onclick = () => {
        currentScope = 'citas_especificas';
        specificScopeBtn.classList.add('active');
        fullScopeBtn.classList.remove('active');
        if (selectionBox) selectionBox.style.display = 'block';
      };
      fullScopeBtn.onclick = () => {
        currentScope = 'guardia_completa';
        fullScopeBtn.classList.add('active');
        specificScopeBtn.classList.remove('active');
        if (selectionBox) selectionBox.style.display = 'none';
      };
    }

    // Renderizar lista de citas seleccionables
    if (listContainer) {
      if (todayAppointments.length === 0) {
        listContainer.innerHTML = `
          <div style="font-size: 0.78rem; color: #64748b; text-align: center; padding: 14px;">
            No hay consultas activas agendadas para el día ${formatSpanishDate(activeDate)}.
          </div>
        `;
      } else {
        listContainer.innerHTML = todayAppointments.map(apt => {
          const clinic = CLINICS[apt.clinicId] || { name: apt.clinicId || 'Sede' };
          const isAlreadyRelief = apt.status === 'relevo_asignado';
          return `
            <label class="relief-appointment-check-row ${isAlreadyRelief ? 'selected' : ''}">
              <input type="checkbox" class="relief-apt-checkbox" value="${apt.id}" checked />
              <div style="flex: 1;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-weight: 700; font-size: 0.8rem; color: #0f172a;">${apt.time} - ${apt.patientName}</span>
                  <span class="badge-sede ${clinic.badgeClass || 'badge-ceibos'}" style="font-size: 0.68rem; padding: 1px 6px;">${clinic.name}</span>
                </div>
                <div style="font-size: 0.72rem; color: #64748b;">
                  📋 ${apt.reason || 'Consulta General'} • Cédula: ${apt.patientId || 'N/A'}
                  ${isAlreadyRelief ? `<span style="color: #0284c7; font-weight: 700; margin-left: 6px;">(Relevo actual: ${apt.reliefDoctor})</span>` : ''}
                </div>
              </div>
            </label>
          `;
        }).join('');
      }
    }

    // Botón Seleccionar Todas
    const btnSelectAll = document.getElementById('btn-relief-select-all');
    if (btnSelectAll) {
      btnSelectAll.onclick = () => {
        const checkboxes = modal.querySelectorAll('.relief-apt-checkbox');
        const anyUnchecked = Array.from(checkboxes).some(cb => !cb.checked);
        checkboxes.forEach(cb => { cb.checked = anyUnchecked; });
        btnSelectAll.textContent = anyUnchecked ? 'Deseleccionar Todas' : 'Seleccionar Todas';
      };
    }

    modal.classList.add('active');
  }

  function initReliefModalEvents() {
    const modal = document.getElementById('modal-asignar-relevo-medico');
    const btnClose = document.getElementById('btn-close-relevo-modal');
    const btnCancel = document.getElementById('btn-cancelar-relevo');
    const btnConfirm = document.getElementById('btn-confirmar-relevo-medico');
    const doctorSelect = document.getElementById('relief-doctor-select');
    const detailsHint = document.getElementById('relief-doctor-details-hint');
    const motivoInput = document.getElementById('relief-motivo-input');

    if (doctorSelect && detailsHint) {
      doctorSelect.addEventListener('change', () => {
        const opt = doctorSelect.options[doctorSelect.selectedIndex];
        detailsHint.textContent = `Especialidad: ${opt.dataset.spec} • Teléfono: ${opt.dataset.phone}`;
      });
    }

    if (btnClose) btnClose.onclick = () => modal && modal.classList.remove('active');
    if (btnCancel) btnCancel.onclick = () => modal && modal.classList.remove('active');

    if (btnConfirm) {
      btnConfirm.onclick = () => {
        const opt = doctorSelect ? doctorSelect.options[doctorSelect.selectedIndex] : null;
        const coveringDoctor = opt ? opt.dataset.name : 'Dra. Elena Morales';
        const coveringDoctorCode = opt ? opt.dataset.code : 'MSP-REG-092834';
        const coveringDoctorSpecialty = opt ? opt.dataset.spec : 'Medicina Familiar y Comunitaria';
        const coveringDoctorPhone = opt ? opt.dataset.phone : '+593 98 471 9283';
        const reason = motivoInput ? motivoInput.value.trim() : 'Convocatoria imprevista a guardia hospitalaria en Hospital Ceibos';

        const scopeBtn = document.getElementById('btn-scope-full');
        const isFullGuard = scopeBtn && scopeBtn.classList.contains('active');
        const scope = isFullGuard ? 'guardia_completa' : 'citas_especificas';

        const checkedBoxes = modal.querySelectorAll('.relief-apt-checkbox:checked');
        const appointmentIds = Array.from(checkedBoxes).map(cb => cb.value);

        if (!isFullGuard && appointmentIds.length === 0) {
          showToast('Selecciona al menos una consulta médica para transferir al colega de relevo.', 'warning');
          return;
        }

        const result = store.assignDoctorRelief({
          coveringDoctor,
          coveringDoctorCode,
          coveringDoctorSpecialty,
          coveringDoctorPhone,
          reason,
          scope,
          appointmentIds,
          date: activeDate
        });

        if (modal) modal.classList.remove('active');

        showToast(`✅ Relevo asignado a ${coveringDoctor}. Pacientes notificados: "Su atención médica en Sede será cubierta por ${coveringDoctor} en el mismo horario acordado."`, 'success');

        renderTimeline();
        renderSystemAlertsBadge();
        if (activeDoctorTab === 'notificaciones') renderNotificationsTab();
      };
    }
  }

  // --- 2.2 PANEL DE ALERTAS OPERATIVAS DEL SISTEMA (Semana 5 - Parte 2) ---
  function renderSystemAlertsBadge() {
    const alerts = store.getSystemAlerts();
    const countBadge = document.getElementById('badge-system-alerts-count');
    const mobileBadge = document.getElementById('badge-mobile-alerts-count');
    const allCountEl = document.getElementById('alert-filter-all-count');

    if (countBadge) {
      countBadge.textContent = alerts.length;
      countBadge.style.display = alerts.length > 0 ? 'inline-block' : 'none';
    }
    if (mobileBadge) {
      mobileBadge.textContent = alerts.length;
      mobileBadge.style.display = alerts.length > 0 ? 'inline-block' : 'none';
    }
    if (allCountEl) {
      allCountEl.textContent = alerts.length;
    }
  }

  function openSystemAlertsModal(filterCategory = 'all') {
    const modal = document.getElementById('modal-alertas-sistema');
    const listContainer = document.getElementById('system-alerts-list-container');
    if (!modal || !listContainer) return;

    const alerts = store.getSystemAlerts();
    const filtered = filterCategory === 'all' 
      ? alerts 
      : alerts.filter(a => a.category === filterCategory);

    if (filtered.length === 0) {
      listContainer.innerHTML = `
        <div style="text-align: center; padding: 32px 16px; color: #64748b; background: #f8fafc; border-radius: 8px;">
          <span style="font-size: 1.8rem; display: block; margin-bottom: 6px;">🎉</span>
          <strong style="color: #0f172a;">Sin alertas operativas pendientes en esta categoría</strong>
          <p style="font-size: 0.76rem; margin: 4px 0 0;">Todos los turnos, historiales y traslados se encuentran debidamente monitoreados.</p>
        </div>
      `;
    } else {
      listContainer.innerHTML = filtered.map(a => {
        return `
          <div class="system-alert-card severity-${a.severity || 'INFO'}" id="alert-card-${a.id}">
            <div class="system-alert-header">
              <span class="system-alert-title">
                <span>${a.icon || '⚠️'}</span>
                <span>${a.title}</span>
              </span>
              <button type="button" class="alert-dismiss-btn" data-alert-id="${a.id}" title="Descartar alerta">✕</button>
            </div>
            <p class="system-alert-message">${a.message}</p>
            <div class="system-alert-footer">
              <span style="font-weight: 700; color: #1e40af;">👉 Acción: ${a.actionRequired || 'Revisar expediente'}</span>
              <span>${a.time || ''}</span>
            </div>
          </div>
        `;
      }).join('');

      listContainer.querySelectorAll('.alert-dismiss-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const alertId = btn.dataset.alertId;
          store.dismissSystemAlert(alertId);
          openSystemAlertsModal(filterCategory);
          renderSystemAlertsBadge();
          showToast('Alerta descartada del panel operativo.', 'info');
        });
      });
    }

    modal.classList.add('active');
  }

  function initSystemAlertsEvents() {
    const btnDesktopAlerts = document.getElementById('btn-doctor-system-alerts');
    const btnMobileAlerts = document.getElementById('btn-mobile-quick-alerts');
    const modal = document.getElementById('modal-alertas-sistema');
    const btnClose = document.getElementById('btn-close-alertas-modal');
    const btnCloseFooter = document.getElementById('btn-close-alertas-footer');

    if (btnDesktopAlerts) btnDesktopAlerts.addEventListener('click', () => openSystemAlertsModal('all'));
    if (btnMobileAlerts) btnMobileAlerts.addEventListener('click', () => openSystemAlertsModal('all'));
    if (btnClose) btnClose.onclick = () => modal && modal.classList.remove('active');
    if (btnCloseFooter) btnCloseFooter.onclick = () => modal && modal.classList.remove('active');

    // Botones de filtro de alertas
    if (modal) {
      modal.querySelectorAll('.alert-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          modal.querySelectorAll('.alert-filter-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          openSystemAlertsModal(btn.dataset.filter);
        });
      });
    }
  }

  // --- CENTRO DE AUTOMATIZACIONES Y NOTIFICACIONES (Semana 4 - Parte 3) ---
  function renderNotificationsTab() {
    const listEl = document.getElementById('notif-audit-log-list');
    const kpiConfirmations = document.getElementById('kpi-notif-confirmations');
    const kpiReminders = document.getElementById('kpi-notif-reminders');
    const kpiEmergencies = document.getElementById('kpi-notif-emergencies');
    const kpiRate = document.getElementById('kpi-notif-rate');
    const btnSimulate = document.getElementById('btn-simulate-reminders-24h');
    const btnTestEmail = document.getElementById('btn-test-email-dispatch');
    const btnClearLogs = document.getElementById('btn-clear-notif-logs');

    const logs = (store.getNotificationLogs ? store.getNotificationLogs() : (store.getState().notificationLogs || []));

    // Contabilizar KPIs
    const countConfirm = logs.filter(l => l.type === 'confirmacion_inmediata').length;
    const countRemind = logs.filter(l => l.type === 'recordatorio_24h').length;
    const countEmergency = logs.filter(l => l.type === 'guardia_emergencia' || l.type === 'cancelacion_guardia').length;

    if (kpiConfirmations) kpiConfirmations.textContent = countConfirm;
    if (kpiReminders) kpiReminders.textContent = countRemind;
    if (kpiEmergencies) kpiEmergencies.textContent = countEmergency;
    if (kpiRate) kpiRate.textContent = '100%';

    if (listEl) {
      if (logs.length === 0) {
        listEl.innerHTML = `
          <div style="text-align: center; padding: 36px 20px; color: #64748b;">
            <div style="font-size: 2rem; margin-bottom: 8px;">✉️</div>
            <strong style="color: #334155; font-size: 0.95rem;">No hay registros de transmisiones aún</strong>
            <p style="font-size: 0.8rem; color: #94a3b8; margin-top: 4px;">Los correos de confirmación inmediata y recordatorios 24h aparecerán aquí en vivo.</p>
          </div>
        `;
      } else {
        listEl.innerHTML = logs.map(item => {
          let badgeColor = '#2563eb';
          let badgeBg = '#eff6ff';
          let typeLabel = 'Notificación';

          if (item.type === 'confirmacion_inmediata') {
            badgeColor = '#059669';
            badgeBg = '#ecfdf5';
            typeLabel = '✉️ Confirmación Inmediata';
          } else if (item.type === 'recordatorio_24h') {
            badgeColor = '#2563eb';
            badgeBg = '#eff6ff';
            typeLabel = '⏰ Recordatorio 24h';
          } else if (item.type === 'guardia_emergencia') {
            badgeColor = '#d97706';
            badgeBg = '#fffbeb';
            typeLabel = '🚨 Reagendamiento Guardia';
          } else if (item.type === 'cancelacion_guardia') {
            badgeColor = '#dc2626';
            badgeBg = '#fef2f2';
            typeLabel = '🚫 Cancelación Contingencia';
          } else if (item.type === 'prueba_conexion') {
            badgeColor = '#7c3aed';
            badgeBg = '#f5f3ff';
            typeLabel = '🧪 Prueba Diagnóstica';
          }

          return `
            <div class="notif-log-item-card" style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 14px; margin-bottom: 8px; display: flex; flex-direction: column; gap: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
              <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="background: ${badgeBg}; color: ${badgeColor}; font-size: 0.72rem; font-weight: 700; padding: 3px 8px; border-radius: 6px;">
                    ${typeLabel}
                  </span>
                  <span style="font-size: 0.76rem; font-family: monospace; color: #64748b;">${item.timestamp || 'Ahora'}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span style="font-size: 0.72rem; font-weight: 600; color: #059669; background: #ecfdf5; padding: 2px 7px; border-radius: 4px;">✓ ${item.status || 'Enviado'}</span>
                  <span style="font-size: 0.72rem; color: #64748b;">${item.recipientEmail ? `(${item.recipientEmail})` : ''}</span>
                </div>
              </div>
              <div style="font-size: 0.82rem; color: #1e293b; line-height: 1.45; font-weight: 500;">
                ${item.message}
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // Escuchador botón Simular Envío Masivo 24h
    if (btnSimulate) {
      btnSimulate.onclick = () => {
        if (window.EmailService && window.EmailService.auditAndSend24hReminders) {
          window.EmailService.auditAndSend24hReminders(showToast);
        } else if (store.auditAndSend24hReminders) {
          const sent = store.auditAndSend24hReminders();
          showToast(`⚡ Se auditaron las citas del día siguiente. ${sent.length} recordatorios 24h despachados.`, 'success');
        }
        renderNotificationsTab();
      };
    }

    // Escuchador botón Correo de Prueba
    if (btnTestEmail) {
      btnTestEmail.onclick = () => {
        if (window.EmailService && window.EmailService.sendTestEmail) {
          window.EmailService.sendTestEmail(showToast);
        } else {
          showToast('✉️ Correo de prueba enviado a dr.campoverde@montepiedrasalud.com', 'info');
        }
        renderNotificationsTab();
      };
    }

    // Escuchador botón Limpiar Logs
    if (btnClearLogs) {
      btnClearLogs.onclick = () => {
        if (store.clearNotificationLogs) {
          store.clearNotificationLogs();
        }
        renderNotificationsTab();
        showToast('Historial de notificaciones restablecido.', 'info');
      };
    }
  }

  // --- 3. FICHAS CLÍNICAS RÁPIDAS & EXPEDIENTE CRONOLÓGICO MÓVIL (Semana 4) ---
  function renderMedicalRecords() {
    const listEl = document.getElementById('medical-records-list');
    const searchInput = document.getElementById('search-patient-records');
    if (!listEl) return;

    const query = (searchInput ? searchInput.value.trim().toLowerCase() : '');
    const state = store.getState();

    const filteredRecords = state.medicalRecords.filter(r => 
      (r.patientName && r.patientName.toLowerCase().includes(query)) ||
      (r.patientId && r.patientId.includes(query)) ||
      (r.patientCedula && r.patientCedula.includes(query))
    );

    if (filteredRecords.length === 0) {
      listEl.innerHTML = `<div style="text-align: center; padding: 30px; color: #64748b;">No se encontraron expedientes clínicos para "${query}".</div>`;
      return;
    }

    listEl.innerHTML = filteredRecords.map(rec => {
      const consultasCount = (rec.consultationHistory || []).length;
      return `
        <div class="patient-record-card" data-id="${rec.id}">
          <div class="patient-record-header">
            <div>
              <div class="record-name">${rec.patientName}</div>
              <div class="record-ci">C.I: ${rec.patientCedula || rec.patientId} | Edad: ${rec.age || 35} años | Tipo: ${rec.bloodType || 'O+'}</div>
            </div>
            <button type="button" class="btn-ghost-sm btn-view-full-record" data-id="${rec.id}" style="min-height: 40px; padding: 6px 12px; font-weight: 700; color: #0284c7;">Expediente Móvil →</button>
          </div>
          <div class="allergy-alert-tag" style="background: #fef2f2; border-left: 4px solid #ef4444; color: #991b1b; padding: 8px 10px; border-radius: 6px; font-size: 0.82rem; font-weight: 700; margin: 8px 0;">
            <span>⚠️ ALERGIAS:</span>
            <span>${rec.allergies || 'Ninguna conocida (NKA)'}</span>
          </div>
          <div class="past-diagnosis-snippet" style="font-size: 0.82rem; color: #334155;">
            <strong>Último Diagnóstico:</strong> ${rec.lastDiagnosis || 'Consulta de Medicina General'}
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px; font-size: 0.74rem; color: #64748b;">
            <span>📍 ${rec.sede || 'Clínica Ceibos'}</span>
            <span>🕒 ${consultasCount} atención${consultasCount === 1 ? '' : 'es'} en historial</span>
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

    // Antecedentes estructurados
    const antecedentes = record.antecedentes || {
      app: record.history || 'Sin antecedentes patológicos declarados.',
      apf: 'Sin antecedentes familiares de riesgo.',
      quirurgicos: 'Sin cirugías previas.',
      habitos: 'Hábitos no tóxicos.'
    };

    const vitals = record.signosVitales || { pa: '120/80', fc: '75', temp: '36.5', imc: '23.5' };
    const consultations = record.consultationHistory || [];

    modalBody.innerHTML = `
      <div class="clinical-record-container">
        <!-- Cabecera del Paciente -->
        <div class="clinical-header-box">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <div class="clinical-patient-meta-row">
                <h3 class="clinical-patient-name">${record.patientName}</h3>
              </div>
              <div class="clinical-patient-badges">
                <span class="clinical-badge-pill">🪪 C.I: <strong>${record.patientCedula || record.patientId}</strong></span>
                <span class="clinical-badge-pill">🎂 ${record.age || 35} años</span>
                <span class="clinical-badge-pill clinical-badge-blood">🩸 ${record.bloodType || 'O+'}</span>
                <span class="clinical-badge-pill">📍 ${record.sede || 'Clínica Ceibos'}</span>
              </div>
            </div>
            <button type="button" id="btn-modal-close-clinical" style="background: rgba(255,255,255,0.2); border: none; color: #ffffff; width: 34px; height: 34px; border-radius: 9999px; cursor: pointer; font-size: 1.15rem; display: flex; align-items: center; justify-content: center;" title="Cerrar expediente">✕</button>
          </div>
        </div>

        <!-- Banner de Alertas Médicas Críticas (High Priority) -->
        <div class="clinical-alert-banner">
          <span class="clinical-alert-icon">🚨</span>
          <div>
            <div class="clinical-alert-title">Alerta Médica Crítica • Antecedentes de Alto Riesgo</div>
            <div class="clinical-alert-desc">
              <strong>Alergias Medicamentosas:</strong> ${record.allergies || 'Ninguna conocida (NKA)'}
              <br/>
              <strong>Patología Crónica Base:</strong> ${antecedentes.app || record.history || 'Ninguna declarada'}
            </div>
          </div>
        </div>

        <!-- Navegación por Pestañas Touch-Friendly (Mínimo 44px de alto) -->
        <div class="clinical-nav-tabs">
          <button type="button" class="clinical-nav-tab-btn active" data-tab="timeline">
            <span>🕒 Historial</span>
          </button>
          <button type="button" class="clinical-nav-tab-btn" data-tab="soap">
            <span>✍️ Nueva Consulta</span>
          </button>
          <button type="button" class="clinical-nav-tab-btn" data-tab="antecedentes">
            <span>📋 Antecedentes</span>
          </button>
        </div>

        <!-- PANE 1: Historial Cronológico (Timeline Médico) -->
        <div class="clinical-tab-pane active" id="clinical-pane-timeline">
          <div class="clinical-timeline-wrapper">
            ${consultations.length === 0 ? `
              <div style="text-align: center; padding: 24px; color: #64748b; background: #f8fafc; border-radius: 10px;">
                No hay atenciones previas registradas en este expediente.
              </div>
            ` : consultations.map(c => `
              <div class="clinical-timeline-card">
                <div class="clinical-timeline-top">
                  <div>
                    <span class="clinical-timeline-date">📅 ${c.date}</span>
                    <span class="clinical-timeline-sede">• 📍 ${c.sede}</span>
                  </div>
                  <span class="clinical-status-tag ${c.estado === 'Atendida' ? 'atendida' : (c.estado === 'En Consulta' ? 'en_consulta' : 'agendada')}">
                    ● ${c.estado || 'Atendida'}
                  </span>
                </div>
                <div style="font-size: 0.86rem; font-weight: 700; color: #0f172a; margin-bottom: 4px;">
                  Motivo: ${c.motivo}
                </div>
                <div style="font-size: 0.80rem; color: #0284c7; font-weight: 600;">
                  Diagnóstico: ${c.diagnostico}
                </div>
                <div class="clinical-vitals-inline">
                  <span><strong>PA:</strong> ${c.pa || '120/80'}</span>
                  <span><strong>FC:</strong> ${c.fc || '75 lpm'}</span>
                  <span><strong>Temp:</strong> ${c.temp || '36.5 °C'}</span>
                  <span><strong>IMC:</strong> ${c.imc || '23.5'}</span>
                </div>
                ${c.soap ? `
                  <div style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed #e2e8f0; font-size: 0.78rem; color: #475569;">
                    <div><strong>Plan:</strong> ${c.soap.plan || 'Continuar medicación prescrita y seguimiento.'}</div>
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
        </div>

        <!-- PANE 2: Formulario SOAP Ligero Mobile-First -->
        <div class="clinical-tab-pane" id="clinical-pane-soap">
          <form id="form-soap-mobile" class="soap-form-layout">
            <!-- Motivo de consulta y Anamnesis -->
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" style="font-weight: 700; font-size: 0.82rem;">Motivo de Consulta y Anamnesis Rápida *</label>
              <textarea class="form-input" id="soap-input-motivo" rows="2" placeholder="ej. Cefalea holocraneana de 24h de evolución, sin signos de alarma..." required style="min-height: 52px; font-size: 0.90rem;"></textarea>
            </div>

            <!-- Constantes Vitales Esenciales con Cálculo Reactivo de IMC -->
            <div class="soap-accordion-box">
              <div class="soap-accordion-title">
                <span>🩺 Constantes Vitales & Triaje Rápido</span>
              </div>
              <div class="vitals-grid-4col">
                <div class="vital-input-card">
                  <span class="vital-label">P. Arterial</span>
                  <input type="text" class="vital-field" id="soap-vital-pa" value="120/80" placeholder="120/80" />
                  <span class="vital-unit">mmHg</span>
                </div>
                <div class="vital-input-card">
                  <span class="vital-label">Frec. Cardíaca</span>
                  <input type="number" class="vital-field" id="soap-vital-fc" value="75" placeholder="75" />
                  <span class="vital-unit">lpm</span>
                </div>
                <div class="vital-input-card">
                  <span class="vital-label">Temperatura</span>
                  <input type="number" step="0.1" class="vital-field" id="soap-vital-temp" value="36.5" placeholder="36.5" />
                  <span class="vital-unit">°C</span>
                </div>
                <div class="vital-input-card">
                  <span class="vital-label">Peso (kg)</span>
                  <input type="number" step="0.5" class="vital-field" id="soap-vital-peso" value="70" placeholder="70" />
                  <span class="vital-unit">kg</span>
                </div>
                <div class="vital-input-card">
                  <span class="vital-label">Talla (cm)</span>
                  <input type="number" step="1" class="vital-field" id="soap-vital-talla" value="170" placeholder="170" />
                  <span class="vital-unit">cm</span>
                </div>
              </div>

              <!-- Cálculo Reactivo de IMC en Vivo -->
              <div class="imc-reactive-banner">
                <div>
                  <span style="font-size: 0.72rem; color: #1e40af; font-weight: 700; text-transform: uppercase;">Índice de Masa Corporal (IMC):</span>
                  <div style="font-size: 1.15rem; font-weight: 800; color: #1e3a8a;" id="soap-display-imc">24.2 kg/m²</div>
                </div>
                <div class="imc-badge-indicator imc-badge-normal" id="soap-display-imc-badge">
                  <span>●</span> <span>Normal</span>
                </div>
              </div>
            </div>

            <!-- Diagnóstico CIE-10 con Selección en 1 Toque -->
            <div class="soap-accordion-box">
              <label class="form-label" style="font-weight: 700; font-size: 0.82rem; margin-bottom: 2px;">
                Diagnóstico Principal (CIE-10) *
              </label>
              <input type="text" class="form-input" id="soap-input-cie10" value="Hipertensión Arterial Primaria (CIE-10: I10)" required style="min-height: 44px; font-weight: 600;" />
              
              <span style="font-size: 0.70rem; color: #64748b; font-weight: 700; margin-top: 6px; display: block;">PRESETS RÁPIDOS EN 1 TOQUE:</span>
              <div class="cie10-quick-select" id="soap-cie10-chips">
                <button type="button" class="cie10-chip-btn" data-diag="Hipertensión Arterial Primaria (CIE-10: I10)">I10 HTA</button>
                <button type="button" class="cie10-chip-btn" data-diag="Faringitis Aguda Estreptocócica (CIE-10: J02.0)">J02 Faringitis</button>
                <button type="button" class="cie10-chip-btn" data-diag="Bronquitis Aguda no especificada (CIE-10: J20.9)">J20 Bronquitis</button>
                <button type="button" class="cie10-chip-btn" data-diag="Diabetes Mellitus Tipo 2 (CIE-10: E11)">E11 Diabetes</button>
                <button type="button" class="cie10-chip-btn" data-diag="Cefalea Tensional / Dolor de cabeza (CIE-10: R51)">R51 Cefalea</button>
                <button type="button" class="cie10-chip-btn" data-diag="Lumbago Mecánico Agudo (CIE-10: M54.5)">M54 Lumbago</button>
                <button type="button" class="cie10-chip-btn" data-diag="Gastritis Aguda no especificada (CIE-10: K29.7)">K29 Gastritis</button>
              </div>
            </div>

            <!-- Plan de Tratamiento e Indicaciones -->
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" style="font-weight: 700; font-size: 0.82rem;">Plan Terapéutico y Cuidados Domiciliarios</label>
              <textarea class="form-input" id="soap-input-plan" rows="2" placeholder="ej. Hidratación oral, reposo relativo, medicación prescrita, control en 5 días..." style="min-height: 52px; font-size: 0.90rem;">Indicaciones generales, dieta balanceada, hidratación abundante y control en consulta.</textarea>
            </div>
          </form>
        </div>

        <!-- PANE 3: Antecedentes Clínicos Detallados -->
        <div class="clinical-tab-pane" id="clinical-pane-antecedentes">
          <div style="display: flex; flex-direction: column; gap: 10px;">
            <div class="soap-accordion-box">
              <label class="form-label" style="font-weight: 700; font-size: 0.80rem;">Antecedentes Patológicos Personales (APP)</label>
              <textarea class="form-input" id="ant-input-app" rows="2">${antecedentes.app || ''}</textarea>
            </div>
            <div class="soap-accordion-box">
              <label class="form-label" style="font-weight: 700; font-size: 0.80rem;">Antecedentes Patológicos Familiares (APF)</label>
              <textarea class="form-input" id="ant-input-apf" rows="2">${antecedentes.apf || ''}</textarea>
            </div>
            <div class="soap-accordion-box">
              <label class="form-label" style="font-weight: 700; font-size: 0.80rem;">Antecedentes Quirúrgicos y Alergias</label>
              <textarea class="form-input" id="ant-input-quir" rows="2">${antecedentes.quirurgicos || ''}</textarea>
            </div>
            <div class="soap-accordion-box">
              <label class="form-label" style="font-weight: 700; font-size: 0.80rem;">Hábitos Tóxicos / Estilo de Vida</label>
              <textarea class="form-input" id="ant-input-habitos" rows="2">${antecedentes.habitos || ''}</textarea>
            </div>
          </div>
        </div>

        <!-- Barra Sticky Inferior Touch-Friendly -->
        <div class="clinical-sticky-footer">
          <button type="button" class="clinical-btn-primary" id="btn-save-clinical-record">
            <span>💾 Guardar Ficha</span>
          </button>
          <button type="button" class="clinical-btn-rx" id="btn-proceed-to-rx">
            <span>💊 Continuar a Receta →</span>
          </button>
        </div>
      </div>
    `;

    // Interacciones del Modal:
    // 1. Cierre modal
    const btnClose = modalBody.querySelector('#btn-modal-close-clinical');
    if (btnClose) {
      btnClose.onclick = () => modal.classList.remove('active');
    }

    // 2. Navegación por pestañas
    const tabBtns = modalBody.querySelectorAll('.clinical-nav-tab-btn');
    const panes = {
      timeline: modalBody.querySelector('#clinical-pane-timeline'),
      soap: modalBody.querySelector('#clinical-pane-soap'),
      antecedentes: modalBody.querySelector('#clinical-pane-antecedentes')
    };

    tabBtns.forEach(btn => {
      btn.onclick = () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const target = btn.dataset.tab;
        Object.keys(panes).forEach(k => {
          if (panes[k]) panes[k].classList.toggle('active', k === target);
        });
      };
    });

    // 3. Cálculo Reactivo de IMC
    const pesoInput = modalBody.querySelector('#soap-vital-peso');
    const tallaInput = modalBody.querySelector('#soap-vital-talla');
    const imcDisplay = modalBody.querySelector('#soap-display-imc');
    const imcBadge = modalBody.querySelector('#soap-display-imc-badge');

    function updateReactiveIMC() {
      const peso = parseFloat(pesoInput.value) || 0;
      const tallaCm = parseFloat(tallaInput.value) || 0;
      if (peso > 0 && tallaCm > 0) {
        const tallaM = tallaCm / 100;
        const imc = +(peso / (tallaM * tallaM)).toFixed(1);
        if (imcDisplay) imcDisplay.textContent = `${imc} kg/m²`;
        if (imcBadge) {
          imcBadge.className = 'imc-badge-indicator';
          if (imc < 18.5) {
            imcBadge.classList.add('imc-badge-bajo');
            imcBadge.innerHTML = '<span>●</span> <span>Bajo Peso</span>';
          } else if (imc <= 24.9) {
            imcBadge.classList.add('imc-badge-normal');
            imcBadge.innerHTML = '<span>●</span> <span>Normal</span>';
          } else if (imc <= 29.9) {
            imcBadge.classList.add('imc-badge-sobrepeso');
            imcBadge.innerHTML = '<span>●</span> <span>Sobrepeso</span>';
          } else {
            imcBadge.classList.add('imc-badge-obesidad');
            imcBadge.innerHTML = '<span>●</span> <span>Obesidad</span>';
          }
        }
      }
    }

    if (pesoInput && tallaInput) {
      pesoInput.addEventListener('input', updateReactiveIMC);
      tallaInput.addEventListener('input', updateReactiveIMC);
      updateReactiveIMC();
    }

    // 4. Presets CIE-10
    const cie10Input = modalBody.querySelector('#soap-input-cie10');
    modalBody.querySelectorAll('.cie10-chip-btn').forEach(chip => {
      chip.onclick = () => {
        modalBody.querySelectorAll('.cie10-chip-btn').forEach(c => c.classList.remove('selected'));
        chip.classList.add('selected');
        if (cie10Input) cie10Input.value = chip.dataset.diag;
      };
    });

    // 5. Función de Guardado de Ficha / Consulta
    function saveClinicalRecordData() {
      const motivoVal = (modalBody.querySelector('#soap-input-motivo')?.value || '').trim();
      const cie10Val = (cie10Input?.value || '').trim() || 'Consulta de Medicina General';
      const planVal = (modalBody.querySelector('#soap-input-plan')?.value || '').trim();

      const paVal = (modalBody.querySelector('#soap-vital-pa')?.value || '').trim() || '120/80';
      const fcVal = (modalBody.querySelector('#soap-vital-fc')?.value || '').trim() || '75';
      const tempVal = (modalBody.querySelector('#soap-vital-temp')?.value || '').trim() || '36.5';
      const pesoVal = parseFloat(pesoInput?.value) || 70;
      const tallaVal = parseFloat(tallaInput?.value) || 170;
      const imcVal = +(pesoVal / Math.pow(tallaVal / 100, 2)).toFixed(1);

      const appVal = (modalBody.querySelector('#ant-input-app')?.value || '').trim();
      const apfVal = (modalBody.querySelector('#ant-input-apf')?.value || '').trim();
      const quirVal = (modalBody.querySelector('#ant-input-quir')?.value || '').trim();
      const habitosVal = (modalBody.querySelector('#ant-input-habitos')?.value || '').trim();

      const updatedRecord = store.addMedicalRecord({
        id: record.id,
        patientId: record.patientId,
        patientCedula: record.patientCedula || record.patientId,
        patientName: record.patientName,
        age: record.age,
        bloodType: record.bloodType,
        sede: record.sede || 'Clínica Ceibos',
        allergies: record.allergies,
        antecedentes: {
          app: appVal || antecedentes.app,
          apf: apfVal || antecedentes.apf,
          quirurgicos: quirVal || antecedentes.quirurgicos,
          habitos: habitosVal || antecedentes.habitos
        },
        motivo: motivoVal || 'Control médico general',
        diagnostico: cie10Val,
        plan: planVal,
        signosVitales: {
          pa: `${paVal} mmHg`,
          fc: `${fcVal} lpm`,
          temp: `${tempVal} °C`,
          imc: `${imcVal}`
        },
        estado: 'Atendida'
      });

      return { record: updatedRecord, diagnosis: cie10Val };
    }

    const btnSave = modalBody.querySelector('#btn-save-clinical-record');
    if (btnSave) {
      btnSave.onclick = () => {
        const { record: updated } = saveClinicalRecordData();
        showToast('Ficha clínica y consulta SOAP guardadas exitosamente en expediente.', 'success');
        modal.classList.remove('active');
        renderMedicalRecords();
      };
    }

    const btnRx = modalBody.querySelector('#btn-proceed-to-rx');
    if (btnRx) {
      btnRx.onclick = () => {
        const { record: updated, diagnosis } = saveClinicalRecordData();
        showToast('Ficha guardada. Abriendo Prescripción Médica Oficial MSP...', 'info');
        modal.classList.remove('active');
        renderMedicalRecords();

        // Abrir Modal Clínico de Prescripción Médica (Semana 4 - Parte 2)
        openPrescriptionModal({
          patientId: updated.patientId,
          patientCedula: updated.patientCedula || updated.patientId,
          patientName: updated.patientName,
          age: updated.age,
          sede: updated.sede,
          diagnosis: diagnosis,
          appointmentId: record.appointmentId || null
        }, diagnosis);
      };
    }

    modal.classList.add('active');
  }

  const btnCloseDetailModal = document.getElementById('btn-close-patient-detail');
  if (btnCloseDetailModal) {
    btnCloseDetailModal.addEventListener('click', () => {
      document.getElementById('patient-detail-modal').classList.remove('active');
    });
  }

  // ==========================================================================
  // --- 4. MOTOR DE PRESCRIPCIÓN MÉDICA Y RECETA DIGITAL MSP (Semana 4 - Parte 2) ---
  // ==========================================================================
  let activeRxPatient = {
    patientId: '0987654321',
    patientCedula: '0987654321',
    patientName: 'Carlos Mendoza Moreira',
    age: 44,
    sede: 'Clínica Ceibos',
    diagnosis: 'Hipertensión Arterial Primaria (CIE-10: I10)',
    appointmentId: null
  };

  let activeRxItems = [
    {
      id: 1,
      drug: 'Losartán 50mg',
      presentation: 'Comprimidos / 30 unidades',
      via: 'Vía Oral (V.O.)',
      posology: 'Tomar 1 comprimido cada 24 horas vía oral por la mañana continuo.'
    },
    {
      id: 2,
      drug: 'Ibuprofeno 400mg',
      presentation: 'Comprimidos / 15 unidades',
      via: 'Vía Oral (V.O.)',
      posology: 'Tomar 1 comprimido cada 8 horas vía oral por 3 días después de alimentos si hay dolor.'
    }
  ];

  let currentRxFolio = 'REC-2026-0924';

  function renderRxItems() {
    const listEl = document.getElementById('rx-drugs-dynamic-list');
    const tableBodyEl = document.getElementById('rx-preview-table-body');
    const countEl = document.getElementById('rx-items-count');

    if (countEl) countEl.textContent = activeRxItems.length;

    // 1. Render en lista del formulario dinámico
    if (listEl) {
      if (activeRxItems.length === 0) {
        listEl.innerHTML = `
          <div style="text-align: center; padding: 14px; background: #ffffff; border: 1px dashed #cbd5e1; border-radius: 8px; color: #94a3b8; font-size: 0.78rem;">
            No hay fármacos agregados. Utiliza los presets rápidos o el formulario de arriba.
          </div>
        `;
      } else {
        listEl.innerHTML = activeRxItems.map(item => `
          <div class="rx-drug-row-item" data-id="${item.id}">
            <div class="rx-drug-item-content">
              <div class="rx-drug-row-title">${item.drug}</div>
              <div class="rx-drug-row-meta">📦 ${item.presentation} • 💊 ${item.via || 'Vía Oral'}</div>
              <div class="rx-drug-row-posology">📝 <strong>Posología:</strong> ${item.posology}</div>
            </div>
            <button type="button" class="btn-rx-remove-item" data-id="${item.id}" title="Eliminar medicamento">
              🗑️ Quitar
            </button>
          </div>
        `).join('');

        listEl.querySelectorAll('.btn-rx-remove-item').forEach(btn => {
          btn.addEventListener('click', () => {
            const idToRemove = Number(btn.dataset.id);
            activeRxItems = activeRxItems.filter(it => it.id !== idToRemove);
            renderRxItems();
            showToast('Fármaco eliminado de la prescripción.', 'info');
          });
        });
      }
    }

    // 2. Render en tabla de la hoja imprimible oficial
    if (tableBodyEl) {
      if (activeRxItems.length === 0) {
        tableBodyEl.innerHTML = `
          <tr>
            <td colspan="3" class="rx-table-empty-msg">
              No se han prescrito medicamentos para esta consulta médica.
            </td>
          </tr>
        `;
      } else {
        tableBodyEl.innerHTML = activeRxItems.map((item, idx) => `
          <tr>
            <td>
              <strong>${idx + 1}. ${item.drug}</strong>
            </td>
            <td>
              <span style="color: #0284c7; font-weight: 700;">${item.presentation}</span><br />
              <span style="font-size: 0.68rem; color: #64748b;">${item.via || 'Vía Oral'}</span>
            </td>
            <td>
              ${item.posology}
            </td>
          </tr>
        `).join('');
      }
    }
  }

  function openPrescriptionModal(patientData = {}, defaultDiagnosis = '') {
    const modal = document.getElementById('modal-receta-medica');
    if (!modal) return;

    const todayStr = getTodayDateStr();
    const parts = todayStr.split('-');
    const formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`;

    activeRxPatient = {
      patientId: patientData.patientId || patientData.cedula || '0987654321',
      patientCedula: patientData.patientCedula || patientData.patientId || patientData.cedula || '0987654321',
      patientName: patientData.patientName || patientData.nombreCompleto || 'Carlos Mendoza Moreira',
      age: patientData.age || patientData.edad || 44,
      sede: patientData.sede || 'Clínica Ceibos',
      diagnosis: defaultDiagnosis || patientData.diagnosis || patientData.lastDiagnosis || 'Hipertensión Arterial Primaria (CIE-10: I10)',
      appointmentId: patientData.appointmentId || patientData.id || null
    };

    currentRxFolio = `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Prellenar banner del paciente en el modal
    const pNameEl = document.getElementById('rx-patient-name-display');
    const pCedEl = document.getElementById('rx-patient-cedula-display');
    const pAgeEl = document.getElementById('rx-patient-age-display');
    const pSedeEl = document.getElementById('rx-patient-sede-display');
    const pDateEl = document.getElementById('rx-issue-date-display');
    const pDiagEl = document.getElementById('rx-patient-diagnosis-display');

    if (pNameEl) pNameEl.textContent = activeRxPatient.patientName;
    if (pCedEl) pCedEl.textContent = activeRxPatient.patientCedula;
    if (pAgeEl) pAgeEl.textContent = `${activeRxPatient.age} años`;
    if (pSedeEl) pSedeEl.textContent = activeRxPatient.sede;
    if (pDateEl) pDateEl.textContent = todayStr;
    if (pDiagEl) pDiagEl.textContent = activeRxPatient.diagnosis;

    // Prellenar hoja de receta imprimible
    const prevNameEl = document.getElementById('rx-preview-patient-name');
    const prevCedEl = document.getElementById('rx-preview-patient-cedula');
    const prevAgeEl = document.getElementById('rx-preview-patient-age');
    const prevDateEl = document.getElementById('rx-preview-date');
    const prevSedeEl = document.getElementById('rx-preview-sede');
    const prevDiagEl = document.getElementById('rx-preview-diagnosis');
    const prevFolioEl = document.getElementById('rx-preview-folio');

    if (prevNameEl) prevNameEl.textContent = activeRxPatient.patientName;
    if (prevCedEl) prevCedEl.textContent = activeRxPatient.patientCedula;
    if (prevAgeEl) prevAgeEl.textContent = `${activeRxPatient.age} años`;
    if (prevDateEl) prevDateEl.textContent = formattedDate;
    if (prevSedeEl) prevSedeEl.textContent = `${activeRxPatient.sede} (Consultorio Oficial)`;
    if (prevDiagEl) prevDiagEl.textContent = activeRxPatient.diagnosis;
    if (prevFolioEl) prevFolioEl.textContent = `Receta N°: ${currentRxFolio}`;

    // Sincronizar indicaciones no farmacológicas
    const txtIndications = document.getElementById('rx-textarea-indications');
    const prevIndications = document.getElementById('rx-preview-indications-text');
    if (txtIndications && prevIndications) {
      prevIndications.textContent = txtIndications.value.trim() || 'Indicaciones generales según evolución clínica.';
    }

    // Medicamentos sugeridos iniciales si la lista está vacía
    if (activeRxItems.length === 0) {
      if (/hipertensi|i10|losart/i.test(activeRxPatient.diagnosis)) {
        activeRxItems = [
          {
            id: Date.now(),
            drug: 'Losartán 50mg',
            presentation: 'Comprimidos / 30 unidades',
            via: 'Vía Oral (V.O.)',
            posology: 'Tomar 1 comprimido cada 24 horas vía oral por la mañana continuo.'
          }
        ];
      } else if (/faring|j02|bronqu|j20|amox/i.test(activeRxPatient.diagnosis)) {
        activeRxItems = [
          {
            id: Date.now(),
            drug: 'Amoxicilina 500mg',
            presentation: 'Cápsulas / 21 unidades',
            via: 'Vía Oral (V.O.)',
            posology: 'Tomar 1 cápsula cada 8 horas vía oral por 7 días después de las comidas.'
          },
          {
            id: Date.now() + 1,
            drug: 'Paracetamol 500mg',
            presentation: 'Comprimidos / 15 unidades',
            via: 'Vía Oral (V.O.)',
            posology: 'Tomar 1 comprimido cada 8 horas vía oral por 3 días si presenta dolor o fiebre.'
          }
        ];
      } else {
        activeRxItems = [
          {
            id: Date.now(),
            drug: 'Paracetamol 500mg',
            presentation: 'Comprimidos / 20 unidades',
            via: 'Vía Oral (V.O.)',
            posology: 'Tomar 1 comprimido cada 8 horas vía oral por 3 días si hay dolor o malestar.'
          }
        ];
      }
    }

    renderRxItems();

    // Generar Código QR de Verificación Institucional
    const qrContainer = document.getElementById('rx-qrcode-container');
    if (qrContainer) {
      qrContainer.innerHTML = '';
      const verificationUrl = `https://montepiedrasalud.ec/validador-receta?folio=${currentRxFolio}&cedula=${activeRxPatient.patientCedula}&msp=MSP-REG-84729&fecha=${todayStr}`;
      try {
        if (typeof QRCode !== 'undefined') {
          new QRCode(qrContainer, {
            text: verificationUrl,
            width: 70,
            height: 70,
            colorDark: "#0f172a",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.M
          });
        }
      } catch (err) {
        console.warn('Error rendering Rx QR code:', err);
      }
    }

    // Mostrar el modal
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
    modal.classList.add('active');
  }

  function initPrescriptionModalEvents() {
    const modal = document.getElementById('modal-receta-medica');
    if (!modal) return;

    // Cerrar modal
    const btnClose = document.getElementById('btn-close-rx-modal');
    if (btnClose) {
      btnClose.onclick = () => {
        modal.classList.add('hidden');
        modal.style.display = 'none';
        modal.classList.remove('active');
      };
    }

    // Chips de fármacos frecuentes
    const chipBtns = modal.querySelectorAll('.rx-chip-btn');
    const drugNameInput = document.getElementById('rx-input-drug-name');
    const drugPresInput = document.getElementById('rx-input-drug-presentation');
    const drugPosInput = document.getElementById('rx-input-drug-posology');

    chipBtns.forEach(chip => {
      chip.onclick = () => {
        if (drugNameInput) drugNameInput.value = chip.dataset.drug || '';
        if (drugPresInput) drugPresInput.value = chip.dataset.pres || '';
        if (drugPosInput) drugPosInput.value = chip.dataset.dose || '';
        if (drugNameInput) drugNameInput.focus();
        showToast(`Fármaco seleccionado: ${chip.dataset.drug}`, 'info');
      };
    });

    // Agregar medicamento
    const btnAddDrug = document.getElementById('btn-modal-add-drug');
    if (btnAddDrug) {
      btnAddDrug.onclick = () => {
        const drug = (drugNameInput?.value || '').trim();
        const pres = (drugPresInput?.value || '').trim() || 'Comprimidos / 10 unidades';
        const via = document.getElementById('rx-input-drug-via')?.value || 'Vía Oral (V.O.)';
        const pos = (drugPosInput?.value || '').trim();

        if (!drug) {
          showToast('Ingresa el nombre o concentración del medicamento.', 'warning');
          if (drugNameInput) drugNameInput.focus();
          return;
        }

        if (!pos) {
          showToast('Ingresa la posología o indicación de toma.', 'warning');
          if (drugPosInput) drugPosInput.focus();
          return;
        }

        activeRxItems.push({
          id: Date.now(),
          drug,
          presentation: pres,
          via,
          posology: pos
        });

        renderRxItems();

        // Limpiar campos
        if (drugNameInput) drugNameInput.value = '';
        if (drugPresInput) drugPresInput.value = '';
        if (drugPosInput) drugPosInput.value = '';

        showToast(`"${drug}" agregado a la prescripción médica.`, 'success');
      };
    }

    // Vaciar lista
    const btnClearAll = document.getElementById('btn-rx-clear-all');
    if (btnClearAll) {
      btnClearAll.onclick = () => {
        if (activeRxItems.length === 0) return;
        if (confirm('¿Deseas vaciar todos los medicamentos de la prescripción actual?')) {
          activeRxItems = [];
          renderRxItems();
          showToast('Lista de prescripción vaciada.', 'info');
        }
      };
    }

    // Sincronización de indicaciones generales reactivas
    const txtIndications = document.getElementById('rx-textarea-indications');
    const prevIndications = document.getElementById('rx-preview-indications-text');
    if (txtIndications && prevIndications) {
      txtIndications.addEventListener('input', () => {
        prevIndications.textContent = txtIndications.value.trim() || 'Indicaciones generales según evolución clínica.';
      });
    }

    // Botón Descargar PDF con html2pdf (Optimizado para Carga Móvil y Gestión de Memoria)
    const btnDownloadPdf = document.getElementById('btn-rx-download-pdf');
    if (btnDownloadPdf) {
      btnDownloadPdf.addEventListener('click', async () => {
        const printElement = document.getElementById('printable-official-rx');
        if (!printElement) return;

        const cedula = activeRxPatient.patientCedula || activeRxPatient.patientId || '0987654321';
        const todayStr = getTodayDateStr();
        const pdfFileName = `Receta_${cedula}_${todayStr}.pdf`;

        // Prevenir doble clic en dispositivos móviles y táctiles
        btnDownloadPdf.disabled = true;
        const originalText = btnDownloadPdf.innerHTML;
        btnDownloadPdf.innerHTML = '<span>⏳ Generando PDF...</span>';

        try {
          // Desacoplar del hilo principal para fluidez táctil en celular
          await new Promise(resolve => setTimeout(resolve, 30));

          if (typeof html2pdf !== 'undefined') {
            showToast('Generando Receta Médica oficial en PDF...', 'info');
            const opt = {
              margin: [8, 8, 8, 8],
              filename: pdfFileName,
              image: { type: 'jpeg', quality: 0.98 },
              html2canvas: { scale: 2, useCORS: true, letterRendering: true },
              jsPDF: { unit: 'mm', format: 'a5', orientation: 'portrait' }
            };

            // Generación asíncrona mediante Blob para evitar congelamiento de UI táctil
            const pdfBlob = await html2pdf().set(opt).from(printElement).output('blob');
            const blobUrl = URL.createObjectURL(pdfBlob);
            const downloadLink = document.createElement('a');
            downloadLink.href = blobUrl;
            downloadLink.download = pdfFileName;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);

            // Destrucción inmediata del objeto temporal Blob/URL para prevenir fugas de memoria en navegadores móviles
            setTimeout(() => {
              URL.revokeObjectURL(blobUrl);
            }, 1000);

            showToast(`Receta descargada con éxito: ${pdfFileName}`, 'success');
          } else {
            showToast('Abriendo cuadro de diálogo de impresión / guardado PDF...', 'info');
            window.print();
          }
        } catch (err) {
          console.warn('html2pdf fallback to print:', err);
          window.print();
        } finally {
          btnDownloadPdf.disabled = false;
          btnDownloadPdf.innerHTML = originalText;
        }
      }, { passive: true });
    }

    // Botón Imprimir Directo
    const btnPrintDirect = document.getElementById('btn-rx-print-direct');
    if (btnPrintDirect) {
      btnPrintDirect.onclick = () => {
        window.print();
      };
    }

    // Botón Finalizar Consulta
    const btnFinishConsultation = document.getElementById('btn-rx-finalize-consultation');
    if (btnFinishConsultation) {
      btnFinishConsultation.onclick = () => {
        // 1. Guardar receta en store
        const indications = (txtIndications?.value || '').trim();
        const savedRx = store.addPrescription({
          patientId: activeRxPatient.patientId,
          patientName: activeRxPatient.patientName,
          diagnosis: activeRxPatient.diagnosis,
          items: activeRxItems.map(it => ({
            drug: `${it.drug} (${it.presentation})`,
            dose: it.posology
          })),
          indications,
          doctorCode: 'MSP-REG-84729'
        });

        // 2. Si hay cita asociada, marcar como completada
        if (activeRxPatient.appointmentId) {
          store.updateAppointmentStatus(activeRxPatient.appointmentId, 'completed');
        }

        // 3. Cerrar modal
        modal.classList.add('hidden');
        modal.style.display = 'none';
        modal.classList.remove('active');

        // 4. Notificar y actualizar vistas
        showToast(`Consulta médica finalizada exitosamente. Receta #${savedRx.code} archivada con registro MSP.`, 'success');
        renderTimeline();
        renderMedicalRecords();
        renderPrescriptionHistoryTable();
      };
    }
  }

  // --- 4. RECETARIO DIGITAL (Página 4 - Formulario en Pestaña) ---
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

        // Abre el modal oficial #modal-receta-medica prellenado
        openPrescriptionModal({
          patientId: patId,
          patientCedula: patId,
          patientName: patient.patientName,
          age: patient.age || 40,
          sede: patient.sede || 'Clínica Ceibos',
          diagnosis: diagnosis
        }, diagnosis);
      };
    }

    // Renderizar historial de recetas emitidas en la pestaña
    renderPrescriptionHistoryTable();
  }

  // --- 4.1 VISOR DE RECETAS EMITIDAS (HISTORIAL DE PRESCRIPCIONES) ---
  function renderPrescriptionHistoryTable() {
    const tbody = document.getElementById('rx-history-table-body');
    const countBadge = document.getElementById('rx-history-count-badge');
    if (!tbody) return;

    const rxs = store.getPrescriptions();
    if (countBadge) {
      countBadge.textContent = `${rxs.length} ${rxs.length === 1 ? 'Receta Emitida' : 'Recetas Emitidas'}`;
    }

    if (rxs.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 24px; color: #64748b;">
            No se registran prescripciones médicas previas emitidas. Usa el formulario superior para emitir una receta digital oficial.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = rxs.map(rx => {
      const drugsList = (rx.items || []).map(it => it.drug).join(', ') || 'Medicación prescrita';
      const patientDisplay = rx.patientName || 'Paciente General';
      const cedulaDisplay = rx.patientCedula || rx.patientId || '0987654321';
      return `
        <tr class="rx-history-row" style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 8px 10px; font-weight: 800; color: #0284c7; font-family: monospace;">${rx.code || rx.id}</td>
          <td style="padding: 8px 10px; font-size: 0.74rem; color: #64748b;">${rx.date}</td>
          <td style="padding: 8px 10px;">
            <div style="font-weight: 700; color: #0f172a;">${patientDisplay}</div>
            <div style="font-size: 0.70rem; color: #64748b;">C.I. ${cedulaDisplay}</div>
          </td>
          <td style="padding: 8px 10px; font-size: 0.76rem; color: #334155;">${rx.diagnosis}</td>
          <td style="padding: 8px 10px; font-size: 0.74rem; color: #475569; max-width: 220px;">
            ${drugsList}
          </td>
          <td style="padding: 8px 10px; text-align: center;">
            <div style="display: inline-flex; gap: 6px;">
              <button type="button" class="btn-rx-download-mini btn-re-download-rx" data-rx-id="${rx.id}" title="Descargar copia oficial en PDF">
                <span>📥 Re-descargar PDF</span>
              </button>
              <button type="button" class="btn-secondary btn-re-view-rx" data-rx-id="${rx.id}" style="padding: 4px 8px; font-size: 0.72rem;" title="Ver prescripción">
                <span>👁️ Ver</span>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('.btn-re-download-rx').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const rxId = btn.dataset.rxId;
        const rx = rxs.find(r => r.id === rxId);
        if (rx) {
          downloadPrescriptionPDFDirect(rx);
        }
      }, { passive: true });
    });

    tbody.querySelectorAll('.btn-re-view-rx').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const rxId = btn.dataset.rxId;
        const rx = rxs.find(r => r.id === rxId);
        if (rx) {
          openPrescriptionModal({
            patientId: rx.patientId || '0987654321',
            patientCedula: rx.patientCedula || rx.patientId || '0987654321',
            patientName: rx.patientName,
            age: 44,
            sede: 'Clínica Ceibos',
            diagnosis: rx.diagnosis
          }, rx.diagnosis);
        }
      });
    });
  }

  function downloadPrescriptionPDFDirect(rx) {
    const cedula = rx.patientCedula || rx.patientId || '0987654321';

    openPrescriptionModal({
      patientId: rx.patientId || '0987654321',
      patientCedula: cedula,
      patientName: rx.patientName,
      age: 44,
      sede: 'Clínica Ceibos',
      diagnosis: rx.diagnosis
    }, rx.diagnosis);

    setTimeout(() => {
      const btnDownloadPdf = document.getElementById('btn-rx-download-pdf');
      if (btnDownloadPdf) {
        btnDownloadPdf.click();
      }
    }, 250);
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
            <span style="font-size: 0.8rem; font-weight: 700; color: #0f172a;">${rx.code}</span><br />
            <span>Fecha: ${rx.date}</span>
          </div>
        </div>
        <div style="margin-bottom: 12px; font-size: 0.84rem;">
          <strong>Paciente:</strong> ${rx.patientName} (${rx.patientId})<br />
          <strong>Diagnóstico Clínico:</strong> ${rx.diagnosis}
        </div>
        <div style="background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 12px;">
          <h5 style="font-size: 0.82rem; text-transform: uppercase; color: #0284c7; margin-bottom: 6px;">Rp / Tratamiento Farmacológico:</h5>
          <ul style="padding-left: 18px; font-size: 0.84rem; display: flex; flex-direction: column; gap: 6px;">
            ${rx.items.map(it => `<li><strong>${it.drug}</strong><br /><span style="color: #475569;">${it.dose}</span></li>`).join('')}
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

  // --- 5. REGISTRO DE GASTOS DE TRANSPORTE E INSUMOS (Semana 3) ---
  let gastosRangoFilter = 'semana'; // 'hoy', 'semana', 'todos'
  let gastosSedeFilter = 'TODAS';
  let gastosTipoFilter = 'TODOS';
  let currentCompressedComprobante = null;
  let isGastosInitialized = false;

  // Compresión automática de imágenes en el cliente mediante HTML5 Canvas
  function comprimirComprobanteCliente(file, maxWidth = 1200, maxHeight = 1200, quality = 0.75) {
    return new Promise((resolve, reject) => {
      if (!file) return reject(new Error('Archivo no provisto'));

      if (file.type === 'application/pdf') {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve({
            dataUrl: e.target.result,
            isPdf: true,
            fileName: file.name,
            originalSize: file.size,
            compressedSize: file.size,
            ahorroPct: 0
          });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          const compressedBytes = Math.round((compressedDataUrl.length * 3) / 4);
          const ahorro = Math.max(0, Math.round(((file.size - compressedBytes) / file.size) * 100));

          resolve({
            dataUrl: compressedDataUrl,
            isPdf: false,
            fileName: file.name,
            originalSize: file.size,
            compressedSize: compressedBytes,
            ahorroPct: ahorro
          });
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  }

  function getNowDatetimeLocal() {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  }

  function setupGastosEvents() {
    if (isGastosInitialized) return;
    isGastosInitialized = true;

    // Selector Segmentado de Tipo de Gasto
    const btnTipoTransporte = document.getElementById('btn-tipo-transporte');
    const btnTipoInsumos = document.getElementById('btn-tipo-insumos');
    const secTransporte = document.getElementById('seccion-campos-transporte');
    const secInsumos = document.getElementById('seccion-campos-insumos');
    const hiddenTipo = document.getElementById('gasto-tipo-principal');

    const inpMontoTrans = document.getElementById('gasto-transporte-monto');
    const inpMotivoTrans = document.getElementById('gasto-transporte-motivo');
    const inpFechaTrans = document.getElementById('gasto-transporte-fechahora');

    const inpMontoIns = document.getElementById('gasto-insumos-monto');
    const inpDetalleIns = document.getElementById('gasto-insumos-detalle');
    const inpFechaIns = document.getElementById('gasto-insumos-fechahora');
    const selTipoCompIns = document.getElementById('gasto-insumos-tipo-comprobante');
    const inpNumCompIns = document.getElementById('gasto-insumos-numero-comprobante');
    const starNumComp = document.getElementById('star-num-comp');

    function activarTabTransporte() {
      if (btnTipoTransporte) btnTipoTransporte.classList.add('active');
      if (btnTipoInsumos) btnTipoInsumos.classList.remove('active');
      if (secTransporte) secTransporte.style.display = 'flex';
      if (secInsumos) secInsumos.style.display = 'none';
      if (hiddenTipo) hiddenTipo.value = 'TRANSPORTE';

      if (inpMontoTrans) inpMontoTrans.required = true;
      if (inpMotivoTrans) inpMotivoTrans.required = true;
      if (inpFechaTrans) inpFechaTrans.required = true;

      if (inpMontoIns) inpMontoIns.required = false;
      if (inpDetalleIns) inpDetalleIns.required = false;
      if (inpFechaIns) inpFechaIns.required = false;
      if (inpNumCompIns) inpNumCompIns.required = false;
    }

    function activarTabInsumos() {
      if (btnTipoInsumos) btnTipoInsumos.classList.add('active');
      if (btnTipoTransporte) btnTipoTransporte.classList.remove('active');
      if (secInsumos) secInsumos.style.display = 'flex';
      if (secTransporte) secTransporte.style.display = 'none';
      if (hiddenTipo) hiddenTipo.value = 'INSUMOS';

      if (inpMontoTrans) inpMontoTrans.required = false;
      if (inpMotivoTrans) inpMotivoTrans.required = false;
      if (inpFechaTrans) inpFechaTrans.required = false;

      if (inpMontoIns) inpMontoIns.required = true;
      if (inpDetalleIns) inpDetalleIns.required = true;
      if (inpFechaIns) inpFechaIns.required = true;

      actualizarValidacionNumeroComprobante();
    }

    if (btnTipoTransporte) btnTipoTransporte.addEventListener('click', activarTabTransporte);
    if (btnTipoInsumos) btnTipoInsumos.addEventListener('click', activarTabInsumos);

    // Validación condicional del número de comprobante para Insumos
    function actualizarValidacionNumeroComprobante() {
      if (!selTipoCompIns || !inpNumCompIns) return;
      const tipo = selTipoCompIns.value;
      if (tipo === 'FACTURA_RUC' || tipo === 'NOTA_VENTA') {
        inpNumCompIns.required = true;
        if (starNumComp) starNumComp.style.display = 'inline';
      } else {
        inpNumCompIns.required = false;
        if (starNumComp) starNumComp.style.display = 'none';
      }
    }

    if (selTipoCompIns) {
      selTipoCompIns.addEventListener('change', actualizarValidacionNumeroComprobante);
    }

    // Inicializar fechas máximas y por defecto (no fechas futuras)
    const nowStr = getNowDatetimeLocal();
    if (inpFechaTrans) {
      inpFechaTrans.value = nowStr;
      inpFechaTrans.max = nowStr;
    }
    if (inpFechaIns) {
      inpFechaIns.value = nowStr;
      inpFechaIns.max = nowStr;
    }

    // Switch de Origen del Fondo (Dinero Propio vs Caja Chica)
    const cardOrigenMedico = document.getElementById('card-origen-medico');
    const cardOrigenSede = document.getElementById('card-origen-sede');
    const radOrigenMedico = document.getElementById('origen-medico-personal');
    const radOrigenSede = document.getElementById('origen-caja-chica');

    function actualizarEstiloOrigen(seleccion) {
      if (cardOrigenMedico) cardOrigenMedico.classList.toggle('selected', seleccion === 'MEDICO_PERSONAL');
      if (cardOrigenSede) cardOrigenSede.classList.toggle('selected', seleccion === 'CAJA_CHICA_SEDE');
    }

    if (cardOrigenMedico) {
      cardOrigenMedico.addEventListener('click', () => {
        if (radOrigenMedico) radOrigenMedico.checked = true;
        actualizarEstiloOrigen('MEDICO_PERSONAL');
      });
    }

    if (cardOrigenSede) {
      cardOrigenSede.addEventListener('click', () => {
        if (radOrigenSede) radOrigenSede.checked = true;
        actualizarEstiloOrigen('CAJA_CHICA_SEDE');
      });
    }

    // Manejo de Carga y Compresión de Comprobantes
    const fileTrans = document.getElementById('gasto-transporte-comprobante');
    const fileIns = document.getElementById('gasto-insumos-comprobante');
    const previewBox = document.getElementById('comprobante-preview-box');
    const imgPreview = document.getElementById('img-comprobante-preview');
    const lblFileName = document.getElementById('preview-nombre-archivo');
    const lblOrigSize = document.getElementById('preview-tamano-orig');
    const lblCompSize = document.getElementById('preview-tamano-comp');
    const lblAhorro = document.getElementById('preview-ahorro-pct');
    const btnRemovePreview = document.getElementById('btn-remover-comprobante');

    async function procesarArchivoComprobante(file) {
      if (!file) return;
      try {
        const resultado = await comprimirComprobanteCliente(file);
        currentCompressedComprobante = resultado;

        if (imgPreview) {
          if (resultado.isPdf) {
            imgPreview.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="%23ef4444"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>';
          } else {
            imgPreview.src = resultado.dataUrl;
          }
        }
        if (lblFileName) lblFileName.textContent = resultado.fileName;
        if (lblOrigSize) lblOrigSize.textContent = formatBytes(resultado.originalSize);
        if (lblCompSize) lblCompSize.textContent = formatBytes(resultado.compressedSize);
        if (lblAhorro) lblAhorro.textContent = `-${resultado.ahorroPct}% ahorro`;

        if (previewBox) previewBox.style.display = 'flex';
        showToast(`Comprobante comprimido con éxito (${formatBytes(resultado.compressedSize)}).`, 'success');
      } catch (err) {
        console.error('Error comprimiendo comprobante:', err);
        showToast('No se pudo procesar el comprobante seleccionado.', 'danger');
      }
    }

    if (fileTrans) {
      fileTrans.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          procesarArchivoComprobante(e.target.files[0]);
        }
      });
    }

    if (fileIns) {
      fileIns.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          procesarArchivoComprobante(e.target.files[0]);
        }
      });
    }

    if (btnRemovePreview) {
      btnRemovePreview.addEventListener('click', () => {
        currentCompressedComprobante = null;
        if (fileTrans) fileTrans.value = '';
        if (fileIns) fileIns.value = '';
        if (previewBox) previewBox.style.display = 'none';
        if (imgPreview) imgPreview.src = '';
      });
    }

    // Botón Limpiar
    const btnLimpiar = document.getElementById('btn-limpiar-gasto-form');
    if (btnLimpiar) {
      btnLimpiar.addEventListener('click', () => {
        const form = document.getElementById('form-registro-gastos-semana3');
        if (form) form.reset();
        currentCompressedComprobante = null;
        if (previewBox) previewBox.style.display = 'none';
        activarTabTransporte();
        const freshNow = getNowDatetimeLocal();
        if (inpFechaTrans) inpFechaTrans.value = freshNow;
        if (inpFechaIns) inpFechaIns.value = freshNow;
        actualizarEstiloOrigen('MEDICO_PERSONAL');
      });
    }

    // Envío del Formulario
    const formGasto = document.getElementById('form-registro-gastos-semana3');
    if (formGasto) {
      formGasto.addEventListener('submit', (e) => {
        e.preventDefault();
        const tipoPrincipal = hiddenTipo ? hiddenTipo.value : 'TRANSPORTE';
        const radOrigen = document.querySelector('input[name="origen_fondo_choice"]:checked');
        const origenFondo = radOrigen ? radOrigen.value : 'MEDICO_PERSONAL';
        const esReembolso = (origenFondo === 'MEDICO_PERSONAL');

        let monto = 0;
        let fechaHora = '';
        let sedeCodigo = '';
        let motivoDetalle = '';
        let tipoTransporte = '';
        let categoriaInsumo = '';
        let tipoComprobante = 'SIN_COMPROBANTE';
        let numeroComprobante = '';

        if (tipoPrincipal === 'TRANSPORTE') {
          monto = parseFloat(inpMontoTrans.value);
          fechaHora = inpFechaTrans.value;
          sedeCodigo = document.getElementById('gasto-transporte-sede').value;
          tipoTransporte = document.getElementById('gasto-transporte-tipo').value;
          motivoDetalle = inpMotivoTrans.value.trim();

          if (!sedeCodigo || !tipoTransporte || !motivoDetalle) {
            showToast('Por favor completa todos los campos obligatorios de transporte.', 'danger');
            return;
          }
        } else {
          monto = parseFloat(inpMontoIns.value);
          fechaHora = inpFechaIns.value;
          sedeCodigo = document.getElementById('gasto-insumos-sede').value;
          categoriaInsumo = document.getElementById('gasto-insumos-categoria').value;
          motivoDetalle = inpDetalleIns.value.trim();
          tipoComprobante = selTipoCompIns ? selTipoCompIns.value : 'SIN_COMPROBANTE';
          numeroComprobante = inpNumCompIns ? inpNumCompIns.value.trim() : '';

          if (!sedeCodigo || !categoriaInsumo || !motivoDetalle) {
            showToast('Por favor completa los campos requeridos del insumo.', 'danger');
            return;
          }

          if ((tipoComprobante === 'FACTURA_RUC' || tipoComprobante === 'NOTA_VENTA') && !numeroComprobante) {
            showToast('El número de comprobante es obligatorio para Factura o Nota de Venta.', 'danger');
            if (inpNumCompIns) inpNumCompIns.focus();
            return;
          }
        }

        // Validación estricta de monto (> 0.00)
        if (isNaN(monto) || monto <= 0) {
          showToast('El monto del egreso debe ser un valor positivo mayor a $0.00.', 'danger');
          return;
        }

        // Validación estricta de fecha (no permitir fechas futuras)
        if (fechaHora) {
          const gastoDate = new Date(fechaHora);
          const nowDate = new Date();
          // Margen de 2 minutos por desfase horario
          if (gastoDate.getTime() > nowDate.getTime() + 120000) {
            showToast('No se permiten registrar gastos con fecha u hora futura.', 'danger');
            return;
          }
        }

        // Registrar en el store
        const nuevoGasto = store.addExpense({
          tipoGasto: tipoPrincipal,
          sedeCodigo: sedeCodigo,
          monto: monto,
          amount: monto,
          fechaHora: fechaHora,
          date: fechaHora ? fechaHora.split('T')[0] : getTodayDateStr(),
          motivo: motivoDetalle,
          detalle: motivoDetalle,
          description: motivoDetalle,
          tipoTransporte: tipoTransporte,
          categoriaInsumo: categoriaInsumo,
          category: tipoPrincipal === 'TRANSPORTE' ? 'Transporte' : 'Insumos Médicos',
          origenFondo: origenFondo,
          esReembolsoMedico: esReembolso,
          tipoComprobante: tipoComprobante,
          numeroComprobante: numeroComprobante,
          comprobanteUrl: currentCompressedComprobante ? currentCompressedComprobante.dataUrl : '',
          comprobanteNombre: currentCompressedComprobante ? currentCompressedComprobante.fileName : '',
          quickLogged: false
        });

        const origenMsg = esReembolso ? 'Reembolso (+) para liquidación' : 'Deducción (-) de sede';
        showToast(`Egreso de $${monto.toFixed(2)} registrado con éxito (${origenMsg}).`, 'success');

        // Resetear formulario
        formGasto.reset();
        currentCompressedComprobante = null;
        if (previewBox) previewBox.style.display = 'none';
        activarTabTransporte();
        const freshNow = getNowDatetimeLocal();
        if (inpFechaTrans) inpFechaTrans.value = freshNow;
        if (inpFechaIns) inpFechaIns.value = freshNow;
        actualizarEstiloOrigen('MEDICO_PERSONAL');

        renderExpensesTab();
      });
    }

    // Filtros Rápidos de la Tabla
    const pillsRango = document.querySelectorAll('#filter-rango-group .history-pill-btn');
    pillsRango.forEach(pill => {
      pill.addEventListener('click', () => {
        pillsRango.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        gastosRangoFilter = pill.dataset.rango;
        renderExpensesTab();
      });
    });

    const selSede = document.getElementById('filter-gasto-sede');
    if (selSede) {
      selSede.addEventListener('change', () => {
        gastosSedeFilter = selSede.value;
        renderExpensesTab();
      });
    }

    const selTipo = document.getElementById('filter-gasto-tipo');
    if (selTipo) {
      selTipo.addEventListener('change', () => {
        gastosTipoFilter = selTipo.value;
        renderExpensesTab();
      });
    }

    // Modal de Preview de Comprobante
    const modalComp = document.getElementById('modal-preview-comprobante');
    const btnCerrarModal = document.getElementById('btn-cerrar-modal-comprobante');
    if (btnCerrarModal && modalComp) {
      btnCerrarModal.addEventListener('click', () => {
        modalComp.style.display = 'none';
      });
      modalComp.addEventListener('click', (e) => {
        if (e.target === modalComp) modalComp.style.display = 'none';
      });
    }

    // Presets Rápidos en 2 Toques
    const btnTaxi = document.getElementById('btn-preset-taxi');
    const btnGas = document.getElementById('btn-preset-gas');
    const btnHospital = document.getElementById('btn-preset-hospital');

    if (btnTaxi) {
      btnTaxi.onclick = () => {
        store.addExpense({
          tipoGasto: 'TRANSPORTE',
          sedeCodigo: 'CEIBOS',
          tipoTransporte: 'TAXI_APP',
          category: 'Transporte',
          description: 'Carrera de Taxi ruta Ceibos - Mapasingue',
          motivo: 'Carrera de Taxi ruta Ceibos - Mapasingue',
          amount: 4.00,
          monto: 4.00,
          origenFondo: 'MEDICO_PERSONAL',
          esReembolsoMedico: true,
          quickLogged: true
        });
        showToast('Gasto de Taxi ($4.00) registrado en 2 toques (Reembolso Médico).', 'success');
        renderExpensesTab();
      };
    }

    if (btnGas) {
      btnGas.onclick = () => {
        store.addExpense({
          tipoGasto: 'TRANSPORTE',
          sedeCodigo: 'CEIBOS',
          tipoTransporte: 'GASOLINA',
          category: 'Transporte',
          description: 'Combustible / Gasolina de traslado semanal',
          motivo: 'Combustible / Gasolina de traslado semanal',
          amount: 15.00,
          monto: 15.00,
          origenFondo: 'MEDICO_PERSONAL',
          esReembolsoMedico: true,
          quickLogged: true
        });
        showToast('Gasto de Gasolina ($15.00) registrado en 2 toques con éxito.', 'success');
        renderExpensesTab();
      };
    }

    if (btnHospital) {
      btnHospital.onclick = () => {
        store.addExpense({
          tipoGasto: 'INSUMOS',
          sedeCodigo: 'HOSPITAL',
          categoriaInsumo: 'INSUMOS_MEDICOS_BASICOS',
          category: 'Suministros Hospital',
          description: 'Insumos médicos de emergencia asumidos en hospital',
          detalle: 'Insumos médicos de emergencia asumidos en hospital',
          amount: 12.00,
          monto: 12.00,
          origenFondo: 'MEDICO_PERSONAL',
          esReembolsoMedico: true,
          quickLogged: true
        });
        showToast('Insumos de Hospital ($12.00) guardados para reembolso y deducción.', 'success');
        renderExpensesTab();
      };
    }
  }

  // Render principal del panel de gastos
  function renderExpensesTab() {
    setupGastosEvents();

    const state = store.getState();
    const todosGastos = state.expenses || [];
    const hoyStr = getTodayDateStr();

    // Fecha límite para "esta semana" (últimos 7 días)
    const sieteDiasAtras = new Date();
    sieteDiasAtras.setDate(sieteDiasAtras.getDate() - 7);

    // Calcular KPIs
    let totalTransporteSemana = 0;
    let totalInsumosSemana = 0;
    let granTotalEgresos = 0;
    let totalReembolsoMedico = 0;

    todosGastos.forEach(exp => {
      const expDate = exp.date ? new Date(exp.date) : new Date();
      const isSemana = (expDate >= sieteDiasAtras);
      const monto = Number(exp.amount !== undefined ? exp.amount : (exp.monto || 0));
      const tipo = (exp.tipoGasto || exp.tipo_gasto || (exp.category === 'Transporte' ? 'TRANSPORTE' : 'INSUMOS')).toUpperCase();
      const esReembolso = exp.origenFondo === 'MEDICO_PERSONAL' || exp.origen_fondo === 'MEDICO_PERSONAL' || Boolean(exp.esReembolsoMedico);

      if (isSemana) {
        if (tipo === 'TRANSPORTE') totalTransporteSemana += monto;
        else totalInsumosSemana += monto;
      }

      granTotalEgresos += monto;
      if (esReembolso) {
        totalReembolsoMedico += monto;
      }
    });

    // Actualizar KPI Cards en el DOM
    const kpiTransEl = document.getElementById('kpi-gastos-transporte');
    const kpiInsEl = document.getElementById('kpi-gastos-insumos');
    const kpiTotalEl = document.getElementById('kpi-gastos-total');
    const kpiReembEl = document.getElementById('kpi-gastos-reembolso');

    if (kpiTransEl) kpiTransEl.textContent = `$${totalTransporteSemana.toFixed(2)}`;
    if (kpiInsEl) kpiInsEl.textContent = `$${totalInsumosSemana.toFixed(2)}`;
    if (kpiTotalEl) kpiTotalEl.textContent = `$${granTotalEgresos.toFixed(2)}`;
    if (kpiReembEl) kpiReembEl.textContent = `$${totalReembolsoMedico.toFixed(2)}`;

    // Filtrar Gastos para la Tabla
    const gastosFiltrados = todosGastos.filter(exp => {
      // Filtro Sede
      if (gastosSedeFilter !== 'TODAS') {
        const sede = (exp.sedeCodigo || exp.sede_codigo || '').toUpperCase();
        if (sede !== gastosSedeFilter) return false;
      }

      // Filtro Tipo
      if (gastosTipoFilter !== 'TODOS') {
        const tipo = (exp.tipoGasto || exp.tipo_gasto || (exp.category === 'Transporte' ? 'TRANSPORTE' : 'INSUMOS')).toUpperCase();
        if (tipo !== gastosTipoFilter) return false;
      }

      // Filtro Temporal
      if (gastosRangoFilter === 'hoy') {
        if (exp.date !== hoyStr) return false;
      } else if (gastosRangoFilter === 'semana') {
        const expDate = exp.date ? new Date(exp.date) : new Date();
        if (expDate < sieteDiasAtras) return false;
      }

      return true;
    });

    // Contador de registros
    const lblCount = document.getElementById('lbl-total-gastos-count');
    if (lblCount) {
      lblCount.textContent = `${gastosFiltrados.length} ${gastosFiltrados.length === 1 ? 'registro' : 'registros'}`;
    }

    // Renderizar Filas de la Tabla
    const tbody = document.getElementById('tabla-gastos-tbody');
    if (!tbody) return;

    if (gastosFiltrados.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 28px; color: #94a3b8;">
            <div style="font-size: 1.4rem; margin-bottom: 6px;">📂</div>
            <strong>No hay gastos registrados en este criterio de búsqueda.</strong>
            <div style="font-size: 0.76rem; margin-top: 4px;">Usa los presets rápidos o el formulario superior para registrar uno nuevo.</div>
          </td>
        </tr>
      `;
      return;
    }

    const sedeBadgesMap = {
      MAPASINGUE: { label: 'Mapasingue (5%)', cls: 'badge-sede-mapasingue' },
      CEIBOS: { label: 'Ceibos (25%)', cls: 'badge-sede-ceibos' },
      ALBORADA: { label: 'Alborada (10%)', cls: 'badge-sede-alborada' },
      HOSPITAL: { label: 'Hospital (0%)', cls: 'badge-sede-hospital' },
      GENERAL: { label: 'Traslado General', cls: 'badge-sede-general' }
    };

    tbody.innerHTML = gastosFiltrados.map(exp => {
      const monto = Number(exp.amount !== undefined ? exp.amount : (exp.monto || 0));
      const tipo = (exp.tipoGasto || exp.tipo_gasto || (exp.category === 'Transporte' ? 'TRANSPORTE' : 'INSUMOS')).toUpperCase();
      const sedeKey = (exp.sedeCodigo || exp.sede_codigo || 'CEIBOS').toUpperCase();
      const sedeInfo = sedeBadgesMap[sedeKey] || { label: sedeKey, cls: 'badge-sede-general' };
      const esReembolso = exp.origenFondo === 'MEDICO_PERSONAL' || exp.origen_fondo === 'MEDICO_PERSONAL' || Boolean(exp.esReembolsoMedico);
      const isLiquidado = exp.estadoLiquidacion === 'LIQUIDADO' || exp.estado_liquidacion === 'LIQUIDADO';

      const fechaDisplay = exp.fechaHora
        ? exp.fechaHora.replace('T', ' ').slice(5, 16)
        : (exp.date || hoyStr);

      const tipoIcon = (tipo === 'TRANSPORTE') ? '🚗' : '📦';
      const subTipoLabel = exp.tipoTransporte || exp.categoriaInsumo || exp.category || tipo;

      // Comprobante
      let compHtml = `<span class="btn-no-voucher">Sin adjunto</span>`;
      if (exp.comprobanteUrl || exp.comprobante_url) {
        const urlSafe = (exp.comprobanteUrl || exp.comprobante_url);
        compHtml = `
          <button type="button" class="btn-view-voucher" data-img="${urlSafe}" data-name="${exp.description || 'Comprobante'}" data-monto="${monto.toFixed(2)}">
            <span>👁️</span> Ver
          </button>
        `;
      } else if (exp.voucherNumber || exp.numeroComprobante) {
        const numComp = exp.voucherNumber || exp.numeroComprobante;
        compHtml = `<span style="font-size: 0.70rem; color: #475569; font-family: monospace;">#${numComp}</span>`;
      }

      // Acciones (Eliminar con bloqueo de liquidado)
      let accionesHtml = '';
      if (isLiquidado) {
        accionesHtml = `<span class="badge-liquidado-lock" title="Gasto procesado en cierre semanal. Inmutable.">🔒 Liquidado</span>`;
      } else {
        accionesHtml = `
          <button type="button" class="btn-delete-expense" data-id="${exp.id}" data-monto="${monto.toFixed(2)}" title="Eliminar este gasto">
            🗑️
          </button>
        `;
      }

      return `
        <tr>
          <td><strong style="color: #0f172a;">${fechaDisplay}</strong></td>
          <td><span class="badge-sede-tag ${sedeInfo.cls}">${sedeInfo.label}</span></td>
          <td>
            <span class="badge-tipo-pill">
              <span>${tipoIcon}</span>
              <span>${subTipoLabel}</span>
            </span>
          </td>
          <td>
            <div style="font-weight: 600; color: #1e293b; max-width: 240px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${exp.description || exp.motivo || ''}">
              ${exp.description || exp.motivo || 'Sin detalle'}
            </div>
          </td>
          <td>
            ${esReembolso
              ? `<span class="badge-pago-reembolso">👨‍⚕️ Reembolso (+)</span>`
              : `<span class="badge-pago-deduccion">🏥 Deducción (-)</span>`
            }
          </td>
          <td style="text-align: right;">
            <span class="monto-gasto-val" style="color: ${esReembolso ? '#059669' : '#dc2626'};">
              -$${monto.toFixed(2)}
            </span>
          </td>
          <td style="text-align: center;">${compHtml}</td>
          <td style="text-align: center;">${accionesHtml}</td>
        </tr>
      `;
    }).join('');

    // Conectar eventos a los botones de comprobante
    const btnsVoucher = tbody.querySelectorAll('.btn-view-voucher');
    const modalComp = document.getElementById('modal-preview-comprobante');
    const modalImg = document.getElementById('modal-comprobante-img');
    const modalInfo = document.getElementById('modal-comprobante-info');
    const modalTitulo = document.getElementById('modal-comprobante-titulo');

    btnsVoucher.forEach(btn => {
      btn.addEventListener('click', () => {
        const imgSrc = btn.dataset.img;
        const name = btn.dataset.name;
        const monto = btn.dataset.monto;
        if (modalImg) modalImg.src = imgSrc;
        if (modalTitulo) modalTitulo.textContent = `Comprobante: ${name}`;
        if (modalInfo) modalInfo.innerHTML = `<strong>Monto Asignado:</strong> $${monto} USD`;
        if (modalComp) modalComp.style.display = 'flex';
      });
    });

    // Conectar eventos a los botones de eliminación
    const btnsDelete = tbody.querySelectorAll('.btn-delete-expense');
    btnsDelete.forEach(btn => {
      btn.addEventListener('click', () => {
        const expId = btn.dataset.id;
        const monto = btn.dataset.monto;
        const confirmDelete = window.confirm(`¿Confirmas que deseas eliminar el egreso ${expId} por $${monto}?`);
        if (!confirmDelete) return;

        const res = store.deleteExpense(expId);
        if (res.success) {
          showToast(`Egreso ${expId} eliminado exitosamente.`, 'success');
          renderExpensesTab();
        } else {
          showToast(res.message || 'No se pudo eliminar el gasto.', 'danger');
        }
      });
    });
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
      activeDate = getTodayDateStr();
      switchDoctorTab(activeDoctorTab);
      renderSystemAlertsBadge();
    }
  });

  // Inicializar vista de cronograma inicial si ya está en vista doctor
  if (store.getActiveView() === 'doctor') {
    switchDoctorTab('agenda');
  } else {
    renderTimeline();
  }
}
