// src/domain/entities/SalidaFamiliar.ts
export interface SalidaFamiliar {
  id: number;
  turno_id: number;
  producto_id: number;
  producto_nombre: string;   // snapshot
  cantidad: number;
  quien_sustrajo: string;
  fecha: string;
  notas: string | null;
}

export type SalidaFamiliarInput = Omit<SalidaFamiliar, 'id' | 'fecha'>;