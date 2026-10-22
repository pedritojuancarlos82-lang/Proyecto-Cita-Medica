/**
 * add_logic.tsx
 * Lógica TypeScript para el Cálculo y Liquidación de Ingresos Médicos
 * Montepiedra Salud - Módulo Médico
 */

export interface AppointmentIncome {
  id?: string;
  patientName: string;
  patientId: string;
  clinicId: string;
  date: string;
  time: string;
  basePrice: number;
  paymentMethod: string;
  reason?: string;
  retentionRate?: number;
  retentionAmount?: number;
  netYield?: number;
}

export interface IncomeKpiSummary {
  bruto: number;
  retenciones: number;
  neto: number;
  conteo: number;
}

export const calcularKpisIngresos = (lista: AppointmentIncome[]): IncomeKpiSummary => {
  let bruto = 0;
  let retenciones = 0;
  let neto = 0;

  lista.forEach((item) => {
    const b = Number(item.basePrice || 0);
    let rRate = 0.05;
    if (item.clinicId === 'ceibos') rRate = 0.25;
    if (item.clinicId === 'alborada') rRate = 0.10;
    if (item.clinicId === 'hospital') rRate = 0.00;

    const ret = b * rRate;
    const n = b - ret;

    bruto += b;
    retenciones += ret;
    neto += n;
  });

  return {
    bruto: +bruto.toFixed(2),
    retenciones: +retenciones.toFixed(2),
    neto: +neto.toFixed(2),
    conteo: lista.length
  };
};

export default { calcularKpisIngresos };
