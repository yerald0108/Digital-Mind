// src/presentation/hooks/useInventarioFinal.ts
import { useState, useCallback, useEffect, useMemo } from 'react';
import { Producto } from '../../domain/entities/Producto';
import { Entrada } from '../../domain/entities/Entrada';
import { ItemInventarioTurnoInput } from '../../domain/entities/InventarioTurno';
import { TurnoRepository } from '../../data/repositories/TurnoRepository';

export interface ItemFinal {
  producto_id: number;
  producto_nombre: string;
  precio_costo: number;
  precio_venta: number;
  cantidad: number;
  /** true = el usuario ingresó manualmente algún valor en este turno */
  tocado: boolean;
}

function productosToItems(productos: Producto[]): ItemFinal[] {
  return productos.map((p) => ({
    producto_id: p.id,
    producto_nombre: p.nombre,
    precio_costo: p.precio_costo,
    precio_venta: p.precio_venta,
    cantidad: 0,
    tocado: false,
  }));
}

/**
 * Devuelve la lista unificada de items para el inventario final.
 * Incluye todos los productos del inventario base + los productos que
 * llegaron solo por entradas durante el turno (sin duplicados).
 */
export function useInventarioFinal(
  productos: Producto[],
  turnoId: number,
  entradas: Entrada[] = [],
) {
  const [items, setItems] = useState<ItemFinal[]>(() =>
    productosToItems(productos)
  );
  const [cargando, setCargando] = useState(true);

  // Clave estable derivada de los campos relevantes de los productos.
  const productosClave = useMemo(
    () =>
      productos
        .map((p) => `${p.id}:${p.nombre}:${p.precio_costo}:${p.precio_venta}`)
        .join('|'),
    [productos]
  );

  // Clave estable para las entradas (solo producto_id y precio para detectar nuevos)
  const entradasClave = useMemo(
    () =>
      entradas
        .map((e) => `${e.producto_id}:${e.precio_costo}`)
        .join('|'),
    [entradas]
  );

  useEffect(() => {
    let cancelado = false;

    async function cargarDesdeDB() {
      try {
        const inventarioFinal = await TurnoRepository.getInventario(turnoId, 'final');

        if (cancelado) return;

        // Construir mapa de productos base (del inventario permanente)
        const idsBase = new Set(productos.map((p) => p.id));

        // Detectar productos que llegaron SOLO por entradas (no están en el inventario base)
        const productosNuevosPorEntrada: ItemFinal[] = [];
        const vistos = new Set<number>();
        for (const e of entradas) {
          if (!idsBase.has(e.producto_id) && !vistos.has(e.producto_id)) {
            vistos.add(e.producto_id);
            productosNuevosPorEntrada.push({
              producto_id: e.producto_id,
              producto_nombre: e.producto_nombre,
              precio_costo: e.precio_costo,
              precio_venta: e.precio_costo, // fallback; se sobreescribe si hay final guardado
              cantidad: 0,
              tocado: false,
            });
          }
        }

        if (inventarioFinal.length > 0) {
          // Mapa rápido del final guardado
          const finalMap = new Map(inventarioFinal.map((f) => [f.producto_id, f]));

          // Items del inventario base
          const itemsBase: ItemFinal[] = productos.map((p) => {
            const guardado = finalMap.get(p.id);
            return {
              producto_id: p.id,
              producto_nombre: p.nombre,
              precio_costo: p.precio_costo,
              precio_venta: p.precio_venta,
              cantidad: guardado?.cantidad ?? 0,
              // Si hay un guardado previo para este producto, se considera tocado
              tocado: guardado !== undefined,
            };
          });

          // Items de productos nuevos por entrada
          const itemsEntrada: ItemFinal[] = productosNuevosPorEntrada.map((np) => {
            const guardado = finalMap.get(np.producto_id);
            return {
              ...np,
              precio_venta: guardado?.precio_venta ?? np.precio_venta,
              cantidad: guardado?.cantidad ?? 0,
              tocado: guardado !== undefined,
            };
          });

          if (!cancelado) {
            setItems([...itemsBase, ...itemsEntrada]);
          }
        } else {
          // Sin inventario final guardado aún
          const itemsBase = productosToItems(productos);
          if (!cancelado) {
            setItems([...itemsBase, ...productosNuevosPorEntrada]);
          }
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

    if (turnoId > 0) {
      cargarDesdeDB();
    } else {
      setCargando(false);
    }

    return () => {
      cancelado = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turnoId, productosClave, entradasClave]);

  const actualizarCantidad = useCallback((productoId: number, cantidad: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.producto_id === productoId
          ? { ...item, cantidad, tocado: true }
          : item
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

  return { items, cargando, actualizarCantidad, toInputArray };
}