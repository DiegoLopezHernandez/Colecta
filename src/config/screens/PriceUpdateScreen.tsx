import React, { useRef, useState } from 'react';
import { View, Text, Switch, Alert, ScrollView } from 'react-native';
import Slider from '@react-native-community/slider';
import { useAppConfig } from '@/context/ConfigContext';
import { useCollection } from '@/context/CollectionContext';
import { fetchLastPrice } from '@/services/ebayService';
import { addSnapshot } from '@/storage/snapshotStorage';
import { PrimaryButton } from '@/components/PrimaryButton';
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
      // delay configurable
      if (i < all.length - 1) await sleep(config.ebayRequestDelay);
    }

    await replaceAll(nextCoins, nextObjects);

    const totalEbay = nextCoins.reduce(
      (s, c) => s + (c.ebay_last_price ?? 0),
      0
    ) + nextObjects.reduce((s, o) => s + (o.ebay_last_price ?? 0), 0);
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
    <ScrollView className="flex-1 bg-bg p-3">
      <Text className="text-white text-xl font-bold mb-3">
        Actualización de precios
      </Text>

      <View className="bg-surface rounded-md p-3 mb-2">
        <Text className="text-muted text-xs">Última actualización completa</Text>
        <Text className="text-white">
          {config.lastFullUpdateAt
            ? formatDateTime(config.lastFullUpdateAt)
            : 'Nunca'}
        </Text>
      </View>

      <View className="bg-surface rounded-md p-3 mb-2">
        <Text className="text-white mb-1">
          Delay entre peticiones eBay: {config.ebayRequestDelay} ms
        </Text>
        <Slider
          minimumValue={200}
          maximumValue={2000}
          step={50}
          value={config.ebayRequestDelay}
          onValueChange={(v) =>
            patchConfig({ ebayRequestDelay: Math.round(v) })
          }
          minimumTrackTintColor="#3b82f6"
          maximumTrackTintColor="#334155"
        />
      </View>

      <View className="bg-surface rounded-md p-3 mb-3 flex-row items-center">
        <Text className="text-white flex-1">Solo piezas con precio existente</Text>
        <Switch
          value={config.priceUpdateOnlyWithPrice}
          onValueChange={(v) => patchConfig({ priceUpdateOnlyWithPrice: v })}
        />
      </View>

      {running ? (
        <View>
          <Text className="text-white text-center mb-2">
            Actualizando {done} de {total}
          </Text>
          <View className="bg-surface h-3 rounded-full mb-3 overflow-hidden">
            <View
              className="bg-primary h-3"
              style={{
                width: total ? `${(done / total) * 100}%` : '0%',
              }}
            />
          </View>
          <PrimaryButton label="Cancelar" onPress={cancel} variant="danger" />
        </View>
      ) : (
        <PrimaryButton label="🔁 Actualizar todos los precios" onPress={start} />
      )}
      <View className="h-16" />
    </ScrollView>
  );
};
