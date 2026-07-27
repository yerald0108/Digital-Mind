// src/presentation/hooks/useInventarioFinal.ts
import { useState, useCallback, useEffect } from 'react';
import { Producto } from '../../domain/entities/Producto';
import { ItemInventarioTurnoInput } from '../../domain/entities/InventarioTurno';

export interface ItemFinal {
  producto_id: number;
  producto_nombre: string;
  precio_costo: number;
  precio_venta: number;
  cantidad: number;
}

function productosToItems(productos: Producto[]): ItemFinal[] {
  return productos.map((p) => ({
    producto_id: p.id,
    producto_nombre: p.nombre,
    precio_costo: p.precio_costo,
    precio_venta: p.precio_venta,
    cantidad: 0,
  }));
}

export function useInventarioFinal(productos: Producto[], turnoId: number) {
  const [items, setItems] = useState<ItemFinal[]>(() =>
    productosToItems(productos)
  );

  // Sincronizar cuando los productos carguen o cambien
  useEffect(() => {
    if (productos.length > 0) {
      setItems((prev) => {
        // Mantener cantidades ya ingresadas si el producto ya existía
        return productos.map((p) => {
          const existente = prev.find((i) => i.producto_id === p.id);
          return {
            producto_id: p.id,
            producto_nombre: p.nombre,
            precio_costo: p.precio_costo,
            precio_venta: p.precio_venta,
            cantidad: existente?.cantidad ?? 0,
          };
        });
      });
    }
  }, [productos]);

  const actualizarCantidad = useCallback((productoId: number, cantidad: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.producto_id === productoId ? { ...item, cantidad } : item
      )
    );
  }, []);

  const toInputArray = useCallback((): ItemInventarioTurnoInput[] =>
    items.map((item) => ({
      turno_id: turnoId,
      producto_id: item.producto_id,
      producto_nombre: item.producto_nombre,
      precio_costo: item.precio_costo,
      precio_venta: item.precio_venta,
      cantidad: item.cantidad,
      tipo: 'final',
    })),
    [items, turnoId]
  );

  const resetear = useCallback(() => {
    setItems(productosToItems(productos));
  }, [productos]);

  return { items, actualizarCantidad, toInputArray, resetear };
}