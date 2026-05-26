import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CoinItem, ObjectItem, CollectionValueSnapshot } from '@/types';
import { replaceAllJson, replaceAllSnapshots, getDb } from './index';

/**
 * Migración one-shot desde AsyncStorage a SQLite. Se ejecuta al arrancar la app.
 * Si ya se hizo, no hace nada. Tras migrar exitosamente, se limpia AsyncStorage
 * y se marca el flag en la tabla `meta`.
 *
 * No es destructiva: si SQLite ya tiene datos, no toca nada.
 */
const MIGRATION_FLAG = 'as_storage_migrated_v1';

const KEYS = {
  coins: '@app:coins',
  objects: '@app:objects',
  snapshots: '@app:snapshots',
} as const;

async function alreadyMigrated(): Promise<boolean> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM meta WHERE key = ?',
    MIGRATION_FLAG
  );
  return !!row;
}

async function markMigrated(): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)',
    MIGRATION_FLAG,
    String(Date.now())
  );
}

export async function migrateFromAsyncStorageIfNeeded(): Promise<{
  ranMigration: boolean;
  coins: number;
  objects: number;
  snapshots: number;
}> {
  const stats = { ranMigration: false, coins: 0, objects: 0, snapshots: 0 };
  if (await alreadyMigrated()) return stats;

  try {
    const [coinsRaw, objectsRaw, snapsRaw] = await Promise.all([
      AsyncStorage.getItem(KEYS.coins),
      AsyncStorage.getItem(KEYS.objects),
      AsyncStorage.getItem(KEYS.snapshots),
    ]);

    const coins: CoinItem[] = coinsRaw ? JSON.parse(coinsRaw) : [];
    const objects: ObjectItem[] = objectsRaw ? JSON.parse(objectsRaw) : [];
    const snaps: CollectionValueSnapshot[] = snapsRaw ? JSON.parse(snapsRaw) : [];

    if (coins.length > 0) await replaceAllJson('coins', coins);
    if (objects.length > 0) await replaceAllJson('objects', objects);
    if (snaps.length > 0) await replaceAllSnapshots(snaps);

    stats.ranMigration = true;
    stats.coins = coins.length;
    stats.objects = objects.length;
    stats.snapshots = snaps.length;

    await markMigrated();

    // Limpiar AsyncStorage tras migrar para no dejar datos duplicados.
    if (coinsRaw) await AsyncStorage.removeItem(KEYS.coins);
    if (objectsRaw) await AsyncStorage.removeItem(KEYS.objects);
    if (snapsRaw) await AsyncStorage.removeItem(KEYS.snapshots);
  } catch (e) {
    console.warn('[db/migration] Migración AsyncStorage → SQLite fallida', e);
  }

  return stats;
}
