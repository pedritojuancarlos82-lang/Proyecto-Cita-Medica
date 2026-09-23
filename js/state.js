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

export const store = new StateStore();
