// src/data/database/db.ts
import * as SQLite from 'expo-sqlite';
import { CREATE_TABLES, SCHEMA_VERSION } from './schema';

const DB_NAME = 'digitalmind.db';
let db: SQLite.SQLiteDatabase | null = null;

function initDatabase(): SQLite.SQLiteDatabase {
  if (db) return db;

  db = SQLite.openDatabaseSync(DB_NAME);
  db.execSync('PRAGMA journal_mode = WAL;');
  db.execSync('PRAGMA foreign_keys = ON;');

  // Crear tablas base (incluye historial_turnos)
  db.execSync(CREATE_TABLES);

  // Migración v1: añadir columna cantidad a productos si no existe
  try {
    db.execSync('ALTER TABLE productos ADD COLUMN cantidad REAL NOT NULL DEFAULT 0;');
    console.log('[DB] Migración v1: columna cantidad añadida a productos');
  } catch {
    // La columna ya existe — ignorar
  }

  // Migración v2: nueva estructura de gastos (concepto + monto directo)
  // Se añaden las columnas nuevas y se mantienen las antiguas por compatibilidad
  // con registros históricos que puedan existir (diferencia se conserva como monto).
  try {
    db.execSync('ALTER TABLE gastos ADD COLUMN concepto TEXT;');
    console.log('[DB] Migración v2: columna concepto añadida a gastos');
  } catch {
    // Ya existe — ignorar
  }
  try {
    db.execSync('ALTER TABLE gastos ADD COLUMN monto REAL NOT NULL DEFAULT 0;');
    console.log('[DB] Migración v2: columna monto añadida a gastos');
  } catch {
    // Ya existe — ignorar
  }
  // Rellenar concepto con producto_nombre en registros viejos y monto con diferencia
  try {
    db.execSync(`
      UPDATE gastos
      SET concepto = COALESCE(concepto, producto_nombre, 'Gasto'),
          monto    = CASE WHEN monto = 0 THEN diferencia ELSE monto END
      WHERE concepto IS NULL OR monto = 0;
    `);
  } catch {
    // Sin datos viejos o columnas antiguas no disponibles — ignorar
  }

  // Migración v3: índices para acelerar las queries del cuadre.
  // CREATE INDEX IF NOT EXISTS es idempotente — seguro ejecutar siempre.
  // Con 60+ productos y múltiples movimientos por turno, estos índices
  // reducen significativamente el tiempo de cargarDatos en useCuadre.
  try {
    db.execSync(`
      CREATE INDEX IF NOT EXISTS idx_inventario_turno_turno_tipo
        ON inventario_turno(turno_id, tipo);

      CREATE INDEX IF NOT EXISTS idx_entradas_turno
        ON entradas(turno_id);

      CREATE INDEX IF NOT EXISTS idx_salidas_familiares_turno
        ON salidas_familiares(turno_id);

      CREATE INDEX IF NOT EXISTS idx_cambios_precio_turno
        ON cambios_precio(turno_id);

      CREATE INDEX IF NOT EXISTS idx_mermas_turno
        ON mermas(turno_id);

      CREATE INDEX IF NOT EXISTS idx_transferencias_turno
        ON transferencias(turno_id);

      CREATE INDEX IF NOT EXISTS idx_gastos_turno
        ON gastos(turno_id);

      CREATE INDEX IF NOT EXISTS idx_caja_por_dia_turno
        ON caja_por_dia(turno_id);

      CREATE INDEX IF NOT EXISTS idx_registros_usd_turno
        ON registros_usd(turno_id);

      CREATE INDEX IF NOT EXISTS idx_productos_orden
        ON productos(orden ASC);
    `);
    console.log('[DB] Migración v3: índices creados');
  } catch (e) {
    console.warn('[DB] Migración v3: advertencia al crear índices:', e);
  }

  console.log(`[DB] Inicializada — schema v${SCHEMA_VERSION}`);
  return db;
}

export function getDatabase(): SQLite.SQLiteDatabase {
  return initDatabase();
}

export function initDatabaseSync(): void {
  initDatabase();
}