/**
 * portal_pacientes.tsx
 * Núcleo de Servicios del Portal Público de Pacientes - Semana 3
 * Plataforma SaaS: Gestión Médica Multisede (Montepiedra Salud)
 */

export interface SlotHold {
  slotId: string;
  heldAt: number;
  ttlSeconds: number;
  userId?: string;
}

export class SlotHoldManagerTS {
  private static TTL_MS = 10 * 60 * 1000; // 10 minutos
  private static holds: Map<string, SlotHold> = new Map();

  static solicitarHold(slotId: string, userId: string): boolean {
    const ahora = Date.now();
    const holdExistente = this.holds.get(slotId);

    if (holdExistente && ahora - holdExistente.heldAt < this.TTL_MS) {
      if (holdExistente.userId !== userId) {
        return false; // Bloqueado por otro paciente
      }
    }

    this.holds.set(slotId, {
      slotId,
      heldAt: ahora,
      ttlSeconds: 600,
      userId
    });
    return true;
  }

  static liberarHold(slotId: string): void {
    this.holds.delete(slotId);
  }

  static verificarHold(slotId: string): boolean {
    const hold = this.holds.get(slotId);
    if (!hold) return false;
    if (Date.now() - hold.heldAt > this.TTL_MS) {
      this.holds.delete(slotId);
      return false;
    }
    return true;
  }
}

export default SlotHoldManagerTS;
