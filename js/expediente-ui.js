import { obtenerCategorias, obtenerMotivosPorCategoria } from './catalogo-motivos.js';
import { guardarExpedientePaciente, agregarConsultaAExpediente, obtenerExpediente } from './expediente-storage.js';

/**
 * Utilidad auxiliar para mostrar errores debajo de un input
 */
const mostrarError = (inputElement, mensaje) => {
  let errorDiv = inputElement.nextElementSibling;
  if (!errorDiv || !errorDiv.classList.contains('error-feedback')) {
    errorDiv = document.createElement('div');
    errorDiv.className = 'error-feedback';
    inputElement.parentNode.insertBefore(errorDiv, inputElement.nextSibling);
  }
  errorDiv.textContent = mensaje;
  errorDiv.classList.add('visible');
  inputElement.classList.add('input-error');
};

const limpiarError = (inputElement) => {
  const errorDiv = inputElement.nextElementSibling;
  if (errorDiv && errorDiv.classList.contains('error-feedback')) {
    errorDiv.classList.remove('visible');
  }
  inputElement.classList.remove('input-error');
};

/**
 * Validador Algorítmico de Cédula Ecuatoriana
 */
const validarCedulaEcuatoriana = (cedula) => {
  if (cedula.length !== 10) return false;
  
  const provincia = parseInt(cedula.substring(0, 2), 10);
  if (provincia < 1 || (provincia > 24 && provincia !== 30)) return false;

  const digitos = cedula.split('').map(Number);
  const verificador = digitos.pop();
  
  let suma = 0;
  digitos.forEach((digito, i) => {
    let valor = digito * (i % 2 === 0 ? 2 : 1);
    if (valor > 9) valor -= 9;
    suma += valor;
  });
  
  const digitoCalculado = suma % 10 === 0 ? 0 : 10 - (suma % 10);
  return digitoCalculado === verificador;
};

/**
 * Inicializa y conecta los eventos del módulo de Expediente Médico y Consulta.
 * @param {Function} showToast - Función para mostrar notificaciones en pantalla.
 */
