/**
 * Flujo 1: Portal de Citas del Paciente (Página 3)
 * Asistente de 4 pasos para selección de sede, horario protegido sin choques,
 * cálculo transparente del recargo del 9.75% por tarjeta, y generación de ticket QR.
 */

import { CLINICS, CREDIT_CARD_SURCHARGE_RATE, store } from './state.js';
import { generateQRCodeSVG } from './qr-generator.js';
import { validarCedulaEcuatoriana, validarTelefono } from './validaciones-globales.js';

// Utilidades locales para UI de errores
const showFieldError = (inputEl, message) => {
  let errorDiv = inputEl.nextElementSibling;
  if (!errorDiv || !errorDiv.classList.contains('input-error-msg')) {
    errorDiv = document.createElement('div');
    errorDiv.className = 'input-error-msg';
    inputEl.parentNode.insertBefore(errorDiv, inputEl.nextSibling);
  }
  errorDiv.textContent = message;
  errorDiv.classList.add('visible');
  inputEl.classList.add('error');
};

const clearFieldError = (inputEl) => {
  if(!inputEl) return;
  const errorDiv = inputEl.nextElementSibling;
  if (errorDiv && errorDiv.classList.contains('input-error-msg')) {
    errorDiv.classList.remove('visible');
  }
  inputEl.classList.remove('error');
};

