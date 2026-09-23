/**
 * Utilidades Globales de Validación y Sanitización
 */

/**
 * Validador Algorítmico de Cédula Ecuatoriana
 */
export const validarCedulaEcuatoriana = (cedula) => {
  if (!cedula || typeof cedula !== 'string') return false;
  
  // Debe tener exactamente 10 dígitos numéricos
  if (cedula.length !== 10 || !/^\d{10}$/.test(cedula)) return false;
  
  const provincia = parseInt(cedula.substring(0, 2), 10);
  if (provincia < 1 || (provincia > 24 && provincia !== 30)) return false;

  const digitos = cedula.split('').map(Number);
  const verificador = digitos.pop();
  
  let suma = 0;
  digitos.forEach((digito, i) => {
    let valor = digito * (i % 2 === 0 ? 2 : 1);
    if (valor > 9) valor -= 9;
    suma += valor;
  });
  
  const digitoCalculado = suma % 10 === 0 ? 0 : 10 - (suma % 10);
  return digitoCalculado === verificador;
};

/**
 * Validador de Teléfono (Celular o Convencional de Ecuador)
 */
export const validarTelefono = (telefono) => {
  if (!telefono || typeof telefono !== 'string') return false;
  const num = telefono.replace(/\D/g, ''); // Quitar cualquier cosa que no sea número
  
  // Celular: 10 dígitos y empieza con 09
  if (num.length === 10 && num.startsWith('09')) return true;
  // Convencional: 9 dígitos y empieza con 0 (ej: 04, 02)
  if (num.length === 9 && num.startsWith('0')) return true;
  
  return false;
};

/**
 * Sanitiza nombres quitando números, caracteres raros y espacios excesivos.
 */
export const sanitizarNombre = (nombre) => {
  if (!nombre) return '';
  return nombre
    .replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trimStart()
    .substring(0, 70);
};

/**
 * Bloqueadores físicos de teclado
 */
const bloquearLetras = (e) => {
  if (e.type === 'paste') {
    const pasteData = (e.clipboardData || window.clipboardData).getData('text');
    if (/\D/.test(pasteData)) {
      e.preventDefault();
      const numOnly = pasteData.replace(/\D/g, '');
      document.execCommand('insertText', false, numOnly);
    }
    return;
  }
  
  if (e.type === 'keypress') {
    // Si la tecla presionada no es un número y no es tecla de control, bloquéala
    if (!/^\d$/.test(e.key) && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
    }
  }

  if (e.type === 'beforeinput' && e.data) {
    if (/\D/.test(e.data)) {
      e.preventDefault();
    }
  }
};

const bloquearNumerosYSimb = (e) => {
  if (e.type === 'paste') {
    const pasteData = (e.clipboardData || window.clipboardData).getData('text');
    if (/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/.test(pasteData)) {
      e.preventDefault();
      const alphaOnly = pasteData.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
      document.execCommand('insertText', false, alphaOnly);
    }
    return;
  }
  
  if (e.type === 'keypress') {
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]$/.test(e.key) && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
    }
  }

  if (e.type === 'beforeinput' && e.data) {
    if (/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/.test(e.data)) {
      e.preventDefault();
    }
  }
};

/**
 * Aplica máscaras restrictivas en tiempo real a los inputs del DOM
 */
export const aplicarMascaraInputs = () => {
  // Mascara para Cédulas
  const cedulaInputs = [
    document.getElementById('pat-input-id'),
    document.getElementById('paciente-cedula')
  ];

  cedulaInputs.forEach(input => {
    if (input) {
      input.setAttribute('maxlength', '10');
      input.setAttribute('inputmode', 'numeric');
      input.addEventListener('keypress', bloquearLetras);
      input.addEventListener('beforeinput', bloquearLetras);
      input.addEventListener('paste', bloquearLetras);
      input.addEventListener('input', function() {
        this.value = this.value.replace(/\D/g, '').substring(0, 10);
      });
    }
  });

  // Mascara para Teléfonos
  const phoneInputs = [
    document.getElementById('pat-input-phone')
  ];

  phoneInputs.forEach(input => {
    if (input) {
      input.setAttribute('maxlength', '10');
      input.setAttribute('inputmode', 'numeric');
      input.addEventListener('keypress', bloquearLetras);
      input.addEventListener('beforeinput', bloquearLetras);
      input.addEventListener('paste', bloquearLetras);
      input.addEventListener('input', function() {
        this.value = this.value.replace(/\D/g, '').substring(0, 10);
      });
    }
  });

  // Mascara para Nombres
  const nameInputs = [
    document.getElementById('pat-input-name'),
    document.getElementById('paciente-nombre')
  ];

  nameInputs.forEach(input => {
    if (input) {
      input.setAttribute('maxlength', '70');
      input.addEventListener('keypress', bloquearNumerosYSimb);
      input.addEventListener('beforeinput', bloquearNumerosYSimb);
      input.addEventListener('paste', bloquearNumerosYSimb);
      input.addEventListener('input', function() {
        this.value = sanitizarNombre(this.value);
      });
    }
  });
};
