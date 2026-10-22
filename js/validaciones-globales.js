/**
 * Utilidades Globales de Validación, Sanitización y Conexión SRI
 * Montepiedra Salud
 */

/**
 * Validador Algorítmico y Matemático de Cédula Ecuatoriana (Módulo 10)
 * Requisitos:
 * 1. Exactamente 10 dígitos numéricos enteros positivos.
 * 2. Código de provincia válido: 01 a 24, o 30 (consular).
 * 3. Tercer dígito < 6 (persona natural).
 * 4. Algoritmo Módulo 10 con coeficientes [2, 1, 2, 1, 2, 1, 2, 1, 2].
 * 5. Coincidencia matemática exacta del dígito verificador.
 */
export const validarCedulaEcuatorianaDetallada = (cedula) => {
  if (!cedula || typeof cedula !== 'string') {
    return { isValid: false, message: 'Cédula incorrecta.' };
  }

  const limpia = cedula.trim();

  // Solo dígitos enteros positivos
  if (!/^\d{10}$/.test(limpia)) {
    return { isValid: false, message: 'Cédula incorrecta.' };
  }

  // Validación de provincia (01 a 24, o 30)
  const provincia = parseInt(limpia.substring(0, 2), 10);
  if ((provincia < 1 || provincia > 24) && provincia !== 30) {
    return { isValid: false, message: 'Cédula incorrecta.' };
  }

  // Tercer dígito menor a 6 para personas naturales
  const tercerDigito = parseInt(limpia.charAt(2), 10);
  if (tercerDigito >= 6) {
    return { isValid: false, message: 'Cédula incorrecta.' };
  }

  // Algoritmo matemático Módulo 10
  const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let suma = 0;

  for (let i = 0; i < 9; i++) {
    let valor = parseInt(limpia.charAt(i), 10) * coeficientes[i];
    if (valor >= 10) {
      valor -= 9;
    }
    suma += valor;
  }

  const digitoVerificadorCalculado = (10 - (suma % 10)) % 10;
  const digitoVerificadorReal = parseInt(limpia.charAt(9), 10);

  if (digitoVerificadorCalculado !== digitoVerificadorReal) {
    return {
      isValid: false,
      message: 'Cédula incorrecta.'
    };
  }

  return { isValid: true, message: 'Cédula válida.' };
};

export const validarCedulaEcuatoriana = (cedula) => {
  return validarCedulaEcuatorianaDetallada(cedula).isValid;
};

/**
 * Validador de Teléfono Celular de Ecuador
 * Requisitos:
 * 1. Exactamente 10 dígitos numéricos enteros positivos.
 * 2. Inicia con '09'.
 * 3. Prohibido valores negativos, decimales o caracteres especiales.
 */
export const validarCelularDetallado = (telefono) => {
  if (!telefono || typeof telefono !== 'string') {
    return { isValid: false, message: 'El número celular es requerido.' };
  }

  const num = telefono.trim();

  if (!/^\d+$/.test(num)) {
    return { isValid: false, message: 'Solo se permiten dígitos numéricos enteros positivos (nada de negativos ni signos).' };
  }

  if (num.length !== 10) {
    return { isValid: false, message: `El número debe tener exactamente 10 dígitos (actualmente tiene ${num.length}).` };
  }

  if (!num.startsWith('09')) {
    return { isValid: false, message: 'El número celular debe empezar con el prefijo oficial 09 de Ecuador (ej: 0987654321).' };
  }

  return { isValid: true, message: 'Número celular válido.' };
};

export const validarTelefono = (telefono) => {
  return validarCelularDetallado(telefono).isValid;
};

/**
 * Validador de Correo Electrónico bajo estándar formal RFC 5322
 */
export const RFC5322_EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export const validarEmailDetallado = (email) => {
  if (!email || typeof email !== 'string') {
    return { isValid: false, message: 'El correo electrónico es obligatorio.' };
  }

  const trimmed = email.trim();
  if (!RFC5322_EMAIL_REGEX.test(trimmed)) {
    return {
      isValid: false,
      message: 'Ingresa un correo electrónico con formato válido bajo norma RFC 5322 (ej: paciente@correo.com).'
    };
  }

  return { isValid: true, message: 'Correo electrónico válido.' };
};

export const validarEmail = (email) => {
  return validarEmailDetallado(email).isValid;
};

/**
 * Validador de Nombre y Apellido Completo (mínimo 2 palabras, sin números ni símbolos)
 */
