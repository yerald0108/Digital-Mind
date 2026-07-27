// src/presentation/hooks/useBusquedaProductos.ts
import { useState, useMemo } from 'react';
import { Producto } from '../../domain/entities/Producto';

interface UseBusquedaProductosReturn {
  query: string;
  setQuery: (q: string) => void;
  resultados: Producto[];
  hayQuery: boolean;
  limpiar: () => void;
}

export function useBusquedaProductos(productos: Producto[]): UseBusquedaProductosReturn {
  const [query, setQuery] = useState('');

  const resultados = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return productos;

    return productos.filter((p) => {
      const nombre = p.nombre.toLowerCase();
      // Busca por coincidencia parcial en el nombre
      if (nombre.includes(q)) return true;
      // Busca por iniciales (ej: "cf" encuentra "Café")
      const iniciales = nombre
        .split(' ')
        .map((w) => w[0])
        .join('');
      if (iniciales.includes(q)) return true;
      // Busca por precio (ej: "50" encuentra precio 50.00)
      if (String(p.precio_venta).includes(q)) return true;
      return false;
    });
  }, [query, productos]);

  return {
    query,
    setQuery,
    resultados,
    hayQuery: query.trim().length > 0,
    limpiar: () => setQuery(''),
  };
}