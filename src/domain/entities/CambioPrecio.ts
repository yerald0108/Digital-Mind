// src/domain/entities/CambioPrecio.ts
export interface CambioPrecio {
  id: number;
  turno_id: number;
  producto_id: number;
  producto_nombre: string;      // snapshot
  precio_anterior: number;
  precio_nuevo: number;
  cantidad_existente: number;   // unidades en existencia al momento del cambio
  fecha: string;
  notas: string | null;
}

export type CambioPrecioInput = Omit<CambioPrecio, 'id' | 'fecha'>;