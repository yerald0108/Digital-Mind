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
  crearProducto: (input: Omit<ProductoInput, 'orden'>) => Promise<Producto>;
  actualizarProducto: (id: number, input: Partial<ProductoInput>) => Promise<void>;
  eliminarProducto: (id: number) => Promise<void>;
  reordenarProductos: (productos: Producto[]) => Promise<void>;
}

export function useProductos(): UseProductosReturn {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cuando productosStore.version cambia significa que algún proceso externo
  // (ej: cerrar turno, crear producto desde Entradas) actualizó SQLite — hay que releer.
  // Todas las instancias del hook en toda la app reaccionan automáticamente.
  const version = useProductosStore((s) => s.version);
  const marcarActualizado = useProductosStore((s) => s.marcarActualizado);

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
    async (input: Omit<ProductoInput, 'orden'>): Promise<Producto> => {
      const orden = await ProductoRepository.getNextOrden();
      const id = await ProductoRepository.create({ ...input, orden });
      // Notificar a TODAS las instancias de useProductos en la app
      // (tab Inventario, tab Cuadre, etc.) para que recarguen.
      marcarActualizado();
      // Leer el producto recién creado para devolverlo al caller.
      const nuevo = await ProductoRepository.getById(id);
      if (!nuevo) throw new Error('No se pudo obtener el producto recién creado');
      return nuevo;
    },
    [marcarActualizado]
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