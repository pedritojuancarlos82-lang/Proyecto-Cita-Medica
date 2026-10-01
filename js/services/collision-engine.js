/**
 * collision-engine.js
 * Motor de Prevención de Choques, Tiempos de Traslado y Validación de Rotación Multisede
 * Semana 2: Arquitectura del Calendario Inteligente (Montepiedra Salud)
 */

import { CLINICS } from '../state.js';

// 1. Matriz de Distancias y Tiempos de Traslado Interurbano (Guayaquil)
export const MATRIZ_DISTANCIAS_TRASLADO = {
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

// 2. Salas de Consultorio Físicas (Recursos Compartidos)
export const SALAS_CONSULTORIO = {
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
export const HORARIOS_ROTATIVOS = [
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

export const CollisionEngine = {
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
    travelBuffers = []
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

        // Solapamiento: max(ini1, ini2) < min(fin1, fin2)
        if (Math.max(inicioSlotMin, cIni) < Math.min(finSlotMin, cFin)) {
          return {
            valido: false,
            razonRechazo: `La sala física (${CLINICS[sedeId]?.consultorio || 'Consultorio'}) está ocupada por otra atención médica (#${c.code || c.id}).`,
            tiempoBufferRequerido: null,
            codigoError: 'SALA_OCUPADA'
          };
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
      valido: true,
      razonRechazo: null,
      tiempoBufferRequerido: 0
    };
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
  }
};
