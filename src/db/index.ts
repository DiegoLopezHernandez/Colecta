import * as SQLite from 'expo-sqlite';

/**
 * Capa de base de datos SQLite (expo-sqlite). Sustituye al AsyncStorage para las
 * colecciones de monedas, objetos y snapshots.
 *
 * Esquema (versión 1):
 *   coins        (id PK, updatedAt, json)
 *   objects      (id PK, updatedAt, json)
 *   snapshots    (date PK, json)
 *
 * Justificación de "una columna json por fila":
 *   - Editar UNA moneda actualiza UNA fila — no reescribimos toda la colección.
 *   - Mantiene la flexibilidad del tipado en TS sin acoplar el schema a cada
 *     campo. Los filtros/ordenación se siguen haciendo en memoria con el array
 *     ya cargado (rápido para colecciones de hasta varios miles).
 *   - El índice por `updatedAt` permite cargar los más recientes primero.
 *
 * Si en el futuro se necesita filtrar/ordenar en SQL (muy grandes coleccciones),
 * basta con añadir columnas indexadas + actualizar la versión de migración.
 */

const DB_NAME = 'numismatica.db';
const SCHEMA_VERSION = 1;

let _db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  _db = await SQLite.openDatabaseAsync(DB_NAME);
  await migrate(_db);
  return _db;
}

async function migrate(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS coins (
      id TEXT PRIMARY KEY,
      updatedAt TEXT NOT NULL,
      json TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_coins_updatedAt ON coins(updatedAt DESC);
    CREATE TABLE IF NOT EXISTS objects (
      id TEXT PRIMARY KEY,
      updatedAt TEXT NOT NULL,
      json TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_objects_updatedAt ON objects(updatedAt DESC);
    CREATE TABLE IF NOT EXISTS snapshots (
      date TEXT PRIMARY KEY,
      json TEXT NOT NULL
    );
  `);
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM meta WHERE key = ?',
    'schema_version'
  );
  if (!row) {
    await db.runAsync(
      'INSERT INTO meta (key, value) VALUES (?, ?)',
      'schema_version',
      String(SCHEMA_VERSION)
    );
  }
}

/**
 * Carga todas las filas de una tabla y deserializa el JSON. Si una fila está
 * corrupta, se omite (no se aborta toda la carga).
 */
export async function selectAllJson<T>(table: 'coins' | 'objects' | 'snapshots'): Promise<T[]> {
  const db = await getDb();
  const order = table === 'snapshots' ? 'date ASC' : 'updatedAt DESC';
  const rows = await db.getAllAsync<{ json: string }>(
    `SELECT json FROM ${table} ORDER BY ${order}`
  );
  const out: T[] = [];
  for (const r of rows) {
    try {
      out.push(JSON.parse(r.json) as T);
    } catch {
      // fila corrupta, ignorar
    }
  }
  return out;
}

/**
 * Upsert por id. Acepta `id` o `date` como clave primaria.
 */
export async function upsertJson(
  table: 'coins' | 'objects',
  item: { id: string; updatedAt: string }
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO ${table} (id, updatedAt, json) VALUES (?, ?, ?)`,
    item.id,
    item.updatedAt,
    JSON.stringify(item)
  );
}

export async function upsertSnapshot(s: { date: string }): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT OR REPLACE INTO snapshots (date, json) VALUES (?, ?)',
    s.date,
    JSON.stringify(s)
  );
}

export async function deleteById(
  table: 'coins' | 'objects',
  id: string
): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM ${table} WHERE id = ?`, id);
}

export async function clearTable(
  table: 'coins' | 'objects' | 'snapshots'
): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM ${table}`);
}

/**
 * Reemplaza todas las filas de una tabla en una transacción.
 * Usado por importación de backup.
 */
export async function replaceAllJson(
  table: 'coins' | 'objects',
  items: Array<{ id: string; updatedAt: string }>
): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync(`DELETE FROM ${table}`);
    for (const it of items) {
      await db.runAsync(
        `INSERT INTO ${table} (id, updatedAt, json) VALUES (?, ?, ?)`,
        it.id,
        it.updatedAt,
        JSON.stringify(it)
      );
    }
  });
}

export async function replaceAllSnapshots(
  items: Array<{ date: string }>
): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM snapshots');
    for (const it of items) {
      await db.runAsync(
        'INSERT INTO snapshots (date, json) VALUES (?, ?)',
        it.date,
        JSON.stringify(it)
      );
    }
  });
}
