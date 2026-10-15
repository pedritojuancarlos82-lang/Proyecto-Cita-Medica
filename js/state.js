/**
 * SaaS Médico Multisede - Estado Central Reactivo
 * Mantiene la persistencia en LocalStorage y sincroniza eventos entre Paciente, Médico y Contadora.
 */

const STORAGE_KEY = 'saas_medico_multisede_v2';

// Catálogo de Sedes y Reglas Financieras (Página 2, 3 y 5)
export const CLINICS = {
  ceibos: {
    id: 'ceibos',
    name: 'Clínica Ceibos',
    type: 'Consultorio Privado',
    consultorio: 'Consultorio 2',
    address: 'Av. del Bombero, Edificio Ceibos Plaza, Piso 3',
    realCost: 20.00,
    listPrice: 21.95, // 9.75% sobre costo real
    basePrice: 20.00, // Tarifa base neta de consulta
    retentionRate: 0.25, // 25% retención clínica ($5.00 sobre base)
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
    realCost: 20.00,
    listPrice: 21.95, // 9.75% sobre costo real
    basePrice: 20.00, // Tarifa base neta de consulta
    retentionRate: 0.05, // 5% retención clínica ($1.00 sobre base)
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
    realCost: 20.00,
    listPrice: 21.95, // 9.75% sobre costo real
    basePrice: 20.00, // Tarifa base neta de consulta
    retentionRate: 0.10, // 10% retención clínica ($2.00 sobre base)
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
    realCost: 0.00,
    listPrice: 0.00,
    basePrice: 0.00, // Gratuito
    retentionRate: 0.00, // 0% retención clínica (convenio institucional)
    color: '#f59e0b', // Naranja Hospital
    badgeClass: 'badge-hospital',
    image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=600&auto=format&fit=crop&q=80'
  }
};

// Reglas de Retención Contractual Oficiales por Sede (Semana 4 - Parte 4)
export const RETENTION_RULES = {
  ceibos: { rate: 0.25, name: 'Clínica Ceibos', label: '25% Deducción Consultorio' },
  alborada: { rate: 0.10, name: 'Sede Alborada', label: '10% Deducción Consultorio' },
  mapasingue: { rate: 0.05, name: 'Sede Mapasingue', label: '5% Deducción Consultorio' },
  hospital: { rate: 0.00, name: 'Hospital Público Ceibos', label: '0% (Convenio Institucional)' }
};

// Catálogo de Períodos Semanales de Corte Financiero (Semana 4 - Parte 4)
export const SETTLEMENT_PERIODS = [
  {
    key: 'SEM-ACTIVA',
    name: 'Semana Activa (En Curso)',
    startDate: '2026-10-15',
    endDate: '2026-10-21',
    label: 'Semana Activa (15 Oct - 21 Oct 2026)'
  },
  {
    key: 'SEM-4',
    name: 'Semana 4 (08 Oct - 14 Oct 2026)',
    startDate: '2026-10-08',
    endDate: '2026-10-14',
    label: 'Semana 4: 08 Oct - 14 Oct 2026'
  },
  {
    key: 'SEM-3',
    name: 'Semana 3 (01 Oct - 07 Oct 2026)',
    startDate: '2026-10-01',
    endDate: '2026-10-07',
    label: 'Semana 3: 01 Oct - 07 Oct 2026'
  },
  {
    key: 'SEM-2',
    name: 'Semana 2 (24 Sep - 30 Sep 2026)',
    startDate: '2026-09-24',
    endDate: '2026-09-30',
    label: 'Semana 2: 24 Sep - 30 Sep 2026'
  },
  {
    key: 'SEM-1',
    name: 'Semana 1 (17 Sep - 23 Sep 2026)',
    startDate: '2026-09-15',
    endDate: '2026-09-21',
    label: 'Semana 1: 15 Sep - 21 Sep 2026'
  },
  {
    key: 'TODAS',
    name: 'Consolidado General (Todas las semanas)',
    startDate: '2026-09-01',
    endDate: '2026-10-31',
    label: 'Consolidado General (Septiembre - Octubre 2026)'
  }
];

// Salario Fijo Mensual del Doctor en el Hospital Público
export const HOSPITAL_FIXED_SALARY = 1200.00;

// Recargo Bancario por Tarjeta de Crédito
export const CREDIT_CARD_SURCHARGE_RATE = 0.0975; // 9.75%

