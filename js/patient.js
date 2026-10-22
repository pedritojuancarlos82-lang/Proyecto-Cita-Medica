/**
 * Flujo 1: Portal de Citas del Paciente (Página 3)
 * Asistente de 4 pasos para selección de sede, horario protegido sin choques,
 * cálculo transparente del recargo del 9.75% por tarjeta, y generación de ticket QR.
 * Incluye validación matemática de cédula (Módulo 10), celular (10 dígitos), email
 * y detección automática en SRI en tiempo real.
 */

import { CLINICS, CREDIT_CARD_SURCHARGE_RATE, store } from './state.js';
import { renderizarCodigoQR } from './qr-generator.js';
import {
  validarCedulaEcuatorianaDetallada,
  validarCedulaEcuatoriana,
  validarCelularDetallado,
  validarTelefono,
  validarEmailDetallado,
  validarEmail,
  validarNombreCompletoDetallado,
  validarNombreCompleto,
  validarTarjetaLuhn,
  detectarMarcaTarjeta,
  validarFechaExpiracion,
  validarCodigoSeguridadCVV,
  validarNombreTitularTarjeta
} from './validaciones-globales.js';
import { EmailService } from './services/email-service.js';
import { MedicalService } from './services/medical-service.js';
import { CollisionEngine } from './services/collision-engine.js';
import { QRTokenService, SlotHoldManager, PatientReconciliator } from './services/qr-token-service.js';
import { authService } from './auth.js';
import { SupabaseDB } from './supabase-client.js';

// Utilidades locales para UI de errores
const showFieldError = (inputEl, message) => {
  if (!inputEl) return;
  let errorDiv = inputEl.parentNode.querySelector('.input-error-msg');
  if (!errorDiv) {
    errorDiv = inputEl.nextElementSibling;
  }
  if (!errorDiv || !errorDiv.classList.contains('input-error-msg')) {
    errorDiv = document.createElement('div');
    errorDiv.className = 'input-error-msg';
    inputEl.parentNode.appendChild(errorDiv);
  }
  errorDiv.textContent = message;
  errorDiv.classList.add('visible');
  inputEl.classList.remove('valid');
  inputEl.classList.add('error');
};

const clearFieldError = (inputEl) => {
  if (!inputEl) return;
  const parent = inputEl.parentNode;
  if (parent) {
    const errorDiv = parent.querySelector('.input-error-msg');
    if (errorDiv) {
      errorDiv.classList.remove('visible');
      errorDiv.textContent = '';
    }
  }
  inputEl.classList.remove('error');
};

