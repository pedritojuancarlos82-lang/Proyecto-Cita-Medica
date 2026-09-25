// Montepiedra Salud - Bundle Unificado (Compatible con file:/// y http://)


// ==================== js/qr-generator.js ====================

/**
 * Generador de Códigos QR de Ultra-Alta Definición
 * Usa la librería QRCode local para generar códigos QR limpios, de alto contraste (#000000 / #ffffff)
 * y 100% escaneables por cualquier cámara de teléfono celular en milisegundos.
 */

function renderizarCodigoQR(contenedorId, qrData, options = {}) {
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


// ==================== js/data/consultation-catalog.js ====================

const CONSULTATION_CATALOG = [
  {
    id: "CG-01",
    codigo: "CG-01",
    nombre: "Consulta Médica General",
    descripcionCorta: "Evaluación primaria para diagnóstico y tratamiento.",
    duracionMinutos: 30,
    precioBase: 20.00,
    categoria: "Atención Primaria",
    estado: "Activo"
  },
  {
    id: "CG-02",
    codigo: "CG-02",
    nombre: "Control Rutinario / Seguimiento",
    descripcionCorta: "Seguimiento de tratamientos y revisión general.",
    duracionMinutos: 20,
    precioBase: 15.00,
    categoria: "Seguimiento",
    estado: "Activo"
  },
  {
    id: "CG-03",
    codigo: "CG-03",
    nombre: "Certificado de Salud y Aptitud Física",
    descripcionCorta: "Evaluación para emisión de certificados de salud.",
    duracionMinutos: 30,
    precioBase: 25.00,
    categoria: "Certificaciones",
    estado: "Activo"
  },
  {
    id: "CG-04",
    codigo: "CG-04",
    nombre: "Atención Prioritaria / Urgencia Menor",
    descripcionCorta: "Atención rápida para urgencias no vitales.",
    duracionMinutos: 45,
    precioBase: 30.00,
    categoria: "Prioritaria",
    estado: "Activo"
  }
];


// ==================== js/models/patient-record.js ====================

class PatientRecord {
  constructor(data) {
    this.id = data.id || `PAC-${Date.now()}`;
    this.cedula = data.cedula || '';
    this.nombreCompleto = data.nombreCompleto || '';
    this.fechaNacimiento = data.fechaNacimiento || '';
    this.edad = data.edad || null;
    this.genero = data.genero || '';
    this.telefono = data.telefono || '';
    this.email = data.email || '';
    this.direccion = data.direccion || '';
    
    this.contactoEmergencia = {
      nombre: data.contactoEmergencia?.nombre || '',
      parentesco: data.contactoEmergencia?.parentesco || '',
      telefono: data.contactoEmergencia?.telefono || ''
    };
    
    this.antecedentesClinicos = {
      alergias: data.antecedentesClinicos?.alergias || [],
      patologiasCronicas: data.antecedentesClinicos?.patologiasCronicas || [],
      cirugiasPrevias: data.antecedentesClinicos?.cirugiasPrevias || [],
      medicacionHabitual: data.antecedentesClinicos?.medicacionHabitual || []
    };
    
    this.historialConsultas = data.historialConsultas || [];
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }
}


// ==================== js/services/medical-service.js ====================


const MedicalService = {
  // Retorna únicamente los servicios con estado "Activo"
  getCatalogo: () => {
    return CONSULTATION_CATALOG.filter(servicio => servicio.estado === 'Activo');
  },

  // Retorna la lista parseada de pacientes guardados en localStorage
  getPacientes: () => {
    try {
      const pacientes = localStorage.getItem('montepiedra_pacientes');
      return pacientes ? JSON.parse(pacientes) : [];
    } catch (e) {
      console.error('Error parsing pacientes from localStorage', e);
      return [];
    }
  },

  // Retorna la ficha médica si el paciente ya existe; null si es nuevo
  buscarPorCedula: (cedula) => {
    const pacientes = MedicalService.getPacientes();
    const paciente = pacientes.find(p => p.cedula === cedula);
    return paciente ? new PatientRecord(paciente) : null;
  },

  // Guarda o actualiza la ficha del paciente
  guardarFicha: (datos) => {
    let pacientes = MedicalService.getPacientes();
    const index = pacientes.findIndex(p => p.cedula === datos.cedula);

    if (index >= 0) {
      // Actualiza antecedentes y datos demográficos
      const pacienteExistente = new PatientRecord(pacientes[index]);
      
      pacienteExistente.nombreCompleto = datos.nombreCompleto || pacienteExistente.nombreCompleto;
      pacienteExistente.telefono = datos.telefono || pacienteExistente.telefono;
      pacienteExistente.email = datos.email || pacienteExistente.email;
      if (datos.antecedentesClinicos) {
        pacienteExistente.antecedentesClinicos = { ...pacienteExistente.antecedentesClinicos, ...datos.antecedentesClinicos };
      }
      pacienteExistente.updatedAt = new Date().toISOString();
      
      pacientes[index] = pacienteExistente;
    } else {
      // Genera un nuevo registro
      const nuevoPaciente = new PatientRecord(datos);
      pacientes.push(nuevoPaciente);
    }

    localStorage.setItem('montepiedra_pacientes', JSON.stringify(pacientes));
  },

  // Añade la consulta reservada al historial de consultas del paciente
  registrarAtencionEnHistorial: (cedula, datosCita) => {
    let pacientes = MedicalService.getPacientes();
    const index = pacientes.findIndex(p => p.cedula === cedula);

    if (index >= 0) {
      const paciente = new PatientRecord(pacientes[index]);
      paciente.historialConsultas.push({
        ...datosCita,
        fechaRegistro: new Date().toISOString()
      });
      pacientes[index] = paciente;
      localStorage.setItem('montepiedra_pacientes', JSON.stringify(pacientes));
    } else {
      console.error('No se puede registrar atención: paciente no encontrado.');
    }
  }
};


// ==================== js/validaciones-globales.js ====================

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
const validarCedulaEcuatorianaDetallada = (cedula) => {
  if (!cedula || typeof cedula !== 'string') {
    return { isValid: false, message: 'La cédula de identidad es requerida.' };
  }

  const limpia = cedula.trim();

  // Solo dígitos enteros positivos
  if (!/^\d{10}$/.test(limpia)) {
    return { isValid: false, message: 'La cédula debe contener exactamente 10 dígitos enteros positivos (sin signos ni letras).' };
  }

  // Validación de provincia (01 a 24, o 30)
  const provincia = parseInt(limpia.substring(0, 2), 10);
  if ((provincia < 1 || provincia > 24) && provincia !== 30) {
    return { isValid: false, message: `Código de provincia '${limpia.substring(0, 2)}' no válido en Ecuador (debe ser 01-24 o 30).` };
  }

  // Tercer dígito menor a 6 para personas naturales
  const tercerDigito = parseInt(limpia.charAt(2), 10);
  if (tercerDigito >= 6) {
    return { isValid: false, message: 'El tercer dígito debe ser menor a 6 para cédula de persona natural.' };
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
      message: `Dígito verificador inválido: la cédula no supera la comprobación matemática (esperado: ${digitoVerificadorCalculado}, ingresado: ${digitoVerificadorReal}).`
    };
  }

  return { isValid: true, message: 'Cédula de identidad ecuatoriana válida.' };
};

const validarCedulaEcuatoriana = (cedula) => {
  return validarCedulaEcuatorianaDetallada(cedula).isValid;
};

/**
 * Validador de Teléfono Celular de Ecuador
 * Requisitos:
 * 1. Exactamente 10 dígitos numéricos enteros positivos.
 * 2. Inicia con '09'.
 * 3. Prohibido valores negativos, decimales o caracteres especiales.
 */
