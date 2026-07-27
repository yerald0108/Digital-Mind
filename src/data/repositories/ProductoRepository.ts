// src/data/repositories/ProductoRepository.ts
import { getDatabase } from '../database/db';
import { Producto, ProductoInput } from '../../domain/entities/Producto';

export const ProductoRepository = {

  async getAll(): Promise<Producto[]> {
    const db = await getDatabase();
    return await db.getAllAsync<Producto>(
      'SELECT * FROM productos ORDER BY orden ASC, id ASC'
    );
  },

  async getById(id: number): Promise<Producto | null> {
    const db = await getDatabase();
    return await db.getFirstAsync<Producto>(
      'SELECT * FROM productos WHERE id = ?', [id]
    );
  },

  async create(input: ProductoInput): Promise<number> {
    const db = await getDatabase();
    const result = await db.runAsync(
      `INSERT INTO productos (nombre, precio_costo, precio_venta, cantidad, orden)
       VALUES (?, ?, ?, ?, ?)`,
      [input.nombre, input.precio_costo, input.precio_venta, input.cantidad, input.orden]
    );
    return result.lastInsertRowId;
  },

  async update(id: number, input: Partial<ProductoInput>): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE productos
       SET nombre = COALESCE(?, nombre),
           precio_costo = COALESCE(?, precio_costo),
           precio_venta = COALESCE(?, precio_venta),
           cantidad = COALESCE(?, cantidad),
           orden = COALESCE(?, orden),
           actualizado_en = datetime('now')
       WHERE id = ?`,
      [
        input.nombre ?? null,
        input.precio_costo ?? null,
        input.precio_venta ?? null,
        input.cantidad ?? null,
        input.orden ?? null,
        id,
      ]
    );
  },

  async delete(id: number): Promise<void> {
    const db = await getDatabase();
    // Eliminar registros relacionados antes por foreign key constraint
    await db.runAsync('DELETE FROM inventario_turno WHERE producto_id = ?', [id]);
    await db.runAsync('DELETE FROM entradas WHERE producto_id = ?', [id]);
    await db.runAsync('DELETE FROM salidas_familiares WHERE producto_id = ?', [id]);
    await db.runAsync('DELETE FROM cambios_precio WHERE producto_id = ?', [id]);
    await db.runAsync('DELETE FROM mermas WHERE producto_id = ?', [id]);
    // Eliminar el producto
    await db.runAsync('DELETE FROM productos WHERE id = ?', [id]);
  },

  async getNextOrden(): Promise<number> {
    const db = await getDatabase();
    const result = await db.getFirstAsync<{ max_orden: number | null }>(
      'SELECT MAX(orden) as max_orden FROM productos'
    );
    return (result?.max_orden ?? -1) + 1;
  },

  async reordenar(items: Array<{ id: number; orden: number }>): Promise<void> {
    const db = await getDatabase();
    for (const item of items) {
      await db.runAsync(
        "UPDATE productos SET orden = ?, actualizado_en = datetime('now') WHERE id = ?",
        [item.orden, item.id]
      );
    }
  },

  // Sumar cantidad cuando entra stock
  async sumarCantidad(id: number, cantidad: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      "UPDATE productos SET cantidad = cantidad + ?, actualizado_en = datetime('now') WHERE id = ?",
      [cantidad, id]
    );
  },
};