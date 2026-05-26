import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { CoinItem, ObjectItem } from '@/types';
import {
  loadCoins,
  saveCoins,
  deleteCoin as deleteCoinFromStore,
} from '@/storage/coinStorage';
import {
  loadObjects,
  saveObjects,
  deleteObject as deleteObjectFromStore,
} from '@/storage/objectStorage';
import { deletePersistedPhoto } from '@/utils/image';

interface CollectionCtx {
  coins: CoinItem[];
  objects: ObjectItem[];
  ready: boolean;
  reload: () => Promise<void>;
  addOrUpdateCoin: (c: CoinItem) => Promise<void>;
  removeCoin: (id: string) => Promise<void>;
  addOrUpdateObject: (o: ObjectItem) => Promise<void>;
  removeObject: (id: string) => Promise<void>;
  replaceAll: (coins: CoinItem[], objects: ObjectItem[]) => Promise<void>;
}

const Ctx = createContext<CollectionCtx | null>(null);

/**
 * Provider de la colección.
 *
 * Cambios clave de rendimiento:
 *   - Todas las callbacks usan setter funcional (`setCoins(prev => …)`) y NO
 *     dependen del estado, por lo que su identidad es estable entre renders.
 *     Esto evita que cada consumidor del context se vuelva a memoizar en cada
 *     cambio de la colección.
 *   - Al borrar un item se intentan eliminar también sus fotos persistidas
 *     para no dejar basura en el almacenamiento.
 */
export const CollectionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [coins, setCoins] = useState<CoinItem[]>([]);
  const [objects, setObjects] = useState<ObjectItem[]>([]);
  const [ready, setReady] = useState(false);

  const reload = useCallback(async () => {
    const [c, o] = await Promise.all([loadCoins(), loadObjects()]);
    setCoins(c);
    setObjects(o);
  }, []);

  useEffect(() => {
    (async () => {
      await reload();
      setReady(true);
    })();
  }, [reload]);

  const addOrUpdateCoin = useCallback(async (c: CoinItem) => {
    let next: CoinItem[] = [];
    setCoins((prev) => {
      const idx = prev.findIndex((x) => x.id === c.id);
      next = idx >= 0 ? prev.map((x, i) => (i === idx ? c : x)) : [c, ...prev];
      return next;
    });
    await saveCoins(next);
  }, []);

  const removeCoin = useCallback(async (id: string) => {
    // Limpieza de fotos asociadas (no bloqueante)
    setCoins((prev) => {
      const target = prev.find((x) => x.id === id);
      if (target) {
        void deletePersistedPhoto(target.frontImageUri);
        void deletePersistedPhoto(target.backImageUri);
      }
      return prev;
    });
    const next = await deleteCoinFromStore(id);
    setCoins(next);
  }, []);

  const addOrUpdateObject = useCallback(async (o: ObjectItem) => {
    let next: ObjectItem[] = [];
    setObjects((prev) => {
      const idx = prev.findIndex((x) => x.id === o.id);
      next = idx >= 0 ? prev.map((x, i) => (i === idx ? o : x)) : [o, ...prev];
      return next;
    });
    await saveObjects(next);
  }, []);

  const removeObject = useCallback(async (id: string) => {
    setObjects((prev) => {
      const target = prev.find((x) => x.id === id);
      if (target) {
        void deletePersistedPhoto(target.frontImageUri);
        void deletePersistedPhoto(target.backImageUri);
      }
      return prev;
    });
    const next = await deleteObjectFromStore(id);
    setObjects(next);
  }, []);

  const replaceAll = useCallback(
    async (c: CoinItem[], o: ObjectItem[]) => {
      setCoins(c);
      setObjects(o);
      await Promise.all([saveCoins(c), saveObjects(o)]);
    },
    []
  );

  const value = useMemo(
    () => ({
      coins,
      objects,
      ready,
      reload,
      addOrUpdateCoin,
      removeCoin,
      addOrUpdateObject,
      removeObject,
      replaceAll,
    }),
    [
      coins,
      objects,
      ready,
      reload,
      addOrUpdateCoin,
      removeCoin,
      addOrUpdateObject,
      removeObject,
      replaceAll,
    ]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export function useCollection(): CollectionCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useCollection debe usarse dentro de CollectionProvider');
  return v;
}