export function setupPatientPortal(showToast) {
  const idInput = document.getElementById('pat-input-id');
  const nameInput = document.getElementById('pat-input-name');

  // Limpiar errores on input
  const allInputs = [idInput, nameInput, document.getElementById('pat-input-phone'), document.getElementById('pat-input-email')];
  allInputs.forEach(input => {
    if(input) input.addEventListener('input', () => clearFieldError(input));
  });
  let currentStep = 1;
  let selectedClinicId = 'ceibos';
  let selectedDate = '2026-09-19'; // Fecha base activa del prototipo
  let selectedTimeSlot = '10:30';
  let selectedPaymentMethod = 'efectivo'; // 'efectivo' o 'tarjeta'
  let createdAppointment = null;

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

  // --- PASO 1: Renderizar Selección de Sedes ---
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

  // --- PASO 2: Calendario y Rejilla de Horarios ---
  const slotsContainer = document.getElementById('time-slots-grid');
  const calendarDaysContainer = document.getElementById('calendar-days-grid');
  const travelNoticeBox = document.getElementById('travel-buffer-notice');

  // Inicializar días de calendario para Septiembre 2026
  if (calendarDaysContainer) {
    const daysInMonth = 30;
    let html = '';
    // Días vacíos para iniciar el martes 1 de Septiembre
    for (let i = 0; i < 2; i++) {
      html += `<div class="calendar-day-cell disabled"></div>`;
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dayStr = d < 10 ? `0${d}` : `${d}`;
      const dateVal = `2026-09-${dayStr}`;
      const isSelected = dateVal === selectedDate;
      const isPast = d < 19; // Bloquear días pasados antes del 19
      const isToday = d === 19;
      html += `
        <div class="calendar-day-cell ${isSelected ? 'selected' : ''} ${isPast ? 'disabled' : ''} ${isToday ? 'today' : ''}" data-date="${dateVal}">
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
        renderTimeSlots();
      });
    });
  }

  // Generar y filtrar horarios según citas existentes y bloques de traslado (Página 2 y 4)
  function renderTimeSlots() {
    if (!slotsContainer) return;

    const baseSlots = ['08:30', '09:00', '09:45', '10:30', '11:15', '12:00', '13:00', '13:45', '14:30', '15:15', '16:00', '16:45', '17:30'];
    const state = store.getState();

    // Obtener citas ya agendadas en la fecha seleccionada
    const bookedTimes = state.appointments
      .filter(a => a.date === selectedDate && a.status !== 'cancelada')
      .map(a => a.time);

    // Obtener franjas de traslado en ruta
    // Ejemplo: Entre 11:00 y 12:45 o entre 15:00 y 15:45 el doctor está en carretera
    const transitTimes = ['11:15', '12:00', '15:15'];

    slotsContainer.innerHTML = baseSlots.map(time => {
      const isBooked = bookedTimes.includes(time);
      const isTransit = transitTimes.includes(time);
      const isSelected = (time === selectedTimeSlot && !isBooked && !isTransit);

      let classes = 'slot-pill-btn';
      let title = 'Disponible';
      let disabled = false;

      if (isBooked) {
        classes += ' disabled';
        title = 'Horario reservado por otro paciente';
        disabled = true;
      } else if (isTransit) {
        classes += ' disabled';
        title = 'Franja protegida: El doctor está en traslado interurbano en ruta';
        disabled = true;
      } else if (isSelected) {
        classes += ' selected';
      }

      return `
        <button type="button" class="${classes}" data-time="${time}" ${disabled ? 'disabled' : ''} title="${title}">
          ${time}
        </button>
      `;
    }).join('');

    slotsContainer.querySelectorAll('.slot-pill-btn:not(.disabled)').forEach(btn => {
      btn.addEventListener('click', () => {
        slotsContainer.querySelectorAll('.slot-pill-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedTimeSlot = btn.dataset.time;
        updateSummaryCard();
      });
    });

    if (travelNoticeBox) {
      travelNoticeBox.innerHTML = `
        <span>🚗</span>
        <span><b>Lógica de Protección en Ruta:</b> Las franjas de traslado hacia y desde Ceibos / Mapasingue (11:15, 12:00, 15:15) se encuentran bloqueadas automáticamente para asegurar que el doctor llegue a tiempo a su consultorio.</span>
      `;
    }
  }

  // --- PASO 3: Método de Pago Transparente & Desglose (Página 3) ---
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

  // Rellenar formulario únicamente si el usuario ya inició sesión como paciente
  function prefillPatientData() {
    const user = store.getCurrentUser();
    const idInput = document.getElementById('pat-input-id');
    const nameInput = document.getElementById('pat-input-name');
    const phoneInput = document.getElementById('pat-input-phone');
    const emailInput = document.getElementById('pat-input-email');

    if (user && user.role === 'paciente') {
      if (idInput && !idInput.value) idInput.value = user.idNumber || '';
      if (nameInput && !nameInput.value) nameInput.value = user.name || '';
      if (phoneInput && !phoneInput.value) phoneInput.value = user.phone || '';
      if (emailInput && !emailInput.value) emailInput.value = user.email || '';
    }
    // Si no ha iniciado sesión, los campos se mantienen limpios para que el usuario escriba sus datos reales
  }

  function updateSummaryCard() {
    const clinic = CLINICS[selectedClinicId] || CLINICS.ceibos;
    const baseFee = clinic.basePrice;
    let cardFee = 0;
    let totalDue = baseFee;

    if (selectedPaymentMethod === 'tarjeta' && baseFee > 0) {
      cardFee = +(baseFee * CREDIT_CARD_SURCHARGE_RATE).toFixed(2);
      totalDue = +(baseFee + cardFee).toFixed(2);
    }

    const sumClinic = document.getElementById('sum-clinic-name');
    const sumDate = document.getElementById('sum-date-time');
    const sumBaseFee = document.getElementById('sum-base-fee');
    const sumCardFeeRow = document.getElementById('sum-card-fee-row');
    const sumCardFee = document.getElementById('sum-card-fee-amount');
    const sumTotalDue = document.getElementById('sum-total-due');

    if (sumClinic) sumClinic.textContent = clinic.name;
    if (sumDate) sumDate.textContent = `${selectedDate} a las ${selectedTimeSlot}`;
    if (sumBaseFee) sumBaseFee.textContent = `$${baseFee.toFixed(2)}`;

    if (sumCardFeeRow && sumCardFee) {
      if (selectedPaymentMethod === 'tarjeta' && baseFee > 0) {
        sumCardFeeRow.style.display = 'flex';
        sumCardFee.textContent = `+$${cardFee.toFixed(2)}`;
      } else {
        sumCardFeeRow.style.display = 'none';
      }
    }

    if (sumTotalDue) {
      sumTotalDue.textContent = `$${totalDue.toFixed(2)}`;
    }
  }

  // --- PASO 4: Generar Ticket y Código QR Dinámico (Página 3) ---
  function renderConfirmationTicket(appointment) {
    const clinic = CLINICS[appointment.clinicId];
    const ticketCodeEl = document.getElementById('ticket-code-display');
    const qrContainer = document.getElementById('ticket-qr-container');
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
    if (ticketMethod) ticketMethod.textContent = appointment.paymentMethod === 'tarjeta' ? 'Tarjeta de Crédito (+9.75%)' : 'Efectivo / Transferencia';

    // Generar SVG del Código QR
    if (qrContainer) {
      const qrData = `TICKET:${appointment.code}|PACIENTE:${appointment.patientId}|SEDE:${clinic.name}|HORA:${appointment.date} ${appointment.time}`;
      qrContainer.innerHTML = generateQRCodeSVG(qrData, 180);
    }
  }

  // Botón Imprimir Comprobante PDF (Página 3)
  const btnPrintTicket = document.getElementById('btn-print-ticket');
  if (btnPrintTicket) {
    btnPrintTicket.addEventListener('click', () => {
      window.print();
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

  // Botón Siguiente / Confirmar
  if (btnNext) {
    btnNext.addEventListener('click', () => {
      if (currentStep === 1) {
        currentStep = 2;
        renderTimeSlots();
        updateStepView();
      } else if (currentStep === 2) {
        if (!selectedTimeSlot) {
          showToast('Por favor selecciona un horario disponible.', 'warning');
          return;
        }
        prefillPatientData();
        updateSummaryCard();
        currentStep = 3;
        updateStepView();
      } else if (currentStep === 3) {
        // Validar formulario de paciente
        const patId = document.getElementById('pat-input-id').value.trim();
        const patName = document.getElementById('pat-input-name').value.trim();
        const patPhone = document.getElementById('pat-input-phone').value.trim();
        const patEmail = document.getElementById('pat-input-email').value.trim();
        const patReason = document.getElementById('pat-input-reason').value.trim() || 'Consulta médica general';

        let hasError = false;

        if (!patId || !patName || !patEmail || !patPhone) {
          showToast('Por favor completa todos los campos obligatorios del paciente.', 'danger');
          return;
        }

        if (patId.length !== 10 || !validarCedulaEcuatoriana(patId)) {
          showFieldError(document.getElementById('pat-input-id'), 'La cédula debe ser ecuatoriana y contener 10 dígitos.');
          document.getElementById('pat-input-id').focus();
          hasError = true;
        }

        if (!validarTelefono(patPhone)) {
          showFieldError(document.getElementById('pat-input-phone'), 'El teléfono debe tener 10 dígitos (celular) o 9 dígitos (convencional).');
          if(!hasError) document.getElementById('pat-input-phone').focus();
          hasError = true;
        }
        
        if (hasError) return;

        // Crear la cita en el estado central
        createdAppointment = store.addAppointment({
          clinicId: selectedClinicId,
          date: selectedDate,
          time: selectedTimeSlot,
          patientId: patId,
          patientName: patName,
          patientPhone: patPhone,
          patientEmail: patEmail,
          reason: patReason,
          paymentMethod: selectedPaymentMethod
        });

        renderConfirmationTicket(createdAppointment);
        currentStep = 4;
        updateStepView();

        showToast(`¡Cita agendada con éxito! Se envió el correo de confirmación con copia al Dr.`, 'success');
      } else if (currentStep === 4) {
        // Reiniciar flujo para nueva cita
        currentStep = 1;
        updateStepView();
      }
    });
  }

  // Navegación por pasos desde los botones de la barra superior dinámica
  document.querySelectorAll('#nav-menu-patient .nav-step-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetStep = parseInt(btn.dataset.step, 10);
      if (targetStep === 1) {
        currentStep = 1;
        updateStepView();
      } else if (targetStep === 2) {
        currentStep = 2;
        renderTimeSlots();
        updateStepView();
      } else if (targetStep === 3) {
        if (!selectedTimeSlot) {
          showToast('Selecciona un horario disponible antes de continuar al paso de datos.', 'warning');
          return;
        }
        prefillPatientData();
        updateSummaryCard();
        currentStep = 3;
        updateStepView();
      } else if (targetStep === 4) {
        if (createdAppointment) {
          currentStep = 4;
          updateStepView();
        } else {
          showToast('Primero completa los datos y confirma en el Paso 3 para generar tu comprobante QR.', 'info');
        }
      }
    });
  });

  // Botón volver al inicio dentro de la página del portal paciente
  const btnPatientExitInline = document.getElementById('btn-patient-exit-inline');
  if (btnPatientExitInline) {
    btnPatientExitInline.addEventListener('click', () => {
      store.setActiveView('landing');
    });
  }

  // Inicializar vistas
  renderTimeSlots();
  updateSummaryCard();
  updateStepView();
}
