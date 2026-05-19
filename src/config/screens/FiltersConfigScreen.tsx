import React from 'react';
import { View, Text, Switch, ScrollView } from 'react-native';
import { useAppConfig } from '@/context/ConfigContext';
import type { CoinFilterKey, ObjectFilterKey } from '@/types';

const COIN_FILTERS: { k: CoinFilterKey; label: string }[] = [
  { k: 'search', label: 'Búsqueda libre' },
  { k: 'category', label: 'Categoría' },
  { k: 'possessionStatus', label: 'Estado de posesión' },
  { k: 'rarity', label: 'Rareza' },
  { k: 'condition', label: 'Conservación' },
  { k: 'priceRange', label: 'Rango de precio' },
  { k: 'country', label: 'País' },
  { k: 'yearRange', label: 'Rango de año' },
];

const OBJECT_FILTERS: { k: ObjectFilterKey; label: string }[] = [
  { k: 'search', label: 'Búsqueda libre' },
  { k: 'type', label: 'Tipo' },
  { k: 'category', label: 'Categoría' },
  { k: 'possessionStatus', label: 'Estado de posesión' },
  { k: 'priceRange', label: 'Rango de precio' },
];

export const FiltersConfigScreen: React.FC = () => {
  const { config, patchConfig } = useAppConfig();

  const toggleCoin = (k: CoinFilterKey) => {
    const has = config.coinVisibleFilters.includes(k);
    patchConfig({
      coinVisibleFilters: has
        ? config.coinVisibleFilters.filter((x) => x !== k)
        : [...config.coinVisibleFilters, k],
    });
  };

  const toggleObject = (k: ObjectFilterKey) => {
    const has = config.objectVisibleFilters.includes(k);
    patchConfig({
      objectVisibleFilters: has
        ? config.objectVisibleFilters.filter((x) => x !== k)
        : [...config.objectVisibleFilters, k],
    });
  };

  return (
    <ScrollView className="flex-1 bg-bg p-3">
      <Text className="text-white text-xl font-bold mb-3">Filtros visibles</Text>

      <Text className="text-muted text-xs mb-2">Monedas</Text>
      {COIN_FILTERS.map((f) => (
        <View
          key={f.k}
          className="bg-surface rounded-md p-3 mb-2 flex-row items-center"
        >
          <Text className="text-white flex-1">{f.label}</Text>
          <Switch
            value={config.coinVisibleFilters.includes(f.k)}
            onValueChange={() => toggleCoin(f.k)}
          />
        </View>
      ))}

      <Text className="text-muted text-xs mt-4 mb-2">Objetos</Text>
      {OBJECT_FILTERS.map((f) => (
        <View
          key={f.k}
          className="bg-surface rounded-md p-3 mb-2 flex-row items-center"
        >
          <Text className="text-white flex-1">{f.label}</Text>
          <Switch
            value={config.objectVisibleFilters.includes(f.k)}
            onValueChange={() => toggleObject(f.k)}
          />
        </View>
      ))}
      <View className="h-16" />
    </ScrollView>
  );
};