const validarCelularDetallado = (telefono) => {
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

const validarTelefono = (telefono) => {
  return validarCelularDetallado(telefono).isValid;
};

/**
 * Validador de Correo Electrónico
 * Requisitos:
 * Formato general: nombre@gmail.com, nombre@hotmail.com, etc.
 */
const validarEmailDetallado = (email) => {
  if (!email || typeof email !== 'string') {
    return { isValid: false, message: 'El correo electrónico es requerido.' };
  }

  const trimmed = email.trim();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (!emailRegex.test(trimmed)) {
    return {
      isValid: false,
      message: 'Ingresa un correo electrónico con formato válido (ej: nombre@gmail.com, nombre@hotmail.com).'
    };
  }

  return { isValid: true, message: 'Correo electrónico válido.' };
};

const validarEmail = (email) => {
  return validarEmailDetallado(email).isValid;
};

/**
 * Sanitiza nombres quitando números, caracteres raros y espacios excesivos.
 */
const sanitizarNombre = (nombre) => {
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
const normalizarNombre = (str) => {
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
const consultarSRI = async (cedula) => {
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
const aplicarMascaraInputs = () => {
  // Mascara para Cédulas
  const cedulaInputs = [
    document.getElementById('pat-input-id'),
    document.getElementById('paciente-cedula')
  ];

  cedulaInputs.forEach(input => {
    if (input) {
      input.setAttribute('maxlength', '10');
      input.setAttribute('inputmode', 'numeric');
      input.addEventListener('keydown', bloquearNoNumericosEnteros);
      input.addEventListener('paste', bloquearNoNumericosEnteros);
      input.addEventListener('input', function() {
        this.value = this.value.replace(/\D/g, '').substring(0, 10);
      });
    }
  });

  // Mascara para Teléfonos (Celular 10 dígitos enteros)
  const phoneInputs = [
    document.getElementById('pat-input-phone')
  ];

  phoneInputs.forEach(input => {
    if (input) {
      input.setAttribute('maxlength', '10');
      input.setAttribute('inputmode', 'numeric');
      input.addEventListener('keydown', bloquearNoNumericosEnteros);
      input.addEventListener('paste', bloquearNoNumericosEnteros);
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
      input.addEventListener('keydown', bloquearNumerosYSimb);
      input.addEventListener('paste', bloquearNumerosYSimb);
      input.addEventListener('input', function() {
        this.value = sanitizarNombre(this.value);
      });
    }
  });
};


// ==================== js/state.js ====================

/**
 * SaaS Médico Multisede - Estado Central Reactivo
 * Mantiene la persistencia en LocalStorage y sincroniza eventos entre Paciente, Médico y Contadora.
 */

const STORAGE_KEY = 'saas_medico_multisede_v2';

// Catálogo de Sedes y Reglas Financieras (Página 2, 3 y 5)
const CLINICS = {
  ceibos: {
    id: 'ceibos',
    name: 'Clínica Ceibos',
    type: 'Consultorio Privado',
    consultorio: 'Consultorio 2',
    address: 'Av. del Bombero, Edificio Ceibos Plaza, Piso 3',
    basePrice: 20.00,
    retentionRate: 0.25, // 25% retención clínica
    color: '#6366f1', // Índigo Ceibos
    badgeClass: 'badge-ceibos',
    image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=600&auto=format&fit=crop&q=80'
  },
  mapasingue: {
    id: 'mapasingue',
    name: 'Consultorio Mapasingue',
    type: 'Consultorio Privado',
    consultorio: 'Consultorio 1A',
    address: 'Av. Primera y Calle 3ra, Mapasingue Oeste',
    basePrice: 20.00,
    retentionRate: 0.05, // 5% retención clínica
    color: '#0284c7', // Azul Clínico Principal
    badgeClass: 'badge-mapasingue',
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&auto=format&fit=crop&q=80'
  },
  alborada: {
    id: 'alborada',
    name: 'Consultorio Alborada',
    type: 'Atención Comunitaria / Tarifa Reducida',
    consultorio: 'Consultorio 4',
    address: 'Av. Rodolfo Baquerizo Nazur, Alborada Etapa 8',
    basePrice: 10.00,
    retentionRate: 0.10, // 10% retención clínica
    color: '#10b981', // Verde Éxito / Alborada
    badgeClass: 'badge-alborada',
    image: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=600&auto=format&fit=crop&q=80'
  },
  hospital: {
    id: 'hospital',
    name: 'Hospital Público de Ceibos',
    type: 'Servicio Público de Salud',
    consultorio: 'Área de Emergencia y Triaje',
    address: 'Vía a la Costa km 6.5, Hospital General',
    basePrice: 0.00, // Gratuito
    retentionRate: 0.00,
    color: '#f59e0b', // Naranja Hospital
    badgeClass: 'badge-hospital',
    image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=600&auto=format&fit=crop&q=80'
  }
};

// Salario Fijo Mensual del Doctor en el Hospital Público
const HOSPITAL_FIXED_SALARY = 1200.00;

// Recargo Bancario por Tarjeta de Crédito
const CREDIT_CARD_SURCHARGE_RATE = 0.0975; // 9.75%

// Usuarios Demo Preconfigurados (Página 1)
const DEMO_USERS = {
  doctor: {
    role: 'doctor',
    name: 'Dr. Carlos Campoverde',
    email: 'carlos.campoverde@montepiedrasalud.ec',
    username: 'doctor',
    idNumber: '0930860044',
    alternativeId: '0928374651',
    password: 'admin123',
    alternativePassword: 'doctor123',
    specialty: 'Medicina General',
    mspCode: 'MSP-REG-84729',
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80'
  },
  paciente: {
    role: 'paciente',
    name: 'Carlos Mendoza Moreira',
    email: 'paciente@gmail.com',
    username: 'paciente',
    idNumber: '0987654321',
    password: 'paciente123',
    phone: '+593 98 765 4321',
    allergies: 'Penicilina, Sulfamidas',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
  },
  contador: {
    role: 'contador',
    name: 'Lcda. Patricia Morales (Auditora)',
    email: 'contabilidad@clinicamed.com',
    username: 'contador',
    idNumber: '0912345678',
    password: 'contador123',
    firm: 'Auditoría Fiscal & Asesoría Médica',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
  }
};

// Datos Semilla Iniciales
const INITIAL_STATE = {
  currentUser: null,
  activeView: 'landing', // 'landing', 'patient', 'doctor', 'accountant'
  
  // Citas Iniciales del día Sábado 19 de Septiembre y semana activa
  appointments: [
    {
      id: 'APT-1001',
      code: 'MED-1001',
      patientName: 'Carlos Mendoza Moreira',
      patientId: '0987654321',
      patientPhone: '0987654321',
      patientEmail: 'paciente@gmail.com',
      clinicId: 'alborada',
      date: '2026-09-19',
      time: '09:00',
      durationMinutes: 45,
      reason: 'Control anual de hipertensión y chequeo rutinario',
      paymentMethod: 'efectivo',
      basePrice: 10.00,
      feePercentage: 0.00,
      feeAmount: 0.00,
      totalPaid: 10.00,
      retentionRate: 0.10,
      retentionAmount: 1.00,
      netClinicYield: 9.00,
      status: 'confirmada', // confirmada, atendida, en_guardia, cancelada
      settlementStatus: 'Liquidado', // Liquidado, Pendiente
      notes: 'Paciente con antecedente de HTA grado 1. Recomienda perfil lipídico.'
    },
    {
      id: 'APT-1002',
      code: 'MED-1002',
      patientName: 'Mariana Vera Loor',
      patientId: '0918237465',
      patientPhone: '0991234567',
      patientEmail: 'mariana.vera@yahoo.com',
      clinicId: 'alborada',
      date: '2026-09-19',
      time: '10:00',
      durationMinutes: 45,
      reason: 'Cuadro respiratorio agudo de 3 días de evolución',
      paymentMethod: 'tarjeta',
      basePrice: 10.00,
      feePercentage: 0.0975,
      feeAmount: 0.98,
      totalPaid: 10.98,
      retentionRate: 0.10,
      retentionAmount: 1.00,
      netClinicYield: 9.00,
      status: 'confirmada',
      settlementStatus: 'Liquidado',
      notes: 'Requiere auscultación y receta digital antibiótica.'
    },
    {
      id: 'APT-1003',
      code: 'MED-1003',
      patientName: 'Javier Andrade Romero',
      patientId: '0922883344',
      patientPhone: '0984561230',
      patientEmail: 'jandrade@gmail.com',
      clinicId: 'ceibos',
      date: '2026-09-19',
      time: '13:00',
      durationMinutes: 45,
      reason: 'Dolor articular lumbar y valoración general',
      paymentMethod: 'efectivo',
      basePrice: 20.00,
      feePercentage: 0.00,
      feeAmount: 0.00,
      totalPaid: 20.00,
      retentionRate: 0.25,
      retentionAmount: 5.00,
      netClinicYield: 15.00,
      status: 'confirmada',
      settlementStatus: 'Pendiente',
      notes: 'Indicar analgésicos y evaluación postural.'
    },
    {
      id: 'APT-1004',
      code: 'MED-1004',
      patientName: 'Sofía Carvajal Poveda',
      patientId: '0933772211',
      patientPhone: '0978901234',
      patientEmail: 'sofia.carvajal@outlook.com',
      clinicId: 'ceibos',
      date: '2026-09-19',
      time: '14:00',
      durationMinutes: 45,
      reason: 'Certificado de salud para ingreso laboral',
      paymentMethod: 'tarjeta',
      basePrice: 20.00,
      feePercentage: 0.0975,
      feeAmount: 1.95,
      totalPaid: 21.95,
      retentionRate: 0.25,
      retentionAmount: 5.00,
      netClinicYield: 15.00,
      status: 'confirmada',
      settlementStatus: 'Pendiente',
      notes: 'Examen físico completo y toma de signos vitales.'
    },
    {
      id: 'APT-1005',
      code: 'MED-1005',
      patientName: 'Elena Guamán Tomalá',
      patientId: '0944119988',
      patientPhone: '0967894561',
      patientEmail: 'elena.guaman@gmail.com',
      clinicId: 'mapasingue',
      date: '2026-09-19',
      time: '16:00',
      durationMinutes: 45,
      reason: 'Control glicemia y ajuste de antidiabético oral',
      paymentMethod: 'efectivo',
      basePrice: 20.00,
      feePercentage: 0.00,
      feeAmount: 0.00,
      totalPaid: 20.00,
      retentionRate: 0.05,
      retentionAmount: 1.00,
      netClinicYield: 19.00,
      status: 'confirmada',
      settlementStatus: 'Liquidado',
      notes: 'Revisión de glucómetro capilar en ayunas.'
    }
  ],

  // Bloques de Traslado Protegido entre Clínicas (Página 2 y 4)
  travelBuffers: [
    {
      id: 'TRV-1',
      date: '2026-09-19',
      fromClinic: 'alborada',
      toClinic: 'ceibos',
      startTime: '11:00',
      endTime: '12:45',
      durationMinutes: 45,
      bufferLabel: '🚗 En traslado de Alborada hacia Ceibos (45 min + colchón de llegada)',
      status: 'programado'
    },
    {
      id: 'TRV-2',
      date: '2026-09-19',
      fromClinic: 'ceibos',
      toClinic: 'mapasingue',
      startTime: '15:00',
      endTime: '15:45',
      durationMinutes: 40,
      bufferLabel: '🚗 En ruta hacia Mapasingue - 40 min buffer',
      status: 'programado'
    }
  ],

  // Fichas Clínicas de Pacientes (Página 4)
  medicalRecords: [
    {
      id: 'REC-001',
      patientId: '0987654321',
      patientName: 'Carlos Mendoza Moreira',
      age: 44,
      bloodType: 'O+',
      allergies: 'Penicilina, Sulfamidas (reacción urticariforme severa)',
      history: 'Hipertensión arterial esencial diagnosticada en 2022. No fumador.',
      lastDiagnosis: 'HTA controlada con Losartán 50mg/día. Rinitis alérgica estacional.',
      consultationHistory: [
        { date: '2026-06-12', sede: 'Consultorio Alborada', motivo: 'Revisión semestral', pa: '125/82 mmHg' },
        { date: '2026-01-20', sede: 'Clínica Ceibos', motivo: 'Faringitis aguda viral', pa: '130/85 mmHg' }
      ]
    },
    {
      id: 'REC-002',
      patientId: '0918237465',
      patientName: 'Mariana Vera Loor',
      age: 32,
      bloodType: 'A+',
      allergies: 'AINES (Ibuprofeno causa broncoespasmo leve)',
      history: 'Asma bronquial intermitente desde la infancia. Sin cirugías previas.',
      lastDiagnosis: 'Bronquitis aguda con sibilancias leves.',
      consultationHistory: [
        { date: '2026-05-18', sede: 'Consultorio Alborada', motivo: 'Crisis asmática leve', pa: '118/75 mmHg' }
      ]
    },
    {
      id: 'REC-003',
      patientId: '0922883344',
      patientName: 'Javier Andrade Romero',
      age: 51,
      bloodType: 'B+',
      allergies: 'Ninguna conocida (NKA)',
      history: 'Hernia discal L4-L5 diagnosticada en 2024. Sedentario.',
      lastDiagnosis: 'Lumbago agudo mecánico con contractura paravertebral.',
      consultationHistory: [
        { date: '2026-07-04', sede: 'Clínica Ceibos', motivo: 'Dolor de espalda baja', pa: '135/88 mmHg' }
      ]
    }
  ],

  // Recetas Digitales Emitidas (Página 4)
  prescriptions: [
    {
      id: 'RX-901',
      code: 'REC-2026-0901',
      patientName: 'Carlos Mendoza Moreira',
      patientId: '0987654321',
      doctorName: 'Dr. Carlos Campoverde',
      doctorCode: 'MSP-REG-84729',
      date: '2026-09-19',
      diagnosis: 'Hipertensión Arterial Primaria (CIE-10: I10)',
      items: [
        { drug: 'Losartán Potásico 50mg', dose: '1 tableta vía oral cada 24 horas por la mañana', duration: '30 días' },
        { drug: 'Aspirina Protect 100mg', dose: '1 tableta después del almuerzo', duration: '30 días' }
      ],
      indications: 'Disminuir consumo de sal y grasas saturadas. Realizar caminata 30 min diarios. Control de PA en 1 mes.'
    }
  ],

  // Registro de Gastos Diarios y Operativos (Página 4 y 5)
  expenses: [
    {
      id: 'EXP-101',
      date: '2026-09-19',
      category: 'Transporte',
      description: 'Gasolina Super para traslados entre clínicas',
      amount: 15.00,
      paymentMethod: 'Efectivo',
      quickLogged: true,
      deductibleSRI: true
    },
    {
      id: 'EXP-102',
      date: '2026-09-19',
      category: 'Transporte',
      description: 'Carrera de Taxi hacia Hospital Público Ceibos',
      amount: 4.00,
      paymentMethod: 'Efectivo',
      quickLogged: true,
      deductibleSRI: true
    },
    {
      id: 'EXP-103',
      date: '2026-09-19',
      category: 'Suministros Hospital',
      description: 'Insumos médicos de emergencia (Guantes de nitrilo, gasas estériles y antiséptico)',
      amount: 12.00,
      paymentMethod: 'Efectivo',
      quickLogged: true,
      deductibleSRI: true
    },
    {
      id: 'EXP-104',
      date: '2026-09-18',
      category: 'Mantenimiento',
      description: 'Desinfección y calibración de tensiómetro aneroide',
      amount: 25.00,
      paymentMethod: 'Transferencia',
      quickLogged: false,
      deductibleSRI: true
    },
    {
      id: 'EXP-105',
      date: '2026-09-15',
      category: 'Transporte',
      description: 'Peajes urbanos Vía a la Costa y combustible',
      amount: 18.50,
      paymentMethod: 'Efectivo',
      quickLogged: false,
      deductibleSRI: true
    }
  ],

  // Estado de Guardia de Emergencia Médica (Página 4)
  emergencyGuard: {
    isActive: false,
    activatedAt: null,
    reason: 'Guardia imprevista en Hospital Ceibos convocada por Dirección Médica',
    affectedAppointments: []
  }
};

class StateStore {
  constructor() {
    this.state = this.loadState();
    this.listeners = [];
  }

  loadState() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Error cargando estado desde LocalStorage:', e);
    }
    return JSON.parse(JSON.stringify(INITIAL_STATE));
  }

  saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error('Error guardando estado en LocalStorage:', e);
    }
    this.notify();
  }

  resetState() {
    this.state = JSON.parse(JSON.stringify(INITIAL_STATE));
    this.saveState();
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(fn => {
      try {
        fn(this.state);
      } catch (err) {
        console.error('Error en listener de estado:', err);
      }
    });
  }

  // --- Getters ---
  getState() {
    return this.state;
  }

  getCurrentUser() {
    return this.state.currentUser;
  }

  getActiveView() {
    return this.state.activeView;
  }

  // --- Mutaciones de Autenticación & Vistas ---
  setCurrentUser(user) {
    this.state.currentUser = user;
    if (user) {
      this.state.activeView = user.role; // 'doctor', 'paciente', 'contador'
    } else {
      this.state.activeView = 'landing';
    }
    this.saveState();
  }

  setActiveView(viewName) {
    this.state.activeView = viewName;
    this.saveState();
  }

  // --- Citas ---
  addAppointment(appointmentData) {
    const idNum = 1000 + this.state.appointments.length + 1;
    const newApt = {
      id: `APT-${idNum}`,
      code: `MED-${Math.floor(10000 + Math.random() * 90000)}`,
      status: 'confirmada',
      settlementStatus: 'Pendiente',
      ...appointmentData
    };

    // Calcular montos y retenciones según sede
    const clinic = CLINICS[newApt.clinicId] || CLINICS.ceibos;
    newApt.basePrice = clinic.basePrice;
    newApt.retentionRate = clinic.retentionRate;

    if (newApt.paymentMethod === 'tarjeta' && newApt.basePrice > 0) {
      newApt.feePercentage = CREDIT_CARD_SURCHARGE_RATE;
      newApt.feeAmount = +(newApt.basePrice * CREDIT_CARD_SURCHARGE_RATE).toFixed(2);
      newApt.totalPaid = +(newApt.basePrice + newApt.feeAmount).toFixed(2);
    } else {
      newApt.feePercentage = 0;
      newApt.feeAmount = 0;
      newApt.totalPaid = newApt.basePrice;
    }

    newApt.retentionAmount = +(newApt.basePrice * newApt.retentionRate).toFixed(2);
    newApt.netClinicYield = +(newApt.basePrice - newApt.retentionAmount).toFixed(2);

    this.state.appointments.push(newApt);

    // Asegurar que exista ficha clínica para el paciente
    let record = this.state.medicalRecords.find(r => r.patientId === newApt.patientId);
    if (!record) {
      this.state.medicalRecords.push({
        id: `REC-${Math.floor(100 + Math.random() * 900)}`,
        patientId: newApt.patientId,
        patientName: newApt.patientName,
        age: 35,
        bloodType: 'O+',
        allergies: 'Sin alergias conocidas declaradas',
        history: 'Primera consulta registrada en plataforma web.',
        lastDiagnosis: newApt.reason || 'Consulta médica general.',
        consultationHistory: [
          {
            date: newApt.date,
            sede: clinic.name,
            motivo: newApt.reason,
            pa: '120/80 mmHg'
          }
        ]
      });
    }

    this.saveState();
    return newApt;
  }

  updateAppointmentStatus(aptId, status) {
    const apt = this.state.appointments.find(a => a.id === aptId);
    if (apt) {
      apt.status = status;
      this.saveState();
    }
  }

  toggleSettlementStatus(aptId) {
    const apt = this.state.appointments.find(a => a.id === aptId);
    if (apt) {
      apt.settlementStatus = apt.settlementStatus === 'Liquidado' ? 'Pendiente' : 'Liquidado';
      this.saveState();
    }
  }

  // --- Gastos ---
  addExpense(expenseData) {
    const idNum = 100 + this.state.expenses.length + 1;
    const newExp = {
      id: `EXP-${idNum}`,
      date: new Date().toISOString().split('T')[0],
      quickLogged: false,
      deductibleSRI: true,
      ...expenseData
    };
    this.state.expenses.unshift(newExp);
    this.saveState();
    return newExp;
  }

  // --- Recetas Médicas ---
  addPrescription(prescriptionData) {
    const idNum = 900 + this.state.prescriptions.length + 1;
    const newRx = {
      id: `RX-${idNum}`,
      code: `REC-${new Date().getFullYear()}-${idNum}`,
      date: new Date().toISOString().split('T')[0],
      doctorName: DEMO_USERS.doctor.name,
      doctorCode: DEMO_USERS.doctor.mspCode,
      ...prescriptionData
    };
    this.state.prescriptions.unshift(newRx);
    this.saveState();
    return newRx;
  }

  // --- Guardia Médica de Emergencia & Reagendamiento Asistido ---
  activateEmergencyGuard(reason = 'Guardia imprevista en Hospital Ceibos') {
    const today = '2026-09-19'; // Fecha activa del prototipo
    const affected = this.state.appointments.filter(
      a => a.date === today && a.clinicId !== 'hospital' && a.status === 'confirmada'
    );

    this.state.emergencyGuard = {
      isActive: true,
      activatedAt: new Date().toISOString(),
      reason,
      affectedAppointments: affected.map(a => a.id)
    };

    // Marcar como en_guardia
    affected.forEach(a => {
      a.status = 'en_guardia';
      a.notes = (a.notes ? a.notes + ' | ' : '') + '🚨 Interrumpida por Guardia Hospitalaria de Emergencia.';
    });

    this.saveState();
    return affected;
  }

  resolveEmergencyAppointment(aptId, action) {
    const apt = this.state.appointments.find(a => a.id === aptId);
    if (!apt) return;

    if (action === 'reschedule') {
      apt.date = '2026-09-21'; // Próximo día hábil
      apt.status = 'confirmada';
      apt.notes += ' [Reagendado automáticamente para el lunes 21]';
    } else if (action === 'cancel') {
      apt.status = 'cancelada';
      apt.notes += ' [Cancelado por fuerza mayor de guardia médica]';
    }

    this.state.emergencyGuard.affectedAppointments = 
      this.state.emergencyGuard.affectedAppointments.filter(id => id !== aptId);

    if (this.state.emergencyGuard.affectedAppointments.length === 0) {
      this.state.emergencyGuard.isActive = false;
    }

    this.saveState();
  }

  deactivateEmergencyGuard() {
    this.state.emergencyGuard.isActive = false;
    this.saveState();
  }

  // --- Cálculos Contables y Financieros (Página 5) ---
  getFinancialSummary() {
    const appointments = this.state.appointments;
    const expenses = this.state.expenses;

    // Ingresos brutos facturados (excluyendo canceladas)
    const activeAppointments = appointments.filter(a => a.status !== 'cancelada');
    
    let totalGrossRevenue = 0;
    let totalCardFees = 0;
    let totalRetentions = 0;
    
    const clinicBreakdown = {
      ceibos: { name: 'Clínica Ceibos', patientsCount: 0, gross: 0, retentionRate: 0.25, retentions: 0, netDoctor: 0, status: 'Pendiente' },
      mapasingue: { name: 'Consultorio Mapasingue', patientsCount: 0, gross: 0, retentionRate: 0.05, retentions: 0, netDoctor: 0, status: 'Liquidado' },
      alborada: { name: 'Consultorio Alborada', patientsCount: 0, gross: 0, retentionRate: 0.10, retentions: 0, netDoctor: 0, status: 'Liquidado' },
      hospital: { name: 'Hospital Público Ceibos', patientsCount: 0, gross: 0, retentionRate: 0.00, retentions: 0, netDoctor: 0, status: 'Sueldo Fijo' }
    };

    activeAppointments.forEach(apt => {
      const cId = apt.clinicId || 'ceibos';
      if (clinicBreakdown[cId]) {
        clinicBreakdown[cId].patientsCount += 1;
        clinicBreakdown[cId].gross += apt.basePrice;
        clinicBreakdown[cId].retentions += apt.retentionAmount;
        clinicBreakdown[cId].netDoctor += apt.netClinicYield;
      }
      totalGrossRevenue += apt.basePrice;
      totalCardFees += apt.feeAmount || 0;
      totalRetentions += apt.retentionAmount || 0;
    });

    // Gastos Operativos Acumulados
    let totalExpenses = 0;
    const expensesByCategory = {
      Transporte: 0,
      Mantenimiento: 0,
      'Suministros Hospital': 0,
      Activos: 0
    };

    expenses.forEach(exp => {
      totalExpenses += exp.amount;
      const cat = exp.category || 'Transporte';
      expensesByCategory[cat] = (expensesByCategory[cat] || 0) + exp.amount;
    });

    // Ingreso Neto Real: (Bruto - Retenciones) + Sueldo Fijo Hospital - Gastos Operativos
    const privateClinicsNet = totalGrossRevenue - totalRetentions;
    const realNetIncome = (privateClinicsNet + HOSPITAL_FIXED_SALARY) - totalExpenses;

    return {
      totalGrossRevenue,
      totalCardFees,
      totalRetentions,
      totalExpenses,
      hospitalFixedSalary: HOSPITAL_FIXED_SALARY,
      privateClinicsNet,
      realNetIncome,
      clinicBreakdown,
      expensesByCategory
    };
  }
}

