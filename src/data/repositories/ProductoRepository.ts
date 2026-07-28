// src/data/repositories/ProductoRepository.ts
import { getDatabase } from '../database/db';
import { Producto, ProductoInput } from '../../domain/entities/Producto';

export const ProductoRepository = {

  async getAll(): Promise<Producto[]> {
    const db = getDatabase();
    return await db.getAllAsync<Producto>(
      'SELECT * FROM productos ORDER BY orden ASC, id ASC'
    );
  },

  async getById(id: number): Promise<Producto | null> {
    const db = getDatabase();
    return await db.getFirstAsync<Producto>(
      'SELECT * FROM productos WHERE id = ?', [id]
    );
  },

  async create(input: ProductoInput): Promise<number> {
    const db = getDatabase();
    const result = await db.runAsync(
      `INSERT INTO productos (nombre, precio_costo, precio_venta, cantidad, orden)
       VALUES (?, ?, ?, ?, ?)`,
      [input.nombre, input.precio_costo, input.precio_venta, input.cantidad, input.orden]
    );
    return result.lastInsertRowId;
  },

  /**
   * Actualiza un producto solo con los campos enviados.
   * Los campos no incluidos en input mantienen su valor actual.
   * Soporta correctamente valores 0, false, y string vacio.
   */
  async update(id: number, input: Partial<ProductoInput>): Promise<void> {
    const db = getDatabase();

    // Construir dinamicamente solo los campos enviados
    const campos: string[] = [];
    const valores: any[] = [];

    if (input.nombre !== undefined) {
      campos.push('nombre = ?');
      valores.push(input.nombre);
    }
    if (input.precio_costo !== undefined) {
      campos.push('precio_costo = ?');
      valores.push(input.precio_costo);
    }
    if (input.precio_venta !== undefined) {
      campos.push('precio_venta = ?');
      valores.push(input.precio_venta);
    }
    if (input.cantidad !== undefined) {
      campos.push('cantidad = ?');
      valores.push(input.cantidad);
    }
    if (input.orden !== undefined) {
      campos.push('orden = ?');
      valores.push(input.orden);
    }

    // Si no se envio ningun campo, no ejecutar la query
    if (campos.length === 0) return;

    // Siempre actualizar la fecha de modificacion
    campos.push("actualizado_en = datetime('now')");
    valores.push(id);

    await db.runAsync(
      `UPDATE productos SET ${campos.join(', ')} WHERE id = ?`,
      valores
    );
  },

  async delete(id: number): Promise<void> {
    const db = getDatabase();
    await db.runAsync('DELETE FROM inventario_turno WHERE producto_id = ?', [id]);
    await db.runAsync('DELETE FROM entradas WHERE producto_id = ?', [id]);
    await db.runAsync('DELETE FROM salidas_familiares WHERE producto_id = ?', [id]);
    await db.runAsync('DELETE FROM cambios_precio WHERE producto_id = ?', [id]);
    await db.runAsync('DELETE FROM mermas WHERE producto_id = ?', [id]);
    await db.runAsync('DELETE FROM productos WHERE id = ?', [id]);
  },

  async getNextOrden(): Promise<number> {
    const db = getDatabase();
    const result = await db.getFirstAsync<{ max_orden: number | null }>(
      'SELECT MAX(orden) as max_orden FROM productos'
    );
    return (result?.max_orden ?? -1) + 1;
  },

  async reordenar(items: Array<{ id: number; orden: number }>): Promise<void> {
    const db = getDatabase();
    for (const item of items) {
      await db.runAsync(
        "UPDATE productos SET orden = ?, actualizado_en = datetime('now') WHERE id = ?",
        [item.orden, item.id]
      );
    }
  },

  async sumarCantidad(id: number, cantidad: number): Promise<void> {
    const db = getDatabase();
    await db.runAsync(
      "UPDATE productos SET cantidad = cantidad + ?, actualizado_en = datetime('now') WHERE id = ?",
      [cantidad, id]
    );
  },
};