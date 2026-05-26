import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import Slider from '@react-native-community/slider';
import { useAppConfig } from '@/context/ConfigContext';
import { Chips } from '@/components/Chips';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { colors } from '@/theme/colors';
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

const SORT_OPTIONS: { value: ObjectSortKey; label: string }[] = [
  { value: 'date', label: 'Fecha' },
  { value: 'name', label: 'Nombre' },
  { value: 'price', label: 'Precio' },
];

export const ObjectFilters: React.FC<Props> = ({ state, onChange }) => {
  const { config } = useAppConfig();
  const [expanded, setExpanded] = useState(false);
  const visible = config.objectVisibleFilters;
  const has = (k: ObjectFilterKey) => visible.includes(k);
  const update = (patch: Partial<ObjectFilterState>) =>
    onChange({ ...state, ...patch });

  const [searchLocal, setSearchLocal] = useState(state.search);
  const debouncedSearch = useDebouncedValue(searchLocal, 200);
  useEffect(() => {
    if (debouncedSearch !== state.search) {
      onChange({ ...state, search: debouncedSearch });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);
  useEffect(() => {
    if (state.search !== searchLocal && state.search === '') {
      setSearchLocal('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.search]);

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 12,
        marginBottom: 12,
      }}
    >
      {has('search') && (
        <TextInput
          value={searchLocal}
          onChangeText={setSearchLocal}
          placeholder="Buscar…"
          placeholderTextColor={colors.textSubtle}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          style={{
            backgroundColor: colors.surface2,
            borderWidth: 1,
            borderColor: colors.border,
            color: colors.text,
            fontSize: 14,
            paddingHorizontal: 12,
            paddingVertical: 9,
            borderRadius: 10,
            marginBottom: 10,
          }}
        />
      )}
      <View
        style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}
      >
        <Text style={{ color: colors.textMuted, fontSize: 12, flex: 1 }}>
          Orden:{' '}
          <Text style={{ color: colors.text }}>{labelSort(state.sort)}</Text>{' '}
          {state.sortDir === 'asc' ? '↑' : '↓'}
        </Text>
        <Pressable onPress={() => setExpanded((v) => !v)} hitSlop={8}>
          <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '600' }}>
            {expanded ? 'Ocultar filtros' : 'Más filtros'}
          </Text>
        </Pressable>
      </View>
      <Chips
        toggleable={false}
        value={state.sort}
        options={SORT_OPTIONS}
        onChange={(v) =>
          v &&
          update({
            sort: v as ObjectSortKey,
            sortDir:
              state.sort === v && state.sortDir === 'desc' ? 'asc' : 'desc',
          })
        }
      />
      {expanded && (
        <View style={{ marginTop: 4 }}>
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
            <View style={{ marginTop: 10 }}>
              <Text
                style={{
                  color: colors.textSubtle,
                  fontSize: 11,
                  fontWeight: '600',
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                }}
              >
                {state.priceMax === undefined
                  ? 'Precio máx: sin límite'
                  : `Precio máx: ${state.priceMax} €`}
              </Text>
              <Slider
                minimumValue={0}
                maximumValue={1000}
                step={10}
                value={state.priceMax ?? 1000}
                onSlidingComplete={(v) =>
                  update({ priceMax: v >= 1000 ? undefined : v })
                }
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={colors.border}
                thumbTintColor={colors.primary}
              />
            </View>
          )}
          <Pressable
            onPress={() => {
              setSearchLocal('');
              onChange(defaultObjectFilterState);
            }}
            accessibilityRole="button"
            style={({ pressed }) => ({
              backgroundColor: colors.surface2,
              borderWidth: 1,
              borderColor: colors.border,
              paddingVertical: 10,
              borderRadius: 10,
              alignItems: 'center',
              marginTop: 12,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={{ color: colors.text, fontSize: 13, fontWeight: '500' }}>
              Limpiar filtros
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
};

function labelSort(k: ObjectSortKey): string {
  return { date: 'Fecha', name: 'Nombre', price: 'Precio' }[k];
}
