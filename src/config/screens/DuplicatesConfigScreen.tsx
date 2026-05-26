import React from 'react';
import { View, Text, Switch, Pressable, ScrollView } from 'react-native';
import Slider from '@react-native-community/slider';
import { useAppConfig } from '@/context/ConfigContext';
import { Section } from '@/components/Section';
import { Card } from '@/components/Card';
import type { CoinDuplicateCriteria, ObjectDuplicateCriteria } from '@/types';

const COIN_OPTS: { v: CoinDuplicateCriteria; label: string; description: string }[] = [
  { v: 'name_only', label: 'Solo nombre', description: 'Misma moneda aunque cambie el año (ej. 10cts España 2001 = 2002)' },
  { v: 'name_year', label: 'Nombre + año', description: 'Mismo título y mismo año exactos' },
  { v: 'numista_id', label: 'ID Numista', description: 'Coincidencia exacta por ID de Numista' },
  { v: 'both', label: 'ID o nombre+año', description: 'Cualquiera de los dos coincidiendo' },
];

const OBJ_OPTS: { v: ObjectDuplicateCriteria; label: string; description: string }[] = [
  { v: 'exact', label: 'nombre exacto', description: 'Comparación literal del nombre' },
  { v: 'similar', label: 'nombre similar', description: 'Usa el umbral configurable' },
];

export const DuplicatesConfigScreen: React.FC = () => {
  const { config, patchConfig } = useAppConfig();
  const d = config.duplicateDetection;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#0B0B0D' }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
    >
      <Section title="General">
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#F4F4F5', fontSize: 14, fontWeight: '500' }}>
                Detección activada
              </Text>
              <Text style={{ color: '#71717A', fontSize: 12, marginTop: 2 }}>
                Avisa antes de guardar una pieza que coincida.
              </Text>
            </View>
            <Switch
              value={d.enabled}
              onValueChange={(v) =>
                patchConfig({ duplicateDetection: { ...d, enabled: v } })
              }
              trackColor={{ false: '#26262B', true: '#D4A24B' }}
              thumbColor={d.enabled ? '#F4F4F5' : '#A1A1AA'}
              ios_backgroundColor="#26262B"
            />
          </View>
        </Card>
      </Section>

      <Section title="Criterio para monedas">
        <Card padded={false}>
          {COIN_OPTS.map((o, idx) => (
            <RadioRow
              key={o.v}
              label={o.label}
              description={o.description}
              selected={d.coinCriteria === o.v}
              onPress={() =>
                patchConfig({ duplicateDetection: { ...d, coinCriteria: o.v } })
              }
              last={idx === COIN_OPTS.length - 1}
            />
          ))}
        </Card>
      </Section>

      <Section title="Criterio para objetos">
        <Card padded={false}>
          {OBJ_OPTS.map((o, idx) => (
            <RadioRow
              key={o.v}
              label={o.label}
              description={o.description}
              selected={d.objectCriteria === o.v}
              onPress={() =>
                patchConfig({ duplicateDetection: { ...d, objectCriteria: o.v } })
              }
              last={idx === OBJ_OPTS.length - 1}
            />
          ))}
        </Card>
      </Section>

      {d.objectCriteria === 'similar' && (
        <Section title="Umbral de similitud">
          <Card>
            <Text style={{ color: '#F4F4F5', fontSize: 14, marginBottom: 4 }}>
              {d.similarityThreshold}%
            </Text>
            <Text style={{ color: '#71717A', fontSize: 12, marginBottom: 8 }}>
              Cuanto mayor, más estricta la coincidencia.
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
              minimumTrackTintColor="#D4A24B"
              maximumTrackTintColor="#26262B"
              thumbTintColor="#D4A24B"
            />
          </Card>
        </Section>
      )}
    </ScrollView>
  );
};

const RadioRow: React.FC<{
  label: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
  last?: boolean;
}> = ({ label, description, selected, onPress, last }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => ({
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderBottomWidth: last ? 0 : 1,
      borderBottomColor: '#1C1C20',
      backgroundColor: pressed ? '#1C1C20' : 'transparent',
    })}
  >
    <View
      style={{
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: selected ? '#D4A24B' : '#3A3A40',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
      }}
    >
      {selected ? (
        <View
          style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: '#D4A24B',
          }}
        />
      ) : null}
    </View>
    <View style={{ flex: 1 }}>
      <Text style={{ color: '#F4F4F5', fontSize: 14, fontWeight: '500' }}>
        {label}
      </Text>
      {description ? (
        <Text style={{ color: '#71717A', fontSize: 12, marginTop: 2 }}>
          {description}
        </Text>
      ) : null}
    </View>
  </Pressable>
);
