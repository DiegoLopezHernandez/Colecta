import type { CollectionValueSnapshot } from '@/types';
import {
  selectAllJson,
  upsertSnapshot,
  clearTable,
  replaceAllSnapshots,
} from '@/db';

const MAX_SNAPSHOTS = 200;

export async function loadSnapshots(): Promise<CollectionValueSnapshot[]> {
  try {
    return await selectAllJson<CollectionValueSnapshot>('snapshots');
  } catch {
    return [];
  }
}

/**
 * Añade un snapshot y poda los más antiguos si se supera el máximo.
 */
export async function addSnapshot(
  s: CollectionValueSnapshot
): Promise<CollectionValueSnapshot[]> {
  await upsertSnapshot(s);
  const all = await loadSnapshots();
  if (all.length > MAX_SNAPSHOTS) {
    const trimmed = all.slice(-MAX_SNAPSHOTS);
    await replaceAllSnapshots(trimmed);
    return trimmed;
  }
  return all;
}

export async function clearSnapshots(): Promise<void> {
  await clearTable('snapshots');
}
