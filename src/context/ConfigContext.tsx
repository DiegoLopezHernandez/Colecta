import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { AppConfig } from '@/types';
import { loadConfig, saveConfig } from '@/storage/configStorage';
import { buildDefaultConfig } from '@/utils/defaults';

interface ConfigCtx {
  config: AppConfig;
  ready: boolean;
  setConfig: (next: AppConfig) => Promise<void>;
  patchConfig: (patch: Partial<AppConfig>) => Promise<void>;
}

const Ctx = createContext<ConfigCtx | null>(null);

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [config, setConfigState] = useState<AppConfig>(buildDefaultConfig());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadConfig()
      .then((c) => setConfigState(c))
      .finally(() => setReady(true));
  }, []);

  const setConfig = useCallback(async (next: AppConfig) => {
    setConfigState(next);
    await saveConfig(next);
  }, []);

  const patchConfig = useCallback(
    async (patch: Partial<AppConfig>) => {
      const next = { ...config, ...patch };
      setConfigState(next);
      await saveConfig(next);
    },
    [config]
  );

  const value = useMemo(
    () => ({ config, ready, setConfig, patchConfig }),
    [config, ready, setConfig, patchConfig]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export function useAppConfig(): ConfigCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAppConfig debe usarse dentro de ConfigProvider');
  return v;
}