export function setupExpedienteUI(showToast) {
  const formExpediente = document.getElementById('form-expediente-consulta');
  if (!formExpediente) return;

  const selectCategoria = document.getElementById('categoria-consulta');
  const selectMotivo = document.getElementById('motivo-consulta');
  const historialList = document.getElementById('historial-consultas-list');
  
  // Elementos del formulario
  const inputs = {
    cedula: document.getElementById('paciente-cedula'),
    nombre: document.getElementById('paciente-nombre'),
    fecha: document.getElementById('paciente-fecha'),
    presion: document.getElementById('sv-presion'),
    frecuencia: document.getElementById('sv-frecuencia'),
    temperatura: document.getElementById('sv-temperatura'),
    peso: document.getElementById('sv-peso')
  };

  // --- RESTRICCIONES EN TIEMPO REAL (Físicas) --- //

  // Cédula: Solo números, máx 10
  inputs.cedula.setAttribute('maxlength', '10');
  inputs.cedula.addEventListener('input', function(e) {
    this.value = this.value.replace(/[^0-9]/g, '').substring(0, 10);
    limpiarError(this);
  });

  // Nombre: Solo letras y espacios. Sin doble espacio.
  inputs.nombre.setAttribute('maxlength', '70');
  inputs.nombre.addEventListener('input', function(e) {
    this.value = this.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
    this.value = this.value.replace(/\s{2,}/g, ' '); // Evitar espacios dobles
    if(this.value.startsWith(' ')) this.value = this.value.trimStart();
    limpiarError(this);
  });

  // Fecha: Max = hoy
  const hoyStr = new Date().toISOString().split('T')[0];
  inputs.fecha.setAttribute('max', hoyStr);
  inputs.fecha.addEventListener('change', function() { limpiarError(this); });

  // Signos vitales básicos limpieza on input
  inputs.presion.addEventListener('input', function() {
    this.value = this.value.replace(/[^0-9/]/g, '').substring(0, 7);
    limpiarError(this);
  });
  ['frecuencia', 'temperatura', 'peso'].forEach(key => {
    inputs[key].addEventListener('input', function() {
      this.value = this.value.replace(/[^0-9.]/g, ''); // Permitir decimales
      limpiarError(this);
    });
  });

  // Limpiar errores en selects
  selectCategoria.addEventListener('change', function() { limpiarError(this); });
  selectMotivo.addEventListener('change', function() { limpiarError(this); });

  // 1. Cargar Categorías Dinámicamente
  const cargarCategorias = () => {
    const categorias = obtenerCategorias();
    selectCategoria.innerHTML = '<option value="">Seleccione una categoría...</option>';
    categorias.forEach(cat => {
      selectCategoria.innerHTML += `<option value="${cat}">${cat}</option>`;
    });
  };

  // 2. Evento: Cambio de Categoría
  selectCategoria.addEventListener('change', (e) => {
    const categoriaSeleccionada = e.target.value;
    selectMotivo.innerHTML = '<option value="">Seleccione un motivo...</option>';
    selectMotivo.disabled = true;

    if (categoriaSeleccionada) {
      const motivos = obtenerMotivosPorCategoria(categoriaSeleccionada);
      motivos.forEach(motivo => {
        selectMotivo.innerHTML += `<option value="${motivo.id}">${motivo.descripcion} (CIE-10: ${motivo.codigo_cie})</option>`;
      });
      selectMotivo.disabled = false;
    }
  });

  // 3. Renderizar Historial
  const renderizarHistorial = (pacienteId) => {
    if (!historialList) return;
    historialList.innerHTML = '';
    const expediente = obtenerExpediente(pacienteId);
    
    if (!expediente || !expediente.consultas || expediente.consultas.length === 0) {
      historialList.innerHTML = '<p style="color: #64748b; text-align: center; padding: 2rem 0;">No hay consultas previas registradas para este paciente.</p>';
      return;
    }

    const consultasReversas = [...expediente.consultas].reverse();
    consultasReversas.forEach(consulta => {
      const card = document.createElement('div');
      card.className = 'consulta-card';
      
      const p = consulta.signosVitales.presion || '-';
      const f = consulta.signosVitales.frecuencia || '-';
      const t = consulta.signosVitales.temperatura || '-';
      const w = consulta.signosVitales.peso || '-';

      card.innerHTML = `
        <div class="consulta-header">
          <span>📅 ${new Date(consulta.fechaHora).toLocaleString('es-ES')}</span>
          <span>Médico: ${consulta.medicoTratante}</span>
        </div>
        <div class="consulta-motivo">🩺 Motivo: ${consulta.motivos[0]?.descripcion || 'No especificado'}</div>
        <div class="consulta-detalle">
          <div style="margin-bottom: 0.5rem;">
            <span class="signos-vitales-pill">PA: ${p}</span>
            <span class="signos-vitales-pill">FC: ${f}</span>
            <span class="signos-vitales-pill">Temp: ${t}</span>
            <span class="signos-vitales-pill">Peso: ${w}</span>
          </div>
          <strong>Notas clínicas:</strong> <br>
          ${consulta.notasEvolucion.replace(/\n/g, '<br>')}
        </div>
      `;
      historialList.appendChild(card);
    });
  };

  // Autocompletar y limpiar error
  if (inputs.cedula) {
    inputs.cedula.addEventListener('blur', (e) => {
      const id = e.target.value.trim();
      if(id.length === 10 && validarCedulaEcuatoriana(id)) {
         const exp = obtenerExpediente(id);
         if(exp) {
           inputs.nombre.value = exp.nombre || '';
           inputs.fecha.value = exp.fechaNacimiento || '';
           document.getElementById('paciente-alergias').value = (exp.alertaMedica?.alergias || []).join(', ');
           if(showToast) showToast('Expediente previo cargado exitosamente', 'info');
         }
         renderizarHistorial(id);
      } else if (id.length > 0 && !validarCedulaEcuatoriana(id)) {
         mostrarError(inputs.cedula, 'La cédula ingresada no es válida.');
      }
    });
  }

  // --- 4. VALIDACIÓN PREVENTIVA EN EL SUBMIT --- //
  formExpediente.addEventListener('submit', (e) => {
    e.preventDefault();
    let hasErrors = false;
    let firstErrorElement = null;

    const setError = (element, message) => {
      mostrarError(element, message);
      hasErrors = true;
      if (!firstErrorElement) firstErrorElement = element;
    };

    // Validar Cédula
    const cedulaVal = inputs.cedula.value.trim();
    if (cedulaVal.length !== 10 || !validarCedulaEcuatoriana(cedulaVal)) {
      setError(inputs.cedula, 'Debe ser una cédula ecuatoriana válida de 10 dígitos.');
    }

    // Validar Nombre
    const nombreVal = inputs.nombre.value.trim();
    if (nombreVal.length < 5) {
      setError(inputs.nombre, 'El nombre debe tener al menos 5 caracteres.');
    }

    // Validar Fecha de Nacimiento
    const fechaVal = inputs.fecha.value;
    if (!fechaVal) {
      setError(inputs.fecha, 'Debe seleccionar una fecha de nacimiento.');
    } else if (fechaVal > hoyStr) {
      setError(inputs.fecha, 'La fecha no puede ser futura.');
    }

    // Validar Selectores (Categoría y Motivo)
    if (!selectCategoria.value) {
      setError(selectCategoria, 'Debe seleccionar una categoría de atención.');
    }
    if (!selectMotivo.value) {
      setError(selectMotivo, 'Debe seleccionar un motivo de consulta.');
    }

    // Validar Signos Vitales (Si se llenaron, deben ser válidos)
    const paVal = inputs.presion.value.trim();
    if (paVal && !/^\d{2,3}\/\d{2,3}$/.test(paVal)) {
      setError(inputs.presion, 'Formato inválido. Ejemplo: 120/80');
    }

    const tempVal = parseFloat(inputs.temperatura.value);
    if (inputs.temperatura.value && (isNaN(tempVal) || tempVal < 34 || tempVal > 43)) {
      setError(inputs.temperatura, 'Temperatura irreal. Rango: 34 a 43 °C');
    }

    const pesoVal = parseFloat(inputs.peso.value);
    if (inputs.peso.value && (isNaN(pesoVal) || pesoVal <= 0 || pesoVal > 300)) {
      setError(inputs.peso, 'Peso irreal. Debe ser mayor a 0 kg');
    }
    
    const fcVal = parseInt(inputs.frecuencia.value, 10);
    if (inputs.frecuencia.value && (isNaN(fcVal) || fcVal < 30 || fcVal > 250)) {
      setError(inputs.frecuencia, 'Frecuencia irreal. Rango: 30 a 250 lpm');
    }

    if (hasErrors) {
      if(showToast) showToast('Por favor, corrija los errores marcados en rojo.', 'warning');
      firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      firstErrorElement.focus();
      return;
    }

    // Si todo está OK, construir objetos y guardar
    const pacienteData = {
      id: cedulaVal,
      nombre: nombreVal,
      fechaNacimiento: fechaVal,
      alertaMedica: {
        alergias: document.getElementById('paciente-alergias').value.split(',').map(s => s.trim()).filter(Boolean)
      }
    };

    try {
      guardarExpedientePaciente(pacienteData);

      const opcionMotivo = selectMotivo.options[selectMotivo.selectedIndex];
      const consultaData = {
        idConsulta: 'C-' + Date.now(),
        fechaHora: new Date().toISOString(),
        medicoTratante: 'Dr. (Demo Local)',
        signosVitales: {
          presion: paVal,
          frecuencia: inputs.frecuencia.value,
          temperatura: inputs.temperatura.value,
          peso: inputs.peso.value
        },
        motivos: [{ descripcion: opcionMotivo.text }],
        notasEvolucion: document.getElementById('notas-evolucion').value,
      };

      agregarConsultaAExpediente(cedulaVal, consultaData);
      
      if(showToast) showToast('Consulta médica guardada exitosamente.', 'success');
      
      // Limpiar Formulario, dejando datos de paciente
      document.getElementById('notas-evolucion').value = '';
      inputs.presion.value = '';
      inputs.frecuencia.value = '';
      inputs.temperatura.value = '';
      inputs.peso.value = '';
      selectCategoria.value = '';
      selectMotivo.innerHTML = '<option value="">Seleccione un motivo...</option>';
      selectMotivo.disabled = true;

      renderizarHistorial(cedulaVal);

    } catch (error) {
      if(showToast) showToast('Error al guardar: ' + error.message, 'danger');
      console.error('Error de almacenamiento en Expediente:', error);
    }
  });

  // Inicialización
  cargarCategorias();
}
