import React, { useRef, useState } from 'react';
import { View, Text, Switch, Alert, ScrollView } from 'react-native';
import Slider from '@react-native-community/slider';
import { useAppConfig } from '@/context/ConfigContext';
import { useCollection } from '@/context/CollectionContext';
import { fetchLastPrice } from '@/services/ebayService';
import { addSnapshot } from '@/storage/snapshotStorage';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Section } from '@/components/Section';
import { Card } from '@/components/Card';
import { sleep, formatDateTime } from '@/utils/format';
import type { CoinItem, ObjectItem } from '@/types';

interface Summary {
  updated: number;
  errors: number;
  notFound: number;
}

export const PriceUpdateScreen: React.FC = () => {
  const { config, patchConfig } = useAppConfig();
  const { coins, objects, replaceAll } = useCollection();
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(0);
  const [total, setTotal] = useState(0);
  const cancelRef = useRef(false);

  const candidates = (): { c: CoinItem[]; o: ObjectItem[] } => {
    const filterCoins = config.priceUpdateOnlyWithPrice
      ? coins.filter((c) => c.ebay_last_price !== undefined)
      : coins;
    const filterObj = config.priceUpdateOnlyWithPrice
      ? objects.filter((o) => o.ebay_last_price !== undefined)
      : objects;
    return { c: filterCoins, o: filterObj };
  };

  const start = async () => {
    if (!config.ebayClientId) {
      Alert.alert('Falta App ID', 'Configura el App ID de eBay primero.');
      return;
    }
    const { c, o } = candidates();
    const all: Array<{ kind: 'coin' | 'object'; item: CoinItem | ObjectItem }> = [
      ...c.map((x) => ({ kind: 'coin' as const, item: x as CoinItem | ObjectItem })),
      ...o.map((x) => ({ kind: 'object' as const, item: x as CoinItem | ObjectItem })),
    ];
    if (all.length === 0) {
      Alert.alert('Nada que actualizar', 'No hay piezas que cumplan los criterios.');
      return;
    }

    setRunning(true);
    cancelRef.current = false;
    setDone(0);
    setTotal(all.length);

    const summary: Summary = { updated: 0, errors: 0, notFound: 0 };
    const nextCoins = [...coins];
    const nextObjects = [...objects];

    for (let i = 0; i < all.length; i++) {
      if (cancelRef.current) break;
      const entry = all[i]!;
      const it = entry.item;
      const keywords =
        entry.kind === 'coin' ? (it as CoinItem).title : (it as ObjectItem).name;
      const now = new Date().toISOString();
      try {
        const r = await fetchLastPrice(config.ebayClientId, keywords);
        if (r) {
          summary.updated++;
          if (entry.kind === 'coin') {
            const idx = nextCoins.findIndex((x) => x.id === it.id);
            if (idx >= 0)
              nextCoins[idx] = {
                ...nextCoins[idx]!,
                ebay_last_price: r.price,
                ebay_last_price_currency: r.currency,
                ebay_last_price_date: r.endDate,
                ebay_last_price_updated_at: now,
                ebay_price_not_found: false,
                updatedAt: now,
              };
          } else {
            const idx = nextObjects.findIndex((x) => x.id === it.id);
            if (idx >= 0)
              nextObjects[idx] = {
                ...nextObjects[idx]!,
                ebay_last_price: r.price,
                ebay_last_price_currency: r.currency,
                ebay_last_price_date: r.endDate,
                ebay_last_price_updated_at: now,
                ebay_price_not_found: false,
                updatedAt: now,
              };
          }
        } else {
          summary.notFound++;
          if (entry.kind === 'coin') {
            const idx = nextCoins.findIndex((x) => x.id === it.id);
            if (idx >= 0)
              nextCoins[idx] = {
                ...nextCoins[idx]!,
                ebay_price_not_found: true,
                ebay_last_price_updated_at: now,
                updatedAt: now,
              };
          } else {
            const idx = nextObjects.findIndex((x) => x.id === it.id);
            if (idx >= 0)
              nextObjects[idx] = {
                ...nextObjects[idx]!,
                ebay_price_not_found: true,
                ebay_last_price_updated_at: now,
                updatedAt: now,
              };
          }
        }
      } catch (e) {
        console.warn('Update price error', e);
        summary.errors++;
      }
      setDone(i + 1);
      if (i < all.length - 1) await sleep(config.ebayRequestDelay);
    }

    await replaceAll(nextCoins, nextObjects);

    const totalEbay =
      nextCoins.reduce((s, c) => s + (c.ebay_last_price ?? 0), 0) +
      nextObjects.reduce((s, o) => s + (o.ebay_last_price ?? 0), 0);
    const totalNumista = nextCoins.reduce(
      (s, c) => s + (c.numista_typical_value ?? 0),
      0
    );
    await addSnapshot({
      date: new Date().toISOString(),
      totalEbayValue: totalEbay,
      totalNumistaValue: totalNumista,
      itemCount: nextCoins.length + nextObjects.length,
    });
    await patchConfig({ lastFullUpdateAt: new Date().toISOString() });

    setRunning(false);
    Alert.alert(
      'Actualización completa',
      `Actualizados: ${summary.updated}\nSin resultados: ${summary.notFound}\nErrores: ${summary.errors}`
    );
  };

  const cancel = () => {
    cancelRef.current = true;
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#0B0B0D' }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
    >
      <Section title="Estado">
        <Card>
          <Text
            style={{
              color: '#71717A',
              fontSize: 11,
              fontWeight: '600',
              letterSpacing: 0.5,
              textTransform: 'uppercase',
            }}
          >
            Última actualización completa
          </Text>
          <Text style={{ color: '#F4F4F5', fontSize: 15, marginTop: 4 }}>
            {config.lastFullUpdateAt ? formatDateTime(config.lastFullUpdateAt) : 'Nunca'}
          </Text>
        </Card>
      </Section>

      <Section title="Parámetros">
        <Card>
          <Text style={{ color: '#F4F4F5', fontSize: 14, marginBottom: 4 }}>
            Delay entre peticiones: {config.ebayRequestDelay} ms
          </Text>
          <Text style={{ color: '#71717A', fontSize: 12, marginBottom: 8 }}>
            Más alto reduce el riesgo de rate-limit.
          </Text>
          <Slider
            minimumValue={200}
            maximumValue={2000}
            step={50}
            value={config.ebayRequestDelay}
            onValueChange={(v) =>
              patchConfig({ ebayRequestDelay: Math.round(v) })
            }
            minimumTrackTintColor="#D4A24B"
            maximumTrackTintColor="#26262B"
            thumbTintColor="#D4A24B"
          />
        </Card>
        <View style={{ height: 10 }} />
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#F4F4F5', fontSize: 14, fontWeight: '500' }}>
                Solo piezas con precio existente
              </Text>
              <Text style={{ color: '#71717A', fontSize: 12, marginTop: 2 }}>
                Salta las que aún no han sido valoradas.
              </Text>
            </View>
            <Switch
              value={config.priceUpdateOnlyWithPrice}
              onValueChange={(v) => patchConfig({ priceUpdateOnlyWithPrice: v })}
              trackColor={{ false: '#26262B', true: '#D4A24B' }}
              thumbColor={config.priceUpdateOnlyWithPrice ? '#F4F4F5' : '#A1A1AA'}
              ios_backgroundColor="#26262B"
            />
          </View>
        </Card>
      </Section>

      {running ? (
        <View>
          <Text
            style={{
              color: '#F4F4F5',
              fontSize: 14,
              textAlign: 'center',
              marginBottom: 8,
            }}
          >
            Actualizando {done} de {total}
          </Text>
          <View
            style={{
              height: 8,
              backgroundColor: '#1C1C20',
              borderRadius: 999,
              overflow: 'hidden',
              marginBottom: 14,
              borderWidth: 1,
              borderColor: '#26262B',
            }}
          >
            <View
              style={{
                backgroundColor: '#D4A24B',
                height: '100%',
                width: total ? `${(done / total) * 100}%` : '0%',
              }}
            />
          </View>
          <PrimaryButton label="Cancelar" onPress={cancel} variant="danger" fullWidth />
        </View>
      ) : (
        <PrimaryButton
          label="Actualizar todos los precios"
          icon="🔁"
          onPress={start}
          size="lg"
          fullWidth
        />
      )}
    </ScrollView>
  );
};
