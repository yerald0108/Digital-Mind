// src/data/repositories/TurnoRepository.ts
import { getDatabase } from '../database/db';
import { Turno, TurnoInput } from '../../domain/entities/Turno';
import { ItemInventarioTurno, ItemInventarioTurnoInput } from '../../domain/entities/InventarioTurno';
import { HistorialTurnoInput } from '../../domain/entities/HistorialTurno';

interface CierreTurnoInput {
  turnoId: number;
  historial: HistorialTurnoInput;
  inventarioFinal: ItemInventarioTurno[];
  preciosFinales: Array<{ productoId: number; precioVenta: number }>;
}

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

  async actualizarDias(id: number, dias: number): Promise<void> {
    const db = getDatabase();
    await db.runAsync(
      'UPDATE turnos SET dias_duracion = ? WHERE id = ?',
      [dias, id]
    );
  },

  /**
   * Consolida el cierre completo en una transacción exclusiva. Un fallo en
   * cualquier paso revierte el turno, historial, inventario y movimientos.
   */
  async cerrarConsolidado({
    turnoId,
    historial,
    inventarioFinal,
    preciosFinales,
  }: CierreTurnoInput): Promise<void> {
    const db = getDatabase();

    await db.withExclusiveTransactionAsync(async (txn) => {
      const turnoActual = await txn.getFirstAsync<Turno>(
        "SELECT * FROM turnos WHERE id = ? AND estado = 'abierto'",
        [turnoId]
      );
      if (!turnoActual) {
        throw new Error('El turno ya fue cerrado o no existe');
      }

      const historialExistente = await txn.getFirstAsync<{ id: number }>(
        'SELECT id FROM historial_turnos WHERE turno_id = ?',
        [turnoId]
      );
      if (historialExistente) {
        throw new Error('Ya existe un historial para este turno');
      }

      await txn.runAsync(
        `UPDATE turnos
         SET estado = 'cerrado', fecha_cierre = datetime('now')
         WHERE id = ?`,
        [turnoId]
      );

      await txn.runAsync(
        `INSERT INTO historial_turnos (
          turno_id, fecha_apertura, fecha_cierre, dias_duracion,
          total_ventas, total_transferencias, total_usd_cup, total_gastos,
          total_esperado, total_efectivo_real, total_real, diferencia,
          estado_cuadre, salario_mostrador, salario_salon, ganancia_neta,
          detalle_json
        ) VALUES (?, ?, datetime('now'), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          historial.turno_id,
          historial.fecha_apertura,
          historial.dias_duracion,
          historial.total_ventas,
          historial.total_transferencias,
          historial.total_usd_cup,
          historial.total_gastos,
          historial.total_esperado,
          historial.total_efectivo_real,
          historial.total_real,
          historial.diferencia,
          historial.estado_cuadre,
          historial.salario_mostrador,
          historial.salario_salon,
          historial.ganancia_neta,
          historial.detalle_json,
        ]
      );

      for (const item of inventarioFinal) {
        await txn.runAsync(
          "UPDATE productos SET cantidad = ?, actualizado_en = datetime('now') WHERE id = ?",
          [item.cantidad, item.producto_id]
        );
      }

      for (const precio of preciosFinales) {
        await txn.runAsync(
          "UPDATE productos SET precio_venta = ?, actualizado_en = datetime('now') WHERE id = ?",
          [precio.precioVenta, precio.productoId]
        );
      }

      await txn.runAsync('DELETE FROM entradas WHERE turno_id = ?', [turnoId]);
      await txn.runAsync('DELETE FROM salidas_familiares WHERE turno_id = ?', [turnoId]);
      await txn.runAsync('DELETE FROM cambios_precio WHERE turno_id = ?', [turnoId]);
      await txn.runAsync('DELETE FROM mermas WHERE turno_id = ?', [turnoId]);
      await txn.runAsync('DELETE FROM transferencias WHERE turno_id = ?', [turnoId]);
      await txn.runAsync('DELETE FROM gastos WHERE turno_id = ?', [turnoId]);
      await txn.runAsync('DELETE FROM caja_por_dia WHERE turno_id = ?', [turnoId]);
      await txn.runAsync('DELETE FROM registros_usd WHERE turno_id = ?', [turnoId]);
    });
  },

  async guardarInventario(items: ItemInventarioTurnoInput[]): Promise<void> {
    const db = getDatabase();
    // Todos los INSERTs en una sola transacción atómica.
    // Si falla cualquier ítem, SQLite revierte todo el lote.
    // También es significativamente más rápido que N transacciones individuales.
    await db.withTransactionAsync(async () => {
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
    });
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
