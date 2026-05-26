import type { ObjectItem } from '@/types';
import {
  selectAllJson,
  upsertJson,
  deleteById,
  clearTable,
  replaceAllJson,
} from '@/db';

/**
 * Storage de objetos respaldado por SQLite. Mismas firmas que la versión
 * anterior (AsyncStorage). Ver `coinStorage.ts` para más detalle.
 */

export async function loadObjects(): Promise<ObjectItem[]> {
  try {
    return await selectAllJson<ObjectItem>('objects');
  } catch (e) {
    console.warn('[objectStorage] loadObjects error', e);
    return [];
  }
}

export async function saveObjects(items: ObjectItem[]): Promise<void> {
  await replaceAllJson('objects', items);
}

export async function upsertObject(item: ObjectItem): Promise<ObjectItem[]> {
  await upsertJson('objects', item);
  return await loadObjects();
}

export async function deleteObject(id: string): Promise<ObjectItem[]> {
  await deleteById('objects', id);
  return await loadObjects();
}

export async function clearObjects(): Promise<void> {
  await clearTable('objects');
}
