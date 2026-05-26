import React from 'react';
import { View, Text, Switch, ScrollView } from 'react-native';
import { useAppConfig } from '@/context/ConfigContext';
import { Section } from '@/components/Section';
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
    <ScrollView
      style={{ flex: 1, backgroundColor: '#0B0B0D' }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
    >
      <Section title="Monedas">
        <SwitchList
          items={COIN_FILTERS.map((f) => ({
            key: f.k,
            label: f.label,
            value: config.coinVisibleFilters.includes(f.k),
            onChange: () => toggleCoin(f.k),
          }))}
        />
      </Section>

      <Section title="Objetos">
        <SwitchList
          items={OBJECT_FILTERS.map((f) => ({
            key: f.k,
            label: f.label,
            value: config.objectVisibleFilters.includes(f.k),
            onChange: () => toggleObject(f.k),
          }))}
        />
      </Section>
    </ScrollView>
  );
};

const SwitchList: React.FC<{
  items: { key: string; label: string; value: boolean; onChange: () => void }[];
}> = ({ items }) => (
  <View
    style={{
      backgroundColor: '#141417',
      borderRadius: 14,
      borderWidth: 1,
      borderColor: '#26262B',
      overflow: 'hidden',
    }}
  >
    {items.map((it, idx) => (
      <View
        key={it.key}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 12,
          paddingHorizontal: 14,
          borderBottomWidth: idx === items.length - 1 ? 0 : 1,
          borderBottomColor: '#1C1C20',
        }}
      >
        <Text style={{ color: '#F4F4F5', fontSize: 14, flex: 1 }}>{it.label}</Text>
        <Switch
          value={it.value}
          onValueChange={it.onChange}
          trackColor={{ false: '#26262B', true: '#D4A24B' }}
          thumbColor={it.value ? '#F4F4F5' : '#A1A1AA'}
          ios_backgroundColor="#26262B"
        />
      </View>
    ))}
  </View>
);
