import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import Slider from '@react-native-community/slider';
import { useAppConfig } from '@/context/ConfigContext';
import {
  defaultObjectFilterState,
  type ObjectFilterState,
  type ObjectSortKey,
} from '../hooks/useObjectFilters';
import type { ObjectFilterKey } from '@/types';

interface Props {
  state: ObjectFilterState;
  onChange: (s: ObjectFilterState) => void;
}

export const ObjectFilters: React.FC<Props> = ({ state, onChange }) => {
  const { config } = useAppConfig();
  const [expanded, setExpanded] = useState(false);
  const visible = config.objectVisibleFilters;
  const has = (k: ObjectFilterKey) => visible.includes(k);
  const update = (patch: Partial<ObjectFilterState>) =>
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
        {(['date', 'name', 'price'] as ObjectSortKey[]).map((k) => (
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
          {has('type') && (
            <Chips
              label="Tipo"
              value={state.typeId}
              options={config.objectTypes.map((t) => ({
                value: t.id,
                label: `${t.emoji} ${t.name}`,
              }))}
              onChange={(v) => update({ typeId: v })}
            />
          )}
          {has('category') && (
            <Chips
              label="Categoría"
              value={state.categoryId}
              options={config.objectCategories.map((c) => ({
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
            onPress={() => onChange(defaultObjectFilterState)}
            className="bg-surface2 py-2 rounded-md mt-3 items-center"
          >
            <Text className="text-white">Limpiar filtros</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
};

function labelSort(k: ObjectSortKey): string {
  return { date: 'Fecha', name: 'Nombre', price: 'Precio' }[k];
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
