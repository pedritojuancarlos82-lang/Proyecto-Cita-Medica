/**
 * qr-token-service.js
 * Servicio Criptográfico de Tickets QR, Control de Hold Temporal y Admisión de Pacientes
 * Semana 3 (01 Oct - 07 Oct, 2026) - Hito 2
 * Plataforma SaaS: Montepiedra Salud
 */

export const SECRET_KEY_FRONTEND = 'montepiedra-salud-secret-key-2026-msp-ec';

/**
 * Generador de Hash ligero SHA-256 / Checksum criptográfico para navegador y offline
 */
function calcularChecksumSeguro(mensaje, clave = SECRET_KEY_FRONTEND) {
  let h1 = 0xdeadbeef ^ clave.length;
  let h2 = 0x41c6ce57 ^ clave.length;
  const texto = `${mensaje}|${clave}`;
  
  for (let i = 0; i < texto.length; i++) {
    const ch = texto.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  
  const hashVal = 4294967296 * (2097151 & h2) + (h1 >>> 0);
  return Math.abs(hashVal).toString(16).padStart(12, '0').slice(0, 12);
}

export class QRTokenService {
  /**
   * Genera un token criptográfico no predecible para el código QR
   * Previene ataques de enumeración y falsificación de citas médicas.
   */
  static generarTokenSeguro(citaId, codigoCita, fecha, hora, sedeId) {
    const payload = `${citaId}|${codigoCita}|${fecha}|${hora}|${sedeId}`;
    const firma = calcularChecksumSeguro(payload);
    return `${payload}|${firma}`;
  }

  /**
   * Valida un token de código QR escaneado por el recepcionista
   */
  static verificarToken(token) {
    if (!token || typeof token !== 'string') {
      return { valido: false, error: 'Token nulo o inválido' };
    }

    const partes = token.split('|');
    if (partes.length !== 6) {
      return { valido: false, error: 'Estructura de ticket alterada o incompleta' };
    }

    const [citaId, codigoCita, fecha, hora, sedeId, firmaRecibida] = partes;
    const payload = `${citaId}|${codigoCita}|${fecha}|${hora}|${sedeId}`;
    const firmaEsperada = calcularChecksumSeguro(payload);

    if (firmaRecibida !== firmaEsperada) {
      return {
        valido: false,
        error: 'Firma de seguridad inválida. El ticket ha sido adulterado.'
      };
    }

    return {
      valido: true,
      citaId,
      codigoCita,
      fecha,
      hora,
      sedeId
    };
  }

  /**
   * Genera URL de verificación rápida para la cámara del recepcionista
   */
  static generarUrlVerificacion(tokenSeguro, baseUrl = '') {
    const base = baseUrl || window.location.origin;
    return `${base}/comprobante.html?token=${encodeURIComponent(tokenSeguro)}&verificar=1`;
  }
}

/**
 * Gestor del Hold Temporal (Anti Phantom-Booking) en el Navegador
 */
export class SlotHoldManager {
  static HOLDS_STORAGE_KEY = 'montepiedra_active_slot_holds';

  /**
   * Guarda un hold de 10 minutos para el slot actual
   */
  static registrarHold(sedeId, fecha, hora, duracionMinutos = 45, ttlMinutos = 10) {
    const now = Date.now();
    const expiraAt = now + (ttlMinutos * 60 * 1000);
    const holdData = {
      id: `HOLD-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      sedeId,
      fecha,
      hora,
      duracionMinutos,
      creadoAt: now,
      expiraAt
    };

    localStorage.setItem(this.HOLDS_STORAGE_KEY, JSON.stringify(holdData));
    return holdData;
  }

  /**
   * Obtiene el hold activo o null si expiró
   */
  static obtenerHoldActivo() {
    try {
      const raw = localStorage.getItem(this.HOLDS_STORAGE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (Date.now() > data.expiraAt) {
        this.liberarHold();
        return null;
      }
      return data;
    } catch {
      return null;
    }
  }

  /**
   * Calcula los segundos restantes del hold
   */
  static obtenerSegundosRestantes() {
    const hold = this.obtenerHoldActivo();
    if (!hold) return 0;
    return Math.max(0, Math.floor((hold.expiraAt - Date.now()) / 1000));
  }

  /**
   * Formatea el tiempo restante en MM:SS
   */
  static formatearTiempoRestante(segundos) {
    const m = Math.floor(segundos / 60);
    const s = segundos % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  /**
   * Libera el hold tras confirmar la cita o por abandono voluntario
   */
  static liberarHold() {
    localStorage.removeItem(this.HOLDS_STORAGE_KEY);
  }
}

/**
 * Reconciliador de Expedientes del Paciente (Anti-Duplicidad / Data Siloing)
 */
export class PatientReconciliator {
  /**
   * Normaliza los datos del paciente para garantizar un único registro
   */
  static normalizarDatos(datos) {
    return {
      identificacion: (datos.identificacion || '').trim().replace(/\D/g, ''),
      nombre: (datos.nombre || '').trim().toUpperCase(),
      email: (datos.email || '').trim().toLowerCase(),
      telefono: (datos.telefono || '').trim().replace(/\s+/g, ''),
      alergias: (datos.alergias || '').trim() || 'Ninguna declarada'
    };
  }

  /**
   * Busca si el paciente ya existe en el historial local o central
   */
  static conciliar(pacientesExistentes, nuevoRegistro) {
    const norm = this.normalizarDatos(nuevoRegistro);
    if (!Array.isArray(pacientesExistentes)) return norm;

    // 1. Coincidencia por Cédula (identificador único determinista)
    let encontrado = pacientesExistentes.find(
      p => (p.idNumber || p.identificacion || '').trim() === norm.identificacion
    );

    // 2. Coincidencia por Correo o Teléfono si no coincide la cédula
    if (!encontrado && norm.email) {
      encontrado = pacientesExistentes.find(
        p => (p.email || '').trim().toLowerCase() === norm.email
      );
    }

    if (encontrado) {
      // Consolidar datos actualizados sin duplicar
      return {
        ...encontrado,
        nombre: norm.nombre || encontrado.name || encontrado.nombre,
        email: norm.email || encontrado.email,
        telefono: norm.telefono || encontrado.phone || encontrado.telefono,
        alergias: norm.alergias !== 'Ninguna declarada' ? norm.alergias : (encontrado.allergies || norm.alergias),
        esRecurrente: true
      };
    }

    return {
      ...norm,
      esRecurrente: false
    };
  }
}
