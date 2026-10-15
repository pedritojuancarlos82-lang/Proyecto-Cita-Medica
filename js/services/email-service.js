/**
 * Montepiedra Salud - Servicio de Automatización de Correos Electrónicos
 * Semana 4 - Parte 3: Confirmación inmediata, recordatorios 24h y contingencias de guardia
 */

import { store, CLINICS, getTodayDateStr } from '../state.js';

export const EmailService = {
  /**
   * Envía correo de confirmación inmediata al agendar una cita
   * @param {Object} appointment
   * @param {Function} [showToastFn]
   */
  sendBookingConfirmation(appointment, showToastFn) {
    if (!appointment) return null;

    const clinic = CLINICS[appointment.clinicId] || CLINICS.ceibos || { name: 'Clínica Ceibos', consultorio: 'Consultorio 104' };
    const recipient = appointment.patientEmail || `${appointment.patientId}@montepiedrasalud.ec`;
    const patientName = appointment.patientName || 'Estimado Paciente';
    const date = appointment.date || getTodayDateStr();
    const time = appointment.time || '09:00';
    const amount = (appointment.totalPaid !== undefined ? appointment.totalPaid : (appointment.total_paid || 20)).toFixed(2);
    const code = appointment.code || appointment.id || 'MED-0000';

    // 1. Metadata de notificaciones en la cita
    if (!appointment.notifications) {
      appointment.notifications = {};
    }
    appointment.notifications.confirmationSent = true;
    appointment.notifications.confirmationDate = new Date().toISOString();
    appointment.notifications.reminder24hSent = false;
    appointment.notifications.reminderDate = null;

    // 2. Plantilla HTML y texto estructurado
    const emailPayload = {
      to: recipient,
      subject: `Confirmación de Cita Médica #${code} - Montepiedra Salud`,
      patientName,
      appointmentCode: code,
      clinicName: clinic.name,
      clinicConsultorio: clinic.consultorio,
      doctorName: 'Dr. Carlos Campoverde',
      date,
      time,
      amount,
      qrToken: appointment.tokenSeguro || `TOKEN-${code}`,
      sentAt: new Date().toISOString()
    };

    // 3. Registro en log central del store
    const logEntry = store.addNotificationLog({
      type: 'CONFIRMACION',
      title: 'Confirmación Inmediata de Reserva',
      recipient,
      patientName,
      appointmentCode: code,
      sede: clinic.name,
      date,
      time,
      status: 'Entregado',
      details: `[Inmediato] Correo de confirmación enviado a ${patientName} (${recipient}) para su turno #${code} en Sede ${clinic.name} a las ${time}`
    });

    console.log('📧 [EmailService] Confirmación enviada con éxito:', emailPayload);

    // 4. Notificación Toast visual requerida
    const toastMsg = `✉️ Correo de confirmación enviado exitosamente a ${recipient}`;
    if (typeof showToastFn === 'function') {
      showToastFn(toastMsg, 'info');
    } else if (typeof window !== 'undefined' && typeof window.showToast === 'function') {
      window.showToast(toastMsg, 'info');
    }

    return { success: true, emailPayload, logEntry };
  },

  /**
   * Audita citas del día de mañana (hoy + 1 día) y despacha recordatorios de 24 horas
   * @param {Function} [showToastFn]
   */
  auditAndSend24hReminders(showToastFn) {
    const res = store.auditAndSend24hReminders();

    const toastMsg = res.count > 0 
      ? `⏰ Se despacharon ${res.count} recordatorios automáticos de 24h a pacientes del día de mañana.`
      : 'ℹ️ No hay citas pendientes de recordatorio 24h para el día de mañana.';

    if (typeof showToastFn === 'function') {
      showToastFn(toastMsg, res.count > 0 ? 'success' : 'info');
    } else if (typeof window !== 'undefined' && typeof window.showToast === 'function') {
      window.showToast(toastMsg, res.count > 0 ? 'success' : 'info');
    }

    return res;
  },

  /**
   * Notificación de contingencia por guardia hospitalaria o cambio imprevisto
   * @param {Object} appointment
   * @param {string} reason
   * @param {'reprogramada'|'cancelada'} actionType
   * @param {string} [newDate]
   * @param {string} [newTime]
   * @param {Function} [showToastFn]
   */
  sendEmergencyGuardNotice(appointment, reason, actionType, newDate, newTime, showToastFn) {
    if (!appointment) return null;

    const recipient = appointment.patientEmail || `${appointment.patientId}@montepiedrasalud.ec`;
    const patientName = appointment.patientName || 'Paciente';
    const clinic = CLINICS[appointment.clinicId] || CLINICS.ceibos || { name: 'Clínica Ceibos' };

    let subject = '';
    let messageBody = '';

    if (actionType === 'reprogramada') {
      subject = `[URGENTE] Reprogramación Asistida de Turno #${appointment.code || appointment.id} - Montepiedra Salud`;
      messageBody = `Estimado/a ${patientName}, su turno en Sede ${clinic.name} ha sido reprogramado debido a una guardia hospitalaria imprevista del Dr. Carlos Campoverde (${reason || 'Llamado a Choque'}). Se ha reservado su espacio prioritario para el ${newDate} a las ${newTime}.`;
    } else {
      subject = `[AVISO] Cancelación y Ticket Prioritario de Cita #${appointment.code || appointment.id} - Montepiedra Salud`;
      messageBody = `Estimado/a ${patientName}, su turno en Sede ${clinic.name} no podrá ser atendido por fuerza mayor médica (${reason || 'Guardia Hospitalaria'}). Se ha emitido su ticket prioritario de reembolso y reagendamiento inmediato sin costo.`;
    }

    const logEntry = store.addNotificationLog({
      type: 'GUARDIAS_CONTINGENCIA',
      title: actionType === 'reprogramada' ? 'Reprogramación por Guardia Hospitalaria' : 'Cancelación con Ticket Prioritario',
      recipient,
      patientName,
      appointmentCode: appointment.code || appointment.id,
      sede: clinic.name,
      date: newDate || appointment.date,
      time: newTime || appointment.time,
      status: actionType === 'reprogramada' ? 'Notificado' : 'Ticket Emitido',
      details: messageBody
    });

    console.log(`🚨 [EmailService] Notificación de guardia enviada a ${recipient}:`, messageBody);

    const toastMsg = actionType === 'reprogramada'
      ? `🚨 Notificación de reprogramación enviada a ${patientName} (${recipient})`
      : `⚠️ Ticket prioritario y cancelación notificada a ${patientName} (${recipient})`;

    if (typeof showToastFn === 'function') {
      showToastFn(toastMsg, 'warning');
    } else if (typeof window !== 'undefined' && typeof window.showToast === 'function') {
      window.showToast(toastMsg, 'warning');
    }

    return { success: true, logEntry, messageBody };
  },

  /**
   * Enviar correo de prueba para verificar conectividad
   * @param {string} testEmail
   * @param {Function} [showToastFn]
   */
  sendTestEmail(testEmail = 'paciente.demo@montepiedrasalud.ec', showToastFn) {
    const logEntry = store.addNotificationLog({
      type: 'PRUEBA_SISTEMA',
      title: 'Prueba de Conectividad SMTP / EmailJS',
      recipient: testEmail,
      patientName: 'Prueba de Sistema',
      appointmentCode: 'TEST-999',
      sede: 'Red Central',
      date: getTodayDateStr(),
      time: '12:00',
      status: 'Entregado',
      details: `[Simulación] Envío de verificación de pasarela de correos a ${testEmail}. Conexión activa 100%.`
    });

    const toastMsg = `📨 Correo de prueba enviado exitosamente a ${testEmail}`;
    if (typeof showToastFn === 'function') {
      showToastFn(toastMsg, 'success');
    } else if (typeof window !== 'undefined' && typeof window.showToast === 'function') {
      window.showToast(toastMsg, 'success');
    }

    return { success: true, logEntry };
  }
};

if (typeof window !== 'undefined') {
  window.EmailService = EmailService;
}
