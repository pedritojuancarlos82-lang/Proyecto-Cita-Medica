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
export const obtenerCategorias = () => Object.keys(catalogo);

/**
 * Obtiene los motivos de consulta asociados a una categoría específica.
 * @param {string} categoria - Nombre de la categoría.
 * @returns {Array<Object>} Lista de motivos de la categoría.
 */
export const obtenerMotivosPorCategoria = (categoria) => catalogo[categoria] || [];

/**
 * Busca motivos de consulta que coincidan con el término de búsqueda.
 * Busca tanto en la descripción como en el código CIE o categoría.
 * @param {string} termino - Texto a buscar.
 * @returns {Array<Object>} Resultados que coinciden con la búsqueda.
 */
export const buscarMotivo = (termino) => {
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
export const obtenerMotivoPorId = (id) => {
  return catalogoPlano.find(motivo => motivo.id === id) || null;
};
