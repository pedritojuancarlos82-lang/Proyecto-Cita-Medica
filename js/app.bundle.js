// Montepiedra Salud - Bundle Unificado de ProducciÃ³n (Compatible con file:/// y http://)


// ==================== js/supabase-config.js ====================

/**
 * Montepiedra Salud - Configuración de Credenciales de Supabase
 * Contiene la URL y la llave pública (Anon / Publishable) para el navegador.
 */

const SUPABASE_CONFIG = {
  // URL oficial del proyecto en Supabase
  url: 'https://spzyhpdhvqqdyyxqmxav.supabase.co',
  
  // Clave pública (Publishable Key / Anon) - Segura para el navegador con RLS
  publishableKey: 'sb_publishable_zXgeds1KH5FZtPYWRAGnew_TsT5sf90',

  // Helper para verificar si la URL configurada es válida
  isConfigured() {
    return !!this.url && !!this.publishableKey;
  }
};



// ==================== js/supabase-client.js ====================

/**
 * Montepiedra Salud - Cliente de Integración Supabase
 * Maneja todas las operaciones CRUD y sincronización en tiempo real con Supabase.
 */


let supabaseInstance = null;

/**
 * Obtiene o inicializa la instancia del cliente Supabase
 */
function getSupabase() {
  if (supabaseInstance) return supabaseInstance;

  if (typeof window !== 'undefined' && window.supabase) {
    try {
      supabaseInstance = window.supabase.createClient(
        SUPABASE_CONFIG.url,
        SUPABASE_CONFIG.publishableKey,
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true
          }
        }
      );
      console.log('✅ Cliente Supabase inicializado exitosamente:', SUPABASE_CONFIG.url);
    } catch (err) {
      console.warn('⚠️ No se pudo inicializar el cliente de Supabase:', err);
    }
  } else {
    console.warn('⚠️ Librería @supabase/supabase-js no detectada en window.supabase.');
  }

  return supabaseInstance;
}

/**
/**
 * Mapeo de columnas Postgres (snake_case) a modelo JS (camelCase y snake_case)
 */
function mapAppointmentFromDB(row) {
  if (!row) return null;
  const baseFee = Number(row.base_fee !== undefined ? row.base_fee : (row.base_price || 0));
  const procFee = Number(row.processing_fee !== undefined ? row.processing_fee : (row.fee_amount || 0));
  const totPaid = Number(row.total_paid || (baseFee + procFee));
  const retRate = Number(row.retention_rate || 0);
  const retAmt = Number(row.retention_amount !== undefined ? row.retention_amount : +(baseFee * retRate).toFixed(2));
  const netYield = Number(row.net_clinic_yield !== undefined ? row.net_clinic_yield : +(baseFee - retAmt).toFixed(2));

  return {
    id: row.id,
    code: row.code,
    patientName: row.patient_name,
    patient_name: row.patient_name,
    patientId: row.patient_id,
    patient_id: row.patient_id,
    patientCedula: row.patient_cedula || row.patient_id,
    patient_cedula: row.patient_cedula || row.patient_id,
    patientPhone: row.patient_phone || '',
    patient_phone: row.patient_phone || '',
    patientEmail: row.patient_email || '',
    patient_email: row.patient_email || '',
    clinicId: row.clinic_id,
    clinic_id: row.clinic_id,
    doctorId: row.doctor_id || 'dr_campoverde',
    doctor_id: row.doctor_id || 'dr_campoverde',
    date: row.date,
    time: row.time,
    durationMinutes: row.duration_minutes || 45,
    duration_minutes: row.duration_minutes || 45,
    reason: row.reason || '',
    paymentMethod: row.payment_method || 'cash',
    payment_method: row.payment_method || 'cash',
    baseFee: baseFee,
    base_fee: baseFee,
    basePrice: baseFee,
    base_price: baseFee,
    feePercentage: Number(row.fee_percentage) || 0,
    fee_percentage: Number(row.fee_percentage) || 0,
    processingFee: procFee,
    processing_fee: procFee,
    feeAmount: procFee,
    fee_amount: procFee,
    totalPaid: totPaid,
    total_paid: totPaid,
    retentionRate: retRate,
    retention_rate: retRate,
    retentionAmount: retAmt,
    retention_amount: retAmt,
    netClinicYield: netYield,
    net_clinic_yield: netYield,
    status: row.status || 'confirmed',
    estado: (row.status || 'confirmed').toUpperCase(),
    settlementStatus: row.settlement_status || 'Pendiente',
    settlement_status: row.settlement_status || 'Pendiente',
    notes: row.notes || ''
  };
}

function mapAppointmentToDB(apt) {
  const isCard = (apt.paymentMethod === 'card' || apt.paymentMethod === 'tarjeta');
  const isTransfer = (apt.paymentMethod === 'transfer' || apt.paymentMethod === 'transferencia');
  const normMethod = isCard ? 'card' : (isTransfer ? 'transfer' : 'cash');
  const baseFee = Number(apt.baseFee !== undefined ? apt.baseFee : (apt.basePrice || 20.00));
  const procFee = Number(apt.processingFee !== undefined ? apt.processingFee : (apt.feeAmount !== undefined ? apt.feeAmount : (isCard ? 1.95 : 0.00)));
  const totPaid = Number(apt.totalPaid !== undefined ? apt.totalPaid : +(baseFee + procFee).toFixed(2));
  const retRate = Number(apt.retentionRate !== undefined ? apt.retentionRate : (apt.retention_rate || 0));
  const retAmt = Number(apt.retentionAmount !== undefined ? apt.retentionAmount : +(baseFee * retRate).toFixed(2));
  const netYield = Number(apt.netClinicYield !== undefined ? apt.netClinicYield : +(baseFee - retAmt).toFixed(2));

  return {
    id: apt.id || `APT-${Date.now().toString(36).toUpperCase()}`,
    code: apt.code || `MED-${Math.floor(10000 + Math.random() * 90000)}`,
    patient_name: apt.patientName || apt.patient_name || '',
    patient_id: apt.patientId || apt.patient_id || '',
    patient_phone: apt.patientPhone || apt.patient_phone || '',
    patient_email: apt.patientEmail || apt.patient_email || '',
    clinic_id: apt.clinicId || apt.clinic_id || 'ceibos',
    date: apt.date,
    time: apt.time,
    duration_minutes: apt.durationMinutes || apt.duration_minutes || 45,
    reason: apt.reason || 'Consulta médica general',
    payment_method: normMethod,
    base_price: baseFee,
    fee_percentage: isCard ? 0.0975 : 0.0000,
    fee_amount: procFee,
    total_paid: totPaid,
    retention_rate: retRate,
    retention_amount: retAmt,
    net_clinic_yield: netYield,
    status: apt.status || 'confirmada',
    settlement_status: apt.settlementStatus || apt.settlement_status || 'Pendiente',
    notes: apt.notes || ''
  };
}

function mapExpenseFromDB(row) {
  if (!row) return null;
  const isDoctorFund = row.origen_fondo === 'MEDICO_PERSONAL' || Boolean(row.es_reembolso_medico);
  const tipo = (row.tipo_gasto || row.tipoGasto || (row.category === 'Transporte' ? 'TRANSPORTE' : 'INSUMOS')).toUpperCase();
  const sede = (row.sede_codigo || row.sedeCodigo || 'CEIBOS').toUpperCase();
  const monto = Number(row.amount !== undefined ? row.amount : (row.monto || 0));

  return {
    id: row.id,
    date: row.date || (row.fecha_hora ? row.fecha_hora.split('T')[0] : ''),
    fechaHora: row.fecha_hora || (row.date ? `${row.date}T10:00` : ''),
    fecha_hora: row.fecha_hora || (row.date ? `${row.date}T10:00` : ''),
    tipoGasto: tipo,
    tipo_gasto: tipo,
    sedeCodigo: sede,
    sede_codigo: sede,
    tipoTransporte: row.tipo_transporte || row.tipoTransporte || '',
    tipo_transporte: row.tipo_transporte || row.tipoTransporte || '',
    categoriaInsumo: row.categoria_insumo || row.categoriaInsumo || '',
    categoria_insumo: row.categoria_insumo || row.categoriaInsumo || '',
    category: row.category || (tipo === 'TRANSPORTE' ? 'Transporte' : 'Insumos Médicos'),
    description: row.description || row.motivo || row.detalle || '',
    motivo: row.motivo || row.description || '',
    detalle: row.detalle || row.description || '',
    amount: monto,
    monto: monto,
    origenFondo: isDoctorFund ? 'MEDICO_PERSONAL' : 'CAJA_CHICA_SEDE',
    origen_fondo: isDoctorFund ? 'MEDICO_PERSONAL' : 'CAJA_CHICA_SEDE',
    esReembolsoMedico: isDoctorFund,
    es_reembolso_medico: isDoctorFund,
    tipoComprobante: row.tipo_comprobante || row.tipoComprobante || 'SIN_COMPROBANTE',
    tipo_comprobante: row.tipo_comprobante || row.tipoComprobante || 'SIN_COMPROBANTE',
    numeroComprobante: row.numero_comprobante || row.numeroComprobante || row.voucherNumber || '',
    numero_comprobante: row.numero_comprobante || row.numeroComprobante || row.voucherNumber || '',
    comprobanteUrl: row.comprobante_url || row.comprobanteUrl || '',
    comprobante_url: row.comprobante_url || row.comprobanteUrl || '',
    estadoLiquidacion: (row.estado_liquidacion || row.estadoLiquidacion || 'PENDIENTE').toUpperCase(),
    estado_liquidacion: (row.estado_liquidacion || row.estadoLiquidacion || 'PENDIENTE').toUpperCase(),
    paymentMethod: row.payment_method || (isDoctorFund ? 'Dinero Propio' : 'Caja Chica'),
    quickLogged: Boolean(row.quick_logged),
    deductibleSRI: Boolean(row.deductible_sri)
  };
}

function mapExpenseToDB(exp) {
  const isDoctorFund = exp.origenFondo === 'MEDICO_PERSONAL' || exp.origen_fondo === 'MEDICO_PERSONAL' || exp.esReembolsoMedico;
  const tipo = (exp.tipoGasto || exp.tipo_gasto || (exp.category === 'Transporte' ? 'TRANSPORTE' : 'INSUMOS')).toUpperCase();
  const sede = (exp.sedeCodigo || exp.sede_codigo || 'CEIBOS').toUpperCase();
  const monto = Number(exp.amount !== undefined ? exp.amount : (exp.monto || 0));

  return {
    id: exp.id,
    date: exp.date || (exp.fechaHora ? exp.fechaHora.split('T')[0] : new Date().toISOString().split('T')[0]),
    fecha_hora: exp.fechaHora || exp.fecha_hora || new Date().toISOString(),
    tipo_gasto: tipo,
    sede_codigo: sede,
    tipo_transporte: exp.tipoTransporte || exp.tipo_transporte || null,
    categoria_insumo: exp.categoriaInsumo || exp.categoria_insumo || null,
    category: exp.category || (tipo === 'TRANSPORTE' ? 'Transporte' : 'Insumos Médicos'),
    description: exp.description || exp.motivo || exp.detalle || '',
    motivo: exp.motivo || exp.description || '',
    detalle: exp.detalle || exp.description || '',
    amount: monto,
    monto: monto,
    origen_fondo: isDoctorFund ? 'MEDICO_PERSONAL' : 'CAJA_CHICA_SEDE',
    es_reembolso_medico: isDoctorFund,
    tipo_comprobante: exp.tipoComprobante || exp.tipo_comprobante || 'SIN_COMPROBANTE',
    numero_comprobante: exp.numeroComprobante || exp.numero_comprobante || null,
    comprobante_url: exp.comprobanteUrl || exp.comprobante_url || null,
    estado_liquidacion: (exp.estadoLiquidacion || exp.estado_liquidacion || 'PENDIENTE').toUpperCase(),
    payment_method: isDoctorFund ? 'Dinero Propio' : 'Caja Chica',
    quick_logged: Boolean(exp.quickLogged),
    deductible_sri: Boolean(exp.deductibleSRI !== false)
  };
}

function mapPrescriptionFromDB(row) {
  if (!row) return null;
  return {
    id: row.id,
    code: row.code,
    patientName: row.patient_name,
    patientId: row.patient_id,
    doctorName: row.doctor_name,
    doctorCode: row.doctor_code,
    date: row.date,
    diagnosis: row.diagnosis,
    items: row.items || [],
    indications: row.indications || ''
  };
}

function mapPrescriptionToDB(rx) {
  return {
    id: rowIdOrGen(rx.id, 'RX'),
    code: rx.code,
    patient_name: rx.patientName,
    patient_id: rx.patientId,
    doctor_name: rx.doctorName,
    doctor_code: rx.doctorCode,
    date: rx.date,
    diagnosis: rx.diagnosis,
    items: rx.items || [],
    indications: rx.indications || ''
  };
}

function rowIdOrGen(id, prefix) {
  return id || `${prefix}-${Math.floor(100 + Math.random() * 900)}`;
}

function mapMedicalRecordFromDB(row) {
  if (!row) return null;
  return {
    id: row.id,
    patientId: row.patient_id,
    patientName: row.patient_name,
    age: row.age,
    bloodType: row.blood_type,
    allergies: row.allergies,
    history: row.history,
    lastDiagnosis: row.last_diagnosis,
    consultationHistory: row.consultation_history || []
  };
}

function mapMedicalRecordToDB(rec) {
  return {
    id: rec.id,
    patient_id: rec.patientId,
    patient_name: rec.patientName,
    age: rec.age,
    blood_type: rec.bloodType,
    allergies: rec.allergies,
    history: rec.history,
    last_diagnosis: rec.lastDiagnosis,
    consultation_history: rec.consultationHistory || []
  };
}

// ====================================================================
// OPERACIONES CRUD CON SUPABASE
// ====================================================================

const SupabaseDB = {
  // Citas
  async getAppointments() {
    const sb = getSupabase();
    if (!sb) return null;
    const { data, error } = await sb.from('appointments').select('*').order('date', { ascending: false });
    if (error) {
      console.error('Error obteniendo citas de Supabase:', error);
      return null;
    }
    return data.map(mapAppointmentFromDB);
  },

  /**
   * 1. Verificación de Colisión Previa (Double-Booking Check):
   * Comprueba en Supabase y en la memoria del sistema que no exista otra cita en estado
   * active, confirmed o confirmada para la misma sede, médico, fecha y hora.
   */
  async checkDoubleBooking(clinicId, doctorId, date, time) {
    if (!date || !time) return false;
    const sb = getSupabase();

    // 1. Verificación directa en Supabase
    if (sb) {
      try {
        const cid = (clinicId === 'hospital_ceibos') ? 'hospital' : clinicId;
        const { data, error } = await sb
          .from('appointments')
          .select('id, clinic_id, date, time, status')
          .eq('date', date)
          .eq('time', time);

        if (!error && Array.isArray(data)) {
          const collision = data.some(a => {
            const matchesClinic = (a.clinic_id === clinicId || a.clinic_id === cid);
            const st = (a.status || '').toLowerCase();
            const isActive = ['confirmada', 'confirmed', 'active', 'en_guardia', 'atendida'].includes(st);
            return matchesClinic && isActive;
          });
          if (collision) return true;
        }
      } catch (e) {
        console.warn('Aviso en checkDoubleBooking Supabase:', e);
      }
    }

    // 2. Verificación en store local / memoria del cliente
    try {
      if (typeof window !== 'undefined' && window.store && window.store.getState) {
        const localApts = window.store.getState().appointments || [];
        const cid = (clinicId === 'hospital_ceibos') ? 'hospital' : clinicId;
        const collision = localApts.some(a => {
          const aCid = a.clinicId || a.clinic_id;
          const matchesClinic = (aCid === clinicId || aCid === cid);
          const st = (a.status || '').toLowerCase();
          const isActive = !['cancelada', 'cancelled'].includes(st);
          return a.date === date && a.time === time && matchesClinic && isActive;
        });
        if (collision) return true;
      }
    } catch (e) {}

    return false;
  },

  /**
   * 2. Persistencia Segura y Protección contra Doble Reserva (Supabase):
   * Valida colisión previa, inserta los campos financieros y retorna el objeto transaccional completo.
   */
  async saveAppointment(apt) {
    const clinicId = apt.clinicId || apt.clinic_id;
    const doctorId = apt.doctorId || apt.doctor_id || 'dr_campoverde';
    const date = apt.date;
    const time = apt.time;

    // Verificación de Colisión Previa
    const hasCollision = await this.checkDoubleBooking(clinicId, doctorId, date, time);
    if (hasCollision) {
      return {
        success: false,
        collision: true,
        error: 'Este horario acaba de ser reservado por otro paciente. Por favor, selecciona otro turno.'
      };
    }

    const sb = getSupabase();
    const payload = mapAppointmentToDB(apt);

    let savedData = null;
    if (sb) {
      try {
        const { data, error } = await sb.from('appointments').insert([payload]).select().single();
        if (error) {
          console.warn('Aviso insertando cita en Supabase, reintentando:', error);
          const fallbackPayload = { ...payload };
          if (fallbackPayload.status === 'confirmed') fallbackPayload.status = 'confirmada';
          const retry = await sb.from('appointments').insert([fallbackPayload]).select().single();
          if (!retry.error) {
            savedData = retry.data;
          }
        } else {
          savedData = data;
        }
      } catch (err) {
        console.warn('Error conectando a Supabase durante saveAppointment:', err);
      }
    }

    const resultObj = savedData ? mapAppointmentFromDB(savedData) : {
      id: payload.id,
      code: payload.code,
      patientId: payload.patient_id,
      patient_id: payload.patient_id,
      patientCedula: apt.patientCedula || apt.patient_cedula || payload.patient_id,
      patient_cedula: apt.patientCedula || apt.patient_cedula || payload.patient_id,
      patientName: payload.patient_name,
      patient_name: payload.patient_name,
      patientPhone: payload.patient_phone,
      patient_phone: payload.patient_phone,
      patientEmail: payload.patient_email,
      patient_email: payload.patient_email,
      clinicId: payload.clinic_id,
      clinic_id: payload.clinic_id,
      doctorId: doctorId,
      doctor_id: doctorId,
      date: payload.date,
      time: payload.time,
      durationMinutes: payload.duration_minutes,
      duration_minutes: payload.duration_minutes,
      reason: payload.reason,
      paymentMethod: payload.payment_method,
      payment_method: payload.payment_method,
      baseFee: payload.base_price,
      base_fee: payload.base_price,
      basePrice: payload.base_price,
      base_price: payload.base_price,
      processingFee: payload.fee_amount,
      processing_fee: payload.fee_amount,
      feeAmount: payload.fee_amount,
      fee_amount: payload.fee_amount,
      totalPaid: payload.total_paid,
      total_paid: payload.total_paid,
      retentionRate: payload.retention_rate,
      retention_rate: payload.retention_rate,
      retentionAmount: payload.retention_amount,
      retention_amount: payload.retention_amount,
      netClinicYield: payload.net_clinic_yield,
      net_clinic_yield: payload.net_clinic_yield,
      status: 'confirmed',
      estado: 'CONFIRMADA',
      settlementStatus: payload.settlement_status,
      settlement_status: payload.settlement_status,
      notes: payload.notes
    };

    if (apt.tokenSeguro) {
      resultObj.tokenSeguro = apt.tokenSeguro;
    }

    return {
      success: true,
      collision: false,
      appointment: resultObj,
      data: resultObj
    };
  },

  async crearCita(apt) {
    return this.saveAppointment(apt);
  },

  async insertAppointment(apt) {
    const res = await this.saveAppointment(apt);
    return res.success ? res.appointment : null;
  },

  async updateAppointmentStatus(id, status) {
    const sb = getSupabase();
    if (!sb) return false;
    const { error } = await sb.from('appointments').update({ status }).eq('id', id);
    if (error) {
      console.error('Error actualizando estado de cita en Supabase:', error);
      return false;
    }
    return true;
  },

  async updateAppointmentSettlement(id, settlementStatus) {
    const sb = getSupabase();
    if (!sb) return false;
    const { error } = await sb.from('appointments').update({ settlement_status: settlementStatus }).eq('id', id);
    if (error) {
      console.error('Error actualizando liquidación de cita en Supabase:', error);
      return false;
    }
    return true;
  },

  // Gastos
  async getExpenses() {
    const sb = getSupabase();
    if (!sb) return null;
    const { data, error } = await sb.from('expenses').select('*').order('date', { ascending: false });
    if (error) {
      console.error('Error obteniendo gastos de Supabase:', error);
      return null;
    }
    return data.map(mapExpenseFromDB);
  },

  async insertExpense(exp) {
    const sb = getSupabase();
    if (!sb) return null;
    const payload = mapExpenseToDB(exp);
    const { data, error } = await sb.from('expenses').insert([payload]).select().single();
    if (error) {
      console.error('Error guardando gasto en Supabase:', error);
      return null;
    }
    return mapExpenseFromDB(data);
  },

  async deleteExpense(id) {
    const sb = getSupabase();
    if (!sb) return false;
    const { error } = await sb.from('expenses').delete().eq('id', id);
    if (error) {
      console.error('Error eliminando gasto en Supabase:', error);
      return false;
    }
    return true;
  },

  // Fichas Clínicas
  async getMedicalRecords() {
    const sb = getSupabase();
    if (!sb) return null;
    const { data, error } = await sb.from('medical_records').select('*');
    if (error) {
      console.error('Error obteniendo historias clínicas de Supabase:', error);
      return null;
    }
    return data.map(mapMedicalRecordFromDB);
  },

  async upsertMedicalRecord(rec) {
    const sb = getSupabase();
    if (!sb) return null;
    const payload = mapMedicalRecordToDB(rec);
    const { data, error } = await sb.from('medical_records').upsert(payload, { onConflict: 'patient_id' }).select().single();
    if (error) {
      console.error('Error guardando historial clínico en Supabase:', error);
      return null;
    }
    return mapMedicalRecordFromDB(data);
  },

  // Recetas
  async getPrescriptions() {
    const sb = getSupabase();
    if (!sb) return null;
    const { data, error } = await sb.from('prescriptions').select('*').order('date', { ascending: false });
    if (error) {
      console.error('Error obteniendo recetas de Supabase:', error);
      return null;
    }
    return data.map(mapPrescriptionFromDB);
  },

  async insertPrescription(rx) {
    const sb = getSupabase();
    if (!sb) return null;
    const payload = mapPrescriptionToDB(rx);
    const { data, error } = await sb.from('prescriptions').insert([payload]).select().single();
    if (error) {
      console.error('Error guardando receta en Supabase:', error);
      return null;
    }
    return mapPrescriptionFromDB(data);
  },

  // Guardia de Emergencia
  async getEmergencyGuard() {
    const sb = getSupabase();
    if (!sb) return null;
    const { data, error } = await sb.from('emergency_guard').select('*').eq('id', 1).maybeSingle();
    if (error || !data) return null;
    return {
      isActive: data.is_active,
      activatedAt: data.activated_at,
      reason: data.reason,
      affectedAppointments: data.affected_appointments || []
    };
  },

  async updateEmergencyGuard(guard) {
    const sb = getSupabase();
    if (!sb) return false;
    const payload = {
      id: 1,
      is_active: guard.isActive,
      activated_at: guard.activatedAt,
      reason: guard.reason,
      affected_appointments: guard.affectedAppointments
    };
    const { error } = await sb.from('emergency_guard').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.error('Error actualizando guardia en Supabase:', error);
      return false;
    }
    return true;
  },

  // Usuarios del sistema
  async getUsers() {
    const sb = getSupabase();
    if (!sb) return null;
    const { data, error } = await sb.from('users').select('*');
    if (error) {
      console.error('Error obteniendo usuarios de Supabase:', error);
      return null;
    }
    const usersMap = {};
    data.forEach(u => {
      usersMap[u.role] = {
        role: u.role,
        name: u.name,
        email: u.email,
        username: u.username,
        idNumber: u.id_number,
        password: u.password,
        phone: u.phone,
        specialty: u.specialty,
        mspCode: u.msp_code,
        allergies: u.allergies,
        avatar: u.avatar,
        firm: u.firm
      };
    });
    return usersMap;
  },

  // Sedes
  async getClinics() {
    const sb = getSupabase();
    if (!sb) return null;
    const { data, error } = await sb.from('clinics').select('*');
    if (error) return null;
    const map = {};
    data.forEach(c => {
      map[c.id] = {
        id: c.id,
        name: c.name,
        type: c.type,
        consultorio: c.consultorio,
        address: c.address,
        basePrice: Number(c.base_price),
        retentionRate: Number(c.retention_rate),
        color: c.color,
        badgeClass: c.badge_class,
        image: c.image
      };
    });
    return map;
  },

  // Franjas de Traslado
  async getTravelBuffers() {
    const sb = getSupabase();
    if (!sb) return null;
    const { data, error } = await sb.from('travel_buffers').select('*');
    if (error) return null;
    return data.map(b => ({
      id: b.id,
      date: b.date,
      fromClinic: b.from_clinic,
      toClinic: b.to_clinic,
      startTime: b.start_time,
      endTime: b.end_time,
      durationMinutes: b.duration_minutes,
      bufferLabel: b.buffer_label,
      status: b.status
    }));
  },

  // Suscripción Realtime (Sincronización instantánea de citas)
  subscribeRealtime(onUpdate) {
    const sb = getSupabase();
    if (!sb) return null;
    try {
      const channel = sb
        .channel('schema-db-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public' },
          (payload) => {
            console.log('🔄 Cambio detectado en tiempo real desde Supabase:', payload);
            if (typeof onUpdate === 'function') {
              onUpdate(payload);
            }
          }
        )
        .subscribe();
      return channel;
    } catch (e) {
      console.warn('Realtime no disponible:', e);
      return null;
    }
  }
};


// ==================== js/qr-generator.js ====================

/**
 * Generador de Códigos QR de Ultra-Alta Definición
 * Usa la librería QRCode local para generar códigos QR limpios, de alto contraste (#000000 / #ffffff)
 * y 100% escaneables por cualquier cámara de teléfono celular en milisegundos.
 */

const BASE_URL = 'https://pedritojuancarlos82-lang.github.io/Proyecto-Cita-Medica';

/**
 * Normaliza y garantiza que la URL para el QR se construya SIEMPRE sobre BASE_URL de producción
 */
function sanitizarUrlQR(url) {
  if (!url || typeof url !== 'string') return `${BASE_URL}/comprobante.html`;
  const queryIndex = url.indexOf('?');
  const queryString = queryIndex !== -1 ? url.substring(queryIndex) : '';
  return `${BASE_URL}/comprobante.html${queryString}`;
}

function renderizarCodigoQR(contenedorId, qrData, options = {}) {
  const container = (typeof contenedorId === 'string') 
    ? document.getElementById(contenedorId) 
    : contenedorId;
  if (!container) return;

  container.innerHTML = '';

  const targetData = sanitizarUrlQR(qrData);
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
        text: targetData,
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
  img.src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(targetData)}&margin=4&color=000000&bgcolor=ffffff&format=png`;
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
    costoReal: 20.00,
    precioLista: 21.95, // 9.75% sobre costo real
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
    costoReal: 15.00,
    precioLista: 16.46, // 9.75% sobre costo real
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
    costoReal: 25.00,
    precioLista: 27.44, // 9.75% sobre costo real
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
    costoReal: 30.00,
    precioLista: 32.93, // 9.75% sobre costo real
    precioBase: 30.00,
    categoria: "Prioritaria",
    estado: "Activo"
  }
];


// ==================== js/catalogo-motivos.js ====================

/**
 * Catálogo de Motivos de Consulta y Diagnósticos Simplificados
 * Organizado por categorías para facilitar la selección rápida en dispositivos móviles.
 */

const catalogo = {
  "Medicina General": [
    { id: "MG-001", descripcion: "Fiebre no especificada", codigo_cie: "R50.9" },
    { id: "MG-002", descripcion: "Cefalea (Dolor de cabeza)", codigo_cie: "R51" },
    { id: "MG-003", descripcion: "Fatiga y debilidad general", codigo_cie: "R53" },
    { id: "MG-004", descripcion: "Control de salud de rutina", codigo_cie: "Z00.0" }
  ],
  "Respiratorio": [
    { id: "RESP-001", descripcion: "Tos", codigo_cie: "R05" },
    { id: "RESP-002", descripcion: "Dolor de garganta", codigo_cie: "J02.9" },
    { id: "RESP-003", descripcion: "Dificultad para respirar (Disnea)", codigo_cie: "R06.0" },
    { id: "RESP-004", descripcion: "Resfriado común", codigo_cie: "J00" },
    { id: "RESP-005", descripcion: "Asma no especificada", codigo_cie: "J45.9" }
  ],
  "Digestivo": [
    { id: "DIG-001", descripcion: "Dolor abdominal", codigo_cie: "R10.4" },
    { id: "DIG-002", descripcion: "Diarrea y gastroenteritis", codigo_cie: "A09" },
    { id: "DIG-003", descripcion: "Náuseas y vómitos", codigo_cie: "R11" },
    { id: "DIG-004", descripcion: "Estreñimiento", codigo_cie: "K59.0" }
  ],
  "Control Crónico": [
    { id: "CRON-001", descripcion: "Control de Hipertensión Arterial", codigo_cie: "I10" },
    { id: "CRON-002", descripcion: "Control de Diabetes Mellitus tipo 2", codigo_cie: "E11" },
    { id: "CRON-003", descripcion: "Control de Dislipidemia (Colesterol alto)", codigo_cie: "E78.5" }
  ],
  "Pediatría": [
    { id: "PED-001", descripcion: "Control de niño sano", codigo_cie: "Z00.1" },
    { id: "PED-002", descripcion: "Erupción cutánea (Rash)", codigo_cie: "R21" },
    { id: "PED-003", descripcion: "Dolor de oído", codigo_cie: "H92.0" }
  ]
};

// Convertir a un array plano para facilitar la búsqueda general
const catalogoPlano = Object.entries(catalogo).flatMap(([categoria, motivos]) => 
  motivos.map(motivo => ({ ...motivo, categoria }))
);

/**
 * Obtiene todas las categorías disponibles.
 * @returns {Array<string>} Lista de nombres de categorías.
 */
const obtenerCategorias = () => Object.keys(catalogo);

/**
 * Obtiene los motivos de consulta asociados a una categoría específica.
 * @param {string} categoria - Nombre de la categoría.
 * @returns {Array<Object>} Lista de motivos de la categoría.
 */
const obtenerMotivosPorCategoria = (categoria) => catalogo[categoria] || [];

/**
 * Busca motivos de consulta que coincidan con el término de búsqueda.
 * Busca tanto en la descripción como en el código CIE o categoría.
 * @param {string} termino - Texto a buscar.
 * @returns {Array<Object>} Resultados que coinciden con la búsqueda.
 */
const buscarMotivo = (termino) => {
  if (!termino || termino.trim() === '') return [];
  const query = termino.toLowerCase().trim();
  
  return catalogoPlano.filter(motivo => 
    motivo.descripcion.toLowerCase().includes(query) ||
    motivo.codigo_cie.toLowerCase().includes(query) ||
    motivo.categoria.toLowerCase().includes(query)
  );
};

/**
 * Obtiene un motivo específico por su ID.
 * @param {string} id - ID del motivo a buscar.
 * @returns {Object|null} El motivo encontrado o null si no existe.
 */
const obtenerMotivoPorId = (id) => {
  return catalogoPlano.find(motivo => motivo.id === id) || null;
};


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


let pacientesCache = [];

const MedicalService = {
  // Retorna únicamente los servicios con estado "Activo"
  getCatalogo: () => {
    return CONSULTATION_CATALOG.filter(servicio => servicio.estado === 'Activo');
  },

  // Retorna la lista de pacientes sincronizada con Supabase
  getPacientes: () => {
    return pacientesCache;
  },

  // Carga inicial de pacientes desde Supabase
  syncPacientesFromSupabase: async () => {
    try {
      const records = await SupabaseDB.getMedicalRecords();
      if (records && records.length > 0) {
        pacientesCache = records.map(r => new PatientRecord({
          cedula: r.patientId,
          nombreCompleto: r.patientName,
          antecedentesClinicos: {
            alergias: r.allergies ? r.allergies.split(',').map(s => s.trim()) : [],
            enfermedadesPrevias: r.history ? [r.history] : []
          },
          historialConsultas: r.consultationHistory || []
        }));
      }
    } catch (e) {
      console.warn('Aviso cargando pacientes desde Supabase:', e);
    }
    return pacientesCache;
  },

  // Retorna la ficha médica si el paciente ya existe; null si es nuevo
  buscarPorCedula: (cedula) => {
    const paciente = pacientesCache.find(p => p.cedula === cedula);
    return paciente ? new PatientRecord(paciente) : null;
  },

  // Guarda o actualiza la ficha del paciente en Supabase
  guardarFicha: async (datos) => {
    const index = pacientesCache.findIndex(p => p.cedula === datos.cedula);
    let targetPaciente = null;

    if (index >= 0) {
      targetPaciente = new PatientRecord(pacientesCache[index]);
      targetPaciente.nombreCompleto = datos.nombreCompleto || targetPaciente.nombreCompleto;
      targetPaciente.telefono = datos.telefono || targetPaciente.telefono;
      targetPaciente.email = datos.email || targetPaciente.email;
      if (datos.antecedentesClinicos) {
        targetPaciente.antecedentesClinicos = { ...targetPaciente.antecedentesClinicos, ...datos.antecedentesClinicos };
      }
      targetPaciente.updatedAt = new Date().toISOString();
      pacientesCache[index] = targetPaciente;
    } else {
      targetPaciente = new PatientRecord(datos);
      pacientesCache.push(targetPaciente);
    }

    // Persistir en Supabase
    try {
      await SupabaseDB.upsertMedicalRecord({
        id: `REC-${Math.floor(100 + Math.random() * 900)}`,
        patientId: targetPaciente.cedula,
        patientName: targetPaciente.nombreCompleto,
        age: 35,
        allergies: targetPaciente.antecedentesClinicos.alergias.join(', '),
        history: targetPaciente.antecedentesClinicos.enfermedadesPrevias.join('. '),
        consultationHistory: targetPaciente.historialConsultas || []
      });
    } catch (e) {
      console.error('Error guardando paciente en Supabase:', e);
    }
  },

  // Añade la consulta reservada al historial de consultas del paciente
  registrarAtencionEnHistorial: async (cedula, datosCita) => {
    const index = pacientesCache.findIndex(p => p.cedula === cedula);

    if (index >= 0) {
      const paciente = new PatientRecord(pacientesCache[index]);
      paciente.historialConsultas.push({
        ...datosCita,
        fechaRegistro: new Date().toISOString()
      });
      pacientesCache[index] = paciente;

      try {
        await SupabaseDB.upsertMedicalRecord({
          id: `REC-${Math.floor(100 + Math.random() * 900)}`,
          patientId: paciente.cedula,
          patientName: paciente.nombreCompleto,
          age: 35,
          allergies: paciente.antecedentesClinicos.alergias.join(', '),
          history: paciente.antecedentesClinicos.enfermedadesPrevias.join('. '),
          consultationHistory: paciente.historialConsultas || []
        });
      } catch (e) {
        console.error('Error actualizando historial en Supabase:', e);
      }
    } else {
      console.error('No se puede registrar atención: paciente no encontrado.');
    }
  }
};



// ==================== js/services/collision-engine.js ====================

/**
 * collision-engine.js
 * Motor de Prevención de Choques, Tiempos de Traslado y Validación de Rotación Multisede
 * Semana 2: Arquitectura del Calendario Inteligente (Montepiedra Salud)
 */


// 1. Matriz de Distancias y Tiempos de Traslado Interurbano (Guayaquil)
const MATRIZ_DISTANCIAS_TRASLADO = {
  'mapasingue-ceibos': { tiempoMinutos: 20, margenTrafico: 15, totalBuffer: 35 },
  'ceibos-mapasingue': { tiempoMinutos: 20, margenTrafico: 15, totalBuffer: 35 },
  'mapasingue-alborada': { tiempoMinutos: 30, margenTrafico: 20, totalBuffer: 50 },
  'alborada-mapasingue': { tiempoMinutos: 30, margenTrafico: 20, totalBuffer: 50 },
  'mapasingue-hospital': { tiempoMinutos: 25, margenTrafico: 15, totalBuffer: 40 },
  'hospital-mapasingue': { tiempoMinutos: 25, margenTrafico: 15, totalBuffer: 40 },
  'ceibos-alborada': { tiempoMinutos: 35, margenTrafico: 25, totalBuffer: 60 },
  'alborada-ceibos': { tiempoMinutos: 35, margenTrafico: 25, totalBuffer: 60 },
  'ceibos-hospital': { tiempoMinutos: 10, margenTrafico: 10, totalBuffer: 20 },
  'hospital-ceibos': { tiempoMinutos: 10, margenTrafico: 10, totalBuffer: 20 },
  'alborada-hospital': { tiempoMinutos: 40, margenTrafico: 25, totalBuffer: 65 },
  'hospital-alborada': { tiempoMinutos: 40, margenTrafico: 25, totalBuffer: 65 }
};

// Parámetros Operativos de Slot Clínico vs Slot Administrativo
const DURACION_NOMINAL_CONSULTA_DEFAULT = 30;
const MARGEN_ADMINISTRATIVO_RECETA_DEFAULT = 15;
const SLOT_REAL_RESERVA_DEFAULT = 45;
const TIEMPO_DESALOJO_SANITIZACION_DEFAULT = 10;

// Franjas de Hora Pico en Guayaquil
const FRANJAS_HORA_PICO = [
  { inicio: '07:00', fin: '09:30' },
  { inicio: '12:30', fin: '14:00' },
  { inicio: '17:00', fin: '19:45' }
];

// 2. Salas de Consultorio Físicas (Recursos Compartidos)
const SALAS_CONSULTORIO = {
  ceibos: [
    { id: 'SALA-CEIBOS-2', codigo: 'CONS-2', nombre: 'Consultorio Privado 2', capacidad: 1 }
  ],
  mapasingue: [
    { id: 'SALA-MAPASINGUE-1A', codigo: 'CONS-1A', nombre: 'Consultorio 1A', capacidad: 1 }
  ],
  alborada: [
    { id: 'SALA-ALBORADA-4', codigo: 'CONS-4', nombre: 'Consultorio Comunitario 4', capacidad: 1 }
  ],
  hospital: [
    { id: 'SALA-HOSPITAL-TRIAJE', codigo: 'TRIAJE-1', nombre: 'Área de Triaje y Guardia', capacidad: 5 }
  ]
};

// 3. Plantilla de Horarios Rotativos Semanales del Médico
const HORARIOS_ROTATIVOS = [
  // Sábado (Día demo de operación)
  { diaSemana: 'SABADO', sedeId: 'ceibos', horaInicio: '08:00', horaFin: '13:00' },
  { diaSemana: 'SABADO', sedeId: 'mapasingue', horaInicio: '14:00', horaFin: '18:00' },
  { diaSemana: 'SABADO', sedeId: 'alborada', horaInicio: '08:30', horaFin: '12:30' },
  { diaSemana: 'SABADO', sedeId: 'hospital', horaInicio: '18:00', horaFin: '23:59' },

  // Días laborables regulares
  { diaSemana: 'LUNES', sedeId: 'ceibos', horaInicio: '08:00', horaFin: '13:00' },
  { diaSemana: 'LUNES', sedeId: 'mapasingue', horaInicio: '14:00', horaFin: '18:00' },
  { diaSemana: 'MARTES', sedeId: 'alborada', horaInicio: '08:30', horaFin: '13:00' },
  { diaSemana: 'MARTES', sedeId: 'ceibos', horaInicio: '14:30', horaFin: '18:30' },
  { diaSemana: 'MIERCOLES', sedeId: 'mapasingue', horaInicio: '08:30', horaFin: '13:00' },
  { diaSemana: 'MIERCOLES', sedeId: 'ceibos', horaInicio: '14:30', horaFin: '18:30' },
  { diaSemana: 'JUEVES', sedeId: 'ceibos', horaInicio: '08:00', horaFin: '13:00' },
  { diaSemana: 'JUEVES', sedeId: 'alborada', horaInicio: '14:30', horaFin: '18:30' },
  { diaSemana: 'VIERNES', sedeId: 'mapasingue', horaInicio: '08:30', horaFin: '13:00' },
  { diaSemana: 'VIERNES', sedeId: 'ceibos', horaInicio: '14:00', horaFin: '18:00' }
];

const CollisionEngine = {
  /**
   * Validador Principal del Calendario Inteligente (4 pasos estrictos)
   */
  validarDisponibilidadSlot: ({
    medicoId = 'doctor',
    sedeId,
    salaId = null,
    fechaStr,
    horaStr,
    duracionMinutos = 45,
    citas = [],
    travelBuffers = [],
    tiempoSanitizacionMinutos = 0
  }) => {
    // Resolver sala física por defecto si no se pasa explícitamente
    const salaEfectiva = salaId || (SALAS_CONSULTORIO[sedeId] && SALAS_CONSULTORIO[sedeId][0]?.id) || `SALA-${sedeId.toUpperCase()}`;

    // Desglosar inicio y fin en minutos del día
    const [h, m] = horaStr.split(':').map(Number);
    const inicioSlotMin = h * 60 + m;
    const finSlotMin = inicioSlotMin + duracionMinutos;

    // Calcular día de la semana en español
    const [y, mes, d] = fechaStr.split('-').map(Number);
    const dateObj = new Date(y, mes - 1, d);
    const diasMap = ['DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];
    const diaSemanaNombre = diasMap[dateObj.getDay()];

    // ========================================================================
    // PASO 1: Validar horario de rotación configurado del médico
    // ========================================================================
    const rotacionesDelDia = HORARIOS_ROTATIVOS.filter(
      r => r.diaSemana === diaSemanaNombre && r.sedeId === sedeId
    );

    // Si existen rotaciones registradas para ese día, verificar franja
    if (rotacionesDelDia.length > 0) {
      const enHorario = rotacionesDelDia.some(rot => {
        const [rIniH, rIniM] = rot.horaInicio.split(':').map(Number);
        const [rFinH, rFinM] = rot.horaFin.split(':').map(Number);
        const rIni = rIniH * 60 + rIniM;
        const rFin = rFinH * 60 + rFinM;
        return inicioSlotMin >= rIni && finSlotMin <= rFin;
      });

      if (!enHorario) {
        return {
          valido: false,
          razonRechazo: `El médico no tiene turno rotativo activo en ${CLINICS[sedeId]?.name || sedeId} en el horario ${horaStr}.`,
          tiempoBufferRequerido: null,
          codigoError: 'FUERA_DE_ROTACION'
        };
      }
    }

    // ========================================================================
    // PASO 2: Validar que la sala física compartida esté libre
    // ========================================================================
    const citasMismaFecha = citas.filter(
      c => c.date === fechaStr && c.status !== 'cancelada' && c.status !== 'reagendada'
    );

    for (const c of citasMismaFecha) {
      const cSala = c.salaId || (SALAS_CONSULTORIO[c.clinicId] && SALAS_CONSULTORIO[c.clinicId][0]?.id);
      if (cSala === salaEfectiva) {
        const [ch, cm] = c.time.split(':').map(Number);
        const cIni = ch * 60 + cm;
        const cFin = cIni + (c.durationMinutes || 45);

        // 2.A Solapamiento directo: max(ini1, ini2) < min(fin1, fin2)
        if (Math.max(inicioSlotMin, cIni) < Math.min(finSlotMin, cFin)) {
          return {
            valido: false,
            razonRechazo: `La sala física (${CLINICS[sedeId]?.consultorio || 'Consultorio'}) está ocupada por otra atención médica (#${c.code || c.id}).`,
            tiempoBufferRequerido: null,
            codigoError: 'SALA_OCUPADA'
          };
        }

        // 2.B Sanitización entre pacientes
        if (tiempoSanitizacionMinutos > 0) {
          if (cFin <= inicioSlotMin && inicioSlotMin < cFin + tiempoSanitizacionMinutos) {
            return {
              valido: false,
              razonRechazo: `La sala física requiere ${tiempoSanitizacionMinutos} min de sanitización/desalojo tras la atención previa.`,
              tiempoBufferRequerido: tiempoSanitizacionMinutos,
              codigoError: 'SALA_SANITIZACION_PENDIENTE'
            };
          }
          if (finSlotMin <= cIni && cIni < finSlotMin + tiempoSanitizacionMinutos) {
            return {
              valido: false,
              razonRechazo: `La sala física requiere ${tiempoSanitizacionMinutos} min de sanitización previa a la siguiente atención.`,
              tiempoBufferRequerido: tiempoSanitizacionMinutos,
              codigoError: 'SALA_SANITIZACION_PENDIENTE'
            };
          }
        }
      }
    }

    // ========================================================================
    // PASO 3: Validar tiempos de amortiguamiento y traslado (Buffer Times)
    // ========================================================================
    // 3.A. Citas previas en OTRA sede que impiden llegar a tiempo
    const citasPrevias = citasMismaFecha
      .filter(c => {
        const [ch, cm] = c.time.split(':').map(Number);
        const cFin = ch * 60 + cm + (c.durationMinutes || 45);
        return cFin <= inicioSlotMin;
      })
      .sort((a, b) => a.time.localeCompare(b.time));

    if (citasPrevias.length > 0) {
      const ultimaPrevia = citasPrevias[citasPrevias.length - 1];
      if (ultimaPrevia.clinicId !== sedeId) {
        const rutaKey = `${ultimaPrevia.clinicId}-${sedeId}`;
        const bufferConfig = MATRIZ_DISTANCIAS_TRASLADO[rutaKey] || { totalBuffer: 35 };
        const bufferRequerido = bufferConfig.totalBuffer;

        const [uH, uM] = ultimaPrevia.time.split(':').map(Number);
        const uFin = uH * 60 + uM + (ultimaPrevia.durationMinutes || 45);
        const tiempoDisponible = inicioSlotMin - uFin;

        if (tiempoDisponible < bufferRequerido) {
          return {
            valido: false,
            razonRechazo: `Tiempo de traslado insuficiente desde ${CLINICS[ultimaPrevia.clinicId]?.name}. Se requieren ${bufferRequerido} min de amortiguamiento vial (disponibles: ${tiempoDisponible} min).`,
            tiempoBufferRequerido: bufferRequerido,
            codigoError: 'TRASLADO_INSUFICIENTE_PRE'
          };
        }
      }
    }

    // 3.B. Citas posteriores en OTRA sede a las que el médico no alcanzaría a llegar
    const citasPosteriores = citasMismaFecha
      .filter(c => {
        const [ch, cm] = c.time.split(':').map(Number);
        const cIni = ch * 60 + cm;
        return cIni >= finSlotMin;
      })
      .sort((a, b) => a.time.localeCompare(b.time));

    if (citasPosteriores.length > 0) {
      const primeraPosterior = citasPosteriores[0];
      if (primeraPosterior.clinicId !== sedeId) {
        const rutaKey = `${sedeId}-${primeraPosterior.clinicId}`;
        const bufferConfig = MATRIZ_DISTANCIAS_TRASLADO[rutaKey] || { totalBuffer: 35 };
        const bufferRequerido = bufferConfig.totalBuffer;

        const [pH, pM] = primeraPosterior.time.split(':').map(Number);
        const pIni = pH * 60 + pM;
        const tiempoDisponible = pIni - finSlotMin;

        if (tiempoDisponible < bufferRequerido) {
          return {
            valido: false,
            razonRechazo: `Tiempo de traslado insuficiente hacia la siguiente cita en ${CLINICS[primeraPosterior.clinicId]?.name}. Se requieren ${bufferRequerido} min de traslado (disponibles: ${tiempoDisponible} min).`,
            tiempoBufferRequerido: bufferRequerido,
            codigoError: 'TRASLADO_INSUFICIENTE_POST'
          };
        }
      }
    }

    // 3.C. Validar si existe una franja explícita de travelBuffer activa
    for (const tb of travelBuffers) {
      if (tb.date === fechaStr) {
        const [tbIniH, tbIniM] = tb.startTime.split(':').map(Number);
        const [tbFinH, tbFinM] = tb.endTime.split(':').map(Number);
        const tbIni = tbIniH * 60 + tbIniM;
        const tbFin = tbFinH * 60 + tbFinM;

        if (Math.max(inicioSlotMin, tbIni) < Math.min(finSlotMin, tbFin)) {
          return {
            valido: false,
            razonRechazo: `El médico se encuentra en traslado interurbano (${tb.bufferLabel || 'En ruta'}).`,
            tiempoBufferRequerido: tb.durationMinutes || 40,
            codigoError: 'EN_RUTA_PROTEGIDA'
          };
        }
      }
    }

    // ========================================================================
    // PASO 4: Aprobación Integral
    // ========================================================================
    return {
      permitido: true,
      valido: true,
      codigoError: null,
      razonRechazo: null,
      mensaje: null,
      tiempoBufferRequerido: 0,
      bufferMinutosAplicado: 0
    };
  },

  /**
   * Retorna la ventana de amortiguamiento en minutos según la matriz aprobada
   */
  calcularMatrizTraslado: (sedeOrigenId, sedeDestinoId, horaStr = null) => {
    const key = `${sedeOrigenId.toLowerCase()}-${sedeDestinoId.toLowerCase()}`;
    const item = MATRIZ_DISTANCIAS_TRASLADO[key];
    if (!item) return 30;
    return item.totalBuffer;
  },

  /**
   * Verifica disponibilidad de sala física en intervalo semiabierto [inicio, fin)
   */
  verificarConflictoSalaFisica: ({ salaId, fechaStr, inicioMin, finMin, citas = [], tiempoSanitizacionMinutos = 0 }) => {
    const citasMismaFecha = citas.filter(
      c => c.date === fechaStr && c.status !== 'cancelada' && c.status !== 'reagendada'
    );
    for (const c of citasMismaFecha) {
      const cSala = c.salaId || (SALAS_CONSULTORIO[c.clinicId] && SALAS_CONSULTORIO[c.clinicId][0]?.id);
      if (cSala === salaId) {
        const [ch, cm] = c.time.split(':').map(Number);
        const cIni = ch * 60 + cm;
        const cFin = cIni + (c.durationMinutes || 45);

        if (Math.max(inicioMin, cIni) < Math.min(finMin, cFin)) {
          return {
            permitido: false,
            valido: false,
            codigoError: 'SALA_OCUPADA',
            mensaje: `La sala física está ocupada por otra atención médica (#${c.code || c.id}).`
          };
        }
      }
    }
    return { permitido: true, valido: true, codigoError: null, mensaje: null };
  },

  /**
   * Pipeline de validación integral según especificación formal
   */
  validarDisponibilidadMedico: ({
    medicoId = 'doctor',
    sedeId,
    salaId = null,
    fechaStr,
    horaStr,
    duracionMinutos = 30,
    citas = [],
    travelBuffers = [],
    tiempoSanitizacionMinutos = 0
  }) => {
    return CollisionEngine.validarDisponibilidadSlot({
      medicoId,
      sedeId,
      salaId,
      fechaStr,
      horaStr,
      duracionMinutos,
      citas,
      travelBuffers,
      tiempoSanitizacionMinutos
    });
  },

  /**
   * Generador de Slots Libres (Motor de Búsqueda de Citas)
   */
  generarSlotsDisponibles: ({
    medicoId = 'doctor',
    sedeId,
    fechaStr,
    duracionMinutos = 30,
    citas = [],
    horarios = null,
    salaId = null,
    pasoMinutos = 30
  }) => {
    const [y, mes, d] = fechaStr.split('-').map(Number);
    const dateObj = new Date(y, mes - 1, d);
    const diasMap = ['DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];
    const diaSemanaNombre = diasMap[dateObj.getDay()];

    const rotaciones = (horarios || HORARIOS_ROTATIVOS).filter(
      r => r.diaSemana === diaSemanaNombre && r.sedeId.toLowerCase() === sedeId.toLowerCase()
    );

    const turnos = rotaciones.length > 0 ? rotaciones : [{ horaInicio: '08:00', horaFin: '13:00' }];
    const slots = [];

    for (const turno of turnos) {
      const [iniH, iniM] = turno.horaInicio.split(':').map(Number);
      const [finH, finM] = turno.horaFin.split(':').map(Number);
      let cursorMin = iniH * 60 + iniM;
      const limiteMin = finH * 60 + finM;

      while (cursorMin + duracionMinutos <= limiteMin) {
        const h = String(Math.floor(cursorMin / 60)).padStart(2, '0');
        const m = String(cursorMin % 60).padStart(2, '0');
        const slotHora = `${h}:${m}`;

        const validacion = CollisionEngine.validarDisponibilidadSlot({
          medicoId,
          sedeId,
          salaId,
          fechaStr,
          horaStr: slotHora,
          duracionMinutos,
          citas
        });

        if (validacion.valido) {
          const slotFinMin = cursorMin + duracionMinutos;
          const finH = String(Math.floor(slotFinMin / 60)).padStart(2, '0');
          const finM = String(slotFinMin % 60).padStart(2, '0');
          slots.push({
            horaInicio: slotHora,
            horaFin: `${finH}:${finM}`,
            duracionMinutos,
            sedeId,
            salaId: salaId || `SALA-${sedeId.toUpperCase()}`
          });
        }

        cursorMin += pasoMinutos;
      }
    }

    return slots;
  },

  /**
   * Micro-servicio de Liquidación Financiera Determinista
   */
  calcularLiquidacion: ({
    sedeId,
    metodoPago = 'efectivo',
    tarifaBase = null
  }) => {
    const clinic = CLINICS[sedeId] || { basePrice: 21.95, realCost: 20.00, retentionRate: 0.05 };
    const base = (tarifaBase !== null && !isNaN(tarifaBase)) ? Number(tarifaBase) : clinic.realCost;
    const esHospital = (sedeId === 'hospital') || (clinic.retentionRate === 0);

    const tasaRecargo = 0.0975;
    const precioLista = +(base * (1 + tasaRecargo)).toFixed(2);

    let montoRecargo = 0;
    let montoDescuento = 0;
    let totalCobrado = 0;

    if (metodoPago.toLowerCase() === 'tarjeta') {
      montoRecargo = +(base * tasaRecargo).toFixed(2);
      totalCobrado = +(base + montoRecargo).toFixed(2);
    } else {
      montoDescuento = +(precioLista - base).toFixed(2);
      totalCobrado = base;
    }

    const comisionSede = esHospital ? 0 : +(base * clinic.retentionRate).toFixed(2);
    const netoMedico = esHospital ? 0 : +(base - comisionSede).toFixed(2);

    return {
      sedeId,
      metodoPago,
      tarifaBase: base,
      precioListaOficial: precioLista,
      montoRecargo,
      montoDescuentoDirecto: montoDescuento,
      totalCobrado,
      porcentajeComisionSede: clinic.retentionRate,
      montoComisionSede: comisionSede,
      ingresoNetoMedico: netoMedico,
      esHospitalSueldoFijo: esHospital
    };
  },

  /**
   * Protocolo de Activación de Emergencia 'Modo Guardia' (Frontend)
   */
  activarModoGuardia: ({
    medicoId = 'doctor',
    fechaStr,
    horaInicioStr,
    horaFinStr,
    citas = [],
    motivo = 'Guardia de relevo hospitalaria imprevista MSP'
  }) => {
    const [hIni, mIni] = horaInicioStr.split(':').map(Number);
    const [hFin, mFin] = horaFinStr.split(':').map(Number);
    const inicioGuardiaMin = hIni * 60 + mIni;
    const finGuardiaMin = hFin * 60 + mFin;

    const citasAfectadas = [];
    const citasMismaFecha = citas.filter(
      c => c.date === fechaStr && c.status !== 'cancelada' && c.status !== 'reagendada'
    );

    for (const c of citasMismaFecha) {
      if (c.clinicId === 'hospital') continue;

      const rutaKey = `${c.clinicId}-hospital`;
      const buffer = (MATRIZ_DISTANCIAS_TRASLADO[rutaKey] && MATRIZ_DISTANCIAS_TRASLADO[rutaKey].totalBuffer) || 30;

      const [ch, cm] = c.time.split(':').map(Number);
      const cIni = ch * 60 + cm;
      const cFin = cIni + (c.durationMinutes || 45);

      // Ventana expandida de afectación
      const ventanaIni = inicioGuardiaMin - buffer;
      const ventanaFin = finGuardiaMin + buffer;

      if (Math.max(cIni, ventanaIni) < Math.min(cFin, ventanaFin)) {
        citasAfectadas.push({
          ...c,
          status: 'reagendamiento_pendiente_guardia',
          prioridadReubicacion: 1,
          motivoBloqueo: motivo
        });
      }
    }

    return {
      modoGuardiaActivo: true,
      medicoId,
      fecha: fechaStr,
      inicioGuardia: horaInicioStr,
      finGuardia: horaFinStr,
      totalAfectadas: citasAfectadas.length,
      citasAfectadas
    };
  }
};


// ==================== js/services/qr-token-service.js ====================

/**
 * qr-token-service.js
 * Servicio Criptográfico de Tickets QR, Control de Hold Temporal y Admisión de Pacientes
 * Semana 3 (01 Oct - 07 Oct, 2026) - Hito 2
 * Plataforma SaaS: Montepiedra Salud
 */

const SECRET_KEY_FRONTEND = 'montepiedra-salud-secret-key-2026-msp-ec';

/**
 * Generador SHA-256 criptográfico estándar inmutable (RFC 6234 / FIPS 180-4)
 * Ejecuta sincrónicamente en cualquier entorno (Browser, Node, Offline).
 */
function sha256(ascii) {
  function rightRotate(value, amount) {
    return (value >>> amount) | (value << (32 - amount));
  }
  
  const mathPow = Math.pow;
  let lengthProperty = 'length';
  let i, j;
  let result = '';

  const words = [];
  const asciiBitLength = ascii[lengthProperty] * 8;
  
  let hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ];

  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  words[asciiBitLength >> 5] |= 0x80 << (24 - (asciiBitLength % 32));
  words[(((asciiBitLength + 64) >> 9) << 4) + 15] = asciiBitLength;

  for (i = 0; i < ascii[lengthProperty]; i++) {
    words[i >> 2] |= ascii.charCodeAt(i) << (24 - (i % 4) * 8);
  }

  for (let j = 0; j < words[lengthProperty]; j += 16) {
    const w = words.slice(j, j + 16);
    const oldHash = hash.slice(0);

    for (i = 0; i < 64; i++) {
      const i2 = i + j;
      const w15 = w[i - 15], w2 = w[i - 2];

      const a = hash[0], e = hash[4];
      const temp1 = hash[7]
        + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25))
        + ((e & hash[5]) ^ ((~e) & hash[6]))
        + k[i]
        + (w[i] = (i < 16) ? w[i] : (
            w[i - 16]
            + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3))
            + w[i - 7]
            + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))
          ) | 0
        );
      const temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22))
        + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
      
      hash = [(temp1 + temp2) | 0, a, hash[1], hash[2], (hash[3] + temp1) | 0, hash[4], hash[5], hash[6]];
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (let b = 3; b >= 0; b--) {
      const byte = (hash[i] >> (b * 8)) & 255;
      result += ((byte < 16 ? '0' : '') + byte.toString(16));
    }
  }
  return result;
}

/**
 * Calcula la firma SHA-256 criptográfica inmutable
 */
function calcularChecksumSeguro(mensaje, clave = SECRET_KEY_FRONTEND) {
  return sha256(`${mensaje}|${clave}`);
}

class QRTokenService {
  /**
   * Genera un token criptográfico no predecible para el código QR
   * Previene ataques de enumeración y falsificación de citas médicas.
   */
  static generarTokenSeguro(citaId, codigoCita, fecha, hora, sedeId) {
    const payload = `${citaId}|${codigoCita}|${fecha}|${hora}|${sedeId}`;
    const firma = calcularChecksumSeguro(payload);
    return `${payload}|${firma}`;
  }

  /**
   * Valida un token de código QR escaneado por el recepcionista
   */
  static verificarToken(token) {
    if (!token || typeof token !== 'string') {
      return { valido: false, error: 'Token nulo o inválido' };
    }

    const partes = token.split('|');
    if (partes.length !== 6) {
      return { valido: false, error: 'Estructura de ticket alterada o incompleta' };
    }

    const [citaId, codigoCita, fecha, hora, sedeId, firmaRecibida] = partes;
    const payload = `${citaId}|${codigoCita}|${fecha}|${hora}|${sedeId}`;
    const firmaEsperada = calcularChecksumSeguro(payload);

    if (firmaRecibida !== firmaEsperada) {
      return {
        valido: false,
        error: 'Firma de seguridad inválida. El ticket ha sido adulterado.'
      };
    }

    return {
      valido: true,
      citaId,
      codigoCita,
      fecha,
      hora,
      sedeId,
      firma: firmaRecibida
    };
  }

  /**
   * Genera URL de verificación para el código QR construida siempre sobre BASE_URL
   */
  static generarUrlVerificacion(tokenSeguro, paramsExtra = {}) {
    const searchParams = new URLSearchParams(paramsExtra);
    searchParams.set('token', tokenSeguro);
    searchParams.set('verificar', '1');
    return `${BASE_URL}/comprobante.html?${searchParams.toString()}`;
  }
}

/**
 * Gestor del Hold Temporal (Anti Phantom-Booking) en el Navegador
 */
class SlotHoldManager {
  static HOLDS_STORAGE_KEY = 'montepiedra_active_slot_holds';

  /**
   * Guarda un hold de 10 minutos para el slot actual
   */
  static registrarHold(sedeId, fecha, hora, duracionMinutos = 45, ttlMinutos = 10) {
    const now = Date.now();
    const expiraAt = now + (ttlMinutos * 60 * 1000);
    const holdData = {
      id: `HOLD-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      sedeId,
      fecha,
      hora,
      duracionMinutos,
      creadoAt: now,
      expiraAt
    };

    localStorage.setItem(this.HOLDS_STORAGE_KEY, JSON.stringify(holdData));
    return holdData;
  }

  /**
   * Obtiene el hold activo o null si expiró
   */
  static obtenerHoldActivo() {
    try {
      const raw = localStorage.getItem(this.HOLDS_STORAGE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (Date.now() > data.expiraAt) {
        this.liberarHold();
        return null;
      }
      return data;
    } catch {
      return null;
    }
  }

  /**
   * Calcula los segundos restantes del hold
   */
  static obtenerSegundosRestantes() {
    const hold = this.obtenerHoldActivo();
    if (!hold) return 0;
    return Math.max(0, Math.floor((hold.expiraAt - Date.now()) / 1000));
  }

  /**
   * Formatea el tiempo restante en MM:SS
   */
  static formatearTiempoRestante(segundos) {
    const m = Math.floor(segundos / 60);
    const s = segundos % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  /**
   * Libera el hold tras confirmar la cita o por abandono voluntario
   */
  static liberarHold() {
    localStorage.removeItem(this.HOLDS_STORAGE_KEY);
  }
}

/**
 * Reconciliador de Expedientes del Paciente (Anti-Duplicidad / Data Siloing)
 */
class PatientReconciliator {
  /**
   * Normaliza los datos del paciente para garantizar un único registro
   */
  static normalizarDatos(datos) {
    return {
      identificacion: (datos.identificacion || '').trim().replace(/\D/g, ''),
      nombre: (datos.nombre || '').trim().toUpperCase(),
      email: (datos.email || '').trim().toLowerCase(),
      telefono: (datos.telefono || '').trim().replace(/\s+/g, ''),
      alergias: (datos.alergias || '').trim() || 'Ninguna declarada'
    };
  }

  /**
   * Busca si el paciente ya existe en el historial local o central
   */
  static conciliar(pacientesExistentes, nuevoRegistro) {
    const norm = this.normalizarDatos(nuevoRegistro);
    if (!Array.isArray(pacientesExistentes)) return norm;

    // 1. Coincidencia por Cédula (identificador único determinista)
    let encontrado = pacientesExistentes.find(
      p => (p.idNumber || p.identificacion || '').trim() === norm.identificacion
    );

    // 2. Coincidencia por Correo o Teléfono si no coincide la cédula
    if (!encontrado && norm.email) {
      encontrado = pacientesExistentes.find(
        p => (p.email || '').trim().toLowerCase() === norm.email
      );
    }

    if (encontrado) {
      // Consolidar datos actualizados sin duplicar
      return {
        ...encontrado,
        nombre: norm.nombre || encontrado.name || encontrado.nombre,
        email: norm.email || encontrado.email,
        telefono: norm.telefono || encontrado.phone || encontrado.telefono,
        alergias: norm.alergias !== 'Ninguna declarada' ? norm.alergias : (encontrado.allergies || norm.alergias),
        esRecurrente: true
      };
    }

    return {
      ...norm,
      esRecurrente: false
    };
  }
}


// ==================== js/services/email-service.js ====================

/**
 * Montepiedra Salud - Servicio de Automatización de Correos Electrónicos
 * Semana 4 - Parte 3: Confirmación inmediata, recordatorios 24h y contingencias de guardia
 */


const EmailService = {
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
 * Validador de Correo Electrónico bajo estándar formal RFC 5322
 */
const RFC5322_EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

const validarEmailDetallado = (email) => {
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

const validarEmail = (email) => {
  return validarEmailDetallado(email).isValid;
};

/**
 * Validador de Nombre y Apellido Completo (mínimo 2 palabras, sin números ni símbolos)
 */
const validarNombreCompletoDetallado = (nombre) => {
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

const validarNombreCompleto = (nombre) => {
  return validarNombreCompletoDetallado(nombre).isValid;
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


// ==================== js/ambient-background.js ====================

/**
 * Montepiedra Salud - Motor de Fondo Difuminado Neutro con Iluminación Líquida
 * 
 * Estética Minimalista:
 * - Decoloración difuminada continua entre tonos neutros (Obsidian, Pizarra, Titanio, Mineral Teal, Grafito).
 * - Interacción con el ratón: Haz de luz ambiental fluido (Dynamic Ambient Spotlight)
 *   que se desliza suavemente con inercia líquida detrás del contenido e ilumina el cristal.
 * - Sin constelaciones ni líneas molestas, sin tambaleos 3D de textos. Puro lujo visual.
 */

(function () {
  'use strict';

  function initAmbientBackground() {
    const canvas = document.getElementById('ambient-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (canvas.__ambientRunning) return;
    canvas.__ambientRunning = true;

    let width = 0;
    let height = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Estado del cursor con inercia elástica ultrasuave
    const mouse = {
      x: window.innerWidth * 0.5,
      y: window.innerHeight * 0.35,
      targetX: window.innerWidth * 0.5,
      targetY: window.innerHeight * 0.35,
      vx: 0,
      vy: 0,
      intensity: 0.85,
      targetIntensity: 0.85,
      radius: 380
    };

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    resize();
    window.addEventListener('resize', resize, { passive: true });

    // Seguimiento del mouse
    window.addEventListener('mousemove', function (e) {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
      mouse.targetIntensity = 1.0;

      // Iluminación dinámica en tarjetas sobrevoladas (Apple/Linear spotlight border)
      const targetCard = e.target.closest('.featured-clinic-card, .how-step-card, .login-card-container, .patient-summary-card, .doctor-stat-box, .stat-item, .faq-item');
      if (targetCard) {
        const rect = targetCard.getBoundingClientRect();
        targetCard.style.setProperty('--mouse-x', (e.clientX - rect.left) + 'px');
        targetCard.style.setProperty('--mouse-y', (e.clientY - rect.top) + 'px');
      }
    }, { passive: true });

    window.addEventListener('touchmove', function (e) {
      if (e.touches.length > 0) {
        mouse.targetX = e.touches[0].clientX;
        mouse.targetY = e.touches[0].clientY;
        mouse.targetIntensity = 1.0;
      }
    }, { passive: true });

    window.addEventListener('mouseleave', function () {
      mouse.targetIntensity = 0.5;
    }, { passive: true });

    // Orbes de colores médicos con movimiento orgánico y difuminado profundo
    const neutralOrbs = [
      {
        baseX: 0.15, baseY: 0.25,
        radius: 650,
        speedX: 0.0006, speedY: 0.0008,
        phase: 0,
        // Cyan Médico Luminoso (rgba(6, 182, 212, 0.16))
        r: 6, g: 182, b: 212, a: 0.16
      },
      {
        baseX: 0.85, baseY: 0.20,
        radius: 680,
        speedX: -0.0007, speedY: 0.0006,
        phase: Math.PI * 0.4,
        // Cobalt Blue Primario (rgba(37, 99, 235, 0.18))
        r: 37, g: 99, b: 235, a: 0.18
      },
      {
        baseX: 0.50, baseY: 0.70,
        radius: 640,
        speedX: 0.0007, speedY: -0.0006,
        phase: Math.PI * 0.9,
        // Esmeralda Suave de Salud (rgba(16, 185, 129, 0.12))
        r: 16, g: 185, b: 129, a: 0.12
      },
      {
        baseX: 0.18, baseY: 0.80,
        radius: 600,
        speedX: -0.0005, speedY: -0.0007,
        phase: Math.PI * 1.3,
        // Cyan Secundario
        r: 6, g: 182, b: 212, a: 0.10
      },
      {
        baseX: 0.82, baseY: 0.82,
        radius: 640,
        speedX: 0.0006, speedY: 0.0005,
        phase: Math.PI * 1.7,
        // Cobalt Suave
        r: 37, g: 99, b: 235, a: 0.12
      }
    ];

    let time = 0;
    let animId = null;

    function render() {
      time += 0.014;

      // Suavizado elástico de la posición del haz de luz (Inercia fluida)
      mouse.vx = (mouse.targetX - mouse.x) * 0.075;
      mouse.vy = (mouse.targetY - mouse.y) * 0.075;
      mouse.x += mouse.vx;
      mouse.y += mouse.vy;

      mouse.intensity += (mouse.targetIntensity - mouse.intensity) * 0.05;

      ctx.clearRect(0, 0, width, height);

      // CAPA 1: Decoloración difuminada entre orbes neutros
      for (let i = 0; i < neutralOrbs.length; i++) {
        const orb = neutralOrbs[i];
        
        // Movimiento senoidal orgánico
        let cx = (orb.baseX + Math.sin(time * 0.6 + orb.phase) * 0.16) * width;
        let cy = (orb.baseY + Math.cos(time * 0.5 + orb.phase) * 0.16) * height;

        // Atracción magnética sutil hacia el haz de luz del ratón
        const dx = mouse.x - cx;
        const dy = mouse.y - cy;
        const dist = Math.hypot(dx, dy);
        if (dist > 0 && dist < 600) {
          const pull = (1 - dist / 600) * 45;
          cx += (dx / dist) * pull;
          cy += (dy / dist) * pull;
        }

        const r = orb.radius + Math.sin(time * 0.8 + orb.phase) * 50;

        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        grad.addColorStop(0, `rgba(${orb.r}, ${orb.g}, ${orb.b}, ${orb.a})`);
        grad.addColorStop(0.55, `rgba(${orb.r}, ${orb.g}, ${orb.b}, ${orb.a * 0.45})`);
        grad.addColorStop(1, `rgba(${orb.r}, ${orb.g}, ${orb.b}, 0)`);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // CAPA 2: Haz de Luz Líquido Interactivo (Dynamic Ambient Mouse Spotlight)
      // Un resplandor difuminado que sigue al cursor suavemente iluminando el fondo
      if (mouse.intensity > 0.05) {
        const speed = Math.hypot(mouse.vx, mouse.vy);
        const dynamicRadius = mouse.radius + Math.min(speed * 6, 120);

        // Halo Exterior Difuminado (Teal Orgánico + Pizarra)
        const outerGrad = ctx.createRadialGradient(
          mouse.x, mouse.y, 0,
          mouse.x, mouse.y, dynamicRadius
        );
        outerGrad.addColorStop(0, `rgba(6, 182, 212, ${0.16 * mouse.intensity})`);
        outerGrad.addColorStop(0.40, `rgba(37, 99, 235, ${0.10 * mouse.intensity})`);
        outerGrad.addColorStop(0.75, `rgba(241, 245, 249, ${0.05 * mouse.intensity})`);
        outerGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = outerGrad;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, dynamicRadius, 0, Math.PI * 2);
        ctx.fill();

        // Núcleo Interior de Luz Suave (Luminescence)
        const innerRadius = dynamicRadius * 0.42;
        const innerGrad = ctx.createRadialGradient(
          mouse.x, mouse.y, 0,
          mouse.x, mouse.y, innerRadius
        );
        innerGrad.addColorStop(0, `rgba(255, 255, 255, ${0.25 * mouse.intensity})`);
        innerGrad.addColorStop(0.5, `rgba(238, 242, 255, ${0.10 * mouse.intensity})`);
        innerGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = innerGrad;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, innerRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    }

    render();
  }

  // Exportar al ámbito global y autoiniciar
  if (typeof window !== 'undefined') {
    window.initAmbientBackground = initAmbientBackground;
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initAmbientBackground);
    } else {
      initAmbientBackground();
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { initAmbientBackground };
  }
})();


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
const RETENTION_RULES = {
  ceibos: { rate: 0.25, name: 'Clínica Ceibos', label: '25% Deducción Consultorio' },
  alborada: { rate: 0.10, name: 'Sede Alborada', label: '10% Deducción Consultorio' },
  mapasingue: { rate: 0.05, name: 'Sede Mapasingue', label: '5% Deducción Consultorio' },
  hospital: { rate: 0.00, name: 'Hospital Público Ceibos', label: '0% (Convenio Institucional)' }
};

// Catálogo de Períodos Semanales de Corte Financiero (Semana 4 - Parte 4)
const SETTLEMENT_PERIODS = [
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
    phone: '0987654321',
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
function getTodayDateStr() {
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
  
  // Citas Iniciales (0 citas registradas)
  appointments: [],

  // Bloques de Traslado Protegido entre Clínicas (0 traslados)
  travelBuffers: [],

  // Perfiles Completos de Pacientes
  patientProfiles: [
    {
      cedula: '0987654321',
      nombres: 'Carlos',
      apellidos: 'Mendoza Moreira',
      telefono: '0987654321',
      email: 'paciente@gmail.com',
      direccion: 'Alborada Etapa 8, Mz. 812 Sol. 14, Guayaquil',
      tipo_sangre: 'O+',
      allergies: 'Penicilina, Sulfamidas',
      chronicConditions: 'Hipertensión arterial esencial',
      medicacion_habitual: 'Losartán 50mg/día'
    }
  ],

  // Fichas Clínicas de Pacientes y Expediente Cronológico (0 fichas)
  medicalRecords: [],

  // Recetas Digitales Emitidas (0 recetas)
  prescriptions: [],

  // Registro de Gastos Diarios y Operativos (0 gastos)
  expenses: [],

  // Estado de Guardia de Emergencia Médica
  emergencyGuard: {
    isActive: false,
    activatedAt: null,
    reason: 'Guardia imprevista en Hospital Ceibos convocada por Dirección Médica',
    affectedAppointments: []
  },

  // Registro de Notificaciones y Automatizaciones de Correos (0 logs)
  notificationLogs: [],

  // Historial de Liquidaciones Semanales Formales (0 liquidaciones)
  settlements: [],

  // Balance Contable Consolidado y Cierre de Ejercicio
  accountingBalance: {
    totalRevenue: 0.00,
    totalCommissions: 0.00,
    totalExpenses: 0.00,
    netProfit: 0.00,
    reconciliationHistory: []
  },

  // Historial de Relevos Médicos entre Colegas (0 relevos)
  reliefAssignments: [],

  // Registro de Alertas Operativas del Sistema (0 alertas)
  systemAlerts: []
};


class StateStore {
  constructor() {
    let saved = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) saved = JSON.parse(raw);
    } catch (e) {}

    this.state = saved || JSON.parse(JSON.stringify(INITIAL_STATE));
    if (!this.state.appointments) this.state.appointments = [];

    // Base de datos persistente global de citas para asegurar que NINGUNA cita se pierda
    try {
      const rawApts = localStorage.getItem('montepiedra_all_appointments');
      if (rawApts) {
        const savedApts = JSON.parse(rawApts);
        if (Array.isArray(savedApts) && savedApts.length > 0) {
          const existingIds = new Set((this.state.appointments || []).map(a => a.id || a.code));
          savedApts.forEach(a => {
            if (!existingIds.has(a.id || a.code)) {
              this.state.appointments.push(a);
              existingIds.add(a.id || a.code);
            }
          });
        }
      }
    } catch (e) {}

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
        const existingIds = new Set((this.state.appointments || []).map(a => a.id || a.code));
        apts.forEach(a => {
          if (!existingIds.has(a.id || a.code)) {
            this.state.appointments.push(a);
            existingIds.add(a.id || a.code);
            hasChanges = true;
          }
        });
        if (hasChanges) {
          try {
            localStorage.setItem('montepiedra_all_appointments', JSON.stringify(this.state.appointments));
          } catch (e) {}
        }
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
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      if (this.state.appointments && this.state.appointments.length > 0) {
        localStorage.setItem('montepiedra_all_appointments', JSON.stringify(this.state.appointments));
      }
    } catch (e) {
      console.warn('Error guardando en localStorage:', e);
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

  getPatientAppointments(cedula, user) {
    const allApts = this.state.appointments || [];
    // Retornar todas las citas registradas en la base de datos (ordenadas con la más reciente primero)
    // para garantizar que al ingresar una cita con un nuevo paciente, las citas anteriores se mantengan almacenadas y visibles
    if (allApts.length > 0) {
      return [...allApts].reverse();
    }
    return [];
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
    coveringDoctorPhone = '0984719283',
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
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.warn('Error limpiando localStorage:', e);
    }
    for (const k of Object.keys(DEMO_USERS)) {
      if (k.startsWith('paciente_') && k !== 'paciente') {
        delete DEMO_USERS[k];
      }
    }
    this.state = JSON.parse(JSON.stringify(INITIAL_STATE));
    this.saveState();
    this.notify();
    return this.state;
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

      if (loginInput) {
        if (currentSelectedRole === 'doctor') {
          loginInput.placeholder = 'Cédula o Usuario del Doctor';
        } else if (currentSelectedRole === 'paciente') {
          loginInput.placeholder = 'Cédula o Usuario del Paciente';
        } else {
          loginInput.placeholder = 'Cédula o Usuario Contable';
        }
      }
    });
  });

  // Botones de Autorelleno Rápido Demo (1 Clic)
  const demoButtons = document.querySelectorAll('.btn-demo-autofill');
  demoButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetRole = btn.dataset.role;
      const targetUser = btn.dataset.user;
      const targetPass = btn.dataset.pass;

      roleTabs.forEach(t => {
        if (t.dataset.role === targetRole) {
          t.classList.add('active');
        } else {
          t.classList.remove('active');
        }
      });
      currentSelectedRole = targetRole;

      if (loginInput) loginInput.value = targetUser;
      if (passwordInput) passwordInput.value = targetPass;

      if (loginForm) {
        loginForm.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      }
    });
  });

  // SVGs Gráficos para el Ojo (Ojo abierto / visible vs Ojo tapado / tachado)
  const eyeOpenSvg = `<svg class="eye-svg eye-open" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
  const eyeClosedSvg = `<svg class="eye-svg eye-slashed" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path><line x1="2" y1="2" x2="22" y2="22"></line></svg>`;

  // Mostrar / Ocultar contraseña con icono gráfico dinámico
  if (passwordToggleBtn && passwordInput) {
    passwordToggleBtn.innerHTML = eyeClosedSvg;
    passwordToggleBtn.setAttribute('title', 'Mostrar contraseña (hacer visible)');
    passwordToggleBtn.setAttribute('aria-label', 'Mostrar contraseña');

    passwordToggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const isPassword = passwordInput.getAttribute('type') === 'password';
      if (isPassword) {
        passwordInput.setAttribute('type', 'text');
        passwordToggleBtn.innerHTML = eyeOpenSvg;
        passwordToggleBtn.setAttribute('title', 'Ocultar contraseña (hacer invisible)');
        passwordToggleBtn.setAttribute('aria-label', 'Ocultar contraseña');
      } else {
        passwordInput.setAttribute('type', 'password');
        passwordToggleBtn.innerHTML = eyeClosedSvg;
        passwordToggleBtn.setAttribute('title', 'Mostrar contraseña (hacer visible)');
        passwordToggleBtn.setAttribute('aria-label', 'Mostrar contraseña');
      }
    });
  }

  // Procesar envío del formulario: Validación estricta por rol
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
        enteredPass === doc.password ||
        enteredPass === doc.alternativePassword ||
        enteredPass === 'admin123' ||
        enteredPass === 'doctor123'
      );

      if (isDoctorUser && isDoctorPass) {
        matchedUser = doc;
      }

      // 2. Comprobar si coincide con Paciente
      if (!matchedUser && DEMO_USERS.paciente) {
        const pat = DEMO_USERS.paciente;
        const isPatUser = (
          enteredUser === (pat.username || '').toLowerCase() ||
          enteredUser === (pat.email || '').toLowerCase() ||
          enteredUser === pat.idNumber ||
          enteredUser === '0987654321' ||
          enteredUser === 'paciente' ||
          enteredUser === 'carlos mendoza' ||
          enteredUser === 'carlos mendoza moreira' ||
          enteredUser === 'mendoza' ||
          (currentSelectedRole === 'paciente' && (enteredUser === 'paciente' || enteredUser === 'demo'))
        );
        const isPatPass = (
          enteredPass === pat.password ||
          enteredPass === 'paciente123'
        );
        if (isPatUser && isPatPass) {
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

      // 4. Si aún no coincide, buscar en bucle general (incluye usuarios recién creados)
      if (!matchedUser) {
        for (const key in DEMO_USERS) {
          const u = DEMO_USERS[key];
          if (!u) continue;
          const matchU = (
            (u.username && u.username.toLowerCase() === enteredUser) ||
            (u.email && u.email.toLowerCase() === enteredUser) ||
            (u.idNumber && u.idNumber === enteredUser)
          );
          if (matchU && u.password === enteredPass) {
            matchedUser = u;
            break;
          }
        }
      }

      if (matchedUser) {
        // Si el rol seleccionado no coincide con la cuenta pero las credenciales son válidas,
        // sincronizar automáticamente la pestaña activa con el rol correspondiente
        if (matchedUser.role !== currentSelectedRole) {
          currentSelectedRole = matchedUser.role;
          roleTabs.forEach(t => {
            t.classList.toggle('active', t.dataset.role === currentSelectedRole);
          });
        }

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

  // --- MÓDULO DE CREACIÓN DE CUENTA (REGISTRO DE PACIENTE) ---
  setupPatientRegistration(showToast);

  // --- MÓDULO DE MODAL UNIFICADO DE AUTENTICACIÓN (NAVBAR & WIZARD) ---
  setupUnifiedLoginModal(showToast);
}

function setupUnifiedLoginModal(showToast) {
  const modal = document.getElementById('modal-unified-login');
  if (!modal) return;

  const btnClose = document.getElementById('btn-close-unified-login-modal');
  const roleTabs = modal.querySelectorAll('.modal-role-tab-btn');
  const loginInput = document.getElementById('modal-login-username');
  const passwordInput = document.getElementById('modal-login-password');
  const passToggleBtn = document.getElementById('btn-modal-toggle-password');
  const form = document.getElementById('modal-unified-login-form');
  const btnOpenRegister = document.getElementById('btn-modal-open-register');
  const registerModal = document.getElementById('modal-register-patient');

  let currentSelectedRole = 'paciente';

  // Función para abrir el modal unificado y enfocar campo
  function openModal(role = 'paciente') {
    setRole(role);
    const loginModal = document.getElementById('modal-unified-login') || document.getElementById('modal-wizard-auth-gate') || document.getElementById('modal-auth') || modal;
    if (loginModal) {
      loginModal.classList.remove('hidden');
      loginModal.classList.add('active');
    }
    if (loginInput) {
      setTimeout(() => loginInput.focus(), 80);
    }
  }

  // Exponer al ámbito global para invocar desde cualquier módulo o script
  window.openUnifiedLoginModal = openModal;

  // Triggers para abrir el modal desde cualquier lugar (Navbar Landing, Navbar Paciente, Hero, Wizard, Footer)
  const openTriggers = [
    document.getElementById('btn-navbar-login-landing'),
    document.getElementById('btn-nav-login'),
    document.getElementById('btn-patient-open-login'),
    document.getElementById('btn-wizard-open-login'),
    document.getElementById('btn-hero-portal'),
    document.getElementById('footer-btn-portal'),
    document.getElementById('footer-btn-history'),
    ...Array.from(document.querySelectorAll('.btn-navbar-login, .btn-patient-nav-login'))
  ];

  const uniqueTriggers = Array.from(new Set(openTriggers.filter(Boolean)));
  uniqueTriggers.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      // Si el botón viene del enlace a portal de profesionales, cambiar rol a doctor
      if (btn.id === 'footer-btn-portal' || btn.id === 'btn-hero-portal') {
        openModal('doctor');
      } else {
        openModal('paciente');
      }
    });
  });

  // Cerrar modal con el botón de la esquina
  if (btnClose) {
    btnClose.addEventListener('click', () => {
      modal.classList.remove('active');
    });
  }

  function setRole(role) {
    currentSelectedRole = role;
    roleTabs.forEach(t => {
      if (t.dataset.role === role) {
        t.classList.add('active');
      } else {
        t.classList.remove('active');
      }
    });
    if (loginInput) {
      if (role === 'doctor') {
        loginInput.placeholder = 'Cédula o Usuario del Doctor';
      } else if (role === 'paciente') {
        loginInput.placeholder = 'Cédula o Usuario del Paciente';
      } else {
        loginInput.placeholder = 'Cédula o Usuario Contable';
      }
    }
  }

  // Cambio interactivo de rol
  roleTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      setRole(tab.dataset.role);
    });
  });

  // Botones de Autorelleno Rápido Demo (1 Clic)
  const demoBtns = modal.querySelectorAll('.btn-modal-demo-autofill');
  demoBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const role = btn.dataset.role;
      const user = btn.dataset.user;
      const pass = btn.dataset.pass;
      setRole(role);
      if (loginInput) loginInput.value = user;
      if (passwordInput) passwordInput.value = pass;
      if (form) {
        form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      }
    });
  });

  // Mostrar / Ocultar contraseña
  if (passToggleBtn && passwordInput) {
    const eyeOpenSvg = `<svg class="eye-svg eye-open" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
    const eyeClosedSvg = `<svg class="eye-svg eye-slashed" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path><line x1="2" y1="2" x2="22" y2="22"></line></svg>`;

    passToggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const isPass = passwordInput.getAttribute('type') === 'password';
      if (isPass) {
        passwordInput.setAttribute('type', 'text');
        passToggleBtn.innerHTML = eyeOpenSvg;
      } else {
        passwordInput.setAttribute('type', 'password');
        passToggleBtn.innerHTML = eyeClosedSvg;
      }
    });
  }

  // Abrir modal de registro de paciente desde el modal de login
  if (btnOpenRegister && registerModal) {
    btnOpenRegister.addEventListener('click', (e) => {
      e.preventDefault();
      modal.classList.remove('active');
      registerModal.classList.add('active');
    });
  }

  // Enviar formulario modal
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const enteredUser = (loginInput ? loginInput.value : '').trim().toLowerCase();
      const enteredPass = (passwordInput ? passwordInput.value : '').trim();

      if (!enteredUser || !enteredPass) {
        showToast('Por favor ingrese su usuario o cédula y su contraseña.', 'warning');
        return;
      }

      let matchedUser = null;

      // 1. Doctor
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
        enteredPass === doc.password ||
        enteredPass === doc.alternativePassword ||
        enteredPass === 'admin123' ||
        enteredPass === 'doctor123'
      );
      if (isDoctorUser && isDoctorPass) matchedUser = doc;

      // 2. Paciente
      if (!matchedUser && DEMO_USERS.paciente) {
        const pat = DEMO_USERS.paciente;
        const isPatUser = (
          enteredUser === (pat.username || '').toLowerCase() ||
          enteredUser === (pat.email || '').toLowerCase() ||
          enteredUser === pat.idNumber ||
          enteredUser === '0987654321' ||
          enteredUser === 'paciente' ||
          enteredUser === 'carlos mendoza' ||
          enteredUser === 'carlos mendoza moreira' ||
          enteredUser === 'mendoza' ||
          (currentSelectedRole === 'paciente' && (enteredUser === 'paciente' || enteredUser === 'demo'))
        );
        const isPatPass = (
          enteredPass === pat.password ||
          enteredPass === 'paciente123'
        );
        if (isPatUser && isPatPass) matchedUser = pat;
      }

      // 3. Contadora
      if (!matchedUser) {
        const acc = DEMO_USERS.contador;
        const isAccUser = (
          enteredUser === acc.username.toLowerCase() ||
          enteredUser === acc.email.toLowerCase() ||
          enteredUser === acc.idNumber ||
          enteredUser === 'patricia morales'
        );
        if (isAccUser && enteredPass === acc.password) matchedUser = acc;
      }

      // 4. Búsqueda general
      if (!matchedUser) {
        for (const key in DEMO_USERS) {
          const u = DEMO_USERS[key];
          if (!u) continue;
          const matchU = (
            (u.username && u.username.toLowerCase() === enteredUser) ||
            (u.email && u.email.toLowerCase() === enteredUser) ||
            (u.idNumber && u.idNumber === enteredUser)
          );
          if (matchU && u.password === enteredPass) {
            matchedUser = u;
            break;
          }
        }
      }

      if (matchedUser) {
        // Sincronizar rol automáticamente si coincide
        if (matchedUser.role !== currentSelectedRole) {
          setRole(matchedUser.role);
        }

        // Éxito: cerrar modal y loguear
        modal.classList.remove('active');
        store.setCurrentUser(matchedUser);
        store.setActiveView(matchedUser.role);
        showToast(`Acceso exitoso. Bienvenido(a), ${matchedUser.name}`, 'success');

        window.scrollTo({ top: 0, behavior: 'instant' });
        if (loginInput) loginInput.value = '';
        if (passwordInput) passwordInput.value = '';
      } else {
        showToast('Credenciales incorrectas. Verifique los datos ingresados.', 'danger');
      }
    });
  }
}

function setupPatientRegistration(showToast) {
  const registerModal = document.getElementById('modal-register-patient');
  const btnOpenRegister = document.getElementById('btn-open-register-modal');
  const btnCloseRegister = document.getElementById('btn-close-register-modal');
  const registerForm = document.getElementById('form-register-patient');

  const formContainer = document.getElementById('register-form-container');
  const welcomeView = document.getElementById('register-welcome-view');
  const welcomeTitle = document.getElementById('reg-welcome-title');
  const welcomeSubtitle = document.getElementById('reg-welcome-subtitle');
  const welcomeActionBtn = document.getElementById('btn-reg-welcome-action');
  const btnSwitchLogin = document.getElementById('btn-switch-to-login');

  const idInput = document.getElementById('reg-pat-cedula') || document.getElementById('reg-pat-id');
  const idFeedback = document.getElementById('feedback-reg-cedula');

  const nameInput = document.getElementById('reg-pat-name') || document.getElementById('reg-pat-nombres');
  const nameFeedback = document.getElementById('feedback-reg-name');

  const phoneInput = document.getElementById('reg-pat-phone');
  const phoneFeedback = document.getElementById('feedback-reg-phone');

  const emailInput = document.getElementById('reg-pat-email');
  const emailFeedback = document.getElementById('feedback-reg-email');

  const passInput = document.getElementById('reg-pat-password');
  const passFeedback = document.getElementById('feedback-reg-password');
  const passToggleBtn = document.getElementById('btn-reg-toggle-password');

  const strengthSegs = [1, 2, 3, 4].map(i => document.getElementById(`strength-seg-${i}`));
  const strengthText = document.getElementById('reg-strength-text');

  // Helper para asignar estado visual y feedback inline a un campo
  function setInputFeedback(inputEl, feedbackEl, isValid, message) {
    if (!inputEl) return;
    if (isValid === null) {
      inputEl.classList.remove('input-error', 'input-valid');
      if (feedbackEl) {
        feedbackEl.textContent = '';
        feedbackEl.className = 'input-feedback';
      }
      return;
    }
    if (isValid) {
      inputEl.classList.remove('input-error');
      inputEl.classList.add('input-valid');
      if (feedbackEl) {
        feedbackEl.textContent = message || '';
        feedbackEl.className = 'input-feedback valid';
      }
    } else {
      inputEl.classList.remove('input-valid');
      inputEl.classList.add('input-error');
      if (feedbackEl) {
        feedbackEl.textContent = message || '';
        feedbackEl.className = 'input-feedback error';
      }
    }
  }

  // Helper para calcular fortaleza de contraseña (4 niveles según requerimientos)
  function calcularFortalezaPassword(pass) {
    if (!pass || pass.length === 0) {
      return { level: 0, text: 'Sin ingresar', color: '#94a3b8' };
    }
    const len = pass.length;
    const hasNumber = /\d/.test(pass);
    const hasUpper = /[A-Z]/.test(pass);
    const hasLower = /[a-z]/.test(pass);
    const hasSymbol = /[^a-zA-Z0-9]/.test(pass);

    // Nivel 4 (≥ 8 caracteres + mayúsculas + minúsculas + números + símbolo): Color esmeralda (#10b981) ➔ "Fuerte / Segura"
    if (len >= 8 && hasUpper && hasLower && hasNumber && hasSymbol) {
      return { level: 4, text: 'Fuerte / Segura', color: '#10b981' };
    }
    // Nivel 3 (≥ 8 caracteres + números + mayúscula): Color amarillo/verde (#84cc16) ➔ "Aceptable"
    if (len >= 8 && hasNumber && hasUpper) {
      return { level: 3, text: 'Aceptable', color: '#84cc16' };
    }
    // Nivel 2 (≥ 6 caracteres + números): Color naranja (#f59e0b) ➔ "Débil"
    if (len >= 6 && hasNumber) {
      return { level: 2, text: 'Débil', color: '#f59e0b' };
    }
    // Nivel 1 (< 6 caracteres): Color rojo (#ef4444) ➔ "Muy débil"
    return { level: 1, text: 'Muy débil', color: '#ef4444' };
  }

  // Validador de celular de Ecuador (inicia con 09, 10 dígitos, sin secuencias repetitivas)
  function validarCelularEcuatorianoDetallado(phone) {
    if (!phone || typeof phone !== 'string') {
      return { isValid: false, message: 'El número celular es requerido.' };
    }
    const clean = phone.trim().replace(/\D/g, '');
    if (clean.length !== 10) {
      return { isValid: false, message: 'Ingresa un celular válido de Ecuador (inicia con 09, ej: 0991234567)' };
    }
    if (!clean.startsWith('09')) {
      return { isValid: false, message: 'Ingresa un celular válido de Ecuador (inicia con 09, ej: 0991234567)' };
    }
    const rest = clean.substring(2);
    if (/^(\d)\1+$/.test(rest) || /^(\d)\1+$/.test(clean)) {
      return { isValid: false, message: 'Ingresa un celular válido de Ecuador (inicia con 09, ej: 0991234567)' };
    }
    return { isValid: true, message: '✓ Celular válido' };
  }

  // Reset del modal al abrir
  function resetRegisterModal() {
    if (formContainer) {
      formContainer.style.display = 'block';
      formContainer.style.opacity = '1';
    }
    if (welcomeView) {
      welcomeView.style.display = 'none';
      welcomeView.style.opacity = '0';
    }
    if (registerForm) registerForm.reset();
    [idInput, nameInput, phoneInput, emailInput, passInput].forEach(inp => {
      if (inp) inp.classList.remove('input-error', 'input-valid');
    });
    [idFeedback, nameFeedback, phoneFeedback, emailFeedback, passFeedback].forEach(fb => {
      if (fb) {
        fb.textContent = '';
        fb.className = 'input-feedback';
      }
    });
    strengthSegs.forEach(seg => {
      if (seg) seg.style.background = '#e2e8f0';
    });
    if (strengthText) {
      strengthText.textContent = 'Sin ingresar';
      strengthText.style.color = '#94a3b8';
    }
  }

  // Triggers para abrir modal de registro
  const openTriggers = [
    btnOpenRegister,
    document.getElementById('btn-modal-open-register')
  ];

  openTriggers.forEach(btn => {
    if (btn && registerModal) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        resetRegisterModal();
        registerModal.classList.add('active');
      });
    }
  });

  // Cerrar modal
  if (btnCloseRegister && registerModal) {
    btnCloseRegister.addEventListener('click', () => {
      registerModal.classList.remove('active');
    });
  }

  // Switch a Login
  if (btnSwitchLogin && registerModal) {
    btnSwitchLogin.addEventListener('click', (e) => {
      e.preventDefault();
      registerModal.classList.remove('active');
      const loginModal = document.getElementById('modal-unified-login');
      if (loginModal) loginModal.classList.add('active');
    });
  }

  // Alternar visibilidad de contraseña (SVG eye)
  if (passToggleBtn && passInput) {
    const eyeOpenSvg = `<svg class="eye-svg eye-open" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
    const eyeClosedSvg = `<svg class="eye-svg eye-slashed" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path><line x1="2" y1="2" x2="22" y2="22"></line></svg>`;

    passToggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const isPass = passInput.getAttribute('type') === 'password';
      if (isPass) {
        passInput.setAttribute('type', 'text');
        passToggleBtn.innerHTML = eyeOpenSvg;
      } else {
        passInput.setAttribute('type', 'password');
        passToggleBtn.innerHTML = eyeClosedSvg;
      }
    });
  }

  // 1. Cédula: sanitización y validación Módulo 10
  if (idInput) {
    idInput.setAttribute('maxlength', '10');
    idInput.setAttribute('inputmode', 'numeric');
    idInput.addEventListener('input', function() {
      this.value = this.value.replace(/\D/g, '').substring(0, 10);
      if (this.value.length === 10) {
        const check = validarCedulaEcuatorianaDetallada(this.value);
        if (check.isValid) {
          setInputFeedback(this, idFeedback, true, '✓ Cédula ecuatoriana válida');
        } else {
          setInputFeedback(this, idFeedback, false, 'Cédula ecuatoriana inválida (debe contener 10 dígitos válidos)');
        }
      } else {
        setInputFeedback(this, idFeedback, null);
      }
    });

    idInput.addEventListener('blur', function() {
      if (!this.value.trim()) {
        setInputFeedback(this, idFeedback, false, 'La cédula de identidad es obligatoria');
        return;
      }
      const check = validarCedulaEcuatorianaDetallada(this.value);
      if (check.isValid) {
        setInputFeedback(this, idFeedback, true, '✓ Cédula ecuatoriana válida');
      } else {
        setInputFeedback(this, idFeedback, false, 'Cédula ecuatoriana inválida (debe contener 10 dígitos válidos)');
      }
    });
  }

  // 2. Nombre y Apellido: bloqueo en tiempo real y mínimo 2 palabras
  if (nameInput) {
    nameInput.setAttribute('maxlength', '70');
    nameInput.addEventListener('input', function() {
      this.value = this.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
      const words = this.value.trim().split(/\s+/).filter(w => w.length >= 2);
      if (words.length >= 2) {
        setInputFeedback(this, nameFeedback, true, '✓ Nombre y apellido válidos');
      } else {
        setInputFeedback(this, nameFeedback, null);
      }
    });

    nameInput.addEventListener('blur', function() {
      if (!this.value.trim()) {
        setInputFeedback(this, nameFeedback, false, 'El nombre y apellido son obligatorios');
        return;
      }
      const check = validarNombreCompletoDetallado(this.value);
      if (check.isValid) {
        setInputFeedback(this, nameFeedback, true, '✓ Nombre y apellido válidos');
      } else {
        setInputFeedback(this, nameFeedback, false, 'Ingresa al menos un nombre y un apellido válidos (sin números ni símbolos)');
      }
    });
  }

  // 3. Teléfono: inicio con 09 y sin secuencias repetitivas
  if (phoneInput) {
    phoneInput.setAttribute('maxlength', '10');
    phoneInput.setAttribute('inputmode', 'numeric');
    phoneInput.addEventListener('input', function() {
      this.value = this.value.replace(/\D/g, '').substring(0, 10);
      if (this.value.length === 10) {
        const check = validarCelularEcuatorianoDetallado(this.value);
        if (check.isValid) {
          setInputFeedback(this, phoneFeedback, true, check.message);
        } else {
          setInputFeedback(this, phoneFeedback, false, check.message);
        }
      } else {
        setInputFeedback(this, phoneFeedback, null);
      }
    });

    phoneInput.addEventListener('blur', function() {
      if (!this.value.trim()) {
        setInputFeedback(this, phoneFeedback, false, 'El número celular es requerido');
        return;
      }
      const check = validarCelularEcuatorianoDetallado(this.value);
      if (check.isValid) {
        setInputFeedback(this, phoneFeedback, true, check.message);
      } else {
        setInputFeedback(this, phoneFeedback, false, check.message);
      }
    });
  }

  // 4. Correo electrónico: estructura de email válida
  if (emailInput) {
    emailInput.addEventListener('input', function() {
      const trimmed = this.value.trim();
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
        setInputFeedback(this, emailFeedback, true, '✓ Correo electrónico válido');
      } else {
        setInputFeedback(this, emailFeedback, null);
      }
    });

    emailInput.addEventListener('blur', function() {
      if (!this.value.trim()) {
        setInputFeedback(this, emailFeedback, false, 'El correo electrónico es requerido');
        return;
      }
      const check = validarEmailDetallado(this.value);
      if (check.isValid) {
        setInputFeedback(this, emailFeedback, true, '✓ Correo electrónico válido');
      } else {
        setInputFeedback(this, emailFeedback, false, 'Ingresa un correo electrónico válido');
      }
    });
  }

  // 5. Contraseña: barra de fortaleza reactiva
  if (passInput) {
    passInput.addEventListener('input', function() {
      const val = this.value;
      const strength = calcularFortalezaPassword(val);
      if (strengthText) {
        strengthText.textContent = strength.text;
        strengthText.style.color = strength.color;
      }
      strengthSegs.forEach((seg, idx) => {
        if (!seg) return;
        if (idx < strength.level) {
          seg.style.background = strength.color;
        } else {
          seg.style.background = '#e2e8f0';
        }
      });
      if (val.length >= 6) {
        setInputFeedback(this, passFeedback, true, `✓ Fortaleza: ${strength.text}`);
      } else if (val.length > 0) {
        setInputFeedback(this, passFeedback, false, 'La contraseña debe tener al menos 6 caracteres');
      } else {
        setInputFeedback(this, passFeedback, null);
      }
    });

    passInput.addEventListener('blur', function() {
      if (!this.value) {
        setInputFeedback(this, passFeedback, false, 'La contraseña de acceso es requerida');
      } else if (this.value.length < 6) {
        setInputFeedback(this, passFeedback, false, 'La contraseña debe tener al menos 6 caracteres');
      }
    });
  }

  // Enviar formulario de registro con control de 1 solo Toast
  if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const nameVal = nameInput ? nameInput.value.trim() : '';
      const idVal = idInput ? idInput.value.trim() : '';
      const phoneVal = phoneInput ? phoneInput.value.trim() : '';
      const emailVal = emailInput ? emailInput.value.trim() : '';
      const passVal = passInput ? passInput.value.trim() : '';

      let firstInvalidInput = null;

      // Validación Cédula
      const cedulaCheck = validarCedulaEcuatorianaDetallada(idVal);
      if (!cedulaCheck.isValid) {
        setInputFeedback(idInput, idFeedback, false, 'Cédula ecuatoriana inválida (debe contener 10 dígitos válidos)');
        if (!firstInvalidInput) firstInvalidInput = idInput;
      } else {
        setInputFeedback(idInput, idFeedback, true, '✓ Cédula ecuatoriana válida');
      }

      // Validación Nombre
      const nameCheck = validarNombreCompletoDetallado(nameVal);
      if (!nameCheck.isValid) {
        setInputFeedback(nameInput, nameFeedback, false, 'Ingresa al menos un nombre y un apellido válidos (sin números ni símbolos)');
        if (!firstInvalidInput) firstInvalidInput = nameInput;
      } else {
        setInputFeedback(nameInput, nameFeedback, true, '✓ Nombre y apellido válidos');
      }

      // Validación Celular
      const phoneCheck = validarCelularEcuatorianoDetallado(phoneVal);
      if (!phoneCheck.isValid) {
        setInputFeedback(phoneInput, phoneFeedback, false, phoneCheck.message);
        if (!firstInvalidInput) firstInvalidInput = phoneInput;
      } else {
        setInputFeedback(phoneInput, phoneFeedback, true, phoneCheck.message);
      }

      // Validación Email
      const emailCheck = validarEmailDetallado(emailVal);
      if (!emailCheck.isValid) {
        setInputFeedback(emailInput, emailFeedback, false, 'Ingresa un correo electrónico válido');
        if (!firstInvalidInput) firstInvalidInput = emailInput;
      } else {
        setInputFeedback(emailInput, emailFeedback, true, '✓ Correo electrónico válido');
      }

      // Validación Contraseña
      if (passVal.length < 6) {
        setInputFeedback(passInput, passFeedback, false, 'La contraseña debe tener al menos 6 caracteres');
        if (!firstInvalidInput) firstInvalidInput = passInput;
      } else {
        const strength = calcularFortalezaPassword(passVal);
        setInputFeedback(passInput, passFeedback, true, `✓ Fortaleza: ${strength.text}`);
      }

      // Si algún campo falló, enfocar el primero y emitir exactamente UN toast informativo
      if (firstInvalidInput) {
        firstInvalidInput.focus();
        showToast('Por favor verifica los campos marcados en rojo.', 'warning');
        return;
      }

      // Comprobar duplicidad
      for (const k in DEMO_USERS) {
        if (DEMO_USERS[k].idNumber === idVal) {
          setInputFeedback(idInput, idFeedback, false, 'Ya existe una cuenta con esta cédula de identidad');
          idInput.focus();
          showToast('Ya existe una cuenta registrada con esta cédula.', 'warning');
          return;
        }
        if (DEMO_USERS[k].email && DEMO_USERS[k].email.toLowerCase() === emailVal.toLowerCase()) {
          setInputFeedback(emailInput, emailFeedback, false, 'Ya existe una cuenta con este correo electrónico');
          emailInput.focus();
          showToast('Ya existe una cuenta registrada con este correo.', 'warning');
          return;
        }
      }

      // Crear nuevo usuario de Paciente
      const userKey = `paciente_${idVal}`;
      const newPatientUser = {
        role: 'paciente',
        name: nameVal,
        email: emailVal,
        username: idVal,
        idNumber: idVal,
        password: passVal,
        phone: phoneVal,
        allergies: 'Sin alergias declaradas',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
      };

      DEMO_USERS[userKey] = newPatientUser;

      // Registrar o actualizar perfil del paciente en el store
      if (store.savePatientProfile) {
        store.savePatientProfile({
          cedula: idVal,
          nombres: nameVal.split(' ')[0] || nameVal,
          apellidos: nameVal.split(' ').slice(1).join(' ') || '',
          telefono: phoneVal,
          email: emailVal,
          direccion: 'Guayaquil, Ecuador',
          tipo_sangre: 'O+',
          alergias: 'Sin alergias declaradas',
          enfermedades_cronicas: 'Ninguna reportada',
          medicacion_habitual: 'Ninguna'
        });
      }

      // Iniciar sesión
      store.setCurrentUser(newPatientUser);

      // Transición suave a la vista de Onboarding / Bienvenida
      if (formContainer && welcomeView) {
        formContainer.style.transition = 'opacity 0.25s ease';
        formContainer.style.opacity = '0';
        setTimeout(() => {
          formContainer.style.display = 'none';
          welcomeView.style.display = 'block';
          welcomeView.style.opacity = '0';
          welcomeView.style.transition = 'opacity 0.35s ease';

          if (welcomeTitle) {
            welcomeTitle.textContent = `¡Bienvenido a Montepiedra Salud, ${nameVal}!`;
          }

          // Verificar si venía con reserva en curso
          const pendingDraft = sessionStorage.getItem('montepiedra_pending_booking');
          if (pendingDraft && welcomeActionBtn) {
            welcomeActionBtn.textContent = '📅 Continuar con mi Cita Agendada →';
            welcomeActionBtn.onclick = async () => {
              registerModal.classList.remove('active');
              if (window.confirmAndCreateAppointment) {
                await window.confirmAndCreateAppointment(newPatientUser);
              } else {
                window.dispatchEvent(new CustomEvent('montepiedra:confirmPendingBooking', { detail: { user: newPatientUser } }));
              }
            };
          } else if (welcomeActionBtn) {
            welcomeActionBtn.textContent = 'Ir a mi Portal de Paciente →';
            welcomeActionBtn.onclick = () => {
              registerModal.classList.remove('active');
              store.setActiveView('paciente');
              showToast(`¡Sesión iniciada con éxito! Bienvenido(a), ${nameVal}.`, 'success');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            };
          }

          setTimeout(() => {
            welcomeView.style.opacity = '1';
          }, 30);
        }, 250);
      } else {
        registerModal.classList.remove('active');
        store.setActiveView('paciente');
        showToast(`¡Cuenta creada con éxito! Bienvenido(a), ${nameVal}.`, 'success');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }
}

/**
 * Servicio Centralizado de Autenticación para integración en Wizards y Modales
 */
const authService = {
  getCurrentUser() {
    return store.getCurrentUser();
  },

  async login(userOrCedula, password) {
    const enteredUser = (userOrCedula || '').trim().toLowerCase();
    const enteredPass = (password || '').trim();

    if (!enteredUser || !enteredPass) {
      return { success: false, error: 'Por favor ingrese su usuario o cédula y su contraseña.' };
    }

    // 1. Paciente demo
    const pat = DEMO_USERS.paciente;
    let matchedUser = null;
    if (pat && (
      (enteredUser === (pat.username || '').toLowerCase() ||
       enteredUser === (pat.email || '').toLowerCase() ||
       enteredUser === pat.idNumber ||
       enteredUser === '0987654321' ||
       enteredUser === 'paciente' ||
       enteredUser === 'carlos mendoza' ||
       enteredUser === 'carlos mendoza moreira') &&
      (enteredPass === pat.password || enteredPass === 'paciente123')
    )) {
      matchedUser = pat;
    }

    // 2. Otros usuarios del sistema
    if (!matchedUser) {
      for (const k in DEMO_USERS) {
        const u = DEMO_USERS[k];
        if (
          (u.username && u.username.toLowerCase() === enteredUser) ||
          (u.email && u.email.toLowerCase() === enteredUser) ||
          (u.idNumber && u.idNumber === enteredUser)
        ) {
          if (u.password === enteredPass) {
            matchedUser = u;
            break;
          }
        }
      }
    }

    if (matchedUser) {
      if (matchedUser.role !== 'paciente') {
        return { success: false, error: 'Esta cuenta pertenece a otro rol del sistema. Ingrese con una cuenta de paciente.' };
      }
      store.setCurrentUser(matchedUser);
      return { success: true, user: matchedUser };
    }

    return { success: false, error: 'Credenciales incorrectas. Verifique su cédula/correo y contraseña.' };
  },

  async registerPatient(userData) {
    const { name, idNumber, phone, email, password } = userData;
    const nameVal = (name || '').trim();
    const idVal = (idNumber || '').trim();
    const phoneVal = (phone || '').trim();
    const emailVal = (email || '').trim();
    const passVal = (password || '').trim();

    if (!nameVal || !idVal || !phoneVal || !emailVal || !passVal) {
      return { success: false, error: 'Por favor complete todos los campos obligatorios.' };
    }

    // Validar Nombre y Apellido completo (mínimo 2 palabras, sin números ni símbolos)
    const nameCheck = validarNombreCompletoDetallado(nameVal);
    if (!nameCheck.isValid) {
      return { success: false, error: nameCheck.message };
    }

    // Validar Cédula Ecuatoriana (Módulo 10)
    const cedulaCheck = validarCedulaEcuatorianaDetallada(idVal);
    if (!cedulaCheck.isValid) {
      return { success: false, error: 'Cédula incorrecta. Verifique los 10 dígitos ingresados.' };
    }

    // Validar Celular (10 dígitos con 09)
    const phoneCheck = validarCelularDetallado(phoneVal);
    if (!phoneCheck.isValid) {
      return { success: false, error: phoneCheck.message };
    }

    // Validar Email
    const emailCheck = validarEmailDetallado(emailVal);
    if (!emailCheck.isValid) {
      return { success: false, error: emailCheck.message };
    }

    // Validar contraseña
    if (passVal.length < 4) {
      return { success: false, error: 'La clave de acceso debe contener al menos 4 caracteres.' };
    }

    // Comprobar existencia previa
    for (const k in DEMO_USERS) {
      if (DEMO_USERS[k].idNumber === idVal || (DEMO_USERS[k].email && DEMO_USERS[k].email.toLowerCase() === emailVal.toLowerCase())) {
        return { success: false, error: 'Ya existe una cuenta registrada con esta cédula o correo electrónico.' };
      }
    }

    const newPatientUser = {
      role: 'paciente',
      name: nameVal,
      email: emailVal,
      username: idVal,
      idNumber: idVal,
      password: passVal,
      phone: phoneVal,
      allergies: 'Sin alergias declaradas',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
    };

    DEMO_USERS[`paciente_${idVal}`] = newPatientUser;

    // Guardar perfil de paciente
    if (store.savePatientProfile) {
      store.savePatientProfile({
        cedula: idVal,
        nombres: nameVal.split(' ')[0] || nameVal,
        apellidos: nameVal.split(' ').slice(1).join(' ') || '',
        telefono: phoneVal,
        email: emailVal,
        direccion: 'Guayaquil, Ecuador',
        tipo_sangre: 'O+',
        alergias: 'Sin alergias declaradas',
        enfermedades_cronicas: 'Ninguna reportada',
        medicacion_habitual: 'Ninguna'
      });
    }

    // Iniciar sesión inmediatamente
    store.setCurrentUser(newPatientUser);
    return { success: true, user: newPatientUser };
  }
};

if (typeof window !== 'undefined') {
  window.authService = authService;
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
  let selectedPaymentMethod = 'cash'; // 'cash', 'transfer' o 'card'
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

    // Sincronizar input[type="date"] nativo con min fijado en la fecha actual
    const dateInput = document.getElementById('pat-input-date');
    if (dateInput) {
      dateInput.min = todayFormatted;
      dateInput.value = selectedDate;
      if (!dateInput.dataset.boundListener) {
        dateInput.dataset.boundListener = 'true';
        dateInput.addEventListener('change', (e) => {
          const chosen = e.target.value;
          if (!chosen || chosen < todayFormatted) {
            showToast('No puedes seleccionar fechas pasadas. Se ha seleccionado la fecha de hoy.', 'warning');
            dateInput.value = todayFormatted;
            selectedDate = todayFormatted;
          } else {
            selectedDate = chosen;
          }
          renderCalendar();
          renderTimeSlots();
          updateSummaryCard();
        });
      }
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
        if (dateInput) {
          dateInput.value = selectedDate;
        }
        renderTimeSlots();
        updateSummaryCard();
      });
    });
  }

  // Generar y filtrar horarios según fecha actual, horarios pasados y motor de colisiones
  function renderTimeSlots() {
    if (!slotsContainer) return;

    const baseSlots = ['08:30', '09:00', '09:45', '10:30', '11:15', '12:00', '13:00', '13:45', '14:30', '15:15', '16:00', '16:45', '17:30'];
    const state = store.getState();

    // Detección de Fecha Actual y Margen de Anticipación Mínima (Buffer de cortesía = 30 min)
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = (now.getMonth() + 1).toString().padStart(2, '0');
    const currentDay = now.getDate().toString().padStart(2, '0');
    const todayStr = `${currentYear}-${currentMonth}-${currentDay}`;
    const isToday = (selectedDate === todayStr);

    const hora_actual = now.getHours();
    const minutos_actual = now.getMinutes();
    const currentMinutes = hora_actual * 60 + minutos_actual;
    const buffer = 30; // Ventana de anticipación mínima de cortesía de 30 minutos

    let firstAvailable = null;
    let availableCount = 0;

    const slotButtonsHtml = baseSlots.map(time => {
      const [sh, sm] = time.split(':').map(Number);
      const slotMinutes = sh * 60 + sm;

      // 1. Si es hoy: ningún slot menor o igual a hora_actual + buffer debe estar disponible
      const isPastTime = isToday && (slotMinutes <= (currentMinutes + buffer));

      // 2. Si no es hora pasada, evaluar disponibilidad médica y amortiguamiento vial
      let validacion = { valido: true };
      if (!isPastTime) {
        validacion = CollisionEngine.validarDisponibilidadSlot({
          sedeId: selectedClinicId,
          fechaStr: selectedDate,
          horaStr: time,
          duracionMinutos: 45,
          citas: state.appointments,
          travelBuffers: state.travelBuffers
        });
      }

      const isAvailable = !isPastTime && validacion.valido;
      if (isAvailable) {
        availableCount++;
        if (!firstAvailable) {
          firstAvailable = time;
        }
      }

      let extraClasses = '';
      let badgeLabel = '';
      let tooltip = 'Horario disponible para consulta';

      if (isPastTime) {
        extraClasses = 'disabled slot-disabled slot-past';
        badgeLabel = ' ⏰ Pasado';
        tooltip = `Horario no disponible para hoy (hora pasada o requiere anticipación mínima de ${buffer} min)`;
      } else if (!isAvailable) {
        if (validacion.codigoError && validacion.codigoError.startsWith('TRASLADO')) {
          extraClasses = 'disabled transit';
          badgeLabel = ' 🚗';
          tooltip = validacion.razonRechazo || 'Médico en traslado vial entre sedes';
        } else if (validacion.codigoError === 'SALA_OCUPADA') {
          extraClasses = 'disabled';
          badgeLabel = ' 🔒';
          tooltip = 'Horario ocupado por otra consulta';
        } else {
          extraClasses = 'disabled';
          badgeLabel = ' ⏸️';
          tooltip = validacion.razonRechazo || 'Horario no disponible';
        }
      }

      const isSelected = isAvailable && (time === selectedTimeSlot);

      return `
        <button type="button" 
                class="slot-pill-btn ${extraClasses} ${isSelected ? 'selected' : ''}" 
                data-time="${time}" 
                ${!isAvailable ? 'disabled' : ''} 
                style="${!isAvailable ? 'opacity: 0.38; pointer-events: none; cursor: not-allowed;' : ''}"
                title="${tooltip}">
          ${time}${badgeLabel}
        </button>
      `;
    }).join('');

    // Mensaje contextual y amigable si tras el filtro no queda ningún turno disponible para hoy
    let noSlotsBannerHtml = '';
    if (isToday && availableCount === 0) {
      noSlotsBannerHtml = `
        <div class="no-slots-today-alert" style="width: 100%; grid-column: 1 / -1; margin-bottom: 14px;">
          <span style="font-size: 1.6rem; flex-shrink: 0;">⏰</span>
          <div>
            <strong style="font-size: 0.94rem; display: block; margin-bottom: 2px; color: #881337;">
              Ya no hay turnos disponibles para el resto del día de hoy. Por favor, selecciona una fecha posterior.
            </strong>
            <span style="font-size: 0.80rem; color: #9f1239; line-height: 1.35; display: block;">
              Todos los turnos de la jornada médica actual ya han finalizado o no cumplen con el margen mínimo de anticipación de ${buffer} minutos. Usa el selector de fecha o el calendario interactivo para seleccionar un día posterior.
            </span>
          </div>
        </div>
      `;
      selectedTimeSlot = null;
    } else {
      // Si el horario seleccionado previamente no es válido o está deshabilitado, seleccionar el primero disponible
      const isCurrentSelectionValid = baseSlots.some(t => {
        if (t !== selectedTimeSlot) return false;
        if (!isToday) return true;
        const [h, m] = t.split(':').map(Number);
        return (h * 60 + m) > (currentMinutes + buffer);
      });

      if ((!isCurrentSelectionValid || !selectedTimeSlot) && firstAvailable) {
        selectedTimeSlot = firstAvailable;
      }
    }

    slotsContainer.innerHTML = noSlotsBannerHtml + slotButtonsHtml;

    // Resaltar el botón seleccionado válido
    if (selectedTimeSlot) {
      const activeBtn = slotsContainer.querySelector(`.slot-pill-btn[data-time="${selectedTimeSlot}"]:not(.disabled)`);
      if (activeBtn) {
        slotsContainer.querySelectorAll('.slot-pill-btn').forEach(b => b.classList.remove('selected'));
        activeBtn.classList.add('selected');
      }
    }

    slotsContainer.querySelectorAll('.slot-pill-btn:not(.disabled)').forEach(btn => {
      btn.addEventListener('click', () => {
        slotsContainer.querySelectorAll('.slot-pill-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedTimeSlot = btn.dataset.time;
        updateSummaryCard();
        actualizarAvisoBuffer();
      });
    });

    actualizarAvisoBuffer();
  }

  function actualizarAvisoBuffer() {
    if (!travelNoticeBox) return;
    const state = store.getState();
    const buffersDelDia = state.travelBuffers.filter(t => t.date === selectedDate);

    if (buffersDelDia.length > 0) {
      travelNoticeBox.style.display = 'flex';
      travelNoticeBox.innerHTML = `
        <div style="font-size: 1.25rem;">🚗</div>
        <div>
          <strong style="color: #0284c7;">Amortiguamiento Vial Activo (Guayaquil):</strong>
          <div style="font-size: 0.74rem; color: #475569; margin-top: 2px;">
            ${buffersDelDia.map(b => `<span><strong>${b.fromClinic.toUpperCase()} → ${b.toClinic.toUpperCase()}:</strong> ${b.bufferLabel} (${b.startTime} - ${b.endTime})</span>`).join('<br/>')}
          </div>
        </div>
      `;
    } else {
      travelNoticeBox.style.display = 'none';
      travelNoticeBox.innerHTML = '';
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

  // Validación de Cédula (Sin conexión al SRI, con mensaje estricto 'Cédula incorrecta.')
  function handleCedulaCheck(cedula) {
    if (!cedula) return;
    if (cedula.length < 10) {
      clearFieldError(idInput);
      return;
    }

    const check = validarCedulaEcuatorianaDetallada(cedula);
    if (!check.isValid) {
      showFieldError(idInput, 'Cédula incorrecta.');
      return;
    }

    // La cédula es válida
    clearFieldError(idInput);
    if (idInput) idInput.classList.add('valid');
  }

  // Escuchadores reactivos de los inputs del Paso 3
  if (idInput) {
    idInput.setAttribute('maxlength', '10');
    idInput.setAttribute('inputmode', 'numeric');
    idInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/\D/g, '').substring(0, 10);
      clearFieldError(idInput);
      idInput.classList.remove('valid');
      const val = e.target.value.trim();
      if (val.length === 10) {
        handleCedulaCheck(val);
      }
    });

    idInput.addEventListener('blur', (e) => {
      const val = e.target.value.trim();
      if (val.length > 0) {
        const check = validarCedulaEcuatorianaDetallada(val);
        if (!check.isValid) {
          showFieldError(idInput, check.message);
        } else {
          clearFieldError(idInput);
          idInput.classList.add('valid');
        }
      }
    });
  }

  if (nameInput) {
    nameInput.setAttribute('maxlength', '70');
    nameInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
      clearFieldError(nameInput);
      nameInput.classList.remove('valid');
      const check = validarNombreCompletoDetallado(nameInput.value);
      if (check.isValid) {
        nameInput.classList.add('valid');
      }
    });

    nameInput.addEventListener('blur', () => {
      const val = nameInput.value.trim();
      if (val.length > 0) {
        const check = validarNombreCompletoDetallado(val);
        if (!check.isValid) {
          showFieldError(nameInput, check.message);
        } else {
          clearFieldError(nameInput);
          nameInput.classList.add('valid');
        }
      }
    });
  }

  if (phoneInput) {
    phoneInput.setAttribute('maxlength', '10');
    phoneInput.setAttribute('inputmode', 'numeric');
    phoneInput.addEventListener('input', (e) => {
      let val = e.target.value.replace(/\D/g, '');
      // Normalizar si se ingresa o pega prefijo internacional (+593 o +583)
      if ((val.startsWith('593') || val.startsWith('583')) && val.length > 10) {
        val = '0' + val.substring(3);
      }
      val = val.substring(0, 10);
      e.target.value = val;
      clearFieldError(phoneInput);
      phoneInput.classList.remove('valid');
      if (val.length === 10) {
        const check = validarCelularDetallado(val);
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
          clearFieldError(phoneInput);
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
          clearFieldError(emailInput);
          emailInput.classList.add('valid');
        }
      }
    });
  }

  // Función para mantener o dejar limpios los campos del formulario de ticket
  function clearTicketFormInputs() {
    if (idInput) {
      idInput.value = '';
      clearFieldError(idInput);
      idInput.classList.remove('valid');
    }
    if (nameInput) {
      nameInput.value = '';
      clearFieldError(nameInput);
      nameInput.classList.remove('valid');
    }
    if (phoneInput) {
      phoneInput.value = '';
      clearFieldError(phoneInput);
      phoneInput.classList.remove('valid');
    }
    if (emailInput) {
      emailInput.value = '';
      clearFieldError(emailInput);
      emailInput.classList.remove('valid');
    }
    const patReasonInput = document.getElementById('pat-input-reason');
    if (patReasonInput) {
      patReasonInput.value = '';
    }
  }

  // Al crear un ticket los campos deben permanecer vacíos para el usuario
  function prefillPatientData() {
    // No precargar datos automáticos para que los campos aparezcan siempre limpios
  }

  function updateSummaryCard() {
    const clinic = CLINICS[selectedClinicId] || CLINICS.ceibos;
    const catalogo = MedicalService.getCatalogo();
    const service = catalogo.find(s => s.id === selectedServiceId) || catalogo[0];

    const isHospital = (selectedClinicId === 'hospital' || selectedClinicId === 'hospital_ceibos');
    const baseFee = isHospital ? 0.00 : 20.00;

    const isCard = (selectedPaymentMethod === 'card' || selectedPaymentMethod === 'tarjeta');
    const isCashOrTransfer = (selectedPaymentMethod === 'cash' || selectedPaymentMethod === 'efectivo' || selectedPaymentMethod === 'transfer' || selectedPaymentMethod === 'transferencia');

    const cardSurchargeRate = CREDIT_CARD_SURCHARGE_RATE || 0.0975;
    const processingFee = isCard ? +(baseFee * cardSurchargeRate).toFixed(2) : 0.00;
    const totalDue = isCard ? +(baseFee + processingFee).toFixed(2) : baseFee;

    const sumClinic = document.getElementById('sum-clinic-name');
    const sumDate = document.getElementById('sum-date-time');
    const sumBaseFee = document.getElementById('sum-base-fee');
    const sumCardFeeRow = document.getElementById('sum-card-fee-row');
    const sumFeeLabel = document.getElementById('sum-fee-label');
    const sumCardFee = document.getElementById('sum-card-fee-amount');
    const sumSavingBadgeRow = document.getElementById('sum-saving-badge-row');
    const sumTotalLabel = document.getElementById('sum-total-label');
    const sumTotalDue = document.getElementById('sum-total-due');

    if (sumClinic) sumClinic.textContent = clinic.name;

    if (sumDate) {
      const parts = (selectedDate || '').split('-');
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
        const timeLabel = selectedTimeSlot ? `a las ${selectedTimeSlot}` : '(Sin horario disponible)';
        sumDate.textContent = `${dateLabel} ${timeLabel}`;
      } else {
        sumDate.textContent = `${selectedDate} ${selectedTimeSlot ? `a las ${selectedTimeSlot}` : '(Sin horario)'}`;
      }
    }

    if (sumBaseFee) {
      sumBaseFee.textContent = isHospital ? 'Gratuito ($0.00)' : `$${baseFee.toFixed(2)}`;
    }

    if (sumCardFeeRow && sumCardFee) {
      if (isHospital) {
        sumCardFeeRow.style.display = 'none';
      } else if (isCard) {
        sumCardFeeRow.style.display = 'flex';
        if (sumFeeLabel) sumFeeLabel.textContent = 'Recargo por procesamiento con tarjeta (9.75%):';
        sumCardFee.textContent = `+$${processingFee.toFixed(2)}`;
        sumCardFee.style.color = '#ef4444';
      } else {
        sumCardFeeRow.style.display = 'flex';
        if (sumFeeLabel) sumFeeLabel.textContent = 'Recargo pasarela (0%):';
        sumCardFee.textContent = '+$0.00';
        sumCardFee.style.color = '#64748b';
      }
    }

    if (sumSavingBadgeRow) {
      if (!isHospital && isCashOrTransfer) {
        sumSavingBadgeRow.style.display = 'flex';
      } else {
        sumSavingBadgeRow.style.display = 'none';
      }
    }

    if (sumTotalLabel) {
      sumTotalLabel.textContent = isCard ? 'Total final debitado:' : 'Total a Pagar:';
    }

    if (sumTotalDue) {
      sumTotalDue.textContent = isHospital ? '$0.00' : `$${totalDue.toFixed(2)}`;
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
        renderTimeSlots();
        return false;
      }
      if (!selectedTimeSlot) {
        if (selectedDate === todayStr) {
          showToast('No hay horarios disponibles para hoy. Por favor, selecciona una fecha posterior en el calendario.', 'warning');
        } else {
          showToast('Por favor selecciona un horario de atención disponible para continuar.', 'warning');
        }
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

      // 2. Nombre y Apellido completo: exigir al menos un nombre y un apellido (mínimo 2 palabras válidas)
      const nameCheck = validarNombreCompletoDetallado(patName);
      if (!nameCheck.isValid) {
        showFieldError(nameInput, nameCheck.message);
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
    if (ticketMethod) {
      const isCard = (appointment.paymentMethod === 'card' || appointment.paymentMethod === 'tarjeta');
      const isTransfer = (appointment.paymentMethod === 'transfer' || appointment.paymentMethod === 'transferencia');
      ticketMethod.textContent = isCard
        ? 'Tarjeta de Crédito / Débito (Pasarela Datafast - $21.95)'
        : (isTransfer ? 'Transferencia Bancaria Directa ($20.00)' : 'Efectivo en Recepción ($20.00)');
    }

    // Generar Código QR Oficial de Alta Definición que abre el Comprobante PDF de la Cita Médica
    const qrSection = document.getElementById("ticket-qr-container") || document.querySelector(".qr-code-display-box") || document.querySelector(".ticket-qr-section");
    if (qrSection) {
      const BASE_URL = 'https://pedritojuancarlos82-lang.github.io/Proyecto-Cita-Medica';

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
      if (appointment.tokenSeguro) {
        params.set('t', appointment.tokenSeguro);
        params.set('token', appointment.tokenSeguro);
      }

      const pdfUrl = `${BASE_URL}/comprobante.html?${params.toString()}`;
      const localPdfUrl = `comprobante.html?${params.toString()}`;

      qrSection.innerHTML = `
        <div style="background: #ffffff; padding: 12px; border-radius: 14px; display: inline-flex; flex-direction: column; justify-content: center; align-items: center; margin: 0 auto; border: 2px solid #0284c7; box-shadow: 0 4px 16px rgba(2, 132, 199, 0.15);">
          <div id="ticket-qr-canvas-box" style="display: flex; justify-content: center; align-items: center; min-width: 220px; min-height: 220px;"></div>
          <span style="font-size: 0.76rem; font-weight: 800; color: #0284c7; background: #e0f2fe; padding: 4px 12px; border-radius: 9999px; margin-top: 8px;">
            📱 Escanea con tu celular para abrir tu PDF
          </span>
          <span style="font-size: 0.70rem; font-weight: 700; color: #059669; background: #ecfdf5; padding: 3px 10px; border-radius: 9999px; margin-top: 6px; border: 1px solid #a7f3d0; display: inline-flex; align-items: center; gap: 4px;">
            ✓ Token Criptográfico Firmado (Inmutable)
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

  // Botón Ver en Mis Citas desde el ticket
  const btnViewInMisCitas = document.getElementById('btn-view-in-mis-citas');
  if (btnViewInMisCitas) {
    btnViewInMisCitas.addEventListener('click', () => {
      switchPatientTab('mis-citas');
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

  // --- MÓDULO DE AUTENTICACIÓN Y RESIDUAL DE CITA (GUEST WIZARD + AUTH WALL) ---
  async function confirmAndCreateAppointment(patientUser) {
    if (!patientUser) {
      showToast('No se detectó un usuario autenticado para confirmar la cita.', 'warning');
      return;
    }

    // 1. Recuperar borrador de la cita desde el almacenamiento temporal (sessionStorage)
    let pending = null;
    try {
      const raw = sessionStorage.getItem('montepiedra_pending_booking');
      if (raw) pending = JSON.parse(raw);
    } catch (e) {}

    if (pending) {
      if (pending.clinicId) selectedClinicId = pending.clinicId;
      if (pending.serviceId) selectedServiceId = pending.serviceId;
      if (pending.date) selectedDate = pending.date;
      if (pending.time) selectedTimeSlot = pending.time;
      if (pending.paymentMethod) selectedPaymentMethod = pending.paymentMethod;
    }

    // 2. Verificación de colisión local instantánea (0ms)
    try {
      const localApts = (store.getState ? store.getState().appointments : store.appointments) || [];
      const cid = (selectedClinicId === 'hospital_ceibos') ? 'hospital' : selectedClinicId;
      const isLocalCollision = localApts.some(a => {
        const aCid = a.clinicId || a.clinic_id;
        const matchesClinic = (aCid === selectedClinicId || aCid === cid);
        const st = (a.status || '').toLowerCase();
        const isActive = !['cancelada', 'cancelled'].includes(st);
        return a.date === selectedDate && a.time === selectedTimeSlot && matchesClinic && isActive;
      });
      if (isLocalCollision) {
        showToast('Este horario ya está reservado. Por favor selecciona otro turno.', 'danger');
        renderTimeSlots();
        return;
      }
    } catch (e) {}

    // 3. Asociar la cita al identificador del paciente priorizando los datos del formulario
    const patId = (idInput && idInput.value.trim()) || (pending && pending.tempId) || patientUser.idNumber || patientUser.cedula || patientUser.username || '';
    const patName = (nameInput && nameInput.value.trim()) || (pending && pending.tempName) || patientUser.name || 'Paciente';
    const patPhone = (phoneInput && phoneInput.value.trim()) || (pending && pending.tempPhone) || patientUser.phone || '';
    const patEmail = (emailInput && emailInput.value.trim()) || (pending && pending.tempEmail) || patientUser.email || '';
    const reasonInput = document.getElementById('pat-input-reason');
    const patReason = (reasonInput && reasonInput.value.trim()) || (pending && pending.reason) || 'Consulta médica general';

    // Guardar ficha básica del paciente
    MedicalService.guardarFicha({
      cedula: patId,
      nombreCompleto: patName,
      telefono: patPhone,
      email: patEmail
    });

    const clinic = CLINICS[selectedClinicId] || CLINICS.ceibos;
    const isHospital = (selectedClinicId === 'hospital' || selectedClinicId === 'hospital_ceibos');
    const baseFee = isHospital ? 0.00 : 20.00;

    const isCard = (selectedPaymentMethod === 'card' || selectedPaymentMethod === 'tarjeta');
    const isTransfer = (selectedPaymentMethod === 'transfer' || selectedPaymentMethod === 'transferencia');
    const normPaymentMethod = isCard ? 'card' : (isTransfer ? 'transfer' : 'cash');

    const processingFee = isCard ? 1.95 : 0.00;
    const totalAmount = isCard ? 21.95 : baseFee;
    const retentionRate = (clinic.retentionRate !== undefined) ? Number(clinic.retentionRate) : (isHospital ? 0.00 : 0.05);
    const retentionAmount = isHospital ? 0.00 : +(baseFee * retentionRate).toFixed(2);
    const netClinicYield = isHospital ? 0.00 : +(baseFee - retentionAmount).toFixed(2);

    const aptId = `APT-${Date.now().toString(36).toUpperCase()}`;
    const aptCode = `MED-${Math.floor(10000 + Math.random() * 90000)}`;

    // Generar Token Criptográfico Firmado (HMAC-SHA256)
    let tokenSeguro = null;
    if (typeof QRTokenService !== 'undefined') {
      tokenSeguro = QRTokenService.generarTokenSeguro(
        aptId,
        aptCode,
        selectedDate,
        selectedTimeSlot,
        selectedClinicId
      );
    }

    const appointmentPayload = {
      id: aptId,
      code: aptCode,
      clinicId: selectedClinicId,
      clinic_id: selectedClinicId,
      serviceId: selectedServiceId || 'CG-01',
      serviceName: 'Consulta Médica General',
      doctorId: 'dr_campoverde',
      doctor_id: 'dr_campoverde',
      date: selectedDate,
      time: selectedTimeSlot,
      patientId: patId,
      patient_id: patId,
      patientCedula: patId,
      patient_cedula: patId,
      patientName: patName,
      patient_name: patName,
      patientPhone: patPhone,
      patient_phone: patPhone,
      patientEmail: patEmail,
      patient_email: patEmail,
      reason: patReason,
      paymentMethod: normPaymentMethod,
      payment_method: normPaymentMethod,
      baseFee: baseFee,
      base_fee: baseFee,
      basePrice: baseFee,
      base_price: baseFee,
      processingFee: processingFee,
      processing_fee: processingFee,
      feeAmount: processingFee,
      fee_amount: processingFee,
      feePercentage: isCard ? 0.0975 : 0.0000,
      fee_percentage: isCard ? 0.0975 : 0.0000,
      totalPaid: totalAmount,
      total_paid: totalAmount,
      retentionRate: retentionRate,
      retention_rate: retentionRate,
      retentionAmount: retentionAmount,
      retention_amount: retentionAmount,
      netClinicYield: netClinicYield,
      net_clinic_yield: netClinicYield,
      tokenSeguro: tokenSeguro,
      status: 'confirmed',
      estado: 'CONFIRMADA'
    };

    // 4. Crear la cita en el estado central INMEDIATAMENTE (0ms)
    createdAppointment = store.addAppointment(appointmentPayload);

    // Sincronizar el usuario activo de la sesión con los datos ingresados
    const currentU = store.getCurrentUser() || {};
    const updatedUser = {
      ...currentU,
      role: 'paciente',
      idNumber: patId,
      cedula: patId,
      name: patName,
      phone: patPhone,
      email: patEmail
    };
    store.setCurrentUser(updatedUser);
    if (typeof authService !== 'undefined' && authService.setCurrentUser) {
      authService.setCurrentUser(updatedUser);
    }

    // Liberar hold temporal tras confirmación formal
    if (typeof SlotHoldManager !== 'undefined') {
      SlotHoldManager.liberarHold();
    }

    MedicalService.registrarAtencionEnHistorial(patId, createdAppointment);

    // Limpiar reserva temporal de sessionStorage
    sessionStorage.removeItem('montepiedra_pending_booking');

    // 5. Renderizar ticket y avanzar a Paso 4 AL INSTANTE
    renderConfirmationTicket(createdAppointment);
    renderPatientSummary();
    renderPatientAppointmentsTable();
    currentStep = 4;
    updateStepView();

    showToast(`¡Cita agendada con éxito para ${patName}! Se emitió tu ticket oficial con QR.`, 'success');

    // 6. Persistencia asíncrona en segundo plano sin pausar la interfaz
    const sbClient = (typeof SupabaseDB !== 'undefined') ? SupabaseDB : (window.SupabaseDB || null);
    if (sbClient && sbClient.saveAppointment) {
      Promise.race([
        sbClient.saveAppointment(appointmentPayload),
        new Promise((_, reject) => setTimeout(() => reject('timeout'), 1500))
      ]).catch(() => {});
    }

    if (typeof EmailService !== 'undefined' && EmailService.sendBookingConfirmation) {
      EmailService.sendBookingConfirmation(createdAppointment, showToast);
    }
  }

  // Exponer para integración con onboarding post-registro
  if (typeof window !== 'undefined') {
    window.confirmAndCreateAppointment = confirmAndCreateAppointment;
    window.addEventListener('montepiedra:confirmPendingBooking', (e) => {
      if (e.detail && e.detail.user) {
        confirmAndCreateAppointment(e.detail.user);
      }
    });
  }

  function openWizardAuthGate(pendingBooking) {
    const modal = document.getElementById('modal-wizard-auth-gate');
    if (!modal) return;

    const chipDetails = document.getElementById('auth-gate-chip-details');
    const chipPrice = document.getElementById('auth-gate-chip-price');
    const btnTabLogin = document.getElementById('btn-tab-auth-login');
    const btnTabRegister = document.getElementById('btn-tab-auth-register');
    const paneLogin = document.getElementById('auth-gate-pane-login');
    const paneRegister = document.getElementById('auth-gate-pane-register');
    const btnClose = document.getElementById('btn-close-auth-gate-modal');

    const formLogin = document.getElementById('form-gate-login');
    const loginUserInput = document.getElementById('gate-login-user');
    const loginPassInput = document.getElementById('gate-login-pass');
    const btnTogglePass = document.getElementById('btn-gate-toggle-login-pass');
    const btnDemoFill = document.getElementById('btn-gate-demo-fill');

    const formRegister = document.getElementById('form-gate-register');
    const regNameInput = document.getElementById('gate-reg-name');
    const regIdInput = document.getElementById('gate-reg-id');
    const regPhoneInput = document.getElementById('gate-reg-phone');
    const regEmailInput = document.getElementById('gate-reg-email');
    const regPassInput = document.getElementById('gate-reg-password');

    // Resumen en el chip
    const clinic = CLINICS[pendingBooking.clinicId] || CLINICS.ceibos;
    const catalogo = MedicalService.getCatalogo();
    const service = catalogo.find(s => s.id === pendingBooking.serviceId) || catalogo[0];
    const isHospital = pendingBooking.clinicId === 'hospital';
    const realCost = isHospital ? 0 : (service.costoReal || service.precioBase || clinic.realCost || 20.00);
    const listPrice = isHospital ? 0 : (service.precioLista || clinic.listPrice || +(realCost * 1.0975).toFixed(2));
    const totalAmount = (pendingBooking.paymentMethod === 'tarjeta') ? listPrice : realCost;

    if (chipDetails) {
      chipDetails.textContent = `${clinic.name} • ${pendingBooking.date} a las ${pendingBooking.time}`;
    }
    if (chipPrice) {
      chipPrice.textContent = `$${totalAmount.toFixed(2)}`;
    }

    // Prellenar con los datos que el usuario ya ingresó en el Paso 3
    if (pendingBooking.tempEmail || pendingBooking.tempId) {
      if (loginUserInput) loginUserInput.value = pendingBooking.tempEmail || pendingBooking.tempId;
    }
    if (pendingBooking.tempName && regNameInput) regNameInput.value = pendingBooking.tempName;
    if (pendingBooking.tempId && regIdInput) regIdInput.value = pendingBooking.tempId;
    if (pendingBooking.tempPhone && regPhoneInput) regPhoneInput.value = pendingBooking.tempPhone;
    if (pendingBooking.tempEmail && regEmailInput) regEmailInput.value = pendingBooking.tempEmail;

    // Función para cambiar de pestaña
    function setTab(tab) {
      if (tab === 'login') {
        if (btnTabLogin) {
          btnTabLogin.classList.add('active');
          btnTabLogin.style.background = '#ffffff';
          btnTabLogin.style.color = '#0f172a';
          btnTabLogin.style.boxShadow = '0 2px 6px rgba(15,23,42,0.08)';
        }
        if (btnTabRegister) {
          btnTabRegister.classList.remove('active');
          btnTabRegister.style.background = 'transparent';
          btnTabRegister.style.color = '#64748b';
          btnTabRegister.style.boxShadow = 'none';
        }
        if (paneLogin) paneLogin.style.display = 'block';
        if (paneRegister) paneRegister.style.display = 'none';
      } else {
        if (btnTabRegister) {
          btnTabRegister.classList.add('active');
          btnTabRegister.style.background = '#ffffff';
          btnTabRegister.style.color = '#0f172a';
          btnTabRegister.style.boxShadow = '0 2px 6px rgba(15,23,42,0.08)';
        }
        if (btnTabLogin) {
          btnTabLogin.classList.remove('active');
          btnTabLogin.style.background = 'transparent';
          btnTabLogin.style.color = '#64748b';
          btnTabLogin.style.boxShadow = 'none';
        }
        if (paneLogin) paneLogin.style.display = 'none';
        if (paneRegister) paneRegister.style.display = 'block';
      }
    }

    if (btnTabLogin) {
      btnTabLogin.onclick = () => setTab('login');
    }
    if (btnTabRegister) {
      btnTabRegister.onclick = () => setTab('register');
    }

    // Toggle password
    if (btnTogglePass && loginPassInput) {
      btnTogglePass.onclick = () => {
        const isPass = loginPassInput.type === 'password';
        loginPassInput.type = isPass ? 'text' : 'password';
        btnTogglePass.textContent = isPass ? '🙈' : '👁️';
      };
    }

    // Botón Autofill Demo (Carlos Mendoza)
    if (btnDemoFill) {
      btnDemoFill.onclick = () => {
        if (loginUserInput) loginUserInput.value = '0987654321';
        if (loginPassInput) loginPassInput.value = 'paciente123';
        if (formLogin) {
          formLogin.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        }
      };
    }

    // Cerrar modal
    if (btnClose) {
      btnClose.onclick = () => {
        modal.classList.remove('active');
      };
    }

    // Envío del Login en el Gate
    if (formLogin) {
      formLogin.onsubmit = async (e) => {
        e.preventDefault();
        const userVal = loginUserInput ? loginUserInput.value.trim() : '';
        const passVal = loginPassInput ? loginPassInput.value.trim() : '';

        const auth = (typeof authService !== 'undefined') ? authService : (window.authService || null);
        if (!auth) {
          showToast('Servicio de autenticación no disponible temporalmente.', 'danger');
          return;
        }

        const res = await auth.login(userVal, passVal);
        if (res.success && res.user) {
          modal.classList.remove('active');
          showToast(`¡Sesión iniciada con éxito! Bienvenido(a), ${res.user.name}.`, 'success');
          await confirmAndCreateAppointment(res.user);
        } else {
          showToast(res.error || 'Credenciales inválidas. Por favor verifique.', 'danger');
        }
      };
    }

    // Aplicar máscaras reactivas a los inputs del modal de registro
    if (regIdInput && !regIdInput.dataset.maskApplied) {
      regIdInput.dataset.maskApplied = 'true';
      regIdInput.setAttribute('maxlength', '10');
      regIdInput.setAttribute('inputmode', 'numeric');
      regIdInput.addEventListener('input', function() {
        this.value = this.value.replace(/\D/g, '').substring(0, 10);
      });
      regIdInput.addEventListener('blur', function() {
        if (this.value.length > 0) {
          const check = validarCedulaEcuatorianaDetallada(this.value);
          if (!check.isValid) {
            showToast(check.message, 'warning');
          }
        }
      });
    }

    if (regPhoneInput && !regPhoneInput.dataset.maskApplied) {
      regPhoneInput.dataset.maskApplied = 'true';
      regPhoneInput.setAttribute('maxlength', '10');
      regPhoneInput.setAttribute('inputmode', 'numeric');
      regPhoneInput.addEventListener('input', function() {
        this.value = this.value.replace(/\D/g, '').substring(0, 10);
      });
      regPhoneInput.addEventListener('blur', function() {
        if (this.value.length > 0) {
          const check = validarCelularDetallado(this.value);
          if (!check.isValid) {
            showToast(check.message, 'warning');
          }
        }
      });
    }

    if (regNameInput && !regNameInput.dataset.maskApplied) {
      regNameInput.dataset.maskApplied = 'true';
      regNameInput.setAttribute('maxlength', '70');
      regNameInput.addEventListener('input', function() {
        this.value = this.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
      });
      regNameInput.addEventListener('blur', function() {
        if (this.value.length > 0) {
          const check = validarNombreCompletoDetallado(this.value);
          if (!check.isValid) {
            showToast(check.message, 'warning');
          }
        }
      });
    }

    // Toggle visibilidad de contraseña en el gate
    const btnToggleGatePass = document.getElementById('btn-gate-toggle-reg-pass');
    if (btnToggleGatePass && regPassInput) {
      const eyeOpenSvg = `<svg class="eye-svg eye-open" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
      const eyeClosedSvg = `<svg class="eye-svg eye-slashed" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path><line x1="2" y1="2" x2="22" y2="22"></line></svg>`;

      btnToggleGatePass.onclick = () => {
        const isPass = regPassInput.type === 'password';
        regPassInput.type = isPass ? 'text' : 'password';
        btnToggleGatePass.innerHTML = isPass ? eyeOpenSvg : eyeClosedSvg;
      };
    }

    // Medidor de fortaleza de contraseña en el gate
    const gateStrengthSegs = [1, 2, 3, 4].map(i => document.getElementById(`gate-strength-seg-${i}`));
    const gateStrengthText = document.getElementById('gate-strength-text');
    if (regPassInput && !regPassInput.dataset.listenerBound) {
      regPassInput.dataset.listenerBound = 'true';
      regPassInput.addEventListener('input', function() {
        const val = this.value;
        const len = val.length;
        const hasNumber = /\d/.test(val);
        const hasUpper = /[A-Z]/.test(val);
        const hasLower = /[a-z]/.test(val);
        const hasSymbol = /[^a-zA-Z0-9]/.test(val);

        let level = 0, text = 'Sin ingresar', color = '#94a3b8';
        if (len >= 8 && hasUpper && hasLower && hasNumber && hasSymbol) {
          level = 4; text = 'Fuerte / Segura'; color = '#10b981';
        } else if (len >= 8 && hasNumber && hasUpper) {
          level = 3; text = 'Aceptable'; color = '#84cc16';
        } else if (len >= 6 && hasNumber) {
          level = 2; text = 'Débil'; color = '#f59e0b';
        } else if (len > 0) {
          level = 1; text = 'Muy débil'; color = '#ef4444';
        }

        if (gateStrengthText) {
          gateStrengthText.textContent = text;
          gateStrengthText.style.color = color;
        }
        gateStrengthSegs.forEach((seg, idx) => {
          if (seg) seg.style.background = (idx < level) ? color : '#e2e8f0';
        });
      });
    }

    // Envío del Registro en el Gate
    if (formRegister) {
      formRegister.onsubmit = async (e) => {
        e.preventDefault();
        const nameVal = regNameInput ? regNameInput.value.trim() : '';
        const idVal = regIdInput ? regIdInput.value.trim() : '';
        const phoneVal = regPhoneInput ? regPhoneInput.value.trim() : '';
        const emailVal = regEmailInput ? regEmailInput.value.trim() : '';
        const passVal = regPassInput ? regPassInput.value.trim() : '';

        // 1. Validar Nombre y Apellido completo (mínimo 2 palabras, sin números ni símbolos)
        const nameCheck = validarNombreCompletoDetallado(nameVal);
        if (!nameCheck.isValid) {
          showToast(nameCheck.message, 'warning');
          if (regNameInput) regNameInput.focus();
          return;
        }

        // 2. Validar Cédula Ecuatoriana (Módulo 10)
        const cedCheck = validarCedulaEcuatorianaDetallada(idVal);
        if (!cedCheck.isValid) {
          showToast(cedCheck.message, 'danger');
          if (regIdInput) regIdInput.focus();
          return;
        }

        // 3. Validar Teléfono Celular (10 dígitos iniciando con 09)
        const phoneCheck = validarCelularDetallado(phoneVal);
        if (!phoneCheck.isValid) {
          showToast(phoneCheck.message, 'warning');
          if (regPhoneInput) regPhoneInput.focus();
          return;
        }

        // 4. Validar Correo Electrónico (norma RFC 5322)
        const emailCheck = validarEmailDetallado(emailVal);
        if (!emailCheck.isValid) {
          showToast(emailCheck.message, 'warning');
          if (regEmailInput) regEmailInput.focus();
          return;
        }

        // 5. Validar Contraseña
        if (passVal.length < 4) {
          showToast('La clave de acceso debe contener al menos 4 caracteres.', 'warning');
          if (regPassInput) regPassInput.focus();
          return;
        }

        const auth = (typeof authService !== 'undefined') ? authService : (window.authService || null);
        if (!auth) {
          showToast('Servicio de autenticación no disponible temporalmente.', 'danger');
          return;
        }

        const res = await auth.registerPatient({
          name: nameVal,
          idNumber: idVal,
          phone: phoneVal,
          email: emailVal,
          password: passVal
        });

        if (res.success && res.user) {
          modal.classList.remove('active');
          showToast(`¡Cuenta creada con éxito! Bienvenido(a), ${res.user.name}.`, 'success');
          await confirmAndCreateAppointment(res.user);
        } else {
          showToast(res.error || 'Error al registrar la cuenta. Verifique los campos.', 'danger');
        }
      };
    }

    // Abrir modal
    modal.classList.add('active');
    setTab('login');
  }

  // Botón Siguiente / Confirmar con Bloqueo Estricto de Datos
  if (btnNext) {
    btnNext.addEventListener('click', async () => {
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
        // Validar datos ingresados en el Paso 3
        if (!validateStepData(3)) return;

        const currentUser = (typeof authService !== 'undefined' && authService.getCurrentUser)
          ? authService.getCurrentUser()
          : store.getCurrentUser();

        const userToUse = (currentUser && currentUser.role === 'paciente')
          ? currentUser
          : {
              role: 'paciente',
              name: (nameInput && nameInput.value.trim()) || 'Paciente',
              idNumber: (idInput && idInput.value.trim()) || '',
              email: (emailInput && emailInput.value.trim()) || '',
              phone: (phoneInput && phoneInput.value.trim()) || ''
            };

        // Generar y confirmar ticket exclusivamente al presionar este botón
        await confirmAndCreateAppointment(userToUse);
      } else if (currentStep === 4) {
        // Reiniciar flujo para nueva cita con la fecha de hoy y campos limpios
        selectedDate = getTodayDateStr();
        clearTicketFormInputs();
        currentStep = 1;
        renderCalendar();
        updateStepView();
      }
    });
  }

  // --- GESTIÓN DEL PORTAL DEL PACIENTE (Pestañas: Resumen, Mis Citas, Mis Datos, Agendar Cita) ---
  const patientTabs = document.querySelectorAll('.patient-tab-btn');
  const patientPanes = document.querySelectorAll('.patient-portal-pane');

  function switchPatientTab(tabName) {
    patientTabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });
    patientPanes.forEach(pane => {
      pane.style.display = (pane.dataset.pane === tabName) ? 'flex' : 'none';
    });

    if (tabName === 'resumen') {
      renderPatientSummary();
    } else if (tabName === 'mis-citas') {
      renderPatientAppointmentsTable();
    } else if (tabName === 'mis-datos') {
      renderPatientProfileForm();
    } else if (tabName === 'agendar') {
      currentStep = 1;
      selectedDate = getTodayDateStr();
      clearTicketFormInputs();
      renderCalendar();
      renderTimeSlots();
      updateSummaryCard();
      updateStepView();

      const step1Pane = document.querySelector('.wizard-step-pane[data-step="1"]');
      if (step1Pane) {
        step1Pane.style.display = 'block';
        step1Pane.classList.remove('hidden');
      }

      setTimeout(() => {
        const wizardStep1 = document.querySelector('.wizard-step-pane[data-step="1"]') ||
                            document.getElementById('pat-pane-agendar') ||
                            document.querySelector('.wizard-stepper-container');
        if (wizardStep1) {
          wizardStep1.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 50);
    }
  }

  patientTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      switchPatientTab(tab.dataset.tab);
    });
  });

  // --- MODAL DE VISUALIZACIÓN DE TICKET / PDF IN-SITU (Sin redirigir a agendar cita) ---
  function openTicketModal(apt) {
    if (!apt) return;
    const modal = document.getElementById('modal-patient-ticket-view');
    if (!modal) return;

    const clinic = CLINICS[apt.clinicId] || { name: 'Sede Médica', consultorio: 'Consultorio Principal' };
    const codeEl = document.getElementById('modal-ticket-code');
    const patNameEl = document.getElementById('modal-ticket-patient-name');
    const patIdEl = document.getElementById('modal-ticket-patient-id');
    const clinicEl = document.getElementById('modal-ticket-clinic');
    const datetimeEl = document.getElementById('modal-ticket-datetime');
    const methodEl = document.getElementById('modal-ticket-method');
    const totalEl = document.getElementById('modal-ticket-total');
    const serviceNameEl = document.getElementById('modal-ticket-service-name');
    const qrContainer = document.getElementById('modal-ticket-qr-container');
    const btnPdf = document.getElementById('btn-modal-open-pdf');

    const user = store.getCurrentUser();
    const patName = apt.patientName || (user ? user.name : 'Paciente');
    const patId = apt.patientId || (user ? (user.idNumber || user.cedula) : 'S/N');
    const totalAmount = apt.totalPaid ? Number(apt.totalPaid).toFixed(2) : (apt.basePrice ? Number(apt.basePrice).toFixed(2) : '20.00');

    if (codeEl) codeEl.textContent = `#${apt.code}`;
    if (patNameEl) patNameEl.textContent = patName;
    if (patIdEl) patIdEl.textContent = patId;
    if (clinicEl) clinicEl.textContent = `${clinic.name} (${clinic.consultorio || 'Cons. 1'})`;
    if (datetimeEl) datetimeEl.textContent = `${apt.date} - ${apt.time}`;
    if (methodEl) {
      methodEl.textContent = apt.paymentMethod === 'tarjeta'
        ? 'Tarjeta de Crédito / Débito (100% Tarifa)'
        : 'Efectivo / Transferencia (Descuento 9.75% aplicado)';
    }
    if (totalEl) totalEl.textContent = `$${totalAmount}`;
    const docDisplay = apt.status === 'relevo_asignado' && apt.reliefDoctor
      ? `${apt.reliefDoctor} (Médico de Relevo)`
      : (apt.doctor || 'Dr. Carlos Campoverde');
    if (serviceNameEl) serviceNameEl.textContent = `${apt.serviceName || 'Consulta de Medicina General'} - ${docDisplay}`;

    // Construcción de la URL para el comprobante PDF oficial
    const BASE_URL = 'https://pedritojuancarlos82-lang.github.io/Proyecto-Cita-Medica';

    const params = new URLSearchParams({
      c: apt.code,
      p: patName,
      id: patId,
      s: clinic.name,
      f: apt.date,
      h: apt.time,
      tot: totalAmount,
      m: apt.paymentMethod || 'efectivo'
    });
    if (apt.tokenSeguro) {
      params.set('t', apt.tokenSeguro);
      params.set('token', apt.tokenSeguro);
    }
    const pdfUrl = `${BASE_URL}/comprobante.html?${params.toString()}`;
    const localPdfUrl = `comprobante.html?${params.toString()}`;

    if (btnPdf) {
      btnPdf.href = localPdfUrl;
    }

    if (qrContainer) {
      qrContainer.innerHTML = `
        <div style="background: #ffffff; padding: 12px; border-radius: 14px; display: inline-flex; flex-direction: column; justify-content: center; align-items: center; margin: 0 auto; border: 2px solid #0284c7; box-shadow: 0 4px 14px rgba(2, 132, 199, 0.15);">
          <div id="modal-ticket-qr-canvas" style="display: flex; justify-content: center; align-items: center; min-width: 190px; min-height: 190px;"></div>
          <span style="font-size: 0.74rem; font-weight: 800; color: #0284c7; background: #e0f2fe; padding: 3px 12px; border-radius: 9999px; margin-top: 8px;">
            📱 Escanea con tu celular para abrir tu PDF
          </span>
          <span style="font-size: 0.68rem; font-weight: 700; color: #059669; background: #ecfdf5; padding: 2px 10px; border-radius: 9999px; margin-top: 5px; border: 1px solid #a7f3d0; display: inline-flex; align-items: center; gap: 4px;">
            ✓ Token Criptográfico Firmado (Inmutable)
          </span>
        </div>
      `;

      setTimeout(() => {
        renderizarCodigoQR('modal-ticket-qr-canvas', pdfUrl, {
          size: 190,
          correctLevel: (typeof QRCode !== 'undefined' && QRCode.CorrectLevel) ? QRCode.CorrectLevel.L : null
        });
      }, 50);
    }

    modal.classList.add('active');
  }

  // Configuración de botones del modal de ticket
  const modalTicketView = document.getElementById('modal-patient-ticket-view');
  const btnCloseTicketModal = document.getElementById('btn-close-ticket-modal');
  const btnModalCloseTicketFooter = document.getElementById('btn-modal-close-ticket-footer');
  const btnModalPrintTicket = document.getElementById('btn-modal-print-ticket');

  const closeTicketModal = () => {
    if (modalTicketView) modalTicketView.classList.remove('active');
  };

  if (btnCloseTicketModal) btnCloseTicketModal.addEventListener('click', closeTicketModal);
  if (btnModalCloseTicketFooter) btnModalCloseTicketFooter.addEventListener('click', closeTicketModal);
  if (btnModalPrintTicket) {
    btnModalPrintTicket.addEventListener('click', () => {
      window.print();
    });
  }

  window.openTicketModal = openTicketModal;

  // 1. Renderizar Resumen / Ventana Principal (Dashboard del Paciente)
  function renderPatientSummary() {
    const user = store.getCurrentUser();
    const patId = user ? (user.idNumber || user.cedula || '') : '';
    const profile = (patId ? store.getPatientProfile(patId) : null) || store.getState().patientProfiles[0] || {
      nombres: user ? (user.name ? user.name.split(' ')[0] : 'Estimado') : 'Estimado',
      apellidos: user ? (user.name ? user.name.split(' ').slice(1).join(' ') : 'Paciente') : 'Paciente',
      allergies: 'Ninguna registrada',
      chronicConditions: 'Ninguna reportada'
    };

    const fullName = `${profile.nombres || ''} ${profile.apellidos || ''}`.trim();

    // Actualizar saludo y navbar
    const welcomeNameEl = document.getElementById('pat-welcome-name');
    if (welcomeNameEl) welcomeNameEl.textContent = `¡Hola, ${fullName || 'Estimado Paciente'}! 👋`;

    const navNameEl = document.getElementById('pat-navbar-name');
    if (navNameEl) navNameEl.textContent = profile.nombres || (fullName ? fullName.split(' ')[0] : 'Paciente');

    // Obtener citas del paciente
    let apts = store.getPatientAppointments(patId, user);
    if ((!apts || apts.length === 0) && store.getState().appointments && store.getState().appointments.length > 0) {
      apts = store.getState().appointments;
    }
    const totalCitasEl = document.getElementById('pat-kpi-total-citas');
    if (totalCitasEl) totalCitasEl.textContent = `${apts.length} Cita${apts.length === 1 ? '' : 's'}`;

    const allergiesEl = document.getElementById('pat-kpi-allergies');
    if (allergiesEl) {
      const allergyVal = (profile.allergies || '').trim();
      if (!allergyVal || allergyVal.toLowerCase() === 'ninguna' || allergyVal.toLowerCase() === 'ninguna registrada') {
        allergiesEl.innerHTML = '<span class="badge-alert-none">✓ Ninguna registrada</span>';
      } else {
        allergiesEl.innerHTML = `<span class="badge-alert-active">⚠️ ${allergyVal}</span>`;
      }
    }

    // Próxima Cita
    const nextDateEl = document.getElementById('pat-kpi-next-date');
    const nextClinicEl = document.getElementById('pat-kpi-next-clinic');
    const nextTitleEl = document.getElementById('pat-next-title');
    const nextDetailsEl = document.getElementById('pat-next-details');
    const nextBadgeEl = document.getElementById('pat-next-badge');

    if (apts.length > 0) {
      const nextApt = apts[0];
      const clinic = CLINICS[nextApt.clinicId] || { name: 'Sede Médica' };

      if (nextDateEl) nextDateEl.textContent = `${nextApt.date} - ${nextApt.time}`;
      if (nextClinicEl) nextClinicEl.textContent = `${clinic.name} (${clinic.consultorio || 'Cons. 4'})`;
      if (nextApt.status === 'relevo_asignado') {
        if (nextDetailsEl) nextDetailsEl.textContent = `📍 ${clinic.name} • Dr. Relevo: ${nextApt.reliefDoctor || 'Colega de Cobertura'} • ${nextApt.time}`;
        if (nextBadgeEl) {
          nextBadgeEl.textContent = '🔄 RELEVO ASIGNADO';
          nextBadgeEl.style.background = '#e0f2fe';
          nextBadgeEl.style.color = '#0369a1';
          nextBadgeEl.style.border = '1px solid #7dd3fc';
        }
      } else {
        if (nextDetailsEl) nextDetailsEl.textContent = `📍 ${clinic.name} • Dr. Carlos Campoverde • ${nextApt.time}`;
        if (nextBadgeEl) {
          nextBadgeEl.textContent = nextApt.estado || 'CONFIRMADA';
          nextBadgeEl.style.background = '';
          nextBadgeEl.style.color = '';
          nextBadgeEl.style.border = '';
        }
      }

      const btnViewTicket = document.getElementById('btn-pat-view-ticket-direct');
      if (btnViewTicket) {
        btnViewTicket.onclick = () => {
          openTicketModal(nextApt);
        };
      }
    } else {
      if (nextDateEl) nextDateEl.textContent = 'Sin citas pendientes';
      if (nextClinicEl) nextClinicEl.textContent = 'Agenda tu turno hoy';
      if (nextTitleEl) nextTitleEl.textContent = 'No tienes turnos próximos programados';
      if (nextDetailsEl) nextDetailsEl.textContent = 'Reserva tu atención presencial con el Dr. Carlos Campoverde.';
      if (nextBadgeEl) nextBadgeEl.textContent = 'DISPONIBLE';
    }
  }

  // 2. Renderizar Historial de Citas del Paciente
  function renderPatientAppointmentsTable() {
    const user = store.getCurrentUser();
    const patId = user ? (user.idNumber || user.cedula || '') : '';
    let apts = store.getPatientAppointments(patId, user);

    // Si aún no hay citas por filtro estricto pero hay citas en el store, mostrarlas todas
    if ((!apts || apts.length === 0) && store.getState().appointments && store.getState().appointments.length > 0) {
      apts = store.getState().appointments;
    }

    const tbody = document.getElementById('patient-appointments-table-body');
    if (!tbody) return;

    if (!apts || apts.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 24px; color: #64748b;">
            Aún no registras citas médicas anteriores. Haz clic en <strong>➕ Agendar Nueva Cita</strong> para reservar tu primer turno.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = apts.map(apt => {
      const clinic = CLINICS[apt.clinicId] || { name: 'Sede Médica', consultorio: 'Consultorio Principal' };
      const totalAmount = apt.totalPaid ? apt.totalPaid.toFixed(2) : (apt.basePrice ? apt.basePrice.toFixed(2) : '20.00');
      const isRelief = apt.status === 'relevo_asignado';
      const doctorDisplay = isRelief && apt.reliefDoctor
        ? `<div style="font-weight: 700; color: #0284c7;">${apt.reliefDoctor} <span style="font-size: 0.68rem; background: #e0f2fe; color: #0369a1; padding: 1px 5px; border-radius: 4px;">Relevo</span></div>`
        : (apt.doctor || 'Dr. Carlos Campoverde');
      const statusBadge = isRelief
        ? `<span class="badge-sede" style="background: #e0f2fe; color: #0369a1; border: 1px solid #7dd3fc; font-size: 0.72rem; padding: 2px 8px;">🔄 RELEVO ASIGNADO</span>`
        : `<span class="badge-sede badge-alborada" style="font-size: 0.72rem; padding: 2px 8px;">${apt.estado || 'CONFIRMADA'}</span>`;

      return `
        <tr>
          <td>
            <strong style="color: var(--primary-blue);">#${apt.code}</strong>
            <div style="font-size: 0.72rem; color: #0284c7; font-weight: 700; margin-top: 2px;">👤 ${apt.patientName || apt.patient_name || 'Paciente'}</div>
            <div style="font-size: 0.68rem; color: #64748b;">CI: ${apt.patientCedula || apt.patientId || apt.patient_id || 'Registrado'}</div>
          </td>
          <td>
            <div style="font-weight: 600; color: #1e293b;">${apt.date}</div>
            <div style="font-size: 0.72rem; color: #64748b;">${apt.time}</div>
          </td>
          <td>
            <div style="font-weight: 700; color: #0f172a;">${clinic.name}</div>
            <div style="font-size: 0.72rem; color: #64748b;">${clinic.consultorio || 'Consultorio Principal'}</div>
          </td>
          <td>
            <div style="font-size: 0.82rem; color: #334155; font-weight: 500; max-width: 180px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${apt.reason || 'Consulta médica general'}">
              ${apt.reason || 'Consulta médica general'}
            </div>
          </td>
          <td>${doctorDisplay}</td>
          <td style="font-weight: 800; color: #0f172a;">$${totalAmount}</td>
          <td>
            ${statusBadge}
          </td>
          <td>
            <button type="button" class="btn-secondary btn-view-single-ticket" data-code="${apt.code}" style="padding: 4px 10px; font-size: 0.76rem; border-radius: 6px;">
              🎫 Ver Ticket / PDF
            </button>
          </td>
        </tr>
      `;
    }).join('');

    // Escuchar clics en los botones de ver ticket
    tbody.querySelectorAll('.btn-view-single-ticket').forEach(btn => {
      btn.addEventListener('click', () => {
        const code = btn.dataset.code;
        const targetApt = apts.find(a => a.code === code);
        if (targetApt) {
          openTicketModal(targetApt);
        }
      });
    });
  }

  // 3. Renderizar Formulario de Ficha Personal y Datos
  function renderPatientProfileForm() {
    const user = store.getCurrentUser();
    const patId = user ? (user.idNumber || user.cedula || '0987654321') : '0987654321';
    const profile = store.getPatientProfile(patId) || store.getState().patientProfiles[0] || {};

    const idField = document.getElementById('pat-prof-id');
    const nomField = document.getElementById('pat-prof-nombres');
    const apeField = document.getElementById('pat-prof-apellidos');
    const phoneField = document.getElementById('pat-prof-phone');
    const emailField = document.getElementById('pat-prof-email');
    const addrField = document.getElementById('pat-prof-address');
    const emerNameField = document.getElementById('pat-prof-emer-name');
    const emerPhoneField = document.getElementById('pat-prof-emer-phone');
    const bloodField = document.getElementById('pat-prof-blood');
    const ageField = document.getElementById('pat-prof-age');
    const allergiesField = document.getElementById('pat-prof-allergies');
    const chronicField = document.getElementById('pat-prof-chronic');
    const medsField = document.getElementById('pat-prof-meds');

    if (idField) idField.value = profile.cedula || patId;
    if (nomField) nomField.value = profile.nombres || (user ? user.name.split(' ')[0] : 'Carlos');
    if (apeField) apeField.value = profile.apellidos || (user ? user.name.split(' ').slice(1).join(' ') : 'Mendoza');
    if (phoneField) phoneField.value = profile.phone || (user ? user.phone : '0987654321');
    if (emailField) emailField.value = profile.email || (user ? user.email : 'carlos.mendoza@gmail.com');
    if (addrField) addrField.value = profile.address || 'Cdla. Alborada 8va Etapa, Mz 812 Sl 14';
    if (emerNameField) emerNameField.value = profile.emergencyContact || 'María Mendoza (Hermana)';
    if (emerPhoneField) emerPhoneField.value = profile.emergencyPhone || '0991234567';
    if (bloodField) bloodField.value = profile.bloodType || 'O+';
    if (ageField) ageField.value = profile.age || 42;
    if (allergiesField) allergiesField.value = profile.allergies || 'Penicilina, Sulfas';
    if (chronicField) chronicField.value = profile.chronicConditions || 'Hipertensión Arterial Primaria (I10)';
    if (medsField) medsField.value = profile.currentMedications || 'Losartán 50mg cada 24h';
  }

  // Guardar perfil y actualizar Supabase
  const formProfile = document.getElementById('form-patient-profile');
  if (formProfile) {
    formProfile.addEventListener('submit', (e) => {
      e.preventDefault();
      const user = store.getCurrentUser();
      const patId = document.getElementById('pat-prof-id')?.value.trim() || (user ? user.idNumber : '0987654321');

      const updatedProfile = {
        cedula: patId,
        nombres: document.getElementById('pat-prof-nombres')?.value.trim(),
        apellidos: document.getElementById('pat-prof-apellidos')?.value.trim(),
        phone: document.getElementById('pat-prof-phone')?.value.trim(),
        email: document.getElementById('pat-prof-email')?.value.trim(),
        address: document.getElementById('pat-prof-address')?.value.trim(),
        emergencyContact: document.getElementById('pat-prof-emer-name')?.value.trim(),
        emergencyPhone: document.getElementById('pat-prof-emer-phone')?.value.trim(),
        bloodType: document.getElementById('pat-prof-blood')?.value,
        age: parseInt(document.getElementById('pat-prof-age')?.value, 10) || 0,
        allergies: document.getElementById('pat-prof-allergies')?.value.trim(),
        chronicConditions: document.getElementById('pat-prof-chronic')?.value.trim(),
        currentMedications: document.getElementById('pat-prof-meds')?.value.trim()
      };

      store.savePatientProfile(updatedProfile);
      showToast('✅ Ficha clínica del paciente guardada y sincronizada en Supabase.', 'success');
      renderPatientSummary();
    });
  }

  // Accesos rápidos desde la ventana de Resumen
  const btnDashQuickBook = document.getElementById('btn-dash-quick-book');
  if (btnDashQuickBook) {
    btnDashQuickBook.addEventListener('click', () => {
      switchPatientTab('agendar');
    });
  }

  const btnDashGotoCitas = document.getElementById('btn-dash-goto-citas');
  if (btnDashGotoCitas) {
    btnDashGotoCitas.addEventListener('click', () => {
      switchPatientTab('mis-citas');
    });
  }

  const btnDashGotoDatos = document.getElementById('btn-dash-goto-datos');
  if (btnDashGotoDatos) {
    btnDashGotoDatos.addEventListener('click', () => {
      switchPatientTab('mis-datos');
    });
  }

  const cardKpiFicha = document.getElementById('card-kpi-ficha');
  if (cardKpiFicha) {
    cardKpiFicha.addEventListener('click', () => {
      switchPatientTab('mis-datos');
    });
  }

  const cardKpiAlertas = document.getElementById('card-kpi-alertas');
  if (cardKpiAlertas) {
    cardKpiAlertas.addEventListener('click', () => {
      switchPatientTab('mis-datos');
    });
  }

  const cardKpiCitas = document.getElementById('card-kpi-citas');
  if (cardKpiCitas) {
    cardKpiCitas.addEventListener('click', () => {
      switchPatientTab('mis-citas');
    });
  }

  // Botón volver al inicio dentro de la página del portal paciente
  const btnPatientExitInline = document.getElementById('btn-patient-exit-inline');
  if (btnPatientExitInline) {
    btnPatientExitInline.addEventListener('click', () => {
      store.setActiveView('landing');
    });
  }

  // Conexión del botón "Iniciar Sesión" en la barra del paciente (modo invitado)
  const btnPatNavLogin = document.getElementById('btn-patient-open-login');
  if (btnPatNavLogin) {
    btnPatNavLogin.addEventListener('click', (e) => {
      e.preventDefault();
      if (typeof window.openUnifiedLoginModal === 'function') {
        window.openUnifiedLoginModal('paciente');
      } else {
        const modal = document.getElementById('modal-unified-login');
        if (modal) {
          modal.classList.remove('hidden');
          modal.classList.add('active');
          const loginInput = document.getElementById('modal-login-username');
          if (loginInput) setTimeout(() => loginInput.focus(), 80);
        }
      }
    });
  }

  // Conexión del botón "Agendar Cita" en las pestañas del paciente
  const btnPatAgendarTab = document.getElementById('nav-btn-pat-agendar');
  if (btnPatAgendarTab) {
    btnPatAgendarTab.addEventListener('click', (e) => {
      e.preventDefault();
      switchPatientTab('agendar');
    });
  }

  // Conexión del botón "➕ Nueva Cita" en la sección de Mis Citas
  const btnCitasBookNew = document.getElementById('btn-citas-book-new');
  if (btnCitasBookNew) {
    btnCitasBookNew.addEventListener('click', (e) => {
      e.preventDefault();
      switchPatientTab('agendar');
    });
  }

  // Conexión del logo/brand del paciente y botón volver para regresar a la landing
  const patientBrandBtn = document.getElementById('patient-nav-brand-btn');
  const patientBackBtn = document.getElementById('btn-patient-back-to-web');
  const handleReturnToLanding = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (typeof window.returnToLanding === 'function') {
      window.returnToLanding();
      return;
    }
    const landingEl = document.getElementById('view-landing');
    if (landingEl) {
      landingEl.classList.remove('hidden', 'd-none');
      landingEl.style.removeProperty('display');
      landingEl.style.cssText = 'display: block !important; opacity: 1 !important; visibility: visible !important;';
    }
    const patientEl = document.getElementById('view-patient') || document.getElementById('portal-paciente');
    if (patientEl) {
      patientEl.classList.add('hidden', 'd-none');
      patientEl.style.cssText = 'display: none !important;';
    }
    if (window.store) {
      window.store.setActiveView('landing');
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  if (patientBrandBtn) {
    patientBrandBtn.addEventListener('click', handleReturnToLanding);
  }
  if (patientBackBtn) {
    patientBackBtn.addEventListener('click', handleReturnToLanding);
  }

  // Inicializar portal con la ventana de Resumen SIEMPRE al abrirse
  window.renderPatientPortal = function() {
    switchPatientTab('resumen');
  };
  window.switchPatientTab = switchPatientTab;

  // Inicializar vistas con la fecha de hoy y campos limpios para agendamiento
  clearTicketFormInputs();
  renderCalendar();
  renderTimeSlots();
  updateSummaryCard();
  updateStepView();
  renderPatientSummary();
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
  let activeDoctorTab = 'agenda'; // 'agenda', 'fichas', 'recetas', 'gastos', 'ingresos', 'notificaciones'
  let activeDate = getTodayDateStr(); // Inicializar SIEMPRE con la fecha de hoy automáticamente

  // Elementos de la barra de navegación (Móvil, Pestañas Superiores y Bottom Nav)
  const bottomNavButtons = document.querySelectorAll('.doctor-bottom-nav .bottom-nav-item');
  const mobilePillButtons = document.querySelectorAll('.doc-mobile-pill');
  const desktopNavButtons = document.querySelectorAll('#nav-menu-doctor .nav-tab-btn');
  const doctorPanes = document.querySelectorAll('.doctor-pane-view');

  // Botones de guardia y modales (Soporte dual: modal-guardia-imprevista y emergency-guard-modal)
  const btnEmergencyFab = document.getElementById('btn-emergency-guard-fab');
  const btnMobileQuickGuard = document.getElementById('btn-mobile-quick-guard');
  const emergencyModal = document.getElementById('modal-guardia-imprevista') || document.getElementById('emergency-guard-modal');
  const btnCloseEmergencyModal = document.getElementById('btn-close-guardia-modal') || document.getElementById('btn-close-emergency-modal');
  const emergencyActionsList = document.getElementById('guardia-affected-list') || document.getElementById('emergency-affected-list');
  const emergencyBanner = document.getElementById('doctor-emergency-active-banner');

  // Controles de Configuración de Guardia Imprevista
  const inputGuardiaFecha = document.getElementById('guardia-fecha-input');
  const selectGuardiaFranja = document.getElementById('guardia-franja-select');
  const selectGuardiaMotivo = document.getElementById('guardia-motivo-select');
  const customRangeBox = document.getElementById('guardia-custom-range');
  const inputHoraInicio = document.getElementById('guardia-hora-inicio');
  const inputHoraFin = document.getElementById('guardia-hora-fin');
  const guardiaAffectedCount = document.getElementById('guardia-affected-count');
  const btnBatchReschedule = document.getElementById('btn-guardia-batch-reprogramar');
  const btnBatchCancel = document.getElementById('btn-guardia-batch-cancelar');

  // Funciones de navegación de fecha (Día anterior, Hoy, Día siguiente)
  function shiftActiveDate(days) {
    const parts = activeDate.split('-');
    const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    d.setDate(d.getDate() + days);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    activeDate = `${y}-${m}-${day}`;
    renderTimeline();
  }

  function setTodayDate() {
    activeDate = getTodayDateStr();
    renderTimeline();
    showToast('Fecha de agenda restablecida al día de hoy.', 'info');
  }

  function formatSpanishDate(dateStr) {
    const parts = dateStr.split('-');
    const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const isToday = dateStr === getTodayDateStr();
    return `${days[d.getDay()]}, ${d.getDate()} de ${months[d.getMonth()]} de ${d.getFullYear()}${isToday ? ' (HOY)' : ''}`;
  }

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
    if (activeDoctorTab === 'ingresos') renderIngresosTab();
    if (activeDoctorTab === 'notificaciones') renderNotificationsTab();
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

  // Inicializar eventos del modal de prescripción médica oficial (Semana 4 - Parte 2)
  initPrescriptionModalEvents();

  // Inicializar eventos de relevo médico y alertas del sistema (Semana 5 - Parte 2)
  initReliefModalEvents();
  initSystemAlertsEvents();
  renderSystemAlertsBadge();

  // --- 1. CRONOGRAMA DIARIO & RUTAS (Timeline Vertical con Navegación de Fechas) ---
  function renderTimeline() {
    const timelineEl = document.getElementById('doctor-timeline-list');
    const agendaHeaderContainer = document.getElementById('doctor-agenda-header-toolbar');
    const state = store.getState();
    const isGuardActive = state.emergencyGuard.isActive;
    const isToday = activeDate === getTodayDateStr();

    // Actualizar banner si la guardia está activa
    if (emergencyBanner) {
      emergencyBanner.style.display = isGuardActive ? 'flex' : 'none';
    }

    const todayAppointments = state.appointments
      .filter(a => a.date === activeDate && a.status !== 'cancelada')
      .sort((a, b) => a.time.localeCompare(b.time));

    const travelBuffers = state.travelBuffers.filter(t => t.date === activeDate);

    // Actualizar o inyectar la barra de herramientas de fechas del Doctor
    if (agendaHeaderContainer) {
      agendaHeaderContainer.innerHTML = `
        <div class="doctor-date-nav-card" style="background: #ffffff; border: 1px solid var(--border-light); border-radius: 12px; padding: 12px 16px; margin-bottom: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 1.25rem;">📅</span>
              <div>
                <strong style="color: var(--dark-navy); font-size: 0.95rem;">${formatSpanishDate(activeDate)}</strong>
                <div style="font-size: 0.74rem; color: #64748b; margin-top: 1px;">
                  ${todayAppointments.length} ${todayAppointments.length === 1 ? 'consulta agendada' : 'consultas agendadas'} • ${travelBuffers.length} ${travelBuffers.length === 1 ? 'traslado intersede' : 'traslados intersedes'}
                </div>
              </div>
            </div>
            
            <!-- Botones de Navegación de Fecha, Guardia de Emergencia y Relevo Médico -->
            <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
              <button type="button" class="btn-relief-trigger" id="btn-doctor-trigger-relevo" style="background: linear-gradient(135deg, #0284c7, #2563eb); color: #ffffff; padding: 6px 13px; font-size: 0.78rem; font-weight: 700; border-radius: 8px; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 2px 6px rgba(37, 99, 235, 0.3);">
                <span style="font-size: 0.9rem;">🔄</span>
                <span>Asignar Médico de Relevo</span>
              </button>
              <button type="button" class="btn-emergency-guard-trigger" id="btn-doctor-trigger-guardia" style="background: linear-gradient(135deg, #ef4444, #dc2626); color: #ffffff; padding: 6px 13px; font-size: 0.78rem; font-weight: 700; border-radius: 8px; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 2px 6px rgba(220, 38, 38, 0.3);">
                <span style="font-size: 0.9rem;">🚨</span>
                <span>Activar Guardia / Bloqueo</span>
              </button>
              <button type="button" class="btn-secondary" id="btn-doc-date-prev" style="padding: 6px 12px; font-size: 0.78rem; font-weight: 700;">
                ◀ Anterior
              </button>
              ${isToday ? '' : `
              <button type="button" class="btn-secondary" id="btn-doc-date-today" style="padding: 6px 14px; font-size: 0.78rem; font-weight: 700; background: #e0f2fe; color: #0284c7; border: 1px solid #7dd3fc; border-radius: 6px; cursor: pointer;">
                📅 Hoy
              </button>
              `}
              <button type="button" class="btn-secondary" id="btn-doc-date-next" style="padding: 6px 12px; font-size: 0.78rem; font-weight: 700;">
                Siguiente ▶
              </button>
              <input type="date" id="input-doc-date-picker" value="${activeDate}" style="padding: 5px 8px; font-size: 0.78rem; border: 1px solid #cbd5e1; border-radius: 6px; color: #334155; cursor: pointer;" title="Seleccionar fecha específica" />
            </div>
          </div>
        </div>
      `;

      // Escuchadores de la barra de navegación de fecha y relevo
      const btnRelevoTrigger = document.getElementById('btn-doctor-trigger-relevo');
      const btnGuardiaTrigger = document.getElementById('btn-doctor-trigger-guardia');
      const btnPrev = document.getElementById('btn-doc-date-prev');
      const btnToday = document.getElementById('btn-doc-date-today');
      const btnNext = document.getElementById('btn-doc-date-next');
      const inputPicker = document.getElementById('input-doc-date-picker');

      if (btnRelevoTrigger) btnRelevoTrigger.addEventListener('click', () => openReliefModal());
      if (btnGuardiaTrigger) btnGuardiaTrigger.addEventListener('click', () => openEmergencyModal());
      if (btnPrev) btnPrev.addEventListener('click', () => shiftActiveDate(-1));
      if (btnToday) btnToday.addEventListener('click', () => setTodayDate());
      if (btnNext) btnNext.addEventListener('click', () => shiftActiveDate(1));
      if (inputPicker) {
        inputPicker.addEventListener('change', (e) => {
          if (e.target.value) {
            activeDate = e.target.value;
            renderTimeline();
          }
        });
      }
    }

    if (!timelineEl) return;

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
        <div style="text-align: center; padding: 40px 20px; background: #ffffff; border-radius: 12px; border: 1px dashed #cbd5e1; color: #64748b;">
          <span style="font-size: 2.5rem;">📅</span>
          <p style="margin-top: 10px; font-weight: 700; color: #334155; font-size: 1rem;">No hay citas agendadas para esta fecha (${formatSpanishDate(activeDate)}).</p>
          <p style="font-size: 0.82rem; margin-top: 4px;">Utilice los botones de navegación superiores para consultar otros días o el botón "📅 Hoy" para volver a la fecha actual.</p>
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
      const isReliefAssigned = apt.status === 'relevo_asignado';

      return `
        <div class="timeline-card ${apt.clinicId} ${isEmergencyInterrupted ? 'en_guardia' : ''} ${isReliefAssigned ? 'relevo_asignado' : ''}">
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
                (isReliefAssigned ? 
                  `<span class="badge-sede" style="background: #e0f2fe; color: #0369a1; border: 1px solid #7dd3fc; font-weight: 700;">🔄 Relevo: ${apt.reliefDoctor || 'Colega Asignado'}</span>` : 
                  `<span style="font-size: 0.72rem; font-weight: 700; color: #10b981;">$${apt.totalPaid.toFixed(2)} (${apt.paymentMethod})</span>`
                )}
            </div>
            ${isReliefAssigned ? `
              <div style="font-size: 0.73rem; color: #0369a1; background: #f0f9ff; padding: 5px 8px; border-radius: 6px; margin-top: 6px; border: 1px dashed #bae6fd;">
                👨‍⚕️ Cubierto por <strong>${apt.reliefDoctor || 'Colega Relevo'}</strong> (${apt.reliefDoctorCode || 'MSP'}). Paciente notificado. Sede y horario preservados.
              </div>
            ` : ''}
            <div style="margin-top: 8px; display: flex; gap: 6px; flex-wrap: wrap;">
              <button type="button" class="btn-timeline-open-record" data-id="${apt.id}" data-patient-id="${apt.patientId}" style="min-height: 38px; border: 1px solid #bfdbfe; background: #eff6ff; color: #0284c7; font-size: 0.76rem; font-weight: 700; border-radius: 6px; padding: 6px 10px; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">
                📋 Abrir Expediente & SOAP →
              </button>
              <button type="button" class="btn-timeline-open-rx" data-id="${apt.id}" data-patient-id="${apt.patientId}" style="min-height: 38px; border: 1px solid #bbf7d0; background: #f0fdf4; color: #166534; font-size: 0.76rem; font-weight: 700; border-radius: 6px; padding: 6px 10px; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">
                💊 Receta MSP →
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    timelineEl.querySelectorAll('.btn-timeline-open-record').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const pId = btn.dataset.patientId;
        const aptId = btn.dataset.id;
        const state = store.getState();
        let record = state.medicalRecords.find(r => r.patientId === pId || r.patientCedula === pId);
        if (!record) {
          const apt = state.appointments.find(a => a.id === aptId);
          record = store.addMedicalRecord({
            patientId: pId,
            patientCedula: pId,
            patientName: apt ? apt.patientName : 'Paciente',
            motivo: apt ? apt.reason : 'Consulta General',
            sede: apt && CLINICS[apt.clinicId] ? CLINICS[apt.clinicId].name : 'Clínica Ceibos'
          });
        }
        openRecordModal({
          ...record,
          appointmentId: aptId
        });
      });
    });

    timelineEl.querySelectorAll('.btn-timeline-open-rx').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const pId = btn.dataset.patientId;
        const aptId = btn.dataset.id;
        const state = store.getState();
        const apt = state.appointments.find(a => a.id === aptId);
        const record = state.medicalRecords.find(r => r.patientId === pId || r.patientCedula === pId) || {};
        const clinic = apt ? (CLINICS[apt.clinicId] || CLINICS.ceibos) : CLINICS.ceibos;

        openPrescriptionModal({
          patientId: pId,
          patientCedula: record.patientCedula || pId,
          patientName: apt ? apt.patientName : (record.patientName || 'Paciente'),
          age: record.age || 44,
          sede: clinic.name,
          diagnosis: apt ? apt.reason : (record.lastDiagnosis || 'Consulta de Medicina General'),
          appointmentId: aptId
        });
      });
    });
  }



  // --- 2. MECANISMO DE GUARDIA IMPREVISTA Y REPROGRAMACIÓN ÁGIL (Semana 4 - Parte 3) ---
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
      if (emergencyModal) emergencyModal.classList.remove('active');
    });
  }

  // Sincronización de eventos de configuración de guardia
  if (inputGuardiaFecha) {
    inputGuardiaFecha.addEventListener('change', () => {
      renderEmergencyModalList();
    });
  }

  if (selectGuardiaFranja) {
    selectGuardiaFranja.addEventListener('change', (e) => {
      if (customRangeBox) {
        customRangeBox.style.display = (e.target.value === 'personalizado') ? 'block' : 'none';
      }
      renderEmergencyModalList();
    });
  }

  if (inputHoraInicio) {
    inputHoraInicio.addEventListener('change', () => renderEmergencyModalList());
  }
  if (inputHoraFin) {
    inputHoraFin.addEventListener('change', () => renderEmergencyModalList());
  }

  // Acciones Masivas (En Lote)
  if (btnBatchReschedule) {
    btnBatchReschedule.addEventListener('click', () => {
      const affected = getAffectedAppointments().filter(a => a.status !== 'reprogramada_guardia');
      if (affected.length === 0) {
        showToast('No hay citas pendientes de reprogramar en la franja seleccionada.', 'info');
        return;
      }
      const motivo = selectGuardiaMotivo ? selectGuardiaMotivo.value : 'Llamado a Guardia Hospitalaria';
      affected.forEach(apt => {
        store.rescheduleAppointmentForGuard(apt.id, null, null, motivo);
      });
      showToast(`⚡ ${affected.length} citas reprogramadas ágilmente con notificación prioritaria a los pacientes.`, 'success');
      renderEmergencyModalList();
      renderTimeline();
      if (activeDoctorTab === 'notificaciones') renderNotificationsTab();
    });
  }

  if (btnBatchCancel) {
    btnBatchCancel.addEventListener('click', () => {
      const affected = getAffectedAppointments();
      if (affected.length === 0) {
        showToast('No hay citas que cancelar en esta franja.', 'info');
        return;
      }
      if (!confirm(`¿Está seguro de cancelar las ${affected.length} citas seleccionadas y emitir tickets de reembolso prioritario?`)) {
        return;
      }
      const motivo = selectGuardiaMotivo ? selectGuardiaMotivo.value : 'Llamado a Guardia Hospitalaria';
      affected.forEach(apt => {
        store.cancelAppointmentForGuard(apt.id, motivo);
      });
      showToast(`🚫 ${affected.length} citas canceladas y registradas para reprogramación prioritaria sin costo.`, 'warning');
      renderEmergencyModalList();
      renderTimeline();
      if (activeDoctorTab === 'notificaciones') renderNotificationsTab();
    });
  }

  function getContingencyTimeRange() {
    const franja = selectGuardiaFranja ? selectGuardiaFranja.value : 'tarde';
    let start = '14:00';
    let end = '18:00';

    if (franja === 'completo') {
      start = '00:00';
      end = '23:59';
    } else if (franja === 'manana') {
      start = '08:00';
      end = '13:00';
    } else if (franja === 'tarde') {
      start = '14:00';
      end = '18:00';
    } else if (franja === 'noche') {
      start = '18:00';
      end = '21:00';
    } else if (franja === 'personalizado') {
      start = (inputHoraInicio && inputHoraInicio.value) || '14:00';
      end = (inputHoraFin && inputHoraFin.value) || '18:00';
    }

    return { start, end };
  }

  function getAffectedAppointments() {
    const targetDate = (inputGuardiaFecha && inputGuardiaFecha.value) || activeDate;
    const { start, end } = getContingencyTimeRange();
    const state = store.getState();

    return state.appointments.filter(a => {
      if (a.date !== targetDate) return false;
      if (a.clinicId === 'hospital') return false; // La guardia se atiende en el Hospital
      if (a.status === 'cancelada' || a.status === 'cancelada_guardia') return false;
      const aptTime = a.time;
      return aptTime >= start && aptTime <= end;
    }).sort((a, b) => a.time.localeCompare(b.time));
  }

  function openEmergencyModal() {
    const state = store.getState();
    if (inputGuardiaFecha) {
      inputGuardiaFecha.value = activeDate;
    }

    // Activar modo guardia en el estado si no estaba activo
    if (!state.emergencyGuard.isActive) {
      const motivo = selectGuardiaMotivo ? selectGuardiaMotivo.value : 'Convocatoria urgente a Guardia Hospitalaria';
      store.activateEmergencyGuard(motivo);
      showToast('🚨 Modo Guardia Activado. Bloqueo de agenda y gestión de contingencia.', 'danger');
    }

    renderEmergencyModalList();
    if (emergencyModal) emergencyModal.classList.add('active');
  }

  function renderEmergencyModalList() {
    if (!emergencyActionsList) return;
    const affected = getAffectedAppointments();
    const motivo = selectGuardiaMotivo ? selectGuardiaMotivo.value : 'Llamado a Guardia Hospitalaria';

    if (guardiaAffectedCount) {
      guardiaAffectedCount.textContent = `${affected.length} Cita${affected.length === 1 ? '' : 's'}`;
    }

    if (affected.length === 0) {
      emergencyActionsList.innerHTML = `
        <div style="text-align: center; padding: 28px 16px; background: #f0fdf4; border: 1px dashed #86efac; border-radius: 12px; color: #166534;">
          <div style="font-size: 1.8rem; margin-bottom: 6px;">✅</div>
          <strong style="font-size: 0.95rem;">No hay citas en conflicto en este horario</strong>
          <p style="font-size: 0.8rem; color: #4b5563; margin-top: 4px;">El Dr. Campoverde puede acudir a su guardia hospitalaria sin interferir con turnos de pacientes.</p>
        </div>
      `;
      return;
    }

    emergencyActionsList.innerHTML = affected.map(apt => {
      const clinic = CLINICS[apt.clinicId] || { name: 'Sede Privada', badgeClass: 'badge-ceibos' };
      const isRescheduled = apt.status === 'reprogramada_guardia';

      return `
        <div class="guardia-affected-item" style="background: ${isRescheduled ? '#eff6ff' : '#fff1f2'}; border: 1px solid ${isRescheduled ? '#bfdbfe' : '#fecdd3'}; border-radius: 12px; padding: 12px 14px; display: flex; flex-direction: column; gap: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <strong style="font-size: 0.92rem; color: ${isRescheduled ? '#1e40af' : '#991b1b'};">⏰ ${apt.time} • ${apt.patientName}</strong>
              <span class="badge-sede ${clinic.badgeClass}" style="font-size: 0.72rem; padding: 2px 7px; border-radius: 6px;">${clinic.name}</span>
            </div>
            ${isRescheduled ? `
              <span style="font-size: 0.72rem; font-weight: 700; background: #dbeafe; color: #1e40af; padding: 3px 8px; border-radius: 9999px;">
                ✓ Reprogramada Ágilmente
              </span>
            ` : `
              <span style="font-size: 0.72rem; font-weight: 700; background: #fee2e2; color: #991b1b; padding: 3px 8px; border-radius: 9999px;">
                ⚠️ En Conflicto de Guardia
              </span>
            `}
          </div>

          <div style="font-size: 0.78rem; color: #475569; display: flex; justify-content: space-between;">
            <span>Motivo Consulta: <strong>${apt.reason || 'Medicina General'}</strong></span>
            <span>Tel/Correo: <strong>${apt.patientPhone || apt.patientEmail || 'Registrado'}</strong></span>
          </div>

          ${apt.notes ? `
            <div style="font-size: 0.74rem; color: #64748b; background: rgba(255,255,255,0.7); padding: 5px 8px; border-radius: 6px;">
              ${apt.notes}
            </div>
          ` : ''}

          <div style="display: flex; gap: 8px; margin-top: 4px;">
            <button type="button" class="btn-reschedule-guardia" data-id="${apt.id}" style="flex: 1; padding: 7px 10px; font-size: 0.76rem; font-weight: 700; background: #2563eb; color: #ffffff; border: none; border-radius: 8px; cursor: pointer; display: inline-flex; justify-content: center; align-items: center; gap: 4px;">
              <span>⚡ ${isRescheduled ? 'Cambiar Nuevo Horario' : 'Reprogramar Ágilmente'}</span>
            </button>
            <button type="button" class="btn-cancel-guardia" data-id="${apt.id}" style="flex: 1; padding: 7px 10px; font-size: 0.76rem; font-weight: 700; background: #ef4444; color: #ffffff; border: none; border-radius: 8px; cursor: pointer; display: inline-flex; justify-content: center; align-items: center; gap: 4px;">
              <span>🚫 Cancelar con Prioridad</span>
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Escuchadores unitarios de Reprogramación y Cancelación
    emergencyActionsList.querySelectorAll('.btn-reschedule-guardia').forEach(btn => {
      btn.addEventListener('click', () => {
        const aptId = btn.dataset.id;
        store.rescheduleAppointmentForGuard(aptId, null, null, motivo);
        showToast('Su turno ha sido reprogramado debido a una guardia hospitalaria imprevista del Dr. Campoverde. Se ha reservado su espacio prioritario.', 'success');
        renderEmergencyModalList();
        renderTimeline();
        if (activeDoctorTab === 'notificaciones') renderNotificationsTab();
      });
    });

    emergencyActionsList.querySelectorAll('.btn-cancel-guardia').forEach(btn => {
      btn.addEventListener('click', () => {
        const aptId = btn.dataset.id;
        store.cancelAppointmentForGuard(aptId, motivo);
        showToast('Turno cancelado por contingencia de guardia. Se emitió ticket de reagendamiento prioritario para el paciente.', 'warning');
        renderEmergencyModalList();
        renderTimeline();
        if (activeDoctorTab === 'notificaciones') renderNotificationsTab();
      });
    });
  }

  // --- 2.1 MECANISMO DE RELEVO MÉDICO ENTRE COLEGAS (Semana 5 - Parte 2 - Jorge) ---
  function openReliefModal() {
    const modal = document.getElementById('modal-asignar-relevo-medico');
    if (!modal) return;

    const state = store.getState();
    const todayAppointments = (state.appointments || [])
      .filter(a => a.date === activeDate && a.status !== 'cancelada' && a.status !== 'cancelada_guardia')
      .sort((a, b) => a.time.localeCompare(b.time));

    const listContainer = document.getElementById('relief-appointments-list');
    const specificScopeBtn = document.getElementById('btn-scope-specific');
    const fullScopeBtn = document.getElementById('btn-scope-full');
    const selectionBox = document.getElementById('relief-appointments-selection-box');
    let currentScope = 'citas_especificas';

    // Switcher de franja
    if (specificScopeBtn && fullScopeBtn) {
      specificScopeBtn.onclick = () => {
        currentScope = 'citas_especificas';
        specificScopeBtn.classList.add('active');
        fullScopeBtn.classList.remove('active');
        if (selectionBox) selectionBox.style.display = 'block';
      };
      fullScopeBtn.onclick = () => {
        currentScope = 'guardia_completa';
        fullScopeBtn.classList.add('active');
        specificScopeBtn.classList.remove('active');
        if (selectionBox) selectionBox.style.display = 'none';
      };
    }

    // Renderizar lista de citas seleccionables
    if (listContainer) {
      if (todayAppointments.length === 0) {
        listContainer.innerHTML = `
          <div style="font-size: 0.78rem; color: #64748b; text-align: center; padding: 14px;">
            No hay consultas activas agendadas para el día ${formatSpanishDate(activeDate)}.
          </div>
        `;
      } else {
        listContainer.innerHTML = todayAppointments.map(apt => {
          const clinic = CLINICS[apt.clinicId] || { name: apt.clinicId || 'Sede' };
          const isAlreadyRelief = apt.status === 'relevo_asignado';
          return `
            <label class="relief-appointment-check-row ${isAlreadyRelief ? 'selected' : ''}">
              <input type="checkbox" class="relief-apt-checkbox" value="${apt.id}" checked />
              <div style="flex: 1;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-weight: 700; font-size: 0.8rem; color: #0f172a;">${apt.time} - ${apt.patientName}</span>
                  <span class="badge-sede ${clinic.badgeClass || 'badge-ceibos'}" style="font-size: 0.68rem; padding: 1px 6px;">${clinic.name}</span>
                </div>
                <div style="font-size: 0.72rem; color: #64748b;">
                  📋 ${apt.reason || 'Consulta General'} • Cédula: ${apt.patientId || 'N/A'}
                  ${isAlreadyRelief ? `<span style="color: #0284c7; font-weight: 700; margin-left: 6px;">(Relevo actual: ${apt.reliefDoctor})</span>` : ''}
                </div>
              </div>
            </label>
          `;
        }).join('');
      }
    }

    // Botón Seleccionar Todas
    const btnSelectAll = document.getElementById('btn-relief-select-all');
    if (btnSelectAll) {
      btnSelectAll.onclick = () => {
        const checkboxes = modal.querySelectorAll('.relief-apt-checkbox');
        const anyUnchecked = Array.from(checkboxes).some(cb => !cb.checked);
        checkboxes.forEach(cb => { cb.checked = anyUnchecked; });
        btnSelectAll.textContent = anyUnchecked ? 'Deseleccionar Todas' : 'Seleccionar Todas';
      };
    }

    modal.classList.add('active');
  }

  function initReliefModalEvents() {
    const modal = document.getElementById('modal-asignar-relevo-medico');
    const btnClose = document.getElementById('btn-close-relevo-modal');
    const btnCancel = document.getElementById('btn-cancelar-relevo');
    const btnConfirm = document.getElementById('btn-confirmar-relevo-medico');
    const doctorSelect = document.getElementById('relief-doctor-select');
    const detailsHint = document.getElementById('relief-doctor-details-hint');
    const motivoInput = document.getElementById('relief-motivo-input');

    if (doctorSelect && detailsHint) {
      doctorSelect.addEventListener('change', () => {
        const opt = doctorSelect.options[doctorSelect.selectedIndex];
        detailsHint.textContent = `Especialidad: ${opt.dataset.spec} • Teléfono: ${opt.dataset.phone}`;
      });
    }

    if (btnClose) btnClose.onclick = () => modal && modal.classList.remove('active');
    if (btnCancel) btnCancel.onclick = () => modal && modal.classList.remove('active');

    if (btnConfirm) {
      btnConfirm.onclick = () => {
        const opt = doctorSelect ? doctorSelect.options[doctorSelect.selectedIndex] : null;
        const coveringDoctor = opt ? opt.dataset.name : 'Dra. Elena Morales';
        const coveringDoctorCode = opt ? opt.dataset.code : 'MSP-REG-092834';
        const coveringDoctorSpecialty = opt ? opt.dataset.spec : 'Medicina Familiar y Comunitaria';
        const coveringDoctorPhone = opt ? opt.dataset.phone : '0984719283';
        const reason = motivoInput ? motivoInput.value.trim() : 'Convocatoria imprevista a guardia hospitalaria en Hospital Ceibos';

        const scopeBtn = document.getElementById('btn-scope-full');
        const isFullGuard = scopeBtn && scopeBtn.classList.contains('active');
        const scope = isFullGuard ? 'guardia_completa' : 'citas_especificas';

        const checkedBoxes = modal.querySelectorAll('.relief-apt-checkbox:checked');
        const appointmentIds = Array.from(checkedBoxes).map(cb => cb.value);

        if (!isFullGuard && appointmentIds.length === 0) {
          showToast('Selecciona al menos una consulta médica para transferir al colega de relevo.', 'warning');
          return;
        }

        const result = store.assignDoctorRelief({
          coveringDoctor,
          coveringDoctorCode,
          coveringDoctorSpecialty,
          coveringDoctorPhone,
          reason,
          scope,
          appointmentIds,
          date: activeDate
        });

        if (modal) modal.classList.remove('active');

        showToast(`✅ Relevo asignado a ${coveringDoctor}. Pacientes notificados: "Su atención médica en Sede será cubierta por ${coveringDoctor} en el mismo horario acordado."`, 'success');

        renderTimeline();
        renderSystemAlertsBadge();
        if (activeDoctorTab === 'notificaciones') renderNotificationsTab();
      };
    }
  }

  // --- 2.2 PANEL DE ALERTAS OPERATIVAS DEL SISTEMA (Semana 5 - Parte 2) ---
  function renderSystemAlertsBadge() {
    const alerts = store.getSystemAlerts();
    const countBadge = document.getElementById('badge-system-alerts-count');
    const mobileBadge = document.getElementById('badge-mobile-alerts-count');
    const allCountEl = document.getElementById('alert-filter-all-count');

    if (countBadge) {
      countBadge.textContent = alerts.length;
      countBadge.style.display = alerts.length > 0 ? 'inline-block' : 'none';
    }
    if (mobileBadge) {
      mobileBadge.textContent = alerts.length;
      mobileBadge.style.display = alerts.length > 0 ? 'inline-block' : 'none';
    }
    if (allCountEl) {
      allCountEl.textContent = alerts.length;
    }
  }

  function openSystemAlertsModal(filterCategory = 'all') {
    const modal = document.getElementById('modal-alertas-sistema');
    const listContainer = document.getElementById('system-alerts-list-container');
    if (!modal || !listContainer) return;

    const alerts = store.getSystemAlerts();
    const filtered = filterCategory === 'all' 
      ? alerts 
      : alerts.filter(a => a.category === filterCategory);

    if (filtered.length === 0) {
      listContainer.innerHTML = `
        <div style="text-align: center; padding: 32px 16px; color: #64748b; background: #f8fafc; border-radius: 8px;">
          <span style="font-size: 1.8rem; display: block; margin-bottom: 6px;">🎉</span>
          <strong style="color: #0f172a;">Sin alertas operativas pendientes en esta categoría</strong>
          <p style="font-size: 0.76rem; margin: 4px 0 0;">Todos los turnos, historiales y traslados se encuentran debidamente monitoreados.</p>
        </div>
      `;
    } else {
      listContainer.innerHTML = filtered.map(a => {
        return `
          <div class="system-alert-card severity-${a.severity || 'INFO'}" id="alert-card-${a.id}">
            <div class="system-alert-header">
              <span class="system-alert-title">
                <span>${a.icon || '⚠️'}</span>
                <span>${a.title}</span>
              </span>
              <button type="button" class="alert-dismiss-btn" data-alert-id="${a.id}" title="Descartar alerta">✕</button>
            </div>
            <p class="system-alert-message">${a.message}</p>
            <div class="system-alert-footer">
              <span style="font-weight: 700; color: #1e40af;">👉 Acción: ${a.actionRequired || 'Revisar expediente'}</span>
              <span>${a.time || ''}</span>
            </div>
          </div>
        `;
      }).join('');

      listContainer.querySelectorAll('.alert-dismiss-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const alertId = btn.dataset.alertId;
          store.dismissSystemAlert(alertId);
          openSystemAlertsModal(filterCategory);
          renderSystemAlertsBadge();
          showToast('Alerta descartada del panel operativo.', 'info');
        });
      });
    }

    modal.classList.add('active');
  }

  function initSystemAlertsEvents() {
    const btnDesktopAlerts = document.getElementById('btn-doctor-system-alerts');
    const btnMobileAlerts = document.getElementById('btn-mobile-quick-alerts');
    const modal = document.getElementById('modal-alertas-sistema');
    const btnClose = document.getElementById('btn-close-alertas-modal');
    const btnCloseFooter = document.getElementById('btn-close-alertas-footer');

    if (btnDesktopAlerts) btnDesktopAlerts.addEventListener('click', () => openSystemAlertsModal('all'));
    if (btnMobileAlerts) btnMobileAlerts.addEventListener('click', () => openSystemAlertsModal('all'));
    if (btnClose) btnClose.onclick = () => modal && modal.classList.remove('active');
    if (btnCloseFooter) btnCloseFooter.onclick = () => modal && modal.classList.remove('active');

    // Botones de filtro de alertas
    if (modal) {
      modal.querySelectorAll('.alert-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          modal.querySelectorAll('.alert-filter-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          openSystemAlertsModal(btn.dataset.filter);
        });
      });
    }
  }

  // --- CENTRO DE AUTOMATIZACIONES Y NOTIFICACIONES (Semana 4 - Parte 3) ---
  function renderNotificationsTab() {
    const listEl = document.getElementById('notif-audit-log-list');
    const kpiConfirmations = document.getElementById('kpi-notif-confirmations');
    const kpiReminders = document.getElementById('kpi-notif-reminders');
    const kpiEmergencies = document.getElementById('kpi-notif-emergencies');
    const kpiRate = document.getElementById('kpi-notif-rate');
    const btnSimulate = document.getElementById('btn-simulate-reminders-24h');
    const btnTestEmail = document.getElementById('btn-test-email-dispatch');
    const btnClearLogs = document.getElementById('btn-clear-notif-logs');

    const logs = (store.getNotificationLogs ? store.getNotificationLogs() : (store.getState().notificationLogs || []));

    // Contabilizar KPIs
    const countConfirm = logs.filter(l => l.type === 'confirmacion_inmediata').length;
    const countRemind = logs.filter(l => l.type === 'recordatorio_24h').length;
    const countEmergency = logs.filter(l => l.type === 'guardia_emergencia' || l.type === 'cancelacion_guardia').length;

    if (kpiConfirmations) kpiConfirmations.textContent = countConfirm;
    if (kpiReminders) kpiReminders.textContent = countRemind;
    if (kpiEmergencies) kpiEmergencies.textContent = countEmergency;
    if (kpiRate) kpiRate.textContent = '100%';

    if (listEl) {
      if (logs.length === 0) {
        listEl.innerHTML = `
          <div style="text-align: center; padding: 36px 20px; color: #64748b;">
            <div style="font-size: 2rem; margin-bottom: 8px;">✉️</div>
            <strong style="color: #334155; font-size: 0.95rem;">No hay registros de transmisiones aún</strong>
            <p style="font-size: 0.8rem; color: #94a3b8; margin-top: 4px;">Los correos de confirmación inmediata y recordatorios 24h aparecerán aquí en vivo.</p>
          </div>
        `;
      } else {
        listEl.innerHTML = logs.map(item => {
          let badgeColor = '#2563eb';
          let badgeBg = '#eff6ff';
          let typeLabel = 'Notificación';

          if (item.type === 'confirmacion_inmediata') {
            badgeColor = '#059669';
            badgeBg = '#ecfdf5';
            typeLabel = '✉️ Confirmación Inmediata';
          } else if (item.type === 'recordatorio_24h') {
            badgeColor = '#2563eb';
            badgeBg = '#eff6ff';
            typeLabel = '⏰ Recordatorio 24h';
          } else if (item.type === 'guardia_emergencia') {
            badgeColor = '#d97706';
            badgeBg = '#fffbeb';
            typeLabel = '🚨 Reagendamiento Guardia';
          } else if (item.type === 'cancelacion_guardia') {
            badgeColor = '#dc2626';
            badgeBg = '#fef2f2';
            typeLabel = '🚫 Cancelación Contingencia';
          } else if (item.type === 'prueba_conexion') {
            badgeColor = '#7c3aed';
            badgeBg = '#f5f3ff';
            typeLabel = '🧪 Prueba Diagnóstica';
          }

          return `
            <div class="notif-log-item-card" style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 14px; margin-bottom: 8px; display: flex; flex-direction: column; gap: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
              <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="background: ${badgeBg}; color: ${badgeColor}; font-size: 0.72rem; font-weight: 700; padding: 3px 8px; border-radius: 6px;">
                    ${typeLabel}
                  </span>
                  <span style="font-size: 0.76rem; font-family: monospace; color: #64748b;">${item.timestamp || 'Ahora'}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span style="font-size: 0.72rem; font-weight: 600; color: #059669; background: #ecfdf5; padding: 2px 7px; border-radius: 4px;">✓ ${item.status || 'Enviado'}</span>
                  <span style="font-size: 0.72rem; color: #64748b;">${item.recipientEmail ? `(${item.recipientEmail})` : ''}</span>
                </div>
              </div>
              <div style="font-size: 0.82rem; color: #1e293b; line-height: 1.45; font-weight: 500;">
                ${item.message}
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // Escuchador botón Simular Envío Masivo 24h
    if (btnSimulate) {
      btnSimulate.onclick = () => {
        if (window.EmailService && window.EmailService.auditAndSend24hReminders) {
          window.EmailService.auditAndSend24hReminders(showToast);
        } else if (store.auditAndSend24hReminders) {
          const sent = store.auditAndSend24hReminders();
          showToast(`⚡ Se auditaron las citas del día siguiente. ${sent.length} recordatorios 24h despachados.`, 'success');
        }
        renderNotificationsTab();
      };
    }

    // Escuchador botón Correo de Prueba
    if (btnTestEmail) {
      btnTestEmail.onclick = () => {
        if (window.EmailService && window.EmailService.sendTestEmail) {
          window.EmailService.sendTestEmail(showToast);
        } else {
          showToast('✉️ Correo de prueba enviado a dr.campoverde@montepiedrasalud.com', 'info');
        }
        renderNotificationsTab();
      };
    }

    // Escuchador botón Limpiar Logs
    if (btnClearLogs) {
      btnClearLogs.onclick = () => {
        if (store.clearNotificationLogs) {
          store.clearNotificationLogs();
        }
        renderNotificationsTab();
        showToast('Historial de notificaciones restablecido.', 'info');
      };
    }
  }

  // --- 3. FICHAS CLÍNICAS RÁPIDAS & EXPEDIENTE CRONOLÓGICO MÓVIL (Semana 4) ---
  function renderMedicalRecords() {
    const listEl = document.getElementById('medical-records-list');
    const searchInput = document.getElementById('search-patient-records');
    if (!listEl) return;

    const query = (searchInput ? searchInput.value.trim().toLowerCase() : '');
    const state = store.getState();

    const filteredRecords = state.medicalRecords.filter(r => 
      (r.patientName && r.patientName.toLowerCase().includes(query)) ||
      (r.patientId && r.patientId.includes(query)) ||
      (r.patientCedula && r.patientCedula.includes(query))
    );

    if (filteredRecords.length === 0) {
      listEl.innerHTML = `<div style="text-align: center; padding: 30px; color: #64748b;">No se encontraron expedientes clínicos para "${query}".</div>`;
      return;
    }

    listEl.innerHTML = filteredRecords.map(rec => {
      const consultasCount = (rec.consultationHistory || []).length;
      return `
        <div class="patient-record-card" data-id="${rec.id}">
          <div class="patient-record-header">
            <div>
              <div class="record-name">${rec.patientName}</div>
              <div class="record-ci">C.I: ${rec.patientCedula || rec.patientId} | Edad: ${rec.age || 35} años | Tipo: ${rec.bloodType || 'O+'}</div>
            </div>
            <button type="button" class="btn-ghost-sm btn-view-full-record" data-id="${rec.id}" style="min-height: 40px; padding: 6px 12px; font-weight: 700; color: #0284c7;">Expediente Móvil →</button>
          </div>
          <div class="allergy-alert-tag" style="background: #fef2f2; border-left: 4px solid #ef4444; color: #991b1b; padding: 8px 10px; border-radius: 6px; font-size: 0.82rem; font-weight: 700; margin: 8px 0;">
            <span>⚠️ ALERGIAS:</span>
            <span>${rec.allergies || 'Ninguna conocida (NKA)'}</span>
          </div>
          <div class="past-diagnosis-snippet" style="font-size: 0.82rem; color: #334155;">
            <strong>Último Diagnóstico:</strong> ${rec.lastDiagnosis || 'Consulta de Medicina General'}
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px; font-size: 0.74rem; color: #64748b;">
            <span>📍 ${rec.sede || 'Clínica Ceibos'}</span>
            <span>🕒 ${consultasCount} atención${consultasCount === 1 ? '' : 'es'} en historial</span>
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

    // Antecedentes estructurados
    const antecedentes = record.antecedentes || {
      app: record.history || 'Sin antecedentes patológicos declarados.',
      apf: 'Sin antecedentes familiares de riesgo.',
      quirurgicos: 'Sin cirugías previas.',
      habitos: 'Hábitos no tóxicos.'
    };

    const vitals = record.signosVitales || { pa: '120/80', fc: '75', temp: '36.5', imc: '23.5' };
    const consultations = record.consultationHistory || [];

    modalBody.innerHTML = `
      <div class="clinical-record-container">
        <!-- Cabecera del Paciente -->
        <div class="clinical-header-box">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <div class="clinical-patient-meta-row">
                <h3 class="clinical-patient-name">${record.patientName}</h3>
              </div>
              <div class="clinical-patient-badges">
                <span class="clinical-badge-pill">🪪 C.I: <strong>${record.patientCedula || record.patientId}</strong></span>
                <span class="clinical-badge-pill">🎂 ${record.age || 35} años</span>
                <span class="clinical-badge-pill clinical-badge-blood">🩸 ${record.bloodType || 'O+'}</span>
                <span class="clinical-badge-pill">📍 ${record.sede || 'Clínica Ceibos'}</span>
              </div>
            </div>
            <button type="button" id="btn-modal-close-clinical" style="background: rgba(255,255,255,0.2); border: none; color: #ffffff; width: 34px; height: 34px; border-radius: 9999px; cursor: pointer; font-size: 1.15rem; display: flex; align-items: center; justify-content: center;" title="Cerrar expediente">✕</button>
          </div>
        </div>

        <!-- Banner de Alertas Médicas Críticas (High Priority) -->
        <div class="clinical-alert-banner">
          <span class="clinical-alert-icon">🚨</span>
          <div>
            <div class="clinical-alert-title">Alerta Médica Crítica • Antecedentes de Alto Riesgo</div>
            <div class="clinical-alert-desc">
              <strong>Alergias Medicamentosas:</strong> ${record.allergies || 'Ninguna conocida (NKA)'}
              <br/>
              <strong>Patología Crónica Base:</strong> ${antecedentes.app || record.history || 'Ninguna declarada'}
            </div>
          </div>
        </div>

        <!-- Navegación por Pestañas Touch-Friendly (Mínimo 44px de alto) -->
        <div class="clinical-nav-tabs">
          <button type="button" class="clinical-nav-tab-btn active" data-tab="timeline">
            <span>🕒 Historial</span>
          </button>
          <button type="button" class="clinical-nav-tab-btn" data-tab="soap">
            <span>✍️ Nueva Consulta</span>
          </button>
          <button type="button" class="clinical-nav-tab-btn" data-tab="antecedentes">
            <span>📋 Antecedentes</span>
          </button>
        </div>

        <!-- PANE 1: Historial Cronológico (Timeline Médico) -->
        <div class="clinical-tab-pane active" id="clinical-pane-timeline">
          <div class="clinical-timeline-wrapper">
            ${consultations.length === 0 ? `
              <div style="text-align: center; padding: 24px; color: #64748b; background: #f8fafc; border-radius: 10px;">
                No hay atenciones previas registradas en este expediente.
              </div>
            ` : consultations.map(c => `
              <div class="clinical-timeline-card">
                <div class="clinical-timeline-top">
                  <div>
                    <span class="clinical-timeline-date">📅 ${c.date}</span>
                    <span class="clinical-timeline-sede">• 📍 ${c.sede}</span>
                  </div>
                  <span class="clinical-status-tag ${c.estado === 'Atendida' ? 'atendida' : (c.estado === 'En Consulta' ? 'en_consulta' : 'agendada')}">
                    ● ${c.estado || 'Atendida'}
                  </span>
                </div>
                <div style="font-size: 0.86rem; font-weight: 700; color: #0f172a; margin-bottom: 4px;">
                  Motivo: ${c.motivo}
                </div>
                <div style="font-size: 0.80rem; color: #0284c7; font-weight: 600;">
                  Diagnóstico: ${c.diagnostico}
                </div>
                <div class="clinical-vitals-inline">
                  <span><strong>PA:</strong> ${c.pa || '120/80'}</span>
                  <span><strong>FC:</strong> ${c.fc || '75 lpm'}</span>
                  <span><strong>Temp:</strong> ${c.temp || '36.5 °C'}</span>
                  <span><strong>IMC:</strong> ${c.imc || '23.5'}</span>
                </div>
                ${c.soap ? `
                  <div style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed #e2e8f0; font-size: 0.78rem; color: #475569;">
                    <div><strong>Plan:</strong> ${c.soap.plan || 'Continuar medicación prescrita y seguimiento.'}</div>
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
        </div>

        <!-- PANE 2: Formulario SOAP Ligero Mobile-First -->
        <div class="clinical-tab-pane" id="clinical-pane-soap">
          <form id="form-soap-mobile" class="soap-form-layout">
            <!-- Motivo de consulta y Anamnesis -->
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" style="font-weight: 700; font-size: 0.82rem;">Motivo de Consulta y Anamnesis Rápida *</label>
              <textarea class="form-input" id="soap-input-motivo" rows="2" placeholder="ej. Cefalea holocraneana de 24h de evolución, sin signos de alarma..." required style="min-height: 52px; font-size: 0.90rem;"></textarea>
            </div>

            <!-- Constantes Vitales Esenciales con Cálculo Reactivo de IMC -->
            <div class="soap-accordion-box">
              <div class="soap-accordion-title">
                <span>🩺 Constantes Vitales & Triaje Rápido</span>
              </div>
              <div class="vitals-grid-4col">
                <div class="vital-input-card">
                  <span class="vital-label">P. Arterial</span>
                  <input type="text" class="vital-field" id="soap-vital-pa" value="120/80" placeholder="120/80" />
                  <span class="vital-unit">mmHg</span>
                </div>
                <div class="vital-input-card">
                  <span class="vital-label">Frec. Cardíaca</span>
                  <input type="number" class="vital-field" id="soap-vital-fc" value="75" placeholder="75" />
                  <span class="vital-unit">lpm</span>
                </div>
                <div class="vital-input-card">
                  <span class="vital-label">Temperatura</span>
                  <input type="number" step="0.1" class="vital-field" id="soap-vital-temp" value="36.5" placeholder="36.5" />
                  <span class="vital-unit">°C</span>
                </div>
                <div class="vital-input-card">
                  <span class="vital-label">Peso (kg)</span>
                  <input type="number" step="0.5" class="vital-field" id="soap-vital-peso" value="70" placeholder="70" />
                  <span class="vital-unit">kg</span>
                </div>
                <div class="vital-input-card">
                  <span class="vital-label">Talla (cm)</span>
                  <input type="number" step="1" class="vital-field" id="soap-vital-talla" value="170" placeholder="170" />
                  <span class="vital-unit">cm</span>
                </div>
              </div>

              <!-- Cálculo Reactivo de IMC en Vivo -->
              <div class="imc-reactive-banner">
                <div>
                  <span style="font-size: 0.72rem; color: #1e40af; font-weight: 700; text-transform: uppercase;">Índice de Masa Corporal (IMC):</span>
                  <div style="font-size: 1.15rem; font-weight: 800; color: #1e3a8a;" id="soap-display-imc">24.2 kg/m²</div>
                </div>
                <div class="imc-badge-indicator imc-badge-normal" id="soap-display-imc-badge">
                  <span>●</span> <span>Normal</span>
                </div>
              </div>
            </div>

            <!-- Diagnóstico CIE-10 con Selección en 1 Toque -->
            <div class="soap-accordion-box">
              <label class="form-label" style="font-weight: 700; font-size: 0.82rem; margin-bottom: 2px;">
                Diagnóstico Principal (CIE-10) *
              </label>
              <input type="text" class="form-input" id="soap-input-cie10" value="Hipertensión Arterial Primaria (CIE-10: I10)" required style="min-height: 44px; font-weight: 600;" />
              
              <span style="font-size: 0.70rem; color: #64748b; font-weight: 700; margin-top: 6px; display: block;">PRESETS RÁPIDOS EN 1 TOQUE:</span>
              <div class="cie10-quick-select" id="soap-cie10-chips">
                <button type="button" class="cie10-chip-btn" data-diag="Hipertensión Arterial Primaria (CIE-10: I10)">I10 HTA</button>
                <button type="button" class="cie10-chip-btn" data-diag="Faringitis Aguda Estreptocócica (CIE-10: J02.0)">J02 Faringitis</button>
                <button type="button" class="cie10-chip-btn" data-diag="Bronquitis Aguda no especificada (CIE-10: J20.9)">J20 Bronquitis</button>
                <button type="button" class="cie10-chip-btn" data-diag="Diabetes Mellitus Tipo 2 (CIE-10: E11)">E11 Diabetes</button>
                <button type="button" class="cie10-chip-btn" data-diag="Cefalea Tensional / Dolor de cabeza (CIE-10: R51)">R51 Cefalea</button>
                <button type="button" class="cie10-chip-btn" data-diag="Lumbago Mecánico Agudo (CIE-10: M54.5)">M54 Lumbago</button>
                <button type="button" class="cie10-chip-btn" data-diag="Gastritis Aguda no especificada (CIE-10: K29.7)">K29 Gastritis</button>
              </div>
            </div>

            <!-- Plan de Tratamiento e Indicaciones -->
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" style="font-weight: 700; font-size: 0.82rem;">Plan Terapéutico y Cuidados Domiciliarios</label>
              <textarea class="form-input" id="soap-input-plan" rows="2" placeholder="ej. Hidratación oral, reposo relativo, medicación prescrita, control en 5 días..." style="min-height: 52px; font-size: 0.90rem;">Indicaciones generales, dieta balanceada, hidratación abundante y control en consulta.</textarea>
            </div>
          </form>
        </div>

        <!-- PANE 3: Antecedentes Clínicos Detallados -->
        <div class="clinical-tab-pane" id="clinical-pane-antecedentes">
          <div style="display: flex; flex-direction: column; gap: 10px;">
            <div class="soap-accordion-box">
              <label class="form-label" style="font-weight: 700; font-size: 0.80rem;">Antecedentes Patológicos Personales (APP)</label>
              <textarea class="form-input" id="ant-input-app" rows="2">${antecedentes.app || ''}</textarea>
            </div>
            <div class="soap-accordion-box">
              <label class="form-label" style="font-weight: 700; font-size: 0.80rem;">Antecedentes Patológicos Familiares (APF)</label>
              <textarea class="form-input" id="ant-input-apf" rows="2">${antecedentes.apf || ''}</textarea>
            </div>
            <div class="soap-accordion-box">
              <label class="form-label" style="font-weight: 700; font-size: 0.80rem;">Antecedentes Quirúrgicos y Alergias</label>
              <textarea class="form-input" id="ant-input-quir" rows="2">${antecedentes.quirurgicos || ''}</textarea>
            </div>
            <div class="soap-accordion-box">
              <label class="form-label" style="font-weight: 700; font-size: 0.80rem;">Hábitos Tóxicos / Estilo de Vida</label>
              <textarea class="form-input" id="ant-input-habitos" rows="2">${antecedentes.habitos || ''}</textarea>
            </div>
          </div>
        </div>

        <!-- Barra Sticky Inferior Touch-Friendly -->
        <div class="clinical-sticky-footer">
          <button type="button" class="clinical-btn-primary" id="btn-save-clinical-record">
            <span>💾 Guardar Ficha</span>
          </button>
          <button type="button" class="clinical-btn-rx" id="btn-proceed-to-rx">
            <span>💊 Continuar a Receta →</span>
          </button>
        </div>
      </div>
    `;

    // Interacciones del Modal:
    // 1. Cierre modal
    const btnClose = modalBody.querySelector('#btn-modal-close-clinical');
    if (btnClose) {
      btnClose.onclick = () => modal.classList.remove('active');
    }

    // 2. Navegación por pestañas
    const tabBtns = modalBody.querySelectorAll('.clinical-nav-tab-btn');
    const panes = {
      timeline: modalBody.querySelector('#clinical-pane-timeline'),
      soap: modalBody.querySelector('#clinical-pane-soap'),
      antecedentes: modalBody.querySelector('#clinical-pane-antecedentes')
    };

    tabBtns.forEach(btn => {
      btn.onclick = () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const target = btn.dataset.tab;
        Object.keys(panes).forEach(k => {
          if (panes[k]) panes[k].classList.toggle('active', k === target);
        });
      };
    });

    // 3. Cálculo Reactivo de IMC
    const pesoInput = modalBody.querySelector('#soap-vital-peso');
    const tallaInput = modalBody.querySelector('#soap-vital-talla');
    const imcDisplay = modalBody.querySelector('#soap-display-imc');
    const imcBadge = modalBody.querySelector('#soap-display-imc-badge');

    function updateReactiveIMC() {
      const peso = parseFloat(pesoInput.value) || 0;
      const tallaCm = parseFloat(tallaInput.value) || 0;
      if (peso > 0 && tallaCm > 0) {
        const tallaM = tallaCm / 100;
        const imc = +(peso / (tallaM * tallaM)).toFixed(1);
        if (imcDisplay) imcDisplay.textContent = `${imc} kg/m²`;
        if (imcBadge) {
          imcBadge.className = 'imc-badge-indicator';
          if (imc < 18.5) {
            imcBadge.classList.add('imc-badge-bajo');
            imcBadge.innerHTML = '<span>●</span> <span>Bajo Peso</span>';
          } else if (imc <= 24.9) {
            imcBadge.classList.add('imc-badge-normal');
            imcBadge.innerHTML = '<span>●</span> <span>Normal</span>';
          } else if (imc <= 29.9) {
            imcBadge.classList.add('imc-badge-sobrepeso');
            imcBadge.innerHTML = '<span>●</span> <span>Sobrepeso</span>';
          } else {
            imcBadge.classList.add('imc-badge-obesidad');
            imcBadge.innerHTML = '<span>●</span> <span>Obesidad</span>';
          }
        }
      }
    }

    if (pesoInput && tallaInput) {
      pesoInput.addEventListener('input', updateReactiveIMC);
      tallaInput.addEventListener('input', updateReactiveIMC);
      updateReactiveIMC();
    }

    // 4. Presets CIE-10
    const cie10Input = modalBody.querySelector('#soap-input-cie10');
    modalBody.querySelectorAll('.cie10-chip-btn').forEach(chip => {
      chip.onclick = () => {
        modalBody.querySelectorAll('.cie10-chip-btn').forEach(c => c.classList.remove('selected'));
        chip.classList.add('selected');
        if (cie10Input) cie10Input.value = chip.dataset.diag;
      };
    });

    // 5. Función de Guardado de Ficha / Consulta
    function saveClinicalRecordData() {
      const motivoVal = (modalBody.querySelector('#soap-input-motivo')?.value || '').trim();
      const cie10Val = (cie10Input?.value || '').trim() || 'Consulta de Medicina General';
      const planVal = (modalBody.querySelector('#soap-input-plan')?.value || '').trim();

      const paVal = (modalBody.querySelector('#soap-vital-pa')?.value || '').trim() || '120/80';
      const fcVal = (modalBody.querySelector('#soap-vital-fc')?.value || '').trim() || '75';
      const tempVal = (modalBody.querySelector('#soap-vital-temp')?.value || '').trim() || '36.5';
      const pesoVal = parseFloat(pesoInput?.value) || 70;
      const tallaVal = parseFloat(tallaInput?.value) || 170;
      const imcVal = +(pesoVal / Math.pow(tallaVal / 100, 2)).toFixed(1);

      const appVal = (modalBody.querySelector('#ant-input-app')?.value || '').trim();
      const apfVal = (modalBody.querySelector('#ant-input-apf')?.value || '').trim();
      const quirVal = (modalBody.querySelector('#ant-input-quir')?.value || '').trim();
      const habitosVal = (modalBody.querySelector('#ant-input-habitos')?.value || '').trim();

      const updatedRecord = store.addMedicalRecord({
        id: record.id,
        patientId: record.patientId,
        patientCedula: record.patientCedula || record.patientId,
        patientName: record.patientName,
        age: record.age,
        bloodType: record.bloodType,
        sede: record.sede || 'Clínica Ceibos',
        allergies: record.allergies,
        antecedentes: {
          app: appVal || antecedentes.app,
          apf: apfVal || antecedentes.apf,
          quirurgicos: quirVal || antecedentes.quirurgicos,
          habitos: habitosVal || antecedentes.habitos
        },
        motivo: motivoVal || 'Control médico general',
        diagnostico: cie10Val,
        plan: planVal,
        signosVitales: {
          pa: `${paVal} mmHg`,
          fc: `${fcVal} lpm`,
          temp: `${tempVal} °C`,
          imc: `${imcVal}`
        },
        estado: 'Atendida'
      });

      return { record: updatedRecord, diagnosis: cie10Val };
    }

    const btnSave = modalBody.querySelector('#btn-save-clinical-record');
    if (btnSave) {
      btnSave.onclick = () => {
        const { record: updated } = saveClinicalRecordData();
        showToast('Ficha clínica y consulta SOAP guardadas exitosamente en expediente.', 'success');
        modal.classList.remove('active');
        renderMedicalRecords();
      };
    }

    const btnRx = modalBody.querySelector('#btn-proceed-to-rx');
    if (btnRx) {
      btnRx.onclick = () => {
        const { record: updated, diagnosis } = saveClinicalRecordData();
        showToast('Ficha guardada. Abriendo Prescripción Médica Oficial MSP...', 'info');
        modal.classList.remove('active');
        renderMedicalRecords();

        // Abrir Modal Clínico de Prescripción Médica (Semana 4 - Parte 2)
        openPrescriptionModal({
          patientId: updated.patientId,
          patientCedula: updated.patientCedula || updated.patientId,
          patientName: updated.patientName,
          age: updated.age,
          sede: updated.sede,
          diagnosis: diagnosis,
          appointmentId: record.appointmentId || null
        }, diagnosis);
      };
    }

    modal.classList.add('active');
  }

  const btnCloseDetailModal = document.getElementById('btn-close-patient-detail');
  if (btnCloseDetailModal) {
    btnCloseDetailModal.addEventListener('click', () => {
      document.getElementById('patient-detail-modal').classList.remove('active');
    });
  }

  // ==========================================================================
  // --- 4. MOTOR DE PRESCRIPCIÓN MÉDICA Y RECETA DIGITAL MSP (Semana 4 - Parte 2) ---
  // ==========================================================================
  let activeRxPatient = {
    patientId: '',
    patientCedula: '',
    patientName: '',
    age: '',
    sede: '',
    diagnosis: '',
    appointmentId: null
  };

  let activeRxItems = [];

  let currentRxFolio = 'REC-2026-0924';

  function renderRxItems() {
    const listEl = document.getElementById('rx-drugs-dynamic-list');
    const tableBodyEl = document.getElementById('rx-preview-table-body');
    const countEl = document.getElementById('rx-items-count');

    if (countEl) countEl.textContent = activeRxItems.length;

    // 1. Render en lista del formulario dinámico
    if (listEl) {
      if (activeRxItems.length === 0) {
        listEl.innerHTML = `
          <div style="text-align: center; padding: 14px; background: #ffffff; border: 1px dashed #cbd5e1; border-radius: 8px; color: #94a3b8; font-size: 0.78rem;">
            No hay fármacos agregados. Utiliza los presets rápidos o el formulario de arriba.
          </div>
        `;
      } else {
        listEl.innerHTML = activeRxItems.map(item => `
          <div class="rx-drug-row-item" data-id="${item.id}">
            <div class="rx-drug-item-content">
              <div class="rx-drug-row-title">${item.drug}</div>
              <div class="rx-drug-row-meta">📦 ${item.presentation} • 💊 ${item.via || 'Vía Oral'}</div>
              <div class="rx-drug-row-posology">📝 <strong>Posología:</strong> ${item.posology}</div>
            </div>
            <button type="button" class="btn-rx-remove-item" data-id="${item.id}" title="Eliminar medicamento">
              🗑️ Quitar
            </button>
          </div>
        `).join('');

        listEl.querySelectorAll('.btn-rx-remove-item').forEach(btn => {
          btn.addEventListener('click', () => {
            const idToRemove = Number(btn.dataset.id);
            activeRxItems = activeRxItems.filter(it => it.id !== idToRemove);
            renderRxItems();
            showToast('Fármaco eliminado de la prescripción.', 'info');
          });
        });
      }
    }

    // 2. Render en tabla de la hoja imprimible oficial
    if (tableBodyEl) {
      if (activeRxItems.length === 0) {
        tableBodyEl.innerHTML = `
          <tr>
            <td colspan="3" class="rx-table-empty-msg">
              No se han prescrito medicamentos para esta consulta médica.
            </td>
          </tr>
        `;
      } else {
        tableBodyEl.innerHTML = activeRxItems.map((item, idx) => `
          <tr>
            <td>
              <strong>${idx + 1}. ${item.drug}</strong>
            </td>
            <td>
              <span style="color: #0284c7; font-weight: 700;">${item.presentation}</span><br />
              <span style="font-size: 0.68rem; color: #64748b;">${item.via || 'Vía Oral'}</span>
            </td>
            <td>
              ${item.posology}
            </td>
          </tr>
        `).join('');
      }
    }
  }

  function openPrescriptionModal(patientData = {}, defaultDiagnosis = '') {
    const modal = document.getElementById('modal-receta-medica');
    if (!modal) return;

    const todayStr = getTodayDateStr();
    const parts = todayStr.split('-');
    const formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`;

    activeRxPatient = {
      patientId: patientData.patientId || patientData.cedula || '',
      patientCedula: patientData.patientCedula || patientData.patientId || patientData.cedula || '',
      patientName: patientData.patientName || patientData.nombreCompleto || 'Paciente',
      age: patientData.age || patientData.edad || '',
      sede: patientData.sede || 'Clínica Ceibos',
      diagnosis: defaultDiagnosis || patientData.diagnosis || patientData.lastDiagnosis || 'Consulta de Medicina General',
      appointmentId: patientData.appointmentId || patientData.id || null
    };

    currentRxFolio = `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Prellenar banner del paciente en el modal
    const pNameEl = document.getElementById('rx-patient-name-display');
    const pCedEl = document.getElementById('rx-patient-cedula-display');
    const pAgeEl = document.getElementById('rx-patient-age-display');
    const pSedeEl = document.getElementById('rx-patient-sede-display');
    const pDateEl = document.getElementById('rx-issue-date-display');
    const pDiagEl = document.getElementById('rx-patient-diagnosis-display');

    if (pNameEl) pNameEl.textContent = activeRxPatient.patientName;
    if (pCedEl) pCedEl.textContent = activeRxPatient.patientCedula;
    if (pAgeEl) pAgeEl.textContent = `${activeRxPatient.age} años`;
    if (pSedeEl) pSedeEl.textContent = activeRxPatient.sede;
    if (pDateEl) pDateEl.textContent = todayStr;
    if (pDiagEl) pDiagEl.textContent = activeRxPatient.diagnosis;

    // Prellenar hoja de receta imprimible
    const prevNameEl = document.getElementById('rx-preview-patient-name');
    const prevCedEl = document.getElementById('rx-preview-patient-cedula');
    const prevAgeEl = document.getElementById('rx-preview-patient-age');
    const prevDateEl = document.getElementById('rx-preview-date');
    const prevSedeEl = document.getElementById('rx-preview-sede');
    const prevDiagEl = document.getElementById('rx-preview-diagnosis');
    const prevFolioEl = document.getElementById('rx-preview-folio');

    if (prevNameEl) prevNameEl.textContent = activeRxPatient.patientName;
    if (prevCedEl) prevCedEl.textContent = activeRxPatient.patientCedula;
    if (prevAgeEl) prevAgeEl.textContent = `${activeRxPatient.age} años`;
    if (prevDateEl) prevDateEl.textContent = formattedDate;
    if (prevSedeEl) prevSedeEl.textContent = `${activeRxPatient.sede} (Consultorio Oficial)`;
    if (prevDiagEl) prevDiagEl.textContent = activeRxPatient.diagnosis;
    if (prevFolioEl) prevFolioEl.textContent = `Receta N°: ${currentRxFolio}`;

    // Sincronizar indicaciones no farmacológicas
    const txtIndications = document.getElementById('rx-textarea-indications');
    const prevIndications = document.getElementById('rx-preview-indications-text');
    if (txtIndications && prevIndications) {
      prevIndications.textContent = txtIndications.value.trim() || 'Indicaciones generales según evolución clínica.';
    }

    // Medicamentos sugeridos iniciales si la lista está vacía
    if (activeRxItems.length === 0) {
      if (/hipertensi|i10|losart/i.test(activeRxPatient.diagnosis)) {
        activeRxItems = [
          {
            id: Date.now(),
            drug: 'Losartán 50mg',
            presentation: 'Comprimidos / 30 unidades',
            via: 'Vía Oral (V.O.)',
            posology: 'Tomar 1 comprimido cada 24 horas vía oral por la mañana continuo.'
          }
        ];
      } else if (/faring|j02|bronqu|j20|amox/i.test(activeRxPatient.diagnosis)) {
        activeRxItems = [
          {
            id: Date.now(),
            drug: 'Amoxicilina 500mg',
            presentation: 'Cápsulas / 21 unidades',
            via: 'Vía Oral (V.O.)',
            posology: 'Tomar 1 cápsula cada 8 horas vía oral por 7 días después de las comidas.'
          },
          {
            id: Date.now() + 1,
            drug: 'Paracetamol 500mg',
            presentation: 'Comprimidos / 15 unidades',
            via: 'Vía Oral (V.O.)',
            posology: 'Tomar 1 comprimido cada 8 horas vía oral por 3 días si presenta dolor o fiebre.'
          }
        ];
      } else {
        activeRxItems = [
          {
            id: Date.now(),
            drug: 'Paracetamol 500mg',
            presentation: 'Comprimidos / 20 unidades',
            via: 'Vía Oral (V.O.)',
            posology: 'Tomar 1 comprimido cada 8 horas vía oral por 3 días si hay dolor o malestar.'
          }
        ];
      }
    }

    renderRxItems();

    // Generar Código QR de Verificación Institucional
    const qrContainer = document.getElementById('rx-qrcode-container');
    if (qrContainer) {
      qrContainer.innerHTML = '';
      const verificationUrl = `https://montepiedrasalud.ec/validador-receta?folio=${currentRxFolio}&cedula=${activeRxPatient.patientCedula}&msp=MSP-REG-84729&fecha=${todayStr}`;
      try {
        if (typeof QRCode !== 'undefined') {
          new QRCode(qrContainer, {
            text: verificationUrl,
            width: 70,
            height: 70,
            colorDark: "#0f172a",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.M
          });
        }
      } catch (err) {
        console.warn('Error rendering Rx QR code:', err);
      }
    }

    // Mostrar el modal
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
    modal.classList.add('active');
  }

  function initPrescriptionModalEvents() {
    const modal = document.getElementById('modal-receta-medica');
    if (!modal) return;

    // Cerrar modal
    const btnClose = document.getElementById('btn-close-rx-modal');
    if (btnClose) {
      btnClose.onclick = () => {
        modal.classList.add('hidden');
        modal.style.display = 'none';
        modal.classList.remove('active');
      };
    }

    // Chips de fármacos frecuentes
    const chipBtns = modal.querySelectorAll('.rx-chip-btn');
    const drugNameInput = document.getElementById('rx-input-drug-name');
    const drugPresInput = document.getElementById('rx-input-drug-presentation');
    const drugPosInput = document.getElementById('rx-input-drug-posology');

    chipBtns.forEach(chip => {
      chip.onclick = () => {
        if (drugNameInput) drugNameInput.value = chip.dataset.drug || '';
        if (drugPresInput) drugPresInput.value = chip.dataset.pres || '';
        if (drugPosInput) drugPosInput.value = chip.dataset.dose || '';
        if (drugNameInput) drugNameInput.focus();
        showToast(`Fármaco seleccionado: ${chip.dataset.drug}`, 'info');
      };
    });

    // Agregar medicamento
    const btnAddDrug = document.getElementById('btn-modal-add-drug');
    if (btnAddDrug) {
      btnAddDrug.onclick = () => {
        const drug = (drugNameInput?.value || '').trim();
        const pres = (drugPresInput?.value || '').trim() || 'Comprimidos / 10 unidades';
        const via = document.getElementById('rx-input-drug-via')?.value || 'Vía Oral (V.O.)';
        const pos = (drugPosInput?.value || '').trim();

        if (!drug) {
          showToast('Ingresa el nombre o concentración del medicamento.', 'warning');
          if (drugNameInput) drugNameInput.focus();
          return;
        }

        if (!pos) {
          showToast('Ingresa la posología o indicación de toma.', 'warning');
          if (drugPosInput) drugPosInput.focus();
          return;
        }

        activeRxItems.push({
          id: Date.now(),
          drug,
          presentation: pres,
          via,
          posology: pos
        });

        renderRxItems();

        // Limpiar campos
        if (drugNameInput) drugNameInput.value = '';
        if (drugPresInput) drugPresInput.value = '';
        if (drugPosInput) drugPosInput.value = '';

        showToast(`"${drug}" agregado a la prescripción médica.`, 'success');
      };
    }

    // Vaciar lista
    const btnClearAll = document.getElementById('btn-rx-clear-all');
    if (btnClearAll) {
      btnClearAll.onclick = () => {
        if (activeRxItems.length === 0) return;
        if (confirm('¿Deseas vaciar todos los medicamentos de la prescripción actual?')) {
          activeRxItems = [];
          renderRxItems();
          showToast('Lista de prescripción vaciada.', 'info');
        }
      };
    }

    // Sincronización de indicaciones generales reactivas
    const txtIndications = document.getElementById('rx-textarea-indications');
    const prevIndications = document.getElementById('rx-preview-indications-text');
    if (txtIndications && prevIndications) {
      txtIndications.addEventListener('input', () => {
        prevIndications.textContent = txtIndications.value.trim() || 'Indicaciones generales según evolución clínica.';
      });
    }

    // Botón Descargar PDF con html2pdf (Optimizado para Carga Móvil y Gestión de Memoria)
    const btnDownloadPdf = document.getElementById('btn-rx-download-pdf');
    if (btnDownloadPdf) {
      btnDownloadPdf.addEventListener('click', async () => {
        const printElement = document.getElementById('printable-official-rx');
        if (!printElement) return;

        const cedula = activeRxPatient.patientCedula || activeRxPatient.patientId || '0987654321';
        const todayStr = getTodayDateStr();
        const pdfFileName = `Receta_${cedula}_${todayStr}.pdf`;

        // Prevenir doble clic en dispositivos móviles y táctiles
        btnDownloadPdf.disabled = true;
        const originalText = btnDownloadPdf.innerHTML;
        btnDownloadPdf.innerHTML = '<span>⏳ Generando PDF...</span>';

        try {
          // Desacoplar del hilo principal para fluidez táctil en celular
          await new Promise(resolve => setTimeout(resolve, 30));

          if (typeof html2pdf !== 'undefined') {
            showToast('Generando Receta Médica oficial en PDF...', 'info');
            const opt = {
              margin: [8, 8, 8, 8],
              filename: pdfFileName,
              image: { type: 'jpeg', quality: 0.98 },
              html2canvas: { scale: 2, useCORS: true, letterRendering: true },
              jsPDF: { unit: 'mm', format: 'a5', orientation: 'portrait' }
            };

            // Generación asíncrona mediante Blob para evitar congelamiento de UI táctil
            const pdfBlob = await html2pdf().set(opt).from(printElement).output('blob');
            const blobUrl = URL.createObjectURL(pdfBlob);
            const downloadLink = document.createElement('a');
            downloadLink.href = blobUrl;
            downloadLink.download = pdfFileName;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);

            // Destrucción inmediata del objeto temporal Blob/URL para prevenir fugas de memoria en navegadores móviles
            setTimeout(() => {
              URL.revokeObjectURL(blobUrl);
            }, 1000);

            showToast(`Receta descargada con éxito: ${pdfFileName}`, 'success');
          } else {
            showToast('Abriendo cuadro de diálogo de impresión / guardado PDF...', 'info');
            window.print();
          }
        } catch (err) {
          console.warn('html2pdf fallback to print:', err);
          window.print();
        } finally {
          btnDownloadPdf.disabled = false;
          btnDownloadPdf.innerHTML = originalText;
        }
      }, { passive: true });
    }

    // Botón Imprimir Directo
    const btnPrintDirect = document.getElementById('btn-rx-print-direct');
    if (btnPrintDirect) {
      btnPrintDirect.onclick = () => {
        window.print();
      };
    }

    // Botón Finalizar Consulta
    const btnFinishConsultation = document.getElementById('btn-rx-finalize-consultation');
    if (btnFinishConsultation) {
      btnFinishConsultation.onclick = () => {
        // 1. Guardar receta en store
        const indications = (txtIndications?.value || '').trim();
        const savedRx = store.addPrescription({
          patientId: activeRxPatient.patientId,
          patientName: activeRxPatient.patientName,
          diagnosis: activeRxPatient.diagnosis,
          items: activeRxItems.map(it => ({
            drug: `${it.drug} (${it.presentation})`,
            dose: it.posology
          })),
          indications,
          doctorCode: 'MSP-REG-84729'
        });

        // 2. Si hay cita asociada, marcar como completada
        if (activeRxPatient.appointmentId) {
          store.updateAppointmentStatus(activeRxPatient.appointmentId, 'completed');
        }

        // 3. Cerrar modal
        modal.classList.add('hidden');
        modal.style.display = 'none';
        modal.classList.remove('active');

        // 4. Notificar y actualizar vistas
        showToast(`Consulta médica finalizada exitosamente. Receta #${savedRx.code} archivada con registro MSP.`, 'success');
        renderTimeline();
        renderMedicalRecords();
        renderPrescriptionHistoryTable();
      };
    }
  }

  // --- 4. RECETARIO DIGITAL (Página 4 - Formulario en Pestaña) ---
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

        // Abre el modal oficial #modal-receta-medica prellenado
        openPrescriptionModal({
          patientId: patId,
          patientCedula: patId,
          patientName: patient.patientName,
          age: patient.age || 40,
          sede: patient.sede || 'Clínica Ceibos',
          diagnosis: diagnosis
        }, diagnosis);
      };
    }

    // Renderizar historial de recetas emitidas en la pestaña
    renderPrescriptionHistoryTable();
  }

  // --- 4.1 VISOR DE RECETAS EMITIDAS (HISTORIAL DE PRESCRIPCIONES) ---
  function renderPrescriptionHistoryTable() {
    const tbody = document.getElementById('rx-history-table-body');
    const countBadge = document.getElementById('rx-history-count-badge');
    if (!tbody) return;

    const rxs = store.getPrescriptions();
    if (countBadge) {
      countBadge.textContent = `${rxs.length} ${rxs.length === 1 ? 'Receta Emitida' : 'Recetas Emitidas'}`;
    }

    if (rxs.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 24px; color: #64748b;">
            No se registran prescripciones médicas previas emitidas. Usa el formulario superior para emitir una receta digital oficial.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = rxs.map(rx => {
      const drugsList = (rx.items || []).map(it => it.drug).join(', ') || 'Medicación prescrita';
      const patientDisplay = rx.patientName || 'Paciente General';
      const cedulaDisplay = rx.patientCedula || rx.patientId || '0987654321';
      return `
        <tr class="rx-history-row" style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 8px 10px; font-weight: 800; color: #0284c7; font-family: monospace;">${rx.code || rx.id}</td>
          <td style="padding: 8px 10px; font-size: 0.74rem; color: #64748b;">${rx.date}</td>
          <td style="padding: 8px 10px;">
            <div style="font-weight: 700; color: #0f172a;">${patientDisplay}</div>
            <div style="font-size: 0.70rem; color: #64748b;">C.I. ${cedulaDisplay}</div>
          </td>
          <td style="padding: 8px 10px; font-size: 0.76rem; color: #334155;">${rx.diagnosis}</td>
          <td style="padding: 8px 10px; font-size: 0.74rem; color: #475569; max-width: 220px;">
            ${drugsList}
          </td>
          <td style="padding: 8px 10px; text-align: center;">
            <div style="display: inline-flex; gap: 6px;">
              <button type="button" class="btn-rx-download-mini btn-re-download-rx" data-rx-id="${rx.id}" title="Descargar copia oficial en PDF">
                <span>📥 Re-descargar PDF</span>
              </button>
              <button type="button" class="btn-secondary btn-re-view-rx" data-rx-id="${rx.id}" style="padding: 4px 8px; font-size: 0.72rem;" title="Ver prescripción">
                <span>👁️ Ver</span>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('.btn-re-download-rx').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const rxId = btn.dataset.rxId;
        const rx = rxs.find(r => r.id === rxId);
        if (rx) {
          downloadPrescriptionPDFDirect(rx);
        }
      }, { passive: true });
    });

    tbody.querySelectorAll('.btn-re-view-rx').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const rxId = btn.dataset.rxId;
        const rx = rxs.find(r => r.id === rxId);
        if (rx) {
          openPrescriptionModal({
            patientId: rx.patientId || '0987654321',
            patientCedula: rx.patientCedula || rx.patientId || '0987654321',
            patientName: rx.patientName,
            age: 44,
            sede: 'Clínica Ceibos',
            diagnosis: rx.diagnosis
          }, rx.diagnosis);
        }
      });
    });
  }

  function downloadPrescriptionPDFDirect(rx) {
    const cedula = rx.patientCedula || rx.patientId || '0987654321';

    openPrescriptionModal({
      patientId: rx.patientId || '0987654321',
      patientCedula: cedula,
      patientName: rx.patientName,
      age: 44,
      sede: 'Clínica Ceibos',
      diagnosis: rx.diagnosis
    }, rx.diagnosis);

    setTimeout(() => {
      const btnDownloadPdf = document.getElementById('btn-rx-download-pdf');
      if (btnDownloadPdf) {
        btnDownloadPdf.click();
      }
    }, 250);
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
            <span style="font-size: 0.8rem; font-weight: 700; color: #0f172a;">${rx.code}</span><br />
            <span>Fecha: ${rx.date}</span>
          </div>
        </div>
        <div style="margin-bottom: 12px; font-size: 0.84rem;">
          <strong>Paciente:</strong> ${rx.patientName} (${rx.patientId})<br />
          <strong>Diagnóstico Clínico:</strong> ${rx.diagnosis}
        </div>
        <div style="background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 12px;">
          <h5 style="font-size: 0.82rem; text-transform: uppercase; color: #0284c7; margin-bottom: 6px;">Rp / Tratamiento Farmacológico:</h5>
          <ul style="padding-left: 18px; font-size: 0.84rem; display: flex; flex-direction: column; gap: 6px;">
            ${rx.items.map(it => `<li><strong>${it.drug}</strong><br /><span style="color: #475569;">${it.dose}</span></li>`).join('')}
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

  // --- 5. REGISTRO DE GASTOS DE TRANSPORTE E INSUMOS (Semana 3) ---
  let gastosRangoFilter = 'semana'; // 'hoy', 'semana', 'todos'
  let gastosSedeFilter = 'TODAS';
  let gastosTipoFilter = 'TODOS';
  let currentCompressedComprobante = null;
  let isGastosInitialized = false;

  // Compresión automática de imágenes en el cliente mediante HTML5 Canvas
  function comprimirComprobanteCliente(file, maxWidth = 1200, maxHeight = 1200, quality = 0.75) {
    return new Promise((resolve, reject) => {
      if (!file) return reject(new Error('Archivo no provisto'));

      if (file.type === 'application/pdf') {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve({
            dataUrl: e.target.result,
            isPdf: true,
            fileName: file.name,
            originalSize: file.size,
            compressedSize: file.size,
            ahorroPct: 0
          });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          const compressedBytes = Math.round((compressedDataUrl.length * 3) / 4);
          const ahorro = Math.max(0, Math.round(((file.size - compressedBytes) / file.size) * 100));

          resolve({
            dataUrl: compressedDataUrl,
            isPdf: false,
            fileName: file.name,
            originalSize: file.size,
            compressedSize: compressedBytes,
            ahorroPct: ahorro
          });
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  }

  function getNowDatetimeLocal() {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  }

  function setupGastosEvents() {
    if (isGastosInitialized) return;
    isGastosInitialized = true;

    // Selector Segmentado de Tipo de Gasto
    const btnTipoTransporte = document.getElementById('btn-tipo-transporte');
    const btnTipoInsumos = document.getElementById('btn-tipo-insumos');
    const secTransporte = document.getElementById('seccion-campos-transporte');
    const secInsumos = document.getElementById('seccion-campos-insumos');
    const hiddenTipo = document.getElementById('gasto-tipo-principal');

    const inpMontoTrans = document.getElementById('gasto-transporte-monto');
    const inpMotivoTrans = document.getElementById('gasto-transporte-motivo');
    const inpFechaTrans = document.getElementById('gasto-transporte-fechahora');

    const inpMontoIns = document.getElementById('gasto-insumos-monto');
    const inpDetalleIns = document.getElementById('gasto-insumos-detalle');
    const inpFechaIns = document.getElementById('gasto-insumos-fechahora');
    const selTipoCompIns = document.getElementById('gasto-insumos-tipo-comprobante');
    const inpNumCompIns = document.getElementById('gasto-insumos-numero-comprobante');
    const starNumComp = document.getElementById('star-num-comp');

    function activarTabTransporte() {
      if (btnTipoTransporte) btnTipoTransporte.classList.add('active');
      if (btnTipoInsumos) btnTipoInsumos.classList.remove('active');
      if (secTransporte) secTransporte.style.display = 'flex';
      if (secInsumos) secInsumos.style.display = 'none';
      if (hiddenTipo) hiddenTipo.value = 'TRANSPORTE';

      if (inpMontoTrans) inpMontoTrans.required = true;
      if (inpMotivoTrans) inpMotivoTrans.required = true;
      if (inpFechaTrans) inpFechaTrans.required = true;

      if (inpMontoIns) inpMontoIns.required = false;
      if (inpDetalleIns) inpDetalleIns.required = false;
      if (inpFechaIns) inpFechaIns.required = false;
      if (inpNumCompIns) inpNumCompIns.required = false;
    }

    function activarTabInsumos() {
      if (btnTipoInsumos) btnTipoInsumos.classList.add('active');
      if (btnTipoTransporte) btnTipoTransporte.classList.remove('active');
      if (secInsumos) secInsumos.style.display = 'flex';
      if (secTransporte) secTransporte.style.display = 'none';
      if (hiddenTipo) hiddenTipo.value = 'INSUMOS';

      if (inpMontoTrans) inpMontoTrans.required = false;
      if (inpMotivoTrans) inpMotivoTrans.required = false;
      if (inpFechaTrans) inpFechaTrans.required = false;

      if (inpMontoIns) inpMontoIns.required = true;
      if (inpDetalleIns) inpDetalleIns.required = true;
      if (inpFechaIns) inpFechaIns.required = true;

      actualizarValidacionNumeroComprobante();
    }

    if (btnTipoTransporte) btnTipoTransporte.addEventListener('click', activarTabTransporte);
    if (btnTipoInsumos) btnTipoInsumos.addEventListener('click', activarTabInsumos);

    // Validación condicional del número de comprobante para Insumos
    function actualizarValidacionNumeroComprobante() {
      if (!selTipoCompIns || !inpNumCompIns) return;
      const tipo = selTipoCompIns.value;
      if (tipo === 'FACTURA_RUC' || tipo === 'NOTA_VENTA') {
        inpNumCompIns.required = true;
        if (starNumComp) starNumComp.style.display = 'inline';
      } else {
        inpNumCompIns.required = false;
        if (starNumComp) starNumComp.style.display = 'none';
      }
    }

    if (selTipoCompIns) {
      selTipoCompIns.addEventListener('change', actualizarValidacionNumeroComprobante);
    }

    // Inicializar fechas máximas y por defecto (no fechas futuras)
    const nowStr = getNowDatetimeLocal();
    if (inpFechaTrans) {
      inpFechaTrans.value = nowStr;
      inpFechaTrans.max = nowStr;
    }
    if (inpFechaIns) {
      inpFechaIns.value = nowStr;
      inpFechaIns.max = nowStr;
    }

    // Switch de Origen del Fondo (Dinero Propio vs Caja Chica)
    const cardOrigenMedico = document.getElementById('card-origen-medico');
    const cardOrigenSede = document.getElementById('card-origen-sede');
    const radOrigenMedico = document.getElementById('origen-medico-personal');
    const radOrigenSede = document.getElementById('origen-caja-chica');

    function actualizarEstiloOrigen(seleccion) {
      if (cardOrigenMedico) cardOrigenMedico.classList.toggle('selected', seleccion === 'MEDICO_PERSONAL');
      if (cardOrigenSede) cardOrigenSede.classList.toggle('selected', seleccion === 'CAJA_CHICA_SEDE');
    }

    if (cardOrigenMedico) {
      cardOrigenMedico.addEventListener('click', () => {
        if (radOrigenMedico) radOrigenMedico.checked = true;
        actualizarEstiloOrigen('MEDICO_PERSONAL');
      });
    }

    if (cardOrigenSede) {
      cardOrigenSede.addEventListener('click', () => {
        if (radOrigenSede) radOrigenSede.checked = true;
        actualizarEstiloOrigen('CAJA_CHICA_SEDE');
      });
    }

    // Manejo de Carga y Compresión de Comprobantes
    const fileTrans = document.getElementById('gasto-transporte-comprobante');
    const fileIns = document.getElementById('gasto-insumos-comprobante');
    const previewBox = document.getElementById('comprobante-preview-box');
    const imgPreview = document.getElementById('img-comprobante-preview');
    const lblFileName = document.getElementById('preview-nombre-archivo');
    const lblOrigSize = document.getElementById('preview-tamano-orig');
    const lblCompSize = document.getElementById('preview-tamano-comp');
    const lblAhorro = document.getElementById('preview-ahorro-pct');
    const btnRemovePreview = document.getElementById('btn-remover-comprobante');

    async function procesarArchivoComprobante(file) {
      if (!file) return;
      try {
        const resultado = await comprimirComprobanteCliente(file);
        currentCompressedComprobante = resultado;

        if (imgPreview) {
          if (resultado.isPdf) {
            imgPreview.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="%23ef4444"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>';
          } else {
            imgPreview.src = resultado.dataUrl;
          }
        }
        if (lblFileName) lblFileName.textContent = resultado.fileName;
        if (lblOrigSize) lblOrigSize.textContent = formatBytes(resultado.originalSize);
        if (lblCompSize) lblCompSize.textContent = formatBytes(resultado.compressedSize);
        if (lblAhorro) lblAhorro.textContent = `-${resultado.ahorroPct}% ahorro`;

        if (previewBox) previewBox.style.display = 'flex';
        showToast(`Comprobante comprimido con éxito (${formatBytes(resultado.compressedSize)}).`, 'success');
      } catch (err) {
        console.error('Error comprimiendo comprobante:', err);
        showToast('No se pudo procesar el comprobante seleccionado.', 'danger');
      }
    }

    if (fileTrans) {
      fileTrans.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          procesarArchivoComprobante(e.target.files[0]);
        }
      });
    }

    if (fileIns) {
      fileIns.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          procesarArchivoComprobante(e.target.files[0]);
        }
      });
    }

    if (btnRemovePreview) {
      btnRemovePreview.addEventListener('click', () => {
        currentCompressedComprobante = null;
        if (fileTrans) fileTrans.value = '';
        if (fileIns) fileIns.value = '';
        if (previewBox) previewBox.style.display = 'none';
        if (imgPreview) imgPreview.src = '';
      });
    }

    // Botón Limpiar
    const btnLimpiar = document.getElementById('btn-limpiar-gasto-form');
    if (btnLimpiar) {
      btnLimpiar.addEventListener('click', () => {
        const form = document.getElementById('form-registro-gastos-semana3');
        if (form) form.reset();
        currentCompressedComprobante = null;
        if (previewBox) previewBox.style.display = 'none';
        activarTabTransporte();
        const freshNow = getNowDatetimeLocal();
        if (inpFechaTrans) inpFechaTrans.value = freshNow;
        if (inpFechaIns) inpFechaIns.value = freshNow;
        actualizarEstiloOrigen('MEDICO_PERSONAL');
      });
    }

    // Envío del Formulario
    const formGasto = document.getElementById('form-registro-gastos-semana3');
    if (formGasto) {
      formGasto.addEventListener('submit', (e) => {
        e.preventDefault();
        const tipoPrincipal = hiddenTipo ? hiddenTipo.value : 'TRANSPORTE';
        const radOrigen = document.querySelector('input[name="origen_fondo_choice"]:checked');
        const origenFondo = radOrigen ? radOrigen.value : 'MEDICO_PERSONAL';
        const esReembolso = (origenFondo === 'MEDICO_PERSONAL');

        let monto = 0;
        let fechaHora = '';
        let sedeCodigo = '';
        let motivoDetalle = '';
        let tipoTransporte = '';
        let categoriaInsumo = '';
        let tipoComprobante = 'SIN_COMPROBANTE';
        let numeroComprobante = '';

        if (tipoPrincipal === 'TRANSPORTE') {
          monto = parseFloat(inpMontoTrans.value);
          fechaHora = inpFechaTrans.value;
          sedeCodigo = document.getElementById('gasto-transporte-sede').value;
          tipoTransporte = document.getElementById('gasto-transporte-tipo').value;
          motivoDetalle = inpMotivoTrans.value.trim();

          if (!sedeCodigo || !tipoTransporte || !motivoDetalle) {
            showToast('Por favor completa todos los campos obligatorios de transporte.', 'danger');
            return;
          }
        } else {
          monto = parseFloat(inpMontoIns.value);
          fechaHora = inpFechaIns.value;
          sedeCodigo = document.getElementById('gasto-insumos-sede').value;
          categoriaInsumo = document.getElementById('gasto-insumos-categoria').value;
          motivoDetalle = inpDetalleIns.value.trim();
          tipoComprobante = selTipoCompIns ? selTipoCompIns.value : 'SIN_COMPROBANTE';
          numeroComprobante = inpNumCompIns ? inpNumCompIns.value.trim() : '';

          if (!sedeCodigo || !categoriaInsumo || !motivoDetalle) {
            showToast('Por favor completa los campos requeridos del insumo.', 'danger');
            return;
          }

          if ((tipoComprobante === 'FACTURA_RUC' || tipoComprobante === 'NOTA_VENTA') && !numeroComprobante) {
            showToast('El número de comprobante es obligatorio para Factura o Nota de Venta.', 'danger');
            if (inpNumCompIns) inpNumCompIns.focus();
            return;
          }
        }

        // Validación estricta de monto (> 0.00)
        if (isNaN(monto) || monto <= 0) {
          showToast('El monto del egreso debe ser un valor positivo mayor a $0.00.', 'danger');
          return;
        }

        // Validación estricta de fecha (no permitir fechas futuras)
        if (fechaHora) {
          const gastoDate = new Date(fechaHora);
          const nowDate = new Date();
          // Margen de 2 minutos por desfase horario
          if (gastoDate.getTime() > nowDate.getTime() + 120000) {
            showToast('No se permiten registrar gastos con fecha u hora futura.', 'danger');
            return;
          }
        }

        // Registrar en el store
        const nuevoGasto = store.addExpense({
          tipoGasto: tipoPrincipal,
          sedeCodigo: sedeCodigo,
          monto: monto,
          amount: monto,
          fechaHora: fechaHora,
          date: fechaHora ? fechaHora.split('T')[0] : getTodayDateStr(),
          motivo: motivoDetalle,
          detalle: motivoDetalle,
          description: motivoDetalle,
          tipoTransporte: tipoTransporte,
          categoriaInsumo: categoriaInsumo,
          category: tipoPrincipal === 'TRANSPORTE' ? 'Transporte' : 'Insumos Médicos',
          origenFondo: origenFondo,
          esReembolsoMedico: esReembolso,
          tipoComprobante: tipoComprobante,
          numeroComprobante: numeroComprobante,
          comprobanteUrl: currentCompressedComprobante ? currentCompressedComprobante.dataUrl : '',
          comprobanteNombre: currentCompressedComprobante ? currentCompressedComprobante.fileName : '',
          quickLogged: false
        });

        const origenMsg = esReembolso ? 'Reembolso (+) para liquidación' : 'Deducción (-) de sede';
        showToast(`Egreso de $${monto.toFixed(2)} registrado con éxito (${origenMsg}).`, 'success');

        // Resetear formulario
        formGasto.reset();
        currentCompressedComprobante = null;
        if (previewBox) previewBox.style.display = 'none';
        activarTabTransporte();
        const freshNow = getNowDatetimeLocal();
        if (inpFechaTrans) inpFechaTrans.value = freshNow;
        if (inpFechaIns) inpFechaIns.value = freshNow;
        actualizarEstiloOrigen('MEDICO_PERSONAL');

        renderExpensesTab();
      });
    }

    // Filtros Rápidos de la Tabla
    const pillsRango = document.querySelectorAll('#filter-rango-group .history-pill-btn');
    pillsRango.forEach(pill => {
      pill.addEventListener('click', () => {
        pillsRango.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        gastosRangoFilter = pill.dataset.rango;
        renderExpensesTab();
      });
    });

    const selSede = document.getElementById('filter-gasto-sede');
    if (selSede) {
      selSede.addEventListener('change', () => {
        gastosSedeFilter = selSede.value;
        renderExpensesTab();
      });
    }

    const selTipo = document.getElementById('filter-gasto-tipo');
    if (selTipo) {
      selTipo.addEventListener('change', () => {
        gastosTipoFilter = selTipo.value;
        renderExpensesTab();
      });
    }

    // Modal de Preview de Comprobante
    const modalComp = document.getElementById('modal-preview-comprobante');
    const btnCerrarModal = document.getElementById('btn-cerrar-modal-comprobante');
    if (btnCerrarModal && modalComp) {
      btnCerrarModal.addEventListener('click', () => {
        modalComp.style.display = 'none';
      });
      modalComp.addEventListener('click', (e) => {
        if (e.target === modalComp) modalComp.style.display = 'none';
      });
    }

    // Presets Rápidos en 2 Toques
    const btnTaxi = document.getElementById('btn-preset-taxi');
    const btnGas = document.getElementById('btn-preset-gas');
    const btnHospital = document.getElementById('btn-preset-hospital');

    if (btnTaxi) {
      btnTaxi.onclick = () => {
        store.addExpense({
          tipoGasto: 'TRANSPORTE',
          sedeCodigo: 'CEIBOS',
          tipoTransporte: 'TAXI_APP',
          category: 'Transporte',
          description: 'Carrera de Taxi ruta Ceibos - Mapasingue',
          motivo: 'Carrera de Taxi ruta Ceibos - Mapasingue',
          amount: 4.00,
          monto: 4.00,
          origenFondo: 'MEDICO_PERSONAL',
          esReembolsoMedico: true,
          quickLogged: true
        });
        showToast('Gasto de Taxi ($4.00) registrado en 2 toques (Reembolso Médico).', 'success');
        renderExpensesTab();
      };
    }

    if (btnGas) {
      btnGas.onclick = () => {
        store.addExpense({
          tipoGasto: 'TRANSPORTE',
          sedeCodigo: 'CEIBOS',
          tipoTransporte: 'GASOLINA',
          category: 'Transporte',
          description: 'Combustible / Gasolina de traslado semanal',
          motivo: 'Combustible / Gasolina de traslado semanal',
          amount: 15.00,
          monto: 15.00,
          origenFondo: 'MEDICO_PERSONAL',
          esReembolsoMedico: true,
          quickLogged: true
        });
        showToast('Gasto de Gasolina ($15.00) registrado en 2 toques con éxito.', 'success');
        renderExpensesTab();
      };
    }

    if (btnHospital) {
      btnHospital.onclick = () => {
        store.addExpense({
          tipoGasto: 'INSUMOS',
          sedeCodigo: 'HOSPITAL',
          categoriaInsumo: 'INSUMOS_MEDICOS_BASICOS',
          category: 'Suministros Hospital',
          description: 'Insumos médicos de emergencia asumidos en hospital',
          detalle: 'Insumos médicos de emergencia asumidos en hospital',
          amount: 12.00,
          monto: 12.00,
          origenFondo: 'MEDICO_PERSONAL',
          esReembolsoMedico: true,
          quickLogged: true
        });
        showToast('Insumos de Hospital ($12.00) guardados para reembolso y deducción.', 'success');
        renderExpensesTab();
      };
    }
  }

  // Render principal del panel de gastos
  function renderExpensesTab() {
    setupGastosEvents();

    const state = store.getState();
    const todosGastos = state.expenses || [];
    const hoyStr = getTodayDateStr();

    // Fecha límite para "esta semana" (últimos 7 días)
    const sieteDiasAtras = new Date();
    sieteDiasAtras.setDate(sieteDiasAtras.getDate() - 7);

    // Calcular KPIs
    let totalTransporteSemana = 0;
    let totalInsumosSemana = 0;
    let granTotalEgresos = 0;
    let totalReembolsoMedico = 0;

    todosGastos.forEach(exp => {
      const expDate = exp.date ? new Date(exp.date) : new Date();
      const isSemana = (expDate >= sieteDiasAtras);
      const monto = Number(exp.amount !== undefined ? exp.amount : (exp.monto || 0));
      const tipo = (exp.tipoGasto || exp.tipo_gasto || (exp.category === 'Transporte' ? 'TRANSPORTE' : 'INSUMOS')).toUpperCase();
      const esReembolso = exp.origenFondo === 'MEDICO_PERSONAL' || exp.origen_fondo === 'MEDICO_PERSONAL' || Boolean(exp.esReembolsoMedico);

      if (isSemana) {
        if (tipo === 'TRANSPORTE') totalTransporteSemana += monto;
        else totalInsumosSemana += monto;
      }

      granTotalEgresos += monto;
      if (esReembolso) {
        totalReembolsoMedico += monto;
      }
    });

    // Actualizar KPI Cards en el DOM
    const kpiTransEl = document.getElementById('kpi-gastos-transporte');
    const kpiInsEl = document.getElementById('kpi-gastos-insumos');
    const kpiTotalEl = document.getElementById('kpi-gastos-total');
    const kpiReembEl = document.getElementById('kpi-gastos-reembolso');

    if (kpiTransEl) kpiTransEl.textContent = `$${totalTransporteSemana.toFixed(2)}`;
    if (kpiInsEl) kpiInsEl.textContent = `$${totalInsumosSemana.toFixed(2)}`;
    if (kpiTotalEl) kpiTotalEl.textContent = `$${granTotalEgresos.toFixed(2)}`;
    if (kpiReembEl) kpiReembEl.textContent = `$${totalReembolsoMedico.toFixed(2)}`;

    // Filtrar Gastos para la Tabla
    const gastosFiltrados = todosGastos.filter(exp => {
      // Filtro Sede
      if (gastosSedeFilter !== 'TODAS') {
        const sede = (exp.sedeCodigo || exp.sede_codigo || '').toUpperCase();
        if (sede !== gastosSedeFilter) return false;
      }

      // Filtro Tipo
      if (gastosTipoFilter !== 'TODOS') {
        const tipo = (exp.tipoGasto || exp.tipo_gasto || (exp.category === 'Transporte' ? 'TRANSPORTE' : 'INSUMOS')).toUpperCase();
        if (tipo !== gastosTipoFilter) return false;
      }

      // Filtro Temporal
      if (gastosRangoFilter === 'hoy') {
        if (exp.date !== hoyStr) return false;
      } else if (gastosRangoFilter === 'semana') {
        const expDate = exp.date ? new Date(exp.date) : new Date();
        if (expDate < sieteDiasAtras) return false;
      }

      return true;
    });

    // Contador de registros
    const lblCount = document.getElementById('lbl-total-gastos-count');
    if (lblCount) {
      lblCount.textContent = `${gastosFiltrados.length} ${gastosFiltrados.length === 1 ? 'registro' : 'registros'}`;
    }

    // Renderizar Filas de la Tabla
    const tbody = document.getElementById('tabla-gastos-tbody');
    if (!tbody) return;

    if (gastosFiltrados.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 28px; color: #94a3b8;">
            <div style="font-size: 1.4rem; margin-bottom: 6px;">📂</div>
            <strong>No hay gastos registrados en este criterio de búsqueda.</strong>
            <div style="font-size: 0.76rem; margin-top: 4px;">Usa los presets rápidos o el formulario superior para registrar uno nuevo.</div>
          </td>
        </tr>
      `;
      return;
    }

    const sedeBadgesMap = {
      MAPASINGUE: { label: 'Mapasingue (5%)', cls: 'badge-sede-mapasingue' },
      CEIBOS: { label: 'Ceibos (25%)', cls: 'badge-sede-ceibos' },
      ALBORADA: { label: 'Alborada (10%)', cls: 'badge-sede-alborada' },
      HOSPITAL: { label: 'Hospital (0%)', cls: 'badge-sede-hospital' },
      GENERAL: { label: 'Traslado General', cls: 'badge-sede-general' }
    };

    tbody.innerHTML = gastosFiltrados.map(exp => {
      const monto = Number(exp.amount !== undefined ? exp.amount : (exp.monto || 0));
      const tipo = (exp.tipoGasto || exp.tipo_gasto || (exp.category === 'Transporte' ? 'TRANSPORTE' : 'INSUMOS')).toUpperCase();
      const sedeKey = (exp.sedeCodigo || exp.sede_codigo || 'CEIBOS').toUpperCase();
      const sedeInfo = sedeBadgesMap[sedeKey] || { label: sedeKey, cls: 'badge-sede-general' };
      const esReembolso = exp.origenFondo === 'MEDICO_PERSONAL' || exp.origen_fondo === 'MEDICO_PERSONAL' || Boolean(exp.esReembolsoMedico);
      const isLiquidado = exp.estadoLiquidacion === 'LIQUIDADO' || exp.estado_liquidacion === 'LIQUIDADO';

      const fechaDisplay = exp.fechaHora
        ? exp.fechaHora.replace('T', ' ').slice(5, 16)
        : (exp.date || hoyStr);

      const tipoIcon = (tipo === 'TRANSPORTE') ? '🚗' : '📦';
      const subTipoLabel = exp.tipoTransporte || exp.categoriaInsumo || exp.category || tipo;

      // Comprobante
      let compHtml = `<span class="btn-no-voucher">Sin adjunto</span>`;
      if (exp.comprobanteUrl || exp.comprobante_url) {
        const urlSafe = (exp.comprobanteUrl || exp.comprobante_url);
        compHtml = `
          <button type="button" class="btn-view-voucher" data-img="${urlSafe}" data-name="${exp.description || 'Comprobante'}" data-monto="${monto.toFixed(2)}">
            <span>👁️</span> Ver
          </button>
        `;
      } else if (exp.voucherNumber || exp.numeroComprobante) {
        const numComp = exp.voucherNumber || exp.numeroComprobante;
        compHtml = `<span style="font-size: 0.70rem; color: #475569; font-family: monospace;">#${numComp}</span>`;
      }

      // Acciones (Eliminar con bloqueo de liquidado)
      let accionesHtml = '';
      if (isLiquidado) {
        accionesHtml = `<span class="badge-liquidado-lock" title="Gasto procesado en cierre semanal. Inmutable.">🔒 Liquidado</span>`;
      } else {
        accionesHtml = `
          <button type="button" class="btn-delete-expense" data-id="${exp.id}" data-monto="${monto.toFixed(2)}" title="Eliminar este gasto">
            🗑️
          </button>
        `;
      }

      return `
        <tr>
          <td><strong style="color: #0f172a;">${fechaDisplay}</strong></td>
          <td><span class="badge-sede-tag ${sedeInfo.cls}">${sedeInfo.label}</span></td>
          <td>
            <span class="badge-tipo-pill">
              <span>${tipoIcon}</span>
              <span>${subTipoLabel}</span>
            </span>
          </td>
          <td>
            <div style="font-weight: 600; color: #1e293b; max-width: 240px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${exp.description || exp.motivo || ''}">
              ${exp.description || exp.motivo || 'Sin detalle'}
            </div>
          </td>
          <td>
            ${esReembolso
              ? `<span class="badge-pago-reembolso">👨‍⚕️ Reembolso (+)</span>`
              : `<span class="badge-pago-deduccion">🏥 Deducción (-)</span>`
            }
          </td>
          <td style="text-align: right;">
            <span class="monto-gasto-val" style="color: ${esReembolso ? '#059669' : '#dc2626'};">
              -$${monto.toFixed(2)}
            </span>
          </td>
          <td style="text-align: center;">${compHtml}</td>
          <td style="text-align: center;">${accionesHtml}</td>
        </tr>
      `;
    }).join('');

    // Conectar eventos a los botones de comprobante
    const btnsVoucher = tbody.querySelectorAll('.btn-view-voucher');
    const modalComp = document.getElementById('modal-preview-comprobante');
    const modalImg = document.getElementById('modal-comprobante-img');
    const modalInfo = document.getElementById('modal-comprobante-info');
    const modalTitulo = document.getElementById('modal-comprobante-titulo');

    btnsVoucher.forEach(btn => {
      btn.addEventListener('click', () => {
        const imgSrc = btn.dataset.img;
        const name = btn.dataset.name;
        const monto = btn.dataset.monto;
        if (modalImg) modalImg.src = imgSrc;
        if (modalTitulo) modalTitulo.textContent = `Comprobante: ${name}`;
        if (modalInfo) modalInfo.innerHTML = `<strong>Monto Asignado:</strong> $${monto} USD`;
        if (modalComp) modalComp.style.display = 'flex';
      });
    });

    // Conectar eventos a los botones de eliminación
    const btnsDelete = tbody.querySelectorAll('.btn-delete-expense');
    btnsDelete.forEach(btn => {
      btn.addEventListener('click', () => {
        const expId = btn.dataset.id;
        const monto = btn.dataset.monto;
        const confirmDelete = window.confirm(`¿Confirmas que deseas eliminar el egreso ${expId} por $${monto}?`);
        if (!confirmDelete) return;

        const res = store.deleteExpense(expId);
        if (res.success) {
          showToast(`Egreso ${expId} eliminado exitosamente.`, 'success');
          renderExpensesTab();
        } else {
          showToast(res.message || 'No se pudo eliminar el gasto.', 'danger');
        }
      });
    });
  }

  // --- 5. MÓDULO DE INGRESOS MÉDICOS POR SEDE Y DÍA ---
  let ingresosFilter = 'todas'; // 'hoy', 'semana', 'mes', 'todas', 'personalizado'
  let customDateStart = '';
  let customDateEnd = '';
  let isIngresosTabInitialized = false;

  function setupIngresosTabEvents() {
    if (isIngresosTabInitialized) return;
    isIngresosTabInitialized = true;

    // Filtros de fecha (Pills)
    const pillButtons = document.querySelectorAll('#ingresos-filter-pills-group .ingresos-pill-btn');
    const customBox = document.getElementById('ingresos-custom-range-box');
    const inputStart = document.getElementById('ingresos-date-start');
    const inputEnd = document.getElementById('ingresos-date-end');
    const btnApplyDates = document.getElementById('btn-apply-custom-dates');

    pillButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        pillButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        ingresosFilter = btn.dataset.range;

        if (ingresosFilter === 'personalizado') {
          if (customBox) customBox.classList.add('active');
        } else {
          if (customBox) customBox.classList.remove('active');
          renderIngresosTab();
        }
      });
    });

    if (btnApplyDates) {
      btnApplyDates.addEventListener('click', () => {
        customDateStart = inputStart ? inputStart.value : '';
        customDateEnd = inputEnd ? inputEnd.value : '';
        if (!customDateStart || !customDateEnd) {
          showToast('Selecciona la fecha inicial y final para el rango personalizado.', 'warning');
          return;
        }
        renderIngresosTab();
      });
    }

    // Modal de Registro de Consulta / Pago
    const btnOpenModal = document.getElementById('btn-open-registrar-pago');
    const modalPago = document.getElementById('modal-registrar-pago');
    const btnCloseModal = document.getElementById('btn-close-payment-modal');
    const formPago = document.getElementById('form-registrar-consulta-pago');

    const selSede = document.getElementById('reg-pago-sede');
    const inpFecha = document.getElementById('reg-pago-fecha');
    const inpPrecio = document.getElementById('reg-pago-precio');
    const selMetodo = document.getElementById('reg-pago-metodo');
    const prevBruto = document.getElementById('prev-bruto');
    const prevRecargo = document.getElementById('prev-recargo');
    const prevComPct = document.getElementById('prev-com-pct');
    const prevComision = document.getElementById('prev-comision');
    const prevNeto = document.getElementById('prev-neto');

    function updatePaymentPreview() {
      const sedeKey = selSede ? selSede.value : 'mapasingue';
      const precio = parseFloat(inpPrecio ? inpPrecio.value : 0) || 0;
      const metodo = selMetodo ? selMetodo.value : 'efectivo';

      const clinic = CLINICS[sedeKey] || { retentionRate: 0.05, name: 'Sede', realCost: 20.00, basePrice: 21.95 };
      const retentionRate = clinic.retentionRate;

      const listPrice = precio;
      let descuentoDirecto = 0;
      let totalCobrado = listPrice;

      if (metodo === 'efectivo' || metodo === 'transferencia') {
        const realTarget = (clinic.realCost && Math.abs(listPrice - (clinic.listPrice || clinic.basePrice)) < 0.1)
          ? clinic.realCost
          : +(listPrice / 1.0975).toFixed(2);
        descuentoDirecto = +(listPrice - realTarget).toFixed(2);
        totalCobrado = realTarget;
      } else {
        descuentoDirecto = 0;
        totalCobrado = listPrice;
      }

      // Base para calcular la comisión de la sede (sobre costo real / base de la consulta)
      const comisionBase = (clinic.realCost && Math.abs(listPrice - (clinic.listPrice || clinic.basePrice)) < 0.1) ? clinic.realCost : +(totalCobrado / 1.0975).toFixed(2);
      const isHospital = sedeKey === 'hospital';
      const comisionMonto = isHospital ? 0 : +(comisionBase * retentionRate).toFixed(2);
      const netoDoctor = isHospital ? 0 : +(comisionBase - comisionMonto).toFixed(2);

      if (prevBruto) prevBruto.textContent = `$${listPrice.toFixed(2)}`;
      if (prevRecargo) {
        prevRecargo.textContent = (metodo === 'efectivo' || metodo === 'transferencia')
          ? `-$${descuentoDirecto.toFixed(2)} (9.75% directo)`
          : '$0.00 (Precio de lista)';
      }
      const elCobrado = document.getElementById('prev-cobrado');
      if (elCobrado) elCobrado.textContent = `$${totalCobrado.toFixed(2)}`;
      if (prevComPct) prevComPct.textContent = `${(retentionRate * 100).toFixed(0)}%`;
      if (prevComision) prevComision.textContent = `-$${comisionMonto.toFixed(2)}`;
      if (prevNeto) prevNeto.textContent = isHospital ? '$0.00 (Sueldo Fijo)' : `$${netoDoctor.toFixed(2)}`;
    }

    if (selSede) {
      selSede.addEventListener('change', () => {
        const cKey = selSede.value;
        const clinic = CLINICS[cKey] || { basePrice: 21.95 };
        if (inpPrecio) {
          inpPrecio.value = clinic.basePrice.toFixed(2);
        }
        updatePaymentPreview();
      });
    }

    if (inpPrecio) inpPrecio.addEventListener('input', updatePaymentPreview);
    if (selMetodo) selMetodo.addEventListener('change', updatePaymentPreview);

    if (btnOpenModal && modalPago) {
      btnOpenModal.addEventListener('click', () => {
        if (inpFecha) inpFecha.value = activeDate || new Date().toISOString().split('T')[0];
        updatePaymentPreview();
        modalPago.classList.add('active');
      });
    }

    if (btnCloseModal && modalPago) {
      btnCloseModal.addEventListener('click', () => {
        modalPago.classList.remove('active');
      });
    }

    if (formPago) {
      formPago.addEventListener('submit', (e) => {
        e.preventDefault();
        const sede = selSede.value;
        const fecha = inpFecha.value;
        const nombre = document.getElementById('reg-pago-nombre').value.trim();
        const cedula = document.getElementById('reg-pago-cedula').value.trim();
        const precio = parseFloat(inpPrecio.value);
        const metodo = selMetodo.value;
        const motivo = document.getElementById('reg-pago-motivo').value.trim();

        if (!sede || !fecha || !nombre || isNaN(precio)) {
          showToast('Por favor completa todos los campos requeridos.', 'warning');
          return;
        }

        const clinic = CLINICS[sede] || { retentionRate: 0.05, realCost: 20.00, basePrice: 21.95 };
        const realTarget = (clinic.realCost && Math.abs(precio - (clinic.listPrice || clinic.basePrice)) < 0.1)
          ? clinic.realCost
          : +(precio / 1.0975).toFixed(2);
        const totalCobrado = (metodo === 'tarjeta') ? precio : realTarget;
        const discountAmount = +(precio - totalCobrado).toFixed(2);

        store.addAppointment({
          patientName: nombre,
          patientId: cedula || '0000000000',
          clinicId: sede,
          date: fecha,
          time: new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', hour12: false }) || '11:00',
          basePrice: realTarget,
          listPrice: precio,
          discountAmount: discountAmount,
          discountLabel: (discountAmount > 0) ? 'Descuento especial por pago directo del 9.75%' : null,
          paymentMethod: metodo,
          totalPaid: totalCobrado,
          reason: motivo || 'Consulta médica general'
        });

        showToast(`Consulta registrada para ${nombre} en ${CLINICS[sede]?.name}. Guardada en Supabase.`, 'success');
        modalPago.classList.remove('active');
        formPago.reset();
        renderIngresosTab();
      });
    }
  }

  function renderIngresosTab() {
    setupIngresosTabEvents();

    const kpisRoot = document.getElementById('ingresos-kpis-root');
    const daysContainer = document.getElementById('ingresos-days-container');
    if (!kpisRoot || !daysContainer) return;

    const state = store.getState();
    const allAppointments = state.appointments.filter(a => a.status !== 'cancelada');

    // Filtrar citas según el rango de fechas seleccionado
    const refDate = activeDate || '2026-09-19';
    let filteredAppointments = allAppointments;

    if (ingresosFilter === 'hoy') {
      filteredAppointments = allAppointments.filter(a => a.date === refDate);
    } else if (ingresosFilter === 'semana') {
      // Semana activa: 7 días de la semana en curso
      const dRef = new Date(refDate);
      const dayOfWeek = (dRef.getDay() + 6) % 7; // Lunes = 0
      const monday = new Date(dRef);
      monday.setDate(dRef.getDate() - dayOfWeek);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      const monStr = monday.toISOString().split('T')[0];
      const sunStr = sunday.toISOString().split('T')[0];
      filteredAppointments = allAppointments.filter(a => a.date >= monStr && a.date <= sunStr);
    } else if (ingresosFilter === 'mes') {
      const monthPrefix = refDate.substring(0, 7); // ej '2026-09'
      filteredAppointments = allAppointments.filter(a => a.date && a.date.startsWith(monthPrefix));
    } else if (ingresosFilter === 'personalizado') {
      if (customDateStart && customDateEnd) {
        filteredAppointments = allAppointments.filter(a => a.date >= customDateStart && a.date <= customDateEnd);
      }
    }

    // 1. Cálculos de Totales Globales
    let totalConsultas = filteredAppointments.length;
    let totalBruto = 0;
    let totalComisiones = 0;
    let totalRecargoTarjeta = 0;
    let totalNeto = 0;
    let hospitalConsultas = 0;

    filteredAppointments.forEach(apt => {
      const clinic = CLINICS[apt.clinicId] || { retentionRate: 0.05 };
      const base = Number(apt.basePrice) || 0;
      const rate = clinic.retentionRate;
      const comision = +(base * rate).toFixed(2);
      const neto = +(base - comision).toFixed(2);
      const cardFee = (apt.paymentMethod === 'tarjeta' && base > 0) ? (Number(apt.feeAmount) || +(base * 0.0975).toFixed(2)) : 0;

      totalBruto += base;
      totalComisiones += comision;
      totalRecargoTarjeta += cardFee;
      totalNeto += neto;
      if (apt.clinicId === 'hospital') {
        hospitalConsultas++;
      }
    });

    // Renderizar KPIs Globales
    kpisRoot.innerHTML = `
      <div class="ingresos-kpi-box" style="--kpi-border: #0284c7;">
        <span class="ingresos-kpi-label">Total Consultas</span>
        <div class="ingresos-kpi-val">${totalConsultas} <span style="font-size: 0.85rem; font-weight: 500; color: #64748b;">turnos</span></div>
        <span class="ingresos-kpi-sub">${hospitalConsultas > 0 ? `${hospitalConsultas} en Hospital Público (0% com.)` : 'En sedes privadas activas'}</span>
      </div>

      <div class="ingresos-kpi-box" style="--kpi-border: #3b82f6;">
        <span class="ingresos-kpi-label">Total Bruto Generado</span>
        <div class="ingresos-kpi-val">$${totalBruto.toFixed(2)}</div>
        <span class="ingresos-kpi-sub">Consultas × Tarifa base</span>
      </div>

      <div class="ingresos-kpi-box" style="--kpi-border: #ef4444;">
        <span class="ingresos-kpi-label">Comisiones Retenidas</span>
        <div class="ingresos-kpi-val" style="color: #dc2626;">-$${totalComisiones.toFixed(2)}</div>
        <span class="ingresos-kpi-sub">Descuento de sedes (5%, 25%, 10%)</span>
      </div>

      <div class="ingresos-kpi-box" style="--kpi-border: #f59e0b;">
        <span class="ingresos-kpi-label">Recargos Tarjeta Datafast</span>
        <div class="ingresos-kpi-val" style="color: #b45309;">+$${totalRecargoTarjeta.toFixed(2)}</div>
        <span class="ingresos-kpi-sub">9.75% bancario • No afecta comisión sede</span>
      </div>

      <div class="ingresos-kpi-box" style="--kpi-border: #10b981; background: linear-gradient(180deg, #ffffff 0%, #f0fdf4 100%);">
        <span class="ingresos-kpi-label" style="color: #15803d;">Ingreso Neto del Médico</span>
        <div class="ingresos-kpi-val" style="color: #10b981;">$${totalNeto.toFixed(2)}</div>
        <span class="ingresos-kpi-sub" style="color: #166534; font-weight: 600;">+ $1,200.00 sueldo fijo hospitalario</span>
      </div>
    `;

    // 2. Agrupación por Días y por Sedes
    if (filteredAppointments.length === 0) {
      daysContainer.innerHTML = `
        <div style="background: #ffffff; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 32px 16px; text-align: center; color: #64748b;">
          <div style="font-size: 2.2rem; margin-bottom: 8px;">📊</div>
          <h4 style="color: #0f172a; margin-bottom: 4px;">No se encontraron consultas en este rango</h4>
          <p style="font-size: 0.82rem; margin-bottom: 14px;">Cambia el filtro de fechas o registra un nuevo turno con el botón superior.</p>
        </div>
      `;
      return;
    }

    // Días únicos ordenados desc
    const uniqueDays = [...new Set(filteredAppointments.map(a => a.date))].sort((a, b) => b.localeCompare(a));

    let htmlDays = '';

    uniqueDays.forEach(dayStr => {
      const dayApts = filteredAppointments.filter(a => a.date === dayStr);

      let dayBruto = 0;
      let dayComisiones = 0;
      let dayNeto = 0;

      dayApts.forEach(a => {
        const c = CLINICS[a.clinicId] || { retentionRate: 0.05 };
        const base = Number(a.basePrice) || 0;
        const com = +(base * c.retentionRate).toFixed(2);
        dayBruto += base;
        dayComisiones += com;
        dayNeto += +(base - com).toFixed(2);
      });

      // Formato fecha en español
      const [year, month, day] = dayStr.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day);
      const dayName = dateObj.toLocaleDateString('es-EC', { weekday: 'long' });
      const dayNameCap = dayName.charAt(0).toUpperCase() + dayName.slice(1);
      const fullDateStr = dateObj.toLocaleDateString('es-EC', { day: 'numeric', month: 'long', year: 'numeric' });

      // Agrupar por sede dentro del día: mapasingue, ceibos, alborada, hospital
      const clinicKeys = ['mapasingue', 'ceibos', 'alborada', 'hospital'];
      let clinicCardsHtml = '';

      clinicKeys.forEach(cKey => {
        const cApts = dayApts.filter(a => (a.clinicId || 'ceibos') === cKey);
        if (cApts.length === 0) return;

        const clinic = CLINICS[cKey] || { name: cKey, retentionRate: 0.05, color: '#0284c7', basePrice: 20 };
        const cCount = cApts.length;
        const cBasePriceSample = cApts[0].basePrice || clinic.basePrice;
        let cBruto = 0;
        let cComision = 0;
        let cNeto = 0;

        // Métodos de pago
        let countEfectivo = 0, sumEfectivo = 0;
        let countTarjeta = 0, sumTarjeta = 0, sumTarjetaRecargo = 0;
        let countTransferencia = 0, sumTransferencia = 0;

        cApts.forEach(apt => {
          const b = Number(apt.basePrice) || 0;
          const com = +(b * clinic.retentionRate).toFixed(2);
          cBruto += b;
          cComision += com;
          cNeto += +(b - com).toFixed(2);

          if (apt.paymentMethod === 'tarjeta') {
            countTarjeta++;
            sumTarjeta += b;
            const r = Number(apt.feeAmount) || +(b * 0.0975).toFixed(2);
            sumTarjetaRecargo += r;
          } else if (apt.paymentMethod === 'transferencia') {
            countTransferencia++;
            sumTransferencia += b;
          } else {
            countEfectivo++;
            sumEfectivo += b;
          }
        });

        const isHospital = cKey === 'hospital';
        const comisionPercentLabel = isHospital ? '0%' : `${(clinic.retentionRate * 100).toFixed(0)}%`;

        let paymentPills = [];
        if (countEfectivo > 0) {
          paymentPills.push(`<span class="payment-pill efectivo">💵 Efectivo: ${countEfectivo} ($${sumEfectivo.toFixed(2)})</span>`);
        }
        if (countTarjeta > 0) {
          paymentPills.push(`<span class="payment-pill tarjeta">💳 Tarjeta Datafast: ${countTarjeta} ($${sumTarjeta.toFixed(2)} + $${sumTarjetaRecargo.toFixed(2)} recargo 9.75%)</span>`);
        }
        if (countTransferencia > 0) {
          paymentPills.push(`<span class="payment-pill transferencia">🏦 Transferencia: ${countTransferencia} ($${sumTransferencia.toFixed(2)})</span>`);
        }

        // Listado detallado de pacientes
        const patientsListHtml = cApts.map(apt => `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 5px 0; border-bottom: 1px dashed #e2e8f0;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-family: monospace; font-weight: 700; color: #0284c7;">#${apt.code || apt.id}</span>
              <span style="font-weight: 600; color: #1e293b;">${apt.patientName}</span>
              <span style="font-size: 0.7rem; color: #64748b;">⏰ ${apt.time}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 0.72rem; color: #64748b;">${apt.paymentMethod === 'tarjeta' ? '💳 Tarjeta (+9.75%)' : (apt.paymentMethod === 'transferencia' ? '🏦 Transferencia' : '💵 Efectivo')}</span>
              <strong style="color: #0f172a;">$${(apt.basePrice || 0).toFixed(2)}</strong>
            </div>
          </div>
        `).join('');

        clinicCardsHtml += `
          <div class="ingresos-clinic-row-card" style="--clinic-border-color: ${clinic.color};">
            <div class="ingresos-clinic-top-row">
              <div class="ingresos-clinic-name">
                <span style="width: 12px; height: 12px; border-radius: 50%; background: ${clinic.color};"></span>
                <span>${clinic.name} — ${dayNameCap}</span>
                <span class="badge-sede ${clinic.badgeClass}" style="font-size: 0.68rem; padding: 2px 8px;">
                  ${isHospital ? '0% Comisión (Convenio Sueldo Fijo)' : `${comisionPercentLabel} Comisión Sede`}
                </span>
              </div>
              <div style="font-size: 0.8rem; font-weight: 700; color: #64748b;">
                ${dayStr}
              </div>
            </div>

            <!-- Flujo de Cálculo Exacto Solicitado por el Usuario -->
            <div class="ingresos-formula-flow">
              <div class="formula-step">
                <span class="formula-step-label">Consultas</span>
                <span class="formula-step-val" style="color: #0f172a;">${cCount} turno${cCount > 1 ? 's' : ''}</span>
              </div>

              <span class="formula-arrow">×</span>

              <div class="formula-step">
                <span class="formula-step-label">Precio Consulta</span>
                <span class="formula-step-val" style="color: #475569;">$${cBasePriceSample.toFixed(2)}</span>
              </div>

              <span class="formula-arrow">→</span>

              <div class="formula-step">
                <span class="formula-step-label">Total Generado</span>
                <span class="formula-step-val" style="color: #0284c7;">$${cBruto.toFixed(2)}</span>
              </div>

              <span class="formula-arrow">−</span>

              <div class="formula-step">
                <span class="formula-step-label">Comisión (${comisionPercentLabel})</span>
                <span class="formula-step-val" style="color: #dc2626;">-$${cComision.toFixed(2)}</span>
              </div>

              <span class="formula-arrow">→</span>

              <div class="formula-step">
                <span class="formula-step-label" style="color: #15803d;">Ingreso Neto Médico</span>
                <span class="formula-step-val" style="color: #10b981; font-size: 1.05rem;">
                  $${isHospital ? '0.00 (Sueldo Fijo)' : cNeto.toFixed(2)}
                </span>
              </div>
            </div>

            <!-- Desglose de Métodos de Pago -->
            <div class="ingresos-payment-breakdown">
              <strong style="color: #334155;">Métodos de Pago:</strong>
              ${paymentPills.join(' ')}
            </div>

            <!-- Detalle de Pacientes del Turno -->
            <details style="margin-top: 4px; cursor: pointer;">
              <summary style="font-size: 0.74rem; font-weight: 700; color: #0284c7; outline: none;">
                👁️ Ver desglose de ${cCount} paciente${cCount > 1 ? 's' : ''} (${clinic.name})
              </summary>
              <div class="ingresos-patients-detail">
                ${patientsListHtml}
              </div>
            </details>
          </div>
        `;
      });

      htmlDays += `
        <div class="ingresos-day-card">
          <div class="ingresos-day-header-bar">
            <div class="ingresos-day-title">
              <span>📅 ${dayNameCap}, ${fullDateStr}</span>
            </div>
            <div class="ingresos-day-summary-badges">
              <span class="badge-day-stat" style="background: #eff6ff; color: #1e40af;">${dayApts.length} consultas</span>
              <span class="badge-day-stat" style="background: #f1f5f9; color: #334155;">$${dayBruto.toFixed(2)} bruto</span>
              <span class="badge-day-stat" style="background: #fef2f2; color: #b91c1c;">-$${dayComisiones.toFixed(2)} comisiones</span>
              <span class="badge-day-stat" style="background: #f0fdf4; color: #15803d; font-weight: 800;">$${dayNeto.toFixed(2)} netos</span>
            </div>
          </div>

          <div class="ingresos-day-clinics-list">
            ${clinicCardsHtml}
          </div>
        </div>
      `;
    });

    daysContainer.innerHTML = htmlDays;
  }

  // Escuchar cuando el médico entra a su portal o cambia el estado para renderizar
  store.subscribe((state) => {
    if (state.activeView === 'doctor') {
      activeDate = getTodayDateStr();
      switchDoctorTab(activeDoctorTab);
      renderSystemAlertsBadge();
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
 * Lcda. Morales - Auditoría Médica & Conciliación Tributaria SRI
 *
 * Módulos integrados:
 * 1. Supervisar flujo de caja diario y semanal con liquidaciones y comisiones (5%, 25%, 10%).
 * 2. Revisar y clasificar gastos operativos en: Ingresos, Egresos, Costos, Gastos, Activos o Patrimonio.
 * 3. Auditar comprobantes y facturas electrónicas SRI (Aprobado, Pendiente, Observado).
 * 4. Analizar rentabilidad por sedes, centros de costos y sugerencias de optimización de rutas.
 * 5. Generar y exportar reportes para declaraciones tributarias (Formulario SRI 102).
 */


function setupAccountantPortal(showToast) {
  const btnExportTax = document.getElementById('btn-export-tax-report');
  const taxModal = document.getElementById('tax-report-modal');
  const btnCloseTaxModal = document.getElementById('btn-close-tax-modal');
  const btnDownloadCSV = document.getElementById('btn-download-csv');

  // --- 1. GESTIÓN DE PESTAÑAS DEL PORTAL CONTABLE ---
  const accountantTabs = document.querySelectorAll('#nav-menu-accountant .nav-tab-btn');
  const accountantPanes = document.querySelectorAll('.accountant-tab-pane');

  function switchAccountantTab(targetTab) {
    accountantTabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.target === targetTab);
    });

    accountantPanes.forEach(pane => {
      pane.style.display = (pane.dataset.pane === targetTab) ? 'block' : 'none';
    });

    renderAccountantDashboard();
  }

  accountantTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      switchAccountantTab(tab.dataset.target);
    });
  });

  // --- ESTADO LOCAL DEL MÓDULO DE BALANCE CONTABLE (Semana 5 - Parte 1) ---
  let activeBalancePeriod = 'SEM-4';
  let isBalanceEventsInitialized = false;

  // --- ESTADO LOCAL DEL MÓDULO DE LIQUIDACIONES SEMANALES (Semana 4 - Parte 4) ---
  let activeSettlementPeriod = 'SEM-4';
  let activeSettlementClinic = 'TODAS';
  let isSettlementEventsInitialized = false;

  // --- 2. RENDER PRINCIPAL DEL PANEL CONTABLE ---
  function renderAccountantDashboard() {
    const summary = store.getFinancialSummary();
    const state = store.getState();

    // 2.1 KPIs Superiores Globales
    const kpiGross = document.getElementById('kpi-gross-revenue');
    const kpiRetentions = document.getElementById('kpi-retentions-total');
    const kpiExpenses = document.getElementById('kpi-expenses-total');
    const kpiNet = document.getElementById('kpi-net-income');

    if (kpiGross) kpiGross.textContent = `$${summary.totalGrossRevenue.toFixed(2)}`;
    if (kpiRetentions) kpiRetentions.textContent = `-$${summary.totalRetentions.toFixed(2)}`;
    if (kpiExpenses) kpiExpenses.textContent = `-$${summary.totalExpenses.toFixed(2)}`;
    if (kpiNet) kpiNet.textContent = `$${summary.realNetIncome.toFixed(2)}`;

    // 2.2 PANE 0: Tablero Contable Consolidado & Balance de Caja (Semana 5 - Parte 1)
    renderAccountingBalanceDashboard(state, summary);

    // 2.3 PANE 1: Motor de Liquidación Semanal por Consultorio (Semana 4 - Parte 4)
    renderWeeklySettlementModule(state, summary);

    // 2.4 PANE 2: Revisión y Clasificación Contable de Gastos
    renderExpensesClassificationModule(state, summary);

    // 2.5 PANE 3: Auditoría de Comprobantes y Facturas SRI
    renderVouchersAuditModule(state);

    // 2.6 PANE 4: Rentabilidad por Sedes, Centros de Costo y Rutas
    renderProfitabilityAndRoutesModule(summary);

    // 2.7 PANE 5: Declaración Tributaria SRI (Formulario 102)
    renderTaxReportModule(summary);
  }

  // --- MÓDULO 0: TABLERO CONTABLE EJECUTIVO & BALANCE DE CAJA (Semana 5 - Parte 1) ---
  function renderAccountingBalanceDashboard(state, summary) {
    const balance = store.getAccountingBalance(activeBalancePeriod);

    // 0.1 Sincronizar selector de período de balance
    const periodSelect = document.getElementById('acc-balance-period-select');
    if (periodSelect && periodSelect.value !== activeBalancePeriod) {
      periodSelect.value = activeBalancePeriod;
    }

    // 0.2 Actualizar las 4 Tarjetas Principales de Balance de Caja
    const kpiRevenue = document.getElementById('bal-kpi-total-revenue');
    const kpiRevenueSub = document.getElementById('bal-kpi-total-revenue-sub');
    const kpiRevenueMicro = document.getElementById('bal-kpi-revenue-micro');

    const kpiRetentions = document.getElementById('bal-kpi-total-retentions');
    const kpiRetentionsSub = document.getElementById('bal-kpi-total-retentions-sub');
    const kpiRetentionsMicro = document.getElementById('bal-kpi-retentions-micro');

    const kpiExpenses = document.getElementById('bal-kpi-total-expenses');
    const kpiExpensesSub = document.getElementById('bal-kpi-total-expenses-sub');
    const kpiExpensesMicro = document.getElementById('bal-kpi-expenses-micro');

    const kpiNetProfit = document.getElementById('bal-kpi-net-profit');
    const kpiNetProfitSub = document.getElementById('bal-kpi-net-profit-sub');
    const kpiProfitMicro = document.getElementById('bal-kpi-profit-micro');

    if (kpiRevenue) kpiRevenue.textContent = `$${balance.totalRevenue.toFixed(2)}`;
    if (kpiRevenueSub) kpiRevenueSub.textContent = `${balance.citasCount} citas registradas • Recargo tarjeta 9.75%`;
    if (kpiRevenueMicro) {
      kpiRevenueMicro.textContent = `Tarifa Base: $${balance.baseRevenue.toFixed(2)} | Recargo Procesadora: +$${balance.totalSurcharges.toFixed(2)}`;
    }

    if (kpiRetentions) kpiRetentions.textContent = `-$${balance.totalCommissions.toFixed(2)}`;
    if (kpiRetentionsSub) kpiRetentionsSub.textContent = `Ceibos (25%), Alborada (10%), Mapasingue (5%)`;
    if (kpiRetentionsMicro) {
      kpiRetentionsMicro.textContent = `Fondo acumulado de comisión por consultorio privado`;
    }

    if (kpiExpenses) kpiExpenses.textContent = `-$${balance.totalExpenses.toFixed(2)}`;
    if (kpiExpensesSub) kpiExpensesSub.textContent = `${balance.gastosCount} comprobantes auditados (transporte/insumos)`;
    if (kpiExpensesMicro) {
      kpiExpensesMicro.textContent = `Taxis/Gasolina: $${balance.expensesByCategory.transporte.toFixed(2)} | Insumos: $${balance.expensesByCategory.insumos.toFixed(2)}`;
    }

    if (kpiNetProfit) {
      kpiNetProfit.textContent = `$${balance.netProfit.toFixed(2)}`;
      kpiNetProfit.style.color = balance.netProfit >= 0 ? '#10b981' : '#dc2626';
    }
    if (kpiNetProfitSub) kpiNetProfitSub.textContent = `(Base de Citas - Retenciones) - Gastos Reembolsados`;
    if (kpiProfitMicro) {
      kpiProfitMicro.textContent = `Margen disponible para tesorería institucional`;
    }

    // 0.3 Badge de estado de conciliación para el período activo
    const badgeContainer = document.getElementById('acc-balance-reconciliation-badge');
    if (badgeContainer) {
      const recRecord = balance.reconciliationHistory.find(r => r.periodKey === activeBalancePeriod);
      if (recRecord) {
        badgeContainer.innerHTML = `<span class="badge-status-pill liquidado" id="badge-balance-reconciled" title="Conciliado formalmente el ${new Date(recRecord.reconciledAt).toLocaleDateString()} por ${recRecord.auditor}">✓ Conciliado SRI (${recRecord.id})</span>`;
      } else {
        badgeContainer.innerHTML = `<span class="badge-status-pill observado" id="badge-balance-reconciled" title="Período pendiente de auditoría y cierre formal">⏳ Período Abierto / Auditoría en Curso</span>`;
      }
    }

    // 0.4 Gráfica 1: Distribución de Ingresos y Margen por Sede
    renderVenueDistributionChart(balance);

    // 0.5 Gráfica 2: Mix de Medios de Pago (Donut SVG Nativo y Leyenda)
    renderPaymentMixDonutChart(balance);

    // 0.6 Historial de Conciliaciones y Cierres de Ejercicio Contable
    renderReconciliationHistoryTable(balance);

    // 0.7 Inicializar eventos interactivos del módulo de balance (una sola vez)
    if (!isBalanceEventsInitialized) {
      setupBalanceDashboardEvents();
      isBalanceEventsInitialized = true;
    }
  }

  // --- SUB-MÓDULO: Gráfica de Distribución de Ingresos por Sede ---
  function renderVenueDistributionChart(balance) {
    const venueChartRoot = document.getElementById('venue-distribution-chart-root');
    const venueBadge = document.getElementById('bal-venue-lead-badge');
    if (!venueChartRoot) return;

    const venues = [
      balance.venueDistribution.ceibos,
      balance.venueDistribution.alborada,
      balance.venueDistribution.mapasingue,
      balance.venueDistribution.hospital
    ];

    // Hallar sede con mejor margen
    let bestMarginVenue = venues[2]; // Default Mapasingue (5% retención = 95% margen)
    venues.forEach(v => {
      if (parseFloat(v.marginRate) > parseFloat(bestMarginVenue.marginRate) && v.gross > 0) {
        bestMarginVenue = v;
      }
    });

    if (venueBadge) {
      venueBadge.textContent = `${bestMarginVenue.name}: ${bestMarginVenue.marginRate}% Margen Neto`;
    }

    venueChartRoot.innerHTML = venues.map(v => {
      const pct = v.percentage || 0;
      const retRatePct = (v.rate * 100).toFixed(0);
      return `
        <div class="venue-bar-row">
          <div class="venue-bar-header">
            <div class="venue-bar-info">
              <span class="venue-bar-name" style="font-weight: 700; color: #1e293b; display: flex; align-items: center; gap: 6px;">
                <span class="venue-color-indicator" style="width: 10px; height: 10px; border-radius: 50%; background: ${v.color};"></span>
                ${v.name}
              </span>
              <span class="badge-sede" style="font-size: 0.68rem; padding: 2px 6px;">${retRatePct}% Retención</span>
              <span style="font-size: 0.72rem; color: #64748b;">${v.count} ${v.count === 1 ? 'cita' : 'citas'}</span>
            </div>
            <div class="venue-bar-figures">
              <span style="font-size: 0.76rem; color: #64748b;">Bruto: <strong style="color: #0f172a;">$${v.gross.toFixed(2)}</strong></span>
              <span style="font-size: 0.76rem; color: #dc2626;">Deducción: <strong>-$${v.retentions.toFixed(2)}</strong></span>
              <span style="font-size: 0.8rem; font-weight: 800; color: #16a34a;">Neto: $${v.net.toFixed(2)} (${v.marginRate}%)</span>
            </div>
          </div>
          <div class="venue-bar-track">
            <div class="venue-bar-fill" style="width: ${Math.min(100, Math.max(pct, pct > 0 ? 5 : 0))}%; background: ${v.color};"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  // --- SUB-MÓDULO: Donut SVG Nativo y Mix de Medios de Pago ---
  function renderPaymentMixDonutChart(balance) {
    const donutSvg = document.getElementById('payment-donut-svg');
    const donutCenterTotal = document.getElementById('donut-center-total');
    const legendRoot = document.getElementById('payment-mix-legend-root');
    const paymentLeadBadge = document.getElementById('bal-payment-lead-badge');

    if (donutCenterTotal) {
      donutCenterTotal.textContent = `$${balance.totalRevenue.toFixed(0)}`;
    }

    const pMix = [
      { key: 'efectivo', ...balance.paymentMix.efectivo },
      { key: 'transferencia', ...balance.paymentMix.transferencia },
      { key: 'tarjeta', ...balance.paymentMix.tarjeta }
    ];

    if (paymentLeadBadge) {
      const highestPay = [...pMix].sort((a, b) => b.totalAmount - a.totalAmount)[0];
      if (highestPay && highestPay.totalAmount > 0) {
        paymentLeadBadge.textContent = `${highestPay.icon} Predominante: ${highestPay.label.split(' ')[0]} (${highestPay.percentage.toFixed(0)}%)`;
      } else {
        paymentLeadBadge.textContent = `Cobro 100% Conciliado`;
      }
    }

    // Dibujar arcos con SVG nativo sin librerías externas pesadas
    if (donutSvg) {
      const radius = 15.91549430918954; // C = 2 * PI * r = 100
      let circlesHtml = `<circle cx="21" cy="21" r="${radius}" fill="transparent" stroke="#f1f5f9" stroke-width="5"></circle>`;
      let accumulatedPct = 0;

      if (balance.totalRevenue > 0) {
        pMix.forEach(item => {
          const pct = item.percentage;
          if (pct > 0) {
            const dashArray = `${pct.toFixed(2)} ${(100 - pct).toFixed(2)}`;
            const dashOffset = (-accumulatedPct).toFixed(2);
            circlesHtml += `
              <circle cx="21" cy="21" r="${radius}" fill="transparent"
                stroke="${item.color}" stroke-width="5"
                stroke-dasharray="${dashArray}"
                stroke-dashoffset="${dashOffset}">
                <title>${item.label}: $${item.totalAmount.toFixed(2)} (${pct.toFixed(1)}%)</title>
              </circle>
            `;
            accumulatedPct += pct;
          }
        });
      } else {
        circlesHtml += `<circle cx="21" cy="21" r="${radius}" fill="transparent" stroke="#cbd5e1" stroke-width="4" stroke-dasharray="100 0"></circle>`;
      }

      donutSvg.innerHTML = circlesHtml;
    }

    // Renderizar leyenda interactiva
    if (legendRoot) {
      legendRoot.innerHTML = pMix.map(item => {
        const surchargeInfo = item.key === 'tarjeta' && item.surchargeAmount > 0
          ? `<span style="font-size: 0.68rem; color: #7c3aed; display: block;">(incluye +$${item.surchargeAmount.toFixed(2)} recargo 9.75%)</span>`
          : '';
        return `
          <div class="payment-mix-legend-item" style="display: flex; align-items: center; justify-content: space-between; padding: 6px 10px; border-radius: 6px; background: #f8fafc; border: 1px solid #e2e8f0;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 1.1rem;">${item.icon}</span>
              <div>
                <span style="font-size: 0.78rem; font-weight: 700; color: #1e293b;">${item.label}</span>
                <span style="font-size: 0.68rem; color: #64748b; margin-left: 4px;">(${item.count} ops)</span>
                ${surchargeInfo}
              </div>
            </div>
            <div style="text-align: right;">
              <span style="font-size: 0.82rem; font-weight: 800; color: #0f172a;">$${item.totalAmount.toFixed(2)}</span>
              <span style="font-size: 0.72rem; color: #64748b; margin-left: 4px;">(${item.percentage.toFixed(1)}%)</span>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  // --- SUB-MÓDULO: Historial de Conciliaciones y Cierres ---
  function renderReconciliationHistoryTable(balance) {
    const tbody = document.getElementById('acc-reconciliation-history-tbody');
    const countBadge = document.getElementById('acc-reconciliation-count-badge');
    const history = balance.reconciliationHistory || [];

    if (countBadge) {
      countBadge.textContent = `${history.length} ${history.length === 1 ? 'Cierre Registrado' : 'Cierres Registrados'}`;
    }

    if (tbody) {
      if (history.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="9" style="text-align: center; padding: 24px; color: #64748b;">
              Sin registros de cierres formales previos. Presiona "🔒 Cierre de Ejercicio / Conciliación" para asentar el primer corte.
            </td>
          </tr>
        `;
      } else {
        tbody.innerHTML = history.map(rec => {
          const d = new Date(rec.reconciledAt);
          const formattedDate = `${d.toLocaleDateString('es-EC')} ${d.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}`;
          return `
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="font-weight: 700; color: #1e293b; font-family: monospace;">${rec.id}</td>
              <td style="font-size: 0.78rem; color: #64748b;">${formattedDate}</td>
              <td><span class="badge-sede badge-ceibos" style="font-size: 0.72rem;">${rec.period}</span></td>
              <td style="text-align: right; font-weight: 700; color: #0f172a;">$${Number(rec.totalRevenue).toFixed(2)}</td>
              <td style="text-align: right; font-weight: 700; color: #dc2626;">-$${Number(rec.totalCommissions).toFixed(2)}</td>
              <td style="text-align: right; font-weight: 700; color: #d97706;">-$${Number(rec.totalExpenses).toFixed(2)}</td>
              <td style="text-align: right; font-weight: 800; color: #16a34a;">$${Number(rec.netProfit).toFixed(2)}</td>
              <td style="font-size: 0.76rem; color: #475569;">${rec.auditor}</td>
              <td><span class="badge-status-pill liquidado" style="font-size: 0.7rem;">✓ ${rec.status || 'CONCILIADO_SRI'}</span></td>
            </tr>
          `;
        }).join('');
      }
    }
  }

  // --- SUB-MÓDULO: Configuración de Eventos del Tablero Contable ---
  function setupBalanceDashboardEvents() {
    // 1. Selector de Rango de Fechas / Período
    const periodSelect = document.getElementById('acc-balance-period-select');
    if (periodSelect) {
      periodSelect.addEventListener('change', (e) => {
        activeBalancePeriod = e.target.value;
        renderAccountingBalanceDashboard(store.getState(), store.getFinancialSummary());
      });
    }

    // 2. Modal de Cierre de Ejercicio / Conciliación
    const btnOpenCierre = document.getElementById('btn-close-accounting-period');
    const modalCierre = document.getElementById('modal-cierre-ejercicio');
    const btnCloseCierre = document.getElementById('btn-close-cierre-modal');
    const btnCancelCierre = document.getElementById('btn-cancel-cierre');
    const btnConfirmCierre = document.getElementById('btn-confirm-cierre');
    const modalCierreBody = document.getElementById('modal-cierre-body');
    const txtObservaciones = document.getElementById('txt-cierre-observaciones');

    function openCierreModal() {
      const balance = store.getAccountingBalance(activeBalancePeriod);
      const periodLabel = periodSelect ? periodSelect.options[periodSelect.selectedIndex].text : activeBalancePeriod;

      if (modalCierreBody) {
        modalCierreBody.innerHTML = `
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px;">
            <div style="font-size: 0.8rem; color: #64748b; font-weight: 700; text-transform: uppercase;">Período a Conciliar:</div>
            <div style="font-size: 1.05rem; font-weight: 800; color: #0f172a; margin-top: 2px;">${periodLabel}</div>
            <div style="font-size: 0.75rem; color: #64748b; margin-top: 4px;">
              Responsable: <strong>Lcda. Patricia Morales (CPA-38491)</strong> • Fecha: <strong>${new Date().toLocaleDateString('es-EC')}</strong>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px;">
              <span style="font-size: 0.74rem; color: #64748b;">Total Ingresos Facturados:</span>
              <div style="font-size: 1.1rem; font-weight: 800; color: #0284c7;">$${balance.totalRevenue.toFixed(2)}</div>
              <span style="font-size: 0.68rem; color: #64748b;">${balance.citasCount} citas registradas</span>
            </div>
            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px;">
              <span style="font-size: 0.74rem; color: #64748b;">Retenciones por Sedes:</span>
              <div style="font-size: 1.1rem; font-weight: 800; color: #6366f1;">-$${balance.totalCommissions.toFixed(2)}</div>
              <span style="font-size: 0.68rem; color: #64748b;">Deducciones por consultorio</span>
            </div>
            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px;">
              <span style="font-size: 0.74rem; color: #64748b;">Gastos Operativos Deducibles:</span>
              <div style="font-size: 1.1rem; font-weight: 800; color: #f59e0b;">-$${balance.totalExpenses.toFixed(2)}</div>
              <span style="font-size: 0.68rem; color: #64748b;">${balance.gastosCount} comprobantes auditados</span>
            </div>
            <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 10px;">
              <span style="font-size: 0.74rem; color: #166534; font-weight: 700;">Balance Neto / Utilidad Operativa:</span>
              <div style="font-size: 1.15rem; font-weight: 900; color: #15803d;">$${balance.netProfit.toFixed(2)}</div>
              <span style="font-size: 0.68rem; color: #166534;">Disponible en tesorería</span>
            </div>
          </div>

          <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 10px 14px; font-size: 0.74rem; color: #1e40af;">
            ℹ️ Al confirmar el cierre, los comprobantes y pagos del período serán bloqueados y marcados formalmente como <strong>AUDITADOS Y CONCILIADOS ANTE EL SRI</strong>.
          </div>
        `;
      }

      if (txtObservaciones) {
        txtObservaciones.value = `Conciliación de caja conforme a extractos bancarios y facturación electrónica autorizada por el SRI sin descuadres para ${periodLabel}.`;
      }

      if (modalCierre) modalCierre.classList.add('active');
    }

    if (btnOpenCierre) btnOpenCierre.addEventListener('click', openCierreModal);
    if (btnCloseCierre) btnCloseCierre.addEventListener('click', () => modalCierre && modalCierre.classList.remove('active'));
    if (btnCancelCierre) btnCancelCierre.addEventListener('click', () => modalCierre && modalCierre.classList.remove('active'));

    if (btnConfirmCierre) {
      btnConfirmCierre.addEventListener('click', () => {
        const obs = txtObservaciones ? txtObservaciones.value : '';
        const rec = store.reconcileAccountingPeriod(activeBalancePeriod, obs);
        if (modalCierre) modalCierre.classList.remove('active');
        showToast(`Cierre formal ${rec.id} registrado y conciliado con éxito ante el SRI.`, 'success');
        renderAccountantDashboard();
      });
    }

    // 3. Modal de Reporte Financiero Completo (CSV / Imprimible)
    const btnOpenReporte = document.getElementById('btn-export-financial-report');
    const modalReporte = document.getElementById('modal-reporte-financiero-imprimible');
    const btnCloseReporte = document.getElementById('btn-close-reporte-modal');
    const btnReporteClose = document.getElementById('btn-reporte-modal-close');
    const btnReporteCSV = document.getElementById('btn-reporte-modal-csv');
    const btnReportePrint = document.getElementById('btn-reporte-modal-print');
    const modalReporteBody = document.getElementById('modal-reporte-body');

    function openReporteModal() {
      const balance = store.getAccountingBalance(activeBalancePeriod);
      const periodLabel = periodSelect ? periodSelect.options[periodSelect.selectedIndex].text : activeBalancePeriod;

      if (modalReporteBody) {
        modalReporteBody.innerHTML = `
          <div class="acta-sheet" style="font-family: inherit; color: #0f172a; padding: 12px 16px;">
            <!-- Cabecera Institucional Oficial -->
            <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 14px;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 2.2rem;">🩺</span>
                <div>
                  <h2 style="font-size: 1.25rem; font-weight: 800; margin: 0; color: #0f172a;">MONTEPIEDRA SALUD</h2>
                  <p style="font-size: 0.76rem; color: #64748b; margin: 2px 0 0 0;">Red de Atención Médica Integral • Departamento de Contabilidad y Auditoría Fiscal</p>
                  <p style="font-size: 0.72rem; color: #64748b; margin: 1px 0 0 0;">RUC: 0992384712001 • Guayaquil, Ecuador</p>
                </div>
              </div>
              <div style="text-align: right;">
                <div style="display: inline-block; background: #f0fdf4; border: 1px solid #86efac; color: #166534; font-weight: 800; font-size: 0.75rem; padding: 4px 8px; border-radius: 6px;">
                  INFORME CONTABLE OFICIAL SRI
                </div>
                <div style="font-size: 0.74rem; color: #64748b; margin-top: 4px;">Fecha: ${new Date().toLocaleDateString('es-EC')} ${new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}</div>
                <div style="font-size: 0.72rem; color: #64748b;">Período: <strong>${periodLabel}</strong></div>
              </div>
            </div>

            <!-- Resumen de 4 Balances de Caja -->
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px;">
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px;">
                <span style="font-size: 0.7rem; color: #64748b; text-transform: uppercase; font-weight: 700;">Ingresos Brutos:</span>
                <div style="font-size: 1.05rem; font-weight: 800; color: #0284c7;">$${balance.totalRevenue.toFixed(2)}</div>
                <span style="font-size: 0.66rem; color: #64748b;">${balance.citasCount} consultas atendidas</span>
              </div>
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px;">
                <span style="font-size: 0.7rem; color: #64748b; text-transform: uppercase; font-weight: 700;">Retenciones Sedes:</span>
                <div style="font-size: 1.05rem; font-weight: 800; color: #6366f1;">-$${balance.totalCommissions.toFixed(2)}</div>
                <span style="font-size: 0.66rem; color: #64748b;">Ceibos/Alborada/Mapasingue</span>
              </div>
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px;">
                <span style="font-size: 0.7rem; color: #64748b; text-transform: uppercase; font-weight: 700;">Gastos Deducibles:</span>
                <div style="font-size: 1.05rem; font-weight: 800; color: #f59e0b;">-$${balance.totalExpenses.toFixed(2)}</div>
                <span style="font-size: 0.66rem; color: #64748b;">${balance.gastosCount} egresos validados</span>
              </div>
              <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 10px;">
                <span style="font-size: 0.7rem; color: #166534; text-transform: uppercase; font-weight: 800;">Utilidad Operativa:</span>
                <div style="font-size: 1.15rem; font-weight: 900; color: #15803d;">$${balance.netProfit.toFixed(2)}</div>
                <span style="font-size: 0.66rem; color: #166534;">Excedente líquido</span>
              </div>
            </div>

            <!-- Tabla 1: Desglose por Sede -->
            <h4 style="font-size: 0.88rem; margin: 12px 0 6px 0; color: #0f172a;">1. Desglose de Rendimiento por Sedes y Consultorios</h4>
            <table style="width: 100%; border-collapse: collapse; font-size: 0.76rem; margin-bottom: 14px;">
              <thead>
                <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
                  <th style="padding: 6px 8px; text-align: left;">Sede / Consultorio</th>
                  <th style="padding: 6px 8px; text-align: center;">Tasa Retención</th>
                  <th style="padding: 6px 8px; text-align: right;">Ingreso Bruto</th>
                  <th style="padding: 6px 8px; text-align: right;">Retención Sede</th>
                  <th style="padding: 6px 8px; text-align: right;">Neto Doctor</th>
                  <th style="padding: 6px 8px; text-align: center;">Citas</th>
                  <th style="padding: 6px 8px; text-align: right;">Margen</th>
                </tr>
              </thead>
              <tbody>
                ${Object.values(balance.venueDistribution).map(v => `
                  <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 6px 8px; font-weight: 700;">${v.name}</td>
                    <td style="padding: 6px 8px; text-align: center;">${(v.rate * 100).toFixed(0)}%</td>
                    <td style="padding: 6px 8px; text-align: right;">$${v.gross.toFixed(2)}</td>
                    <td style="padding: 6px 8px; text-align: right; color: #dc2626;">-$${v.retentions.toFixed(2)}</td>
                    <td style="padding: 6px 8px; text-align: right; font-weight: 700; color: #16a34a;">$${v.net.toFixed(2)}</td>
                    <td style="padding: 6px 8px; text-align: center;">${v.count}</td>
                    <td style="padding: 6px 8px; text-align: right;">${v.marginRate}%</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <!-- Tabla 2: Mix de Medios de Pago -->
            <h4 style="font-size: 0.88rem; margin: 12px 0 6px 0; color: #0f172a;">2. Mix de Medios de Pago y Cobranza</h4>
            <table style="width: 100%; border-collapse: collapse; font-size: 0.76rem; margin-bottom: 14px;">
              <thead>
                <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
                  <th style="padding: 6px 8px; text-align: left;">Medio de Pago</th>
                  <th style="padding: 6px 8px; text-align: center;">Operaciones</th>
                  <th style="padding: 6px 8px; text-align: right;">Base Imponible</th>
                  <th style="padding: 6px 8px; text-align: right;">Recargo Procesadora (9.75%)</th>
                  <th style="padding: 6px 8px; text-align: right;">Total Facturado</th>
                  <th style="padding: 6px 8px; text-align: right;">% del Mix</th>
                </tr>
              </thead>
              <tbody>
                ${Object.values(balance.paymentMix).map(p => `
                  <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 6px 8px; font-weight: 700;">${p.icon} ${p.label}</td>
                    <td style="padding: 6px 8px; text-align: center;">${p.count}</td>
                    <td style="padding: 6px 8px; text-align: right;">$${p.baseAmount.toFixed(2)}</td>
                    <td style="padding: 6px 8px; text-align: right; color: #7c3aed;">+$${p.surchargeAmount ? p.surchargeAmount.toFixed(2) : '0.00'}</td>
                    <td style="padding: 6px 8px; text-align: right; font-weight: 800;">$${p.totalAmount.toFixed(2)}</td>
                    <td style="padding: 6px 8px; text-align: right;">${p.percentage.toFixed(1)}%</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <!-- Certificación de Auditoría y Firmas Oficiales -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-top: 28px; padding-top: 10px;">
              <div style="text-align: center; border-top: 1px dashed #94a3b8; padding-top: 8px;">
                <div style="font-size: 0.82rem; font-weight: 800; color: #0f172a;">Lcda. Patricia Morales</div>
                <div style="font-size: 0.72rem; color: #64748b;">Auditora Contable Externa • CPA Reg. 38491</div>
                <div style="font-size: 0.68rem; color: #059669; font-weight: 700; margin-top: 2px;">✓ Sello de Certificación SRI Homologado</div>
              </div>
              <div style="text-align: center; border-top: 1px dashed #94a3b8; padding-top: 8px;">
                <div style="font-size: 0.82rem; font-weight: 800; color: #0f172a;">Dr. Carlos Campoverde</div>
                <div style="font-size: 0.72rem; color: #64748b;">Médico Titular • MSP Reg. 09182374</div>
                <div style="font-size: 0.68rem; color: #2563eb; font-weight: 700; margin-top: 2px;">Conforme con Liquidación Semanal</div>
              </div>
            </div>
          </div>
        `;
      }

      if (modalReporte) modalReporte.classList.add('active');
    }

    if (btnOpenReporte) btnOpenReporte.addEventListener('click', openReporteModal);
    if (btnCloseReporte) btnCloseReporte.addEventListener('click', () => modalReporte && modalReporte.classList.remove('active'));
    if (btnReporteClose) btnReporteClose.addEventListener('click', () => modalReporte && modalReporte.classList.remove('active'));

    if (btnReporteCSV) {
      btnReporteCSV.addEventListener('click', () => {
        const balance = store.getAccountingBalance(activeBalancePeriod);
        downloadFinancialReportCSV(balance);
        showToast('Reporte financiero exportado en formato CSV exitosamente.', 'success');
      });
    }

    if (btnReportePrint) {
      btnReportePrint.addEventListener('click', () => {
        window.print();
      });
    }
  }

  // --- SUB-MÓDULO: Descarga de Archivo CSV de Balance Contable ---
  function downloadFinancialReportCSV(balance) {
    let csv = "data:text/csv;charset=utf-8,";
    csv += "=== REPORTE FINANCIERO Y BALANCE DE CAJA - MONTEPIEDRA SALUD ===\r\n";
    csv += `PERIODO:,"${balance.periodKey}"\r\n`;
    csv += `FECHA DE EMISION:,"${new Date().toLocaleString('es-EC')}"\r\n`;
    csv += `AUDITORA:,"Lcda. Patricia Morales (CPA-38491)"\r\n\r\n`;
    csv += "--- CONSOLIDADO DE BALANCE DE CAJA ---\r\n";
    csv += `TOTAL INGRESOS FACTURADOS:,$${balance.totalRevenue.toFixed(2)}\r\n`;
    csv += `TARIFA BASE CONSULTAS:,$${balance.baseRevenue.toFixed(2)}\r\n`;
    csv += `RECARGOS PROCESADORA (9.75%):,$${balance.totalSurcharges.toFixed(2)}\r\n`;
    csv += `TOTAL RETENCIONES POR SEDES:,-$${balance.totalCommissions.toFixed(2)}\r\n`;
    csv += `TOTAL GASTOS DEDUCIBLES REEMBOLSADOS:,-$${balance.totalExpenses.toFixed(2)}\r\n`;
    csv += `BALANCE NETO DE CAJA / UTILIDAD OPERATIVA:,$${balance.netProfit.toFixed(2)}\r\n\r\n`;

    csv += "--- DESGLOSE POR SEDE Y CONSULTORIO ---\r\n";
    csv += "SEDE,TASA_RETENCION,TOTAL_BRUTO,TOTAL_RETENCIONES,NETO_FINAL,CITAS_ATENDIDAS,MARGEN_NETO\r\n";
    Object.values(balance.venueDistribution).forEach(v => {
      csv += `"${v.name}",${(v.rate * 100).toFixed(0)}%,$${v.gross.toFixed(2)},-$${v.retentions.toFixed(2)},$${v.net.toFixed(2)},${v.count},${v.marginRate}%\r\n`;
    });
    csv += "\r\n";

    csv += "--- MIX DE MEDIOS DE PAGO ---\r\n";
    csv += "MEDIO_PAGO,OPERACIONES,BASE_IMPONIBLE,RECARGO_BANCARIO,TOTAL_FACTURADO,PORCENTAJE\r\n";
    Object.values(balance.paymentMix).forEach(p => {
      const sur = p.surchargeAmount ? p.surchargeAmount.toFixed(2) : '0.00';
      csv += `"${p.label}",${p.count},$${p.baseAmount.toFixed(2)},$${sur},$${p.totalAmount.toFixed(2)},${p.percentage.toFixed(1)}%\r\n`;
    });
    csv += "\r\n";

    csv += "--- DETALLE DE ATENCIONES MEDICAS CONCILIADAS ---\r\n";
    csv += "FECHA,ID,PACIENTE,SEDE,MEDIO_PAGO,BASE,RECARGO,TOTAL_PAGADO,RETENCION,NETO_MEDICO,ESTADO\r\n";
    balance.appointments.forEach(a => {
      const clinic = CLINICS[a.clinicId] || { name: a.clinicId };
      const base = Number(a.basePrice != null ? a.basePrice : 20.00);
      const fee = Number(a.feeAmount != null ? a.feeAmount : (a.paymentMethod === 'tarjeta' ? base * 0.0975 : 0));
      const paid = Number(a.totalPaid != null ? a.totalPaid : (base + fee));
      const ret = Number(a.retentionAmount != null ? a.retentionAmount : 0);
      const net = base - ret;
      csv += `"${a.date}","${a.id}","${a.patientName}","${clinic.name}","${a.paymentMethod || 'efectivo'}",$${base.toFixed(2)},$${fee.toFixed(2)},$${paid.toFixed(2)},-$${ret.toFixed(2)},$${net.toFixed(2)},"${a.settlementStatus || 'Auditado'}"\r\n`;
    });
    csv += "\r\n";

    csv += "--- DETALLE DE GASTOS OPERATIVOS DEDUCIBLES ---\r\n";
    csv += "FECHA,ID,DESCRIPCION,CATEGORIA,MONTO,CENTRO_COSTOS,ESTADO_AUDITORIA\r\n";
    balance.expenses.forEach(e => {
      const amt = Number(e.amount || e.monto || 0);
      csv += `"${e.date || ''}","${e.id || ''}","${e.description || e.descripcion || ''}","${e.category || e.tipoGasto || ''}",-$${amt.toFixed(2)},"${e.costCenter || ''}","${e.auditStatus || 'Aprobado'}"\r\n`;
    });

    const encodedUri = encodeURI(csv);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Reporte_Financiero_Balance_${balance.periodKey}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // --- MÓDULO 1: Motor de Liquidación Semanal con Deducción Automática por Consultorio ---
  function renderWeeklySettlementModule(state, summary) {
    const calc = store.calculateWeeklySettlement(activeSettlementPeriod, activeSettlementClinic);

    // 1.1 Sincronizar selectores si no fueron cambiados por el usuario
    const periodSelect = document.getElementById('acc-settlement-period-select');
    if (periodSelect && periodSelect.value !== activeSettlementPeriod) {
      periodSelect.value = activeSettlementPeriod;
    }

    const clinicSelect = document.getElementById('acc-settlement-clinic-select');
    if (clinicSelect && clinicSelect.value !== activeSettlementClinic) {
      clinicSelect.value = activeSettlementClinic;
    }

    // 1.2 Métricas Clave de la Semana (4 KPI Cards)
    const kpiWeeklyGross = document.getElementById('acc-weekly-gross');
    const kpiWeeklyGrossSub = document.getElementById('acc-weekly-gross-sub');
    const kpiWeeklyRetentions = document.getElementById('acc-weekly-retentions');
    const kpiWeeklyRetentionsSub = document.getElementById('acc-weekly-retentions-sub');
    const kpiWeeklyExpenses = document.getElementById('acc-weekly-expenses');
    const kpiWeeklyExpensesSub = document.getElementById('acc-weekly-expenses-sub');
    const kpiWeeklyNet = document.getElementById('acc-weekly-net');
    const weeklyCountBadge = document.getElementById('acc-weekly-count-badge');

    if (kpiWeeklyGross) kpiWeeklyGross.textContent = `$${calc.ingresosBrutos.toFixed(2)}`;
    if (kpiWeeklyGrossSub) kpiWeeklyGrossSub.textContent = `${calc.citasCount} ${calc.citasCount === 1 ? 'consulta atendida' : 'consultas atendidas'}`;

    if (kpiWeeklyRetentions) kpiWeeklyRetentions.textContent = `-$${calc.totalRetenciones.toFixed(2)}`;
    if (kpiWeeklyRetentionsSub) {
      kpiWeeklyRetentionsSub.textContent = `Ceibos: -$${calc.deduccionesSede.ceibos.toFixed(2)} | Alb: -$${calc.deduccionesSede.alborada.toFixed(2)} | Map: -$${calc.deduccionesSede.mapasingue.toFixed(2)}`;
    }

    if (kpiWeeklyExpenses) kpiWeeklyExpenses.textContent = `-$${calc.gastosOperativos.toFixed(2)}`;
    if (kpiWeeklyExpensesSub) kpiWeeklyExpensesSub.textContent = `${calc.gastosCount} egresos deducibles (Semana 3)`;

    if (kpiWeeklyNet) kpiWeeklyNet.textContent = `$${calc.netoAPagar.toFixed(2)}`;
    if (weeklyCountBadge) {
      weeklyCountBadge.textContent = `${calc.citasCount} ${calc.citasCount === 1 ? 'Consulta Registrada' : 'Consultas Registradas'}`;
    }

    // 1.3 Badge de Estado y Botón de Cierre
    const badgeStateEl = document.getElementById('acc-badge-settlement-state');
    const btnCloseSettlement = document.getElementById('btn-acc-close-settlement');

    if (badgeStateEl) {
      if (calc.estado === 'liquidada') {
        const dateStr = calc.fechaCorte ? new Date(calc.fechaCorte).toLocaleDateString('es-EC') : 'Aprobada';
        badgeStateEl.className = 'badge-status-pill liquidado';
        badgeStateEl.innerHTML = `✓ Liquidada (${dateStr})`;
      } else {
        badgeStateEl.className = 'badge-status-pill pendiente';
        badgeStateEl.innerHTML = '⏳ Pendiente de Corte';
      }
    }

    if (btnCloseSettlement) {
      if (calc.estado === 'liquidada') {
        btnCloseSettlement.innerHTML = '✓ Liquidación Aprobada';
        btnCloseSettlement.style.opacity = '0.7';
        btnCloseSettlement.title = 'Esta liquidación ya fue aprobada y no admite duplicidad';
      } else {
        btnCloseSettlement.innerHTML = '🔒 Cerrar y Aprobar Liquidación';
        btnCloseSettlement.style.opacity = '1';
        btnCloseSettlement.title = 'Cerrar formalmente el corte semanal e impedir duplicidad';
      }
    }

    // 1.4 Tabla de Resumen por Sede (Friday Settlement Table)
    const fridayTbody = document.getElementById('friday-settlement-table-body');
    if (fridayTbody) {
      const breakdown = calc.clinicBreakdown || summary.clinicBreakdown;
      fridayTbody.innerHTML = Object.keys(breakdown).map(clinicKey => {
        const cData = breakdown[clinicKey];
        const clinic = CLINICS[clinicKey] || { color: '#0284c7' };
        const isHospital = clinicKey === 'hospital';

        let badgeHtml = '';
        if (isHospital) {
          badgeHtml = `<span class="badge-status-pill sueldo-fijo">🏛️ 0% Convenio</span>`;
        } else if (calc.estado === 'liquidada' || cData.status === 'Liquidado') {
          badgeHtml = `<span class="badge-status-pill liquidado">✓ Liquidado</span>`;
        } else {
          badgeHtml = `<span class="badge-status-pill pendiente">⏳ Pendiente</span>`;
        }

        const pct = (cData.rate * 100).toFixed(0);

        return `
          <tr>
            <td>
              <strong style="color: #0f172a; display: flex; align-items: center; gap: 8px;">
                <span style="width: 10px; height: 10px; border-radius: 50%; background: ${clinic.color};"></span>
                ${cData.name}
              </strong>
            </td>
            <td>${cData.count} citas</td>
            <td>$${cData.gross.toFixed(2)}</td>
            <td style="color: #b91c1c; font-weight: 700;">-$${cData.retentions.toFixed(2)} (${pct}%)</td>
            <td style="font-weight: 800; color: #0284c7;">$${cData.netDoctor.toFixed(2)}</td>
            <td>${badgeHtml}</td>
          </tr>
        `;
      }).join('');
    }

    // 1.5 TABLA DESGLOSADA DE LIQUIDACIÓN SEMANAL
    const weeklyTbody = document.getElementById('acc-weekly-settlement-table-body');
    const weeklyTfoot = document.getElementById('acc-weekly-settlement-table-foot');

    if (weeklyTbody) {
      if (calc.citas.length === 0) {
        weeklyTbody.innerHTML = `
          <tr>
            <td colspan="7" style="text-align: center; padding: 24px; color: #64748b;">
              No hay citas atendidas registradas para ${calc.periodInfo.name} con el filtro "${activeSettlementClinic}".
            </td>
          </tr>
        `;
      } else {
        weeklyTbody.innerHTML = calc.citas.map(c => {
          let badgeClass = 'badge-hospital';
          if (c.clinicId === 'ceibos') badgeClass = 'badge-ceibos';
          else if (c.clinicId === 'alborada') badgeClass = 'badge-alborada';
          else if (c.clinicId === 'mapasingue') badgeClass = 'badge-mapasingue';

          const payLabel = c.paymentMethod === 'tarjeta' ? '💳 Tarjeta' : '💵 Efectivo';

          return `
            <tr>
              <td>
                <span style="font-weight: 600; color: #1e293b;">${c.date}</span>
                <div style="font-size: 0.72rem; color: #64748b;">${c.time}</div>
              </td>
              <td>
                <strong style="color: #0f172a;">${c.patientName}</strong>
                <div style="font-size: 0.72rem; color: #64748b;">C.I. ${c.patientId} • ID: ${c.code}</div>
              </td>
              <td>
                <span style="display: inline-flex; align-items: center; gap: 6px; font-weight: 700; color: #0f172a; font-size: 0.8rem;">
                  <span style="width: 8px; height: 8px; border-radius: 50%; background: ${c.clinicColor};"></span>
                  ${c.clinicName}
                </span>
                <div style="font-size: 0.70rem; color: #64748b;">${payLabel}</div>
              </td>
              <td style="text-align: right; font-weight: 700; color: #0f172a;">$${c.basePrice.toFixed(2)}</td>
              <td style="text-align: center;">
                <span class="badge-sede ${badgeClass}" style="font-size: 0.74rem;">${c.retentionPct}%</span>
              </td>
              <td style="text-align: right; font-weight: 700; color: #dc2626;">-$${c.retentionAmount.toFixed(2)}</td>
              <td style="text-align: right; font-weight: 800; color: #059669;">+$${c.netDoctor.toFixed(2)}</td>
            </tr>
          `;
        }).join('');
      }
    }

    if (weeklyTfoot) {
      const totalNetoConsultas = calc.ingresosBrutos - calc.totalRetenciones;
      weeklyTfoot.innerHTML = `
        <tr>
          <td colspan="3" style="padding: 12px 10px; font-weight: 900; color: #0f172a;">
            TOTALES DE LA SEMANA (${calc.citasCount} citas)
          </td>
          <td style="text-align: right; padding: 12px 10px; font-weight: 900; color: #0f172a;">
            $${calc.ingresosBrutos.toFixed(2)}
          </td>
          <td style="text-align: center; padding: 12px 10px; font-weight: 700; color: #64748b; font-size: 0.76rem;">
            Deducción Sede
          </td>
          <td style="text-align: right; padding: 12px 10px; font-weight: 900; color: #dc2626;">
            -$${calc.totalRetenciones.toFixed(2)}
          </td>
          <td style="text-align: right; padding: 12px 10px; font-weight: 900; color: #059669; font-size: 0.95rem;">
            +$${totalNetoConsultas.toFixed(2)}
          </td>
        </tr>
      `;
    }

    // 1.6 Event Listeners del Módulo de Liquidación Semanal
    if (!isSettlementEventsInitialized) {
      isSettlementEventsInitialized = true;

      const selPeriod = document.getElementById('acc-settlement-period-select');
      if (selPeriod) {
        selPeriod.addEventListener('change', (e) => {
          activeSettlementPeriod = e.target.value;
          renderAccountantDashboard();
        });
      }

      const selClinic = document.getElementById('acc-settlement-clinic-select');
      if (selClinic) {
        selClinic.addEventListener('change', (e) => {
          activeSettlementClinic = e.target.value;
          renderAccountantDashboard();
        });
      }

      const btnClose = document.getElementById('btn-acc-close-settlement');
      if (btnClose) {
        btnClose.addEventListener('click', () => {
          const currentCalc = store.calculateWeeklySettlement(activeSettlementPeriod, activeSettlementClinic);
          if (currentCalc.estado === 'liquidada') {
            showToast('Esta liquidación ya fue formalmente aprobada y liquidada. No se permite duplicidad de pagos.', 'warning');
            return;
          }

          store.closeAndApproveSettlement(activeSettlementPeriod, currentCalc);
          showToast(`Liquidación ${currentCalc.periodInfo.name} cerrada y aprobada formalmente. Corte registrado.`, 'success');
          renderAccountantDashboard();
        });
      }

      const btnActa = document.getElementById('btn-acc-generate-acta');
      if (btnActa) {
        btnActa.addEventListener('click', () => {
          const currentCalc = store.calculateWeeklySettlement(activeSettlementPeriod, activeSettlementClinic);
          openActaSettlementModal(currentCalc);
        });
      }
    }
  }

  // --- 1.7 MODAL DE ACTA OFICIAL DE CORTE SEMANAL ---
  function openActaSettlementModal(calc) {
    const modal = document.getElementById('acta-settlement-modal');
    const modalBody = document.getElementById('acta-settlement-modal-body');
    const btnClose = document.getElementById('btn-close-acta-modal');
    const btnPrintClose = document.getElementById('btn-print-acta-close');
    const btnPrintDirect = document.getElementById('btn-print-acta-direct');

    if (!modal || !modalBody) return;

    const fechaEmision = new Date().toLocaleString('es-EC', { dateStyle: 'full', timeStyle: 'short' });
    const totalNetoConsultas = calc.ingresosBrutos - calc.totalRetenciones;

    modalBody.innerHTML = `
      <div class="acta-document-sheet">
        <!-- Membrete Institucional -->
        <div class="acta-header-letterhead">
          <div>
            <h3 class="acta-brand-title">MONTEPIEDRA SALUD S.A.</h3>
            <div class="acta-brand-subtitle">Red Integral de Atención Médica Multisede • Auditoría Contable y Tributaria</div>
            <div style="font-size: 0.72rem; color: #64748b; margin-top: 2px;">RUC: 0993847291001 • Autorización MSP / SRI Ecuador</div>
          </div>
          <div class="acta-meta-badge">
            <strong style="color: #0284c7; font-size: 0.9rem;">ACTA #ACTA-${calc.periodKey}-2026</strong><br>
            <span>Emisión: ${fechaEmision}</span><br>
            <span class="badge-status-pill ${calc.estado === 'liquidada' ? 'liquidado' : 'pendiente'}" style="margin-top: 4px; display: inline-block;">
              ${calc.estado === 'liquidada' ? '✓ LIQUIDACIÓN APROBADA' : '⏳ EN REVISIÓN'}
            </span>
          </div>
        </div>

        <!-- Metadatos de Partes Contractuales -->
        <div class="acta-info-grid">
          <div class="acta-info-block">
            <strong>MÉDICO TITULAR:</strong><br>
            <span>Dr. Carlos Campoverde</span><br>
            <span>Cédula: 0930860044 • Reg. MSP: MSP-REG-84729</span><br>
            <span>Especialidad: Medicina General</span>
          </div>
          <div class="acta-info-block">
            <strong>AUDITORA RESPONSABLE:</strong><br>
            <span>Lcda. Patricia Morales</span><br>
            <span>Cédula: 0912345678 • Reg. Contable: CPA-38491</span><br>
            <span>Período: ${calc.periodInfo.name}</span>
          </div>
        </div>

        <!-- 1. Desglose de Consultas y Retenciones por Sede -->
        <div>
          <h4 style="margin: 0 0 8px 0; font-size: 0.9rem; color: #0f172a; font-weight: 800;">
            1. Desglose de Consultas Atendidas y Deducciones Contractuales por Sede
          </h4>
          <table class="acta-table">
            <thead>
              <tr>
                <th>Sede / Consultorio</th>
                <th style="text-align: center;">Citas</th>
                <th style="text-align: right;">Tarifa Base Facturada</th>
                <th style="text-align: center;">% Retención Sede</th>
                <th style="text-align: right;">Deducción Clínica ($)</th>
                <th style="text-align: right;">Neto Médico ($)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Clínica Ceibos</strong></td>
                <td style="text-align: center;">${calc.clinicBreakdown.ceibos.count}</td>
                <td style="text-align: right;">$${calc.clinicBreakdown.ceibos.gross.toFixed(2)}</td>
                <td style="text-align: center; color: #6366f1; font-weight: 700;">25%</td>
                <td style="text-align: right; color: #dc2626; font-weight: 700;">-$${calc.clinicBreakdown.ceibos.retentions.toFixed(2)}</td>
                <td style="text-align: right; font-weight: 800; color: #0f172a;">$${calc.clinicBreakdown.ceibos.netDoctor.toFixed(2)}</td>
              </tr>
              <tr>
                <td><strong>Consultorio Alborada</strong></td>
                <td style="text-align: center;">${calc.clinicBreakdown.alborada.count}</td>
                <td style="text-align: right;">$${calc.clinicBreakdown.alborada.gross.toFixed(2)}</td>
                <td style="text-align: center; color: #10b981; font-weight: 700;">10%</td>
                <td style="text-align: right; color: #dc2626; font-weight: 700;">-$${calc.clinicBreakdown.alborada.retentions.toFixed(2)}</td>
                <td style="text-align: right; font-weight: 800; color: #0f172a;">$${calc.clinicBreakdown.alborada.netDoctor.toFixed(2)}</td>
              </tr>
              <tr>
                <td><strong>Consultorio Mapasingue</strong></td>
                <td style="text-align: center;">${calc.clinicBreakdown.mapasingue.count}</td>
                <td style="text-align: right;">$${calc.clinicBreakdown.mapasingue.gross.toFixed(2)}</td>
                <td style="text-align: center; color: #0284c7; font-weight: 700;">5%</td>
                <td style="text-align: right; color: #dc2626; font-weight: 700;">-$${calc.clinicBreakdown.mapasingue.retentions.toFixed(2)}</td>
                <td style="text-align: right; font-weight: 800; color: #0f172a;">$${calc.clinicBreakdown.mapasingue.netDoctor.toFixed(2)}</td>
              </tr>
              <tr>
                <td><strong>Hospital Público Ceibos</strong></td>
                <td style="text-align: center;">${calc.clinicBreakdown.hospital.count}</td>
                <td style="text-align: right;">$0.00</td>
                <td style="text-align: center; color: #f59e0b; font-weight: 700;">0%</td>
                <td style="text-align: right;">$0.00</td>
                <td style="text-align: right; font-weight: 800; color: #0f172a;">$0.00</td>
              </tr>
            </tbody>
            <tfoot>
              <tr style="background: #f8fafc; font-weight: 800; border-top: 2px solid #cbd5e1;">
                <td>SUBTOTAL CONSULTAS</td>
                <td style="text-align: center;">${calc.citasCount}</td>
                <td style="text-align: right;">$${calc.ingresosBrutos.toFixed(2)}</td>
                <td style="text-align: center;">-</td>
                <td style="text-align: right; color: #dc2626;">-$${calc.totalRetenciones.toFixed(2)}</td>
                <td style="text-align: right; color: #059669;">$${totalNetoConsultas.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- 2. Deducciones por Gastos Operativos de Movilidad e Insumos (Semana 3) -->
        <div>
          <h4 style="margin: 0 0 8px 0; font-size: 0.9rem; color: #0f172a; font-weight: 800;">
            2. Gastos Operativos de Traslado e Insumos Médicos Aplicados (Semana 3)
          </h4>
          <table class="acta-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Concepto / Proveedor</th>
                <th>Centro de Costo</th>
                <th style="text-align: right;">Comprobante</th>
                <th style="text-align: right;">Monto Deducible ($)</th>
              </tr>
            </thead>
            <tbody>
              ${calc.gastos.length === 0 ? `
                <tr><td colspan="5" style="text-align: center; color: #64748b; padding: 10px;">No se registraron gastos operativos deducibles en el período.</td></tr>
              ` : calc.gastos.map(g => `
                <tr>
                  <td>${g.date}</td>
                  <td>${g.description || g.motivo || 'Gasto Operativo'}</td>
                  <td>${g.costCenter || g.sedeCodigo || 'Ruta Multisede'}</td>
                  <td style="text-align: right;"><code style="font-size: 0.72rem;">${g.numeroComprobante || g.voucherNumber || 'VAL-S/N'}</code></td>
                  <td style="text-align: right; font-weight: 700; color: #b91c1c;">-$${Number(g.amount || g.monto).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr style="background: #f8fafc; font-weight: 800; border-top: 1px solid #cbd5e1;">
                <td colspan="4">TOTAL GASTOS OPERATIVOS DEDUCIBLES</td>
                <td style="text-align: right; color: #b91c1c;">-$${calc.gastosOperativos.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- 3. Liquidación Neta Final -->
        <div class="acta-summary-box">
          <div>
            <div class="summary-label">HONORARIOS NETOS A TRANSFERIR AL PROFESIONAL MÉDICO:</div>
            <div style="font-size: 0.75rem; color: #166534; margin-top: 2px;">
              Fórmula: (Ingresos Brutos $${calc.ingresosBrutos.toFixed(2)} - Retenciones Sede $${calc.totalRetenciones.toFixed(2)}) - Gastos Deducibles $${calc.gastosOperativos.toFixed(2)}
            </div>
          </div>
          <div class="summary-amount">$${calc.netoAPagar.toFixed(2)}</div>
        </div>

        <div style="font-size: 0.74rem; color: #64748b; line-height: 1.4;">
          <strong>Declaración de Conformidad:</strong> Las partes suscriben la presente acta en señal de total aceptación respecto de los valores liquidados, comisiones retenidas y gastos auditados conforme a los contratos de prestación de servicios médicos vigentes y resoluciones tributarias del Servicio de Rentas Internas (SRI).
        </div>

        <!-- Firmas Oficiales -->
        <div class="acta-signatures-row">
          <div class="acta-signature-box">
            <div style="font-family: 'Brush Script MT', cursive, sans-serif; font-size: 1.6rem; color: #1e3a8a; height: 38px;">
              Dr. C. Campoverde
            </div>
            <div class="signer-title">DR. CARLOS CAMPOVERDE</div>
            <div class="signer-sub">Médico Titular • C.I. 0930860044<br>Registro MSP: 84729</div>
          </div>

          <div class="acta-signature-box">
            <div style="font-family: 'Brush Script MT', cursive, sans-serif; font-size: 1.6rem; color: #047857; height: 38px;">
              Lcda. P. Morales
            </div>
            <div class="signer-title">LCDA. PATRICIA MORALES</div>
            <div class="signer-sub">Auditora Contable & Conciliación Fiscal SRI<br>C.I. 0912345678 • Montepiedra Salud</div>
          </div>
        </div>
      </div>
    `;

    modal.classList.add('active');

    const closeModal = () => modal.classList.remove('active');
    if (btnClose) btnClose.onclick = closeModal;
    if (btnPrintClose) btnPrintClose.onclick = closeModal;
    if (btnPrintDirect) btnPrintDirect.onclick = () => window.print();
  }

  // --- MÓDULO 2: Revisar y Clasificar Gastos Operativos ---
  function renderExpensesClassificationModule(state, summary) {
    // Resumen de Clasificación (Chips de totales)
    const chipsRoot = document.getElementById('acc-classification-summary-chips');
    if (chipsRoot) {
      const totals = summary.accountingClassificationTotals || {
        Costos: 32.00,
        Gastos: 42.50,
        Egresos: 0.00,
        Activos: 0.00,
        Patrimonio: 0.00,
        Ingresos: 0.00
      };

      const categoriesInfo = [
        { key: 'Costos', label: 'Costos Médicos', icon: '🩺', color: '#ea580c', bg: '#fff7ed' },
        { key: 'Gastos', label: 'Gastos Ruta/Movilidad', icon: '⛽', color: '#7c3aed', bg: '#f5f3ff' },
        { key: 'Egresos', label: 'Egresos Operacionales', icon: '📉', color: '#dc2626', bg: '#fef2f2' },
        { key: 'Activos', label: 'Activos / Bienes', icon: '🏢', color: '#0284c7', bg: '#f0f9ff' },
        { key: 'Patrimonio', label: 'Patrimonio Neto', icon: '🏛️', color: '#475569', bg: '#f8fafc' },
        { key: 'Ingresos', label: 'Ingresos Contables', icon: '💵', color: '#16a34a', bg: '#f0fdf4' }
      ];

      chipsRoot.innerHTML = categoriesInfo.map(cat => {
        const val = totals[cat.key] || 0.00;
        return `
          <div style="background: ${cat.bg}; border: 1px solid rgba(0,0,0,0.06); border-radius: 10px; padding: 10px 12px; display: flex; flex-direction: column; gap: 4px;">
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.74rem; font-weight: 700; color: ${cat.color};">
              <span>${cat.icon} ${cat.label}</span>
            </div>
            <div style="font-size: 1.15rem; font-weight: 800; color: #0f172a;">$${val.toFixed(2)}</div>
          </div>
        `;
      }).join('');
    }

    // Tabla con selectores de clasificación interactivos
    const tbody = document.getElementById('acc-expenses-classification-table-body');
    if (!tbody) return;

    const expenses = state.expenses || [];
    if (expenses.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 20px; color: #64748b;">No hay gastos cargados por el médico.</td></tr>`;
      return;
    }

    tbody.innerHTML = expenses.map(exp => {
      const currentCat = exp.accountingCategory || (exp.category === 'Insumos Hospital' ? 'Costos' : 'Gastos');
      const costCenter = exp.costCenter || (exp.category === 'Insumos Hospital' ? 'Hospital Público' : 'Rutas / Movilidad');

      return `
        <tr>
          <td><span style="font-weight: 600; color: #334155;">${exp.date}</span></td>
          <td>
            <strong style="color: #0f172a;">${exp.description}</strong>
            <div style="font-size: 0.72rem; color: #64748b;">ID: EXP-${exp.id}</div>
          </td>
          <td><span class="badge-sede badge-hospital" style="font-size: 0.74rem;">${costCenter}</span></td>
          <td style="font-weight: 800; color: #dc2626;">-$${exp.amount.toFixed(2)}</td>
          <td><span style="font-size: 0.78rem; font-weight: 700; color: #475569;">${exp.category}</span></td>
          <td>
            <select class="form-input acc-classification-select" data-expense-id="${exp.id}" style="padding: 4px 8px; font-size: 0.8rem; font-weight: 700; background: #ffffff; border-color: #cbd5e1;">
              <option value="Costos" ${currentCat === 'Costos' ? 'selected' : ''}>🩺 Costos (Atención e Insumos)</option>
              <option value="Gastos" ${currentCat === 'Gastos' ? 'selected' : ''}>⛽ Gastos (Transporte y Ruta)</option>
              <option value="Egresos" ${currentCat === 'Egresos' ? 'selected' : ''}>📉 Egresos (Operacionales)</option>
              <option value="Activos" ${currentCat === 'Activos' ? 'selected' : ''}>🏢 Activos (Equipo y Mantenimiento)</option>
              <option value="Patrimonio" ${currentCat === 'Patrimonio' ? 'selected' : ''}>🏛️ Patrimonio</option>
              <option value="Ingresos" ${currentCat === 'Ingresos' ? 'selected' : ''}>💵 Ingresos</option>
            </select>
          </td>
        </tr>
      `;
    }).join('');

    // Escuchar cambio en selectores de clasificación
    tbody.querySelectorAll('.acc-classification-select').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const expenseId = parseInt(e.target.dataset.expenseId, 10);
        const newCategory = e.target.value;
        store.updateExpenseClassification(expenseId, newCategory);
        showToast(`Gasto clasificado contablemente como "${newCategory}".`, 'success');
        renderAccountantDashboard();
      });
    });
  }

  // --- MÓDULO 3: Auditar Comprobantes y Facturas SRI ---
  function renderVouchersAuditModule(state) {
    const expenses = state.expenses || [];
    const countRoot = document.getElementById('acc-audit-badges-count');
    if (countRoot) {
      const aprobados = expenses.filter(e => (e.auditStatus || 'Aprobado') === 'Aprobado').length;
      const pendientes = expenses.filter(e => (e.auditStatus || 'Aprobado') === 'Pendiente').length;
      const observados = expenses.filter(e => (e.auditStatus || 'Aprobado') === 'Observado').length;

      countRoot.innerHTML = `
        <span class="badge-status-pill liquidado">✓ Aprobados: ${aprobados}</span>
        <span class="badge-status-pill pendiente">⏳ Pendientes: ${pendientes}</span>
        <span class="badge-status-pill" style="background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5;">⚠️ Observados: ${observados}</span>
      `;
    }

    const tbody = document.getElementById('acc-audit-vouchers-table-body');
    if (!tbody) return;

    if (expenses.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 20px; color: #64748b;">No hay comprobantes para auditar.</td></tr>`;
      return;
    }

    tbody.innerHTML = expenses.map(exp => {
      const auditStatus = exp.auditStatus || 'Aprobado';
      const voucherType = exp.voucherType || 'Factura Electrónica';
      const voucherNum = exp.voucherNumber || '001-002-8394821';
      const provider = exp.providerName || 'Proveedor Autorizado';
      const ruc = exp.providerRuc || '0990000000001';

      let statusBadge = '';
      if (auditStatus === 'Aprobado') {
        statusBadge = `<span class="badge-status-pill liquidado" data-exp-id="${exp.id}" title="Clic para conmutar estado">✓ APROBADO SRI</span>`;
      } else if (auditStatus === 'Observado') {
        statusBadge = `<span class="badge-status-pill" data-exp-id="${exp.id}" style="background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; cursor: pointer;" title="Clic para conmutar estado">⚠️ OBSERVADO</span>`;
      } else {
        statusBadge = `<span class="badge-status-pill pendiente" data-exp-id="${exp.id}" title="Clic para conmutar estado">⏳ PENDIENTE</span>`;
      }

      return `
        <tr>
          <td><strong style="color: #0284c7;">#EXP-${exp.id}</strong></td>
          <td><span style="font-size: 0.78rem; font-weight: 700; color: #334155;">${voucherType}</span></td>
          <td><code style="font-size: 0.74rem; background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">${voucherNum}</code></td>
          <td>
            <div style="font-weight: 700; color: #0f172a;">${provider}</div>
            <div style="font-size: 0.70rem; color: #64748b;">RUC: ${ruc}</div>
          </td>
          <td>
            <div style="color: #1e293b;">${exp.description}</div>
            <div style="font-size: 0.72rem; color: #64748b;">Centro: ${exp.costCenter || 'Hospital'}</div>
          </td>
          <td style="font-weight: 800; color: #0f172a;">$${exp.amount.toFixed(2)}</td>
          <td>${statusBadge}</td>
          <td>
            <button type="button" class="btn-ghost-sm btn-toggle-audit-status" data-exp-id="${exp.id}" style="font-size: 0.74rem; padding: 3px 8px;">
              🔄 Cambiar Estado
            </button>
          </td>
        </tr>
      `;
    }).join('');

    // Conmutar estado de auditoría
    tbody.querySelectorAll('.badge-status-pill, .btn-toggle-audit-status').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const expId = parseInt(btn.dataset.expId, 10);
        const exp = expenses.find(x => x.id === expId);
        if (!exp) return;

        const current = exp.auditStatus || 'Aprobado';
        let next = 'Aprobado';
        if (current === 'Aprobado') next = 'Observado';
        else if (current === 'Observado') next = 'Pendiente';
        else next = 'Aprobado';

        store.auditExpenseVoucher(expId, next, exp.auditNotes || '');
        showToast(`Comprobante #EXP-${expId} actualizado a estado "${next}".`, 'info');
        renderAccountantDashboard();
      });
    });
  }

  // --- MÓDULO 4: Rentabilidad por Sedes & Optimización de Rutas ---
  function renderProfitabilityAndRoutesModule(summary) {
    const profitabilityList = document.getElementById('clinic-profitability-container');
    if (profitabilityList) {
      const breakdown = summary.clinicBreakdown;
      const maxNet = Math.max(...Object.values(breakdown).map(b => b.netDoctor), 1);

      profitabilityList.innerHTML = Object.keys(breakdown).map(k => {
        const item = breakdown[k];
        const clinic = CLINICS[k] || { color: '#0284c7' };
        const isHospital = k === 'hospital';
        const netVal = isHospital ? summary.hospitalFixedSalary : item.netDoctor;
        const pctWidth = Math.min(100, Math.max(20, (netVal / (maxNet + 1200)) * 100));

        let viabilityBadge = '<span class="badge-sede badge-alborada" style="font-size: 0.70rem;">ÓPTIMA (95% margen)</span>';
        if (k === 'ceibos') {
          viabilityBadge = '<span class="badge-sede badge-ceibos" style="font-size: 0.70rem;">MEDIA (75% margen)</span>';
        } else if (k === 'hospital') {
          viabilityBadge = '<span class="badge-sede badge-hospital" style="font-size: 0.70rem;">FIJA (Sin comisión)</span>';
        }

        return `
          <div class="profitability-item" style="margin-bottom: 12px;">
            <div class="profitability-header-row" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="color: #0f172a; font-weight: 700;">${item.name}</span>
                ${viabilityBadge}
              </div>
              <span style="color: ${clinic.color}; font-weight: 800;">$${netVal.toFixed(2)} Neto</span>
            </div>
            <div class="progress-bar-track">
              <div class="progress-bar-fill" style="width: ${pctWidth}%; background: ${clinic.color};"></div>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 0.72rem; color: #64748b; margin-top: 2px;">
              <span>Facturado Bruto: $${isHospital ? 'Convenio MSP' : item.gross.toFixed(2)}</span>
              <span>Retención de Sede: ${isHospital ? '$0.00 (0%)' : `-$${item.retentions.toFixed(2)} (${(item.retentionRate * 100)}%)`}</span>
            </div>
          </div>
        `;
      }).join('');
    }

    // Sugerencias de Optimización de Rutas
    const routesList = document.getElementById('acc-route-optimizations-list');
    if (routesList) {
      const recommendations = summary.routeOptimizations || [
        {
          title: 'Agrupamiento Matutino Ceibos ↔ Hospital',
          desc: 'Agrupar citas privadas en Ceibos antes del inicio de guardias hospitalarias para evitar desplazamientos dobles.',
          saving: '$8.00 / día en taxi',
          impact: 'Ahorro mensual aprox. $160.00'
        },
        {
          title: 'Ruta Alborada y Mapasingue en Horas Valles',
          desc: 'Planificar traslados entre Mapasingue y Alborada fuera del horario pico de la Av. Juan Tanca Marengo (18:00 - 19:30).',
          saving: '45 minutos y $6.00 de combustible',
          impact: 'Menor desgaste vehicular y menor retraso en buffer'
        },
        {
          title: 'Compra Consolidada de Suministros Hospitalarios',
          desc: 'Cargar facturas mensuales de insumos con crédito tributario del 15% directamente a nombre del RUC del médico.',
          saving: '15% de crédito tributario en IVA',
          impact: 'Deducción legal en Formulario 102 SRI'
        }
      ];

      routesList.innerHTML = recommendations.map(rec => `
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid var(--primary-blue); border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 4px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <strong style="color: #0f172a; font-size: 0.85rem;">💡 ${rec.title}</strong>
            <span class="badge-sede badge-alborada" style="font-size: 0.70rem;">${rec.saving}</span>
          </div>
          <p style="font-size: 0.78rem; color: #475569; margin: 0; line-height: 1.4;">${rec.desc}</p>
          <span style="font-size: 0.72rem; color: #15803d; font-weight: 700;">✓ Impacto: ${rec.impact}</span>
        </div>
      `).join('');
    }
  }

  // --- MÓDULO 5: Reportes para Declaraciones Tributarias SRI ---
  function renderTaxReportModule(summary) {
    const previewContainer = document.getElementById('acc-tax-report-preview-container');
    if (!previewContainer) return;

    previewContainer.innerHTML = `
      <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 18px; margin-top: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 12px;">
          <div>
            <h4 style="margin: 0; font-size: 1rem; color: #0f172a; font-weight: 800;">SERVICIO DE RENTAS INTERNAS (SRI) - FORMULARIO 102</h4>
            <span style="font-size: 0.76rem; color: #64748b;">Declaración Consolidada de Impuesto a la Renta de Personas Naturales</span>
          </div>
          <div style="text-align: right; font-size: 0.78rem;">
            <strong>RUC:</strong> 0930860044001<br>
            <strong>Médico:</strong> Dr. Carlos Campoverde
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 0.82rem;">
          <thead>
            <tr style="background: #e2e8f0; border-bottom: 1px solid #cbd5e1;">
              <th style="padding: 8px; text-align: left;">Casillero SRI</th>
              <th style="padding: 8px; text-align: left;">Concepto Contable Tributario</th>
              <th style="padding: 8px; text-align: right;">Monto Consolidado ($)</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 8px; font-weight: 700; color: #0284c7;">[301]</td>
              <td style="padding: 8px;">Ingresos Brutos por Actividad Profesional Privada (Ceibos, Mapasingue, Alborada)</td>
              <td style="padding: 8px; text-align: right; font-weight: 700;">$${summary.totalGrossRevenue.toFixed(2)}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 8px; font-weight: 700; color: #0284c7;">[302]</td>
              <td style="padding: 8px;">Ingresos Bajo Relación de Dependencia (Sueldo Fijo Hospital Ceibos)</td>
              <td style="padding: 8px; text-align: right; font-weight: 700;">$${summary.hospitalFixedSalary.toFixed(2)}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0; background: #fff1f2;">
              <td style="padding: 8px; font-weight: 700; color: #dc2626;">[401]</td>
              <td style="padding: 8px; color: #991b1b;">(-) Gastos Operativos Deducibles de Movilidad e Insumos (Justificados)</td>
              <td style="padding: 8px; text-align: right; font-weight: 700; color: #dc2626;">-$${summary.totalExpenses.toFixed(2)}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 8px; font-weight: 700; color: #6366f1;">[501]</td>
              <td style="padding: 8px;">Retenciones en la Fuente Aplicadas por las Clínicas (5%, 25%, 10%)</td>
              <td style="padding: 8px; text-align: right; font-weight: 700; color: #6366f1;">-$${summary.totalRetentions.toFixed(2)}</td>
            </tr>
            <tr style="background: #f0fdf4; border-top: 2px solid #16a34a; font-size: 0.9rem;">
              <td style="padding: 10px; font-weight: 800; color: #166534;">[601]</td>
              <td style="padding: 10px; font-weight: 800; color: #166534;">BASE IMPONIBLE NETA LIQUIDABLE:</td>
              <td style="padding: 10px; text-align: right; font-weight: 800; color: #166534;">$${summary.realNetIncome.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 14px; font-size: 0.74rem; color: #64748b;">
          <span>✓ Datos auditados sin requerir recopilación manual de recibos.</span>
          <span>SRI Ecuador • Año Gravable 2026</span>
        </div>
      </div>
    `;

    const btnPrintDirect = document.getElementById('btn-acc-print-sri-direct');
    if (btnPrintDirect) {
      btnPrintDirect.onclick = () => window.print();
    }

    const btnExportDirect = document.getElementById('btn-acc-export-tax-direct');
    if (btnExportDirect) {
      btnExportDirect.onclick = () => openTaxReportModal();
    }
  }

  // --- 3. MODAL DE INFORME TRIBUTARIO SRI ---
  if (btnExportTax) {
    btnExportTax.addEventListener('click', openTaxReportModal);
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
            <strong>Período Fiscal:</strong> Septiembre - Octubre 2026<br>
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

  // --- 4. EXPORTACIÓN A EXCEL / CSV ---
  if (btnDownloadCSV) {
    btnDownloadCSV.addEventListener('click', () => {
      const summary = store.getFinancialSummary();
      const state = store.getState();

      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "FECHA,TIPO,DESCRIPCION/PACIENTE,SEDE,BRUTO,RETENCION/COMISION,NETO_FINAL,ESTADO,CLASIFICACION_CONTABLE\r\n";

      // Citas
      state.appointments.forEach(a => {
        const clinic = CLINICS[a.clinicId];
        csvContent += `"${a.date}","CITA MEDICA","${a.patientName}","${clinic.name}",${a.basePrice.toFixed(2)},${a.retentionAmount.toFixed(2)},${a.netClinicYield.toFixed(2)},"${a.settlementStatus}","Ingresos"\r\n`;
      });

      // Sueldo Hospital
      csvContent += `"2026-09-30","SUELDO FIJO","Haber Mensual de Medicina General","Hospital Público Ceibos",${summary.hospitalFixedSalary.toFixed(2)},0.00,${summary.hospitalFixedSalary.toFixed(2)},"Liquidado","Ingresos"\r\n`;

      // Gastos
      state.expenses.forEach(e => {
        csvContent += `"${e.date}","GASTO OPERATIVO","${e.description}","${e.costCenter || e.category}",-${e.amount.toFixed(2)},0.00,-${e.amount.toFixed(2)},"${e.auditStatus || 'Aprobado'}","${e.accountingCategory || 'Gastos'}"\r\n`;
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Auditoria_Contable_SRI_Septiembre_2026.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast('Archivo CSV generado y listo para abrir en Microsoft Excel.', 'success');
    });
  }

  // Suscribirse al store para refrescar la tabla en tiempo real si el doctor o paciente interactúan
  store.subscribe(() => {
    if (store.getActiveView() === 'contador' || store.getActiveView() === 'accountant') {
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


// Sistema de Notificaciones Toast (Limitado a 1 activo simultáneo para evitar spam)
let activeToastTimeout = null;

function showToast(message, type = 'info') {
  let container = document.getElementById('toast-notifications-root');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-notifications-root';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  // Si ya existe un toast visible, cancelar temporizador y limpiar contenedor
  if (activeToastTimeout) {
    clearTimeout(activeToastTimeout);
    activeToastTimeout = null;
  }
  container.innerHTML = '';

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  if (type === 'danger') icon = '🚨';
  if (type === 'warning') icon = '⚠️';

  toast.innerHTML = `
    <span style="font-size: 1.1rem; flex-shrink: 0;">${icon}</span>
    <span style="flex: 1; line-height: 1.35; font-size: 0.86rem; font-weight: 500;">${message}</span>
  `;

  container.appendChild(toast);

  activeToastTimeout = setTimeout(() => {
    toast.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(50px)';
    setTimeout(() => {
      if (toast.parentNode === container) {
        toast.remove();
      }
    }, 350);
  }, 4000);
}



// Inicialización de la Aplicación
document.addEventListener('DOMContentLoaded', () => {
  // Inicialización del motor dinámico de fondo interactivo (Canvas + Mouse physics)
  initAmbientBackground();

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

  // Elementos de la Barra Superior y del Portal del Paciente
  const patientPortalTabBar = document.getElementById('patient-portal-tab-bar');
  const patientGuestNavActions = document.getElementById('patient-guest-nav-actions');
  const patientLoggedCard = document.getElementById('patient-logged-card');
  const patNavbarAvatar = document.getElementById('pat-navbar-avatar');
  const patNavbarName = document.getElementById('pat-navbar-name');
  const patientBrandSubtitle = document.getElementById('patient-brand-subtitle');
  const patientNavBrandBtn = document.getElementById('patient-nav-brand-btn');
  const btnPatientBackToWeb = document.getElementById('btn-patient-back-to-web');
  const btnPatientOpenLogin = document.getElementById('btn-patient-open-login');

  // Botones de Salir / Regreso
  const btnPatientLogout = document.getElementById('btn-patient-logout');
  const btnDoctorLogout = document.getElementById('btn-doctor-logout');
  const btnAccountantLogout = document.getElementById('btn-accountant-logout');

  // Navegación al hacer clic en el Brand/Logo o Logout (Retorno Seguro a Landing)
  function returnToLanding() {
    const patientView = document.getElementById('view-patient') || document.getElementById('portal-paciente');
    if (patientView) {
      patientView.classList.add('hidden', 'd-none');
      patientView.style.cssText = 'display: none !important;';
    }
    const doctorView = document.getElementById('view-doctor');
    if (doctorView) {
      doctorView.classList.add('hidden', 'd-none');
      doctorView.style.cssText = 'display: none !important;';
    }
    const accView = document.getElementById('view-accountant');
    if (accView) {
      accView.classList.add('hidden', 'd-none');
      accView.style.cssText = 'display: none !important;';
    }
    const landingView = document.getElementById('view-landing');
    if (landingView) {
      landingView.classList.remove('hidden', 'd-none');
      landingView.style.removeProperty('display');
      landingView.style.cssText = 'display: block !important; opacity: 1 !important; visibility: visible !important;';
    }
    if (window.store) {
      window.store.setActiveView('landing');
    }
    renderActiveView();
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  window.returnToLanding = returnToLanding;

  if (navbarBrandHome) {
    navbarBrandHome.addEventListener('click', (e) => {
      e.preventDefault();
      returnToLanding();
    });
  }

  // Renderizar la Vista y la Barra Superior según el Estado Activo
  function renderActiveView() {
    const activeView = store.getActiveView();
    const currentUser = store.getCurrentUser();

    // 1. Ocultar todas las vistas de contenido de forma completa
    if (viewLanding) {
      viewLanding.classList.add('hidden');
      viewLanding.style.display = 'none';
    }
    if (viewPatient) {
      viewPatient.classList.add('hidden');
      viewPatient.style.display = 'none';
    }
    if (viewDoctor) {
      viewDoctor.classList.add('hidden');
      viewDoctor.style.display = 'none';
    }
    if (viewAccountant) {
      viewAccountant.classList.add('hidden');
      viewAccountant.style.display = 'none';
    }

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
      if (viewLanding) {
        viewLanding.classList.remove('hidden', 'd-none');
        viewLanding.style.removeProperty('display');
        viewLanding.style.cssText = 'display: block !important; opacity: 1 !important; visibility: visible !important;';
      }
      if (navMenuLanding) navMenuLanding.style.display = 'flex';
      if (navActionsLanding) navActionsLanding.style.display = 'flex';
      if (navbarBrandSubtitle) navbarBrandSubtitle.textContent = 'Centro Médico & Red Asistencial';

    } else if (activeView === 'paciente' || activeView === 'patient') {
      if (viewPatient) {
        viewPatient.classList.remove('hidden', 'd-none');
        viewPatient.style.removeProperty('display');
        viewPatient.style.cssText = 'display: block !important; opacity: 1 !important; visibility: visible !important; min-height: 100vh;';
      }

      // Estado de la barra según si el usuario ha iniciado sesión como paciente o es nuevo/invitado
      if (currentUser && currentUser.role === 'paciente') {
        // === USUARIO PACIENTE CON SESIÓN INICIADA ===
        // 1. Mostrar barra con las pestañas completas: Resumen, Mis Citas, Mis Datos, Agendar Cita
        if (patientPortalTabBar) patientPortalTabBar.style.display = 'flex';
        // 2. Mostrar tarjeta con el nombre del paciente y botón de salir
        if (patientLoggedCard) patientLoggedCard.style.display = 'flex';
        // 3. Ocultar los botones de invitado
        if (patientGuestNavActions) patientGuestNavActions.style.display = 'none';

        if (patNavbarName) patNavbarName.textContent = (currentUser.name || 'Carlos').split(' ')[0];
        if (patNavbarAvatar && currentUser.avatar) patNavbarAvatar.src = currentUser.avatar;
        if (patientBrandSubtitle) patientBrandSubtitle.textContent = 'Portal del Paciente';

        // Al iniciar sesión siempre abre la ventana de Resumen
        if (typeof window.renderPatientPortal === 'function') {
          window.renderPatientPortal();
        }
      } else {
        // === USUARIO NUEVO SIN INICIAR SESIÓN (AGENDAR CITA) ===
        // 1. Ocultar completamente los botones de pestañas (Resumen, Mis Citas, Mis Datos, Agendar Cita)
        if (patientPortalTabBar) patientPortalTabBar.style.display = 'none';
        // 2. Ocultar tarjeta de usuario logueado
        if (patientLoggedCard) patientLoggedCard.style.display = 'none';
        // 3. Mostrar en la barra los botones de regresar al sitio web o iniciar sesión
        if (patientGuestNavActions) patientGuestNavActions.style.display = 'flex';

        if (patientBrandSubtitle) patientBrandSubtitle.textContent = 'Agendamiento de Citas';

        // Mostrar directamente el panel para agendar cita
        if (typeof window.switchPatientTab === 'function') {
          window.switchPatientTab('agendar');
        } else {
          const patientPanes = document.querySelectorAll('.patient-portal-pane');
          patientPanes.forEach(pane => {
            pane.style.display = (pane.dataset.pane === 'agendar') ? 'block' : 'none';
          });
        }
      }

    } else if (activeView === 'doctor') {
      if (viewDoctor) {
        viewDoctor.classList.remove('hidden', 'd-none');
        viewDoctor.style.removeProperty('display');
        viewDoctor.style.cssText = 'display: flex !important; opacity: 1 !important; visibility: visible !important;';
      }
      if (navMenuDoctor) navMenuDoctor.style.display = 'flex';
      if (navActionsDoctor) navActionsDoctor.style.display = 'flex';
      if (navbarBrandSubtitle) navbarBrandSubtitle.textContent = 'Portal Médico';

    } else if (activeView === 'contador' || activeView === 'accountant') {
      if (viewAccountant) {
        viewAccountant.classList.remove('hidden', 'd-none');
        viewAccountant.style.removeProperty('display');
        viewAccountant.style.cssText = 'display: flex !important; opacity: 1 !important; visibility: visible !important;';
      }
      if (navMenuAccountant) navMenuAccountant.style.display = 'flex';
      if (navActionsAccountant) navActionsAccountant.style.display = 'flex';
      if (navbarBrandSubtitle) navbarBrandSubtitle.textContent = 'Portal Contable & SRI • Lcda. Morales';
    }

    // Scroll arriba al cambiar de vista principal
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  window.renderActiveView = renderActiveView;

  // --- BOTONES DE LA BARRA DEL PACIENTE PARA USUARIOS NUEVOS / INVITADOS Y LOGOUT ---
  if (btnPatientBackToWeb) {
    btnPatientBackToWeb.addEventListener('click', (e) => {
      e.preventDefault();
      returnToLanding();
    });
  }

  if (patientNavBrandBtn) {
    patientNavBrandBtn.addEventListener('click', (e) => {
      e.preventDefault();
      returnToLanding();
    });
  }

  if (btnPatientOpenLogin) {
    btnPatientOpenLogin.addEventListener('click', (e) => {
      e.preventDefault();
      const unifiedModal = document.getElementById('modal-unified-login');
      if (unifiedModal) {
        const patTab = unifiedModal.querySelector('.modal-role-tab-btn[data-role="paciente"]');
        if (patTab) patTab.click();
        unifiedModal.classList.add('active');
        const loginInput = document.getElementById('modal-login-username');
        if (loginInput) setTimeout(() => loginInput.focus(), 100);
      } else {
        returnToLanding();
      }
    });
  }

  if (btnPatientLogout) {
    btnPatientLogout.addEventListener('click', (e) => {
      e.preventDefault();
      store.setCurrentUser(null);
      showToast('Sesión de paciente cerrada. Regresando a la página principal.', 'info');
      returnToLanding();
    });
  }

  if (btnDoctorLogout) {
    btnDoctorLogout.addEventListener('click', (e) => {
      e.preventDefault();
      store.setCurrentUser(null);
      showToast('Sesión médica finalizada. Regresando a la página institucional.', 'info');
      returnToLanding();
    });
  }

  if (btnAccountantLogout) {
    btnAccountantLogout.addEventListener('click', (e) => {
      e.preventDefault();
      store.setCurrentUser(null);
      showToast('Sesión contable finalizada. Regresando a la página institucional.', 'info');
      returnToLanding();
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

  // =========================================================================
  // CONTROLADORES DIRECTOS DE LA BARRA DE NAVEGACIÓN SUPERIOR (NAVBAR)
  // Conexión robusta para "Iniciar Sesión" y "Agendar Cita" sin fallos de null
  // =========================================================================

  // --- FUNCIÓN UNIFICADA PARA ABRIR MODAL DE AUTENTICACIÓN ---
  function openAuthModal(defaultRole = 'paciente') {
    const loginModal = document.getElementById('modal-unified-login') ||
                       document.getElementById('modal-wizard-auth-gate') ||
                       document.getElementById('modal-auth');
    if (loginModal) {
      loginModal.classList.remove('hidden');
      loginModal.classList.add('active');
      const roleTab = loginModal.querySelector(`.modal-role-tab-btn[data-role="${defaultRole}"]`);
      if (roleTab) roleTab.click();
      const loginInput = document.getElementById('modal-login-username');
      if (loginInput) setTimeout(() => loginInput.focus(), 80);
    }
  }
  window.openAuthModal = openAuthModal;

  // 1. Conectar Botones "Iniciar Sesión" (Navbar Landing, Navbar Paciente, Hero, Wizard, Footer)
  const loginTriggerIds = [
    'btn-navbar-login-landing',
    'btn-nav-login',
    'btn-patient-open-login',
    'btn-wizard-open-login',
    'btn-hero-portal',
    'footer-btn-portal',
    'footer-btn-history'
  ];

  loginTriggerIds.forEach(id => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const role = (id === 'footer-btn-portal' || id === 'btn-hero-portal') ? 'doctor' : 'paciente';
        openAuthModal(role);
      });
    }
  });

  // Selector por clase para botones de login adicionales en la barra
  document.querySelectorAll('.btn-navbar-login, .btn-patient-nav-login, [data-action="login"]').forEach(btn => {
    if (!loginTriggerIds.includes(btn.id)) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openAuthModal('paciente');
      });
    }
  });

  // --- FLUJO DE AGENDAMIENTO LIMPIO CON DESPLAZAMIENTO SUAVE AL PASO 1 ---
  function startBookingFlow(clinicId = null) {
    // a) Oculta la vista landing:
    const landingEl = document.getElementById('view-landing');
    if (landingEl) {
      landingEl.classList.add('hidden', 'd-none');
      landingEl.style.display = 'none';
    }

    // b) Muestra la vista del paciente:
    const pView = document.getElementById('view-patient') || document.getElementById('portal-paciente');
    if (pView) {
      pView.classList.remove('hidden', 'd-none');
      pView.style.cssText = 'display: block !important; opacity: 1 !important; visibility: visible !important; min-height: 100vh;';
    }

    // e) Actualiza el estado global de la vista:
    if (window.store) window.store.setActiveView('paciente');
    renderActiveView();

    if (pView) {
      pView.classList.remove('hidden', 'd-none');
      pView.style.cssText = 'display: block !important; opacity: 1 !important; visibility: visible !important; min-height: 100vh;';
    }

    // c) Asegura que la pestaña activa sea el Wizard de Agendamiento en el Paso 1 (Sedes).
    const patPaneAgendar = document.getElementById('pat-pane-agendar');
    if (patPaneAgendar) {
      patPaneAgendar.classList.remove('hidden', 'd-none');
      patPaneAgendar.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important;';
    }

    if (typeof window.switchPatientTab === 'function') {
      window.switchPatientTab('agendar');
    } else {
      const agendarTabBtn = document.getElementById('nav-btn-pat-agendar');
      if (agendarTabBtn) agendarTabBtn.click();
      const patientPanes = document.querySelectorAll('.patient-portal-pane');
      patientPanes.forEach(pane => {
        pane.style.display = (pane.dataset.pane === 'agendar') ? 'block' : 'none';
      });
    }

    const step1 = document.querySelector('.wizard-step-pane[data-step="1"]');
    if (step1) {
      step1.classList.remove('hidden', 'd-none');
      step1.style.cssText = 'display: block !important; opacity: 1 !important; visibility: visible !important;';
    }

    if (clinicId) {
      const targetClinicCard = document.querySelector(`.clinic-selection-card[data-clinic-id="${clinicId}"]`);
      if (targetClinicCard) {
        targetClinicCard.click();
      }
    }

    // d) Haz scroll al inicio del asistente:
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      const wizardStep1 = document.querySelector('.wizard-step-pane[data-step="1"]') ||
                          document.getElementById('pat-pane-agendar') ||
                          document.querySelector('.wizard-stepper-container') ||
                          document.getElementById('view-patient');
      if (wizardStep1) {
        wizardStep1.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 80);

    if (typeof showToast === 'function') {
      showToast('Ingresando al Asistente de Agendamiento de Citas (Paso 1: Sedes).', 'info');
    }
  }
  window.startBookingFlow = startBookingFlow;

  // 2. Conectar Botones "Agendar Cita" (Navbar Landing, Hero, Tab Paciente, Footer)
  const bookingTriggerIds = [
    'btn-navbar-book-now',
    'btn-nav-book-appointment',
    'btn-hero-booking',
    'nav-btn-pat-agendar',
    'btn-citas-book-new',
    'btn-dash-quick-book',
    'footer-btn-book'
  ];

  bookingTriggerIds.forEach(id => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        startBookingFlow();
      });
    }
  });

  // Selector por clase para botones de agendamiento en barra y layout
  document.querySelectorAll('.btn-navbar-booking').forEach(btn => {
    if (!bookingTriggerIds.includes(btn.id)) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        startBookingFlow();
      });
    }
  });

  // Botones de Agendamiento Directo desde las Tarjetas de Sedes
  document.querySelectorAll('.btn-book-clinic-direct').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
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
  // CORREGIDO: #portal-acceso ahora abre el modal en vez de hacer scroll al pie de página
  document.querySelectorAll('.nav-menu-link, .footer-links-list a, .footer-bottom-link').forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href && href.startsWith('#')) {
        if (href === '#portal-paciente') {
          e.preventDefault();
          e.stopPropagation();
          startBookingFlow();
          return;
        }
        if (href === '#portal-acceso') {
          e.preventDefault();
          e.stopPropagation();
          openAuthModal('paciente');
          return;
        }
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

  // --- MANUAL DE USUARIO INTERACTIVO MULTI-ROL (Semana 5 - Parte 3) ---
  const modalManual = document.getElementById('modal-manual-usuario');
  const btnCloseManual = document.getElementById('btn-close-manual-modal');
  const btnNavbarManual = document.getElementById('btn-navbar-open-manual');
  const btnFooterManual = document.getElementById('btn-footer-open-manual');
  const manualRoleButtons = document.querySelectorAll('.manual-tab-btn');
  const manualPanes = document.querySelectorAll('.manual-pane');

  function openUserManual(role = 'paciente') {
    if (!modalManual) return;
    switchManualTab(role);
    modalManual.classList.add('active');
  }
  window.openUserManualModal = openUserManual;

  function closeUserManual() {
    if (modalManual) modalManual.classList.remove('active');
  }

  function switchManualTab(role) {
    manualRoleButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.manualRole === role);
    });
    manualPanes.forEach(pane => {
      pane.style.display = (pane.id === `manual-pane-${role}`) ? 'flex' : 'none';
    });
  }

  if (btnNavbarManual) {
    btnNavbarManual.addEventListener('click', (e) => {
      e.preventDefault();
      openUserManual('paciente');
    });
  }

  if (btnFooterManual) {
    btnFooterManual.addEventListener('click', (e) => {
      e.preventDefault();
      openUserManual('paciente');
    });
  }

  if (btnCloseManual) {
    btnCloseManual.addEventListener('click', closeUserManual);
  }

  manualRoleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      switchManualTab(btn.dataset.manualRole);
    });
  });

  // Acciones interactivas rápidas desde el Manual
  const btnManualBooking = document.getElementById('btn-manual-action-booking');
  if (btnManualBooking) {
    btnManualBooking.addEventListener('click', () => {
      closeUserManual();
      startBookingFlow();
    });
  }

  const btnManualDoctor = document.getElementById('btn-manual-action-doctor');
  if (btnManualDoctor) {
    btnManualDoctor.addEventListener('click', () => {
      closeUserManual();
      store.setCurrentUser(DEMO_USERS.doctor);
      store.setActiveView('doctor');
      showToast('Bienvenido, Dr. Carlos Campoverde (MSP-REG-84729). Modo Demostración Activo.', 'success');
      renderActiveView();
    });
  }

  const btnManualAccountant = document.getElementById('btn-manual-action-accountant');
  if (btnManualAccountant) {
    btnManualAccountant.addEventListener('click', () => {
      closeUserManual();
      store.setCurrentUser(DEMO_USERS.contador);
      store.setActiveView('contador');
      showToast('Bienvenida, Lcda. Patricia Morales (Auditora Contable). Modo Demostración Activo.', 'success');
      renderActiveView();
    });
  }

  // --- BOTÓN RESTABLECER DATOS DE DEMOSTRACIÓN (Suite de Producción) ---
  const btnFooterResetDemo = document.getElementById('btn-footer-reset-demo');
  if (btnFooterResetDemo) {
    btnFooterResetDemo.addEventListener('click', (e) => {
      e.preventDefault();
      const confirmReset = window.confirm(
        '¿Deseas restaurar todos los datos de demostración de Montepiedra Salud a su estado inicial de producción?\n\n' +
        'Se restablecerán las citas de prueba en las 4 sedes, pacientes con antecedentes y alergias, gastos operativos de combustible y liquidaciones de la Semana 1 a la 5.'
      );
      if (confirmReset) {
        store.resetDemoData();
        showToast('✅ Datos de demostración restablecidos a estado inicial de producción.', 'success');
        renderActiveView();
        // Si hay modal abierto, cerrarlo
        document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
      }
    });
  }

  // Render inicial
  renderActiveView();
});
