/**
 * email_service.tsx
 * Servicio de Correos Transaccionales y Notificaciones - Semana 3
 * Plataforma SaaS: Gestión Médica Multisede (Montepiedra Salud)
 */

export interface DatosCitaEmail {
  codigo_cita: string;
  paciente_nombre: string;
  medico_nombre?: string;
  especialidad?: string;
  sede_nombre: string;
  sede_consultorio?: string;
  sede_direccion?: string;
  fecha_formateada: string;
  hora: string;
  metodo_pago: 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA';
  monto_base: number;
  precio_lista_oficial?: number;
  monto_recargo?: number;
  total_cobrado: number;
  token_seguro?: string;
}

export const generarPlantillaConfirmacionHtml = (datos: DatosCitaEmail): string => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(90deg, #0284c7, #1e40af); padding: 20px; color: #ffffff; text-align: center;">
        <h2 style="margin: 0; font-size: 20px;">🏥 Montepiedra Salud</h2>
        <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.9;">Confirmación Oficial de Cita Médica</p>
      </div>
      <div style="padding: 24px;">
        <h3 style="color: #0f172a; margin-top: 0;">¡Hola, ${datos.paciente_nombre}!</h3>
        <p style="color: #475569; font-size: 14px; line-height: 1.5;">Tu cita ha sido confirmada exitosamente en el sistema.</p>
        <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 4px 0;"><strong>Código de Cita:</strong> #${datos.codigo_cita}</p>
          <p style="margin: 4px 0;"><strong>Sede:</strong> ${datos.sede_nombre} (${datos.sede_consultorio || 'Consultorio Principal'})</p>
          <p style="margin: 4px 0;"><strong>Fecha y Hora:</strong> ${datos.fecha_formateada} a las ${datos.hora}</p>
          <p style="margin: 4px 0;"><strong>Total Pagado:</strong> $${datos.total_cobrado.toFixed(2)} (${datos.metodo_pago})</p>
        </div>
      </div>
    </div>
  `;
};

export default generarPlantillaConfirmacionHtml;
