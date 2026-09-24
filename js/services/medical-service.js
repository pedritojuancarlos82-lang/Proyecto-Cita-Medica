import { CONSULTATION_CATALOG } from '../data/consultation-catalog.js';
import { PatientRecord } from '../models/patient-record.js';

export const MedicalService = {
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