// Usuarios Demo Preconfigurados (Página 1)
export const DEMO_USERS = {
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

// Función para obtener la fecha de hoy en formato YYYY-MM-DD
export function getTodayDateStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const TODAY_DATE = getTodayDateStr();

// Datos Semilla Iniciales
const INITIAL_STATE = {
  currentUser: null,
  activeView: 'landing', // 'landing', 'patient', 'doctor', 'accountant'
  
  // Citas Iniciales (Incluye citas del día de hoy y de la semana para histórico)
  appointments: [
    // --- CITAS DE HOY (FECHA ACTUAL DINÁMICA) ---
    {
      id: 'APT-TODAY-1',
      code: 'MED-7001',
      patientName: 'Carlos Mendoza Moreira',
      patientId: '0987654321',
      patientPhone: '0987654321',
      patientEmail: 'paciente@gmail.com',
      clinicId: 'alborada',
      date: TODAY_DATE,
      time: '09:00',
      durationMinutes: 45,
      reason: 'Control prioritario de hipertensión y receta Losartán',
      paymentMethod: 'efectivo',
      basePrice: 10.00,
      feePercentage: 0.00,
      feeAmount: 0.00,
      totalPaid: 10.00,
      retentionRate: 0.10,
      retentionAmount: 1.00,
      netClinicYield: 9.00,
      status: 'confirmada',
      settlementStatus: 'Liquidado',
      notes: 'Paciente con antecedente de HTA grado 1. Control de rutina programado para hoy.'
    },
    {
      id: 'APT-TODAY-2',
      code: 'MED-7002',
      patientName: 'Mariana Vera Loor',
      patientId: '0918237465',
      patientPhone: '0991234567',
      patientEmail: 'mariana.vera@yahoo.com',
      clinicId: 'alborada',
      date: TODAY_DATE,
      time: '10:15',
      durationMinutes: 45,
      reason: 'Evaluación respiratoria y chequeo de sibilancias',
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
      notes: 'Requiere auscultación pulmonar y control de asma intermitente.'
    },
    {
      id: 'APT-TODAY-3',
      code: 'MED-7003',
      patientName: 'Javier Andrade Romero',
      patientId: '0922883344',
      patientPhone: '0984561230',
      patientEmail: 'jandrade@gmail.com',
      clinicId: 'ceibos',
      date: TODAY_DATE,
      time: '13:00',
      durationMinutes: 45,
      reason: 'Dolor articular lumbar y valoración postural',
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
      notes: 'Chequeo de columna lumbosacra y terapia analgésica.'
    },
    {
      id: 'APT-TODAY-4',
      code: 'MED-7004',
      patientName: 'Sofía Carvajal Poveda',
      patientId: '0933772211',
      patientPhone: '0978901234',
      patientEmail: 'sofia.carvajal@outlook.com',
      clinicId: 'ceibos',
      date: TODAY_DATE,
      time: '14:30',
      durationMinutes: 45,
      reason: 'Certificado médico de aptitud y control de salud',
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
      notes: 'Certificado de medicina preventiva e ingreso laboral.'
    },
    {
      id: 'APT-TODAY-5',
      code: 'MED-7005',
      patientName: 'Elena Guamán Tomalá',
      patientId: '0944119988',
      patientPhone: '0967894561',
      patientEmail: 'elena.guaman@gmail.com',
      clinicId: 'mapasingue',
      date: TODAY_DATE,
      time: '16:30',
      durationMinutes: 45,
      reason: 'Control glucémico y revisión de perfil metabólico',
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
      notes: 'Ajuste de medicación hipoglucemiante.'
    },

    // --- CITAS HISTÓRICAS (Semana 17-23 Sep 2026 para auditoría contable) ---
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
      status: 'confirmada',
      settlementStatus: 'Liquidado',
      notes: 'Paciente con antecedente de HTA grado 1.'
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
    },
    // --- CITAS HISTÓRICAS DE SEMANA 4 (08 OCT - 14 OCT 2026) ---
    {
      id: 'APT-SEM4-1',
      code: 'MED-8401',
      patientName: 'Andrea Villamar Cisneros',
      patientId: '0931234567',
      patientPhone: '0993456789',
      patientEmail: 'andrea.villamar@gmail.com',
      clinicId: 'ceibos',
      date: '2026-10-09',
      time: '09:30',
      durationMinutes: 45,
      reason: 'Chequeo cardiológico preventivo y electrocardiograma',
      paymentMethod: 'tarjeta',
      basePrice: 20.00,
      feePercentage: 0.0975,
      feeAmount: 1.95,
      totalPaid: 21.95,
      retentionRate: 0.25,
      retentionAmount: 5.00,
      netClinicYield: 15.00,
      status: 'confirmada',
      settlementStatus: 'Liquidado',
      notes: 'Control anual de salud cardiovascular.'
    },
    {
      id: 'APT-SEM4-2',
      code: 'MED-8402',
      patientName: 'Roberto Palacios Solís',
      patientId: '0924567890',
      patientPhone: '0981234567',
      patientEmail: 'roberto.palacios@hotmail.com',
      clinicId: 'alborada',
      date: '2026-10-10',
      time: '11:00',
      durationMinutes: 45,
      reason: 'Evaluación de dolor lumbar y lumbalgia postural',
      paymentMethod: 'efectivo',
      basePrice: 10.00,
      feePercentage: 0.00,
      feeAmount: 0.00,
      totalPaid: 10.00,
      retentionRate: 0.10,
      retentionAmount: 1.00,
      netClinicYield: 9.00,
      status: 'confirmada',
      settlementStatus: 'Liquidado',
      notes: 'Tratamiento fisioterapéutico y AINES.'
    },
    {
      id: 'APT-SEM4-3',
      code: 'MED-8403',
      patientName: 'Guillermo Cárdenas Mora',
      patientId: '0918765432',
      patientPhone: '0972345678',
      patientEmail: 'gcardenas@outlook.com',
      clinicId: 'ceibos',
      date: '2026-10-11',
      time: '14:00',
      durationMinutes: 45,
      reason: 'Certificado de aptitud médica laboral',
      paymentMethod: 'efectivo',
      basePrice: 20.00,
      feePercentage: 0.00,
      feeAmount: 0.00,
      totalPaid: 20.00,
      retentionRate: 0.25,
      retentionAmount: 5.00,
      netClinicYield: 15.00,
      status: 'confirmada',
      settlementStatus: 'Liquidado',
      notes: 'Examen físico completo sin patología aguda.'
    },
    {
      id: 'APT-SEM4-4',
      code: 'MED-8404',
      patientName: 'María José Cevallos',
      patientId: '0945671234',
      patientPhone: '0963456789',
      patientEmail: 'mj.cevallos@gmail.com',
      clinicId: 'mapasingue',
      date: '2026-10-12',
      time: '16:15',
      durationMinutes: 45,
      reason: 'Control glicémico y evaluación metabólica',
      paymentMethod: 'tarjeta',
      basePrice: 20.00,
      feePercentage: 0.0975,
      feeAmount: 1.95,
      totalPaid: 21.95,
      retentionRate: 0.05,
      retentionAmount: 1.00,
      netClinicYield: 19.00,
      status: 'confirmada',
      settlementStatus: 'Liquidado',
      notes: 'HbA1c en metas de control.'
    },
    {
      id: 'APT-SEM4-5',
      code: 'MED-8405',
      patientName: 'Fernando Macías Llerena',
      patientId: '0956789012',
      patientPhone: '0954567890',
      patientEmail: 'fernando.macias@gmail.com',
      clinicId: 'hospital',
      date: '2026-10-13',
      time: '10:00',
      durationMinutes: 45,
      reason: 'Triaje y atención médica de urgencias en hospital',
      paymentMethod: 'efectivo',
      basePrice: 0.00,
      feePercentage: 0.00,
      feeAmount: 0.00,
      totalPaid: 0.00,
      retentionRate: 0.00,
      retentionAmount: 0.00,
      netClinicYield: 0.00,
      status: 'confirmada',
      settlementStatus: 'Liquidado',
      notes: 'Atención dentro del rol hospitalario público.'
    },
    {
      id: 'APT-SEM4-6',
      code: 'MED-8406',
      patientName: 'Valeria Romero Santos',
      patientId: '0967890123',
      patientPhone: '0945678901',
      patientEmail: 'valeria.romero@gmail.com',
      clinicId: 'ceibos',
      date: '2026-10-13',
      time: '15:00',
      durationMinutes: 45,
      reason: 'Consulta médica general y chequeo gineco-clínico',
      paymentMethod: 'efectivo',
      basePrice: 20.00,
      feePercentage: 0.00,
      feeAmount: 0.00,
      totalPaid: 20.00,
      retentionRate: 0.25,
      retentionAmount: 5.00,
      netClinicYield: 15.00,
      status: 'confirmada',
      settlementStatus: 'Liquidado',
      notes: 'Examen preventivo de rutina.'
    },
    {
      id: 'APT-SEM4-7',
      code: 'MED-8407',
      patientName: 'Esteban Domínguez Paz',
      patientId: '0978901234',
      patientPhone: '0936789012',
      patientEmail: 'esteban.dominguez@yahoo.com',
      clinicId: 'alborada',
      date: '2026-10-14',
      time: '08:45',
      durationMinutes: 45,
      reason: 'Control de hipertensión y renovación de fórmula',
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
      notes: 'Presión arterial 120/80 mmHg compensada.'
    }
  ],

  // Bloques de Traslado Protegido entre Clínicas
  travelBuffers: [
    {
      id: 'TRV-TODAY-1',
      date: TODAY_DATE,
      fromClinic: 'alborada',
      toClinic: 'ceibos',
      startTime: '11:15',
      endTime: '12:45',
      durationMinutes: 45,
      bufferLabel: '🚗 Traslado Alborada → Ceibos (45 min + colchón de llegada)',
      status: 'programado'
    },
    {
      id: 'TRV-TODAY-2',
      date: TODAY_DATE,
      fromClinic: 'ceibos',
      toClinic: 'mapasingue',
      startTime: '15:30',
      endTime: '16:15',
      durationMinutes: 40,
      bufferLabel: '🚗 En ruta hacia Mapasingue - 40 min buffer',
      status: 'programado'
    },
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

  // Perfiles Completos de Pacientes (Portal Paciente & Ficha Clínica)
  patientProfiles: [
    {
      id: 'PAT-PROF-01',
      cedula: '0987654321',
      nombres: 'Carlos',
      apellidos: 'Mendoza Moreira',
      nombreCompleto: 'Carlos Mendoza Moreira',
      fechaNacimiento: '1982-05-14',
      edad: 44,
      genero: 'Masculino',
      telefono: '+593 98 765 4321',
      email: 'paciente@gmail.com',
      direccion: 'Cdla. Alborada 8va Etapa, Mz 812 Villa 4',
      contactoEmergenciaNombre: 'Laura Moreira (Cónyuge)',
      contactoEmergenciaTelefono: '+593 99 223 3445',
      tipoSangre: 'O+',
      alergias: 'Penicilina, Sulfamidas',
      enfermedadesCronicas: 'Hipertensión Arterial Primaria Grado 1',
      medicacionHabitual: 'Losartán 50mg cada 24 horas vía oral'
    },
    {
      id: 'PAT-PROF-02',
      cedula: '0918237465',
      nombres: 'Mariana',
      apellidos: 'Vera Loor',
      nombreCompleto: 'Mariana Vera Loor',
      fechaNacimiento: '1994-08-22',
      edad: 32,
      genero: 'Femenino',
      telefono: '+593 99 123 4567',
      email: 'mariana.vera@yahoo.com',
      direccion: 'Urdesa Central, Calle 4ta y Guayacanes',
      contactoEmergenciaNombre: 'Roberto Vera (Padre)',
      contactoEmergenciaTelefono: '+593 98 112 2334',
      tipoSangre: 'A+',
      alergias: 'AINES (Ibuprofeno causa broncoespasmo leve)',
      enfermedadesCronicas: 'Asma Bronquial Intermitente',
      medicacionHabitual: 'Salbutamol inhalador 100mcg a demanda'
    },
    {
      id: 'PAT-PROF-03',
      cedula: '0922883344',
      nombres: 'Javier',
      apellidos: 'Andrade Romero',
      nombreCompleto: 'Javier Andrade Romero',
      fechaNacimiento: '1975-11-03',
      edad: 51,
      genero: 'Masculino',
      telefono: '+593 98 456 1230',
      email: 'jandrade@gmail.com',
      direccion: 'Ceibos Norte Mz 14 Solar 2',
      contactoEmergenciaNombre: 'Patricia Romero (Hermana)',
      contactoEmergenciaTelefono: '+593 97 665 5443',
      tipoSangre: 'B+',
      alergias: 'Sin alergias conocidas',
      enfermedadesCronicas: 'Hernia Discal L4-L5',
      medicacionHabitual: 'Complejo B y Paracetamol 500mg SOS'
    }
  ],

  // Fichas Clínicas de Pacientes y Expediente Cronológico (Semana 4)
  medicalRecords: [
    {
      id: 'REC-001',
      patientId: '0987654321',
      patientCedula: '0987654321',
      patientName: 'Carlos Mendoza Moreira',
      age: 44,
      bloodType: 'O+',
      sede: 'Consultorio Alborada',
      allergies: 'Penicilina, Sulfamidas (reacción urticariforme severa)',
      history: 'Hipertensión arterial esencial diagnosticada en 2022. No fumador.',
      antecedentes: {
        app: 'Hipertensión Arterial (HTA) grado 1 en tratamiento crónico. Rinitis alérgica.',
        apf: 'Padre con antecedentes de Infarto Agudo de Miocardio (IAM). Madre diabética.',
        quirurgicos: 'Apendicectomía laparoscópica a los 18 años.',
        habitos: 'No fuma, alcohol social ocasional, actividad física 2 veces/semana.'
      },
      lastDiagnosis: 'Hipertensión Arterial Primaria (CIE-10: I10). Rinitis alérgica estacional.',
      signosVitales: { pa: '125/82', fc: '72', temp: '36.6', imc: '24.8' },
      consultationHistory: [
        {
          id: 'CONS-101',
          date: '2026-06-12',
          sede: 'Consultorio Alborada',
          motivo: 'Control semestral de presión arterial y ajuste de medicación',
          diagnostico: 'Hipertensión Arterial Primaria (CIE-10: I10)',
          pa: '125/82 mmHg',
          fc: '72 lpm',
          temp: '36.6 °C',
          imc: '24.8',
          estado: 'Atendida',
          soap: {
            subjetivo: 'Paciente acude asintomático refiriendo toma regular de Losartán 50mg.',
            objetivo: 'PA: 125/82 mmHg, FC: 72 lpm, Temp: 36.6°C, IMC: 24.8. Ruidos cardíacos rítmicos sin soplos.',
            analisis: 'Hipertensión arterial controlada bajo régimen farmacológico actual.',
            plan: 'Continuar Losartán 50mg cada mañana. Control en 6 meses.'
          }
        },
        {
          id: 'CONS-102',
          date: '2026-01-20',
          sede: 'Clínica Ceibos',
          motivo: 'Odinofagia, congestión nasal y febrícula de 48h de evolución',
          diagnostico: 'Faringitis Aguda Estreptocócica (CIE-10: J02.0)',
          pa: '130/85 mmHg',
          fc: '78 lpm',
          temp: '37.8 °C',
          imc: '25.0',
          estado: 'Atendida',
          soap: {
            subjetivo: 'Dolor al deglutir, sensación febril, malestar general.',
            objetivo: 'Faringe hiperémica con exudado amigdalino bilateral sin adenopatías dolorosas.',
            analisis: 'Faringoamigdalitis aguda con indicación antibiótica respetando alergia a penicilina.',
            plan: 'Azitromicina 500mg día por 3 días (evitando betalactámicos por alergia confirmada).'
          }
        }
      ]
    },
    {
      id: 'REC-002',
      patientId: '0918237465',
      patientCedula: '0918237465',
      patientName: 'Mariana Vera Loor',
      age: 32,
      bloodType: 'A+',
      sede: 'Consultorio Alborada',
      allergies: 'AINES (Ibuprofeno causa broncoespasmo leve)',
      history: 'Asma bronquial intermitente desde la infancia. Sin cirugías previas.',
      antecedentes: {
        app: 'Asma bronquial intermitente leve. Atopia estacional.',
        apf: 'Madre con rinitis alérgica.',
        quirurgicos: 'Ninguno.',
        habitos: 'No fumadora, niega consumo etílico.'
      },
      lastDiagnosis: 'Bronquitis Aguda no especificada (CIE-10: J20.9).',
      signosVitales: { pa: '118/75', fc: '76', temp: '36.8', imc: '22.4' },
      consultationHistory: [
        {
          id: 'CONS-201',
          date: '2026-05-18',
          sede: 'Consultorio Alborada',
          motivo: 'Tos seca persistente y sibilancias nocturnas',
          diagnostico: 'Bronquitis Aguda con componente reactivo (CIE-10: J20.9)',
          pa: '118/75 mmHg',
          fc: '76 lpm',
          temp: '36.8 °C',
          imc: '22.4',
          estado: 'Atendida',
          soap: {
            subjetivo: 'Sensación de opresión torácica tras cambios bruscos de temperatura.',
            objetivo: 'Murmullo vesicular conservado con sibilancias espiratorias aisladas.',
            analisis: 'Exacerbación bronquial reactiva. Evitar AINEs por antecedente de hipersensibilidad.',
            plan: 'Salbutamol inhalador 100mcg cada 6h por 5 días. Paracetamol en caso de dolor.'
          }
        }
      ]
    },
    {
      id: 'REC-003',
      patientId: '0922883344',
      patientCedula: '0922883344',
      patientName: 'Javier Andrade Romero',
      age: 51,
      bloodType: 'B+',
      sede: 'Clínica Ceibos',
      allergies: 'Ninguna conocida (NKA)',
      history: 'Hernia discal L4-L5 diagnosticada en 2024. Sedentario.',
      antecedentes: {
        app: 'Hernia discal lumbar L4-L5 sintomática.',
        apf: 'Sin antecedentes relevantes.',
        quirurgicos: 'Colecistectomía convencional (2018).',
        habitos: 'Sedentarismo laboral (trabajo en oficina > 8h/día).'
      },
      lastDiagnosis: 'Lumbago no especificado / Mecánico (CIE-10: M54.5)',
      signosVitales: { pa: '135/88', fc: '80', temp: '36.5', imc: '27.6' },
      consultationHistory: [
        {
          id: 'CONS-301',
          date: '2026-07-04',
          sede: 'Clínica Ceibos',
          motivo: 'Dolor punzante en zona lumbar que irradia a glúteo derecho',
          diagnostico: 'Lumbago agudo con contractura paravertebral (CIE-10: M54.5)',
          pa: '135/88 mmHg',
          fc: '80 lpm',
          temp: '36.5 °C',
          imc: '27.6',
          estado: 'Atendida',
          soap: {
            subjetivo: 'Dolor EVA 7/10 tras levantar carga pesada el día anterior.',
            objetivo: 'Contractura muscular paravertebral lumbar derecha. Lasègue negativo.',
            analisis: 'Lumbociática mecánica sin déficit motor agudo.',
            plan: 'Reposo relativo 48h, calor local, analgesia y terapia física posterior.'
          }
        }
      ]
    }
  ],

  // Recetas Digitales Emitidas
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

  // Registro de Gastos Diarios y Operativos (Clasificación Contable Oficial y Auditoría - Semana 3)
  expenses: [
    {
      id: 'EXP-101',
      date: TODAY_DATE,
      fechaHora: `${TODAY_DATE}T08:15`,
      fecha_hora: `${TODAY_DATE}T08:15:00`,
      tipoGasto: 'TRANSPORTE',
      tipo_gasto: 'TRANSPORTE',
      sedeCodigo: 'CEIBOS',
      sede_codigo: 'CEIBOS',
      tipoTransporte: 'GASOLINA',
      tipo_transporte: 'GASOLINA',
      category: 'Transporte',
      accountingCategory: 'Gastos',
      description: 'Gasolina Super para traslados entre clínicas',
      motivo: 'Gasolina Super para traslados entre clínicas',
      amount: 15.00,
      monto: 15.00,
      origenFondo: 'MEDICO_PERSONAL',
      origen_fondo: 'MEDICO_PERSONAL',
      esReembolsoMedico: true,
      es_reembolso_medico: true,
      tipoComprobante: 'FACTURA_RUC',
      tipo_comprobante: 'FACTURA_RUC',
      numeroComprobante: '001-002-000847291',
      numero_comprobante: '001-002-000847291',
      paymentMethod: 'Efectivo',
      voucherType: 'Factura Electrónica',
      voucherNumber: '001-002-000847291',
      providerName: 'Estación Primax Ceibos',
      providerRuc: '0992384756001',
      auditStatus: 'Aprobado',
      costCenter: 'General Movilidad',
      auditNotes: 'Comprobante cotejado con ruta Alborada-Ceibos.',
      estadoLiquidacion: 'PENDIENTE',
      estado_liquidacion: 'PENDIENTE',
      quickLogged: true,
      deductibleSRI: true
    },
    {
      id: 'EXP-102',
      date: TODAY_DATE,
      fechaHora: `${TODAY_DATE}T12:30`,
      fecha_hora: `${TODAY_DATE}T12:30:00`,
      tipoGasto: 'TRANSPORTE',
      tipo_gasto: 'TRANSPORTE',
      sedeCodigo: 'HOSPITAL',
      sede_codigo: 'HOSPITAL',
      tipoTransporte: 'TAXI_APP',
      tipo_transporte: 'TAXI_APP',
      category: 'Transporte',
      accountingCategory: 'Gastos',
      description: 'Carrera de Taxi hacia Hospital Público Ceibos',
      motivo: 'Carrera de Taxi hacia Hospital Público Ceibos',
      amount: 4.00,
      monto: 4.00,
      origenFondo: 'MEDICO_PERSONAL',
      origen_fondo: 'MEDICO_PERSONAL',
      esReembolsoMedico: true,
      es_reembolso_medico: true,
      tipoComprobante: 'SIN_COMPROBANTE',
      tipo_comprobante: 'SIN_COMPROBANTE',
      numeroComprobante: 'VAL-2026-042',
      numero_comprobante: 'VAL-2026-042',
      paymentMethod: 'Efectivo',
      voucherType: 'Recibo / Vale',
      voucherNumber: 'VAL-2026-042',
      providerName: 'Cooperativa Taxi Ceibos',
      providerRuc: '0991122334001',
      auditStatus: 'Aprobado',
      costCenter: 'Hospital Ceibos',
      auditNotes: 'Movilización por emergencia de guardia hospitalaria.',
      estadoLiquidacion: 'PENDIENTE',
      estado_liquidacion: 'PENDIENTE',
      quickLogged: true,
      deductibleSRI: true
    },
    {
      id: 'EXP-103',
      date: TODAY_DATE,
      fechaHora: `${TODAY_DATE}T14:45`,
      fecha_hora: `${TODAY_DATE}T14:45:00`,
      tipoGasto: 'INSUMOS',
      tipo_gasto: 'INSUMOS',
      sedeCodigo: 'HOSPITAL',
      sede_codigo: 'HOSPITAL',
      categoriaInsumo: 'INSUMOS_MEDICOS_BASICOS',
      categoria_insumo: 'INSUMOS_MEDICOS_BASICOS',
      category: 'Suministros Hospital',
      accountingCategory: 'Costos',
      description: 'Insumos médicos de emergencia (Guantes de nitrilo, gasas estériles y antiséptico)',
      detalle: 'Insumos médicos de emergencia (Guantes de nitrilo, gasas estériles y antiséptico)',
      amount: 12.00,
      monto: 12.00,
      origenFondo: 'MEDICO_PERSONAL',
      origen_fondo: 'MEDICO_PERSONAL',
      esReembolsoMedico: true,
      es_reembolso_medico: true,
      tipoComprobante: 'FACTURA_RUC',
      tipo_comprobante: 'FACTURA_RUC',
      numeroComprobante: '002-005-001294812',
      numero_comprobante: '002-005-001294812',
      paymentMethod: 'Efectivo',
      voucherType: 'Factura Electrónica',
      voucherNumber: '002-005-001294812',
      providerName: 'Distribuidora Farmacéutica Difare',
      providerRuc: '0990011223001',
      auditStatus: 'Aprobado',
      costCenter: 'Hospital Ceibos',
      auditNotes: 'Insumos para atención de choque hospitalario.',
      estadoLiquidacion: 'PENDIENTE',
      estado_liquidacion: 'PENDIENTE',
      quickLogged: true,
      deductibleSRI: true
    },
    {
      id: 'EXP-104',
      date: '2026-09-18',
      fechaHora: '2026-09-18T10:00',
      fecha_hora: '2026-09-18T10:00:00',
      tipoGasto: 'INSUMOS',
      tipo_gasto: 'INSUMOS',
      sedeCodigo: 'MAPASINGUE',
      sede_codigo: 'MAPASINGUE',
      categoriaInsumo: 'MANTENIMIENTO',
      categoria_insumo: 'MANTENIMIENTO',
      category: 'Mantenimiento',
      accountingCategory: 'Costos',
      description: 'Desinfección y calibración de tensiómetro aneroide',
      detalle: 'Desinfección y calibración de tensiómetro aneroide',
      amount: 25.00,
      monto: 25.00,
      origenFondo: 'CAJA_CHICA_SEDE',
      origen_fondo: 'CAJA_CHICA_SEDE',
      esReembolsoMedico: false,
      es_reembolso_medico: false,
      tipoComprobante: 'FACTURA_RUC',
      tipo_comprobante: 'FACTURA_RUC',
      numeroComprobante: '001-010-000004921',
      numero_comprobante: '001-010-000004921',
      paymentMethod: 'Transferencia',
      voucherType: 'Factura Electrónica',
      voucherNumber: '001-010-000004921',
      providerName: 'Biomédica del Litoral S.A.',
      providerRuc: '0991928374001',
      auditStatus: 'Aprobado',
      costCenter: 'Sede Mapasingue',
      auditNotes: 'Mantenimiento preventivo de equipo instrumental.',
      estadoLiquidacion: 'PENDIENTE',
      estado_liquidacion: 'PENDIENTE',
      quickLogged: false,
      deductibleSRI: true
    },
    {
      id: 'EXP-105',
      date: '2026-09-15',
      fechaHora: '2026-09-15T16:20',
      fecha_hora: '2026-09-15T16:20:00',
      tipoGasto: 'TRANSPORTE',
      tipo_gasto: 'TRANSPORTE',
      sedeCodigo: 'CEIBOS',
      sede_codigo: 'CEIBOS',
      tipoTransporte: 'PEAJE',
      tipo_transporte: 'PEAJE',
      category: 'Transporte',
      accountingCategory: 'Gastos',
      description: 'Peajes urbanos Vía a la Costa y combustible',
      motivo: 'Peajes urbanos Vía a la Costa y combustible',
      amount: 18.50,
      monto: 18.50,
      origenFondo: 'MEDICO_PERSONAL',
      origen_fondo: 'MEDICO_PERSONAL',
      esReembolsoMedico: true,
      es_reembolso_medico: true,
      tipoComprobante: 'FACTURA_RUC',
      tipo_comprobante: 'FACTURA_RUC',
      numeroComprobante: '003-001-000994821',
      numero_comprobante: '003-001-000994821',
      paymentMethod: 'Efectivo',
      voucherType: 'Factura Electrónica',
      voucherNumber: '003-001-000994821',
      providerName: 'Gasolinera Mobil Vía a la Costa',
      providerRuc: '0990887766001',
      auditStatus: 'Aprobado',
      costCenter: 'Sede Ceibos',
      auditNotes: 'Desplazamiento para turno extendido.',
      estadoLiquidacion: 'LIQUIDADO',
      estado_liquidacion: 'LIQUIDADO',
      quickLogged: false,
      deductibleSRI: true
    },
    // --- GASTOS OPERATIVOS DE SEMANA 4 (08 OCT - 14 OCT 2026) ---
    {
      id: 'EXP-SEM4-1',
      date: '2026-10-10',
      fechaHora: '2026-10-10T12:00',
      fecha_hora: '2026-10-10T12:00:00',
      tipoGasto: 'TRANSPORTE',
      tipo_gasto: 'TRANSPORTE',
      sedeCodigo: 'CEIBOS',
      sede_codigo: 'CEIBOS',
      tipoTransporte: 'GASOLINA',
      tipo_transporte: 'GASOLINA',
      category: 'Transporte',
      accountingCategory: 'Gastos',
      description: 'Combustible Super ruta Alborada hacia Ceibos',
      motivo: 'Combustible Super ruta Alborada hacia Ceibos',
      amount: 15.00,
      monto: 15.00,
      origenFondo: 'MEDICO_PERSONAL',
      origen_fondo: 'MEDICO_PERSONAL',
      esReembolsoMedico: true,
      es_reembolso_medico: true,
      tipoComprobante: 'FACTURA_RUC',
      tipo_comprobante: 'FACTURA_RUC',
      numeroComprobante: '001-002-000847295',
      numero_comprobante: '001-002-000847295',
      paymentMethod: 'Efectivo',
      voucherType: 'Factura Electrónica',
      voucherNumber: '001-002-000847295',
      providerName: 'Estación Primax Ceibos',
      providerRuc: '0992384756001',
      auditStatus: 'Aprobado',
      costCenter: 'Sede Ceibos',
      auditNotes: 'Traslado verificado en cronograma semanal.',
      estadoLiquidacion: 'LIQUIDADO',
      estado_liquidacion: 'LIQUIDADO',
      quickLogged: true,
      deductibleSRI: true
    },
    {
      id: 'EXP-SEM4-2',
      date: '2026-10-12',
      fechaHora: '2026-10-12T17:30',
      fecha_hora: '2026-10-12T17:30:00',
      tipoGasto: 'TRANSPORTE',
      tipo_gasto: 'TRANSPORTE',
      sedeCodigo: 'MAPASINGUE',
      sede_codigo: 'MAPASINGUE',
      tipoTransporte: 'TAXI_APP',
      tipo_transporte: 'TAXI_APP',
      category: 'Transporte',
      accountingCategory: 'Gastos',
      description: 'Carrera taxi retorno de Mapasingue por congestión',
      motivo: 'Carrera taxi retorno de Mapasingue por congestión',
      amount: 4.50,
      monto: 4.50,
      origenFondo: 'MEDICO_PERSONAL',
      origen_fondo: 'MEDICO_PERSONAL',
      esReembolsoMedico: true,
      es_reembolso_medico: true,
      tipoComprobante: 'SIN_COMPROBANTE',
      tipo_comprobante: 'SIN_COMPROBANTE',
      numeroComprobante: 'VAL-2026-055',
      numero_comprobante: 'VAL-2026-055',
      paymentMethod: 'Efectivo',
      voucherType: 'Recibo / Vale',
      voucherNumber: 'VAL-2026-055',
      providerName: 'Taxi Ejecutivo Guayas',
      providerRuc: '0991122334001',
      auditStatus: 'Aprobado',
      costCenter: 'Sede Mapasingue',
      auditNotes: 'Movilidad en hora pico justificada.',
      estadoLiquidacion: 'LIQUIDADO',
      estado_liquidacion: 'LIQUIDADO',
      quickLogged: true,
      deductibleSRI: true
    },
    {
      id: 'EXP-SEM4-3',
      date: '2026-10-13',
      fechaHora: '2026-10-13T11:45',
      fecha_hora: '2026-10-13T11:45:00',
      tipoGasto: 'INSUMOS',
      tipo_gasto: 'INSUMOS',
      sedeCodigo: 'HOSPITAL',
      sede_codigo: 'HOSPITAL',
      categoriaInsumo: 'INSUMOS_MEDICOS_BASICOS',
      categoria_insumo: 'INSUMOS_MEDICOS_BASICOS',
      category: 'Suministros Hospital',
      accountingCategory: 'Costos',
      description: 'Guantes de examen y alcohol antiséptico para urgencias',
      detalle: 'Guantes de examen y alcohol antiséptico para urgencias',
      amount: 9.00,
      monto: 9.00,
      origenFondo: 'MEDICO_PERSONAL',
      origen_fondo: 'MEDICO_PERSONAL',
      esReembolsoMedico: true,
      es_reembolso_medico: true,
      tipoComprobante: 'FACTURA_RUC',
      tipo_comprobante: 'FACTURA_RUC',
      numeroComprobante: '002-005-001294820',
      numero_comprobante: '002-005-001294820',
      paymentMethod: 'Efectivo',
      voucherType: 'Factura Electrónica',
      voucherNumber: '002-005-001294820',
      providerName: 'Distribuidora Farmacéutica Difare',
      providerRuc: '0990011223001',
      auditStatus: 'Aprobado',
      costCenter: 'Hospital Ceibos',
      auditNotes: 'Insumos de apoyo hospitalario.',
      estadoLiquidacion: 'LIQUIDADO',
      estado_liquidacion: 'LIQUIDADO',
      quickLogged: true,
      deductibleSRI: true
    }
  ],

  // Estado de Guardia de Emergencia Médica (Página 4)
  emergencyGuard: {
    isActive: false,
    activatedAt: null,
    reason: 'Guardia imprevista en Hospital Ceibos convocada por Dirección Médica',
    affectedAppointments: []
  },

  // Registro de Notificaciones y Automatizaciones de Correos (Semana 4 - Parte 3)
  notificationLogs: [
    {
      id: 'LOG-001',
      type: 'CONFIRMACION',
      title: 'Confirmación Inmediata de Reserva',
      recipient: 'paciente@gmail.com',
      patientName: 'Carlos Mendoza Moreira',
      appointmentCode: 'MED-7001',
      sede: 'Consultorio Alborada',
      date: TODAY_DATE,
      time: '09:00',
      timestamp: `${TODAY_DATE}T08:30:00`,
      status: 'Entregado',
      details: '[Inmediato] Correo de confirmación enviado a Carlos Mendoza Moreira (paciente@gmail.com) para su turno en Sede Consultorio Alborada a las 09:00'
    },
    {
      id: 'LOG-002',
      type: 'RECORDATORIO_24H',
      title: 'Recordatorio Automático 24h Previas',
      recipient: 'mariana.vera@yahoo.com',
      patientName: 'Mariana Vera Loor',
      appointmentCode: 'MED-7002',
      sede: 'Consultorio Alborada',
      date: TODAY_DATE,
      time: '10:15',
      timestamp: `${TODAY_DATE}T07:00:00`,
      status: 'Entregado',
      details: '[Automático] Recordatorio 24h enviado a Mariana Vera Loor (mariana.vera@yahoo.com) para su turno en Sede Consultorio Alborada a las 10:15'
    }
  ],

  // Historial de Liquidaciones Semanales Formales (Semana 4 - Parte 4 - Isaac)
  settlements: [
    {
      id: 'LIQ-SEM4-001',
      periodo: 'Semana 4 (08 Oct - 14 Oct 2026)',
      periodKey: 'SEM-4',
      fechaCorte: '2026-10-14T18:00:00.000Z',
      doctorId: 'DOC-001',
      doctorName: 'Dr. Carlos Campoverde',
      accountantName: 'Lcda. Patricia Morales',
      ingresosBrutos: 100.00,
      deduccionesSede: { ceibos: 15.00, alborada: 2.00, mapasingue: 1.00, hospital: 0.00, total: 18.00 },
      gastosOperativos: 28.50,
      netoAPagar: 53.50, // (100 - 18) - 28.50 = 53.50
      estado: 'liquidada',
      citasCount: 7,
      gastosCount: 3,
      aprobadoPor: 'Lcda. Patricia Morales (Auditora)',
      fechaAprobacion: '2026-10-14T18:30:00.000Z',
      observaciones: 'Cierre de Semana 4 liquidado y conciliado. Retenciones contractuales por sede aplicadas y gastos operativos descontados sin discrepancias.'
    },
    {
      id: 'LIQ-SEMACTIVA-001',
      periodo: 'Semana Activa (15 Oct - 21 Oct 2026)',
      periodKey: 'SEM-ACTIVA',
      fechaCorte: new Date().toISOString(),
      doctorId: 'DOC-001',
      doctorName: 'Dr. Carlos Campoverde',
      accountantName: 'Lcda. Patricia Morales',
      ingresosBrutos: 80.00,
      deduccionesSede: { ceibos: 10.00, alborada: 2.00, mapasingue: 1.00, hospital: 0.00, total: 13.00 },
      gastosOperativos: 31.00,
      netoAPagar: 36.00,
      estado: 'pendiente',
      citasCount: 5,
      gastosCount: 3,
      aprobadoPor: null,
      fechaAprobacion: null,
      observaciones: 'Corte de caja en curso para la semana activa.'
    }
  ],

  // Balance Contable Consolidado y Cierre de Ejercicio (Semana 5 - Parte 1 - Isaac)
  accountingBalance: {
    totalRevenue: 280.00,
    totalCommissions: 43.00,
    totalExpenses: 74.50,
    netProfit: 162.50,
    reconciliationHistory: [
      {
        id: 'REC-2026-SEP',
        period: 'Corte Mensual Septiembre 2026',
        periodKey: 'SEM-1',
        reconciledAt: '2026-09-30T20:00:00.000Z',
        auditor: 'Lcda. Patricia Morales (CPA-38491)',
        totalRevenue: 100.00,
        totalCommissions: 12.00,
        totalExpenses: 43.50,
        netProfit: 44.50,
        citasCount: 5,
        gastosCount: 2,
        status: 'CONCILIADO_SRI',
        notes: 'Cierre mensual de septiembre conciliado con facturas electrónicas y extracto bancario.'
      },
      {
        id: 'REC-2026-W4',
        period: 'Semana 4 (08 Oct - 14 Oct 2026)',
        periodKey: 'SEM-4',
        reconciledAt: '2026-10-14T19:00:00.000Z',
        auditor: 'Lcda. Patricia Morales (CPA-38491)',
        totalRevenue: 100.00,
        totalCommissions: 18.00,
        totalExpenses: 28.50,
        netProfit: 53.50,
        citasCount: 7,
        gastosCount: 3,
        status: 'CONCILIADO_SRI',
        notes: 'Corte semanal de caja auditado, 7 consultas verificadas y retenciones retenidas en cuenta concentradora.'
      }
    ]
  },

  // Historial de Relevos Médicos entre Colegas (Semana 5 - Parte 2 - Jorge)
  reliefAssignments: [
    {
      id: 'REL-2026-001',
      date: TODAY_DATE,
      createdAt: `${TODAY_DATE}T07:30:00.000Z`,
      originalDoctor: 'Dr. Carlos Campoverde',
      originalDoctorCode: 'MSP-REG-84729',
      coveringDoctor: 'Dra. Elena Morales',
      coveringDoctorCode: 'MSP-REG-092834',
      coveringDoctorSpecialty: 'Medicina Familiar y Comunitaria',
      coveringDoctorPhone: '+593 98 471 9283',
      reason: 'Convocatoria a Guardia Hospitalaria de Emergencia en Hospital Ceibos',
      scope: 'citas_especificas',
      reassignedCount: 1,
      appointmentIds: ['APT-SEM4-6'],
      status: 'activo'
    }
  ],

  // Registro de Alertas Operativas del Sistema (Semana 5 - Parte 2)
  systemAlerts: [
    {
      id: 'ALT-101',
      type: 'ALLERGY_ALERT',
      severity: 'CRITICAL',
      icon: '⚠️',
      title: 'Alergia Severa en Paciente Agendado Hoy',
      message: 'Paciente Carlos Mendoza (09:00 - Sede Alborada) presenta alergia severa a Penicilina y derivados betalactámicos.',
      category: 'clinica',
      patientId: '0987654321',
      patientName: 'Carlos Mendoza Moreira',
      appointmentId: 'MED-7001',
      date: TODAY_DATE,
      time: '09:00',
      actionRequired: 'Prescribir macrólidos o quinolonas en caso de requerir antibioterapia.',
      dismissed: false
    },
    {
      id: 'ALT-102',
      type: 'TIGHT_TRANSIT',
      severity: 'WARNING',
      icon: '🚗',
      title: 'Tiempo de Traslado Intersede Ajustado',
      message: 'Margen de 30 min entre salida de Alborada (10:45) e inicio en Ceibos (11:15). Tráfico alto en Av. Juan Tanca Marengo.',
      category: 'logistica',
      date: TODAY_DATE,
      time: '10:45',
      actionRequired: 'Iniciar traslado anticipado a las 10:40 o coordinar salida prioritaria.',
      dismissed: false
    },
    {
      id: 'ALT-103',
      type: 'PENDING_CONFIRMATION',
      severity: 'INFO',
      icon: '⏳',
      title: 'Cita Pendiente de Confirmación',
      message: 'Turno de las 14:00 (Clínica Ceibos) con recordatorio automático enviado sin confirmación de lectura.',
      category: 'agenda',
      date: TODAY_DATE,
      time: '14:00',
      actionRequired: 'Contactar al paciente vía telefónica o WhatsApp para confirmar asistencia.',
      dismissed: false
    }
  ]
};

import { SupabaseDB } from './supabase-client.js';
import { SUPABASE_CONFIG } from './supabase-config.js';

class StateStore {
  constructor() {
    // Eliminar base de datos previa en LocalStorage para garantizar migración limpia a Supabase
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('cita_medica_pacientes');
      localStorage.removeItem('montepiedra_pacientes');
    } catch (e) {
      console.warn('Aviso limpiando localStorage:', e);
    }

    this.state = JSON.parse(JSON.stringify(INITIAL_STATE));
    this.listeners = [];
    this.isSupabaseConnected = false;
    this.realtimeSubscribed = false;

    // Sincronizar inmediatamente con la nueva base de datos en Supabase
    this.syncWithSupabase();
  }

  async syncWithSupabase() {
    try {
      const [apts, exps, recs, rxs, guard, users, clinics] = await Promise.all([
        SupabaseDB.getAppointments(),
        SupabaseDB.getExpenses(),
        SupabaseDB.getMedicalRecords(),
        SupabaseDB.getPrescriptions(),
        SupabaseDB.getEmergencyGuard(),
        SupabaseDB.getUsers(),
        SupabaseDB.getClinics()
      ]);

      let hasChanges = false;

      if (apts && apts.length > 0) {
        this.state.appointments = apts;
        hasChanges = true;
      }
      if (exps && exps.length > 0) {
        this.state.expenses = exps;
        hasChanges = true;
      }
      if (recs && recs.length > 0) {
        this.state.medicalRecords = recs;
        hasChanges = true;
      }
      if (rxs && rxs.length > 0) {
        this.state.prescriptions = rxs;
        hasChanges = true;
      }
      if (guard) {
        this.state.emergencyGuard = guard;
        hasChanges = true;
      }
      if (users && Object.keys(users).length > 0) {
        Object.assign(DEMO_USERS, users);
      }
      if (clinics && Object.keys(clinics).length > 0) {
        Object.assign(CLINICS, clinics);
      }

      this.isSupabaseConnected = true;

      if (!this.realtimeSubscribed) {
        this.realtimeSubscribed = true;
        SupabaseDB.subscribeRealtime(() => {
          this.syncWithSupabase();
        });
      }

      if (hasChanges) {
        this.notify();
      }
    } catch (err) {
      console.warn('Conexión con Supabase pendiente o sin conexión:', err);
    }
  }

  saveState() {
    // La persistencia oficial ahora reside en Supabase.
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
      id: appointmentData.id || `APT-${idNum}`,
      code: appointmentData.code || `MED-${Math.floor(10000 + Math.random() * 90000)}`,
      status: appointmentData.status || 'confirmed',
      settlementStatus: appointmentData.settlementStatus || 'Pendiente',
      ...appointmentData
    };

    // Calcular montos y retenciones según sede
    const clinic = CLINICS[newApt.clinicId] || CLINICS.ceibos;
    const isHospital = (newApt.clinicId === 'hospital' || newApt.clinicId === 'hospital_ceibos');
    const baseFee = isHospital ? 0.00 : ((appointmentData.baseFee !== undefined && !isNaN(appointmentData.baseFee))
      ? Number(appointmentData.baseFee)
      : ((appointmentData.basePrice !== undefined && !isNaN(appointmentData.basePrice))
        ? Number(appointmentData.basePrice)
        : Number(clinic.basePrice || 20.00)));

    newApt.basePrice = baseFee;
    newApt.baseFee = baseFee;
    newApt.base_price = baseFee;
    newApt.base_fee = baseFee;

    const isCard = (newApt.paymentMethod === 'tarjeta' || newApt.paymentMethod === 'card');
    newApt.payment_method = isCard ? 'card' : ((newApt.paymentMethod === 'transferencia' || newApt.paymentMethod === 'transfer') ? 'transfer' : 'cash');
    newApt.paymentMethod = newApt.payment_method;

    newApt.retentionRate = (clinic.retentionRate !== undefined) ? Number(clinic.retentionRate) : (isHospital ? 0.00 : 0.05);
    newApt.retention_rate = newApt.retentionRate;

    if (isCard && baseFee > 0) {
      newApt.feePercentage = CREDIT_CARD_SURCHARGE_RATE;
      newApt.fee_percentage = CREDIT_CARD_SURCHARGE_RATE;
      newApt.feeAmount = +(baseFee * CREDIT_CARD_SURCHARGE_RATE).toFixed(2);
      newApt.fee_amount = newApt.feeAmount;
      newApt.processingFee = newApt.feeAmount;
      newApt.processing_fee = newApt.feeAmount;
      newApt.totalPaid = +(baseFee + newApt.feeAmount).toFixed(2);
      newApt.total_paid = newApt.totalPaid;
    } else {
      newApt.feePercentage = 0;
      newApt.fee_percentage = 0;
      newApt.feeAmount = 0;
      newApt.fee_amount = 0;
      newApt.processingFee = 0;
      newApt.processing_fee = 0;
      newApt.totalPaid = baseFee;
      newApt.total_paid = baseFee;
    }

    newApt.retentionAmount = isHospital ? 0.00 : +(baseFee * newApt.retentionRate).toFixed(2);
    newApt.retention_amount = newApt.retentionAmount;
    newApt.netClinicYield = isHospital ? 0.00 : +(baseFee - newApt.retentionAmount).toFixed(2);
    newApt.net_clinic_yield = newApt.netClinicYield;

    newApt.patient_cedula = newApt.patientCedula || newApt.patientId;
    newApt.patientCedula = newApt.patient_cedula;

    newApt.notifications = newApt.notifications || {
      confirmationSent: true,
      confirmationDate: new Date().toISOString(),
      reminder24hSent: false,
      reminderDate: null
    };

    this.state.appointments.push(newApt);

    // Asegurar que exista ficha clínica para el paciente
    let record = this.state.medicalRecords.find(r => r.patientId === newApt.patientId);
    let isNewRecord = false;
    if (!record) {
      isNewRecord = true;
      record = {
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
      };
      this.state.medicalRecords.push(record);
    }

    // Persistir directamente en Supabase
    SupabaseDB.insertAppointment(newApt).catch(e => console.error('Error guardando cita en Supabase:', e));
    if (isNewRecord) {
      SupabaseDB.upsertMedicalRecord(record).catch(e => console.error('Error guardando ficha en Supabase:', e));
    }

    this.saveState();
    return newApt;
  }

  updateAppointmentStatus(aptId, status) {
    const apt = this.state.appointments.find(a => a.id === aptId);
    if (apt) {
      apt.status = status;
      SupabaseDB.updateAppointmentStatus(aptId, status).catch(e => console.error('Error actualizando estado en Supabase:', e));
      this.saveState();
    }
  }

  toggleSettlementStatus(aptId) {
    const apt = this.state.appointments.find(a => a.id === aptId);
    if (apt) {
      apt.settlementStatus = apt.settlementStatus === 'Liquidado' ? 'Pendiente' : 'Liquidado';
      SupabaseDB.updateAppointmentSettlement(aptId, apt.settlementStatus).catch(e => console.error('Error actualizando liquidación en Supabase:', e));
      this.saveState();
    }
  }

  // --- Gastos (Semana 3) ---
  addExpense(expenseData) {
    const idNum = 100 + (this.state.expenses ? this.state.expenses.length : 0) + 1;
    const nowIso = new Date().toISOString();
    const isDoctorFund = expenseData.origenFondo === 'MEDICO_PERSONAL' || expenseData.origen_fondo === 'MEDICO_PERSONAL' || Boolean(expenseData.esReembolsoMedico);
    const tipo = (expenseData.tipoGasto || expenseData.tipo_gasto || (expenseData.category === 'Transporte' ? 'TRANSPORTE' : 'INSUMOS')).toUpperCase();
    const sede = (expenseData.sedeCodigo || expenseData.sede_codigo || 'CEIBOS').toUpperCase();
    const monto = Number(expenseData.amount !== undefined ? expenseData.amount : (expenseData.monto || 0));

    const newExp = {
      id: expenseData.id || `EXP-${idNum}`,
      date: expenseData.date || (expenseData.fechaHora ? expenseData.fechaHora.split('T')[0] : nowIso.split('T')[0]),
      fechaHora: expenseData.fechaHora || expenseData.fecha_hora || nowIso.slice(0, 16),
      fecha_hora: expenseData.fechaHora || expenseData.fecha_hora || nowIso.slice(0, 19),
      tipoGasto: tipo,
      tipo_gasto: tipo,
      sedeCodigo: sede,
      sede_codigo: sede,
      tipoTransporte: expenseData.tipoTransporte || expenseData.tipo_transporte || '',
      tipo_transporte: expenseData.tipoTransporte || expenseData.tipo_transporte || '',
      categoriaInsumo: expenseData.categoriaInsumo || expenseData.categoria_insumo || '',
      categoria_insumo: expenseData.categoriaInsumo || expenseData.categoria_insumo || '',
      category: expenseData.category || (tipo === 'TRANSPORTE' ? 'Transporte' : 'Insumos Médicos'),
      accountingCategory: tipo === 'TRANSPORTE' ? 'Gastos' : 'Costos',
      description: expenseData.description || expenseData.motivo || expenseData.detalle || 'Gasto registrado',
      motivo: expenseData.motivo || expenseData.description || '',
      detalle: expenseData.detalle || expenseData.description || '',
      amount: monto,
      monto: monto,
      origenFondo: isDoctorFund ? 'MEDICO_PERSONAL' : 'CAJA_CHICA_SEDE',
      origen_fondo: isDoctorFund ? 'MEDICO_PERSONAL' : 'CAJA_CHICA_SEDE',
      esReembolsoMedico: isDoctorFund,
      es_reembolso_medico: isDoctorFund,
      tipoComprobante: expenseData.tipoComprobante || expenseData.tipo_comprobante || 'SIN_COMPROBANTE',
      tipo_comprobante: expenseData.tipoComprobante || expenseData.tipo_comprobante || 'SIN_COMPROBANTE',
      numeroComprobante: expenseData.numeroComprobante || expenseData.numero_comprobante || '',
      numero_comprobante: expenseData.numeroComprobante || expenseData.numero_comprobante || '',
      comprobanteUrl: expenseData.comprobanteUrl || expenseData.comprobante_url || '',
      comprobante_url: expenseData.comprobanteUrl || expenseData.comprobante_url || '',
      comprobanteNombre: expenseData.comprobanteNombre || '',
      estadoLiquidacion: 'PENDIENTE',
      estado_liquidacion: 'PENDIENTE',
      costCenter: `Sede ${sede}`,
      auditStatus: 'Aprobado',
      paymentMethod: isDoctorFund ? 'Dinero Propio' : 'Caja Chica',
      quickLogged: Boolean(expenseData.quickLogged),
      deductibleSRI: true,
      ...expenseData
    };

    if (!this.state.expenses) {
      this.state.expenses = [];
    }
    this.state.expenses.unshift(newExp);
    SupabaseDB.insertExpense(newExp).catch(e => console.error('Error guardando gasto en Supabase:', e));
    this.saveState();
    return newExp;
  }

  deleteExpense(expenseId) {
    if (!this.state.expenses) return { success: false, reason: 'EMPTY' };
    const idx = this.state.expenses.findIndex(e => e.id === expenseId);
    if (idx === -1) {
      return { success: false, reason: 'NOT_FOUND', message: `Gasto con ID ${expenseId} no existe.` };
    }
    const exp = this.state.expenses[idx];
    if (exp.estadoLiquidacion === 'LIQUIDADO' || exp.estado_liquidacion === 'LIQUIDADO') {
      return {
        success: false,
        reason: 'LIQUIDADO',
        message: 'No se puede eliminar un gasto que ya ha sido procesado en una liquidación semanal cerrada.'
      };
    }
    this.state.expenses.splice(idx, 1);
    SupabaseDB.deleteExpense(expenseId).catch(e => console.error('Error eliminando gasto en Supabase:', e));
    this.saveState();
    return { success: true, message: `Gasto ${expenseId} eliminado exitosamente.` };
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
    SupabaseDB.insertPrescription(newRx).catch(e => console.error('Error guardando receta en Supabase:', e));
    this.saveState();
    return newRx;
  }

  // --- Expediente Médico y Fichas Clínicas (Semana 4) ---
  addMedicalRecord(recordData) {
    const id = recordData.id || `REC-${Math.floor(100 + Math.random() * 900)}`;
    const patientCedula = String(recordData.patientCedula || recordData.patientId || '').trim();
    const todayStr = getTodayDateStr();

    if (!this.state.medicalRecords) {
      this.state.medicalRecords = [];
    }

    let existingIndex = this.state.medicalRecords.findIndex(
      r => (patientCedula && (r.patientId === patientCedula || r.patientCedula === patientCedula)) || r.id === id
    );

    const existingRecord = existingIndex >= 0 ? this.state.medicalRecords[existingIndex] : null;

    const baseRecord = {
      id: existingRecord ? existingRecord.id : id,
      patientId: patientCedula || (existingRecord ? existingRecord.patientId : '0987654321'),
      patientCedula: patientCedula || (existingRecord ? existingRecord.patientCedula : '0987654321'),
      patientName: recordData.patientName || (existingRecord ? existingRecord.patientName : 'Paciente General'),
      age: recordData.age || (existingRecord ? existingRecord.age : 35),
      bloodType: recordData.bloodType || (existingRecord ? existingRecord.bloodType : 'O+'),
      sede: recordData.sede || (existingRecord ? existingRecord.sede : 'Clínica Ceibos'),
      allergies: recordData.allergies || (existingRecord ? existingRecord.allergies : 'Ninguna conocida (NKA)'),
      history: recordData.history || (existingRecord ? existingRecord.history : 'Sin antecedentes de riesgo registrados.'),
      antecedentes: recordData.antecedentes || (existingRecord ? existingRecord.antecedentes : {
        app: 'Sin antecedentes patológicos personales declarados',
        apf: 'Sin antecedentes patológicos familiares declarados',
        quirurgicos: 'Sin cirugías previas',
        habitos: 'Hábitos no tóxicos'
      }),
      lastDiagnosis: recordData.diagnostico || recordData.lastDiagnosis || (existingRecord ? existingRecord.lastDiagnosis : 'Consulta de Medicina General'),
      signosVitales: recordData.signosVitales || (existingRecord ? existingRecord.signosVitales : { pa: '120/80', fc: '75', temp: '36.5', imc: '23.5' }),
      consultationHistory: existingRecord && existingRecord.consultationHistory ? [...existingRecord.consultationHistory] : []
    };

    // Si viene una consulta para agregar al historial cronológico
    if (recordData.motivo || recordData.diagnostico || recordData.consultaActual) {
      const nuevaConsulta = {
        id: `CONS-${Date.now()}`,
        date: recordData.fecha || recordData.date || todayStr,
        sede: recordData.sede || baseRecord.sede,
        motivo: recordData.motivo || 'Control médico de rutina',
        diagnostico: recordData.diagnostico || baseRecord.lastDiagnosis,
        pa: (recordData.signosVitales && recordData.signosVitales.pa) ? recordData.signosVitales.pa : `${baseRecord.signosVitales.pa || '120/80'} mmHg`,
        fc: (recordData.signosVitales && recordData.signosVitales.fc) ? recordData.signosVitales.fc : `${baseRecord.signosVitales.fc || '75'} lpm`,
        temp: (recordData.signosVitales && recordData.signosVitales.temp) ? recordData.signosVitales.temp : `${baseRecord.signosVitales.temp || '36.5'} °C`,
        imc: (recordData.signosVitales && recordData.signosVitales.imc) ? recordData.signosVitales.imc : `${baseRecord.signosVitales.imc || '23.5'}`,
        estado: recordData.estado || 'Atendida',
        soap: recordData.soap || {
          subjetivo: recordData.motivo || 'Paciente en consulta médica.',
          objetivo: `PA: ${recordData.signosVitales?.pa || '120/80'}, FC: ${recordData.signosVitales?.fc || '75'}, T: ${recordData.signosVitales?.temp || '36.5'}°C, IMC: ${recordData.signosVitales?.imc || '23.5'}`,
          analisis: recordData.diagnostico || baseRecord.lastDiagnosis,
          plan: recordData.plan || 'Plan terapéutico y seguimiento ambulatorio.'
        }
      };
      baseRecord.consultationHistory.unshift(nuevaConsulta);
      baseRecord.lastDiagnosis = nuevaConsulta.diagnostico;
      if (recordData.signosVitales) {
        baseRecord.signosVitales = recordData.signosVitales;
      }
    }

    if (existingIndex >= 0) {
      this.state.medicalRecords[existingIndex] = baseRecord;
    } else {
      this.state.medicalRecords.unshift(baseRecord);
    }

    SupabaseDB.upsertMedicalRecord(baseRecord).catch(e => console.warn('Supabase upsert medical record:', e));
    this.saveState();
    return baseRecord;
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
      SupabaseDB.updateAppointmentStatus(a.id, 'en_guardia').catch(e => console.error(e));
    });

    SupabaseDB.updateEmergencyGuard(this.state.emergencyGuard).catch(e => console.error('Error guardando guardia en Supabase:', e));

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
      SupabaseDB.updateAppointmentStatus(aptId, 'confirmada').catch(e => console.error(e));
    } else if (action === 'cancel') {
      apt.status = 'cancelada';
      apt.notes += ' [Cancelado por fuerza mayor de guardia médica]';
      SupabaseDB.updateAppointmentStatus(aptId, 'cancelada').catch(e => console.error(e));
    }

    this.state.emergencyGuard.affectedAppointments = 
      this.state.emergencyGuard.affectedAppointments.filter(id => id !== aptId);

    if (this.state.emergencyGuard.affectedAppointments.length === 0) {
      this.state.emergencyGuard.isActive = false;
    }

    SupabaseDB.updateEmergencyGuard(this.state.emergencyGuard).catch(e => console.error(e));

    this.saveState();
  }

  deactivateEmergencyGuard() {
    this.state.emergencyGuard.isActive = false;
    SupabaseDB.updateEmergencyGuard(this.state.emergencyGuard).catch(e => console.error(e));
    this.saveState();
  }

  // --- Gestión de Perfiles de Pacientes ---
  getPatientProfiles() {
    return this.state.patientProfiles || [];
  }

  getPatientProfile(cedula) {
    if (!cedula) return null;
    return (this.state.patientProfiles || []).find(p => p.cedula === cedula) || null;
  }

  savePatientProfile(profileData) {
    if (!profileData || !profileData.cedula) return null;
    if (!this.state.patientProfiles) this.state.patientProfiles = [];
    
    const index = this.state.patientProfiles.findIndex(p => p.cedula === profileData.cedula);
    const existing = index >= 0 ? this.state.patientProfiles[index] : {};
    
    const updated = {
      ...existing,
      ...profileData,
      nombreCompleto: profileData.nombreCompleto || `${profileData.nombres || ''} ${profileData.apellidos || ''}`.trim(),
      updatedAt: new Date().toISOString()
    };
    
    if (index >= 0) {
      this.state.patientProfiles[index] = updated;
    } else {
      updated.id = `PAT-PROF-${Math.floor(100 + Math.random() * 900)}`;
      this.state.patientProfiles.unshift(updated);
    }
    
    // Sincronizar en memoria con medicalRecords si coincide
    const medRec = (this.state.medicalRecords || []).find(m => m.patientId === profileData.cedula);
    if (medRec) {
      if (profileData.alergias) medRec.allergies = profileData.alergias;
      if (profileData.tipoSangre) medRec.bloodType = profileData.tipoSangre;
      if (profileData.enfermedadesCronicas) medRec.history = profileData.enfermedadesCronicas;
    }

    this.saveState();
    return updated;
  }

  getPatientAppointments(cedula) {
    if (!cedula) return [];
    return (this.state.appointments || []).filter(a => a.patientId === cedula);
  }

  // --- Clasificación Contable y Auditoría de Gastos ---
  updateExpenseClassification(expId, accountingCategory, auditStatus, costCenter) {
    const exp = (this.state.expenses || []).find(e => e.id === expId);
    if (exp) {
      if (accountingCategory) exp.accountingCategory = accountingCategory;
      if (auditStatus) exp.auditStatus = auditStatus;
      if (costCenter) exp.costCenter = costCenter;
      this.saveState();
      return exp;
    }
    return null;
  }

  auditExpenseVoucher(expId, auditStatus, auditNotes) {
    const exp = (this.state.expenses || []).find(e => e.id === expId);
    if (exp) {
      if (auditStatus) exp.auditStatus = auditStatus;
      if (auditNotes !== undefined) exp.auditNotes = auditNotes;
      this.saveState();
      return exp;
    }
    return null;
  }

  // --- Cálculos Contables y Financieros Oficiales (Supervisión Contable & SRI) ---
  getFinancialSummary() {
    const appointments = this.state.appointments || [];
    const expenses = this.state.expenses || [];

    // Ingresos brutos facturados (excluyendo canceladas)
    const activeAppointments = appointments.filter(a => a.status !== 'cancelada');
    
    let totalGrossRevenue = 0;
    let totalCardFees = 0;
    let totalRetentions = 0;
    
    const clinicBreakdown = {
      ceibos: { name: 'Clínica Ceibos', patientsCount: 0, gross: 0, retentionRate: 0.25, retentions: 0, netDoctor: 0, status: 'Pendiente', costCenterExpenses: 0 },
      mapasingue: { name: 'Consultorio Mapasingue', patientsCount: 0, gross: 0, retentionRate: 0.05, retentions: 0, netDoctor: 0, status: 'Liquidado', costCenterExpenses: 0 },
      alborada: { name: 'Consultorio Alborada', patientsCount: 0, gross: 0, retentionRate: 0.10, retentions: 0, netDoctor: 0, status: 'Liquidado', costCenterExpenses: 0 },
      hospital: { name: 'Hospital Público Ceibos', patientsCount: 0, gross: 0, retentionRate: 0.00, retentions: 0, netDoctor: 0, status: 'Sueldo Fijo', costCenterExpenses: 0 }
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

    // Gastos Operativos y Clasificación Contable en 6 Grupos
    let totalExpenses = 0;
    const expensesByCategory = {
      Transporte: 0,
      Mantenimiento: 0,
      'Suministros Hospital': 0,
      Activos: 0
    };

    const accountingCategoriesSummary = {
      Costos: 0,
      Gastos: 0,
      Activos: 0,
      Patrimonio: 0,
      Ingresos: totalGrossRevenue + HOSPITAL_FIXED_SALARY,
      Egresos: 0
    };

    expenses.forEach(exp => {
      totalExpenses += exp.amount;
      const cat = exp.category || 'Transporte';
      expensesByCategory[cat] = (expensesByCategory[cat] || 0) + exp.amount;

      const accCat = exp.accountingCategory || (cat === 'Suministros Hospital' || cat === 'Mantenimiento' ? 'Costos' : 'Gastos');
      accountingCategoriesSummary[accCat] = (accountingCategoriesSummary[accCat] || 0) + exp.amount;

      // Asignar al centro de costos
      const cc = exp.costCenter || '';
      if (cc.includes('Ceibos') && !cc.includes('Hospital')) clinicBreakdown.ceibos.costCenterExpenses += exp.amount;
      else if (cc.includes('Mapasingue')) clinicBreakdown.mapasingue.costCenterExpenses += exp.amount;
      else if (cc.includes('Alborada')) clinicBreakdown.alborada.costCenterExpenses += exp.amount;
      else if (cc.includes('Hospital')) clinicBreakdown.hospital.costCenterExpenses += exp.amount;
    });

    accountingCategoriesSummary.Egresos = totalExpenses + totalRetentions;

    // Ingreso Neto Real: (Bruto - Retenciones) + Sueldo Fijo Hospital - Gastos Operativos
    const privateClinicsNet = totalGrossRevenue - totalRetentions;
    const realNetIncome = (privateClinicsNet + HOSPITAL_FIXED_SALARY) - totalExpenses;

    // Indicadores y Consejos de Optimización de Rutas
    const routeOptimizations = [
      {
        sede: 'Mapasingue',
        consejo: 'Comisión reducida al 5%: Genera el mayor rendimiento neto por hora ($19.00/paciente). Recomendado abrir 2 turnos matutinos adicionales.',
        impacto: '+ $76.00/semana de ganancia neta'
      },
      {
        sede: 'Ceibos → Hospital',
        consejo: 'Corredor Vía a la Costa: Traslado agrupado de 40 min evita horas de alta congestión (11:30 - 13:00) y reduce 25% el gasto de combustible.',
        impacto: 'Ahorro mensual de ~$35.00 en gasolina'
      },
      {
        sede: 'Hospital Público',
        consejo: 'Los $16.00 asumidos en insumos médicos y traslados de emergencia son deducibles al 100% en la declaración semestral de I.R. del SRI.',
        impacto: 'Crédito tributario fiscal verificado'
      }
    ];

    return {
      totalGrossRevenue,
      totalCardFees,
      totalRetentions,
      totalExpenses,
      hospitalFixedSalary: HOSPITAL_FIXED_SALARY,
      privateClinicsNet,
      realNetIncome,
      clinicBreakdown,
      expensesByCategory,
      accountingCategoriesSummary,
      accountingClassificationTotals: accountingCategoriesSummary,
      routeOptimizations
    };
  }

  // ==========================================================================
  // --- MÓDULO DE AUTOMATIZACIÓN DE CORREOS Y NOTIFICACIONES (Semana 4 - Parte 3) ---
  // ==========================================================================
  addNotificationLog(logData) {
    if (!this.state.notificationLogs) {
      this.state.notificationLogs = [];
    }
    const log = {
      id: `LOG-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      status: 'Entregado',
      timestamp: new Date().toISOString(),
      ...logData
    };
    this.state.notificationLogs.unshift(log);
    this.saveState();
    return log;
  }

  getNotificationLogs() {
    return this.state.notificationLogs || [];
  }

  auditAndSend24hReminders() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const appointments = this.state.appointments || [];
    const targetAppointments = appointments.filter(
      a => (a.date === tomorrowStr || a.date === TODAY_DATE) &&
           a.status !== 'cancelada' &&
           a.status !== 'cancelada_guardia' &&
           (!a.notifications || !a.notifications.reminder24hSent)
    );

    const logs = [];
    targetAppointments.forEach(apt => {
      if (!apt.notifications) {
        apt.notifications = {
          confirmationSent: true,
          confirmationDate: new Date().toISOString(),
          reminder24hSent: false,
          reminderDate: null
        };
      }
      apt.notifications.reminder24hSent = true;
      apt.notifications.reminderDate = new Date().toISOString();

      const clinic = CLINICS[apt.clinicId] || CLINICS.ceibos || { name: 'Sede Ceibos' };
      const recipient = apt.patientEmail || `${apt.patientId || 'paciente'}@montepiedrasalud.ec`;
      const log = this.addNotificationLog({
        type: 'RECORDATORIO_24H',
        title: 'Recordatorio Automático 24h Previas',
        recipient,
        patientName: apt.patientName,
        appointmentCode: apt.code || apt.id,
        sede: clinic.name,
        date: apt.date,
        time: apt.time,
        status: 'Entregado',
        details: `[Automático] Recordatorio 24h enviado a ${apt.patientName} (${recipient}) para su turno en Sede ${clinic.name} a las ${apt.time}`
      });
      logs.push(log);
    });

    this.saveState();
    return { count: logs.length, appointments: targetAppointments, logs };
  }

  // ==========================================================================
  // --- REPROGRAMACIÓN ÁGIL Y CANCELACIÓN ANTE GUARDIAS IMPREVISTAS (Semana 4 - Parte 3) ---
  // ==========================================================================
  rescheduleAppointmentForGuard(aptId, newDate, newTime, reason = 'Llamado a Guardia Hospitalaria') {
    const apt = (this.state.appointments || []).find(a => a.id === aptId);
    if (!apt) return null;

    const oldDate = apt.date;
    const oldTime = apt.time;

    let targetDate = newDate;
    if (!targetDate) {
      const parts = (apt.date || TODAY_DATE).split('-');
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      d.setDate(d.getDate() + (d.getDay() === 5 ? 3 : (d.getDay() === 6 ? 2 : 1)));
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      targetDate = `${y}-${m}-${day}`;
    }

    apt.oldDate = oldDate;
    apt.oldTime = oldTime;
    apt.date = targetDate;
    if (newTime) apt.time = newTime;
    apt.status = 'reprogramada_guardia';
    apt.notes = (apt.notes ? apt.notes + ' | ' : '') + `🚨 Reprogramada por guardia imprevista (${reason}). Turno prioritario asignado para el ${targetDate} a las ${apt.time}.`;

    const clinic = CLINICS[apt.clinicId] || CLINICS.ceibos || { name: 'Clínica Ceibos' };
    const recipient = apt.patientEmail || `${apt.patientId || 'paciente'}@montepiedrasalud.ec`;

    this.addNotificationLog({
      type: 'GUARDIAS_CONTINGENCIA',
      title: 'Reprogramación Asistida por Guardia Hospitalaria',
      recipient,
      patientName: apt.patientName,
      appointmentCode: apt.code || apt.id,
      sede: clinic.name,
      date: apt.date,
      time: apt.time,
      status: 'Notificado',
      details: `[Urgente] Aviso enviado a ${apt.patientName} (${recipient}): Su turno ha sido reprogramado debido a una guardia hospitalaria imprevista del Dr. Campoverde. Se ha reservado su espacio prioritario para el ${targetDate} a las ${apt.time}.`
    });

    SupabaseDB.updateAppointmentStatus(aptId, 'reprogramada_guardia').catch(e => console.warn('Supabase status:', e));
    this.saveState();
    return apt;
  }

  cancelAppointmentForGuard(aptId, reason = 'Fuerza Mayor / Guardia Hospitalaria') {
    const apt = (this.state.appointments || []).find(a => a.id === aptId);
    if (!apt) return null;

    apt.status = 'cancelada_guardia';
    apt.notes = (apt.notes ? apt.notes + ' | ' : '') + `🚨 Cancelada por guardia imprevista (${reason}). Ticket de reembolso/reagendamiento prioritario generado.`;

    const clinic = CLINICS[apt.clinicId] || CLINICS.ceibos || { name: 'Clínica Ceibos' };
    const recipient = apt.patientEmail || `${apt.patientId || 'paciente'}@montepiedrasalud.ec`;

    this.addNotificationLog({
      type: 'GUARDIAS_CONTINGENCIA',
      title: 'Cancelación con Ticket Prioritario por Guardia',
      recipient,
      patientName: apt.patientName,
      appointmentCode: apt.code || apt.id,
      sede: clinic.name,
      date: apt.date,
      time: apt.time,
      status: 'Ticket Emitido',
      details: `[Cancelación Guardia] Aviso enviado a ${apt.patientName} (${recipient}): Su turno en Sede ${clinic.name} fue cancelado por fuerza mayor médica. Ticket prioritario de reubicación y reembolso emitido.`
    });

    SupabaseDB.updateAppointmentStatus(aptId, 'cancelada_guardia').catch(e => console.warn('Supabase status:', e));
    this.saveState();
    return apt;
  }

  // ==========================================================================
  // --- MOTOR DE LIQUIDACIONES SEMANALES Y DEDUCCIONES (Semana 4 - Parte 4) ---
  // ==========================================================================
  getSettlementPeriods() {
    return SETTLEMENT_PERIODS;
  }

  getSettlements() {
    return this.state.settlements || [];
  }

  getSettlementByPeriod(periodKey) {
    const list = this.state.settlements || [];
    return list.find(s => s.periodKey === periodKey || s.id === periodKey) || null;
  }

  calculateWeeklySettlement(periodKey = 'SEM-4', clinicFilter = 'TODAS') {
    const period = SETTLEMENT_PERIODS.find(p => p.key === periodKey) || SETTLEMENT_PERIODS[1];
    const appointments = this.state.appointments || [];
    const expenses = this.state.expenses || [];

    // 1. Filtrar Citas Válidas Atendidas y Pagadas en el Período
    const validAppointments = appointments.filter(a => {
      if (a.status === 'cancelada' || a.status === 'cancelada_guardia') return false;
      if (periodKey !== 'TODAS') {
        const aptDate = a.date;
        if (!aptDate) return false;
        if (aptDate < period.startDate || aptDate > period.endDate) return false;
      }
      if (clinicFilter !== 'TODAS' && a.clinicId !== clinicFilter) {
        return false;
      }
      return true;
    });

    // 2. Filtrar Gastos Operativos de Traslado e Insumos en el Período (Semana 3)
    const validExpenses = expenses.filter(e => {
      if (periodKey !== 'TODAS') {
        const expDate = e.date || (e.fechaHora ? e.fechaHora.split('T')[0] : '');
        if (!expDate) return false;
        if (expDate < period.startDate || expDate > period.endDate) return false;
      }
      if (clinicFilter !== 'TODAS') {
        const costCenter = (e.costCenter || '').toLowerCase();
        const sedeCode = (e.sedeCodigo || '').toLowerCase();
        const matchesSede = costCenter.includes(clinicFilter) || sedeCode.includes(clinicFilter);
        if (!matchesSede) return false;
      }
      return true;
    });

    let ingresosBrutos = 0;
    let totalRetenciones = 0;
    const deduccionesSede = {
      ceibos: 0,
      alborada: 0,
      mapasingue: 0,
      hospital: 0,
      total: 0
    };

    const clinicBreakdown = {
      ceibos: { name: 'Clínica Ceibos', rate: 0.25, count: 0, gross: 0, retentions: 0, netDoctor: 0 },
      alborada: { name: 'Sede Alborada', rate: 0.10, count: 0, gross: 0, retentions: 0, netDoctor: 0 },
      mapasingue: { name: 'Sede Mapasingue', rate: 0.05, count: 0, gross: 0, retentions: 0, netDoctor: 0 },
      hospital: { name: 'Hospital Público Ceibos', rate: 0.00, count: 0, gross: 0, retentions: 0, netDoctor: 0 }
    };

    const citasDetalle = validAppointments.map(apt => {
      const clinic = CLINICS[apt.clinicId] || { name: 'Consultorio', retentionRate: 0.10, color: '#0284c7' };
      const basePrice = Number(apt.basePrice != null ? apt.basePrice : 20.00);
      const retentionRate = Number(clinic.retentionRate != null ? clinic.retentionRate : (apt.retentionRate || 0.10));
      const retentionAmount = Number(apt.retentionAmount != null ? apt.retentionAmount : (basePrice * retentionRate));
      const netDoctor = Number(apt.netClinicYield != null ? apt.netClinicYield : (basePrice - retentionAmount));

      ingresosBrutos += basePrice;
      totalRetenciones += retentionAmount;
      if (deduccionesSede[apt.clinicId] != null) {
        deduccionesSede[apt.clinicId] += retentionAmount;
      }

      if (clinicBreakdown[apt.clinicId]) {
        clinicBreakdown[apt.clinicId].count += 1;
        clinicBreakdown[apt.clinicId].gross += basePrice;
        clinicBreakdown[apt.clinicId].retentions += retentionAmount;
        clinicBreakdown[apt.clinicId].netDoctor += netDoctor;
      }

      return {
        id: apt.id,
        code: apt.code || apt.id,
        date: apt.date,
        time: apt.time,
        patientName: apt.patientName,
        patientId: apt.patientId,
        clinicId: apt.clinicId,
        clinicName: clinic.name,
        clinicColor: clinic.color,
        basePrice,
        retentionRate,
        retentionPct: (retentionRate * 100).toFixed(0),
        retentionAmount,
        netDoctor,
        paymentMethod: apt.paymentMethod || 'efectivo',
        feeAmount: apt.feeAmount || 0,
        totalPaid: apt.totalPaid || basePrice,
        settlementStatus: apt.settlementStatus || 'Pendiente'
      };
    });

    deduccionesSede.total = totalRetenciones;

    let gastosOperativos = 0;
    validExpenses.forEach(exp => {
      gastosOperativos += Number(exp.amount || exp.monto || 0);
    });

    // Fórmula contractual: (Ingresos Brutos - Retenciones de Sede) - Gastos Operativos Reembolsables/Deducibles
    const netoAntesGastos = ingresosBrutos - totalRetenciones;
    const honorariosNetos = netoAntesGastos - gastosOperativos;
    const netoAPagar = Math.max(0, honorariosNetos);

    // Buscar si existe registro formal en settlements
    const existingSettlement = (this.state.settlements || []).find(s => s.periodKey === periodKey);
    const estado = existingSettlement ? existingSettlement.estado : 'pendiente';

    return {
      periodKey,
      periodInfo: period,
      clinicFilter,
      ingresosBrutos,
      deduccionesSede,
      totalRetenciones,
      gastosOperativos,
      netoAntesGastos,
      netoAPagar,
      clinicBreakdown,
      citas: citasDetalle,
      citasCount: citasDetalle.length,
      gastosCount: validExpenses.length,
      gastos: validExpenses,
      estado,
      settlementRecord: existingSettlement,
      fechaCorte: existingSettlement ? existingSettlement.fechaCorte : null
    };
  }

  closeAndApproveSettlement(periodKey, calcResult) {
    if (!this.state.settlements) {
      this.state.settlements = [];
    }

    const period = SETTLEMENT_PERIODS.find(p => p.key === periodKey) || { label: periodKey, name: periodKey };
    const nowIso = new Date().toISOString();

    let record = this.state.settlements.find(s => s.periodKey === periodKey);
    if (!record) {
      record = {
        id: `LIQ-${periodKey}-${Date.now().toString().slice(-4)}`,
        periodo: period.label || period.name,
        periodKey,
        doctorId: 'DOC-001',
        doctorName: 'Dr. Carlos Campoverde',
        accountantName: 'Lcda. Patricia Morales'
      };
      this.state.settlements.unshift(record);
    }

    record.fechaCorte = nowIso;
    record.ingresosBrutos = calcResult.ingresosBrutos;
    record.deduccionesSede = calcResult.deduccionesSede;
    record.gastosOperativos = calcResult.gastosOperativos;
    record.netoAPagar = calcResult.netoAPagar;
    record.citasCount = calcResult.citasCount;
    record.gastosCount = calcResult.gastosCount;
    record.estado = 'liquidada';
    record.aprobadoPor = 'Lcda. Patricia Morales (Auditora)';
    record.fechaAprobacion = nowIso;
    record.observaciones = `Corte semanal liquidado y aprobado el ${new Date(nowIso).toLocaleString('es-EC')}. Deducciones contractuales por consultorio consolidadas y gastos operativos deducidos.`;

    // Actualizar citas a 'Liquidado'
    if (calcResult.citas && calcResult.citas.length > 0) {
      const aptIds = new Set(calcResult.citas.map(c => c.id));
      (this.state.appointments || []).forEach(a => {
        if (aptIds.has(a.id)) {
          a.settlementStatus = 'Liquidado';
        }
      });
    }

    // Actualizar gastos a 'LIQUIDADO'
    if (calcResult.gastos && calcResult.gastos.length > 0) {
      const expIds = new Set(calcResult.gastos.map(g => g.id));
      (this.state.expenses || []).forEach(e => {
        if (expIds.has(e.id)) {
          e.estadoLiquidacion = 'LIQUIDADO';
          e.estado_liquidacion = 'LIQUIDADO';
        }
      });
    }

    this.addNotificationLog({
      type: 'LIQUIDACION_SEMANAL',
      title: 'Liquidación Semanal Cerrada y Aprobada',
      recipient: 'carlos.campoverde@montepiedrasalud.ec',
      patientName: 'Dr. Carlos Campoverde',
      appointmentCode: record.id,
      sede: 'Multisede',
      date: nowIso.split('T')[0],
      time: nowIso.split('T')[1].slice(0, 5),
      status: 'Aprobado',
      details: `[Liquidación Semanal] Período ${record.periodo} cerrado por Auditoría Contable. Ingresos Brutos: $${record.ingresosBrutos.toFixed(2)}, Retenciones: -$${record.deduccionesSede.total.toFixed(2)}, Gastos Deducibles: -$${record.gastosOperativos.toFixed(2)}, Neto Transferido: $${record.netoAPagar.toFixed(2)}.`
    });

    this.saveState();
    return record;
  }

  // ==========================================================================
  // --- TABLERO CONTABLE, BALANCE DE CAJA Y CONCILIACIÓN (Semana 5 - Parte 1) ---
  // ==========================================================================
  getAccountingBalance(periodKey = 'TODAS') {
    const appointments = this.state.appointments || [];
    const expenses = this.state.expenses || [];
    const today = TODAY_DATE;

    const filterAppointments = appointments.filter(a => {
      if (a.status === 'cancelada' || a.status === 'cancelada_guardia') return false;
      if (periodKey === 'HOY') {
        return a.date === today;
      } else if (periodKey === 'SEM-5' || periodKey === 'SEM-ACTIVA') {
        return a.date >= '2026-10-15' && a.date <= '2026-10-21';
      } else if (periodKey === 'SEM-4') {
        return a.date >= '2026-10-08' && a.date <= '2026-10-14';
      } else if (periodKey === 'SEM-3') {
        return a.date >= '2026-10-01' && a.date <= '2026-10-07';
      } else if (periodKey === 'SEM-2') {
        return a.date >= '2026-09-24' && a.date <= '2026-09-30';
      } else if (periodKey === 'SEM-1') {
        return a.date >= '2026-09-15' && a.date <= '2026-09-23';
      }
      return true; // 'TODAS'
    });

    const filterExpenses = expenses.filter(e => {
      const expDate = e.date || (e.fechaHora ? e.fechaHora.split('T')[0] : '');
      if (periodKey === 'HOY') {
        return expDate === today;
      } else if (periodKey === 'SEM-5' || periodKey === 'SEM-ACTIVA') {
        return expDate >= '2026-10-15' && expDate <= '2026-10-21';
      } else if (periodKey === 'SEM-4') {
        return expDate >= '2026-10-08' && expDate <= '2026-10-14';
      } else if (periodKey === 'SEM-3') {
        return expDate >= '2026-10-01' && expDate <= '2026-10-07';
      } else if (periodKey === 'SEM-2') {
        return expDate >= '2026-09-24' && expDate <= '2026-09-30';
      } else if (periodKey === 'SEM-1') {
        return expDate >= '2026-09-15' && expDate <= '2026-09-23';
      }
      return true; // 'TODAS'
    });

    let totalRevenue = 0;
    let baseRevenue = 0;
    let totalSurcharges = 0;
    let totalCommissions = 0;

    const venueDistribution = {
      ceibos: { id: 'ceibos', name: 'Clínica Ceibos', rate: 0.25, gross: 0, retentions: 0, net: 0, count: 0, color: '#6366f1' },
      alborada: { id: 'alborada', name: 'Sede Alborada', rate: 0.10, gross: 0, retentions: 0, net: 0, count: 0, color: '#10b981' },
      mapasingue: { id: 'mapasingue', name: 'Sede Mapasingue', rate: 0.05, gross: 0, retentions: 0, net: 0, count: 0, color: '#0284c7' },
      hospital: { id: 'hospital', name: 'Hospital Público', rate: 0.00, gross: 0, retentions: 0, net: 0, count: 0, color: '#f59e0b' }
    };

    const paymentMix = {
      efectivo: { label: 'Efectivo en Caja', count: 0, baseAmount: 0, totalAmount: 0, color: '#10b981', icon: '💵' },
      transferencia: { label: 'Transferencia Bancaria', count: 0, baseAmount: 0, totalAmount: 0, color: '#0284c7', icon: '🏦' },
      tarjeta: { label: 'Tarjeta de Crédito / Débito', count: 0, baseAmount: 0, surchargeAmount: 0, totalAmount: 0, color: '#8b5cf6', icon: '💳' }
    };

    filterAppointments.forEach(apt => {
      const base = Number(apt.basePrice != null ? apt.basePrice : 20.00);
      const fee = Number(apt.feeAmount != null ? apt.feeAmount : (apt.paymentMethod === 'tarjeta' ? base * 0.0975 : 0));
      const totalPaid = Number(apt.totalPaid != null ? apt.totalPaid : (base + fee));
      const clinic = CLINICS[apt.clinicId] || { retentionRate: 0.10 };
      const rate = Number(clinic.retentionRate != null ? clinic.retentionRate : 0.10);
      const retention = Number(apt.retentionAmount != null ? apt.retentionAmount : (base * rate));
      const net = base - retention;

      totalRevenue += totalPaid;
      baseRevenue += base;
      totalSurcharges += fee;
      totalCommissions += retention;

      const v = venueDistribution[apt.clinicId] || venueDistribution.ceibos;
      v.gross += base;
      v.retentions += retention;
      v.net += net;
      v.count += 1;

      const method = (apt.paymentMethod || 'efectivo').toLowerCase();
      if (method.includes('tarjeta')) {
        paymentMix.tarjeta.count += 1;
        paymentMix.tarjeta.baseAmount += base;
        paymentMix.tarjeta.surchargeAmount += fee;
        paymentMix.tarjeta.totalAmount += totalPaid;
      } else if (method.includes('transferencia')) {
        paymentMix.transferencia.count += 1;
        paymentMix.transferencia.baseAmount += base;
        paymentMix.transferencia.totalAmount += totalPaid;
      } else {
        paymentMix.efectivo.count += 1;
        paymentMix.efectivo.baseAmount += base;
        paymentMix.efectivo.totalAmount += totalPaid;
      }
    });

    let totalExpenses = 0;
    const expensesByCategory = {
      transporte: 0,
      insumos: 0,
      mantenimiento: 0
    };

    filterExpenses.forEach(exp => {
      const amt = Number(exp.amount || exp.monto || 0);
      totalExpenses += amt;
      const cat = (exp.category || exp.tipoGasto || '').toLowerCase();
      if (cat.includes('transporte') || cat.includes('gasolina') || cat.includes('taxi') || cat.includes('peaje')) {
        expensesByCategory.transporte += amt;
      } else if (cat.includes('insumo') || cat.includes('suministro')) {
        expensesByCategory.insumos += amt;
      } else {
        expensesByCategory.mantenimiento += amt;
      }
    });

    // Utilidad Operativa Disponible: (Base de Consultas - Retenciones) - Gastos Reembolsados
    const netProfit = (baseRevenue - totalCommissions) - totalExpenses;
    const netRetainedTreasury = totalCommissions - totalExpenses;

    Object.keys(venueDistribution).forEach(k => {
      const v = venueDistribution[k];
      v.percentage = baseRevenue > 0 ? (v.gross / baseRevenue) * 100 : 0;
      v.marginRate = v.gross > 0 ? ((v.net / v.gross) * 100).toFixed(0) : '0';
    });

    Object.keys(paymentMix).forEach(k => {
      const p = paymentMix[k];
      p.percentage = totalRevenue > 0 ? (p.totalAmount / totalRevenue) * 100 : 0;
    });

    if (!this.state.accountingBalance) {
      this.state.accountingBalance = {
        totalRevenue: 0,
        totalCommissions: 0,
        totalExpenses: 0,
        netProfit: 0,
        reconciliationHistory: []
      };
    }

    const reconciliationHistory = this.state.accountingBalance.reconciliationHistory || [];

    return {
      periodKey,
      totalRevenue,
      baseRevenue,
      totalSurcharges,
      totalCommissions,
      totalExpenses,
      netProfit,
      netRetainedTreasury,
      citasCount: filterAppointments.length,
      gastosCount: filterExpenses.length,
      appointments: filterAppointments,
      expenses: filterExpenses,
      venueDistribution,
      paymentMix,
      expensesByCategory,
      reconciliationHistory
    };
  }

  reconcileAccountingPeriod(periodKey, notes = '') {
    const balance = this.getAccountingBalance(periodKey);
    const nowIso = new Date().toISOString();

    const periodLabels = {
      'HOY': 'Corte del Día (Hoy)',
      'SEM-5': 'Semana 5 (15 Oct - 21 Oct 2026)',
      'SEM-4': 'Semana 4 (08 Oct - 14 Oct 2026)',
      'SEM-3': 'Semana 3 (01 Oct - 07 Oct 2026)',
      'SEM-2': 'Semana 2 (24 Sep - 30 Sep 2026)',
      'SEM-1': 'Semana 1 (17 Sep - 23 Sep 2026)',
      'TODAS': 'Consolidado Histórico Multisede'
    };

    const periodLabel = periodLabels[periodKey] || `Período ${periodKey}`;

    const newRecord = {
      id: `REC-${Date.now().toString().slice(-6)}`,
      period: periodLabel,
      periodKey,
      reconciledAt: nowIso,
      auditor: 'Lcda. Patricia Morales (CPA-38491)',
      totalRevenue: balance.totalRevenue,
      totalCommissions: balance.totalCommissions,
      totalExpenses: balance.totalExpenses,
      netProfit: balance.netProfit,
      citasCount: balance.citasCount,
      gastosCount: balance.gastosCount,
      status: 'CONCILIADO_SRI',
      notes: notes || `Cierre formal de balance y conciliación de caja sin descuadre para ${periodLabel}.`
    };

    if (!this.state.accountingBalance) {
      this.state.accountingBalance = {
        totalRevenue: 0,
        totalCommissions: 0,
        totalExpenses: 0,
        netProfit: 0,
        reconciliationHistory: []
      };
    }

    if (!this.state.accountingBalance.reconciliationHistory) {
      this.state.accountingBalance.reconciliationHistory = [];
    }

    this.state.accountingBalance.reconciliationHistory.unshift(newRecord);
    this.state.accountingBalance.totalRevenue = balance.totalRevenue;
    this.state.accountingBalance.totalCommissions = balance.totalCommissions;
    this.state.accountingBalance.totalExpenses = balance.totalExpenses;
    this.state.accountingBalance.netProfit = balance.netProfit;

    // Actualizar citas y gastos como conciliados
    const aptIds = new Set(balance.appointments.map(a => a.id));
    (this.state.appointments || []).forEach(a => {
      if (aptIds.has(a.id)) {
        a.settlementStatus = 'Liquidado';
        a.reconciled = true;
      }
    });

    const expIds = new Set(balance.expenses.map(e => e.id));
    (this.state.expenses || []).forEach(e => {
      if (expIds.has(e.id)) {
        e.estadoLiquidacion = 'LIQUIDADO';
        e.estado_liquidacion = 'LIQUIDADO';
        e.reconciled = true;
      }
    });

    this.addNotificationLog({
      type: 'CIERRE_CAJA_CONCILIACION',
      title: 'Cierre de Ejercicio y Conciliación SRI Aprobada',
      recipient: 'contabilidad@clinicamed.com',
      patientName: 'Auditoría Fiscal SRI',
      appointmentCode: newRecord.id,
      sede: 'Multisede',
      date: nowIso.split('T')[0],
      time: nowIso.split('T')[1].slice(0, 5),
      status: 'Aprobado',
      details: `[Cierre de Caja] ${periodLabel} conciliado por Lcda. Morales. Ingresos Facturados: $${newRecord.totalRevenue.toFixed(2)}, Retenciones: $${newRecord.totalCommissions.toFixed(2)}, Egresos Reembolsados: $${newRecord.totalExpenses.toFixed(2)}, Balance Neto: $${newRecord.netProfit.toFixed(2)}.`
    });

    this.saveState();
    return newRecord;
  }

  // ==========================================================================
  // --- RELEVO MÉDICO Y ALERTAS OPERATIVAS (Semana 5 - Parte 2) ---
  // ==========================================================================
  assignDoctorRelief({
    coveringDoctor = 'Dra. Elena Morales',
    coveringDoctorCode = 'MSP-REG-092834',
    coveringDoctorSpecialty = 'Medicina Familiar y Comunitaria',
    coveringDoctorPhone = '+593 98 471 9283',
    reason = 'Guardia imprevista hospitalaria',
    scope = 'citas_especificas',
    appointmentIds = [],
    date = TODAY_DATE
  } = {}) {
    if (!this.state.reliefAssignments) {
      this.state.reliefAssignments = [];
    }

    const reliefId = `REL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const nowIso = new Date().toISOString();

    const targetIds = new Set(appointmentIds);
    let affectedCount = 0;
    const affectedAppointments = [];

    (this.state.appointments || []).forEach(apt => {
      const matches = scope === 'guardia_completa' 
        ? (apt.date === date && apt.status !== 'cancelada' && apt.status !== 'cancelada_guardia')
        : targetIds.has(apt.id);

      if (matches) {
        apt.status = 'relevo_asignado';
        apt.reliefDoctor = coveringDoctor;
        apt.reliefDoctorCode = coveringDoctorCode;
        apt.reliefDoctorSpecialty = coveringDoctorSpecialty;
        apt.reliefReason = reason;
        apt.reliefId = reliefId;
        apt.reliefAssignedAt = nowIso;
        affectedCount += 1;
        affectedAppointments.push(apt);

        const clinic = CLINICS[apt.clinicId] || { name: apt.clinicId || 'Sede Médica' };

        // Disparar notificación simulada al paciente
        this.addNotificationLog({
          type: 'RELEVO_MEDICO',
          title: 'Aviso de Relevo y Cobertura Médica',
          recipient: apt.patientEmail || 'paciente@montepiedrasalud.ec',
          patientName: apt.patientName,
          appointmentCode: apt.code || apt.id,
          sede: clinic.name,
          date: apt.date,
          time: apt.time,
          status: 'Entregado',
          details: `Su atención médica en Sede ${clinic.name} será cubierta por ${coveringDoctor} en el mismo horario acordado (${apt.time}).`
        });
      }
    });

    const newRelief = {
      id: reliefId,
      date,
      createdAt: nowIso,
      originalDoctor: 'Dr. Carlos Campoverde',
      originalDoctorCode: 'MSP-REG-84729',
      coveringDoctor,
      coveringDoctorCode,
      coveringDoctorSpecialty,
      coveringDoctorPhone,
      reason,
      scope,
      reassignedCount: affectedCount,
      appointmentIds: affectedAppointments.map(a => a.id),
      status: 'activo'
    };

    this.state.reliefAssignments.unshift(newRelief);

    if (!this.state.systemAlerts) this.state.systemAlerts = [];
    this.state.systemAlerts.unshift({
      id: `ALT-REL-${Date.now().toString().slice(-4)}`,
      type: 'RELIEF_ACTIVE',
      severity: 'INFO',
      icon: '🔄',
      title: `Relevo Asignado: ${coveringDoctor}`,
      message: `${affectedCount} consulta(s) transferida(s) a ${coveringDoctor} para la fecha ${date}. Pacientes notificados.`,
      category: 'agenda',
      date,
      time: nowIso.split('T')[1].slice(0, 5),
      actionRequired: 'Revisar expediente previo para pase de guardia.',
      dismissed: false
    });

    this.saveState();
    this.notify();

    return {
      relief: newRelief,
      affectedAppointments
    };
  }

  getReliefAssignments() {
    return this.state.reliefAssignments || [];
  }

  getSystemAlerts() {
    if (!this.state.systemAlerts) this.state.systemAlerts = [];
    return this.state.systemAlerts.filter(a => !a.dismissed);
  }

  dismissSystemAlert(alertId) {
    if (!this.state.systemAlerts) return;
    const alert = this.state.systemAlerts.find(a => a.id === alertId);
    if (alert) {
      alert.dismissed = true;
      this.saveState();
      this.notify();
    }
  }

  getPrescriptions() {
    return this.state.prescriptions || [];
  }

  resetDemoData() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('cita_medica_pacientes');
      localStorage.removeItem('montepiedra_pacientes');
    } catch (e) {
      console.warn('Error limpiando localStorage:', e);
    }
    this.state = JSON.parse(JSON.stringify(INITIAL_STATE));
    this.saveState();
    this.notify();
    return this.state;
  }
}

export const store = new StateStore();
