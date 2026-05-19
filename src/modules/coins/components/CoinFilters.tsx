import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import Slider from '@react-native-community/slider';
import type { CoinFilterKey, CoinRarity, CoinCondition } from '@/types';
import { useAppConfig } from '@/context/ConfigContext';
import { COIN_CONDITIONS, COIN_RARITIES } from '@/types';
import { RARITY_LABEL_ES, CONDITION_LABEL_ES } from '@/utils/conditions';
import { COUNTRIES } from '@/utils/countries';
import {
  defaultCoinFilterState,
  type CoinFilterState,
  type CoinSortKey,
} from '../hooks/useCoinFilters';

interface Props {
  state: CoinFilterState;
  onChange: (s: CoinFilterState) => void;
}

export const CoinFilters: React.FC<Props> = ({ state, onChange }) => {
  const { config } = useAppConfig();
  const [expanded, setExpanded] = useState(false);
  const visible = config.coinVisibleFilters;

  const has = (k: CoinFilterKey) => visible.includes(k);

  const update = (patch: Partial<CoinFilterState>) =>
    onChange({ ...state, ...patch });

  return (
    <View className="bg-surface rounded-lg p-3 mb-3">
      {has('search') && (
        <TextInput
          value={state.search}
          onChangeText={(v) => update({ search: v })}
          placeholder="🔍 Buscar..."
          placeholderTextColor="#64748b"
          className="bg-bg text-white px-3 py-2 rounded-md mb-2"
        />
      )}
      <View className="flex-row items-center mb-2">
        <Text className="text-muted text-xs flex-1">
          Orden: {labelSort(state.sort)} {state.sortDir === 'asc' ? '↑' : '↓'}
        </Text>
        <Pressable onPress={() => setExpanded((v) => !v)}>
          <Text className="text-primary text-xs">
            {expanded ? 'Ocultar' : 'Más filtros'}
          </Text>
        </Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {(['date', 'year', 'country', 'rarity', 'price'] as CoinSortKey[]).map((k) => (
          <Pressable
            key={k}
            onPress={() =>
              update({
                sort: k,
                sortDir:
                  state.sort === k && state.sortDir === 'desc' ? 'asc' : 'desc',
              })
            }
            className={`px-3 py-1 rounded-full mr-2 ${
              state.sort === k ? 'bg-primary' : 'bg-bg'
            }`}
          >
            <Text className="text-white text-xs">{labelSort(k)}</Text>
          </Pressable>
        ))}
      </ScrollView>
      {expanded && (
        <View className="mt-3">
          {has('category') && (
            <Chips
              label="Categoría"
              value={state.categoryId}
              options={config.coinCategories.map((c) => ({
                value: c.id,
                label: `${c.emoji} ${c.name}`,
              }))}
              onChange={(v) => update({ categoryId: v })}
            />
          )}
          {has('possessionStatus') && (
            <Chips
              label="Estado"
              value={state.possessionStatusId}
              options={config.possessionStatuses.map((p) => ({
                value: p.id,
                label: `${p.emoji} ${p.name}`,
              }))}
              onChange={(v) => update({ possessionStatusId: v })}
            />
          )}
          {has('rarity') && (
            <Chips
              label="Rareza"
              value={state.rarity}
              options={COIN_RARITIES.map((r) => ({
                value: r,
                label: RARITY_LABEL_ES[r],
              }))}
              onChange={(v) => update({ rarity: v as CoinRarity | undefined })}
            />
          )}
          {has('condition') && (
            <Chips
              label="Conservación"
              value={state.condition}
              options={COIN_CONDITIONS.map((c) => ({
                value: c,
                label: CONDITION_LABEL_ES[c],
              }))}
              onChange={(v) =>
                update({ condition: v as CoinCondition | undefined })
              }
            />
          )}
          {has('country') && (
            <Chips
              label="País"
              value={state.country}
              options={COUNTRIES.slice(0, 30).map((c) => ({
                value: c.name,
                label: c.name,
              }))}
              onChange={(v) => update({ country: v })}
            />
          )}
          {has('yearRange') && (
            <View className="mt-2">
              <Text className="text-muted text-xs">
                Año: {state.yearMin ?? '—'} a {state.yearMax ?? '—'}
              </Text>
              <View className="flex-row gap-2 mt-1">
                <TextInput
                  placeholder="Mín"
                  placeholderTextColor="#64748b"
                  value={state.yearMin?.toString() ?? ''}
                  onChangeText={(v) =>
                    update({ yearMin: v ? parseInt(v, 10) : undefined })
                  }
                  keyboardType="number-pad"
                  className="flex-1 bg-bg text-white px-3 py-2 rounded-md"
                />
                <TextInput
                  placeholder="Máx"
                  placeholderTextColor="#64748b"
                  value={state.yearMax?.toString() ?? ''}
                  onChangeText={(v) =>
                    update({ yearMax: v ? parseInt(v, 10) : undefined })
                  }
                  keyboardType="number-pad"
                  className="flex-1 bg-bg text-white px-3 py-2 rounded-md"
                />
              </View>
            </View>
          )}
          {has('priceRange') && (
            <View className="mt-2">
              <Text className="text-muted text-xs">
                Precio máx: {state.priceMax ?? 1000} €
              </Text>
              <Slider
                minimumValue={0}
                maximumValue={1000}
                step={10}
                value={state.priceMax ?? 1000}
                onValueChange={(v) => update({ priceMax: v })}
                minimumTrackTintColor="#3b82f6"
                maximumTrackTintColor="#334155"
              />
            </View>
          )}
          <Pressable
            onPress={() => onChange(defaultCoinFilterState)}
            className="bg-surface2 py-2 rounded-md mt-3 items-center"
          >
            <Text className="text-white">Limpiar filtros</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
};

function labelSort(k: CoinSortKey): string {
  return {
    date: 'Fecha',
    year: 'Año',
    country: 'País',
    rarity: 'Rareza',
    price: 'Precio',
  }[k];
}

const Chips: React.FC<{
  label: string;
  value?: string;
  options: { value: string; label: string }[];
  onChange: (v: string | undefined) => void;
}> = ({ label, value, options, onChange }) => (
  <View className="mb-2">
    <Text className="text-muted text-xs mb-1">{label}</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      {options.map((o) => (
        <Pressable
          key={o.value}
          onPress={() => onChange(value === o.value ? undefined : o.value)}
          className={`px-3 py-1 rounded-full mr-2 ${
            value === o.value ? 'bg-primary' : 'bg-bg'
          }`}
        >
          <Text className="text-white text-xs">{o.label}</Text>
        </Pressable>
      ))}
    </ScrollView>
  </View>
);