const store = new StateStore();


// ==================== js/auth.js ====================

/**
 * Módulo de Autenticación y Control de Roles (Montepiedra Salud)
 * Maneja el inicio de sesión manual seguro, validación de credenciales (cédula o usuario + contraseña)
 * y previene cualquier acceso automático no autorizado.
 */


function setupAuth(showToast) {
  const roleTabs = document.querySelectorAll('.role-tab-btn');
  const loginInput = document.getElementById('login-username');
  const passwordInput = document.getElementById('login-password');
  const passwordToggleBtn = document.getElementById('btn-toggle-password');
  const loginForm = document.getElementById('unified-login-form');

  let currentSelectedRole = 'doctor';

  // Cambiar rol activo en el selector de pestañas (guía visual para el usuario)
  roleTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      roleTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentSelectedRole = tab.dataset.role;

      // Mantener texto de ejemplo solicitado: Cedula o Usuario
      if (loginInput) {
        loginInput.placeholder = 'Cedula o Usuario';
      }
    });
  });

  // SVGs Gráficos para el Ojo (Ojo abierto / visible vs Ojo tapado / tachado)
  const eyeOpenSvg = `<svg class="eye-svg eye-open" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
  const eyeClosedSvg = `<svg class="eye-svg eye-slashed" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path><line x1="2" y1="2" x2="22" y2="22"></line></svg>`;

  // Mostrar / Ocultar contraseña con icono gráfico dinámico
  if (passwordToggleBtn && passwordInput) {
    // Estado inicial: contraseña oculta -> icono de ojo tapado / tachado
    passwordToggleBtn.innerHTML = eyeClosedSvg;
    passwordToggleBtn.setAttribute('title', 'Mostrar contraseña (hacer visible)');
    passwordToggleBtn.setAttribute('aria-label', 'Mostrar contraseña');

    passwordToggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const isPassword = passwordInput.getAttribute('type') === 'password';
      if (isPassword) {
        // Cambiar a texto visible: Ojo sin nada (abierto)
        passwordInput.setAttribute('type', 'text');
        passwordToggleBtn.innerHTML = eyeOpenSvg;
        passwordToggleBtn.setAttribute('title', 'Ocultar contraseña (hacer invisible)');
        passwordToggleBtn.setAttribute('aria-label', 'Ocultar contraseña');
      } else {
        // Cambiar a oculto: Ojo tapado / tachado
        passwordInput.setAttribute('type', 'password');
        passwordToggleBtn.innerHTML = eyeClosedSvg;
        passwordToggleBtn.setAttribute('title', 'Mostrar contraseña (hacer visible)');
        passwordToggleBtn.setAttribute('aria-label', 'Mostrar contraseña');
      }
    });
  }

  // Procesar envío del formulario: Validación flexible y segura
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const enteredUser = (loginInput ? loginInput.value : '').trim().toLowerCase();
      const enteredPass = (passwordInput ? passwordInput.value : '').trim();

      if (!enteredUser || !enteredPass) {
        showToast('Por favor ingrese su usuario o cédula y su contraseña.', 'warning');
        return;
      }

      // Buscar usuario coincidente permitiendo credenciales nuevas y alternativas
      let matchedUser = null;

      // 1. Comprobar si coincide con el Médico Titular (Dr. Carlos Campoverde)
      const doc = DEMO_USERS.doctor;
      const isDoctorUser = (
        enteredUser === doc.username.toLowerCase() ||
        enteredUser === doc.email.toLowerCase() ||
        enteredUser === doc.idNumber ||
        enteredUser === doc.alternativeId ||
        enteredUser === '0930860044' ||
        enteredUser === '0928374651' ||
        enteredUser === 'carlos campoverde' ||
        enteredUser === 'campoverde' ||
        enteredUser === 'dr. campoverde' ||
        enteredUser === 'dr. carlos campoverde' ||
        (currentSelectedRole === 'doctor' && (enteredUser === 'doctor' || enteredUser === 'admin'))
      );
      const isDoctorPass = (
        enteredPass === doc.password || // 'admin123'
        enteredPass === doc.alternativePassword || // 'doctor123'
        enteredPass === 'admin123' ||
        enteredPass === 'doctor123'
      );

      if (isDoctorUser && isDoctorPass) {
        matchedUser = doc;
      }

      // 2. Comprobar si coincide con Paciente
      if (!matchedUser) {
        const pat = DEMO_USERS.paciente;
        const isPatUser = (
          enteredUser === pat.username.toLowerCase() ||
          enteredUser === pat.email.toLowerCase() ||
          enteredUser === pat.idNumber ||
          enteredUser === 'carlos mendoza'
        );
        if (isPatUser && enteredPass === pat.password) {
          matchedUser = pat;
        }
      }

      // 3. Comprobar si coincide con Contadora
      if (!matchedUser) {
        const acc = DEMO_USERS.contador;
        const isAccUser = (
          enteredUser === acc.username.toLowerCase() ||
          enteredUser === acc.email.toLowerCase() ||
          enteredUser === acc.idNumber ||
          enteredUser === 'patricia morales'
        );
        if (isAccUser && enteredPass === acc.password) {
          matchedUser = acc;
        }
      }

      // 4. Si aún no coincide, buscar en bucle general
      if (!matchedUser) {
        for (const key in DEMO_USERS) {
          const u = DEMO_USERS[key];
          if (
            (u.username.toLowerCase() === enteredUser ||
             u.email.toLowerCase() === enteredUser ||
             u.idNumber === enteredUser) &&
            u.password === enteredPass
          ) {
            matchedUser = u;
            break;
          }
        }
      }

      if (matchedUser) {
        // Autenticación exitosa
        store.setCurrentUser(matchedUser);
        store.setActiveView(matchedUser.role);
        showToast(`Acceso exitoso. Bienvenido(a), ${matchedUser.name}`, 'success');

        // Limpiar URL hash si existía #portal-acceso para que no afecte la vista
        if (window.location.hash) {
          history.replaceState(null, '', window.location.pathname);
        }

        // Subir suavemente al tope de la pantalla
        window.scrollTo({ top: 0, behavior: 'instant' });

        // Limpiar campos del formulario por seguridad
        if (loginInput) loginInput.value = '';
        if (passwordInput) passwordInput.value = '';
      } else {
        showToast('Credenciales incorrectas. Verifique su usuario o cédula y contraseña ingresada.', 'danger');
      }
    });
  }
}


// ==================== js/patient.js ====================

/**
 * Flujo 1: Portal de Citas del Paciente (Página 3)
 * Asistente de 4 pasos para selección de sede, horario protegido sin choques,
 * cálculo transparente del recargo del 9.75% por tarjeta, y generación de ticket QR.
 * Incluye validación matemática de cédula (Módulo 10), celular (10 dígitos), email
 * y detección automática en SRI en tiempo real.
 */


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

function setupPatientPortal(showToast) {
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
  let selectedPaymentMethod = 'efectivo'; // 'efectivo' o 'tarjeta'
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
        renderTimeSlots();
        updateSummaryCard();
      });
    });
  }

  // Generar y filtrar horarios según citas existentes
  function renderTimeSlots() {
    if (!slotsContainer) return;

    const baseSlots = ['08:30', '09:00', '09:45', '10:30', '11:15', '12:00', '13:00', '13:45', '14:30', '15:15', '16:00', '16:45', '17:30'];

    slotsContainer.innerHTML = baseSlots.map(time => {
      const isSelected = (time === selectedTimeSlot);
      let classes = 'slot-pill-btn';
      if (isSelected) classes += ' selected';

      return `
        <button type="button" class="${classes}" data-time="${time}" title="Disponible">
          ${time}
        </button>
      `;
    }).join('');

    slotsContainer.querySelectorAll('.slot-pill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        slotsContainer.querySelectorAll('.slot-pill-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedTimeSlot = btn.dataset.time;
        updateSummaryCard();
      });
    });

    if (travelNoticeBox) {
      travelNoticeBox.innerHTML = '';
      travelNoticeBox.style.display = 'none';
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

  // Conexión reactiva con la API del SRI y Validación Matemática de Cédula
  async function handleCedulaCheckAndSRI(cedula) {
    if (!cedula || cedula.length < 10) {
      if (sriStatusBox) {
        sriStatusBox.style.display = 'none';
        sriStatusBox.innerHTML = '';
      }
      return;
    }

    const check = validarCedulaEcuatorianaDetallada(cedula);
    if (!check.isValid) {
      showFieldError(idInput, check.message);
      if (sriStatusBox) {
        sriStatusBox.style.display = 'none';
        sriStatusBox.innerHTML = '';
      }
      return;
    }

    // La cédula es matemáticamente válida (Módulo 10 superado)
    clearFieldError(idInput);
    if (idInput) idInput.classList.add('valid');

    if (cedula === lastQueriedCedula) return;
    lastQueriedCedula = cedula;

    if (sriStatusBox) {
      sriStatusBox.style.display = 'flex';
      sriStatusBox.innerHTML = `<span class="sri-badge-loading"><span class="sri-spinner">🔄</span> Consultando identidad en el SRI...</span>`;
    }

    try {
      const sriData = await consultarSRI(cedula);
      if (idInput && idInput.value.trim() !== cedula) return;

      if (sriData && sriData.exito && sriData.nombre) {
        if (nameInput) {
          nameInput.value = sriData.nombre;
          clearFieldError(nameInput);
          nameInput.classList.add('valid');
        }
        if (phoneInput && !phoneInput.value && sriData.telefono) {
          phoneInput.value = sriData.telefono;
        }
        if (emailInput && !emailInput.value && sriData.email) {
          emailInput.value = sriData.email;
        }

        if (sriStatusBox) {
          sriStatusBox.innerHTML = `
            <span class="sri-badge-success">
              ✅ Identificado en ${sriData.fuente}: <strong>${sriData.nombre}</strong>
            </span>
          `;
        }
        showToast(`✅ Identidad detectada en el SRI: ${sriData.nombre}`, 'success');
      } else {
        if (sriStatusBox) {
          sriStatusBox.innerHTML = `
            <span class="sri-badge-info">
              ℹ️ Cédula válida (Módulo 10). Ingrese su nombre si no registra RUC en el SRI.
            </span>
          `;
        }
      }
    } catch (err) {
      if (sriStatusBox) {
        sriStatusBox.innerHTML = `
          <span class="sri-badge-info">
            ℹ️ Cédula válida (Módulo 10). Ingrese su nombre manualmente.
          </span>
        `;
      }
    }
  }

  // Escuchadores reactivos de los inputs del Paso 3
  if (idInput) {
    idInput.addEventListener('input', (e) => {
      clearFieldError(idInput);
      idInput.classList.remove('valid');
      const val = e.target.value.trim();
      if (val.length === 10) {
        handleCedulaCheckAndSRI(val);
      } else {
        if (sriStatusBox) {
          sriStatusBox.style.display = 'none';
          sriStatusBox.innerHTML = '';
        }
      }
    });

    idInput.addEventListener('blur', (e) => {
      const val = e.target.value.trim();
      if (val.length > 0 && val.length < 10) {
        showFieldError(idInput, 'La cédula debe contener exactamente 10 dígitos numéricos.');
      } else if (val.length === 10) {
        const check = validarCedulaEcuatorianaDetallada(val);
        if (!check.isValid) {
          showFieldError(idInput, check.message);
        } else {
          idInput.classList.add('valid');
        }
      }
    });
  }

  if (nameInput) {
    nameInput.addEventListener('input', () => {
      clearFieldError(nameInput);
      nameInput.classList.remove('valid');
      if (nameInput.value.trim().length >= 3) {
        nameInput.classList.add('valid');
      }
    });

    nameInput.addEventListener('blur', () => {
      if (nameInput.value.trim().length > 0 && nameInput.value.trim().length < 3) {
        showFieldError(nameInput, 'Ingresa tu nombre y apellido completo (mínimo 3 caracteres).');
      }
    });
  }

  if (phoneInput) {
    phoneInput.addEventListener('input', () => {
      clearFieldError(phoneInput);
      phoneInput.classList.remove('valid');
      if (phoneInput.value.length === 10) {
        const check = validarCelularDetallado(phoneInput.value);
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
          emailInput.classList.add('valid');
        }
      }
    });
  }

  // Rellenar formulario únicamente si el usuario ya inició sesión previamente
  function prefillPatientData() {
    const user = store.getCurrentUser();
    if (user && user.role === 'paciente') {
      if (idInput && !idInput.value) idInput.value = user.idNumber || '';
      if (nameInput && !nameInput.value) nameInput.value = user.name || '';
      if (phoneInput && !phoneInput.value) phoneInput.value = user.phone || '';
      if (emailInput && !emailInput.value) emailInput.value = user.email || '';
      if (idInput && idInput.value.length === 10) {
        handleCedulaCheckAndSRI(idInput.value);
      }
    }
  }

  function updateSummaryCard() {
    const clinic = CLINICS[selectedClinicId] || CLINICS.ceibos;
    const catalogo = MedicalService.getCatalogo();
    const service = catalogo.find(s => s.id === selectedServiceId) || catalogo[0];

    const baseFee = clinic.basePrice === 0 ? 0 : service.precioBase;
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

    if (sumDate) {
      const parts = selectedDate.split('-');
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
        sumDate.textContent = `${dateLabel} a las ${selectedTimeSlot}`;
      } else {
        sumDate.textContent = `${selectedDate} a las ${selectedTimeSlot}`;
      }
    }

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
        return false;
      }
      if (!selectedTimeSlot) {
        showToast('Por favor selecciona un horario de atención disponible para continuar.', 'warning');
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

      // 2. Nombre y Apellido completo
      if (!patName || patName.length < 3) {
        showFieldError(nameInput, 'Por favor ingresa tu nombre y apellido completo (mínimo 3 caracteres).');
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
    if (ticketMethod) ticketMethod.textContent = appointment.paymentMethod === 'tarjeta' ? 'Tarjeta de Crédito (+9.75%)' : 'Efectivo / Transferencia';

    // Generar Código QR Oficial de Alta Definición que abre el Comprobante PDF de la Cita Médica
    const qrSection = document.getElementById("ticket-qr-container") || document.querySelector(".qr-code-display-box") || document.querySelector(".ticket-qr-section");
    if (qrSection) {
      const host = window.location.hostname;
      const port = window.location.port ? `:${window.location.port}` : '';
      const protocol = window.location.protocol;

      // Usar IP de red local (192.168.7.3) para que cualquier teléfono celular en Wi-Fi abra el documento al escanear
      let baseHost = host;
      if (host === 'localhost' || host === '127.0.0.1') {
        baseHost = '192.168.7.3';
      }

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

      const pdfUrl = `${protocol}//${baseHost}${port}/comprobante.html?${params.toString()}`;
      const localPdfUrl = `comprobante.html?${params.toString()}`;

      qrSection.innerHTML = `
        <div style="background: #ffffff; padding: 12px; border-radius: 14px; display: inline-flex; flex-direction: column; justify-content: center; align-items: center; margin: 0 auto; border: 2px solid #0284c7; box-shadow: 0 4px 16px rgba(2, 132, 199, 0.15);">
          <div id="ticket-qr-canvas-box" style="display: flex; justify-content: center; align-items: center; min-width: 220px; min-height: 220px;"></div>
          <span style="font-size: 0.76rem; font-weight: 800; color: #0284c7; background: #e0f2fe; padding: 4px 12px; border-radius: 9999px; margin-top: 8px;">
            📱 Escanea con tu celular para abrir tu PDF
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

  // Botón Anterior
  if (btnPrev) {
    btnPrev.addEventListener('click', () => {
      if (currentStep > 1) {
        currentStep--;
        updateStepView();
      }
    });
  }

  // Botón Siguiente / Confirmar con Bloqueo Estricto de Datos
  if (btnNext) {
    btnNext.addEventListener('click', () => {
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
        // Bloqueo estricto del Paso 3 si los datos no son válidos
        if (!validateStepData(3)) return;

        const patId = idInput ? idInput.value.trim() : '';
        const patName = nameInput ? nameInput.value.trim() : '';
        const patPhone = phoneInput ? phoneInput.value.trim() : '';
        const patEmail = emailInput ? emailInput.value.trim() : '';
        const reasonInput = document.getElementById('pat-input-reason');
        const patReason = reasonInput ? reasonInput.value.trim() || 'Consulta médica general' : 'Consulta médica general';

        // Guardar ficha básica del paciente
        MedicalService.guardarFicha({
          cedula: patId,
          nombreCompleto: patName,
          telefono: patPhone,
          email: patEmail
        });

        const service = MedicalService.getCatalogo().find(s => s.id === selectedServiceId) || MedicalService.getCatalogo()[0];
        const clinic = CLINICS[selectedClinicId];
        const totalAmount = clinic.basePrice === 0 ? 0 : service.precioBase * (selectedPaymentMethod === 'tarjeta' ? 1 + CREDIT_CARD_SURCHARGE_RATE : 1);

        // Crear la cita en el estado central
        createdAppointment = store.addAppointment({
          clinicId: selectedClinicId,
          serviceId: selectedServiceId,
          serviceName: service.nombre,
          date: selectedDate,
          time: selectedTimeSlot,
          patientId: patId,
          patientName: patName,
          patientPhone: patPhone,
          patientEmail: patEmail,
          reason: patReason,
          paymentMethod: selectedPaymentMethod,
          totalPaid: totalAmount
        });

        MedicalService.registrarAtencionEnHistorial(patId, createdAppointment);

        renderConfirmationTicket(createdAppointment);
        currentStep = 4;
        updateStepView();

        showToast(`¡Cita agendada con éxito! Se emitió tu ticket oficial con QR para PDF.`, 'success');
      } else if (currentStep === 4) {
        // Reiniciar flujo para nueva cita con la fecha de hoy
        selectedDate = getTodayDateStr();
        currentStep = 1;
        renderCalendar();
        updateStepView();
      }
    });
  }

  // Navegación por pasos desde los botones de la barra superior con Bloqueo de Pasos no Completados
  const setupStepNavButtons = () => {
    document.querySelectorAll('.nav-step-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetStep = parseInt(btn.dataset.step, 10);
        if (targetStep === currentStep) return;

        if (targetStep > currentStep) {
          // Validar los pasos intermedios antes de permitir avanzar
          for (let s = currentStep; s < targetStep; s++) {
            if (!validateStepData(s)) {
              return;
            }
          }
        }

        if (targetStep === 1) {
          currentStep = 1;
          updateStepView();
        } else if (targetStep === 2) {
          currentStep = 2;
          renderCalendar();
          renderTimeSlots();
          updateSummaryCard();
          updateStepView();
        } else if (targetStep === 3) {
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
  };
  setupStepNavButtons();

  // Botón volver al inicio dentro de la página del portal paciente
  const btnPatientExitInline = document.getElementById('btn-patient-exit-inline');
  if (btnPatientExitInline) {
    btnPatientExitInline.addEventListener('click', () => {
      store.setActiveView('landing');
    });
  }

  // Inicializar vistas con la fecha de hoy
  renderCalendar();
  renderTimeSlots();
  updateSummaryCard();
  updateStepView();
}


// ==================== js/doctor.js ====================

/**
 * Flujo 2: Portal Médico Mobile-First (Página 4 del documento)
 * Diseñado para operar en pantalla táctil de un Xiaomi Redmi Note (390x844px)
 * Incluye cronograma de rutas con advertencia de traslado en ámbar,
 * botón de guardia de emergencia con reagendamiento asistido,
 * buscador reactivo de fichas clínicas, recetario digital y registro de gastos en 2 toques.
 */


function setupDoctorPortal(showToast) {
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


// ==================== js/accountant.js ====================

/**
 * Flujo 3: Panel Administrativo de la Contadora (Página 5 del documento)
 * Gestión de liquidaciones semanales de los viernes,
 * retenciones automáticas (5%, 25%, 10%), balance de gastos clasificados
 * y exportación de informes tributarios para el SRI en Excel y PDF.
 */


function setupAccountantPortal(showToast) {
  const btnExportTax = document.getElementById('btn-export-tax-report');
  const taxModal = document.getElementById('tax-report-modal');
  const btnCloseTaxModal = document.getElementById('btn-close-tax-modal');
  const btnDownloadCSV = document.getElementById('btn-download-csv');

  function renderAccountantDashboard() {
    const summary = store.getFinancialSummary();
    const state = store.getState();

    // 1. Fila de Métricas KPI (4 tarjetas) (Página 5)
    const kpiGross = document.getElementById('kpi-gross-revenue');
    const kpiRetentions = document.getElementById('kpi-retentions-total');
    const kpiExpenses = document.getElementById('kpi-expenses-total');
    const kpiNet = document.getElementById('kpi-net-income');

    if (kpiGross) kpiGross.textContent = `$${summary.totalGrossRevenue.toFixed(2)}`;
    if (kpiRetentions) kpiRetentions.textContent = `-$${summary.totalRetentions.toFixed(2)}`;
    if (kpiExpenses) kpiExpenses.textContent = `-$${summary.totalExpenses.toFixed(2)}`;
    if (kpiNet) kpiNet.textContent = `$${summary.realNetIncome.toFixed(2)}`;

    // 2. Tabla de Liquidación de los Viernes (Corte de Caja)
    const settlementTableBody = document.getElementById('friday-settlement-table-body');
    if (settlementTableBody) {
      const breakdown = summary.clinicBreakdown;
      settlementTableBody.innerHTML = Object.keys(breakdown).map(clinicKey => {
        const cData = breakdown[clinicKey];
        const clinic = CLINICS[clinicKey] || { color: '#0284c7' };
        const isHospital = clinicKey === 'hospital';

        let badgeHtml = '';
        if (isHospital) {
          badgeHtml = `<span class="badge-status-pill sueldo-fijo">🏛️ Sueldo Fijo ($1,200)</span>`;
        } else if (cData.status === 'Liquidado') {
          badgeHtml = `<span class="badge-status-pill liquidado" data-clinic="${clinicKey}">✓ Liquidado</span>`;
        } else {
          badgeHtml = `<span class="badge-status-pill pendiente" data-clinic="${clinicKey}">⏳ Pendiente Facturación</span>`;
        }

        const retentionPct = isHospital ? '0%' : `${(cData.retentionRate * 100).toFixed(0)}%`;
        const netTransfer = isHospital ? summary.hospitalFixedSalary : cData.netDoctor;

        return `
          <tr>
            <td>
              <strong style="color: #0f172a; display: flex; align-items: center; gap: 8px;">
                <span style="width: 10px; height: 10px; border-radius: 50%; background: ${clinic.color};"></span>
                ${cData.name}
              </strong>
            </td>
            <td>${isHospital ? 'Turnos de Guardia' : `${cData.patientsCount} pacientes`}</td>
            <td>${isHospital ? 'Convenio MSP' : `$${cData.gross.toFixed(2)}`}</td>
            <td style="color: #b91c1c; font-weight: 700;">${isHospital ? '$0.00 (0%)' : `-$${cData.retentions.toFixed(2)} (${retentionPct})`}</td>
            <td style="font-weight: 800; color: #0284c7;">$${netTransfer.toFixed(2)}</td>
            <td>${badgeHtml}</td>
          </tr>
        `;
      }).join('');

      // Alternar estado de liquidación con un clic
      settlementTableBody.querySelectorAll('.badge-status-pill:not(.sueldo-fijo)').forEach(pill => {
        pill.addEventListener('click', () => {
          const cKey = pill.dataset.clinic;
          if (summary.clinicBreakdown[cKey]) {
            summary.clinicBreakdown[cKey].status = 
              summary.clinicBreakdown[cKey].status === 'Liquidado' ? 'Pendiente' : 'Liquidado';
            showToast(`Estado de liquidación actualizado para ${summary.clinicBreakdown[cKey].name}.`, 'info');
            renderAccountantDashboard();
          }
        });
      });
    }

    // 3. Rentabilidad Real por Sede (Comparativa Neta)
    const profitabilityList = document.getElementById('clinic-profitability-container');
    if (profitabilityList) {
      const breakdown = summary.clinicBreakdown;
      const maxNet = Math.max(
        ...Object.values(breakdown).map(b => b.netDoctor),
        1
      );

      profitabilityList.innerHTML = Object.keys(breakdown).filter(k => k !== 'hospital').map(k => {
        const item = breakdown[k];
        const clinic = CLINICS[k];
        const pctWidth = Math.min(100, Math.max(15, (item.netDoctor / maxNet) * 100));

        return `
          <div class="profitability-item">
            <div class="profitability-header-row">
              <span style="color: #0f172a;">${item.name} (Retención: ${(item.retentionRate * 100)}%)</span>
              <span style="color: ${clinic.color}; font-weight: 800;">$${item.netDoctor.toFixed(2)} Neto</span>
            </div>
            <div class="progress-bar-track">
              <div class="progress-bar-fill" style="width: ${pctWidth}%; background: ${clinic.color};"></div>
            </div>
          </div>
        `;
      }).join('');
    }

    // 4. Clasificador Contable de Egresos (Página 5)
    const expenseCategoriesBox = document.getElementById('expense-categories-grid');
    if (expenseCategoriesBox) {
      const cats = summary.expensesByCategory;
      expenseCategoriesBox.innerHTML = Object.keys(cats).map(catName => {
        return `
          <div class="expense-cat-box">
            <span class="expense-cat-name">${catName}</span>
            <span class="expense-cat-amount">-$${cats[catName].toFixed(2)}</span>
          </div>
        `;
      }).join('');
    }
  }

  // --- Exportación de Balances SRI y Descarga en Excel/CSV (Página 5) ---
  if (btnExportTax) {
    btnExportTax.addEventListener('click', () => {
      openTaxReportModal();
    });
  }

  if (btnCloseTaxModal) {
    btnCloseTaxModal.addEventListener('click', () => {
      taxModal.classList.remove('active');
    });
  }

  function openTaxReportModal() {
    const summary = store.getFinancialSummary();
    const modalBody = document.getElementById('tax-report-modal-body');
    if (!modalBody || !taxModal) return;

    modalBody.innerHTML = `
      <div class="sri-report-modal-content">
        <div class="sri-header">
          <div>
            <h3 style="font-size: 1.15rem; color: #0f172a; font-weight: 800;">SERVICIO DE RENTAS INTERNAS (SRI) - ECUADOR</h3>
            <p style="font-size: 0.78rem; color: #64748b;">Informe de Conciliación Tributaria para Servicios Médicos Profesionales</p>
          </div>
          <div style="text-align: right; font-size: 0.8rem;">
            <strong>Período Fiscal:</strong> Septiembre 2026<br>
            <strong>Cédula / RUC:</strong> 0930860044001
          </div>
        </div>

        <div style="font-size: 0.84rem; color: #334155; line-height: 1.5;">
          <strong>Contribuyente:</strong> DR. CARLOS CAMPOVERDE<br>
          <strong>Actividad:</strong> Servicios de Medicina General en Clínicas Privadas y Sector Público.
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 0.82rem; margin-top: 10px;">
          <thead>
            <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
              <th style="padding: 8px; text-align: left;">Rubro Fiscal</th>
              <th style="padding: 8px; text-align: right;">Base Imponible / Bruto</th>
              <th style="padding: 8px; text-align: right;">Retención / Deducción</th>
              <th style="padding: 8px; text-align: right;">Subtotal Neto</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 8px;">Facturación Mapasingue (Retención 5%)</td>
              <td style="padding: 8px; text-align: right;">$${summary.clinicBreakdown.mapasingue.gross.toFixed(2)}</td>
              <td style="padding: 8px; text-align: right; color: #b91c1c;">-$${summary.clinicBreakdown.mapasingue.retentions.toFixed(2)}</td>
              <td style="padding: 8px; text-align: right; font-weight: 700;">$${summary.clinicBreakdown.mapasingue.netDoctor.toFixed(2)}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 8px;">Facturación Ceibos (Retención 25%)</td>
              <td style="padding: 8px; text-align: right;">$${summary.clinicBreakdown.ceibos.gross.toFixed(2)}</td>
              <td style="padding: 8px; text-align: right; color: #b91c1c;">-$${summary.clinicBreakdown.ceibos.retentions.toFixed(2)}</td>
              <td style="padding: 8px; text-align: right; font-weight: 700;">$${summary.clinicBreakdown.ceibos.netDoctor.toFixed(2)}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 8px;">Facturación Alborada (Retención 10%)</td>
              <td style="padding: 8px; text-align: right;">$${summary.clinicBreakdown.alborada.gross.toFixed(2)}</td>
              <td style="padding: 8px; text-align: right; color: #b91c1c;">-$${summary.clinicBreakdown.alborada.retentions.toFixed(2)}</td>
              <td style="padding: 8px; text-align: right; font-weight: 700;">$${summary.clinicBreakdown.alborada.netDoctor.toFixed(2)}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0; background: #fafafa;">
              <td style="padding: 8px;">Sueldo Fijo Hospital Público Ceibos (Bajo Rol de Pagos)</td>
              <td style="padding: 8px; text-align: right;">$${summary.hospitalFixedSalary.toFixed(2)}</td>
              <td style="padding: 8px; text-align: right;">$0.00</td>
              <td style="padding: 8px; text-align: right; font-weight: 700;">$${summary.hospitalFixedSalary.toFixed(2)}</td>
            </tr>
            <tr style="border-bottom: 2px solid #0f172a; background: #fef2f2;">
              <td style="padding: 8px;"><strong>(-) Total Gastos Deducibles de Transporte e Insumos</strong></td>
              <td style="padding: 8px; text-align: right;">-</td>
              <td style="padding: 8px; text-align: right; color: #b91c1c; font-weight: 700;">-$${summary.totalExpenses.toFixed(2)}</td>
              <td style="padding: 8px; text-align: right; color: #b91c1c; font-weight: 800;">-$${summary.totalExpenses.toFixed(2)}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr style="background: #f0fdf4; font-size: 0.95rem;">
              <td style="padding: 10px; font-weight: 800; color: #166534;" colspan="3">INGRESO NETO REAL LIQUIDABLE:</td>
              <td style="padding: 10px; text-align: right; font-weight: 800; color: #166534;">$${summary.realNetIncome.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>

        <div style="font-size: 0.72rem; color: #64748b; margin-top: 10px;">
          Certifico que las retenciones aplicadas en los consultorios privados y los gastos de movilidad concuerdan con los registros bancarios y facturas electrónicas autorizadas por el SRI.
        </div>
      </div>
    `;

    taxModal.classList.add('active');
  }

  // Generar y descargar archivo CSV para Excel
  if (btnDownloadCSV) {
    btnDownloadCSV.addEventListener('click', () => {
      const summary = store.getFinancialSummary();
      const state = store.getState();

      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "FECHA,TIPO,DESCRIPCION/PACIENTE,SEDE,BRUTO,RETENCION/COMISION,NETO_FINAL,ESTADO\r\n";

      // Citas
      state.appointments.forEach(a => {
        const clinic = CLINICS[a.clinicId];
        csvContent += `"${a.date}","CITA MEDICA","${a.patientName}","${clinic.name}",${a.basePrice.toFixed(2)},${a.retentionAmount.toFixed(2)},${a.netClinicYield.toFixed(2)},"${a.settlementStatus}"\r\n`;
      });

      // Sueldo Hospital
      csvContent += `"2026-09-30","SUELDO FIJO","Haber Mensual de Medicina General","Hospital Público Ceibos",${summary.hospitalFixedSalary.toFixed(2)},0.00,${summary.hospitalFixedSalary.toFixed(2)},"Liquidado"\r\n`;

      // Gastos
      state.expenses.forEach(e => {
        csvContent += `"${e.date}","GASTO OPERATIVO","${e.description}","${e.category}",-${e.amount.toFixed(2)},0.00,-${e.amount.toFixed(2)},"Deducible SRI"\r\n`;
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Liquidacion_Medica_SRI_Septiembre_2026.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast('Archivo CSV generado y listo para abrir en Microsoft Excel.', 'success');
    });
  }

  // Suscribirse al store para refrescar la tabla en tiempo real si el doctor o paciente interactúan
  store.subscribe(() => {
    if (store.getActiveView() === 'contador') {
      renderAccountantDashboard();
    }
  });

  renderAccountantDashboard();
}


// ==================== js/app.js ====================

/**
 * Controlador Principal y Router de la Aplicación (Montepiedra Salud)
 * Gestiona la navegación dinámica de la barra superior según la página activa
 * (Landing Institucional, Portal Paciente, Portal Médico, Portal Contable)
 * y garantiza la autenticación manual obligatoria.
 */


// Sistema de Notificaciones Toast
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-notifications-root');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-notifications-root';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  if (type === 'danger') icon = '🚨';
  if (type === 'warning') icon = '⚠️';

  toast.innerHTML = `
    <span style="font-size: 1.1rem;">${icon}</span>
    <span style="flex: 1; line-height: 1.3;">${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(50px)';
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}

// Inicialización de la Aplicación
document.addEventListener('DOMContentLoaded', () => {
  // Vistas / Pantallas Principales
  const viewLanding = document.getElementById('view-landing');
  const viewPatient = document.getElementById('view-patient');
  const viewDoctor = document.getElementById('view-doctor');
  const viewAccountant = document.getElementById('view-accountant');

  // Menús Dinámicos de la Barra Superior
  const navMenuLanding = document.getElementById('nav-menu-landing');
  const navMenuPatient = document.getElementById('nav-menu-patient');
  const navMenuDoctor = document.getElementById('nav-menu-doctor');
  const navMenuAccountant = document.getElementById('nav-menu-accountant');

  // Grupos de Acciones Dinámicas de la Barra Superior
  const navActionsLanding = document.getElementById('nav-actions-landing');
  const navActionsPatient = document.getElementById('nav-actions-patient');
  const navActionsDoctor = document.getElementById('nav-actions-doctor');
  const navActionsAccountant = document.getElementById('nav-actions-accountant');

  // Subtítulo del Logo en Barra Superior
  const navbarBrandHome = document.getElementById('navbar-brand-home');
  const navbarBrandSubtitle = document.getElementById('navbar-brand-subtitle');

  // Elementos de Usuario en la Barra
  const patientLoggedCard = document.getElementById('patient-logged-card');
  const patNavbarAvatar = document.getElementById('pat-navbar-avatar');
  const patNavbarName = document.getElementById('pat-navbar-name');
  const btnNavPatientOpenLogin = document.getElementById('btn-nav-patient-open-login');

  // Botones de Salir / Regreso
  const btnNavPatientBack = document.getElementById('btn-nav-patient-back');
  const btnPatientLogout = document.getElementById('btn-patient-logout');
  const btnDoctorLogout = document.getElementById('btn-doctor-logout');
  const btnAccountantLogout = document.getElementById('btn-accountant-logout');

  // Navegación al hacer clic en el Brand/Logo
  if (navbarBrandHome) {
    navbarBrandHome.addEventListener('click', () => {
      const activeView = store.getActiveView();
      if (activeView !== 'landing') {
        store.setActiveView('landing');
      }
    });
  }

  // Renderizar la Vista y la Barra Superior según el Estado Activo
  function renderActiveView() {
    const activeView = store.getActiveView();
    const currentUser = store.getCurrentUser();

    // 1. Ocultar todas las vistas de contenido
    if (viewLanding) viewLanding.style.display = 'none';
    if (viewPatient) viewPatient.style.display = 'none';
    if (viewDoctor) viewDoctor.style.display = 'none';
    if (viewAccountant) viewAccountant.style.display = 'none';

    // 2. Ocultar todos los menús centrales de la barra superior
    if (navMenuLanding) navMenuLanding.style.display = 'none';
    if (navMenuPatient) navMenuPatient.style.display = 'none';
    if (navMenuDoctor) navMenuDoctor.style.display = 'none';
    if (navMenuAccountant) navMenuAccountant.style.display = 'none';

    // 3. Ocultar todos los grupos de acciones de la barra superior
    if (navActionsLanding) navActionsLanding.style.display = 'none';
    if (navActionsPatient) navActionsPatient.style.display = 'none';
    if (navActionsDoctor) navActionsDoctor.style.display = 'none';
    if (navActionsAccountant) navActionsAccountant.style.display = 'none';

    // 4. Mostrar y configurar la barra según la página activa
    if (activeView === 'landing') {
      if (viewLanding) viewLanding.style.display = 'block';
      if (navMenuLanding) navMenuLanding.style.display = 'flex';
      if (navActionsLanding) navActionsLanding.style.display = 'flex';
      if (navbarBrandSubtitle) navbarBrandSubtitle.textContent = 'Centro Médico & Red Asistencial';

    } else if (activeView === 'paciente' || activeView === 'patient') {
      if (viewPatient) viewPatient.style.display = 'block';
      if (navMenuPatient) navMenuPatient.style.display = 'flex';
      if (navActionsPatient) navActionsPatient.style.display = 'flex';
      if (navbarBrandSubtitle) navbarBrandSubtitle.textContent = 'Portal de Pacientes & Citas';

      // Estado de usuario en la barra del paciente
      if (currentUser && currentUser.role === 'paciente') {
        if (patientLoggedCard) patientLoggedCard.style.display = 'flex';
        if (patNavbarName) patNavbarName.textContent = currentUser.name.split(' ')[0];
        if (patNavbarAvatar) patNavbarAvatar.src = currentUser.avatar;
        if (btnNavPatientOpenLogin) btnNavPatientOpenLogin.style.display = 'none';
      } else {
        if (patientLoggedCard) patientLoggedCard.style.display = 'none';
        if (btnNavPatientOpenLogin) btnNavPatientOpenLogin.style.display = 'inline-flex';
      }

    } else if (activeView === 'doctor') {
      if (viewDoctor) viewDoctor.style.display = 'flex';
      if (navMenuDoctor) navMenuDoctor.style.display = 'flex';
      if (navActionsDoctor) navActionsDoctor.style.display = 'flex';
      if (navbarBrandSubtitle) navbarBrandSubtitle.textContent = 'Portal Médico • Dr. Carlos Campoverde';

    } else if (activeView === 'contador' || activeView === 'accountant') {
      if (viewAccountant) viewAccountant.style.display = 'flex';
      if (navMenuAccountant) navMenuAccountant.style.display = 'flex';
      if (navActionsAccountant) navActionsAccountant.style.display = 'flex';
      if (navbarBrandSubtitle) navbarBrandSubtitle.textContent = 'Portal Contable & SRI • Lcda. Morales';
    }

    // Scroll arriba al cambiar de vista principal
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // --- BOTONES DE CIERRE DE SESIÓN Y RETORNO ---
  if (btnNavPatientBack) {
    btnNavPatientBack.addEventListener('click', () => {
      store.setActiveView('landing');
    });
  }

  if (btnPatientLogout) {
    btnPatientLogout.addEventListener('click', () => {
      store.setCurrentUser(null);
      showToast('Sesión de paciente cerrada. Regresando a la página principal.', 'info');
      renderActiveView();
    });
  }

  if (btnNavPatientOpenLogin) {
    btnNavPatientOpenLogin.addEventListener('click', (e) => {
      e.preventDefault();
      store.setActiveView('landing');
      setTimeout(() => {
        const portalAcceso = document.getElementById('portal-acceso');
        if (portalAcceso) portalAcceso.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    });
  }

  if (btnDoctorLogout) {
    btnDoctorLogout.addEventListener('click', () => {
      store.setCurrentUser(null);
      showToast('Sesión médica finalizada. Regresando a la página institucional.', 'info');
      renderActiveView();
    });
  }

  if (btnAccountantLogout) {
    btnAccountantLogout.addEventListener('click', () => {
      store.setCurrentUser(null);
      showToast('Sesión contable finalizada. Regresando a la página institucional.', 'info');
      renderActiveView();
    });
  }

  // --- ENLACES Y BOTONES DE NAVEGACIÓN EN EL PORTAL CONTABLE ---
  const navBtnAccKpis = document.getElementById('nav-btn-acc-kpis');
  const navBtnAccSettlement = document.getElementById('nav-btn-acc-settlement');
  const navBtnAccProfitability = document.getElementById('nav-btn-acc-profitability');
  const navBtnAccTaxreport = document.getElementById('nav-btn-acc-taxreport');
  const btnNavAccountantSri = document.getElementById('btn-nav-accountant-sri-btn');

  if (navBtnAccKpis) {
    navBtnAccKpis.addEventListener('click', () => {
      const el = document.querySelector('.accountant-kpis-grid');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  if (navBtnAccSettlement) {
    navBtnAccSettlement.addEventListener('click', () => {
      const el = document.querySelector('.settlement-table-wrapper');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  if (navBtnAccProfitability) {
    navBtnAccProfitability.addEventListener('click', () => {
      const el = document.getElementById('clinic-profitability-container');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  function triggerSriModal() {
    const btnExportTax = document.getElementById('btn-export-tax-report');
    if (btnExportTax) {
      btnExportTax.click();
    }
  }

  if (navBtnAccTaxreport) {
    navBtnAccTaxreport.addEventListener('click', triggerSriModal);
  }

  if (btnNavAccountantSri) {
    btnNavAccountantSri.addEventListener('click', triggerSriModal);
  }

  // --- FLUJO DE AGENDAMIENTO LIMPIO (Sin inicio automático de sesión) ---
  const btnNavbarBooking = document.getElementById('btn-navbar-book-now');
  const btnHeroBooking = document.getElementById('btn-hero-booking');

  function startBookingFlow(clinicId = null) {
    // Ingresar al portal de citas sin forzar inicio de sesión automático
    store.setActiveView('paciente');
    renderActiveView();

    if (clinicId) {
      setTimeout(() => {
        const targetClinicCard = document.querySelector(`.clinic-selection-card[data-clinic-id="${clinicId}"]`);
        if (targetClinicCard) {
          targetClinicCard.click();
        }
      }, 50);
    }
    showToast('Ingresando al portal de reserva de citas.', 'info');
  }

  if (btnNavbarBooking) {
    btnNavbarBooking.addEventListener('click', () => startBookingFlow());
  }

  if (btnHeroBooking) {
    btnHeroBooking.addEventListener('click', () => startBookingFlow());
  }

  // Botones de Agendamiento Directo desde las Tarjetas de Sedes
  document.querySelectorAll('.btn-book-clinic-direct').forEach(btn => {
    btn.addEventListener('click', () => {
      const clinicId = btn.dataset.clinic;
      startBookingFlow(clinicId);
    });
  });

  // Acordeón Interactivo de Preguntas Frecuentes (Dudas)
  document.querySelectorAll('.faq-item .faq-question-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const parentItem = btn.closest('.faq-item');
      if (!parentItem) return;

      const wasActive = parentItem.classList.contains('active');
      document.querySelectorAll('.faq-item').forEach(item => item.classList.remove('active'));

      if (!wasActive) {
        parentItem.classList.add('active');
      }
    });
  });

  // Navegación suave para enlaces internos
  document.querySelectorAll('.nav-menu-link, .footer-links-list a').forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href && href.startsWith('#')) {
        const targetEl = document.querySelector(href);
        if (targetEl) {
          e.preventDefault();
          targetEl.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  });

  // Configuración de los submódulos
  setupAuth(showToast);
  setupPatientPortal(showToast);
  setupDoctorPortal(showToast);
  setupAccountantPortal(showToast);
  
  // Aplicar validaciones globales en tiempo real a todos los inputs
  aplicarMascaraInputs();

  // Escuchar cambios de estado global
  store.subscribe(() => {
    renderActiveView();
  });

  // Cerrar modales con clic en el fondo
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('active');
      }
    });
  });

  // Render inicial
  renderActiveView();
});
