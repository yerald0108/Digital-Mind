// src/data/repositories/TurnoRepository.ts
import { getDatabase } from '../database/db';
import { Turno, TurnoInput } from '../../domain/entities/Turno';
import { ItemInventarioTurno, ItemInventarioTurnoInput } from '../../domain/entities/InventarioTurno';

export const TurnoRepository = {

  // Obtener el turno actualmente abierto (solo puede haber uno)
  async getTurnoAbierto(): Promise<Turno | null> {
    const db = await getDatabase();
    return await db.getFirstAsync<Turno>(
      "SELECT * FROM turnos WHERE estado = 'abierto' LIMIT 1"
    );
  },

  // Obtener todos los turnos (para historial)
  async getAll(): Promise<Turno[]> {
    const db = await getDatabase();
    return await db.getAllAsync<Turno>(
      'SELECT * FROM turnos ORDER BY id DESC'
    );
  },

  // Obtener un turno por ID
  async getById(id: number): Promise<Turno | null> {
    const db = await getDatabase();
    return await db.getFirstAsync<Turno>(
      'SELECT * FROM turnos WHERE id = ?',
      [id]
    );
  },

  // Abrir un nuevo turno
  async abrir(input: TurnoInput): Promise<number> {
    const db = await getDatabase();
    const result = await db.runAsync(
      `INSERT INTO turnos (dias_duracion, estado, fecha_apertura)
       VALUES (?, 'abierto', datetime('now'))`,
      [input.dias_duracion]
    );
    return result.lastInsertRowId;
  },

  // Cerrar el turno activo
  async cerrar(id: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE turnos
       SET estado = 'cerrado', fecha_cierre = datetime('now')
       WHERE id = ?`,
      [id]
    );
  },

  // Actualizar días de duración (editable incluso con turno abierto)
  async actualizarDias(id: number, dias: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      'UPDATE turnos SET dias_duracion = ? WHERE id = ?',
      [dias, id]
    );
  },

  // ── Inventario del turno ──────────────────────────────────

  // Guardar snapshot de inventario (inicial o final)
  async guardarInventario(items: ItemInventarioTurnoInput[]): Promise<void> {
    const db = await getDatabase();
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

  // Obtener inventario de un turno por tipo
  async getInventario(
    turnoId: number,
    tipo: 'inicial' | 'final'
  ): Promise<ItemInventarioTurno[]> {
    const db = await getDatabase();
    return await db.getAllAsync<ItemInventarioTurno>(
      `SELECT * FROM inventario_turno
       WHERE turno_id = ? AND tipo = ?
       ORDER BY id ASC`,
      [turnoId, tipo]
    );
  },
};