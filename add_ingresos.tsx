/**
 * add_ingresos.tsx
 * Módulo de Gestión de Ingresos Médicos (Montepiedra Salud)
 * Lógica TypeScript para registro de pagos de consultas y cálculo de comisiones.
 */

export interface PagoConsultaData {
  sede: 'mapasingue' | 'ceibos' | 'alborada' | 'hospital';
  fecha: string;
  precio: number;
  metodo: 'efectivo' | 'tarjeta' | 'otro';
}

export interface IngresoRegistrado extends PagoConsultaData {
  id: string;
  retencionPorcentaje: number;
  montoRetencion: number;
  ingresoNeto: number;
}

export const SEDES_RETENCION_MAP: Record<PagoConsultaData['sede'], number> = {
  ceibos: 0.25,
  alborada: 0.10,
  mapasingue: 0.05,
  hospital: 0.00
};

export function procesarPagoConsulta(data: PagoConsultaData): IngresoRegistrado {
  const retencionPorcentaje = SEDES_RETENCION_MAP[data.sede] ?? 0.05;
  const montoRetencion = +(data.precio * retencionPorcentaje).toFixed(2);
  const ingresoNeto = +(data.precio - montoRetencion).toFixed(2);

  return {
    ...data,
    id: `PAY-${Date.now()}`,
    retencionPorcentaje,
    montoRetencion,
    ingresoNeto
  };
}

export default { procesarPagoConsulta, SEDES_RETENCION_MAP };
