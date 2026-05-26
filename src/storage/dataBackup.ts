import { loadCoins, saveCoins, clearCoins } from './coinStorage';
import { loadObjects, saveObjects, clearObjects } from './objectStorage';
import { loadConfig, saveConfig } from './configStorage';
import { loadSnapshots, clearSnapshots } from './snapshotStorage';
import { replaceAllSnapshots } from '@/db';
import type {
  AppConfig,
  CoinItem,
  CollectionValueSnapshot,
  ObjectItem,
} from '@/types';

export interface BackupFile {
  app: 'app-movil-numismatica';
  version: 1;
  exportedAt: string;
  config: AppConfig;
  coins: CoinItem[];
  objects: ObjectItem[];
  snapshots: CollectionValueSnapshot[];
}

export async function exportAllAsJson(): Promise<string> {
  const [config, coins, objects, snapshots] = await Promise.all([
    loadConfig(),
    loadCoins(),
    loadObjects(),
    loadSnapshots(),
  ]);
  const data: BackupFile = {
    app: 'app-movil-numismatica',
    version: 1,
    exportedAt: new Date().toISOString(),
    config,
    coins,
    objects,
    snapshots,
  };
  return JSON.stringify(data, null, 2);
}

export async function importFromJson(json: string): Promise<void> {
  const parsed = JSON.parse(json) as Partial<BackupFile>;
  if (parsed.app !== 'app-movil-numismatica') {
    throw new Error('El archivo no es un backup válido de esta app.');
  }
  if (parsed.config) await saveConfig(parsed.config);
  if (parsed.coins) await saveCoins(parsed.coins);
  if (parsed.objects) await saveObjects(parsed.objects);
  if (parsed.snapshots) await replaceAllSnapshots(parsed.snapshots);
}

/**
 * Borra TODA la colección y los snapshots. La configuración se mantiene en
 * AsyncStorage; resetearla es responsabilidad del llamante (DataMgmtScreen
 * llama después a `setConfig(buildDefaultConfig())`).
 */
export async function wipeAllData(): Promise<void> {
  await Promise.all([clearCoins(), clearObjects(), clearSnapshots()]);
}
