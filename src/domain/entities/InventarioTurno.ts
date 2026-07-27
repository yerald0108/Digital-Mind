// src/domain/entities/InventarioTurno.ts

// Snapshot de un producto en el inventario al abrir/cerrar el turno
export interface ItemInventarioTurno {
  id: number;
  turno_id: number;
  producto_id: number;
  producto_nombre: string;
  precio_costo: number;
  precio_venta: number;
  cantidad: number;
  tipo: 'inicial' | 'final';
  fecha: string;
}

export type ItemInventarioTurnoInput = Omit<ItemInventarioTurno, 'id' | 'fecha'>;