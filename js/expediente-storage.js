/**
 * Módulo de almacenamiento local para el Expediente Médico.
 * Encapsula la lógica CRUD usando localStorage de forma defensiva y persistencia ultra liviana.
 */

const STORAGE_KEY_PACIENTES = 'cita_medica_pacientes';

/**
 * Validar la estructura básica requerida del paciente.
 */
const validarPaciente = (paciente) => {
  if (!paciente.id || !paciente.nombre || !paciente.fechaNacimiento) {
    throw new Error('Faltan campos obligatorios del paciente (id, nombre, fechaNacimiento)');
  }
};

/**
 * Validar la estructura de una consulta.
 */
const validarConsulta = (consulta) => {
  if (!consulta.idConsulta || !consulta.fechaHora || !consulta.medicoTratante) {
    throw new Error('La consulta debe incluir idConsulta, fechaHora y medicoTratante');
  }
};

/**
 * Inicializa el storage si está vacío.
 */
const inicializarStorage = () => {
  try {
    if (!localStorage.getItem(STORAGE_KEY_PACIENTES)) {
      localStorage.setItem(STORAGE_KEY_PACIENTES, JSON.stringify([]));
    }
  } catch (error) {
    console.error('Error inicializando el storage. Posible modo incógnito o cuota excedida:', error);
  }
};

/**
 * Obtiene todos los pacientes del localStorage.
 * @returns {Array<Object>} Lista de pacientes.
 */
export const obtenerTodosLosPacientes = () => {
  try {
    inicializarStorage();
    const data = localStorage.getItem(STORAGE_KEY_PACIENTES);
    return JSON.parse(data) || [];
  } catch (error) {
    console.error('Error obteniendo pacientes:', error);
    return [];
  }
};

/**
 * Guarda el arreglo completo de pacientes en el localStorage.
 * @param {Array<Object>} pacientes - Arreglo de pacientes a guardar.
 */
const guardarTodosLosPacientes = (pacientes) => {
  try {
    localStorage.setItem(STORAGE_KEY_PACIENTES, JSON.stringify(pacientes));
  } catch (error) {
    console.error('Error guardando en localStorage (¿cuota excedida?):', error);
    throw new Error('No se pudo guardar la información. Espacio insuficiente en el dispositivo.');
  }
};

/**
 * Obtiene el expediente completo de un paciente por su ID.
 * @param {string} id - ID del paciente.
 * @returns {Object|null} Datos del paciente o null si no se encuentra.
 */
export const obtenerExpediente = (id) => {
  const pacientes = obtenerTodosLosPacientes();
  return pacientes.find(p => p.id === id) || null;
};

/**
 * Crea o actualiza los datos base de un paciente.
 * Define la estructura y el modelo del paciente.
 * @param {Object} pacienteData - Datos del paciente a registrar/actualizar.
 */
export const guardarExpedientePaciente = (pacienteData) => {
  validarPaciente(pacienteData);
  
  const pacientes = obtenerTodosLosPacientes();
  const index = pacientes.findIndex(p => p.id === pacienteData.id);

  if (index !== -1) {
    // Actualizar existente, preservando sus consultas si no vienen en la actualización
    pacientes[index] = {
      ...pacientes[index],
      ...pacienteData,
      consultas: pacienteData.consultas || pacientes[index].consultas || []
    };
  } else {
    // Nuevo paciente: aplicar estructura base
    const nuevoPaciente = {
      ...pacienteData,
      sexo: pacienteData.sexo || 'No especificado',
      contacto: pacienteData.contacto || 'No especificado',
      grupoSanguineo: pacienteData.grupoSanguineo || 'Desconocido',
      alertaMedica: pacienteData.alertaMedica || { alergias: [], antecedentes: [] },
      consultas: pacienteData.consultas || []
    };
    pacientes.push(nuevoPaciente);
  }

  guardarTodosLosPacientes(pacientes);
  return true;
};

/**
 * Agrega una nueva consulta al historial de un paciente.
 * @param {string} pacienteId - ID del paciente.
 * @param {Object} consulta - Objeto con los datos de la consulta.
 */
export const agregarConsultaAExpediente = (pacienteId, consulta) => {
  validarConsulta(consulta);
  
  const pacientes = obtenerTodosLosPacientes();
  const index = pacientes.findIndex(p => p.id === pacienteId);
  
  if (index === -1) {
    throw new Error(`Paciente con ID ${pacienteId} no encontrado. No se puede agregar consulta.`);
  }

  // Estructuramos la consulta con sus campos completos
  const nuevaConsulta = {
    ...consulta,
    idCita: consulta.idCita || null,
    sedeAtencion: consulta.sedeAtencion || 'No especificada',
    signosVitales: consulta.signosVitales || { 
      presion: '', frecuencia: '', temperatura: '', peso: '' 
    },
    motivos: consulta.motivos || [], // Idealmente, IDs o objetos del catálogo
    notasEvolucion: consulta.notasEvolucion || '',
    prescripcionFarmacologica: consulta.prescripcionFarmacologica || ''
  };

  if (!pacientes[index].consultas) {
    pacientes[index].consultas = [];
  }

  pacientes[index].consultas.push(nuevaConsulta);
  guardarTodosLosPacientes(pacientes);
  
  return nuevaConsulta;
};

/**
 * Elimina completamente el expediente de un paciente del sistema.
 * @param {string} id - ID del paciente a eliminar.
 */
export const eliminarExpediente = (id) => {
  const pacientes = obtenerTodosLosPacientes();
  const nuevosPacientes = pacientes.filter(p => p.id !== id);
  guardarTodosLosPacientes(nuevosPacientes);
};
