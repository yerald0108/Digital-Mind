// src/data/database/schema.ts
export const CREATE_TABLES = `

  CREATE TABLE IF NOT EXISTS productos (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre           TEXT    NOT NULL,
    precio_costo     REAL    NOT NULL DEFAULT 0,
    precio_venta     REAL    NOT NULL DEFAULT 0,
    cantidad         REAL    NOT NULL DEFAULT 0,
    orden            INTEGER NOT NULL DEFAULT 0,
    creado_en        TEXT    NOT NULL DEFAULT (datetime('now')),
    actualizado_en   TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS turnos (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    dias_duracion    INTEGER NOT NULL DEFAULT 1,
    estado           TEXT    NOT NULL DEFAULT 'abierto'
                             CHECK(estado IN ('abierto','cerrado')),
    fecha_apertura   TEXT    NOT NULL DEFAULT (datetime('now')),
    fecha_cierre     TEXT,
    creado_en        TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS inventario_turno (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    turno_id         INTEGER NOT NULL REFERENCES turnos(id),
    producto_id      INTEGER NOT NULL REFERENCES productos(id),
    producto_nombre  TEXT    NOT NULL,
    precio_costo     REAL    NOT NULL,
    precio_venta     REAL    NOT NULL,
    cantidad         REAL    NOT NULL DEFAULT 0,
    tipo             TEXT    NOT NULL CHECK(tipo IN ('inicial','final')),
    fecha            TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS entradas (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    turno_id         INTEGER NOT NULL REFERENCES turnos(id),
    producto_id      INTEGER NOT NULL REFERENCES productos(id),
    producto_nombre  TEXT    NOT NULL,
    cantidad         REAL    NOT NULL,
    precio_costo     REAL    NOT NULL,
    fecha            TEXT    NOT NULL DEFAULT (datetime('now')),
    notas            TEXT
  );

  CREATE TABLE IF NOT EXISTS salidas_familiares (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    turno_id         INTEGER NOT NULL REFERENCES turnos(id),
    producto_id      INTEGER NOT NULL REFERENCES productos(id),
    producto_nombre  TEXT    NOT NULL,
    cantidad         REAL    NOT NULL,
    quien_sustrajo   TEXT    NOT NULL,
    fecha            TEXT    NOT NULL DEFAULT (datetime('now')),
    notas            TEXT
  );

  CREATE TABLE IF NOT EXISTS cambios_precio (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    turno_id         INTEGER NOT NULL REFERENCES turnos(id),
    producto_id      INTEGER NOT NULL REFERENCES productos(id),
    producto_nombre  TEXT    NOT NULL,
    precio_anterior  REAL    NOT NULL,
    precio_nuevo     REAL    NOT NULL,
    cantidad_existente REAL  NOT NULL,
    fecha            TEXT    NOT NULL DEFAULT (datetime('now')),
    notas            TEXT
  );

  CREATE TABLE IF NOT EXISTS mermas (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    turno_id         INTEGER NOT NULL REFERENCES turnos(id),
    producto_id      INTEGER NOT NULL REFERENCES productos(id),
    producto_nombre  TEXT    NOT NULL,
    cantidad         REAL    NOT NULL,
    tipo             TEXT    NOT NULL DEFAULT 'otro'
                             CHECK(tipo IN ('roto','vencido','otro')),
    fecha            TEXT    NOT NULL DEFAULT (datetime('now')),
    notas            TEXT
  );

  CREATE TABLE IF NOT EXISTS transferencias (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    turno_id         INTEGER NOT NULL REFERENCES turnos(id),
    monto            REAL    NOT NULL,
    concepto         TEXT,
    fecha            TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS gastos (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    turno_id         INTEGER NOT NULL REFERENCES turnos(id),
    producto_id      INTEGER,
    producto_nombre  TEXT    NOT NULL,
    precio_venta     REAL    NOT NULL,
    precio_cobrado   REAL    NOT NULL,
    diferencia       REAL    NOT NULL,
    cantidad         REAL    NOT NULL DEFAULT 1,
    fecha            TEXT    NOT NULL DEFAULT (datetime('now')),
    notas            TEXT
  );

  CREATE TABLE IF NOT EXISTS caja_por_dia (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    turno_id         INTEGER NOT NULL REFERENCES turnos(id),
    dia_numero       INTEGER NOT NULL,
    monto_efectivo   REAL    NOT NULL DEFAULT 0,
    fecha            TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS registros_usd (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    turno_id         INTEGER NOT NULL REFERENCES turnos(id),
    cantidad_usd     REAL    NOT NULL,
    tasa_cambio      REAL    NOT NULL,
    equivalente_cup  REAL    NOT NULL,
    fecha            TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  -- Historial de turnos cerrados (resumen guardado)
  CREATE TABLE IF NOT EXISTS historial_turnos (
    id                    INTEGER PRIMARY KEY AUTOINCREMENT,
    turno_id              INTEGER NOT NULL,
    fecha_apertura        TEXT    NOT NULL,
    fecha_cierre          TEXT    NOT NULL,
    dias_duracion         INTEGER NOT NULL,
    -- Totales del cuadre
    total_ventas          REAL    NOT NULL DEFAULT 0,
    total_transferencias  REAL    NOT NULL DEFAULT 0,
    total_usd_cup         REAL    NOT NULL DEFAULT 0,
    total_gastos          REAL    NOT NULL DEFAULT 0,
    total_esperado        REAL    NOT NULL DEFAULT 0,
    total_efectivo_real   REAL    NOT NULL DEFAULT 0,
    total_real            REAL    NOT NULL DEFAULT 0,
    diferencia            REAL    NOT NULL DEFAULT 0,
    estado_cuadre         TEXT    NOT NULL DEFAULT 'sin_cuadre',
    -- Salarios y ganancias
    salario_mostrador     REAL    NOT NULL DEFAULT 0,
    salario_salon         REAL    NOT NULL DEFAULT 0,
    ganancia_neta         REAL    NOT NULL DEFAULT 0,
    -- JSON con el detalle completo del cuadre
    detalle_json          TEXT,
    creado_en             TEXT    NOT NULL DEFAULT (datetime('now'))
  );
`;

export const SCHEMA_VERSION = 3;