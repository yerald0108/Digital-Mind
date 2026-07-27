// src/domain/entities/Transferencia.ts
export interface Transferencia {
  id: number;
  turno_id: number;
  monto: number;
  concepto: string | null;
  fecha: string;
}

export type TransferenciaInput = Omit<Transferencia, 'id' | 'fecha'>;