// src/domain/entities/CajaDia.ts
export interface CajaDia {
  id: number;
  turno_id: number;
  dia_numero: number;    // 1, 2, 3... según el día del turno
  monto_efectivo: number;
  fecha: string;
}

export type CajaDiaInput = Omit<CajaDia, 'id' | 'fecha'>;