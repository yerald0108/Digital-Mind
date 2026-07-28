// src/data/repositories/TurnoRepository.ts
import { getDatabase } from '../database/db';
import { Turno, TurnoInput } from '../../domain/entities/Turno';
import { ItemInventarioTurno, ItemInventarioTurnoInput } from '../../domain/entities/InventarioTurno';

export const TurnoRepository = {

  async getTurnoAbierto(): Promise<Turno | null> {
    const db = getDatabase();
    return await db.getFirstAsync<Turno>(
      "SELECT * FROM turnos WHERE estado = 'abierto' LIMIT 1"
    );
  },

  async getAll(): Promise<Turno[]> {
    const db = getDatabase();
    return await db.getAllAsync<Turno>(
      'SELECT * FROM turnos ORDER BY id DESC'
    );
  },

  async getById(id: number): Promise<Turno | null> {
    const db = getDatabase();
    return await db.getFirstAsync<Turno>(
      'SELECT * FROM turnos WHERE id = ?',
      [id]
    );
  },

  async abrir(input: TurnoInput): Promise<number> {
    const db = getDatabase();
    const result = await db.runAsync(
      `INSERT INTO turnos (dias_duracion, estado, fecha_apertura)
       VALUES (?, 'abierto', datetime('now'))`,
      [input.dias_duracion]
    );
    return result.lastInsertRowId;
  },

  async cerrar(id: number): Promise<void> {
    const db = getDatabase();
    await db.runAsync(
      `UPDATE turnos
       SET estado = 'cerrado', fecha_cierre = datetime('now')
       WHERE id = ?`,
      [id]
    );
  },

  /**
   * Reabre un turno que fue cerrado.
   * Se usa exclusivamente durante el rollback del cierre
   * cuando algo falla y hay que revertir el estado.
   */
  async reabrir(id: number): Promise<void> {
    const db = getDatabase();
    await db.runAsync(
      `UPDATE turnos
       SET estado = 'abierto', fecha_cierre = NULL
       WHERE id = ?`,
      [id]
    );
  },

  async actualizarDias(id: number, dias: number): Promise<void> {
    const db = getDatabase();
    await db.runAsync(
      'UPDATE turnos SET dias_duracion = ? WHERE id = ?',
      [dias, id]
    );
  },

  async guardarInventario(items: ItemInventarioTurnoInput[]): Promise<void> {
    const db = getDatabase();
    for (const item of items) {
      await db.runAsync(
        `INSERT INTO inventario_turno
         (turno_id, producto_id, producto_nombre, precio_costo, precio_venta, cantidad, tipo)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          item.turno_id,
          item.producto_id,
          item.producto_nombre,
          item.precio_costo,
          item.precio_venta,
          item.cantidad,
          item.tipo,
        ]
      );
    }
  },

  async getInventario(
    turnoId: number,
    tipo: 'inicial' | 'final'
  ): Promise<ItemInventarioTurno[]> {
    const db = getDatabase();
    return await db.getAllAsync<ItemInventarioTurno>(
      `SELECT * FROM inventario_turno
       WHERE turno_id = ? AND tipo = ?
       ORDER BY id ASC`,
      [turnoId, tipo]
    );
  },
};