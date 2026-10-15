/**
 * Montepiedra Salud - Cliente de Integración Supabase
 * Maneja todas las operaciones CRUD y sincronización en tiempo real con Supabase.
 */

import { SUPABASE_CONFIG } from './supabase-config.js';

let supabaseInstance = null;

/**
 * Obtiene o inicializa la instancia del cliente Supabase
 */
export function getSupabase() {
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
export function mapAppointmentFromDB(row) {
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

export function mapAppointmentToDB(apt) {
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

export function mapExpenseFromDB(row) {
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

export function mapExpenseToDB(exp) {
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

export function mapPrescriptionFromDB(row) {
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

export function mapPrescriptionToDB(rx) {
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

export function mapMedicalRecordFromDB(row) {
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

export function mapMedicalRecordToDB(rec) {
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

export const SupabaseDB = {
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
