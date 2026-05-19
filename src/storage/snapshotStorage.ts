import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CollectionValueSnapshot } from '@/types';

const KEY = '@app:snapshots';

export async function loadSnapshots(): Promise<CollectionValueSnapshot[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CollectionValueSnapshot[];
  } catch {
    return [];
  }
}

export async function addSnapshot(
  s: CollectionValueSnapshot
): Promise<CollectionValueSnapshot[]> {
  const list = await loadSnapshots();
  list.push(s);
  // máximo 200 snapshots
  const trimmed = list.slice(-200);
  await AsyncStorage.setItem(KEY, JSON.stringify(trimmed));
  return trimmed;
}

export async function clearSnapshots(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
