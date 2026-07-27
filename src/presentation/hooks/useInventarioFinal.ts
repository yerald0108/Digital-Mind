// src/presentation/hooks/useInventarioFinal.ts
import { useState, useCallback, useEffect } from 'react';
import { Producto } from '../../domain/entities/Producto';
import { ItemInventarioTurnoInput } from '../../domain/entities/InventarioTurno';
import { TurnoRepository } from '../../data/repositories/TurnoRepository';

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
  const [cargando, setCargando] = useState(true);

  // Cargar inventario final desde la DB al montar o cuando cambia turnoId
  useEffect(() => {
    let cancelado = false;

    async function cargarDesdeDB() {
      try {
        setCargando(true);
        const inventarioFinal = await TurnoRepository.getInventario(turnoId, 'final');

        if (cancelado) return;

        if (inventarioFinal.length > 0) {
          // Mapear los productos con las cantidades guardadas en la DB
          setItems(
            productos.map((p) => {
              const guardado = inventarioFinal.find((i) => i.producto_id === p.id);
              return {
                producto_id: p.id,
                producto_nombre: p.nombre,
                precio_costo: p.precio_costo,
                precio_venta: p.precio_venta,
                cantidad: guardado?.cantidad ?? 0,
              };
            })
          );
        } else {
          // No hay inventario final guardado aún, inicializar en 0
          setItems(productosToItems(productos));
        }
      } catch (e) {
        console.error('[useInventarioFinal] Error al cargar desde DB:', e);
        if (!cancelado) {
          setItems(productosToItems(productos));
        }
      } finally {
        if (!cancelado) {
          setCargando(false);
        }
      }
    }

    if (productos.length > 0 && turnoId > 0) {
      cargarDesdeDB();
    }

    return () => {
      cancelado = true;
    };
  }, [productos, turnoId]);

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

  return { items, cargando, actualizarCantidad, toInputArray, resetear };
}