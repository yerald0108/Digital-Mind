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

  // Migración: añadir columna cantidad a productos si no existe
  try {
    db.execSync('ALTER TABLE productos ADD COLUMN cantidad REAL NOT NULL DEFAULT 0;');
    console.log('[DB] Migración: columna cantidad añadida a productos');
  } catch {
    // La columna ya existe — ignorar
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