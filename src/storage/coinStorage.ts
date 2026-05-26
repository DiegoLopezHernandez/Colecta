import type { CoinItem } from '@/types';
import {
  selectAllJson,
  upsertJson,
  deleteById,
  clearTable,
  replaceAllJson,
} from '@/db';

/**
 * Storage de monedas respaldado por SQLite. Las firmas se mantienen idénticas a
 * la versión anterior basada en AsyncStorage para no romper consumidores
 * existentes (CollectionContext, dataBackup).
 *
 * Diferencia clave de rendimiento: `upsertCoin` y `deleteCoin` afectan a una
 * única fila, no reescriben toda la colección.
 */

export async function loadCoins(): Promise<CoinItem[]> {
  try {
    return await selectAllJson<CoinItem>('coins');
  } catch (e) {
    console.warn('[coinStorage] loadCoins error', e);
    return [];
  }
}

/**
 * Reemplaza TODA la colección. Solo se usa para importar backups o vaciar.
 * Para añadir/editar una sola moneda usar `upsertCoin`.
 */
export async function saveCoins(items: CoinItem[]): Promise<void> {
  await replaceAllJson('coins', items);
}

export async function upsertCoin(item: CoinItem): Promise<CoinItem[]> {
  await upsertJson('coins', item);
  return await loadCoins();
}

export async function deleteCoin(id: string): Promise<CoinItem[]> {
  await deleteById('coins', id);
  return await loadCoins();
}

export async function clearCoins(): Promise<void> {
  await clearTable('coins');
}
