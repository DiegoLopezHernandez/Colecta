import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Dimensions } from 'react-native';
import { PieChart, LineChart } from 'react-native-chart-kit';
import { useCollection } from '@/context/CollectionContext';
import { useAppConfig } from '@/context/ConfigContext';
import { loadSnapshots } from '@/storage/snapshotStorage';
import { formatCurrency, formatDate } from '@/utils/format';
import { RARITY_ORDER } from '@/utils/conditions';
import { Card } from '@/components/Card';
import { Section } from '@/components/Section';
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
    legendFontColor: '#A1A1AA',
    legendFontSize: 11,
  }));

  const byCategory = config.coinCategories
    .map((cat) => ({
      name: cat.name,
      population: coins.filter((c) => c.categoryId === cat.id).length,
      color: cat.color,
      legendFontColor: '#A1A1AA',
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

  const screenW = Dimensions.get('window').width - 32;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#0B0B0D' }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
    >
      <Text
        style={{
          color: '#F4F4F5',
          fontSize: 24,
          fontWeight: '700',
          letterSpacing: -0.3,
          marginBottom: 16,
        }}
      >
        Estadísticas
      </Text>

      <Card style={{ flexDirection: 'row', marginBottom: 16, gap: 0 }}>
        <Stat label="Piezas" value={String(coins.length)} />
        <Divider />
        <Stat label="Numista" value={formatCurrency(totalNumista, 'EUR')} />
        <Divider />
        <Stat label="eBay" value={formatCurrency(totalEbay, 'EUR')} highlight />
      </Card>

      <Section title="Por estado de posesión">
        <Card>
          {byStatus.map((s, i) => (
            <View
              key={s.name}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 8,
                borderBottomWidth: i === byStatus.length - 1 ? 0 : 1,
                borderBottomColor: '#1C1C20',
              }}
            >
              <View
                style={{
                  backgroundColor: s.color,
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  marginRight: 10,
                }}
              />
              <Text style={{ color: '#F4F4F5', flex: 1, fontSize: 14 }}>{s.name}</Text>
              <Text style={{ color: '#A1A1AA', fontSize: 14, fontWeight: '500' }}>
                {s.count}
              </Text>
            </View>
          ))}
        </Card>
      </Section>

      {byCategory.length > 0 && (
        <Section title="Por categoría">
          <Card>
            <PieChart
              data={byCategory}
              width={screenW - 28}
              height={180}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="0"
              absolute
            />
          </Card>
        </Section>
      )}

      {mostValuable && (
        <Section title="Más valiosa">
          <Card>
            <Text style={{ color: '#F4F4F5', fontSize: 15, fontWeight: '600' }}>
              {mostValuable.title}
            </Text>
            <Text style={{ color: '#D4A24B', fontSize: 14, marginTop: 4 }}>
              {formatCurrency(
                mostValuable.ebay_last_price ?? mostValuable.numista_typical_value,
                mostValuable.ebay_last_price_currency || 'EUR'
              )}
            </Text>
          </Card>
        </Section>
      )}
      {rarest && (
        <Section title="Más rara">
          <Card>
            <Text style={{ color: '#F4F4F5', fontSize: 15, fontWeight: '600' }}>
              {rarest.title}
            </Text>
            <Text style={{ color: '#A1A1AA', fontSize: 13, marginTop: 4 }}>
              {rarest.rarity}
            </Text>
          </Card>
        </Section>
      )}
      {oldestPriceDate && (
        <Section title="Precio más antiguo">
          <Card>
            <Text style={{ color: '#F4F4F5', fontSize: 15 }}>
              {formatDate(oldestPriceDate)}
            </Text>
          </Card>
        </Section>
      )}

      {snapshots.length > 1 && (
        <Section title="Histórico de valor">
          <Card>
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
              width={screenW - 28}
              height={180}
              chartConfig={chartConfig}
              bezier
              yAxisSuffix="€"
            />
          </Card>
        </Section>
      )}
    </ScrollView>
  );
};

const Stat: React.FC<{ label: string; value: string; highlight?: boolean }> = ({
  label,
  value,
  highlight,
}) => (
  <View style={{ flex: 1, alignItems: 'center', paddingVertical: 4 }}>
    <Text
      style={{
        color: '#71717A',
        fontSize: 10,
        fontWeight: '600',
        letterSpacing: 0.6,
        textTransform: 'uppercase',
      }}
    >
      {label}
    </Text>
    <Text
      numberOfLines={1}
      style={{
        color: highlight ? '#D4A24B' : '#F4F4F5',
        fontSize: 16,
        fontWeight: '700',
        marginTop: 4,
      }}
    >
      {value}
    </Text>
  </View>
);

const Divider: React.FC = () => (
  <View style={{ width: 1, backgroundColor: '#26262B', marginVertical: 4 }} />
);

const chartConfig = {
  backgroundGradientFrom: '#141417',
  backgroundGradientTo: '#141417',
  color: (op = 1) => `rgba(212,162,75,${op})`,
  labelColor: () => '#A1A1AA',
  decimalPlaces: 0,
};
