/**
 * gastos_service.tsx
 * Módulo de Gestión Financiera y Control de Gastos Operativos (Semana 3)
 * Plataforma SaaS: Montepiedra Salud
 */

export interface SedeInfo {
  nombre: string;
  retencion: number;
}

export const SEDES_VALIDAS: Record<string, SedeInfo> = {
  MAPASINGUE: { nombre: 'Consultorio Mapasingue', retencion: 0.05 },
  CEIBOS: { nombre: 'Clínica Ceibos', retencion: 0.25 },
  ALBORADA: { nombre: 'Consultorio Alborada', retencion: 0.10 },
  HOSPITAL: { nombre: 'Hospital Público Ceibos', retencion: 0.00 },
  GENERAL: { nombre: 'Traslado General / Inter-Sedes', retencion: 0.00 }
};

export const TIPOS_TRANSPORTE: Record<string, string> = {
  GASOLINA: 'Gasolina / Combustible',
  TAXI_APP: 'Taxi / App de Movilidad (Uber, Cabify, Indrive)',
  PEAJE: 'Peaje',
  PARQUEADERO: 'Parqueadero',
  OTRO: 'Otro Transporte'
};

export interface GastoItem {
  id: string;
  tipo: 'TRANSPORTE' | 'INSUMO';
  sede: string;
  subtipo: string;
  monto: number;
  concepto: string;
  fecha: string;
  origen_fondo: 'MEDICO_PERSONAL' | 'CAJA_CHICA_SEDE';
  estado_liquidacion: 'PENDIENTE' | 'LIQUIDADO';
}

export class ServicioGastosFinancieroTS {
  private gastos: GastoItem[] = [];

  constructor() {
    this.inicializarDatosDemo();
  }

  inicializarDatosDemo() {
    this.gastos = [
      {
        id: 'EXP-101',
        tipo: 'TRANSPORTE',
        sede: 'GENERAL',
        subtipo: 'TAXI_APP',
        monto: 4.00,
        concepto: 'Taxi hacia Clínica Ceibos por emergencia vial',
        fecha: '2026-10-18',
        origen_fondo: 'MEDICO_PERSONAL',
        estado_liquidacion: 'PENDIENTE'
      },
      {
        id: 'EXP-102',
        tipo: 'TRANSPORTE',
        sede: 'GENERAL',
        subtipo: 'GASOLINA',
        monto: 15.00,
        concepto: 'Gasolina recorrido intersemanal 4 sedes',
        fecha: '2026-10-19',
        origen_fondo: 'MEDICO_PERSONAL',
        estado_liquidacion: 'PENDIENTE'
      },
      {
        id: 'EXP-103',
        tipo: 'INSUMO',
        sede: 'CEIBOS',
        subtipo: 'INSUMOS_MEDICOS_BASICOS',
        monto: 12.00,
        concepto: 'Jeringas, guantes de nitrilo y gasas estériles',
        fecha: '2026-10-20',
        origen_fondo: 'CAJA_CHICA_SEDE',
        estado_liquidacion: 'PENDIENTE'
      }
    ];
  }

  getGastos(): GastoItem[] {
    return [...this.gastos];
  }

  calcularKpis() {
    const total = this.gastos.reduce((acc, g) => acc + g.monto, 0);
    const reembolsos = this.gastos
      .filter((g) => g.origen_fondo === 'MEDICO_PERSONAL')
      .reduce((acc, g) => acc + g.monto, 0);
    const deducciones = this.gastos
      .filter((g) => g.origen_fondo === 'CAJA_CHICA_SEDE')
      .reduce((acc, g) => acc + g.monto, 0);

    return {
      total: +total.toFixed(2),
      reembolsos: +reembolsos.toFixed(2),
      deducciones: +deducciones.toFixed(2)
    };
  }
}

export const servicioGastos = new ServicioGastosFinancieroTS();
export default servicioGastos;
