import React, { useState } from 'react';
import { View, Text, Image, ScrollView, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, RouteProp } from '@react-navigation/native-stack';
import { useCollection } from '@/context/CollectionContext';
import { useAppConfig } from '@/context/ConfigContext';
import { fetchLastPrice } from '@/services/ebayService';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Badge } from '@/components/Badge';
import { formatCurrency, formatDate, percentDiff, formatPercent } from '@/utils/format';
import type { ObjectsStackParamList } from '../navigation/ObjectsNavigator';

type Nav = NativeStackNavigationProp<ObjectsStackParamList, 'ObjectDetail'>;
type RouteT = RouteProp<ObjectsStackParamList, 'ObjectDetail'>;

export const ObjectDetailScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const { params } = useRoute<RouteT>();
  const { objects, addOrUpdateObject, removeObject } = useCollection();
  const { config } = useAppConfig();
  const obj = objects.find((o) => o.id === params.id);
  const [updating, setUpdating] = useState(false);
  const [delta, setDelta] = useState<{ old?: number; neu: number } | null>(null);

  if (!obj) {
    return (
      <View className="flex-1 bg-bg items-center justify-center">
        <Text className="text-white">Objeto no encontrado</Text>
      </View>
    );
  }

  const t = config.objectTypes.find((x) => x.id === obj.typeId);
  const c = config.objectCategories.find((x) => x.id === obj.categoryId);
  const p = config.possessionStatuses.find((x) => x.id === obj.possessionStatusId);

  const updatePrice = async () => {
    setUpdating(true);
    setDelta(null);
    try {
      const r = await fetchLastPrice(config.ebayClientId, obj.name);
      const now = new Date().toISOString();
      if (r) {
        setDelta({ old: obj.ebay_last_price, neu: r.price });
        await addOrUpdateObject({
          ...obj,
          ebay_last_price: r.price,
          ebay_last_price_currency: r.currency,
          ebay_last_price_date: r.endDate,
          ebay_last_price_updated_at: now,
          ebay_price_not_found: false,
          updatedAt: now,
        });
      } else {
        await addOrUpdateObject({
          ...obj,
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
    Alert.alert('Eliminar objeto', '¿Seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await removeObject(obj.id);
          nav.goBack();
        },
      },
    ]);

  const diff =
    delta && delta.old !== undefined ? percentDiff(delta.old, delta.neu) : undefined;

  return (
    <ScrollView className="flex-1 bg-bg p-3">
      <Text className="text-white text-xl font-bold mb-3">{obj.name}</Text>

      <View className="flex-row gap-2 mb-3">
        <View className="flex-1">
          <Image
            source={{ uri: obj.frontImageUri }}
            className="w-full aspect-square rounded-md"
          />
        </View>
        {obj.backImageUri ? (
          <View className="flex-1">
            <Image
              source={{ uri: obj.backImageUri }}
              className="w-full aspect-square rounded-md"
            />
          </View>
        ) : null}
      </View>

      <View className="bg-surface p-3 rounded-md mb-3">
        <View className="flex-row flex-wrap gap-1">
          {t ? <Badge label={t.name} emoji={t.emoji} /> : null}
          {c ? <Badge label={c.name} emoji={c.emoji} color={c.color} /> : null}
          {p ? <Badge label={p.name} emoji={p.emoji} color={p.color} /> : null}
        </View>
      </View>

      <View className="bg-surface p-3 rounded-md mb-3">
        <Text className="text-white font-semibold mb-2">Precio</Text>
        <Row
          k={`eBay ${obj.ebay_last_price_date ? `(${formatDate(obj.ebay_last_price_date)})` : ''}`}
          v={
            obj.ebay_last_price !== undefined
              ? formatCurrency(obj.ebay_last_price, obj.ebay_last_price_currency || 'EUR')
              : '—'
          }
        />
        {obj.ebay_price_not_found ? (
          <Text className="text-accent text-xs mt-1">⚠️ Sin resultados en eBay</Text>
        ) : null}
        {delta && (
          <View className="bg-bg p-2 rounded-md mt-2">
            <Text className="text-muted text-xs">
              Antes: {formatCurrency(delta.old, obj.ebay_last_price_currency || 'EUR')}
            </Text>
            <Text className="text-white">
              Ahora: {formatCurrency(delta.neu, obj.ebay_last_price_currency || 'EUR')}{' '}
              {diff !== undefined ? (
                <Text className={diff >= 0 ? 'text-ok' : 'text-err'}>
                  {diff >= 0 ? '▲' : '▼'} {formatPercent(diff)}
                </Text>
              ) : null}
            </Text>
          </View>
        )}
      </View>

      {obj.notes ? (
        <View className="bg-surface p-3 rounded-md mb-3">
          <Text className="text-muted text-xs mb-1">Notas</Text>
          <Text className="text-white">{obj.notes}</Text>
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
