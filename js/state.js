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
    basePrice: 21.95, // Precio oficial estándar de lista
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
    realCost: 20.00,
    listPrice: 21.95, // 9.75% sobre costo real
    basePrice: 21.95, // Precio oficial estándar de lista
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
    realCost: 10.00,
    listPrice: 10.98, // 9.75% sobre costo real
    basePrice: 10.98, // Precio oficial estándar de lista
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
    realCost: 0.00,
    listPrice: 0.00,
    basePrice: 0.00, // Gratuito
    retentionRate: 0.00,
    color: '#f59e0b', // Naranja Hospital
    badgeClass: 'badge-hospital',
    image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=600&auto=format&fit=crop&q=80'
  }
};

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

  // Registro de Gastos Diarios y Operativos (Clasificación Contable Oficial y Auditoría)
  expenses: [
    {
      id: 'EXP-101',
      date: TODAY_DATE,
      category: 'Transporte',
      accountingCategory: 'Gastos',
      description: 'Gasolina Super para traslados entre clínicas',
      amount: 15.00,
      paymentMethod: 'Efectivo',
      voucherType: 'Factura Electrónica',
      voucherNumber: '001-002-000847291',
      providerName: 'Estación Primax Ceibos',
      providerRuc: '0992384756001',
      auditStatus: 'Aprobado',
      costCenter: 'General Movilidad',
      auditNotes: 'Comprobante cotejado con ruta Alborada-Ceibos.',
      quickLogged: true,
      deductibleSRI: true
    },
    {
      id: 'EXP-102',
      date: TODAY_DATE,
      category: 'Transporte',
      accountingCategory: 'Gastos',
      description: 'Carrera de Taxi hacia Hospital Público Ceibos',
      amount: 4.00,
      paymentMethod: 'Efectivo',
      voucherType: 'Recibo / Vale',
      voucherNumber: 'VAL-2026-042',
      providerName: 'Cooperativa Taxi Ceibos',
      providerRuc: '0991122334001',
      auditStatus: 'Aprobado',
      costCenter: 'Hospital Ceibos',
      auditNotes: 'Movilización por emergencia de guardia hospitalaria.',
      quickLogged: true,
      deductibleSRI: true
    },
    {
      id: 'EXP-103',
      date: TODAY_DATE,
      category: 'Suministros Hospital',
      accountingCategory: 'Costos',
      description: 'Insumos médicos de emergencia (Guantes de nitrilo, gasas estériles y antiséptico)',
      amount: 12.00,
      paymentMethod: 'Efectivo',
      voucherType: 'Factura Electrónica',
      voucherNumber: '002-005-001294812',
      providerName: 'Distribuidora Farmacéutica Difare',
      providerRuc: '0990011223001',
      auditStatus: 'Aprobado',
      costCenter: 'Hospital Ceibos',
      auditNotes: 'Insumos para atención de choque hospitalario.',
      quickLogged: true,
      deductibleSRI: true
    },
    {
      id: 'EXP-104',
      date: '2026-09-18',
      category: 'Mantenimiento',
      accountingCategory: 'Costos',
      description: 'Desinfección y calibración de tensiómetro aneroide',
      amount: 25.00,
      paymentMethod: 'Transferencia',
      voucherType: 'Factura Electrónica',
      voucherNumber: '001-010-000004921',
      providerName: 'Biomédica del Litoral S.A.',
      providerRuc: '0991928374001',
      auditStatus: 'Aprobado',
      costCenter: 'Sede Mapasingue',
      auditNotes: 'Mantenimiento preventivo de equipo instrumental.',
      quickLogged: false,
      deductibleSRI: true
    },
    {
      id: 'EXP-105',
      date: '2026-09-15',
      category: 'Transporte',
      accountingCategory: 'Gastos',
      description: 'Peajes urbanos Vía a la Costa y combustible',
      amount: 18.50,
      paymentMethod: 'Efectivo',
      voucherType: 'Factura Electrónica',
      voucherNumber: '003-001-000994821',
      providerName: 'Gasolinera Mobil Vía a la Costa',
      providerRuc: '0990887766001',
      auditStatus: 'Aprobado',
      costCenter: 'Sede Ceibos',
      auditNotes: 'Desplazamiento para turno extendido.',
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
      id: `APT-${idNum}`,
      code: `MED-${Math.floor(10000 + Math.random() * 90000)}`,
      status: 'confirmada',
      settlementStatus: 'Pendiente',
      ...appointmentData
    };

    // Calcular montos y retenciones según sede
    const clinic = CLINICS[newApt.clinicId] || CLINICS.ceibos;
    newApt.basePrice = (appointmentData.basePrice !== undefined && appointmentData.basePrice !== null && !isNaN(appointmentData.basePrice))
      ? Number(appointmentData.basePrice)
      : clinic.basePrice;
    newApt.retentionRate = (clinic.retentionRate !== undefined) ? clinic.retentionRate : 0.05;

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
    SupabaseDB.insertExpense(newExp).catch(e => console.error('Error guardando gasto en Supabase:', e));
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
    SupabaseDB.insertPrescription(newRx).catch(e => console.error('Error guardando receta en Supabase:', e));
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
}

export const store = new StateStore();
