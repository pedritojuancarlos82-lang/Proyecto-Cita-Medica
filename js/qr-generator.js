/**
 * Generador de Códigos QR real usando el API de qrserver
 * Sin dependencias de compilación para máxima compatibilidad.
 */

export function renderizarCodigoQR(contenedorId, datosCita) {
  const container = document.getElementById(contenedorId);
  if (!container) return;

  // Formato de texto estructurado y legible
  const qrData = `CITA MÉDICA - MONTEPIEDRA SALUD
Turno: #${datosCita.codigoTurno}
Paciente: ${datosCita.nombre}
Cédula: ${datosCita.cedula}
Fecha: ${datosCita.fecha} ${datosCita.hora}
Sede: ${datosCita.sede}
Total: ${datosCita.total} (Pago en Recepción)`;

  // Generar URL dinámica
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}&margin=10&color=0f172a&bgcolor=ffffff`;

  // Limpiar contenedor e insertar imagen real
  container.innerHTML = `<img src="${qrUrl}" alt="QR Ticket" style="width: 100%; height: 100%; object-fit: contain; border-radius: 8px;" />`;
}
