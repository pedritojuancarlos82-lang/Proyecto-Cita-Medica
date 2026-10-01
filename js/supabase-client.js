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
 * Mapeo de columnas Postgres (snake_case) a modelo JS (camelCase)
 */
export function mapAppointmentFromDB(row) {
  if (!row) return null;
  return {
    id: row.id,
    code: row.code,
    patientName: row.patient_name,
    patientId: row.patient_id,
    patientPhone: row.patient_phone,
    patientEmail: row.patient_email,
    clinicId: row.clinic_id,
    date: row.date,
    time: row.time,
    durationMinutes: row.duration_minutes || 45,
    reason: row.reason,
    paymentMethod: row.payment_method || 'efectivo',
    basePrice: Number(row.base_price) || 0,
    feePercentage: Number(row.fee_percentage) || 0,
    feeAmount: Number(row.fee_amount) || 0,
    totalPaid: Number(row.total_paid) || 0,
    retentionRate: Number(row.retention_rate) || 0,
    retentionAmount: Number(row.retention_amount) || 0,
    netClinicYield: Number(row.net_clinic_yield) || 0,
    status: row.status || 'confirmada',
    settlementStatus: row.settlement_status || 'Pendiente',
    notes: row.notes || ''
  };
}

export function mapAppointmentToDB(apt) {
  return {
    id: apt.id,
    code: apt.code,
    patient_name: apt.patientName,
    patient_id: apt.patientId,
    patient_phone: apt.patientPhone,
    patient_email: apt.patientEmail,
    clinic_id: apt.clinicId,
    date: apt.date,
    time: apt.time,
    duration_minutes: apt.durationMinutes || 45,
    reason: apt.reason,
    payment_method: apt.paymentMethod || 'efectivo',
    base_price: apt.basePrice || 0,
    fee_percentage: apt.feePercentage || 0,
    fee_amount: apt.feeAmount || 0,
    total_paid: apt.totalPaid || 0,
    retention_rate: apt.retentionRate || 0,
    retention_amount: apt.retentionAmount || 0,
    net_clinic_yield: apt.netClinicYield || 0,
    status: apt.status || 'confirmada',
    settlement_status: apt.settlementStatus || 'Pendiente',
    notes: apt.notes || ''
  };
}

export function mapExpenseFromDB(row) {
  if (!row) return null;
  return {
    id: row.id,
    date: row.date,
    category: row.category,
    description: row.description,
    amount: Number(row.amount) || 0,
    paymentMethod: row.payment_method || 'Efectivo',
    quickLogged: Boolean(row.quick_logged),
    deductibleSRI: Boolean(row.deductible_sri)
  };
}

export function mapExpenseToDB(exp) {
  return {
    id: exp.id,
    date: exp.date,
    category: exp.category,
    description: exp.description,
    amount: exp.amount,
    payment_method: exp.paymentMethod || 'Efectivo',
    quick_logged: Boolean(exp.quickLogged),
    deductible_sri: Boolean(exp.deductibleSRI)
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

  async insertAppointment(apt) {
    const sb = getSupabase();
    if (!sb) return null;
    const payload = mapAppointmentToDB(apt);
    const { data, error } = await sb.from('appointments').insert([payload]).select().single();
    if (error) {
      console.error('Error insertando cita en Supabase:', error);
      return null;
    }
    return mapAppointmentFromDB(data);
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
