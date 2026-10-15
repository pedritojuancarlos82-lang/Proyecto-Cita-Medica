export class PatientRecord {
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
