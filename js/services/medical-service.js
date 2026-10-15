import { CONSULTATION_CATALOG } from '../data/consultation-catalog.js';
import { PatientRecord } from '../models/patient-record.js';
import { SupabaseDB } from '../supabase-client.js';

let pacientesCache = [];

export const MedicalService = {
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

