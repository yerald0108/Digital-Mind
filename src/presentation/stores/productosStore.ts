// src/presentation/stores/productosStore.ts
//
// Store liviano que actúa como señal de "los productos fueron modificados
// externamente" (ej: al cerrar turno el usecase actualiza cantidades en SQLite).
// Cualquier componente que use useProductos puede suscribirse a esta señal
// para disparar un recargar() automático.
//
import { create } from 'zustand';

interface ProductosStore {
  /** Incrementa cada vez que se modifica el inventario desde fuera de la tab Inventario */
  version: number;
  /** Llamar después de actualizar cantidades de productos (ej: cerrar turno) */
  marcarActualizado: () => void;
}

export const useProductosStore = create<ProductosStore>((set) => ({
  version: 0,
  marcarActualizado: () => set((s) => ({ version: s.version + 1 })),
}));