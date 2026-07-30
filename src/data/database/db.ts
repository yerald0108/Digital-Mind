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

  console.log(`[DB] Inicializada — schema v${SCHEMA_VERSION}`);
  return db;
}

export function getDatabase(): SQLite.SQLiteDatabase {
  return initDatabase();
}

export function initDatabaseSync(): void {
  initDatabase();
}