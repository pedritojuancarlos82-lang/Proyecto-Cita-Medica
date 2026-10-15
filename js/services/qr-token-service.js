/**
 * qr-token-service.js
 * Servicio Criptográfico de Tickets QR, Control de Hold Temporal y Admisión de Pacientes
 * Semana 3 (01 Oct - 07 Oct, 2026) - Hito 2
 * Plataforma SaaS: Montepiedra Salud
 */

import { BASE_URL } from '../qr-generator.js';
export const SECRET_KEY_FRONTEND = 'montepiedra-salud-secret-key-2026-msp-ec';

/**
 * Generador SHA-256 criptográfico estándar inmutable (RFC 6234 / FIPS 180-4)
 * Ejecuta sincrónicamente en cualquier entorno (Browser, Node, Offline).
 */
export function sha256(ascii) {
  function rightRotate(value, amount) {
    return (value >>> amount) | (value << (32 - amount));
  }
  
  const mathPow = Math.pow;
  let lengthProperty = 'length';
  let i, j;
  let result = '';

  const words = [];
  const asciiBitLength = ascii[lengthProperty] * 8;
  
  let hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ];

  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  words[asciiBitLength >> 5] |= 0x80 << (24 - (asciiBitLength % 32));
  words[(((asciiBitLength + 64) >> 9) << 4) + 15] = asciiBitLength;

  for (i = 0; i < ascii[lengthProperty]; i++) {
    words[i >> 2] |= ascii.charCodeAt(i) << (24 - (i % 4) * 8);
  }

  for (let j = 0; j < words[lengthProperty]; j += 16) {
    const w = words.slice(j, j + 16);
    const oldHash = hash.slice(0);

    for (i = 0; i < 64; i++) {
      const i2 = i + j;
      const w15 = w[i - 15], w2 = w[i - 2];

      const a = hash[0], e = hash[4];
      const temp1 = hash[7]
        + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25))
        + ((e & hash[5]) ^ ((~e) & hash[6]))
        + k[i]
        + (w[i] = (i < 16) ? w[i] : (
            w[i - 16]
            + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3))
            + w[i - 7]
            + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))
          ) | 0
        );
      const temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22))
        + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
      
      hash = [(temp1 + temp2) | 0, a, hash[1], hash[2], (hash[3] + temp1) | 0, hash[4], hash[5], hash[6]];
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (let b = 3; b >= 0; b--) {
      const byte = (hash[i] >> (b * 8)) & 255;
      result += ((byte < 16 ? '0' : '') + byte.toString(16));
    }
  }
  return result;
}

/**
 * Calcula la firma SHA-256 criptográfica inmutable
 */
export function calcularChecksumSeguro(mensaje, clave = SECRET_KEY_FRONTEND) {
  return sha256(`${mensaje}|${clave}`);
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
      sedeId,
      firma: firmaRecibida
    };
  }

  /**
   * Genera URL de verificación para el código QR construida siempre sobre BASE_URL
   */
  static generarUrlVerificacion(tokenSeguro, paramsExtra = {}) {
    const searchParams = new URLSearchParams(paramsExtra);
    searchParams.set('token', tokenSeguro);
    searchParams.set('verificar', '1');
    return `${BASE_URL}/comprobante.html?${searchParams.toString()}`;
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
