/**
 * Generador de Códigos QR de Ultra-Alta Definición
 * Usa la librería QRCode local para generar códigos QR limpios, de alto contraste (#000000 / #ffffff)
 * y 100% escaneables por cualquier cámara de teléfono celular en milisegundos.
 */

export function renderizarCodigoQR(contenedorId, qrData, options = {}) {
  const container = (typeof contenedorId === 'string') 
    ? document.getElementById(contenedorId) 
    : contenedorId;
  if (!container) return;

  container.innerHTML = '';

  const size = options.size || 240;
  const level = (typeof QRCode !== 'undefined' && QRCode.CorrectLevel) 
    ? (options.correctLevel || QRCode.CorrectLevel.L) 
    : null;

  // Wrapper interno con fondo blanco puro y margen de resguardo (quiet zone)
  const qrInnerWrapper = document.createElement('div');
  qrInnerWrapper.className = 'qr-canvas-inner-wrapper';
  qrInnerWrapper.style.background = '#ffffff';
  qrInnerWrapper.style.padding = '14px';
  qrInnerWrapper.style.borderRadius = '12px';
  qrInnerWrapper.style.display = 'inline-block';
  qrInnerWrapper.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.08)';
  qrInnerWrapper.style.border = '1px solid #e2e8f0';
  container.appendChild(qrInnerWrapper);

  if (typeof QRCode !== 'undefined') {
    try {
      new QRCode(qrInnerWrapper, {
        text: qrData,
        width: size,
        height: size,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: level || QRCode.CorrectLevel.L
      });

      // Asegurar que el canvas y/o imagen no tengan filtros difuminadores
      const canvasEl = qrInnerWrapper.querySelector('canvas');
      if (canvasEl) {
        canvasEl.style.imageRendering = 'pixelated';
        canvasEl.style.display = 'block';
        canvasEl.style.margin = '0 auto';
      }
      const imgEl = qrInnerWrapper.querySelector('img');
      if (imgEl) {
        imgEl.style.imageRendering = 'pixelated';
        imgEl.style.margin = '0 auto';
      }
      return;
    } catch (e) {
      console.warn('Error con QRCode local, aplicando fallback de alta resolución:', e);
    }
  }

  // Fallback con margen de resguardo amplio de 4 módulos
  const img = document.createElement('img');
  img.src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(qrData)}&margin=4&color=000000&bgcolor=ffffff&format=png`;
  img.alt = "Código QR Oficial de Cita Médica";
  img.style.width = `${size}px`;
  img.style.height = `${size}px`;
  img.style.display = 'block';
  img.style.imageRendering = 'pixelated';
  qrInnerWrapper.appendChild(img);
}
