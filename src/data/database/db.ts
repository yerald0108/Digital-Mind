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

  // Crear tablas base
  db.execSync(CREATE_TABLES);

  // Migración: añadir columna cantidad a productos si no existe
  try {
    db.execSync('ALTER TABLE productos ADD COLUMN cantidad REAL NOT NULL DEFAULT 0;');
    console.log('[DB] Migración: columna cantidad añadida a productos');
  } catch {
    // La columna ya existe — ignorar
  }

  // Migración: tabla historial_turnos
  try {
    db.execSync(`
      CREATE TABLE IF NOT EXISTS historial_turnos (
        id                    INTEGER PRIMARY KEY AUTOINCREMENT,
        turno_id              INTEGER NOT NULL,
        fecha_apertura        TEXT    NOT NULL,
        fecha_cierre          TEXT    NOT NULL,
        dias_duracion         INTEGER NOT NULL,
        total_ventas          REAL    NOT NULL DEFAULT 0,
        total_transferencias  REAL    NOT NULL DEFAULT 0,
        total_usd_cup         REAL    NOT NULL DEFAULT 0,
        total_gastos          REAL    NOT NULL DEFAULT 0,
        total_esperado        REAL    NOT NULL DEFAULT 0,
        total_efectivo_real   REAL    NOT NULL DEFAULT 0,
        total_real            REAL    NOT NULL DEFAULT 0,
        diferencia            REAL    NOT NULL DEFAULT 0,
        estado_cuadre         TEXT    NOT NULL DEFAULT 'sin_cuadre',
        salario_mostrador     REAL    NOT NULL DEFAULT 0,
        salario_salon         REAL    NOT NULL DEFAULT 0,
        ganancia_neta         REAL    NOT NULL DEFAULT 0,
        detalle_json          TEXT,
        creado_en             TEXT    NOT NULL DEFAULT (datetime('now'))
      );
    `);
    console.log('[DB] Migración: tabla historial_turnos creada');
  } catch {
    // Ya existe — ignorar
  }

  console.log(`[DB] Inicializada — schema v${SCHEMA_VERSION}`);
  return db;
}

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  return initDatabase();
}

export function initDatabaseSync(): void {
  initDatabase();
}