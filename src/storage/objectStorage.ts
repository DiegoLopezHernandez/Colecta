import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ObjectItem } from '@/types';

const KEY = '@app:objects';

export async function loadObjects(): Promise<ObjectItem[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ObjectItem[];
  } catch (e) {
    console.warn('[objectStorage] loadObjects error', e);
    return [];
  }
}

export async function saveObjects(items: ObjectItem[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(items));
}

export async function upsertObject(item: ObjectItem): Promise<ObjectItem[]> {
  const list = await loadObjects();
  const idx = list.findIndex((x) => x.id === item.id);
  if (idx >= 0) list[idx] = item;
  else list.unshift(item);
  await saveObjects(list);
  return list;
}

export async function deleteObject(id: string): Promise<ObjectItem[]> {
  const list = (await loadObjects()).filter((x) => x.id !== id);
  await saveObjects(list);
  return list;
}

export async function clearObjects(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
