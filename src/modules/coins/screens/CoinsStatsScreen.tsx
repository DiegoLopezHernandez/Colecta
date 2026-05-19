import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Dimensions } from 'react-native';
import { PieChart, LineChart } from 'react-native-chart-kit';
import { useCollection } from '@/context/CollectionContext';
import { useAppConfig } from '@/context/ConfigContext';
import { loadSnapshots } from '@/storage/snapshotStorage';
import { formatCurrency, formatDate } from '@/utils/format';
import { RARITY_ORDER } from '@/utils/conditions';
import type { CollectionValueSnapshot } from '@/types';

export const CoinsStatsScreen: React.FC = () => {
  const { coins } = useCollection();
  const { config } = useAppConfig();
  const [snapshots, setSnapshots] = useState<CollectionValueSnapshot[]>([]);

  useEffect(() => {
    loadSnapshots().then(setSnapshots);
  }, []);

  const totalNumista = coins.reduce(
    (s, c) => s + (c.numista_typical_value ?? 0),
    0
  );
  const totalEbay = coins.reduce((s, c) => s + (c.ebay_last_price ?? 0), 0);

  const byStatus = config.possessionStatuses.map((p) => ({
    name: `${p.emoji} ${p.name}`,
    count: coins.filter((c) => c.possessionStatusId === p.id).length,
    color: p.color,
    legendFontColor: '#cbd5e1',
    legendFontSize: 11,
  }));

  const byCategory = config.coinCategories
    .map((cat) => ({
      name: cat.name,
      population: coins.filter((c) => c.categoryId === cat.id).length,
      color: cat.color,
      legendFontColor: '#cbd5e1',
      legendFontSize: 11,
    }))
    .filter((x) => x.population > 0);

  const mostValuable = [...coins]
    .filter((c) => c.ebay_last_price || c.numista_typical_value)
    .sort(
      (a, b) =>
        (b.ebay_last_price ?? b.numista_typical_value ?? 0) -
        (a.ebay_last_price ?? a.numista_typical_value ?? 0)
    )[0];

  const rarest = [...coins]
    .filter((c) => c.rarity)
    .sort((a, b) => RARITY_ORDER[b.rarity!] - RARITY_ORDER[a.rarity!])[0];

  const oldestPriceDate = coins
    .map((c) => c.ebay_last_price_updated_at)
    .filter((d): d is string => !!d)
    .sort()[0];

  const screenW = Dimensions.get('window').width - 24;

  return (
    <ScrollView className="flex-1 bg-bg p-3">
      <Text className="text-white text-xl font-bold mb-3">Estadísticas</Text>

      <View className="bg-surface p-3 rounded-md mb-3 flex-row">
        <Stat label="Piezas" value={String(coins.length)} />
        <Stat label="Valor Numista" value={formatCurrency(totalNumista, 'EUR')} />
        <Stat label="Valor eBay" value={formatCurrency(totalEbay, 'EUR')} />
      </View>

      <View className="bg-surface p-3 rounded-md mb-3">
        <Text className="text-white font-semibold mb-2">Por estado de posesión</Text>
        {byStatus.map((s) => (
          <View key={s.name} className="flex-row items-center mb-1">
            <View style={{ backgroundColor: s.color }} className="w-3 h-3 rounded-full mr-2" />
            <Text className="text-white flex-1">{s.name}</Text>
            <Text className="text-muted">{s.count}</Text>
          </View>
        ))}
      </View>

      {byCategory.length > 0 && (
        <View className="bg-surface p-3 rounded-md mb-3">
          <Text className="text-white font-semibold mb-2">Por categoría</Text>
          <PieChart
            data={byCategory}
            width={screenW - 24}
            height={180}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="0"
            absolute
          />
        </View>
      )}

      {mostValuable && (
        <View className="bg-surface p-3 rounded-md mb-3">
          <Text className="text-white font-semibold">Más valiosa</Text>
          <Text className="text-muted">
            {mostValuable.title} ·{' '}
            {formatCurrency(
              mostValuable.ebay_last_price ?? mostValuable.numista_typical_value,
              mostValuable.ebay_last_price_currency || 'EUR'
            )}
          </Text>
        </View>
      )}
      {rarest && (
        <View className="bg-surface p-3 rounded-md mb-3">
          <Text className="text-white font-semibold">Más rara</Text>
          <Text className="text-muted">
            {rarest.title} · {rarest.rarity}
          </Text>
        </View>
      )}
      {oldestPriceDate && (
        <View className="bg-surface p-3 rounded-md mb-3">
          <Text className="text-muted text-xs">Precio más antiguo</Text>
          <Text className="text-white">{formatDate(oldestPriceDate)}</Text>
        </View>
      )}

      {snapshots.length > 1 && (
        <View className="bg-surface p-3 rounded-md mb-3">
          <Text className="text-white font-semibold mb-2">Histórico de valor</Text>
          <LineChart
            data={{
              labels: snapshots
                .slice(-6)
                .map((s) => formatDate(s.date).slice(0, 5)),
              datasets: [
                {
                  data: snapshots.slice(-6).map((s) => s.totalEbayValue),
                },
              ],
            }}
            width={screenW - 24}
            height={180}
            chartConfig={chartConfig}
            bezier
            yAxisSuffix="€"
          />
        </View>
      )}
      <View className="h-16" />
    </ScrollView>
  );
};

const Stat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View className="flex-1 items-center">
    <Text className="text-muted text-xs">{label}</Text>
    <Text className="text-white text-base font-semibold mt-1" numberOfLines={1}>
      {value}
    </Text>
  </View>
);

const chartConfig = {
  backgroundGradientFrom: '#1e293b',
  backgroundGradientTo: '#1e293b',
  color: (op = 1) => `rgba(59,130,246,${op})`,
  labelColor: () => '#cbd5e1',
  decimalPlaces: 0,
};
