// src/domain/entities/Entrada.ts
export interface Entrada {
  id: number;
  turno_id: number;
  producto_id: number;
  producto_nombre: string;   // snapshot del nombre al momento
  cantidad: number;
  precio_costo: number;      // snapshot del precio al momento
  fecha: string;
  notas: string | null;
}

export type EntradaInput = Omit<Entrada, 'id' | 'fecha'>;