export function setupPatientPortal(showToast) {
  const idInput = document.getElementById('pat-input-id');
  const nameInput = document.getElementById('pat-input-name');
  const phoneInput = document.getElementById('pat-input-phone');
  const emailInput = document.getElementById('pat-input-email');
  const sriStatusBox = document.getElementById('sri-lookup-status');

  let currentStep = 1;
  let selectedClinicId = 'ceibos';
  let selectedServiceId = 'CG-01';

  // Función para obtener la fecha de hoy en formato YYYY-MM-DD
  function getTodayDateStr() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const currentDay = now.getDate();
    const currentMonthStr = currentMonth < 10 ? `0${currentMonth}` : `${currentMonth}`;
    const currentDayStr = currentDay < 10 ? `0${currentDay}` : `${currentDay}`;
    return `${currentYear}-${currentMonthStr}-${currentDayStr}`;
  }

  // Inicializar siempre con la fecha de hoy automáticamente
  let selectedDate = getTodayDateStr();
  let selectedTimeSlot = '10:30';
  let selectedPaymentMethod = 'cash'; // 'cash', 'transfer' o 'card'
  let createdAppointment = null;
  let lastQueriedCedula = '';

  // Elementos del Stepper
  const stepItems = document.querySelectorAll('.wizard-stepper .step-item');
  const stepContainers = document.querySelectorAll('.wizard-step-pane');
  const btnPrev = document.getElementById('wizard-btn-prev');
  const btnNext = document.getElementById('wizard-btn-next');

  // Actualizar la vista del Stepper en la página y en la barra superior dinámica
  function updateStepView() {
    stepItems.forEach(item => {
      const stepNum = parseInt(item.dataset.step, 10);
      item.classList.remove('active', 'completed');
      if (stepNum === currentStep) {
        item.classList.add('active');
      } else if (stepNum < currentStep) {
        item.classList.add('completed');
      }
    });

    // Sincronizar botones de la barra de navegación superior dinámica
    document.querySelectorAll('#nav-menu-patient .nav-step-btn').forEach(btn => {
      const stepNum = parseInt(btn.dataset.step, 10);
      btn.classList.toggle('active', stepNum === currentStep);
    });

    stepContainers.forEach(pane => {
      pane.style.display = (parseInt(pane.dataset.step, 10) === currentStep) ? 'block' : 'none';
    });

    // Manejo de botones inferior
    if (btnPrev) {
      btnPrev.style.visibility = (currentStep === 1 || currentStep === 4) ? 'hidden' : 'visible';
    }

    if (btnNext) {
      if (currentStep === 3) {
        btnNext.innerHTML = '💳 Confirmar y Generar Ticket';
        btnNext.className = 'btn-primary';
      } else if (currentStep === 4) {
        btnNext.innerHTML = '📅 Agendar Otra Cita';
        btnNext.className = 'btn-secondary';
      } else {
        btnNext.innerHTML = 'Continuar Siguiente Paso →';
        btnNext.className = 'btn-primary';
      }
    }
  }

  // --- PASO 1: Renderizar Selección de Servicio y Sedes ---
  const servicesContainer = document.getElementById('consultation-cards-container');
  if (servicesContainer) {
    const catalogo = MedicalService.getCatalogo();
    servicesContainer.innerHTML = catalogo.map(servicio => {
      const isSelected = servicio.id === selectedServiceId;
      return `
        <div class="clinic-selection-card ${isSelected ? 'selected' : ''}" data-service-id="${servicio.id}" style="cursor: pointer;">
          <div class="clinic-card-body">
            <h3 class="clinic-card-name" style="color: var(--dark-navy);">${servicio.nombre}</h3>
            <p style="font-size: 0.85rem; color: #64748b; margin-top: 5px; margin-bottom: 10px;">${servicio.descripcionCorta}</p>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span class="badge-sede badge-hospital" style="background: #e2e8f0; color: #475569;">⏱️ ${servicio.duracionMinutos} min</span>
              <span class="price-tag-amount" style="font-weight: 800; color: var(--emerald-green-dark);">$${servicio.precioBase.toFixed(2)}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    servicesContainer.querySelectorAll('.clinic-selection-card').forEach(card => {
      card.addEventListener('click', () => {
        servicesContainer.querySelectorAll('.clinic-selection-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        selectedServiceId = card.dataset.serviceId;
        updateSummaryCard();
      });
    });
  }

  const clinicsContainer = document.getElementById('clinics-cards-container');
  if (clinicsContainer) {
    clinicsContainer.innerHTML = Object.values(CLINICS).map(clinic => {
      const isFree = clinic.basePrice === 0;
      const isSelected = clinic.id === selectedClinicId;
      return `
        <div class="clinic-selection-card ${isSelected ? 'selected' : ''}" data-clinic-id="${clinic.id}">
          <img src="${clinic.image}" alt="${clinic.name}" class="clinic-card-image" loading="lazy" />
          <div class="clinic-card-body">
            <div class="clinic-card-badge-row">
              <span class="badge-sede ${clinic.badgeClass}">${clinic.type}</span>
              <span style="font-size: 0.72rem; font-weight: 700; color: #64748b;">${clinic.consultorio}</span>
            </div>
            <h3 class="clinic-card-name">${clinic.name}</h3>
            <p class="clinic-card-address">📍 ${clinic.address}</p>
            <div class="clinic-card-price-tag">
              <span class="price-tag-label">Tarifa de Consulta:</span>
              <span class="price-tag-amount ${isFree ? 'price-tag-free' : ''}">
                ${isFree ? 'Gratuito ($0.00)' : `$${clinic.basePrice.toFixed(2)}`}
              </span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Escuchar selección de sede
    clinicsContainer.querySelectorAll('.clinic-selection-card').forEach(card => {
      card.addEventListener('click', () => {
        clinicsContainer.querySelectorAll('.clinic-selection-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        selectedClinicId = card.dataset.clinicId;
        renderTimeSlots();
        updateSummaryCard();
      });
    });
  }

  // --- PASO 2: Calendario Dinámico y Rejilla de Horarios ---
  const slotsContainer = document.getElementById('time-slots-grid');
  const calendarDaysContainer = document.getElementById('calendar-days-grid');
  const travelNoticeBox = document.getElementById('travel-buffer-notice');

  // Renderizar Calendario Dinámico (Siempre con la fecha de hoy como base)
  function renderCalendar() {
    if (!calendarDaysContainer) return;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthIndex = now.getMonth();
    const currentDay = now.getDate();
    const todayFormatted = getTodayDateStr();

    // Si la fecha seleccionada era anterior a hoy, actualizar a hoy
    if (!selectedDate || selectedDate < todayFormatted) {
      selectedDate = todayFormatted;
    }

    // Sincronizar input[type="date"] nativo con min fijado en la fecha actual
    const dateInput = document.getElementById('pat-input-date');
    if (dateInput) {
      dateInput.min = todayFormatted;
      dateInput.value = selectedDate;
      if (!dateInput.dataset.boundListener) {
        dateInput.dataset.boundListener = 'true';
        dateInput.addEventListener('change', (e) => {
          const chosen = e.target.value;
          if (!chosen || chosen < todayFormatted) {
            showToast('No puedes seleccionar fechas pasadas. Se ha seleccionado la fecha de hoy.', 'warning');
            dateInput.value = todayFormatted;
            selectedDate = todayFormatted;
          } else {
            selectedDate = chosen;
          }
          renderCalendar();
          renderTimeSlots();
          updateSummaryCard();
        });
      }
    }

    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const monthTitle = `${monthNames[currentMonthIndex]} ${currentYear}`;
    const monthEl = document.getElementById('calendar-current-month') || document.querySelector('.calendar-current-month');
    if (monthEl) monthEl.textContent = monthTitle;

    const todayIndicator = document.getElementById('badge-calendar-today-indicator');
    if (todayIndicator) {
      todayIndicator.textContent = `Hoy: ${currentDay} ${monthNames[currentMonthIndex].slice(0, 3)}`;
    }

    const daysInMonth = new Date(currentYear, currentMonthIndex + 1, 0).getDate();
    const firstDayIndex = new Date(currentYear, currentMonthIndex, 1).getDay(); // 0 = Domingo

    let html = '';
    for (let i = 0; i < firstDayIndex; i++) {
      html += `<div class="calendar-day-cell disabled empty" style="cursor: default; opacity: 0.25;"></div>`;
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dayStr = d < 10 ? `0${d}` : `${d}`;
      const monthStr = (currentMonthIndex + 1) < 10 ? `0${currentMonthIndex + 1}` : `${currentMonthIndex + 1}`;
      const dateVal = `${currentYear}-${monthStr}-${dayStr}`;

      const isPast = (d < currentDay);
      const isToday = (d === currentDay);
      const isSelected = (dateVal === selectedDate);

      let classes = 'calendar-day-cell';
      if (isToday) classes += ' today';
      if (isSelected) classes += ' selected';
      if (isPast) classes += ' disabled';

      html += `
        <div class="${classes}" data-date="${dateVal}" ${isPast ? 'title="Fecha pasada no habilitada"' : `title="${d} de ${monthNames[currentMonthIndex]}"`}>
          ${d}
        </div>
      `;
    }
    calendarDaysContainer.innerHTML = html;

    calendarDaysContainer.querySelectorAll('.calendar-day-cell:not(.disabled)').forEach(cell => {
      cell.addEventListener('click', () => {
        calendarDaysContainer.querySelectorAll('.calendar-day-cell').forEach(c => c.classList.remove('selected'));
        cell.classList.add('selected');
        selectedDate = cell.dataset.date;
        if (dateInput) {
          dateInput.value = selectedDate;
        }
        renderTimeSlots();
        updateSummaryCard();
      });
    });
  }

  // Generar y filtrar horarios según fecha actual, horarios pasados y motor de colisiones
  function renderTimeSlots() {
    if (!slotsContainer) return;

    const baseSlots = ['08:30', '09:00', '09:45', '10:30', '11:15', '12:00', '13:00', '13:45', '14:30', '15:15', '16:00', '16:45', '17:30'];
    const state = store.getState();

    // Detección de Fecha Actual y Margen de Anticipación Mínima (Buffer de cortesía = 30 min)
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = (now.getMonth() + 1).toString().padStart(2, '0');
    const currentDay = now.getDate().toString().padStart(2, '0');
    const todayStr = `${currentYear}-${currentMonth}-${currentDay}`;
    const isToday = (selectedDate === todayStr);

    const hora_actual = now.getHours();
    const minutos_actual = now.getMinutes();
    const currentMinutes = hora_actual * 60 + minutos_actual;
    const buffer = 30; // Ventana de anticipación mínima de cortesía de 30 minutos

    let firstAvailable = null;
    let availableCount = 0;

    const slotButtonsHtml = baseSlots.map(time => {
      const [sh, sm] = time.split(':').map(Number);
      const slotMinutes = sh * 60 + sm;

      // 1. Si es hoy: ningún slot menor o igual a hora_actual + buffer debe estar disponible
      const isPastTime = isToday && (slotMinutes <= (currentMinutes + buffer));

      // 2. Si no es hora pasada, evaluar disponibilidad médica y amortiguamiento vial
      let validacion = { valido: true };
      if (!isPastTime) {
        validacion = CollisionEngine.validarDisponibilidadSlot({
          sedeId: selectedClinicId,
          fechaStr: selectedDate,
          horaStr: time,
          duracionMinutos: 45,
          citas: state.appointments,
          travelBuffers: state.travelBuffers
        });
      }

      const isAvailable = !isPastTime && validacion.valido;
      if (isAvailable) {
        availableCount++;
        if (!firstAvailable) {
          firstAvailable = time;
        }
      }

      let extraClasses = '';
      let badgeLabel = '';
      let tooltip = 'Horario disponible para consulta';

      if (isPastTime) {
        extraClasses = 'disabled slot-disabled slot-past';
        badgeLabel = ' ⏰ Pasado';
        tooltip = `Horario no disponible para hoy (hora pasada o requiere anticipación mínima de ${buffer} min)`;
      } else if (!isAvailable) {
        if (validacion.codigoError && validacion.codigoError.startsWith('TRASLADO')) {
          extraClasses = 'disabled transit';
          badgeLabel = ' 🚗';
          tooltip = validacion.razonRechazo || 'Médico en traslado vial entre sedes';
        } else if (validacion.codigoError === 'SALA_OCUPADA') {
          extraClasses = 'disabled';
          badgeLabel = ' 🔒';
          tooltip = 'Horario ocupado por otra consulta';
        } else {
          extraClasses = 'disabled';
          badgeLabel = ' ⏸️';
          tooltip = validacion.razonRechazo || 'Horario no disponible';
        }
      }

      const isSelected = isAvailable && (time === selectedTimeSlot);

      return `
        <button type="button" 
                class="slot-pill-btn ${extraClasses} ${isSelected ? 'selected' : ''}" 
                data-time="${time}" 
                ${!isAvailable ? 'disabled' : ''} 
                style="${!isAvailable ? 'opacity: 0.38; pointer-events: none; cursor: not-allowed;' : ''}"
                title="${tooltip}">
          ${time}${badgeLabel}
        </button>
      `;
    }).join('');

    // Mensaje contextual y amigable si tras el filtro no queda ningún turno disponible para hoy
    let noSlotsBannerHtml = '';
    if (isToday && availableCount === 0) {
      noSlotsBannerHtml = `
        <div class="no-slots-today-alert" style="width: 100%; grid-column: 1 / -1; margin-bottom: 14px;">
          <span style="font-size: 1.6rem; flex-shrink: 0;">⏰</span>
          <div>
            <strong style="font-size: 0.94rem; display: block; margin-bottom: 2px; color: #881337;">
              Ya no hay turnos disponibles para el resto del día de hoy. Por favor, selecciona una fecha posterior.
            </strong>
            <span style="font-size: 0.80rem; color: #9f1239; line-height: 1.35; display: block;">
              Todos los turnos de la jornada médica actual ya han finalizado o no cumplen con el margen mínimo de anticipación de ${buffer} minutos. Usa el selector de fecha o el calendario interactivo para seleccionar un día posterior.
            </span>
          </div>
        </div>
      `;
      selectedTimeSlot = null;
    } else {
      // Si el horario seleccionado previamente no es válido o está deshabilitado, seleccionar el primero disponible
      const isCurrentSelectionValid = baseSlots.some(t => {
        if (t !== selectedTimeSlot) return false;
        if (!isToday) return true;
        const [h, m] = t.split(':').map(Number);
        return (h * 60 + m) > (currentMinutes + buffer);
      });

      if ((!isCurrentSelectionValid || !selectedTimeSlot) && firstAvailable) {
        selectedTimeSlot = firstAvailable;
      }
    }

    slotsContainer.innerHTML = noSlotsBannerHtml + slotButtonsHtml;

    // Resaltar el botón seleccionado válido
    if (selectedTimeSlot) {
      const activeBtn = slotsContainer.querySelector(`.slot-pill-btn[data-time="${selectedTimeSlot}"]:not(.disabled)`);
      if (activeBtn) {
        slotsContainer.querySelectorAll('.slot-pill-btn').forEach(b => b.classList.remove('selected'));
        activeBtn.classList.add('selected');
      }
    }

    slotsContainer.querySelectorAll('.slot-pill-btn:not(.disabled)').forEach(btn => {
      btn.addEventListener('click', () => {
        slotsContainer.querySelectorAll('.slot-pill-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedTimeSlot = btn.dataset.time;
        updateSummaryCard();
        actualizarAvisoBuffer();
      });
    });

    actualizarAvisoBuffer();
  }

  function actualizarAvisoBuffer() {
    if (!travelNoticeBox) return;
    const state = store.getState();
    const buffersDelDia = state.travelBuffers.filter(t => t.date === selectedDate);

    if (buffersDelDia.length > 0) {
      travelNoticeBox.style.display = 'flex';
      travelNoticeBox.innerHTML = `
        <div style="font-size: 1.25rem;">🚗</div>
        <div>
          <strong style="color: #0284c7;">Amortiguamiento Vial Activo (Guayaquil):</strong>
          <div style="font-size: 0.74rem; color: #475569; margin-top: 2px;">
            ${buffersDelDia.map(b => `<span><strong>${b.fromClinic.toUpperCase()} → ${b.toClinic.toUpperCase()}:</strong> ${b.bufferLabel} (${b.startTime} - ${b.endTime})</span>`).join('<br/>')}
          </div>
        </div>
      `;
    } else {
      travelNoticeBox.style.display = 'none';
      travelNoticeBox.innerHTML = '';
    }
  }

  // --- PASO 3: Método de Pago & Validaciones Reactivas ---
  const paymentOptions = document.querySelectorAll('.payment-method-option');
  paymentOptions.forEach(opt => {
    opt.addEventListener('click', () => {
      paymentOptions.forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      const radio = opt.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;
      selectedPaymentMethod = opt.dataset.method;
      updateSummaryCard();
    });
  });

  // Validación de Cédula (Sin conexión al SRI, con mensaje estricto 'Cédula incorrecta.')
  function handleCedulaCheck(cedula) {
    if (!cedula) return;
    if (cedula.length < 10) {
      clearFieldError(idInput);
      return;
    }

    const check = validarCedulaEcuatorianaDetallada(cedula);
    if (!check.isValid) {
      showFieldError(idInput, 'Cédula incorrecta.');
      return;
    }

    // La cédula es válida
    clearFieldError(idInput);
    if (idInput) idInput.classList.add('valid');
  }

  // Escuchadores reactivos de los inputs del Paso 3
  if (idInput) {
    idInput.setAttribute('maxlength', '10');
    idInput.setAttribute('inputmode', 'numeric');
    idInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/\D/g, '').substring(0, 10);
      clearFieldError(idInput);
      idInput.classList.remove('valid');
      const val = e.target.value.trim();
      if (val.length === 10) {
        handleCedulaCheck(val);
      }
    });

    idInput.addEventListener('blur', (e) => {
      const val = e.target.value.trim();
      if (val.length > 0) {
        const check = validarCedulaEcuatorianaDetallada(val);
        if (!check.isValid) {
          showFieldError(idInput, check.message);
        } else {
          clearFieldError(idInput);
          idInput.classList.add('valid');
        }
      }
    });
  }

  if (nameInput) {
    nameInput.setAttribute('maxlength', '70');
    nameInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
      clearFieldError(nameInput);
      nameInput.classList.remove('valid');
      const check = validarNombreCompletoDetallado(nameInput.value);
      if (check.isValid) {
        nameInput.classList.add('valid');
      }
    });

    nameInput.addEventListener('blur', () => {
      const val = nameInput.value.trim();
      if (val.length > 0) {
        const check = validarNombreCompletoDetallado(val);
        if (!check.isValid) {
          showFieldError(nameInput, check.message);
        } else {
          clearFieldError(nameInput);
          nameInput.classList.add('valid');
        }
      }
    });
  }

  if (phoneInput) {
    phoneInput.setAttribute('maxlength', '10');
    phoneInput.setAttribute('inputmode', 'numeric');
    phoneInput.addEventListener('input', (e) => {
      let val = e.target.value.replace(/\D/g, '');
      // Normalizar si se ingresa o pega prefijo internacional (+593 o +583)
      if ((val.startsWith('593') || val.startsWith('583')) && val.length > 10) {
        val = '0' + val.substring(3);
      }
      val = val.substring(0, 10);
      e.target.value = val;
      clearFieldError(phoneInput);
      phoneInput.classList.remove('valid');
      if (val.length === 10) {
        const check = validarCelularDetallado(val);
        if (check.isValid) {
          phoneInput.classList.add('valid');
        } else {
          showFieldError(phoneInput, check.message);
        }
      }
    });

    phoneInput.addEventListener('blur', () => {
      const val = phoneInput.value.trim();
      if (val.length > 0) {
        const check = validarCelularDetallado(val);
        if (!check.isValid) {
          showFieldError(phoneInput, check.message);
        } else {
          clearFieldError(phoneInput);
          phoneInput.classList.add('valid');
        }
      }
    });
  }

  if (emailInput) {
    emailInput.addEventListener('input', () => {
      clearFieldError(emailInput);
      emailInput.classList.remove('valid');
    });

    emailInput.addEventListener('blur', () => {
      const val = emailInput.value.trim();
      if (val.length > 0) {
        const check = validarEmailDetallado(val);
        if (!check.isValid) {
          showFieldError(emailInput, check.message);
        } else {
          clearFieldError(emailInput);
          emailInput.classList.add('valid');
        }
      }
    });
  }

  // Función para mantener o dejar limpios los campos del formulario de ticket
  function clearTicketFormInputs() {
    if (idInput) {
      idInput.value = '';
      clearFieldError(idInput);
      idInput.classList.remove('valid');
    }
    if (nameInput) {
      nameInput.value = '';
      clearFieldError(nameInput);
      nameInput.classList.remove('valid');
    }
    if (phoneInput) {
      phoneInput.value = '';
      clearFieldError(phoneInput);
      phoneInput.classList.remove('valid');
    }
    if (emailInput) {
      emailInput.value = '';
      clearFieldError(emailInput);
      emailInput.classList.remove('valid');
    }
    const patReasonInput = document.getElementById('pat-input-reason');
    if (patReasonInput) {
      patReasonInput.value = '';
    }
  }

  // Al crear un ticket los campos deben permanecer vacíos para el usuario
  function prefillPatientData() {
    // No precargar datos automáticos para que los campos aparezcan siempre limpios
  }

  function updateSummaryCard() {
    const clinic = CLINICS[selectedClinicId] || CLINICS.ceibos;
    const catalogo = MedicalService.getCatalogo();
    const service = catalogo.find(s => s.id === selectedServiceId) || catalogo[0];

    const isHospital = (selectedClinicId === 'hospital' || selectedClinicId === 'hospital_ceibos');
    const baseFee = isHospital ? 0.00 : 20.00;

    const isCard = (selectedPaymentMethod === 'card' || selectedPaymentMethod === 'tarjeta');
    const isCashOrTransfer = (selectedPaymentMethod === 'cash' || selectedPaymentMethod === 'efectivo' || selectedPaymentMethod === 'transfer' || selectedPaymentMethod === 'transferencia');

    const cardSurchargeRate = CREDIT_CARD_SURCHARGE_RATE || 0.0975;
    const processingFee = isCard ? +(baseFee * cardSurchargeRate).toFixed(2) : 0.00;
    const totalDue = isCard ? +(baseFee + processingFee).toFixed(2) : baseFee;

    const sumClinic = document.getElementById('sum-clinic-name');
    const sumDate = document.getElementById('sum-date-time');
    const sumBaseFee = document.getElementById('sum-base-fee');
    const sumCardFeeRow = document.getElementById('sum-card-fee-row');
    const sumFeeLabel = document.getElementById('sum-fee-label');
    const sumCardFee = document.getElementById('sum-card-fee-amount');
    const sumSavingBadgeRow = document.getElementById('sum-saving-badge-row');
    const sumTotalLabel = document.getElementById('sum-total-label');
    const sumTotalDue = document.getElementById('sum-total-due');

    if (sumClinic) sumClinic.textContent = clinic.name;

    if (sumDate) {
      const parts = (selectedDate || '').split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        const monthNames = [
          'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
          'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
        ];
        const todayDate = new Date();
        const isToday = (y === todayDate.getFullYear() && m === todayDate.getMonth() && d === todayDate.getDate());
        const dateLabel = isToday ? `Hoy (${d} ${monthNames[m]})` : `${d} ${monthNames[m]} ${y}`;
        const timeLabel = selectedTimeSlot ? `a las ${selectedTimeSlot}` : '(Sin horario disponible)';
        sumDate.textContent = `${dateLabel} ${timeLabel}`;
      } else {
        sumDate.textContent = `${selectedDate} ${selectedTimeSlot ? `a las ${selectedTimeSlot}` : '(Sin horario)'}`;
      }
    }

    if (sumBaseFee) {
      sumBaseFee.textContent = isHospital ? 'Gratuito ($0.00)' : `$${baseFee.toFixed(2)}`;
    }

    if (sumCardFeeRow && sumCardFee) {
      if (isHospital) {
        sumCardFeeRow.style.display = 'none';
      } else if (isCard) {
        sumCardFeeRow.style.display = 'flex';
        if (sumFeeLabel) sumFeeLabel.textContent = 'Recargo por procesamiento con tarjeta (9.75%):';
        sumCardFee.textContent = `+$${processingFee.toFixed(2)}`;
        sumCardFee.style.color = '#ef4444';
      } else {
        sumCardFeeRow.style.display = 'flex';
        if (sumFeeLabel) sumFeeLabel.textContent = 'Recargo pasarela (0%):';
        sumCardFee.textContent = '+$0.00';
        sumCardFee.style.color = '#64748b';
      }
    }

    if (sumSavingBadgeRow) {
      if (!isHospital && isCashOrTransfer) {
        sumSavingBadgeRow.style.display = 'flex';
      } else {
        sumSavingBadgeRow.style.display = 'none';
      }
    }

    if (sumTotalLabel) {
      sumTotalLabel.textContent = isCard ? 'Total final debitado:' : 'Total a Pagar:';
    }

    if (sumTotalDue) {
      sumTotalDue.textContent = isHospital ? '$0.00' : `$${totalDue.toFixed(2)}`;
    }
  }

  // --- PASO 4: Generar Ticket y Código QR Dinámico (Página 3) ---
  // Función de Validación Rigurosa por Paso
  function validateStepData(step) {
    if (step === 1) {
      if (!selectedClinicId) {
        showToast('Por favor selecciona una sede de atención médica para continuar.', 'warning');
        return false;
      }
      if (!selectedServiceId) {
        showToast('Por favor selecciona un tipo de consulta médica.', 'warning');
        return false;
      }
      return true;
    }

    if (step === 2) {
      const todayStr = getTodayDateStr();
      if (!selectedDate || selectedDate < todayStr) {
        showToast('La fecha seleccionada no es válida o ya ha transcurrido. Se ha restablecido a hoy.', 'warning');
        selectedDate = todayStr;
        renderCalendar();
        renderTimeSlots();
        return false;
      }
      if (!selectedTimeSlot) {
        if (selectedDate === todayStr) {
          showToast('No hay horarios disponibles para hoy. Por favor, selecciona una fecha posterior en el calendario.', 'warning');
        } else {
          showToast('Por favor selecciona un horario de atención disponible para continuar.', 'warning');
        }
        return false;
      }
      return true;
    }

    if (step === 3) {
      const patId = idInput ? idInput.value.trim() : '';
      const patName = nameInput ? nameInput.value.trim() : '';
      const patPhone = phoneInput ? phoneInput.value.trim() : '';
      const patEmail = emailInput ? emailInput.value.trim() : '';

      let firstErrorInput = null;

      // 1. Cédula: Algoritmo Módulo 10 y 10 dígitos numéricos enteros positivos
      const idCheck = validarCedulaEcuatorianaDetallada(patId);
      if (!idCheck.isValid) {
        showFieldError(idInput, idCheck.message);
        if (!firstErrorInput) firstErrorInput = idInput;
      } else {
        clearFieldError(idInput);
        idInput.classList.add('valid');
      }

      // 2. Nombre y Apellido completo: exigir al menos un nombre y un apellido (mínimo 2 palabras válidas)
      const nameCheck = validarNombreCompletoDetallado(patName);
      if (!nameCheck.isValid) {
        showFieldError(nameInput, nameCheck.message);
        if (!firstErrorInput) firstErrorInput = nameInput;
      } else {
        clearFieldError(nameInput);
        nameInput.classList.add('valid');
      }

      // 3. Celular: 10 dígitos enteros empezando con 09, sin negativos ni signos
      const phoneCheck = validarCelularDetallado(patPhone);
      if (!phoneCheck.isValid) {
        showFieldError(phoneInput, phoneCheck.message);
        if (!firstErrorInput) firstErrorInput = phoneInput;
      } else {
        clearFieldError(phoneInput);
        phoneInput.classList.add('valid');
      }

      // 4. Correo electrónico: formato estándar (ej: nombre@gmail.com, nombre@hotmail.com)
      const emailCheck = validarEmailDetallado(patEmail);
      if (!emailCheck.isValid) {
        showFieldError(emailInput, emailCheck.message);
        if (!firstErrorInput) firstErrorInput = emailInput;
      } else {
        clearFieldError(emailInput);
        emailInput.classList.add('valid');
      }

      if (firstErrorInput) {
        firstErrorInput.focus();
        showToast('Datos incorrectos o incompletos: corrige los campos marcados en rojo para poder continuar.', 'warning');
        return false;
      }

      return true;
    }

    return true;
  }

  // --- PASO 4: Generar Ticket y Código QR Dinámico (Página 3) ---
  function renderConfirmationTicket(appointment) {
    const clinic = CLINICS[appointment.clinicId];
    const ticketCodeEl = document.getElementById('ticket-code-display');
    const ticketPatient = document.getElementById('ticket-patient-name');
    const ticketId = document.getElementById('ticket-patient-id');
    const ticketSede = document.getElementById('ticket-clinic-display');
    const ticketDate = document.getElementById('ticket-datetime-display');
    const ticketTotal = document.getElementById('ticket-total-display');
    const ticketMethod = document.getElementById('ticket-method-display');

    if (ticketCodeEl) ticketCodeEl.textContent = `#${appointment.code}`;
    if (ticketPatient) ticketPatient.textContent = appointment.patientName;
    if (ticketId) ticketId.textContent = appointment.patientId;
    if (ticketSede) ticketSede.textContent = `${clinic.name} (${clinic.consultorio})`;
    if (ticketDate) ticketDate.textContent = `${appointment.date} - ${appointment.time}`;
    if (ticketTotal) ticketTotal.textContent = `$${appointment.totalPaid.toFixed(2)}`;
    if (ticketMethod) {
      const isCard = (appointment.paymentMethod === 'card' || appointment.paymentMethod === 'tarjeta');
      const isTransfer = (appointment.paymentMethod === 'transfer' || appointment.paymentMethod === 'transferencia');
      ticketMethod.textContent = isCard
        ? 'Tarjeta de Crédito / Débito (Pasarela Datafast - $21.95)'
        : (isTransfer ? 'Transferencia Bancaria Directa ($20.00)' : 'Efectivo en Recepción ($20.00)');
    }

    // Generar Código QR Oficial de Alta Definición que abre el Comprobante PDF de la Cita Médica
    const qrSection = document.getElementById("ticket-qr-container") || document.querySelector(".qr-code-display-box") || document.querySelector(".ticket-qr-section");
    if (qrSection) {
      const BASE_URL = 'https://pedritojuancarlos82-lang.github.io/Proyecto-Cita-Medica';

      // Parámetros compactos para que el código QR tenga módulos grandes y legibles en cualquier cámara de celular
      const params = new URLSearchParams({
        c: appointment.code,
        p: appointment.patientName,
        id: appointment.patientId,
        s: clinic.name,
        f: appointment.date,
        h: appointment.time,
        tot: appointment.totalPaid.toFixed(2),
        m: appointment.paymentMethod
      });
      if (appointment.tokenSeguro) {
        params.set('t', appointment.tokenSeguro);
        params.set('token', appointment.tokenSeguro);
      }

      const pdfUrl = `${BASE_URL}/comprobante.html?${params.toString()}`;
      const localPdfUrl = `comprobante.html?${params.toString()}`;

      qrSection.innerHTML = `
        <div style="background: #ffffff; padding: 12px; border-radius: 14px; display: inline-flex; flex-direction: column; justify-content: center; align-items: center; margin: 0 auto; border: 2px solid #0284c7; box-shadow: 0 4px 16px rgba(2, 132, 199, 0.15);">
          <div id="ticket-qr-canvas-box" style="display: flex; justify-content: center; align-items: center; min-width: 220px; min-height: 220px;"></div>
          <span style="font-size: 0.76rem; font-weight: 800; color: #0284c7; background: #e0f2fe; padding: 4px 12px; border-radius: 9999px; margin-top: 8px;">
            📱 Escanea con tu celular para abrir tu PDF
          </span>
          <span style="font-size: 0.70rem; font-weight: 700; color: #059669; background: #ecfdf5; padding: 3px 10px; border-radius: 9999px; margin-top: 6px; border: 1px solid #a7f3d0; display: inline-flex; align-items: center; gap: 4px;">
            ✓ Token Criptográfico Firmado (Inmutable)
          </span>
        </div>
      `;

      // Renderizar inmediatamente en Canvas de ultra-alta definición con nivel L para módulos gruesos y nítidos
      setTimeout(() => {
        renderizarCodigoQR('ticket-qr-canvas-box', pdfUrl, {
          size: 220,
          correctLevel: (typeof QRCode !== 'undefined' && QRCode.CorrectLevel) ? QRCode.CorrectLevel.L : null
        });
      }, 50);

      // Actualizar botones de acción del ticket para acceso directo al PDF
      const actionsGroup = document.querySelector('.ticket-actions-group');
      if (actionsGroup) {
        actionsGroup.innerHTML = `
          <a href="${localPdfUrl}" target="_blank" class="btn-primary" id="btn-open-pdf-ticket" style="display: inline-flex; align-items: center; justify-content: center; gap: 8px; text-decoration: none; padding: 12px 20px; font-weight: 700; font-size: 0.88rem; border-radius: 9999px; box-shadow: 0 4px 14px rgba(2, 132, 199, 0.35); flex: 1;">
            📄 Ver / Descargar Documento PDF
          </a>
          <button type="button" class="btn-secondary" id="btn-print-ticket" style="padding: 12px 18px; border-radius: 9999px;">
            🖨️ Imprimir
          </button>
        `;
        const newPrintBtn = document.getElementById('btn-print-ticket');
        if (newPrintBtn) {
          newPrintBtn.addEventListener('click', () => window.print());
        }
      }
    }
  }

  // Botón Imprimir Comprobante PDF (Página 3)
  const btnPrintTicket = document.getElementById('btn-print-ticket');
  if (btnPrintTicket) {
    btnPrintTicket.addEventListener('click', () => {
      window.print();
    });
  }

  // Botón Ver en Mis Citas desde el ticket
  const btnViewInMisCitas = document.getElementById('btn-view-in-mis-citas');
  if (btnViewInMisCitas) {
    btnViewInMisCitas.addEventListener('click', () => {
      switchPatientTab('mis-citas');
    });
  }

  // Botón Anterior
  if (btnPrev) {
    btnPrev.addEventListener('click', () => {
      if (currentStep > 1) {
        currentStep--;
        updateStepView();
      }
    });
  }

  // --- MÓDULO DE AUTENTICACIÓN Y RESIDUAL DE CITA (GUEST WIZARD + AUTH WALL) ---
  async function confirmAndCreateAppointment(patientUser) {
    if (!patientUser) {
      showToast('No se detectó un usuario autenticado para confirmar la cita.', 'warning');
      return;
    }

    // 1. Recuperar borrador de la cita desde el almacenamiento temporal (sessionStorage)
    let pending = null;
    try {
      const raw = sessionStorage.getItem('montepiedra_pending_booking');
      if (raw) pending = JSON.parse(raw);
    } catch (e) {}

    if (pending) {
      if (pending.clinicId) selectedClinicId = pending.clinicId;
      if (pending.serviceId) selectedServiceId = pending.serviceId;
      if (pending.date) selectedDate = pending.date;
      if (pending.time) selectedTimeSlot = pending.time;
      if (pending.paymentMethod) selectedPaymentMethod = pending.paymentMethod;
    }

    // 2. Verificación de colisión local instantánea (0ms)
    try {
      const localApts = (store.getState ? store.getState().appointments : store.appointments) || [];
      const cid = (selectedClinicId === 'hospital_ceibos') ? 'hospital' : selectedClinicId;
      const isLocalCollision = localApts.some(a => {
        const aCid = a.clinicId || a.clinic_id;
        const matchesClinic = (aCid === selectedClinicId || aCid === cid);
        const st = (a.status || '').toLowerCase();
        const isActive = !['cancelada', 'cancelled'].includes(st);
        return a.date === selectedDate && a.time === selectedTimeSlot && matchesClinic && isActive;
      });
      if (isLocalCollision) {
        showToast('Este horario ya está reservado. Por favor selecciona otro turno.', 'danger');
        renderTimeSlots();
        return;
      }
    } catch (e) {}

    // 3. Asociar la cita al identificador del paciente priorizando los datos del formulario
    const patId = (idInput && idInput.value.trim()) || (pending && pending.tempId) || patientUser.idNumber || patientUser.cedula || patientUser.username || '';
    const patName = (nameInput && nameInput.value.trim()) || (pending && pending.tempName) || patientUser.name || 'Paciente';
    const patPhone = (phoneInput && phoneInput.value.trim()) || (pending && pending.tempPhone) || patientUser.phone || '';
    const patEmail = (emailInput && emailInput.value.trim()) || (pending && pending.tempEmail) || patientUser.email || '';
    const reasonInput = document.getElementById('pat-input-reason');
    const patReason = (reasonInput && reasonInput.value.trim()) || (pending && pending.reason) || 'Consulta médica general';

    // Guardar ficha básica del paciente
    MedicalService.guardarFicha({
      cedula: patId,
      nombreCompleto: patName,
      telefono: patPhone,
      email: patEmail
    });

    const clinic = CLINICS[selectedClinicId] || CLINICS.ceibos;
    const isHospital = (selectedClinicId === 'hospital' || selectedClinicId === 'hospital_ceibos');
    const baseFee = isHospital ? 0.00 : 20.00;

    const isCard = (selectedPaymentMethod === 'card' || selectedPaymentMethod === 'tarjeta');
    const isTransfer = (selectedPaymentMethod === 'transfer' || selectedPaymentMethod === 'transferencia');
    const normPaymentMethod = isCard ? 'card' : (isTransfer ? 'transfer' : 'cash');

    const processingFee = isCard ? 1.95 : 0.00;
    const totalAmount = isCard ? 21.95 : baseFee;
    const retentionRate = (clinic.retentionRate !== undefined) ? Number(clinic.retentionRate) : (isHospital ? 0.00 : 0.05);
    const retentionAmount = isHospital ? 0.00 : +(baseFee * retentionRate).toFixed(2);
    const netClinicYield = isHospital ? 0.00 : +(baseFee - retentionAmount).toFixed(2);

    const aptId = `APT-${Date.now().toString(36).toUpperCase()}`;
    const aptCode = `MED-${Math.floor(10000 + Math.random() * 90000)}`;

    // Generar Token Criptográfico Firmado (HMAC-SHA256)
    let tokenSeguro = null;
    if (typeof QRTokenService !== 'undefined') {
      tokenSeguro = QRTokenService.generarTokenSeguro(
        aptId,
        aptCode,
        selectedDate,
        selectedTimeSlot,
        selectedClinicId
      );
    }

    const appointmentPayload = {
      id: aptId,
      code: aptCode,
      clinicId: selectedClinicId,
      clinic_id: selectedClinicId,
      serviceId: selectedServiceId || 'CG-01',
      serviceName: 'Consulta Médica General',
      doctorId: 'dr_campoverde',
      doctor_id: 'dr_campoverde',
      date: selectedDate,
      time: selectedTimeSlot,
      patientId: patId,
      patient_id: patId,
      patientCedula: patId,
      patient_cedula: patId,
      patientName: patName,
      patient_name: patName,
      patientPhone: patPhone,
      patient_phone: patPhone,
      patientEmail: patEmail,
      patient_email: patEmail,
      reason: patReason,
      paymentMethod: normPaymentMethod,
      payment_method: normPaymentMethod,
      baseFee: baseFee,
      base_fee: baseFee,
      basePrice: baseFee,
      base_price: baseFee,
      processingFee: processingFee,
      processing_fee: processingFee,
      feeAmount: processingFee,
      fee_amount: processingFee,
      feePercentage: isCard ? 0.0975 : 0.0000,
      fee_percentage: isCard ? 0.0975 : 0.0000,
      totalPaid: totalAmount,
      total_paid: totalAmount,
      retentionRate: retentionRate,
      retention_rate: retentionRate,
      retentionAmount: retentionAmount,
      retention_amount: retentionAmount,
      netClinicYield: netClinicYield,
      net_clinic_yield: netClinicYield,
      tokenSeguro: tokenSeguro,
      status: 'confirmed',
      estado: 'CONFIRMADA'
    };

    // 4. Crear la cita en el estado central INMEDIATAMENTE (0ms)
    createdAppointment = store.addAppointment(appointmentPayload);

    // Sincronizar el usuario activo de la sesión con los datos ingresados
    const currentU = store.getCurrentUser() || {};
    const updatedUser = {
      ...currentU,
      role: 'paciente',
      idNumber: patId,
      cedula: patId,
      name: patName,
      phone: patPhone,
      email: patEmail
    };
    store.setCurrentUser(updatedUser);
    if (typeof authService !== 'undefined' && authService.setCurrentUser) {
      authService.setCurrentUser(updatedUser);
    }

    // Liberar hold temporal tras confirmación formal
    if (typeof SlotHoldManager !== 'undefined') {
      SlotHoldManager.liberarHold();
    }

    MedicalService.registrarAtencionEnHistorial(patId, createdAppointment);

    // Limpiar reserva temporal de sessionStorage
    sessionStorage.removeItem('montepiedra_pending_booking');

    // 5. Renderizar ticket y avanzar a Paso 4 AL INSTANTE
    renderConfirmationTicket(createdAppointment);
    renderPatientSummary();
    renderPatientAppointmentsTable();
    currentStep = 4;
    updateStepView();

    showToast(`¡Cita agendada con éxito para ${patName}! Se emitió tu ticket oficial con QR.`, 'success');

    // 6. Persistencia asíncrona en segundo plano sin pausar la interfaz
    const sbClient = (typeof SupabaseDB !== 'undefined') ? SupabaseDB : (window.SupabaseDB || null);
    if (sbClient && sbClient.saveAppointment) {
      Promise.race([
        sbClient.saveAppointment(appointmentPayload),
        new Promise((_, reject) => setTimeout(() => reject('timeout'), 1500))
      ]).catch(() => {});
    }

    if (typeof EmailService !== 'undefined' && EmailService.sendBookingConfirmation) {
      EmailService.sendBookingConfirmation(createdAppointment, showToast);
    }
  }

  // Exponer para integración con onboarding post-registro
  if (typeof window !== 'undefined') {
    window.confirmAndCreateAppointment = confirmAndCreateAppointment;
    window.addEventListener('montepiedra:confirmPendingBooking', (e) => {
      if (e.detail && e.detail.user) {
        confirmAndCreateAppointment(e.detail.user);
      }
    });
  }

  function openWizardAuthGate(pendingBooking) {
    const modal = document.getElementById('modal-wizard-auth-gate');
    if (!modal) return;

    const chipDetails = document.getElementById('auth-gate-chip-details');
    const chipPrice = document.getElementById('auth-gate-chip-price');
    const btnTabLogin = document.getElementById('btn-tab-auth-login');
    const btnTabRegister = document.getElementById('btn-tab-auth-register');
    const paneLogin = document.getElementById('auth-gate-pane-login');
    const paneRegister = document.getElementById('auth-gate-pane-register');
    const btnClose = document.getElementById('btn-close-auth-gate-modal');

    const formLogin = document.getElementById('form-gate-login');
    const loginUserInput = document.getElementById('gate-login-user');
    const loginPassInput = document.getElementById('gate-login-pass');
    const btnTogglePass = document.getElementById('btn-gate-toggle-login-pass');
    const btnDemoFill = document.getElementById('btn-gate-demo-fill');

    const formRegister = document.getElementById('form-gate-register');
    const regNameInput = document.getElementById('gate-reg-name');
    const regIdInput = document.getElementById('gate-reg-id');
    const regPhoneInput = document.getElementById('gate-reg-phone');
    const regEmailInput = document.getElementById('gate-reg-email');
    const regPassInput = document.getElementById('gate-reg-password');

    // Resumen en el chip
    const clinic = CLINICS[pendingBooking.clinicId] || CLINICS.ceibos;
    const catalogo = MedicalService.getCatalogo();
    const service = catalogo.find(s => s.id === pendingBooking.serviceId) || catalogo[0];
    const isHospital = pendingBooking.clinicId === 'hospital';
    const realCost = isHospital ? 0 : (service.costoReal || service.precioBase || clinic.realCost || 20.00);
    const listPrice = isHospital ? 0 : (service.precioLista || clinic.listPrice || +(realCost * 1.0975).toFixed(2));
    const totalAmount = (pendingBooking.paymentMethod === 'tarjeta') ? listPrice : realCost;

    if (chipDetails) {
      chipDetails.textContent = `${clinic.name} • ${pendingBooking.date} a las ${pendingBooking.time}`;
    }
    if (chipPrice) {
      chipPrice.textContent = `$${totalAmount.toFixed(2)}`;
    }

    // Prellenar con los datos que el usuario ya ingresó en el Paso 3
    if (pendingBooking.tempEmail || pendingBooking.tempId) {
      if (loginUserInput) loginUserInput.value = pendingBooking.tempEmail || pendingBooking.tempId;
    }
    if (pendingBooking.tempName && regNameInput) regNameInput.value = pendingBooking.tempName;
    if (pendingBooking.tempId && regIdInput) regIdInput.value = pendingBooking.tempId;
    if (pendingBooking.tempPhone && regPhoneInput) regPhoneInput.value = pendingBooking.tempPhone;
    if (pendingBooking.tempEmail && regEmailInput) regEmailInput.value = pendingBooking.tempEmail;

    // Función para cambiar de pestaña
    function setTab(tab) {
      if (tab === 'login') {
        if (btnTabLogin) {
          btnTabLogin.classList.add('active');
          btnTabLogin.style.background = '#ffffff';
          btnTabLogin.style.color = '#0f172a';
          btnTabLogin.style.boxShadow = '0 2px 6px rgba(15,23,42,0.08)';
        }
        if (btnTabRegister) {
          btnTabRegister.classList.remove('active');
          btnTabRegister.style.background = 'transparent';
          btnTabRegister.style.color = '#64748b';
          btnTabRegister.style.boxShadow = 'none';
        }
        if (paneLogin) paneLogin.style.display = 'block';
        if (paneRegister) paneRegister.style.display = 'none';
      } else {
        if (btnTabRegister) {
          btnTabRegister.classList.add('active');
          btnTabRegister.style.background = '#ffffff';
          btnTabRegister.style.color = '#0f172a';
          btnTabRegister.style.boxShadow = '0 2px 6px rgba(15,23,42,0.08)';
        }
        if (btnTabLogin) {
          btnTabLogin.classList.remove('active');
          btnTabLogin.style.background = 'transparent';
          btnTabLogin.style.color = '#64748b';
          btnTabLogin.style.boxShadow = 'none';
        }
        if (paneLogin) paneLogin.style.display = 'none';
        if (paneRegister) paneRegister.style.display = 'block';
      }
    }

    if (btnTabLogin) {
      btnTabLogin.onclick = () => setTab('login');
    }
    if (btnTabRegister) {
      btnTabRegister.onclick = () => setTab('register');
    }

    // Toggle password
    if (btnTogglePass && loginPassInput) {
      btnTogglePass.onclick = () => {
        const isPass = loginPassInput.type === 'password';
        loginPassInput.type = isPass ? 'text' : 'password';
        btnTogglePass.textContent = isPass ? '🙈' : '👁️';
      };
    }

    // Botón Autofill Demo (Carlos Mendoza)
    if (btnDemoFill) {
      btnDemoFill.onclick = () => {
        if (loginUserInput) loginUserInput.value = '0987654321';
        if (loginPassInput) loginPassInput.value = 'paciente123';
        if (formLogin) {
          formLogin.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        }
      };
    }

    // Cerrar modal
    if (btnClose) {
      btnClose.onclick = () => {
        modal.classList.remove('active');
      };
    }

    // Envío del Login en el Gate
    if (formLogin) {
      formLogin.onsubmit = async (e) => {
        e.preventDefault();
        const userVal = loginUserInput ? loginUserInput.value.trim() : '';
        const passVal = loginPassInput ? loginPassInput.value.trim() : '';

        const auth = (typeof authService !== 'undefined') ? authService : (window.authService || null);
        if (!auth) {
          showToast('Servicio de autenticación no disponible temporalmente.', 'danger');
          return;
        }

        const res = await auth.login(userVal, passVal);
        if (res.success && res.user) {
          modal.classList.remove('active');
          showToast(`¡Sesión iniciada con éxito! Bienvenido(a), ${res.user.name}.`, 'success');
          await confirmAndCreateAppointment(res.user);
        } else {
          showToast(res.error || 'Credenciales inválidas. Por favor verifique.', 'danger');
        }
      };
    }

    // Aplicar máscaras reactivas a los inputs del modal de registro
    if (regIdInput && !regIdInput.dataset.maskApplied) {
      regIdInput.dataset.maskApplied = 'true';
      regIdInput.setAttribute('maxlength', '10');
      regIdInput.setAttribute('inputmode', 'numeric');
      regIdInput.addEventListener('input', function() {
        this.value = this.value.replace(/\D/g, '').substring(0, 10);
      });
      regIdInput.addEventListener('blur', function() {
        if (this.value.length > 0) {
          const check = validarCedulaEcuatorianaDetallada(this.value);
          if (!check.isValid) {
            showToast(check.message, 'warning');
          }
        }
      });
    }

    if (regPhoneInput && !regPhoneInput.dataset.maskApplied) {
      regPhoneInput.dataset.maskApplied = 'true';
      regPhoneInput.setAttribute('maxlength', '10');
      regPhoneInput.setAttribute('inputmode', 'numeric');
      regPhoneInput.addEventListener('input', function() {
        this.value = this.value.replace(/\D/g, '').substring(0, 10);
      });
      regPhoneInput.addEventListener('blur', function() {
        if (this.value.length > 0) {
          const check = validarCelularDetallado(this.value);
          if (!check.isValid) {
            showToast(check.message, 'warning');
          }
        }
      });
    }

    if (regNameInput && !regNameInput.dataset.maskApplied) {
      regNameInput.dataset.maskApplied = 'true';
      regNameInput.setAttribute('maxlength', '70');
      regNameInput.addEventListener('input', function() {
        this.value = this.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
      });
      regNameInput.addEventListener('blur', function() {
        if (this.value.length > 0) {
          const check = validarNombreCompletoDetallado(this.value);
          if (!check.isValid) {
            showToast(check.message, 'warning');
          }
        }
      });
    }

    // Toggle visibilidad de contraseña en el gate
    const btnToggleGatePass = document.getElementById('btn-gate-toggle-reg-pass');
    if (btnToggleGatePass && regPassInput) {
      const eyeOpenSvg = `<svg class="eye-svg eye-open" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
      const eyeClosedSvg = `<svg class="eye-svg eye-slashed" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path><line x1="2" y1="2" x2="22" y2="22"></line></svg>`;

      btnToggleGatePass.onclick = () => {
        const isPass = regPassInput.type === 'password';
        regPassInput.type = isPass ? 'text' : 'password';
        btnToggleGatePass.innerHTML = isPass ? eyeOpenSvg : eyeClosedSvg;
      };
    }

    // Medidor de fortaleza de contraseña en el gate
    const gateStrengthSegs = [1, 2, 3, 4].map(i => document.getElementById(`gate-strength-seg-${i}`));
    const gateStrengthText = document.getElementById('gate-strength-text');
    if (regPassInput && !regPassInput.dataset.listenerBound) {
      regPassInput.dataset.listenerBound = 'true';
      regPassInput.addEventListener('input', function() {
        const val = this.value;
        const len = val.length;
        const hasNumber = /\d/.test(val);
        const hasUpper = /[A-Z]/.test(val);
        const hasLower = /[a-z]/.test(val);
        const hasSymbol = /[^a-zA-Z0-9]/.test(val);

        let level = 0, text = 'Sin ingresar', color = '#94a3b8';
        if (len >= 8 && hasUpper && hasLower && hasNumber && hasSymbol) {
          level = 4; text = 'Fuerte / Segura'; color = '#10b981';
        } else if (len >= 8 && hasNumber && hasUpper) {
          level = 3; text = 'Aceptable'; color = '#84cc16';
        } else if (len >= 6 && hasNumber) {
          level = 2; text = 'Débil'; color = '#f59e0b';
        } else if (len > 0) {
          level = 1; text = 'Muy débil'; color = '#ef4444';
        }

        if (gateStrengthText) {
          gateStrengthText.textContent = text;
          gateStrengthText.style.color = color;
        }
        gateStrengthSegs.forEach((seg, idx) => {
          if (seg) seg.style.background = (idx < level) ? color : '#e2e8f0';
        });
      });
    }

    // Envío del Registro en el Gate
    if (formRegister) {
      formRegister.onsubmit = async (e) => {
        e.preventDefault();
        const nameVal = regNameInput ? regNameInput.value.trim() : '';
        const idVal = regIdInput ? regIdInput.value.trim() : '';
        const phoneVal = regPhoneInput ? regPhoneInput.value.trim() : '';
        const emailVal = regEmailInput ? regEmailInput.value.trim() : '';
        const passVal = regPassInput ? regPassInput.value.trim() : '';

        // 1. Validar Nombre y Apellido completo (mínimo 2 palabras, sin números ni símbolos)
        const nameCheck = validarNombreCompletoDetallado(nameVal);
        if (!nameCheck.isValid) {
          showToast(nameCheck.message, 'warning');
          if (regNameInput) regNameInput.focus();
          return;
        }

        // 2. Validar Cédula Ecuatoriana (Módulo 10)
        const cedCheck = validarCedulaEcuatorianaDetallada(idVal);
        if (!cedCheck.isValid) {
          showToast(cedCheck.message, 'danger');
          if (regIdInput) regIdInput.focus();
          return;
        }

        // 3. Validar Teléfono Celular (10 dígitos iniciando con 09)
        const phoneCheck = validarCelularDetallado(phoneVal);
        if (!phoneCheck.isValid) {
          showToast(phoneCheck.message, 'warning');
          if (regPhoneInput) regPhoneInput.focus();
          return;
        }

        // 4. Validar Correo Electrónico (norma RFC 5322)
        const emailCheck = validarEmailDetallado(emailVal);
        if (!emailCheck.isValid) {
          showToast(emailCheck.message, 'warning');
          if (regEmailInput) regEmailInput.focus();
          return;
        }

        // 5. Validar Contraseña
        if (passVal.length < 4) {
          showToast('La clave de acceso debe contener al menos 4 caracteres.', 'warning');
          if (regPassInput) regPassInput.focus();
          return;
        }

        const auth = (typeof authService !== 'undefined') ? authService : (window.authService || null);
        if (!auth) {
          showToast('Servicio de autenticación no disponible temporalmente.', 'danger');
          return;
        }

        const res = await auth.registerPatient({
          name: nameVal,
          idNumber: idVal,
          phone: phoneVal,
          email: emailVal,
          password: passVal
        });

        if (res.success && res.user) {
          modal.classList.remove('active');
          showToast(`¡Cuenta creada con éxito! Bienvenido(a), ${res.user.name}.`, 'success');
          await confirmAndCreateAppointment(res.user);
        } else {
          showToast(res.error || 'Error al registrar la cuenta. Verifique los campos.', 'danger');
        }
      };
    }

    // Abrir modal
    modal.classList.add('active');
    setTab('login');
  }

  // Botón Siguiente / Confirmar con Bloqueo Estricto de Datos
  if (btnNext) {
    btnNext.addEventListener('click', async () => {
      if (currentStep === 1) {
        if (!validateStepData(1)) return;
        currentStep = 2;
        // Refrescar fecha de hoy en el calendario
        selectedDate = getTodayDateStr();
        renderCalendar();
        renderTimeSlots();
        updateSummaryCard();
        updateStepView();
      } else if (currentStep === 2) {
        if (!validateStepData(2)) return;
        prefillPatientData();
        updateSummaryCard();
        currentStep = 3;
        updateStepView();
      } else if (currentStep === 3) {
        // Validar datos ingresados en el Paso 3
        if (!validateStepData(3)) return;

        const currentUser = (typeof authService !== 'undefined' && authService.getCurrentUser)
          ? authService.getCurrentUser()
          : store.getCurrentUser();

        const userToUse = (currentUser && currentUser.role === 'paciente')
          ? currentUser
          : {
              role: 'paciente',
              name: (nameInput && nameInput.value.trim()) || 'Paciente',
              idNumber: (idInput && idInput.value.trim()) || '',
              email: (emailInput && emailInput.value.trim()) || '',
              phone: (phoneInput && phoneInput.value.trim()) || ''
            };

        // Procesar según el método de pago seleccionado:
        // - Transferencia Bancaria: abre ventana, envía correo con datos de cuenta y cédula, luego entrega ticket
        // - Tarjeta de Crédito: abre ventana, pide datos y valida con algoritmos (Luhn, etc.), luego entrega ticket
        // - Efectivo: genera y entrega el ticket directamente
        if (selectedPaymentMethod === 'transfer' || selectedPaymentMethod === 'card') {
          openPaymentCheckoutModal(userToUse);
        } else {
          await confirmAndCreateAppointment(userToUse);
        }
      } else if (currentStep === 4) {
        // Reiniciar flujo para nueva cita con la fecha de hoy y campos limpios
        selectedDate = getTodayDateStr();
        clearTicketFormInputs();
        currentStep = 1;
        renderCalendar();
        updateStepView();
      }
    });
  }

  // --- MODAL DE CHECKOUT Y PASARELA DE PAGO (Transferencia y Tarjeta de Crédito) ---
  function openPaymentCheckoutModal(userToUse) {
    const modal = document.getElementById('modal-payment-checkout');
    if (!modal) {
      confirmAndCreateAppointment(userToUse);
      return;
    }

    const viewTransfer = document.getElementById('payment-view-transfer');
    const viewCard = document.getElementById('payment-view-card');
    const modalTitle = document.getElementById('payment-modal-title');
    const modalSubtitle = document.getElementById('payment-modal-subtitle');
    const modalIcon = document.getElementById('payment-modal-icon');
    const btnCloseModal = document.getElementById('btn-close-payment-modal');

    // Cerrar modal al hacer clic en X
    const closeModal = () => {
      modal.classList.remove('active');
    };
    if (btnCloseModal) {
      btnCloseModal.onclick = closeModal;
    }

    const isTransfer = (selectedPaymentMethod === 'transfer' || selectedPaymentMethod === 'transferencia');
    const isCard = (selectedPaymentMethod === 'card' || selectedPaymentMethod === 'tarjeta');

    if (isTransfer) {
      // ==========================================
      // VISTA DE TRANSFERENCIA BANCARIA DIRECTA
      // ==========================================
      if (viewTransfer) viewTransfer.style.display = 'block';
      if (viewCard) viewCard.style.display = 'none';

      if (modalTitle) modalTitle.textContent = 'Transferencia Bancaria Directa';
      if (modalSubtitle) modalSubtitle.textContent = 'Montepiedra Salud • 0% Comisión Pasarela (Ahorras $1.95)';
      if (modalIcon) modalIcon.textContent = '🏦';

      const emailDisplay = document.getElementById('transfer-sent-email-display');
      const cedulaDisplay = document.getElementById('transfer-cedula-ref');
      const amountDisplay = document.getElementById('transfer-amount-display');

      const patEmail = userToUse.email || (emailInput ? emailInput.value.trim() : '') || 'paciente@montepiedrasalud.ec';
      const patCedula = userToUse.idNumber || userToUse.cedula || (idInput ? idInput.value.trim() : '') || '0987654321';

      if (emailDisplay) emailDisplay.textContent = patEmail;
      if (cedulaDisplay) cedulaDisplay.textContent = patCedula;
      if (amountDisplay) amountDisplay.textContent = '$20.00';

      // 1. Enviar correo electrónico con número de cédula, número de cuenta y banco (datos ficticios demo)
      if (typeof EmailService !== 'undefined' && EmailService.sendBankTransferEmail) {
        EmailService.sendBankTransferEmail({
          patientEmail: patEmail,
          patientName: userToUse.name,
          patientId: patCedula,
          totalPaid: 20.00,
          date: selectedDate,
          time: selectedTimeSlot
        }, showToast);
      }

      // Botón Copiar Cuenta Bancaria
      const btnCopy = document.getElementById('btn-copy-bank-account');
      if (btnCopy) {
        btnCopy.onclick = () => {
          navigator.clipboard.writeText('2100849201').then(() => {
            btnCopy.textContent = '¡Copiado!';
            setTimeout(() => { btnCopy.textContent = 'Copiar'; }, 2000);
          }).catch(() => {
            btnCopy.textContent = '¡Copiado!';
          });
        };
      }

      // Botón Volver
      const btnCancel = document.getElementById('btn-cancel-transfer-payment');
      if (btnCancel) {
        btnCancel.onclick = closeModal;
      }

      // Botón Confirmar y Recibir Ticket
      const btnConfirm = document.getElementById('btn-confirm-transfer-payment');
      if (btnConfirm) {
        btnConfirm.onclick = async () => {
          closeModal();
          await confirmAndCreateAppointment(userToUse);
        };
      }

      modal.classList.add('active');

    } else if (isCard) {
      // ==========================================
      // VISTA DE TARJETA DE CRÉDITO
      // ==========================================
      if (viewTransfer) viewTransfer.style.display = 'none';
      if (viewCard) viewCard.style.display = 'block';

      if (modalTitle) modalTitle.textContent = 'Pago Seguro con Tarjeta de Crédito';
      if (modalSubtitle) modalSubtitle.textContent = 'Pasarela Datafast • Recargo financiero legal 9.75%';
      if (modalIcon) modalIcon.textContent = '💳';

      const ccNumberInput = document.getElementById('cc-input-number');
      const ccNameInput = document.getElementById('cc-input-name');
      const ccExpiryInput = document.getElementById('cc-input-expiry');
      const ccCvvInput = document.getElementById('cc-input-cvv');
      const formCard = document.getElementById('form-credit-card-checkout');

      const cardPreviewNumber = document.getElementById('card-preview-number');
      const cardPreviewName = document.getElementById('card-preview-name');
      const cardPreviewExpiry = document.getElementById('card-preview-expiry');
      const cardBrandBadge = document.getElementById('card-brand-badge');
      const cardPreviewBox = document.getElementById('interactive-card-preview');
      const brandIndicator = document.getElementById('cc-brand-indicator');

      const ccErrorNumber = document.getElementById('cc-error-number');
      const ccErrorName = document.getElementById('cc-error-name');
      const ccErrorExpiry = document.getElementById('cc-error-expiry');
      const ccErrorCvv = document.getElementById('cc-error-cvv');

      const clearCardErrors = () => {
        [ccErrorNumber, ccErrorName, ccErrorExpiry, ccErrorCvv].forEach(errEl => {
          if (errEl) {
            errEl.textContent = '';
            errEl.classList.remove('visible');
          }
        });
        [ccNumberInput, ccNameInput, ccExpiryInput, ccCvvInput].forEach(inp => {
          if (inp) inp.classList.remove('error');
        });
      };

      const setCardFieldError = (inp, errEl, msg) => {
        if (inp) {
          inp.classList.add('error');
          inp.classList.remove('valid');
        }
        if (errEl) {
          errEl.textContent = msg;
          errEl.classList.add('visible');
        }
      };

      const setCardFieldValid = (inp, errEl) => {
        if (inp) {
          inp.classList.remove('error');
          inp.classList.add('valid');
        }
        if (errEl) {
          errEl.textContent = '';
          errEl.classList.remove('visible');
        }
      };

      // Reset inicial del formulario
      clearCardErrors();
      if (ccNumberInput) ccNumberInput.value = '';
      if (ccNameInput) ccNameInput.value = (userToUse.name && userToUse.name !== 'Paciente') ? userToUse.name.toUpperCase() : '';
      if (ccExpiryInput) ccExpiryInput.value = '';
      if (ccCvvInput) ccCvvInput.value = '';

      if (cardPreviewNumber) cardPreviewNumber.textContent = '•••• •••• •••• ••••';
      if (cardPreviewName) cardPreviewName.textContent = ccNameInput.value || 'NOMBRE DEL TITULAR';
      if (cardPreviewExpiry) cardPreviewExpiry.textContent = 'MM/AA';
      if (cardBrandBadge) cardBrandBadge.textContent = 'VISA / MC';
      if (cardPreviewBox) cardPreviewBox.className = 'interactive-credit-card-box';
      if (brandIndicator) brandIndicator.textContent = 'Algoritmo Luhn (Módulo 10)';

      let detectedBrand = 'generic';

      // 1. Formateo y validación de Número de Tarjeta
      if (ccNumberInput && !ccNumberInput.dataset.listenersBound) {
        ccNumberInput.dataset.listenersBound = 'true';
        ccNumberInput.addEventListener('input', (e) => {
          let val = e.target.value.replace(/\D/g, '').substring(0, 16);
          const brandInfo = detectarMarcaTarjeta(val);
          detectedBrand = brandInfo.brand;

          // Formateo visual en bloques de 4 dígitos
          const formatted = val.match(/.{1,4}/g)?.join(' ') || val;
          e.target.value = formatted;

          // Reflejar en la tarjeta plástica
          if (cardPreviewNumber) {
            cardPreviewNumber.textContent = formatted || '•••• •••• •••• ••••';
          }
          if (cardBrandBadge) {
            cardBrandBadge.textContent = brandInfo.name.toUpperCase();
          }
          if (brandIndicator) {
            brandIndicator.textContent = `${brandInfo.name} • Algoritmo Luhn`;
          }
          if (cardPreviewBox) {
            cardPreviewBox.className = `interactive-credit-card-box brand-${detectedBrand}`;
          }

          if (val.length >= 13) {
            const luhnCheck = validarTarjetaLuhn(val);
            if (luhnCheck.isValid) {
              setCardFieldValid(ccNumberInput, ccErrorNumber);
            } else {
              setCardFieldError(ccNumberInput, ccErrorNumber, luhnCheck.message);
            }
          } else {
            setCardFieldValid(ccNumberInput, ccErrorNumber);
          }
        });

        ccNumberInput.addEventListener('blur', () => {
          const raw = ccNumberInput.value.replace(/\D/g, '');
          if (raw.length > 0) {
            const luhnCheck = validarTarjetaLuhn(raw);
            if (!luhnCheck.isValid) {
              setCardFieldError(ccNumberInput, ccErrorNumber, luhnCheck.message);
            } else {
              setCardFieldValid(ccNumberInput, ccErrorNumber);
            }
          }
        });
      }

      // 2. Nombre del Titular
      if (ccNameInput && !ccNameInput.dataset.listenersBound) {
        ccNameInput.dataset.listenersBound = 'true';
        ccNameInput.addEventListener('input', (e) => {
          let val = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '').toUpperCase();
          e.target.value = val;
          if (cardPreviewName) {
            cardPreviewName.textContent = val || 'NOMBRE DEL TITULAR';
          }
          const check = validarNombreTitularTarjeta(val);
          if (check.isValid) {
            setCardFieldValid(ccNameInput, ccErrorName);
          }
        });

        ccNameInput.addEventListener('blur', () => {
          const val = ccNameInput.value.trim();
          if (val.length > 0) {
            const check = validarNombreTitularTarjeta(val);
            if (!check.isValid) {
              setCardFieldError(ccNameInput, ccErrorName, check.message);
            } else {
              setCardFieldValid(ccNameInput, ccErrorName);
            }
          }
        });
      }

      // 3. Fecha de Expiración
      if (ccExpiryInput && !ccExpiryInput.dataset.listenersBound) {
        ccExpiryInput.dataset.listenersBound = 'true';
        ccExpiryInput.addEventListener('input', (e) => {
          let val = e.target.value.replace(/\D/g, '').substring(0, 4);
          if (val.length >= 3) {
            val = val.substring(0, 2) + '/' + val.substring(2);
          }
          e.target.value = val;
          if (cardPreviewExpiry) {
            cardPreviewExpiry.textContent = val || 'MM/AA';
          }

          if (val.length === 5) {
            const check = validarFechaExpiracion(val);
            if (check.isValid) {
              setCardFieldValid(ccExpiryInput, ccErrorExpiry);
            } else {
              setCardFieldError(ccExpiryInput, ccErrorExpiry, check.message);
            }
          }
        });

        ccExpiryInput.addEventListener('blur', () => {
          const val = ccExpiryInput.value.trim();
          if (val.length > 0) {
            const check = validarFechaExpiracion(val);
            if (!check.isValid) {
              setCardFieldError(ccExpiryInput, ccErrorExpiry, check.message);
            } else {
              setCardFieldValid(ccExpiryInput, ccErrorExpiry);
            }
          }
        });
      }

      // 4. Código CVV
      if (ccCvvInput && !ccCvvInput.dataset.listenersBound) {
        ccCvvInput.dataset.listenersBound = 'true';
        ccCvvInput.addEventListener('input', (e) => {
          const maxLen = (detectedBrand === 'amex') ? 4 : 3;
          let val = e.target.value.replace(/\D/g, '').substring(0, maxLen);
          e.target.value = val;
          if (val.length === maxLen) {
            setCardFieldValid(ccCvvInput, ccErrorCvv);
          }
        });

        ccCvvInput.addEventListener('blur', () => {
          const val = ccCvvInput.value.trim();
          if (val.length > 0) {
            const check = validarCodigoSeguridadCVV(val, detectedBrand);
            if (!check.isValid) {
              setCardFieldError(ccCvvInput, ccErrorCvv, check.message);
            } else {
              setCardFieldValid(ccCvvInput, ccErrorCvv);
            }
          }
        });
      }

      // Botón Cancelar Tarjeta
      const btnCancelCard = document.getElementById('btn-cancel-card-payment');
      if (btnCancelCard) {
        btnCancelCard.onclick = closeModal;
      }

      // Envío del Formulario de Tarjeta
      if (formCard) {
        formCard.onsubmit = async (e) => {
          e.preventDefault();
          clearCardErrors();

          const rawNumber = (ccNumberInput ? ccNumberInput.value : '').replace(/\D/g, '');
          const rawName = (ccNameInput ? ccNameInput.value : '').trim();
          const rawExpiry = (ccExpiryInput ? ccExpiryInput.value : '').trim();
          const rawCvv = (ccCvvInput ? ccCvvInput.value : '').trim();

          // Algoritmo 1: Tarjeta con Luhn
          const checkNum = validarTarjetaLuhn(rawNumber);
          if (!checkNum.isValid) {
            setCardFieldError(ccNumberInput, ccErrorNumber, checkNum.message);
            if (ccNumberInput) ccNumberInput.focus();
            showToast(checkNum.message, 'danger');
            return;
          }

          // Algoritmo 2: Nombre del Titular
          const checkName = validarNombreTitularTarjeta(rawName);
          if (!checkName.isValid) {
            setCardFieldError(ccNameInput, ccErrorName, checkName.message);
            if (ccNameInput) ccNameInput.focus();
            showToast(checkName.message, 'warning');
            return;
          }

          // Algoritmo 3: Fecha de Expiración
          const checkExp = validarFechaExpiracion(rawExpiry);
          if (!checkExp.isValid) {
            setCardFieldError(ccExpiryInput, ccErrorExpiry, checkExp.message);
            if (ccExpiryInput) ccExpiryInput.focus();
            showToast(checkExp.message, 'danger');
            return;
          }

          // Algoritmo 4: CVV
          const checkCvv = validarCodigoSeguridadCVV(rawCvv, detectedBrand);
          if (!checkCvv.isValid) {
            setCardFieldError(ccCvvInput, ccErrorCvv, checkCvv.message);
            if (ccCvvInput) ccCvvInput.focus();
            showToast(checkCvv.message, 'danger');
            return;
          }

          // Micro-animación en el botón
          const payBtnText = document.getElementById('card-pay-btn-text');
          const submitBtn = document.getElementById('btn-submit-card-payment');
          if (payBtnText) payBtnText.textContent = '🔒 Procesando cobro Datafast...';
          if (submitBtn) submitBtn.disabled = true;

          setTimeout(async () => {
            closeModal();
            if (payBtnText) payBtnText.textContent = 'Pagar $21.95 y Recibir Ticket 🔒';
            if (submitBtn) submitBtn.disabled = false;
            await confirmAndCreateAppointment(userToUse);
          }, 600);
        };
      }

      modal.classList.add('active');

    } else {
      // Si es 'cash', se entrega el ticket directamente
      confirmAndCreateAppointment(userToUse);
    }
  }

  // --- GESTIÓN DEL PORTAL DEL PACIENTE (Pestañas: Resumen, Mis Citas, Mis Datos, Agendar Cita) ---
  const patientTabs = document.querySelectorAll('.patient-tab-btn');
  const patientPanes = document.querySelectorAll('.patient-portal-pane');

  function switchPatientTab(tabName) {
    patientTabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });
    patientPanes.forEach(pane => {
      pane.style.display = (pane.dataset.pane === tabName) ? 'flex' : 'none';
    });

    if (tabName === 'resumen') {
      renderPatientSummary();
    } else if (tabName === 'mis-citas') {
      renderPatientAppointmentsTable();
    } else if (tabName === 'mis-datos') {
      renderPatientProfileForm();
    } else if (tabName === 'agendar') {
      currentStep = 1;
      selectedDate = getTodayDateStr();
      clearTicketFormInputs();
      renderCalendar();
      renderTimeSlots();
      updateSummaryCard();
      updateStepView();

      const step1Pane = document.querySelector('.wizard-step-pane[data-step="1"]');
      if (step1Pane) {
        step1Pane.style.display = 'block';
        step1Pane.classList.remove('hidden');
      }

      setTimeout(() => {
        const wizardStep1 = document.querySelector('.wizard-step-pane[data-step="1"]') ||
                            document.getElementById('pat-pane-agendar') ||
                            document.querySelector('.wizard-stepper-container');
        if (wizardStep1) {
          wizardStep1.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 50);
    }
  }

  patientTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      switchPatientTab(tab.dataset.tab);
    });
  });

  // --- MODAL DE VISUALIZACIÓN DE TICKET / PDF IN-SITU (Sin redirigir a agendar cita) ---
  function openTicketModal(apt) {
    if (!apt) return;
    const modal = document.getElementById('modal-patient-ticket-view');
    if (!modal) return;

    const clinic = CLINICS[apt.clinicId] || { name: 'Sede Médica', consultorio: 'Consultorio Principal' };
    const codeEl = document.getElementById('modal-ticket-code');
    const patNameEl = document.getElementById('modal-ticket-patient-name');
    const patIdEl = document.getElementById('modal-ticket-patient-id');
    const clinicEl = document.getElementById('modal-ticket-clinic');
    const datetimeEl = document.getElementById('modal-ticket-datetime');
    const methodEl = document.getElementById('modal-ticket-method');
    const totalEl = document.getElementById('modal-ticket-total');
    const serviceNameEl = document.getElementById('modal-ticket-service-name');
    const qrContainer = document.getElementById('modal-ticket-qr-container');
    const btnPdf = document.getElementById('btn-modal-open-pdf');

    const user = store.getCurrentUser();
    const patName = apt.patientName || (user ? user.name : 'Paciente');
    const patId = apt.patientId || (user ? (user.idNumber || user.cedula) : 'S/N');
    const totalAmount = apt.totalPaid ? Number(apt.totalPaid).toFixed(2) : (apt.basePrice ? Number(apt.basePrice).toFixed(2) : '20.00');

    if (codeEl) codeEl.textContent = `#${apt.code}`;
    if (patNameEl) patNameEl.textContent = patName;
    if (patIdEl) patIdEl.textContent = patId;
    if (clinicEl) clinicEl.textContent = `${clinic.name} (${clinic.consultorio || 'Cons. 1'})`;
    if (datetimeEl) datetimeEl.textContent = `${apt.date} - ${apt.time}`;
    if (methodEl) {
      methodEl.textContent = apt.paymentMethod === 'tarjeta'
        ? 'Tarjeta de Crédito / Débito (100% Tarifa)'
        : 'Efectivo / Transferencia (Descuento 9.75% aplicado)';
    }
    if (totalEl) totalEl.textContent = `$${totalAmount}`;
    const docDisplay = apt.status === 'relevo_asignado' && apt.reliefDoctor
      ? `${apt.reliefDoctor} (Médico de Relevo)`
      : (apt.doctor || 'Dr. Carlos Campoverde');
    if (serviceNameEl) serviceNameEl.textContent = `${apt.serviceName || 'Consulta de Medicina General'} - ${docDisplay}`;

    // Construcción de la URL para el comprobante PDF oficial
    const BASE_URL = 'https://pedritojuancarlos82-lang.github.io/Proyecto-Cita-Medica';

    const params = new URLSearchParams({
      c: apt.code,
      p: patName,
      id: patId,
      s: clinic.name,
      f: apt.date,
      h: apt.time,
      tot: totalAmount,
      m: apt.paymentMethod || 'efectivo'
    });
    if (apt.tokenSeguro) {
      params.set('t', apt.tokenSeguro);
      params.set('token', apt.tokenSeguro);
    }
    const pdfUrl = `${BASE_URL}/comprobante.html?${params.toString()}`;
    const localPdfUrl = `comprobante.html?${params.toString()}`;

    if (btnPdf) {
      btnPdf.href = localPdfUrl;
    }

    if (qrContainer) {
      qrContainer.innerHTML = `
        <div style="background: #ffffff; padding: 12px; border-radius: 14px; display: inline-flex; flex-direction: column; justify-content: center; align-items: center; margin: 0 auto; border: 2px solid #0284c7; box-shadow: 0 4px 14px rgba(2, 132, 199, 0.15);">
          <div id="modal-ticket-qr-canvas" style="display: flex; justify-content: center; align-items: center; min-width: 190px; min-height: 190px;"></div>
          <span style="font-size: 0.74rem; font-weight: 800; color: #0284c7; background: #e0f2fe; padding: 3px 12px; border-radius: 9999px; margin-top: 8px;">
            📱 Escanea con tu celular para abrir tu PDF
          </span>
          <span style="font-size: 0.68rem; font-weight: 700; color: #059669; background: #ecfdf5; padding: 2px 10px; border-radius: 9999px; margin-top: 5px; border: 1px solid #a7f3d0; display: inline-flex; align-items: center; gap: 4px;">
            ✓ Token Criptográfico Firmado (Inmutable)
          </span>
        </div>
      `;

      setTimeout(() => {
        renderizarCodigoQR('modal-ticket-qr-canvas', pdfUrl, {
          size: 190,
          correctLevel: (typeof QRCode !== 'undefined' && QRCode.CorrectLevel) ? QRCode.CorrectLevel.L : null
        });
      }, 50);
    }

    modal.classList.add('active');
  }

  // Configuración de botones del modal de ticket
  const modalTicketView = document.getElementById('modal-patient-ticket-view');
  const btnCloseTicketModal = document.getElementById('btn-close-ticket-modal');
  const btnModalCloseTicketFooter = document.getElementById('btn-modal-close-ticket-footer');
  const btnModalPrintTicket = document.getElementById('btn-modal-print-ticket');

  const closeTicketModal = () => {
    if (modalTicketView) modalTicketView.classList.remove('active');
  };

  if (btnCloseTicketModal) btnCloseTicketModal.addEventListener('click', closeTicketModal);
  if (btnModalCloseTicketFooter) btnModalCloseTicketFooter.addEventListener('click', closeTicketModal);
  if (btnModalPrintTicket) {
    btnModalPrintTicket.addEventListener('click', () => {
      window.print();
    });
  }

  window.openTicketModal = openTicketModal;

  // 1. Renderizar Resumen / Ventana Principal (Dashboard del Paciente)
  function renderPatientSummary() {
    const user = store.getCurrentUser();
    const patId = user ? (user.idNumber || user.cedula || '') : '';
    const profile = (patId ? store.getPatientProfile(patId) : null) || store.getState().patientProfiles[0] || {
      nombres: user ? (user.name ? user.name.split(' ')[0] : 'Estimado') : 'Estimado',
      apellidos: user ? (user.name ? user.name.split(' ').slice(1).join(' ') : 'Paciente') : 'Paciente',
      allergies: 'Ninguna registrada',
      chronicConditions: 'Ninguna reportada'
    };

    const fullName = `${profile.nombres || ''} ${profile.apellidos || ''}`.trim();

    // Actualizar saludo y navbar
    const welcomeNameEl = document.getElementById('pat-welcome-name');
    if (welcomeNameEl) welcomeNameEl.textContent = `¡Hola, ${fullName || 'Estimado Paciente'}! 👋`;

    const navNameEl = document.getElementById('pat-navbar-name');
    if (navNameEl) navNameEl.textContent = profile.nombres || (fullName ? fullName.split(' ')[0] : 'Paciente');

    // Obtener citas del paciente
    let apts = store.getPatientAppointments(patId, user);
    if ((!apts || apts.length === 0) && store.getState().appointments && store.getState().appointments.length > 0) {
      apts = store.getState().appointments;
    }
    const totalCitasEl = document.getElementById('pat-kpi-total-citas');
    if (totalCitasEl) totalCitasEl.textContent = `${apts.length} Cita${apts.length === 1 ? '' : 's'}`;

    const allergiesEl = document.getElementById('pat-kpi-allergies');
    if (allergiesEl) {
      const allergyVal = (profile.allergies || '').trim();
      if (!allergyVal || allergyVal.toLowerCase() === 'ninguna' || allergyVal.toLowerCase() === 'ninguna registrada') {
        allergiesEl.innerHTML = '<span class="badge-alert-none">✓ Ninguna registrada</span>';
      } else {
        allergiesEl.innerHTML = `<span class="badge-alert-active">⚠️ ${allergyVal}</span>`;
      }
    }

    // Próxima Cita
    const nextDateEl = document.getElementById('pat-kpi-next-date');
    const nextClinicEl = document.getElementById('pat-kpi-next-clinic');
    const nextTitleEl = document.getElementById('pat-next-title');
    const nextDetailsEl = document.getElementById('pat-next-details');
    const nextBadgeEl = document.getElementById('pat-next-badge');

    if (apts.length > 0) {
      const nextApt = apts[0];
      const clinic = CLINICS[nextApt.clinicId] || { name: 'Sede Médica' };

      if (nextDateEl) nextDateEl.textContent = `${nextApt.date} - ${nextApt.time}`;
      if (nextClinicEl) nextClinicEl.textContent = `${clinic.name} (${clinic.consultorio || 'Cons. 4'})`;
      if (nextApt.status === 'relevo_asignado') {
        if (nextDetailsEl) nextDetailsEl.textContent = `📍 ${clinic.name} • Dr. Relevo: ${nextApt.reliefDoctor || 'Colega de Cobertura'} • ${nextApt.time}`;
        if (nextBadgeEl) {
          nextBadgeEl.textContent = '🔄 RELEVO ASIGNADO';
          nextBadgeEl.style.background = '#e0f2fe';
          nextBadgeEl.style.color = '#0369a1';
          nextBadgeEl.style.border = '1px solid #7dd3fc';
        }
      } else {
        if (nextDetailsEl) nextDetailsEl.textContent = `📍 ${clinic.name} • Dr. Carlos Campoverde • ${nextApt.time}`;
        if (nextBadgeEl) {
          nextBadgeEl.textContent = nextApt.estado || 'CONFIRMADA';
          nextBadgeEl.style.background = '';
          nextBadgeEl.style.color = '';
          nextBadgeEl.style.border = '';
        }
      }

      const btnViewTicket = document.getElementById('btn-pat-view-ticket-direct');
      if (btnViewTicket) {
        btnViewTicket.onclick = () => {
          openTicketModal(nextApt);
        };
      }
    } else {
      if (nextDateEl) nextDateEl.textContent = 'Sin citas pendientes';
      if (nextClinicEl) nextClinicEl.textContent = 'Agenda tu turno hoy';
      if (nextTitleEl) nextTitleEl.textContent = 'No tienes turnos próximos programados';
      if (nextDetailsEl) nextDetailsEl.textContent = 'Reserva tu atención presencial con el Dr. Carlos Campoverde.';
      if (nextBadgeEl) nextBadgeEl.textContent = 'DISPONIBLE';
    }
  }

  // 2. Renderizar Historial de Citas del Paciente
  function renderPatientAppointmentsTable() {
    const user = store.getCurrentUser();
    const patId = user ? (user.idNumber || user.cedula || '') : '';
    let apts = store.getPatientAppointments(patId, user);

    // Si aún no hay citas por filtro estricto pero hay citas en el store, mostrarlas todas
    if ((!apts || apts.length === 0) && store.getState().appointments && store.getState().appointments.length > 0) {
      apts = store.getState().appointments;
    }

    const tbody = document.getElementById('patient-appointments-table-body');
    if (!tbody) return;

    if (!apts || apts.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 24px; color: #64748b;">
            Aún no registras citas médicas anteriores. Haz clic en <strong>➕ Agendar Nueva Cita</strong> para reservar tu primer turno.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = apts.map(apt => {
      const clinic = CLINICS[apt.clinicId] || { name: 'Sede Médica', consultorio: 'Consultorio Principal' };
      const totalAmount = apt.totalPaid ? apt.totalPaid.toFixed(2) : (apt.basePrice ? apt.basePrice.toFixed(2) : '20.00');
      const isRelief = apt.status === 'relevo_asignado';
      const doctorDisplay = isRelief && apt.reliefDoctor
        ? `<div style="font-weight: 700; color: #0284c7;">${apt.reliefDoctor} <span style="font-size: 0.68rem; background: #e0f2fe; color: #0369a1; padding: 1px 5px; border-radius: 4px;">Relevo</span></div>`
        : (apt.doctor || 'Dr. Carlos Campoverde');
      const statusBadge = isRelief
        ? `<span class="badge-sede" style="background: #e0f2fe; color: #0369a1; border: 1px solid #7dd3fc; font-size: 0.72rem; padding: 2px 8px;">🔄 RELEVO ASIGNADO</span>`
        : `<span class="badge-sede badge-alborada" style="font-size: 0.72rem; padding: 2px 8px;">${apt.estado || 'CONFIRMADA'}</span>`;

      return `
        <tr>
          <td>
            <strong style="color: var(--primary-blue);">#${apt.code}</strong>
            <div style="font-size: 0.72rem; color: #0284c7; font-weight: 700; margin-top: 2px;">👤 ${apt.patientName || apt.patient_name || 'Paciente'}</div>
            <div style="font-size: 0.68rem; color: #64748b;">CI: ${apt.patientCedula || apt.patientId || apt.patient_id || 'Registrado'}</div>
          </td>
          <td>
            <div style="font-weight: 600; color: #1e293b;">${apt.date}</div>
            <div style="font-size: 0.72rem; color: #64748b;">${apt.time}</div>
          </td>
          <td>
            <div style="font-weight: 700; color: #0f172a;">${clinic.name}</div>
            <div style="font-size: 0.72rem; color: #64748b;">${clinic.consultorio || 'Consultorio Principal'}</div>
          </td>
          <td>
            <div style="font-size: 0.82rem; color: #334155; font-weight: 500; max-width: 180px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${apt.reason || 'Consulta médica general'}">
              ${apt.reason || 'Consulta médica general'}
            </div>
          </td>
          <td>${doctorDisplay}</td>
          <td style="font-weight: 800; color: #0f172a;">$${totalAmount}</td>
          <td>
            ${statusBadge}
          </td>
          <td>
            <button type="button" class="btn-secondary btn-view-single-ticket" data-code="${apt.code}" style="padding: 4px 10px; font-size: 0.76rem; border-radius: 6px;">
              🎫 Ver Ticket / PDF
            </button>
          </td>
        </tr>
      `;
    }).join('');

    // Escuchar clics en los botones de ver ticket
    tbody.querySelectorAll('.btn-view-single-ticket').forEach(btn => {
      btn.addEventListener('click', () => {
        const code = btn.dataset.code;
        const targetApt = apts.find(a => a.code === code);
        if (targetApt) {
          openTicketModal(targetApt);
        }
      });
    });
  }

  // 3. Renderizar Formulario de Ficha Personal y Datos
  function renderPatientProfileForm() {
    const user = store.getCurrentUser();
    const patId = user ? (user.idNumber || user.cedula || '0987654321') : '0987654321';
    const profile = store.getPatientProfile(patId) || store.getState().patientProfiles[0] || {};

    const idField = document.getElementById('pat-prof-id');
    const nomField = document.getElementById('pat-prof-nombres');
    const apeField = document.getElementById('pat-prof-apellidos');
    const phoneField = document.getElementById('pat-prof-phone');
    const emailField = document.getElementById('pat-prof-email');
    const addrField = document.getElementById('pat-prof-address');
    const emerNameField = document.getElementById('pat-prof-emer-name');
    const emerPhoneField = document.getElementById('pat-prof-emer-phone');
    const bloodField = document.getElementById('pat-prof-blood');
    const ageField = document.getElementById('pat-prof-age');
    const allergiesField = document.getElementById('pat-prof-allergies');
    const chronicField = document.getElementById('pat-prof-chronic');
    const medsField = document.getElementById('pat-prof-meds');

    if (idField) idField.value = profile.cedula || patId;
    if (nomField) nomField.value = profile.nombres || (user ? user.name.split(' ')[0] : 'Carlos');
    if (apeField) apeField.value = profile.apellidos || (user ? user.name.split(' ').slice(1).join(' ') : 'Mendoza');
    if (phoneField) phoneField.value = profile.phone || (user ? user.phone : '0987654321');
    if (emailField) emailField.value = profile.email || (user ? user.email : 'carlos.mendoza@gmail.com');
    if (addrField) addrField.value = profile.address || 'Cdla. Alborada 8va Etapa, Mz 812 Sl 14';
    if (emerNameField) emerNameField.value = profile.emergencyContact || 'María Mendoza (Hermana)';
    if (emerPhoneField) emerPhoneField.value = profile.emergencyPhone || '0991234567';
    if (bloodField) bloodField.value = profile.bloodType || 'O+';
    if (ageField) ageField.value = profile.age || 42;
    if (allergiesField) allergiesField.value = profile.allergies || 'Penicilina, Sulfas';
    if (chronicField) chronicField.value = profile.chronicConditions || 'Hipertensión Arterial Primaria (I10)';
    if (medsField) medsField.value = profile.currentMedications || 'Losartán 50mg cada 24h';
  }

  // Guardar perfil y actualizar Supabase
  const formProfile = document.getElementById('form-patient-profile');
  if (formProfile) {
    formProfile.addEventListener('submit', (e) => {
      e.preventDefault();
      const user = store.getCurrentUser();
      const patId = document.getElementById('pat-prof-id')?.value.trim() || (user ? user.idNumber : '0987654321');

      const updatedProfile = {
        cedula: patId,
        nombres: document.getElementById('pat-prof-nombres')?.value.trim(),
        apellidos: document.getElementById('pat-prof-apellidos')?.value.trim(),
        phone: document.getElementById('pat-prof-phone')?.value.trim(),
        email: document.getElementById('pat-prof-email')?.value.trim(),
        address: document.getElementById('pat-prof-address')?.value.trim(),
        emergencyContact: document.getElementById('pat-prof-emer-name')?.value.trim(),
        emergencyPhone: document.getElementById('pat-prof-emer-phone')?.value.trim(),
        bloodType: document.getElementById('pat-prof-blood')?.value,
        age: parseInt(document.getElementById('pat-prof-age')?.value, 10) || 0,
        allergies: document.getElementById('pat-prof-allergies')?.value.trim(),
        chronicConditions: document.getElementById('pat-prof-chronic')?.value.trim(),
        currentMedications: document.getElementById('pat-prof-meds')?.value.trim()
      };

      store.savePatientProfile(updatedProfile);
      showToast('✅ Ficha clínica del paciente guardada y sincronizada en Supabase.', 'success');
      renderPatientSummary();
    });
  }

  // Accesos rápidos desde la ventana de Resumen
  const btnDashQuickBook = document.getElementById('btn-dash-quick-book');
  if (btnDashQuickBook) {
    btnDashQuickBook.addEventListener('click', () => {
      switchPatientTab('agendar');
    });
  }

  const btnDashGotoCitas = document.getElementById('btn-dash-goto-citas');
  if (btnDashGotoCitas) {
    btnDashGotoCitas.addEventListener('click', () => {
      switchPatientTab('mis-citas');
    });
  }

  const btnDashGotoDatos = document.getElementById('btn-dash-goto-datos');
  if (btnDashGotoDatos) {
    btnDashGotoDatos.addEventListener('click', () => {
      switchPatientTab('mis-datos');
    });
  }

  const cardKpiFicha = document.getElementById('card-kpi-ficha');
  if (cardKpiFicha) {
    cardKpiFicha.addEventListener('click', () => {
      switchPatientTab('mis-datos');
    });
  }

  const cardKpiAlertas = document.getElementById('card-kpi-alertas');
  if (cardKpiAlertas) {
    cardKpiAlertas.addEventListener('click', () => {
      switchPatientTab('mis-datos');
    });
  }

  const cardKpiCitas = document.getElementById('card-kpi-citas');
  if (cardKpiCitas) {
    cardKpiCitas.addEventListener('click', () => {
      switchPatientTab('mis-citas');
    });
  }

  // Botón volver al inicio dentro de la página del portal paciente
  const btnPatientExitInline = document.getElementById('btn-patient-exit-inline');
  if (btnPatientExitInline) {
    btnPatientExitInline.addEventListener('click', () => {
      store.setActiveView('landing');
    });
  }

  // Conexión del botón "Iniciar Sesión" en la barra del paciente (modo invitado)
  const btnPatNavLogin = document.getElementById('btn-patient-open-login');
  if (btnPatNavLogin) {
    btnPatNavLogin.addEventListener('click', (e) => {
      e.preventDefault();
      if (typeof window.openUnifiedLoginModal === 'function') {
        window.openUnifiedLoginModal('paciente');
      } else {
        const modal = document.getElementById('modal-unified-login');
        if (modal) {
          modal.classList.remove('hidden');
          modal.classList.add('active');
          const loginInput = document.getElementById('modal-login-username');
          if (loginInput) setTimeout(() => loginInput.focus(), 80);
        }
      }
    });
  }

  // Conexión del botón "Agendar Cita" en las pestañas del paciente
  const btnPatAgendarTab = document.getElementById('nav-btn-pat-agendar');
  if (btnPatAgendarTab) {
    btnPatAgendarTab.addEventListener('click', (e) => {
      e.preventDefault();
      switchPatientTab('agendar');
    });
  }

  // Conexión del botón "➕ Nueva Cita" en la sección de Mis Citas
  const btnCitasBookNew = document.getElementById('btn-citas-book-new');
  if (btnCitasBookNew) {
    btnCitasBookNew.addEventListener('click', (e) => {
      e.preventDefault();
      switchPatientTab('agendar');
    });
  }

  // Conexión del logo/brand del paciente y botón volver para regresar a la landing
  const patientBrandBtn = document.getElementById('patient-nav-brand-btn');
  const patientBackBtn = document.getElementById('btn-patient-back-to-web');
  const handleReturnToLanding = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (typeof window.returnToLanding === 'function') {
      window.returnToLanding();
      return;
    }
    const landingEl = document.getElementById('view-landing');
    if (landingEl) {
      landingEl.classList.remove('hidden', 'd-none');
      landingEl.style.removeProperty('display');
      landingEl.style.cssText = 'display: block !important; opacity: 1 !important; visibility: visible !important;';
    }
    const patientEl = document.getElementById('view-patient') || document.getElementById('portal-paciente');
    if (patientEl) {
      patientEl.classList.add('hidden', 'd-none');
      patientEl.style.cssText = 'display: none !important;';
    }
    if (window.store) {
      window.store.setActiveView('landing');
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  if (patientBrandBtn) {
    patientBrandBtn.addEventListener('click', handleReturnToLanding);
  }
  if (patientBackBtn) {
    patientBackBtn.addEventListener('click', handleReturnToLanding);
  }

  // Inicializar portal con la ventana de Resumen SIEMPRE al abrirse
  window.renderPatientPortal = function() {
    switchPatientTab('resumen');
  };
  window.switchPatientTab = switchPatientTab;

  // Inicializar vistas con la fecha de hoy y campos limpios para agendamiento
  clearTicketFormInputs();
  renderCalendar();
  renderTimeSlots();
  updateSummaryCard();
  updateStepView();
  renderPatientSummary();
}