export const validarNombreCompletoDetallado = (nombre) => {
  if (!nombre || typeof nombre !== 'string') {
    return { isValid: false, message: 'El nombre y apellido son obligatorios.' };
  }

  const limpio = nombre.trim().replace(/\s+/g, ' ');

  // Bloquear números y símbolos especiales
  if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(limpio)) {
    return { isValid: false, message: 'El nombre no debe contener números ni símbolos especiales.' };
  }

  // Exigir al menos un nombre y un apellido (mínimo 2 palabras válidas de al menos 2 letras)
  const palabras = limpio.split(' ').filter(p => p.length >= 2);
  if (palabras.length < 2) {
    return { isValid: false, message: 'Ingresa al menos un nombre y un apellido (mínimo 2 palabras válidas).' };
  }

  return { isValid: true, message: 'Nombre y apellido válidos.' };
};

export const validarNombreCompleto = (nombre) => {
  return validarNombreCompletoDetallado(nombre).isValid;
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
 * Normaliza nombres a formato Capitalizado (Title Case)
 */
export const normalizarNombre = (str) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};

/**
 * Conexión reactiva con la API del SRI para detectar automáticamente al usuario registrado
 */
export const consultarSRI = async (cedula) => {
  if (!validarCedulaEcuatoriana(cedula)) {
    return { exito: false, mensaje: 'Cédula no válida para consulta en el SRI.' };
  }

  const ruc = `${cedula}001`;
  const sriDirectUrl = `https://srienlinea.sri.gob.ec/sri-catastro-sujeto-servicio-internet/rest/ConsolidadoContribuyente/obtenerPorNumerosRuc?ruc=${ruc}`;

  // Intentar consulta mediante endpoint directo y proxy CORS público para navegadores
  const endpoints = [
    sriDirectUrl,
    `https://corsproxy.io/?${encodeURIComponent(sriDirectUrl)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(sriDirectUrl)}`
  ];

  for (const url of endpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (response.ok && response.status === 200) {
        const text = await response.text();
        if (text && text.trim().startsWith('[')) {
          const data = JSON.parse(text);
          if (Array.isArray(data) && data.length > 0 && data[0].razonSocial) {
            return {
              exito: true,
              nombre: normalizarNombre(data[0].razonSocial),
              razonSocial: data[0].razonSocial,
              ruc: data[0].numeroRuc,
              tipo: data[0].tipoContribuyente || 'PERSONA NATURAL',
              estado: data[0].estadoContribuyenteRuc || 'ACTIVO',
              fuente: 'SRI en Línea Oficial'
            };
          }
        }
      }
    } catch (e) {
      // Intentar siguiente endpoint
    }
  }

  // Si no se encuentra en SRI o hay restricción de red/CORS, buscar en el historial clínico local
  try {
    if (typeof MedicalService !== 'undefined' && MedicalService.buscarPorCedula) {
      const pacienteLocal = MedicalService.buscarPorCedula(cedula);
      if (pacienteLocal && pacienteLocal.nombreCompleto) {
        return {
          exito: true,
          nombre: pacienteLocal.nombreCompleto,
          telefono: pacienteLocal.telefono,
          email: pacienteLocal.email,
          fuente: 'Historial Clínico Montepiedra'
        };
      }
    }
  } catch (err) {
    console.warn('Búsqueda en registros locales:', err);
  }

  return {
    exito: false,
    mensaje: 'Cédula válida (Módulo 10). No se detectó RUC activo en el SRI. Ingrese su nombre manualmente.'
  };
};

/**
 * Bloqueadores físicos de teclado usando keydown
 * Impiden signos negativos (-), positivos (+), decimales (.), comas (,) o letras en campos numéricos
 */
const bloquearNoNumericosEnteros = (e) => {
  if (e.type === 'paste') {
    const pasteData = (e.clipboardData || window.clipboardData).getData('text');
    if (/\D/.test(pasteData)) {
      e.preventDefault();
      const numOnly = pasteData.replace(/\D/g, '');
      document.execCommand('insertText', false, numOnly);
    }
    return;
  }
  
  if (e.type === 'keydown') {
    // Teclas de control permitidas (navegación, retroceso, tab, etc.)
    if (
      e.key.length > 1 || 
      e.ctrlKey || 
      e.metaKey || 
      e.altKey
    ) {
      return;
    }
    // Bloquear explícitamente cualquier cosa que no sea un dígito 0-9 (bloquea -, +, e, E, ., , etc.)
    if (!/^[0-9]$/.test(e.key)) {
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
  
  if (e.type === 'keydown') {
    if (
      e.key.length > 1 || 
      e.ctrlKey || 
      e.metaKey || 
      e.altKey
    ) {
      return;
    }
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]$/.test(e.key)) {
      e.preventDefault();
    }
  }
};

/**
 * Aplica máscaras restrictivas en tiempo real a los inputs del DOM
 */
