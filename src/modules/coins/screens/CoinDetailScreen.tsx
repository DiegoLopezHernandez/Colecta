import React, { useState } from 'react';
import { View, Text, Image, ScrollView, Alert, Pressable } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, RouteProp } from '@react-navigation/native-stack';
import { useCollection } from '@/context/CollectionContext';
import { useAppConfig } from '@/context/ConfigContext';
import { fetchLastPrice } from '@/services/ebayService';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Badge } from '@/components/Badge';
import { formatCurrency, formatDate, percentDiff, formatPercent } from '@/utils/format';
import { CONDITION_LABEL_ES, RARITY_LABEL_ES } from '@/utils/conditions';
import type { CoinsStackParamList } from '../navigation/CoinsNavigator';

type Nav = NativeStackNavigationProp<CoinsStackParamList, 'CoinDetail'>;
type RouteT = RouteProp<CoinsStackParamList, 'CoinDetail'>;

export const CoinDetailScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const { params } = useRoute<RouteT>();
  const { coins, addOrUpdateCoin, removeCoin } = useCollection();
  const { config } = useAppConfig();
  const coin = coins.find((c) => c.id === params.id);
  const [updating, setUpdating] = useState(false);
  const [delta, setDelta] = useState<{ old?: number; neu: number } | null>(null);

  if (!coin) {
    return (
      <View className="flex-1 bg-bg items-center justify-center">
        <Text className="text-white">Moneda no encontrada</Text>
      </View>
    );
  }

  const cat = config.coinCategories.find((c) => c.id === coin.categoryId);
  const pos = config.possessionStatuses.find((p) => p.id === coin.possessionStatusId);

  const updatePrice = async () => {
    setUpdating(true);
    setDelta(null);
    try {
      const r = await fetchLastPrice(config.ebayClientId, coin.title);
      const now = new Date().toISOString();
      if (r) {
        setDelta({ old: coin.ebay_last_price, neu: r.price });
        await addOrUpdateCoin({
          ...coin,
          ebay_last_price: r.price,
          ebay_last_price_currency: r.currency,
          ebay_last_price_date: r.endDate,
          ebay_last_price_updated_at: now,
          ebay_price_not_found: false,
          updatedAt: now,
        });
      } else {
        await addOrUpdateCoin({
          ...coin,
          ebay_price_not_found: true,
          ebay_last_price_updated_at: now,
          updatedAt: now,
        });
        Alert.alert('Sin resultados', 'No se ha encontrado ningún listing.');
      }
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    } finally {
      setUpdating(false);
    }
  };

  const confirmDelete = () =>
    Alert.alert('Eliminar moneda', '¿Seguro? Esta acción no se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await removeCoin(coin.id);
          nav.goBack();
        },
      },
    ]);

  const diff =
    delta && delta.old !== undefined
      ? percentDiff(delta.old, delta.neu)
      : undefined;

  return (
    <ScrollView className="flex-1 bg-bg p-3">
      <Text className="text-white text-xl font-bold mb-3">{coin.title}</Text>

      <View className="flex-row gap-2 mb-3">
        <View className="flex-1">
          <Text className="text-muted text-xs mb-1">Tu foto · Anverso</Text>
          <Image source={{ uri: coin.frontImageUri }} className="w-full aspect-square rounded-md" />
        </View>
        {coin.backImageUri ? (
          <View className="flex-1">
            <Text className="text-muted text-xs mb-1">Tu foto · Reverso</Text>
            <Image source={{ uri: coin.backImageUri }} className="w-full aspect-square rounded-md" />
          </View>
        ) : null}
      </View>

      {(coin.officialObverseUrl || coin.officialReverseUrl) && (
        <View className="flex-row gap-2 mb-3">
          {coin.officialObverseUrl ? (
            <View className="flex-1">
              <Text className="text-muted text-xs mb-1">Oficial · Anverso</Text>
              <Image
                source={{ uri: coin.officialObverseUrl }}
                className="w-full aspect-square rounded-md"
                resizeMode="contain"
              />
            </View>
          ) : null}
          {coin.officialReverseUrl ? (
            <View className="flex-1">
              <Text className="text-muted text-xs mb-1">Oficial · Reverso</Text>
              <Image
                source={{ uri: coin.officialReverseUrl }}
                className="w-full aspect-square rounded-md"
                resizeMode="contain"
              />
            </View>
          ) : null}
        </View>
      )}

      <View className="bg-surface p-3 rounded-md mb-3">
        <Row k="País" v={coin.country} />
        <Row k="Año" v={String(coin.year)} />
        {coin.denomination ? <Row k="Denominación" v={coin.denomination} /> : null}
        {coin.composition ? <Row k="Composición" v={coin.composition} /> : null}
        {coin.weight_g ? <Row k="Peso" v={`${coin.weight_g} g`} /> : null}
        {coin.diameter_mm ? <Row k="Diámetro" v={`${coin.diameter_mm} mm`} /> : null}
        {coin.mintage ? <Row k="Tirada" v={coin.mintage.toString()} /> : null}
        {coin.rarity ? <Row k="Rareza" v={RARITY_LABEL_ES[coin.rarity]} /> : null}
        <Row k="Conservación" v={CONDITION_LABEL_ES[coin.condition]} />
        <View className="flex-row flex-wrap gap-1 mt-2">
          {cat ? <Badge label={cat.name} emoji={cat.emoji} color={cat.color} /> : null}
          {pos ? <Badge label={pos.name} emoji={pos.emoji} color={pos.color} /> : null}
        </View>
      </View>

      <View className="bg-surface p-3 rounded-md mb-3">
        <Text className="text-white font-semibold mb-2">Valoraciones</Text>
        {coin.numista_typical_value !== undefined ? (
          <Row
            k="Numista (típico)"
            v={formatCurrency(coin.numista_typical_value, 'EUR')}
          />
        ) : null}
        {coin.numista_min_value !== undefined ? (
          <Row
            k="Numista (mín)"
            v={formatCurrency(coin.numista_min_value, 'EUR')}
          />
        ) : null}
        {coin.numista_max_value !== undefined ? (
          <Row
            k="Numista (máx)"
            v={formatCurrency(coin.numista_max_value, 'EUR')}
          />
        ) : null}
        <Row
          k={`eBay último ${coin.ebay_last_price_date ? `(${formatDate(coin.ebay_last_price_date)})` : ''}`}
          v={
            coin.ebay_last_price !== undefined
              ? formatCurrency(coin.ebay_last_price, coin.ebay_last_price_currency || 'EUR')
              : '—'
          }
        />
        {coin.ebay_price_not_found ? (
          <Text className="text-accent text-xs mt-1">⚠️ Sin resultados en eBay</Text>
        ) : null}
        {delta && (
          <View className="bg-bg p-2 rounded-md mt-2">
            <Text className="text-muted text-xs">
              Antes: {formatCurrency(delta.old, coin.ebay_last_price_currency || 'EUR')}
            </Text>
            <Text className="text-white">
              Ahora: {formatCurrency(delta.neu, coin.ebay_last_price_currency || 'EUR')}{' '}
              {diff !== undefined ? (
                <Text className={diff >= 0 ? 'text-ok' : 'text-err'}>
                  {diff >= 0 ? '▲' : '▼'} {formatPercent(diff)}
                </Text>
              ) : null}
            </Text>
          </View>
        )}
      </View>

      {coin.notes ? (
        <View className="bg-surface p-3 rounded-md mb-3">
          <Text className="text-muted text-xs mb-1">Notas</Text>
          <Text className="text-white">{coin.notes}</Text>
        </View>
      ) : null}

      <PrimaryButton
        label="🔄 Actualizar precio (eBay)"
        onPress={updatePrice}
        loading={updating}
      />
      <View className="h-3" />
      <PrimaryButton label="Eliminar" onPress={confirmDelete} variant="danger" />
      <View className="h-16" />
    </ScrollView>
  );
};

const Row: React.FC<{ k: string; v: string }> = ({ k, v }) => (
  <View className="flex-row mb-1">
    <Text className="text-muted text-xs flex-1">{k}</Text>
    <Text className="text-white text-xs">{v}</Text>
  </View>
);
