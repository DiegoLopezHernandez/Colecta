import React, { useState } from 'react';
import { View, Text, Image, ScrollView, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCollection } from '@/context/CollectionContext';
import { useAppConfig } from '@/context/ConfigContext';
import { fetchLastPrice } from '@/services/ebayService';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Badge } from '@/components/Badge';
import { Card } from '@/components/Card';
import { Section } from '@/components/Section';
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
      <View style={{ flex: 1, backgroundColor: '#0B0B0D', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#F4F4F5', fontSize: 15 }}>Objeto no encontrado</Text>
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
    Alert.alert('Eliminar objeto', 'Esta acción no se puede deshacer.', [
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

  const diff = delta && delta.old !== undefined ? percentDiff(delta.old, delta.neu) : undefined;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0B0B0D' }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <Text style={{ color: '#F4F4F5', fontSize: 24, fontWeight: '700', letterSpacing: -0.3, marginBottom: 16 }}>
        {obj.name}
      </Text>

      <Section title="Fotografías">
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <ImageTile uri={obj.frontImageUri} />
          {obj.backImageUri ? <ImageTile uri={obj.backImageUri} /> : null}
        </View>
      </Section>

      <Section title="Clasificación">
        <Card>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {t ? <Badge label={t.name} emoji={t.emoji} /> : null}
            {c ? <Badge label={c.name} emoji={c.emoji} color={c.color} /> : null}
            {p ? <Badge label={p.name} emoji={p.emoji} color={p.color} /> : null}
          </View>
        </Card>
      </Section>

      <Section title="Precio">
        <Card>
          <Row
            k={'eBay' + (obj.ebay_last_price_date ? ' · ' + formatDate(obj.ebay_last_price_date) : '')}
            v={obj.ebay_last_price !== undefined ? formatCurrency(obj.ebay_last_price, obj.ebay_last_price_currency || 'EUR') : '-'}
            last
          />
          {obj.ebay_price_not_found ? (
            <Text style={{ color: '#FBBF24', fontSize: 12, marginTop: 8 }}>Sin resultados en eBay</Text>
          ) : null}
          {delta && (
            <View style={{ backgroundColor: '#1C1C20', borderRadius: 10, padding: 10, marginTop: 12 }}>
              <Text style={{ color: '#A1A1AA', fontSize: 11 }}>
                Antes: {formatCurrency(delta.old, obj.ebay_last_price_currency || 'EUR')}
              </Text>
              <Text style={{ color: '#F4F4F5', fontSize: 13, marginTop: 2 }}>
                Ahora: {formatCurrency(delta.neu, obj.ebay_last_price_currency || 'EUR')}{' '}
                {diff !== undefined ? (
                  <Text style={{ color: diff >= 0 ? '#4ADE80' : '#F87171' }}>
                    {diff >= 0 ? '+ ' : '- '}{formatPercent(diff)}
                  </Text>
                ) : null}
              </Text>
            </View>
          )}
        </Card>
      </Section>

      {obj.notes ? (
        <Section title="Notas">
          <Card>
            <Text style={{ color: '#F4F4F5', fontSize: 14, lineHeight: 20 }}>{obj.notes}</Text>
          </Card>
        </Section>
      ) : null}

      <View style={{ gap: 10, marginTop: 8 }}>
        <PrimaryButton label="Actualizar precio eBay" onPress={updatePrice} loading={updating} fullWidth />
        <PrimaryButton label="Eliminar objeto" onPress={confirmDelete} variant="danger" fullWidth />
      </View>
    </ScrollView>
  );
};

const ImageTile: React.FC<{ uri: string }> = ({ uri }) => (
  <View style={{ flex: 1 }}>
    <View style={{ width: '100%', aspectRatio: 1, borderRadius: 12, overflow: 'hidden', backgroundColor: '#1C1C20', borderWidth: 1, borderColor: '#26262B' }}>
      <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
    </View>
  </View>
);

const Row: React.FC<{ k: string; v: string; last?: boolean }> = ({ k, v, last }) => (
  <View style={{ flexDirection: 'row', paddingVertical: 7, borderBottomWidth: last ? 0 : 1, borderBottomColor: '#1C1C20' }}>
    <Text style={{ color: '#A1A1AA', fontSize: 12, flex: 1 }}>{k}</Text>
    <Text style={{ color: '#F4F4F5', fontSize: 13, fontWeight: '500', textAlign: 'right' }}>{v}</Text>
  </View>
);