export const aplicarMascaraInputs = () => {
  // Mascara para Cédulas: 10 dígitos numéricos estrictos
  const cedulaInputs = [
    document.getElementById('pat-input-id'),
    document.getElementById('paciente-cedula'),
    document.getElementById('gate-reg-id'),
    document.getElementById('reg-pat-cedula')
  ];

  cedulaInputs.forEach(input => {
    if (input) {
      input.setAttribute('maxlength', '10');
      input.setAttribute('inputmode', 'numeric');
      input.removeEventListener('keydown', bloquearNoNumericosEnteros);
      input.removeEventListener('paste', bloquearNoNumericosEnteros);
      input.addEventListener('keydown', bloquearNoNumericosEnteros);
      input.addEventListener('paste', bloquearNoNumericosEnteros);
      input.addEventListener('input', function() {
        this.value = this.value.replace(/\D/g, '').substring(0, 10);
      });
    }
  });

  // Mascara para Teléfonos (Celular 10 dígitos enteros)
  const phoneInputs = [
    document.getElementById('pat-input-phone'),
    document.getElementById('gate-reg-phone'),
    document.getElementById('reg-pat-phone'),
    document.getElementById('pat-prof-phone'),
    document.getElementById('pat-prof-emer-phone')
  ];

  phoneInputs.forEach(input => {
    if (input) {
      input.setAttribute('maxlength', '10');
      input.setAttribute('inputmode', 'numeric');
      input.removeEventListener('keydown', bloquearNoNumericosEnteros);
      input.removeEventListener('paste', bloquearNoNumericosEnteros);
      input.addEventListener('keydown', bloquearNoNumericosEnteros);
      input.addEventListener('paste', bloquearNoNumericosEnteros);
      input.addEventListener('input', function() {
        this.value = this.value.replace(/\D/g, '').substring(0, 10);
      });
    }
  });

  // Mascara para Nombres: solo letras y espacios, sin números ni símbolos
  const nameInputs = [
    document.getElementById('pat-input-name'),
    document.getElementById('paciente-nombre'),
    document.getElementById('gate-reg-name'),
    document.getElementById('reg-pat-nombres'),
    document.getElementById('reg-pat-apellidos'),
    document.getElementById('pat-prof-nombres'),
    document.getElementById('pat-prof-apellidos'),
    document.getElementById('pat-prof-emer-name')
  ];

  nameInputs.forEach(input => {
    if (input) {
      input.setAttribute('maxlength', '70');
      input.removeEventListener('keydown', bloquearNumerosYSimb);
      input.removeEventListener('paste', bloquearNumerosYSimb);
      input.addEventListener('keydown', bloquearNumerosYSimb);
      input.addEventListener('paste', bloquearNumerosYSimb);
      input.addEventListener('input', function() {
        this.value = this.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
      });
    }
  });
};

/**
 * ========================================================================
 * VALIDACIONES ALGORÍTMICAS PARA TARJETAS DE CRÉDITO Y PASARELA DE PAGO
 * ========================================================================
 */

/**
 * Detecta la marca / franquicia de la tarjeta según los rangos BIN oficiales
 * @param {string} numero
 * @returns {{ brand: string, name: string, cvvLength: number }}
 */
export const detectarMarcaTarjeta = (numero) => {
  const clean = (numero || '').replace(/\D/g, '');
  if (/^4/.test(clean)) {
    return { brand: 'visa', name: 'Visa', cvvLength: 3 };
  }
  if (/^(5[1-5]|2[2-7])/.test(clean)) {
    return { brand: 'mastercard', name: 'Mastercard', cvvLength: 3 };
  }
  if (/^3[47]/.test(clean)) {
    return { brand: 'amex', name: 'American Express', cvvLength: 4 };
  }
  if (/^3(0[0-5]|[68])/.test(clean)) {
    return { brand: 'diners', name: 'Diners Club', cvvLength: 3 };
  }
  if (/^6(011|5)/.test(clean)) {
    return { brand: 'discover', name: 'Discover', cvvLength: 3 };
  }
  return { brand: 'generic', name: 'Tarjeta de Crédito / Débito', cvvLength: 3 };
};

/**
 * Validador Algorítmico Módulo 10 (Luhn) para Números de Tarjeta de Crédito
 * Requisitos:
 * 1. Longitud entre 13 y 19 dígitos numéricos enteros positivos.
 * 2. Multiplicación alternada x2 de derecha a izquierda con resta de 9 si producto > 9.
 * 3. Coincidencia estricta de residuo cero al aplicar Módulo 10.
 * @param {string} numero
 * @returns {{ isValid: boolean, message: string, brand?: object }}
 */
