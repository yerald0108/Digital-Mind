// src/domain/entities/Merma.ts
export type TipoMerma = 'roto' | 'vencido' | 'otro';

export interface Merma {
  id: number;
  turno_id: number;
  producto_id: number;
  producto_nombre: string;   // snapshot
  cantidad: number;
  tipo: TipoMerma;
  fecha: string;
  notas: string | null;
}

export type MermaInput = Omit<Merma, 'id' | 'fecha'>;