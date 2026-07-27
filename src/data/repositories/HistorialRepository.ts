// src/data/repositories/HistorialRepository.ts
import { getDatabase } from '../database/db';
import { HistorialTurno, HistorialTurnoInput } from '../../domain/entities/HistorialTurno';

export const HistorialRepository = {

  async guardar(input: HistorialTurnoInput): Promise<number> {
    const db = await getDatabase();
    const result = await db.runAsync(
      `INSERT INTO historial_turnos (
        turno_id, fecha_apertura, fecha_cierre, dias_duracion,
        total_ventas, total_transferencias, total_usd_cup, total_gastos,
        total_esperado, total_efectivo_real, total_real, diferencia,
        estado_cuadre, salario_mostrador, salario_salon, ganancia_neta,
        detalle_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.turno_id,
        input.fecha_apertura,
        input.fecha_cierre,
        input.dias_duracion,
        input.total_ventas,
        input.total_transferencias,
        input.total_usd_cup,
        input.total_gastos,
        input.total_esperado,
        input.total_efectivo_real,
        input.total_real,
        input.diferencia,
        input.estado_cuadre,
        input.salario_mostrador,
        input.salario_salon,
        input.ganancia_neta,
        input.detalle_json,
      ]
    );
    return result.lastInsertRowId;
  },

  async getAll(): Promise<HistorialTurno[]> {
    const db = await getDatabase();
    return await db.getAllAsync<HistorialTurno>(
      'SELECT * FROM historial_turnos ORDER BY creado_en DESC'
    );
  },

  async getById(id: number): Promise<HistorialTurno | null> {
    const db = await getDatabase();
    return await db.getFirstAsync<HistorialTurno>(
      'SELECT * FROM historial_turnos WHERE id = ?',
      [id]
    );
  },

  async eliminar(id: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM historial_turnos WHERE id = ?', [id]);
  },

  // Verificar si un turno ya tiene historial guardado
  async existeParaTurno(turnoId: number): Promise<boolean> {
    const db = await getDatabase();
    const result = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM historial_turnos WHERE turno_id = ?',
      [turnoId]
    );
    return (result?.count ?? 0) > 0;
  },

  // Eliminar todos los movimientos de un turno
  async eliminarTodosDelTurno(turnoId: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM entradas WHERE turno_id = ?', [turnoId]);
    await db.runAsync('DELETE FROM salidas_familiares WHERE turno_id = ?', [turnoId]);
    await db.runAsync('DELETE FROM cambios_precio WHERE turno_id = ?', [turnoId]);
    await db.runAsync('DELETE FROM mermas WHERE turno_id = ?', [turnoId]);
    await db.runAsync('DELETE FROM transferencias WHERE turno_id = ?', [turnoId]);
    await db.runAsync('DELETE FROM gastos WHERE turno_id = ?', [turnoId]);
    await db.runAsync('DELETE FROM caja_por_dia WHERE turno_id = ?', [turnoId]);
    await db.runAsync('DELETE FROM registros_usd WHERE turno_id = ?', [turnoId]);
    await db.runAsync('DELETE FROM inventario_turno WHERE turno_id = ?', [turnoId]);
  },
};