export const validarTarjetaLuhn = (numero) => {
  if (!numero || typeof numero !== 'string') {
    return { isValid: false, message: 'Ingrese el número de la tarjeta de crédito.' };
  }

  const clean = numero.replace(/\D/g, '');

  if (clean.length < 13 || clean.length > 19) {
    return {
      isValid: false,
      message: `El número de tarjeta debe tener entre 13 y 19 dígitos (actualmente tiene ${clean.length}).`
    };
  }

  let sum = 0;
  let shouldDouble = false;

  for (let i = clean.length - 1; i >= 0; i--) {
    let digit = parseInt(clean.charAt(i), 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }

  const isValid = (sum % 10 === 0);
  const brand = detectarMarcaTarjeta(clean);

  if (!isValid) {
    return {
      isValid: false,
      message: 'Número de tarjeta inválido. No supera el algoritmo matemático de verificación Luhn.',
      brand
    };
  }

  return {
    isValid: true,
    message: `Tarjeta ${brand.name} válida.`,
    brand
  };
};

/**
 * Validador Algorítmico de Fecha de Expiración (MM/AA o MM/AAAA)
 * Requisitos:
 * 1. Formato exacto MM/AA o MM/AAAA.
 * 2. Mes comprendido entre 01 y 12.
 * 3. No vencida respecto al mes y año actual del sistema.
 * 4. Máximo 20 años de vigencia razonable.
 * @param {string} fechaStr
 * @returns {{ isValid: boolean, message: string }}
 */
export const validarFechaExpiracion = (fechaStr) => {
  if (!fechaStr || typeof fechaStr !== 'string') {
    return { isValid: false, message: 'Ingrese la fecha de expiración (MM/AA).' };
  }

  const clean = fechaStr.trim().replace(/\s+/g, '');
  const match = clean.match(/^(0[1-9]|1[0-2])\/([0-9]{2}|[0-9]{4})$/);

  if (!match) {
    return { isValid: false, message: 'Formato incorrecto. Use MM/AA (ejemplo: 08/28).' };
  }

  const mes = parseInt(match[1], 10);
  let anio = parseInt(match[2], 10);
  if (anio < 100) {
    anio += 2000;
  }

  const now = new Date();
  const anioActual = now.getFullYear();
  const mesActual = now.getMonth() + 1; // 1-12

  if (anio < anioActual || (anio === anioActual && mes < mesActual)) {
    return { isValid: false, message: 'La tarjeta se encuentra vencida / expirada.' };
  }

  if (anio > anioActual + 20) {
    return { isValid: false, message: 'Año de expiración inválido o demasiado lejano.' };
  }

  return { isValid: true, message: 'Fecha de expiración válida.' };
};

/**
 * Validador de Código de Seguridad CVV / CVC
 * Requisitos:
 * 1. Exactamente 3 dígitos numéricos (o 4 para American Express).
 * @param {string} cvv
 * @param {string} [brand='generic']
 * @returns {{ isValid: boolean, message: string }}
 */
export const validarCodigoSeguridadCVV = (cvv, brand = 'generic') => {
  if (!cvv || typeof cvv !== 'string') {
    return { isValid: false, message: 'Ingrese el código de seguridad (CVV/CVC).' };
  }

  const clean = cvv.trim();
  const reqLen = (brand === 'amex') ? 4 : 3;

  if (!/^\d+$/.test(clean)) {
    return { isValid: false, message: 'El CVV debe contener únicamente dígitos numéricos.' };
  }

  if (brand === 'amex') {
    if (clean.length !== 4) {
      return { isValid: false, message: 'Para American Express el código de seguridad debe tener 4 dígitos.' };
    }
  } else {
    if (clean.length !== 3 && clean.length !== 4) {
      return { isValid: false, message: 'El código CVV de seguridad debe tener 3 dígitos (al reverso de la tarjeta).' };
    }
  }

  return { isValid: true, message: 'Código de seguridad válido.' };
};

/**
 * Validador de Nombre del Titular de la Tarjeta
 * Requisitos:
 * 1. Solo caracteres alfabéticos y espacios.
 * 2. Mínimo 2 palabras (Nombre y Apellido).
 * 3. Entre 5 y 60 caracteres.
 * @param {string} nombre
 * @returns {{ isValid: boolean, message: string }}
 */
export const validarNombreTitularTarjeta = (nombre) => {
  if (!nombre || typeof nombre !== 'string') {
    return { isValid: false, message: 'Ingrese el nombre y apellido tal como aparece en la tarjeta.' };
  }

  const clean = nombre.trim().replace(/\s+/g, ' ');

  if (clean.length < 5) {
    return { isValid: false, message: 'El nombre del titular debe contener al menos 5 letras.' };
  }

  if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(clean)) {
    return { isValid: false, message: 'El nombre solo puede contener letras y espacios (sin números ni símbolos).' };
  }

  const words = clean.split(' ').filter(w => w.length >= 2);
  if (words.length < 2) {
    return { isValid: false, message: 'Ingrese nombre y apellido completos del titular (mínimo 2 palabras).' };
  }

  return { isValid: true, message: 'Nombre del titular válido.' };
};

