import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppConfig } from '@/types';
import { buildDefaultConfig } from '@/utils/defaults';

const KEY = '@app:config';

export async function loadConfig(): Promise<AppConfig> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) {
      const fresh = buildDefaultConfig();
      await AsyncStorage.setItem(KEY, JSON.stringify(fresh));
      return fresh;
    }
    const parsed = JSON.parse(raw) as Partial<AppConfig>;
    // Merge con defaults para cubrir nuevas claves añadidas en versiones futuras
    const def = buildDefaultConfig();
    return { ...def, ...parsed } as AppConfig;
  } catch (e) {
    console.warn('[configStorage] loadConfig fallback', e);
    return buildDefaultConfig();
  }
}

export async function saveConfig(config: AppConfig): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(config));
}

export async function resetConfig(): Promise<AppConfig> {
  const fresh = buildDefaultConfig();
  await AsyncStorage.setItem(KEY, JSON.stringify(fresh));
  return fresh;
}
