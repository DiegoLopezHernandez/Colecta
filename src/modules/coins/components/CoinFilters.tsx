import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import Slider from '@react-native-community/slider';
import type { CoinFilterKey, CoinRarity, CoinCondition } from '@/types';
import { useAppConfig } from '@/context/ConfigContext';
import { COIN_CONDITIONS, COIN_RARITIES } from '@/types';
import { RARITY_LABEL_ES, CONDITION_LABEL_ES } from '@/utils/conditions';
import { findCountryByName } from '@/utils/countries';
import { CountryPicker } from '@/components/CountryPicker';
import { Chips } from '@/components/Chips';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { colors } from '@/theme/colors';
import {
  defaultCoinFilterState,
  type CoinFilterState,
  type CoinSortKey,
} from '../hooks/useCoinFilters';

interface Props {
  state: CoinFilterState;
  onChange: (s: CoinFilterState) => void;
}

const SORT_OPTIONS: { value: CoinSortKey; label: string }[] = [
  { value: 'date', label: 'Fecha' },
  { value: 'year', label: 'Año' },
  { value: 'country', label: 'País' },
  { value: 'rarity', label: 'Rareza' },
  { value: 'price', label: 'Precio' },
];

export const CoinFilters: React.FC<Props> = ({ state, onChange }) => {
  const { config } = useAppConfig();
  const [expanded, setExpanded] = useState(false);
  const visible = config.coinVisibleFilters;
  const has = (k: CoinFilterKey) => visible.includes(k);
  const update = (patch: Partial<CoinFilterState>) =>
    onChange({ ...state, ...patch });

  // Debounce del texto: re-renderizamos en cada keystroke localmente,
  // pero solo notificamos al padre tras 200 ms sin escribir.
  const [searchLocal, setSearchLocal] = useState(state.search);
  const debouncedSearch = useDebouncedValue(searchLocal, 200);
  useEffect(() => {
    if (debouncedSearch !== state.search) {
      onChange({ ...state, search: debouncedSearch });
    }
    // No incluimos `state` para no entrar en bucle: solo reaccionamos al debounce.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);
  // Si el estado se resetea externamente, sincronizar.
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
            sort: v as CoinSortKey,
            sortDir:
              state.sort === v && state.sortDir === 'desc' ? 'asc' : 'desc',
          })
        }
      />
      {expanded && (
        <View style={{ marginTop: 4 }}>
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
            <View style={{ marginBottom: 10 }}>
              <FieldLabel text="País" />
              <View style={{ marginTop: 6, flexDirection: 'row', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <CountryPicker
                    label="Filtrar por país"
                    value={
                      state.country
                        ? findCountryByName(state.country)?.code
                        : undefined
                    }
                    onChange={(_code, name) => update({ country: name })}
                    placeholder={state.country ?? 'Cualquiera'}
                  />
                </View>
                {state.country ? (
                  <Pressable
                    onPress={() => update({ country: undefined })}
                    accessibilityLabel="Quitar filtro de país"
                    style={({ pressed }) => ({
                      backgroundColor: colors.surface2,
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: 10,
                      paddingHorizontal: 12,
                      justifyContent: 'center',
                      opacity: pressed ? 0.7 : 1,
                    })}
                  >
                    <Text style={{ color: colors.text, fontSize: 13 }}>×</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          )}
          {has('yearRange') && (
            <View style={{ marginTop: 10 }}>
              <FieldLabel
                text={`Año: ${state.yearMin ?? '—'} a ${state.yearMax ?? '—'}`}
              />
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                <NumInput
                  placeholder="Mín"
                  value={state.yearMin}
                  onChange={(v) => update({ yearMin: v })}
                />
                <NumInput
                  placeholder="Máx"
                  value={state.yearMax}
                  onChange={(v) => update({ yearMax: v })}
                />
              </View>
            </View>
          )}
          {has('priceRange') && (
            <View style={{ marginTop: 10 }}>
              <FieldLabel
                text={
                  state.priceMax === undefined
                    ? 'Precio máx: sin límite'
                    : `Precio máx: ${state.priceMax} €`
                }
              />
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
              onChange(defaultCoinFilterState);
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

function labelSort(k: CoinSortKey): string {
  return {
    date: 'Fecha',
    year: 'Año',
    country: 'País',
    rarity: 'Rareza',
    price: 'Precio',
  }[k];
}

const FieldLabel: React.FC<{ text: string }> = ({ text }) => (
  <Text
    style={{
      color: colors.textSubtle,
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    }}
  >
    {text}
  </Text>
);

const NumInput: React.FC<{
  placeholder: string;
  value?: number;
  onChange: (v: number | undefined) => void;
}> = ({ placeholder, value, onChange }) => (
  <TextInput
    placeholder={placeholder}
    placeholderTextColor={colors.textSubtle}
    value={value?.toString() ?? ''}
    onChangeText={(v) => onChange(v ? parseInt(v, 10) : undefined)}
    keyboardType="number-pad"
    style={{
      flex: 1,
      backgroundColor: colors.surface2,
      borderWidth: 1,
      borderColor: colors.border,
      color: colors.text,
      fontSize: 14,
      paddingHorizontal: 12,
      paddingVertical: 9,
      borderRadius: 10,
    }}
  />
);
