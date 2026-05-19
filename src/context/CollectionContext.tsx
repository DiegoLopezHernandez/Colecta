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

  const addOrUpdateCoin = useCallback(
    async (c: CoinItem) => {
      const idx = coins.findIndex((x) => x.id === c.id);
      const next = [...coins];
      if (idx >= 0) next[idx] = c;
      else next.unshift(c);
      setCoins(next);
      await saveCoins(next);
    },
    [coins]
  );

  const removeCoin = useCallback(async (id: string) => {
    const next = await deleteCoinFromStore(id);
    setCoins(next);
  }, []);

  const addOrUpdateObject = useCallback(
    async (o: ObjectItem) => {
      const idx = objects.findIndex((x) => x.id === o.id);
      const next = [...objects];
      if (idx >= 0) next[idx] = o;
      else next.unshift(o);
      setObjects(next);
      await saveObjects(next);
    },
    [objects]
  );

  const removeObject = useCallback(async (id: string) => {
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
