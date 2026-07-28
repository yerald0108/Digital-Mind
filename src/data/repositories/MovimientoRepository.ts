// src/data/repositories/MovimientoRepository.ts
// ============================================================
// Repositorio unificado para todos los movimientos del turno:
// entradas, salidas familiares, cambios de precio, mermas,
// transferencias, gastos, caja por día y registros USD.
// ============================================================
import { getDatabase } from '../database/db';
import { Entrada, EntradaInput } from '../../domain/entities/Entrada';
import { SalidaFamiliar, SalidaFamiliarInput } from '../../domain/entities/SalidaFamiliar';
import { CambioPrecio, CambioPrecioInput } from '../../domain/entities/CambioPrecio';
import { Merma, MermaInput } from '../../domain/entities/Merma';
import { Transferencia, TransferenciaInput } from '../../domain/entities/Transferencia';
import { Gasto, GastoInput } from '../../domain/entities/Gasto';
import { CajaDia, CajaDiaInput } from '../../domain/entities/CajaDia';
import { RegistroUSD, RegistroUSDInput } from '../../domain/entities/RegistroUSD';

export const MovimientoRepository = {

  // ── ENTRADAS ─────────────────────────────────────────────

  /**
   * Crea una nueva entrada de producto.
   * Siempre inserta un registro independiente para mantener
   * la trazabilidad completa de cada carga.
   * La suma de cantidades por producto se calcula en calcularCuadre.ts.
   */
  async crearEntrada(input: EntradaInput): Promise<number> {
    const db = getDatabase();

    const result = await db.runAsync(
      `INSERT INTO entradas
       (turno_id, producto_id, producto_nombre, cantidad, precio_costo, notas)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [input.turno_id, input.producto_id, input.producto_nombre,
       input.cantidad, input.precio_costo, input.notas ?? null]
    );
    return result.lastInsertRowId;
  },

  async getEntradas(turnoId: number): Promise<Entrada[]> {
    const db = getDatabase();
    return await db.getAllAsync<Entrada>(
      'SELECT * FROM entradas WHERE turno_id = ? ORDER BY fecha ASC',
      [turnoId]
    );
  },

  async eliminarEntrada(id: number): Promise<void> {
    const db = getDatabase();
    await db.runAsync('DELETE FROM entradas WHERE id = ?', [id]);
  },

  // ── SALIDAS FAMILIARES ────────────────────────────────────

  async crearSalidaFamiliar(input: SalidaFamiliarInput): Promise<number> {
    const db = getDatabase();
    const result = await db.runAsync(
      `INSERT INTO salidas_familiares
       (turno_id, producto_id, producto_nombre, cantidad, quien_sustrajo, notas)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [input.turno_id, input.producto_id, input.producto_nombre,
       input.cantidad, input.quien_sustrajo, input.notas ?? null]
    );
    return result.lastInsertRowId;
  },

  async getSalidasFamiliares(turnoId: number): Promise<SalidaFamiliar[]> {
    const db = getDatabase();
    return await db.getAllAsync<SalidaFamiliar>(
      'SELECT * FROM salidas_familiares WHERE turno_id = ? ORDER BY fecha ASC',
      [turnoId]
    );
  },

  async eliminarSalidaFamiliar(id: number): Promise<void> {
    const db = getDatabase();
    await db.runAsync('DELETE FROM salidas_familiares WHERE id = ?', [id]);
  },

  // ── CAMBIOS DE PRECIO ─────────────────────────────────────

  async crearCambioPrecio(input: CambioPrecioInput): Promise<number> {
    const db = getDatabase();
    const result = await db.runAsync(
      `INSERT INTO cambios_precio
       (turno_id, producto_id, producto_nombre, precio_anterior,
        precio_nuevo, cantidad_existente, notas)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [input.turno_id, input.producto_id, input.producto_nombre,
       input.precio_anterior, input.precio_nuevo,
       input.cantidad_existente, input.notas ?? null]
    );
    return result.lastInsertRowId;
  },

  async getCambiosPrecio(turnoId: number): Promise<CambioPrecio[]> {
    const db = getDatabase();
    return await db.getAllAsync<CambioPrecio>(
      'SELECT * FROM cambios_precio WHERE turno_id = ? ORDER BY fecha ASC',
      [turnoId]
    );
  },

  async eliminarCambioPrecio(id: number): Promise<void> {
    const db = getDatabase();
    await db.runAsync('DELETE FROM cambios_precio WHERE id = ?', [id]);
  },

  // ── MERMAS ───────────────────────────────────────────────

  async crearMerma(input: MermaInput): Promise<number> {
    const db = getDatabase();
    const result = await db.runAsync(
      `INSERT INTO mermas
       (turno_id, producto_id, producto_nombre, cantidad, tipo, notas)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [input.turno_id, input.producto_id, input.producto_nombre,
       input.cantidad, input.tipo, input.notas ?? null]
    );
    return result.lastInsertRowId;
  },

  async getMermas(turnoId: number): Promise<Merma[]> {
    const db = getDatabase();
    return await db.getAllAsync<Merma>(
      'SELECT * FROM mermas WHERE turno_id = ? ORDER BY fecha ASC',
      [turnoId]
    );
  },

  async eliminarMerma(id: number): Promise<void> {
    const db = getDatabase();
    await db.runAsync('DELETE FROM mermas WHERE id = ?', [id]);
  },

  // ── TRANSFERENCIAS ────────────────────────────────────────

  async crearTransferencia(input: TransferenciaInput): Promise<number> {
    const db = getDatabase();
    const result = await db.runAsync(
      `INSERT INTO transferencias (turno_id, monto, concepto)
       VALUES (?, ?, ?)`,
      [input.turno_id, input.monto, input.concepto ?? null]
    );
    return result.lastInsertRowId;
  },

  async getTransferencias(turnoId: number): Promise<Transferencia[]> {
    const db = getDatabase();
    return await db.getAllAsync<Transferencia>(
      'SELECT * FROM transferencias WHERE turno_id = ? ORDER BY fecha ASC',
      [turnoId]
    );
  },

  async eliminarTransferencia(id: number): Promise<void> {
    const db = getDatabase();
    await db.runAsync('DELETE FROM transferencias WHERE id = ?', [id]);
  },

  // ── GASTOS ───────────────────────────────────────────────

  async crearGasto(input: GastoInput): Promise<number> {
    const db = getDatabase();
    const diferencia = (input.precio_venta - input.precio_cobrado) * input.cantidad;
    const result = await db.runAsync(
      `INSERT INTO gastos
       (turno_id, producto_id, producto_nombre, precio_venta,
        precio_cobrado, diferencia, cantidad, notas)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [input.turno_id, input.producto_id ?? null, input.producto_nombre,
       input.precio_venta, input.precio_cobrado, diferencia,
       input.cantidad, input.notas ?? null]
    );
    return result.lastInsertRowId;
  },

  async getGastos(turnoId: number): Promise<Gasto[]> {
    const db = getDatabase();
    return await db.getAllAsync<Gasto>(
      'SELECT * FROM gastos WHERE turno_id = ? ORDER BY fecha ASC',
      [turnoId]
    );
  },

  async eliminarGasto(id: number): Promise<void> {
    const db = getDatabase();
    await db.runAsync('DELETE FROM gastos WHERE id = ?', [id]);
  },

  // ── CAJA POR DÍA ─────────────────────────────────────────

  async guardarCajaDia(input: CajaDiaInput): Promise<number> {
    const db = getDatabase();
    // Si ya existe para ese día, actualizar; si no, insertar
    const existing = await db.getFirstAsync<CajaDia>(
      'SELECT * FROM caja_por_dia WHERE turno_id = ? AND dia_numero = ?',
      [input.turno_id, input.dia_numero]
    );

    if (existing) {
      await db.runAsync(
        'UPDATE caja_por_dia SET monto_efectivo = ? WHERE id = ?',
        [input.monto_efectivo, existing.id]
      );
      return existing.id;
    }

    const result = await db.runAsync(
      `INSERT INTO caja_por_dia (turno_id, dia_numero, monto_efectivo)
       VALUES (?, ?, ?)`,
      [input.turno_id, input.dia_numero, input.monto_efectivo]
    );
    return result.lastInsertRowId;
  },

  async getCajaPorDia(turnoId: number): Promise<CajaDia[]> {
    const db = getDatabase();
    return await db.getAllAsync<CajaDia>(
      'SELECT * FROM caja_por_dia WHERE turno_id = ? ORDER BY dia_numero ASC',
      [turnoId]
    );
  },

  // ── REGISTROS USD ─────────────────────────────────────────

  async crearRegistroUSD(input: RegistroUSDInput): Promise<number> {
    const db = getDatabase();
    const equivalente_cup = input.cantidad_usd * input.tasa_cambio;
    const result = await db.runAsync(
      `INSERT INTO registros_usd
       (turno_id, cantidad_usd, tasa_cambio, equivalente_cup)
       VALUES (?, ?, ?, ?)`,
      [input.turno_id, input.cantidad_usd, input.tasa_cambio, equivalente_cup]
    );
    return result.lastInsertRowId;
  },

  async getRegistrosUSD(turnoId: number): Promise<RegistroUSD[]> {
    const db = getDatabase();
    return await db.getAllAsync<RegistroUSD>(
      'SELECT * FROM registros_usd WHERE turno_id = ? ORDER BY fecha ASC',
      [turnoId]
    );
  },

  async eliminarRegistroUSD(id: number): Promise<void> {
    const db = getDatabase();
    await db.runAsync('DELETE FROM registros_usd WHERE id = ?', [id]);
  },

  // ── ACTUALIZAR ────────────────────────────────────────────

  async actualizarEntrada(id: number, cantidad: number, notas: string | null): Promise<void> {
    const db = getDatabase();
    await db.runAsync(
      "UPDATE entradas SET cantidad = ?, notas = ?, fecha = datetime('now') WHERE id = ?",
      [cantidad, notas, id]
    );
  },

  async actualizarSalidaFamiliar(
    id: number,
    cantidad: number,
    quien_sustrajo: string,
    notas: string | null
  ): Promise<void> {
    const db = getDatabase();
    await db.runAsync(
      "UPDATE salidas_familiares SET cantidad = ?, quien_sustrajo = ?, notas = ? WHERE id = ?",
      [cantidad, quien_sustrajo, notas, id]
    );
  },

  async actualizarCambioPrecio(
    id: number,
    precio_nuevo: number,
    cantidad_existente: number,
    notas: string | null
  ): Promise<void> {
    const db = getDatabase();
    await db.runAsync(
      "UPDATE cambios_precio SET precio_nuevo = ?, cantidad_existente = ?, notas = ? WHERE id = ?",
      [precio_nuevo, cantidad_existente, notas, id]
    );
  },

  async actualizarMerma(
    id: number,
    cantidad: number,
    tipo: string,
    notas: string | null
  ): Promise<void> {
    const db = getDatabase();
    await db.runAsync(
      "UPDATE mermas SET cantidad = ?, tipo = ?, notas = ? WHERE id = ?",
      [cantidad, tipo, notas, id]
    );
  },

  // ── LIMPIEZA DE TURNO ─────────────────────────────────────
  // Elimina todos los movimientos de un turno.
  // NO elimina inventario_turno: los snapshots inicial/final
  // se conservan para auditoría y posibles recálculos futuros.

  async eliminarMovimientosDelTurno(turnoId: number): Promise<void> {
    const db = getDatabase();
    await db.runAsync('DELETE FROM entradas WHERE turno_id = ?', [turnoId]);
    await db.runAsync('DELETE FROM salidas_familiares WHERE turno_id = ?', [turnoId]);
    await db.runAsync('DELETE FROM cambios_precio WHERE turno_id = ?', [turnoId]);
    await db.runAsync('DELETE FROM mermas WHERE turno_id = ?', [turnoId]);
    await db.runAsync('DELETE FROM transferencias WHERE turno_id = ?', [turnoId]);
    await db.runAsync('DELETE FROM gastos WHERE turno_id = ?', [turnoId]);
    await db.runAsync('DELETE FROM caja_por_dia WHERE turno_id = ?', [turnoId]);
    await db.runAsync('DELETE FROM registros_usd WHERE turno_id = ?', [turnoId]);
  },
};