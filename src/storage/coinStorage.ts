import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CoinItem } from '@/types';

const KEY = '@app:coins';

export async function loadCoins(): Promise<CoinItem[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CoinItem[];
  } catch (e) {
    console.warn('[coinStorage] loadCoins error', e);
    return [];
  }
}

export async function saveCoins(items: CoinItem[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(items));
}

export async function upsertCoin(item: CoinItem): Promise<CoinItem[]> {
  const list = await loadCoins();
  const idx = list.findIndex((x) => x.id === item.id);
  if (idx >= 0) list[idx] = item;
  else list.unshift(item);
  await saveCoins(list);
  return list;
}

export async function deleteCoin(id: string): Promise<CoinItem[]> {
  const list = (await loadCoins()).filter((x) => x.id !== id);
  await saveCoins(list);
  return list;
}

export async function clearCoins(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
