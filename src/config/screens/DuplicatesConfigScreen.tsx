import React from 'react';
import { View, Text, Switch, Pressable, ScrollView } from 'react-native';
import Slider from '@react-native-community/slider';
import { useAppConfig } from '@/context/ConfigContext';
import type { CoinDuplicateCriteria, ObjectDuplicateCriteria } from '@/types';

const COIN_OPTS: { v: CoinDuplicateCriteria; label: string }[] = [
  { v: 'numista_id', label: 'numista_id' },
  { v: 'name_year', label: 'nombre + año' },
  { v: 'both', label: 'ambos' },
];
const OBJ_OPTS: { v: ObjectDuplicateCriteria; label: string }[] = [
  { v: 'exact', label: 'nombre exacto' },
  { v: 'similar', label: 'nombre similar (umbral)' },
];

export const DuplicatesConfigScreen: React.FC = () => {
  const { config, patchConfig } = useAppConfig();
  const d = config.duplicateDetection;

  return (
    <ScrollView className="flex-1 bg-bg p-3">
      <Text className="text-white text-xl font-bold mb-3">Duplicados</Text>

      <View className="bg-surface rounded-md p-3 mb-3 flex-row items-center">
        <Text className="text-white flex-1">Detección activada</Text>
        <Switch
          value={d.enabled}
          onValueChange={(v) =>
            patchConfig({ duplicateDetection: { ...d, enabled: v } })
          }
        />
      </View>

      <Text className="text-muted text-xs mb-2">Criterio para monedas</Text>
      <View className="bg-surface rounded-md p-3 mb-3">
        {COIN_OPTS.map((o) => (
          <Pressable
            key={o.v}
            onPress={() =>
              patchConfig({
                duplicateDetection: { ...d, coinCriteria: o.v },
              })
            }
            className="flex-row items-center py-2"
          >
            <Text className="text-white flex-1">{o.label}</Text>
            <Text className="text-primary">{d.coinCriteria === o.v ? '●' : '○'}</Text>
          </Pressable>
        ))}
      </View>

      <Text className="text-muted text-xs mb-2">Criterio para objetos</Text>
      <View className="bg-surface rounded-md p-3 mb-3">
        {OBJ_OPTS.map((o) => (
          <Pressable
            key={o.v}
            onPress={() =>
              patchConfig({
                duplicateDetection: { ...d, objectCriteria: o.v },
              })
            }
            className="flex-row items-center py-2"
          >
            <Text className="text-white flex-1">{o.label}</Text>
            <Text className="text-primary">{d.objectCriteria === o.v ? '●' : '○'}</Text>
          </Pressable>
        ))}
      </View>

      {d.objectCriteria === 'similar' && (
        <View className="bg-surface rounded-md p-3 mb-3">
          <Text className="text-white mb-1">
            Umbral de similitud: {d.similarityThreshold}%
          </Text>
          <Slider
            minimumValue={0}
            maximumValue={100}
            step={1}
            value={d.similarityThreshold}
            onValueChange={(v) =>
              patchConfig({
                duplicateDetection: {
                  ...d,
                  similarityThreshold: Math.round(v),
                },
              })
            }
            minimumTrackTintColor="#3b82f6"
            maximumTrackTintColor="#334155"
          />
        </View>
      )}
      <View className="h-16" />
    </ScrollView>
  );
};
