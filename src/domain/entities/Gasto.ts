// src/domain/entities/Gasto.ts
export interface Gasto {
  id: number;
  turno_id: number;
  concepto: string | null;   // descripción del gasto (ej: "Jabón para cocina") — opcional
  monto: number;      // monto exacto a descontar de la caja
  fecha: string;
  notas: string | null;
}

export type GastoInput = Omit<Gasto, 'id' | 'fecha'>;