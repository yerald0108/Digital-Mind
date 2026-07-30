// src/presentation/hooks/useProductos.ts
import { useState, useEffect, useCallback } from 'react';
import { Producto, ProductoInput } from '../../domain/entities/Producto';
import { ProductoRepository } from '../../data/repositories/ProductoRepository';
import { useProductosStore } from '../stores/productosStore';

interface UseProductosReturn {
  productos: Producto[];
  cargando: boolean;
  error: string | null;
  recargar: () => Promise<void>;
  crearProducto: (input: Omit<ProductoInput, 'orden'>) => Promise<void>;
  actualizarProducto: (id: number, input: Partial<ProductoInput>) => Promise<void>;
  eliminarProducto: (id: number) => Promise<void>;
  reordenarProductos: (productos: Producto[]) => Promise<void>;
}

export function useProductos(): UseProductosReturn {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cuando productosStore.version cambia significa que algún proceso externo
  // (ej: cerrar turno) actualizó cantidades en SQLite — hay que releer.
  const version = useProductosStore((s) => s.version);

  const recargar = useCallback(async () => {
    try {
      setCargando(true);
      setError(null);
      const data = await ProductoRepository.getAll();
      setProductos(data);
    } catch (e) {
      setError('Error al cargar los productos');
      console.error('[useProductos] recargar:', e);
    } finally {
      setCargando(false);
    }
  }, []);

  // Se ejecuta en el mount inicial y también cada vez que version cambia
  // (señal de que el inventario fue modificado externamente).
  useEffect(() => { recargar(); }, [recargar, version]);

  const crearProducto = useCallback(
    async (input: Omit<ProductoInput, 'orden'>) => {
      const orden = await ProductoRepository.getNextOrden();
      await ProductoRepository.create({ ...input, orden });
      await recargar();
    },
    [recargar]
  );

  const actualizarProducto = useCallback(
    async (id: number, input: Partial<ProductoInput>) => {
      await ProductoRepository.update(id, input);
      await recargar();
    },
    [recargar]
  );

  const eliminarProducto = useCallback(
    async (id: number) => {
      await ProductoRepository.delete(id);
      await recargar();
    },
    [recargar]
  );

  const reordenarProductos = useCallback(
    async (nuevosProductos: Producto[]) => {
      setProductos(nuevosProductos);
      const items = nuevosProductos.map((p, index) => ({ id: p.id, orden: index }));
      await ProductoRepository.reordenar(items);
    },
    []
  );

  return {
    productos, cargando, error, recargar,
    crearProducto, actualizarProducto, eliminarProducto, reordenarProductos,
  };
}