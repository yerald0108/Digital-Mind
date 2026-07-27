// src/domain/entities/Producto.ts
export interface Producto {
  id: number;
  nombre: string;
  precio_costo: number;
  precio_venta: number;
  cantidad: number;          // existencia actual
  orden: number;
  creado_en: string;
  actualizado_en: string;
}

export type ProductoInput = Omit<Producto, 'id' | 'creado_en' | 'actualizado_en'>;