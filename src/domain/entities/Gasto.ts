// src/domain/entities/Gasto.ts
export interface Gasto {
  id: number;
  turno_id: number;
  producto_id: number | null;
  producto_nombre: string;
  precio_venta: number;        // precio real de venta
  precio_cobrado: number;      // precio que pagó el trabajador
  diferencia: number;          // precio_venta - precio_cobrado (lo que se descuenta)
  cantidad: number;
  fecha: string;
  notas: string | null;
}

export type GastoInput = Omit<Gasto, 'id' | 'fecha' | 'diferencia'>;