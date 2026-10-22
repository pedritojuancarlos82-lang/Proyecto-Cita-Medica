/**
 * api_gastos.tsx
 * Endpoints REST y Manejador de Solicitudes para el Módulo de Gastos Operativos (Semana 3)
 * Montepiedra Salud - Sistema de Liquidación y Contabilidad Multisede
 */

export interface GastoApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode: number;
}

export interface GastoRegistroRequest {
  tipo: 'TRANSPORTE' | 'INSUMO';
  sede: 'MAPASINGUE' | 'CEIBOS' | 'ALBORADA' | 'HOSPITAL' | 'GENERAL';
  monto: number;
  concepto: string;
  fecha: string;
  subtipo?: string;
  origen_fondo?: 'MEDICO_PERSONAL' | 'CAJA_CHICA_SEDE';
  tipo_comprobante?: 'FACTURA_RUC' | 'NOTA_VENTA' | 'SIN_COMPROBANTE';
  numero_factura?: string;
}

export class GastosApiHandlerTS {
  static formatResponse<T>(data: T, statusCode: number = 200): GastoApiResponse<T> {
    return {
      success: statusCode >= 200 && statusCode < 300,
      data,
      statusCode
    };
  }

  static formatError(error: string, statusCode: number = 400): GastoApiResponse {
    return {
      success: false,
      error,
      statusCode
    };
  }

  static validarGasto(payload: GastoRegistroRequest): { valido: boolean; error?: string } {
    if (!payload.monto || payload.monto <= 0) {
      return { valido: false, error: 'El monto del gasto debe ser un número positivo.' };
    }
    if (!payload.concepto || !payload.concepto.trim()) {
      return { valido: false, error: 'El concepto del gasto es requerido.' };
    }
    if (!payload.fecha) {
      return { valido: false, error: 'La fecha del gasto es obligatoria.' };
    }
    return { valido: true };
  }
}

export default GastosApiHandlerTS;
