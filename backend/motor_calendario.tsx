/**
 * motor_calendario.tsx
 * Núcleo Backend y Lógica de Negocio - Semana 2
 * Plataforma SaaS: Gestión Médica Multisede (Montepiedra Salud)
 * Motor Algorítmico de Prevención de Choques y Tránsito Interurbano en Guayaquil
 */

export interface MatrizRuta {
  distanciaKm: number;
  bufferMinutos: number;
  rutaPrincipal: string;
}

export const MATRIZ_TRASLADO_GUAYAQUIL: Record<string, MatrizRuta> = {
  'CEIBOS-ALBORADA': {
    distanciaKm: 16.5,
    bufferMinutos: 45,
    rutaPrincipal: 'Av. del Bombero -> Av. Carlos Julio Arosemena -> Av. Juan Tanca Marengo'
  },
  'ALBORADA-CEIBOS': {
    distanciaKm: 16.5,
    bufferMinutos: 45,
    rutaPrincipal: 'Av. Benjamín Carrión -> Av. Juan Tanca Marengo -> Vía a la Costa'
  },
  'MAPASINGUE-CEIBOS': {
    distanciaKm: 7.2,
    bufferMinutos: 25,
    rutaPrincipal: 'Av. Las Aguas -> Av. Carlos Julio Arosemena -> Av. del Bombero'
  },
  'CEIBOS-MAPASINGUE': {
    distanciaKm: 7.2,
    bufferMinutos: 25,
    rutaPrincipal: 'Av. del Bombero -> Retorno Carlos Julio Arosemena -> Mapasingue'
  }
};

export class MotorCalendarioTS {
  static calcularMargenTraslado(origen: string, destino: string): number {
    const key = `${origen.toUpperCase()}-${destino.toUpperCase()}`;
    return MATRIZ_TRASLADO_GUAYAQUIL[key]?.bufferMinutos || 30;
  }

  static verificarColision(
    citasExistentes: Array<{ horaInicio: string; duracion: number; sede: string }>,
    nuevaHora: string,
    nuevaSede: string,
    duracionNueva: number = 45
  ): { hayChoque: boolean; motivo?: string } {
    const toMins = (h: string) => {
      const [hh, mm] = h.split(':').map(Number);
      return hh * 60 + mm;
    };

    const inicioNuevo = toMins(nuevaHora);
    const finNuevo = inicioNuevo + duracionNueva;

    for (const cita of citasExistentes) {
      const inicioExistente = toMins(cita.horaInicio);
      const finExistente = inicioExistente + cita.duracion;

      // Choque directo de horario
      if (inicioNuevo < finExistente && finNuevo > inicioExistente) {
        return { hayChoque: true, motivo: `Choque directo con cita en ${cita.sede} (${cita.horaInicio})` };
      }

      // Choque por traslado si son sedes distintas
      if (cita.sede !== nuevaSede) {
        const buffer = this.calcularMargenTraslado(cita.sede, nuevaSede);
        if (inicioNuevo >= finExistente && inicioNuevo < finExistente + buffer) {
          return {
            hayChoque: true,
            motivo: `Tiempo insuficiente de traslado vial (${buffer} min requeridos entre ${cita.sede} y ${nuevaSede})`
          };
        }
      }
    }

    return { hayChoque: false };
  }
}

export default MotorCalendarioTS;
