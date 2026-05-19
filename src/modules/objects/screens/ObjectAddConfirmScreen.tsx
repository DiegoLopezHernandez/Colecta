import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  Pressable,
  TextInput,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, RouteProp } from '@react-navigation/native-stack';
import { useAppConfig } from '@/context/ConfigContext';
import { useCollection } from '@/context/CollectionContext';
import { searchListings, fetchLastPrice } from '@/services/ebayService';
import { LoadingView } from '@/components/LoadingView';
import { PrimaryButton } from '@/components/PrimaryButton';
import { PickerSheet } from '@/components/PickerSheet';
import { newId } from '@/utils/id';
import { formatCurrency } from '@/utils/format';
import { similarityPercent } from '@/utils/similarity';
import type { ObjectsStackParamList } from '../navigation/ObjectsNavigator';
import type { ObjectItem } from '@/types';

type Nav = NativeStackNavigationProp<ObjectsStackParamList, 'AddConfirm'>;
type RouteT = RouteProp<ObjectsStackParamList, 'AddConfirm'>;

type Listing = Awaited<ReturnType<typeof searchListings>>[number];

export const ObjectAddConfirmScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const { params } = useRoute<RouteT>();
  const { config } = useAppConfig();
  const { objects, addOrUpdateObject } = useCollection();

  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<Listing[]>([]);
  const [chosen, setChosen] = useState<Listing | null>(null);
  const [name, setName] = useState(params.name);
  const [notes, setNotes] = useState('');
  const [possessionId, setPossessionId] = useState(
    config.possessionStatuses[0]?.id ?? ''
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [lastPrice, setLastPrice] = useState<{
    price: number;
    currency: string;
    date?: string;
  } | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await searchListings(config.ebayClientId, params.name, 6);
        setListings(r);
        try {
          const p = await fetchLastPrice(config.ebayClientId, params.name);
          if (p) setLastPrice({ price: p.price, currency: p.currency, date: p.endDate });
          else setNotFound(true);
        } catch {
          setNotFound(true);
        }
      } catch (e) {
        Alert.alert('Error eBay', (e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkDuplicate = () => {
    if (!config.duplicateDetection.enabled) return false;
    const crit = config.duplicateDetection.objectCriteria;
    const threshold = config.duplicateDetection.similarityThreshold;
    return objects.some((o) => {
      if (crit === 'exact')
        return o.name.toLowerCase() === name.toLowerCase();
      return similarityPercent(o.name, name) >= threshold;
    });
  };

  const save = async () => {
    if (!name.trim()) {
      Alert.alert('Falta nombre', 'Introduce un nombre.');
      return;
    }
    if (checkDuplicate()) {
      Alert.alert('Posible duplicado', '¿Guardar igualmente?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Guardar', onPress: doSave },
      ]);
      return;
    }
    await doSave();
  };

  const doSave = async () => {
    const now = new Date().toISOString();
    const item: ObjectItem = {
      id: newId(),
      module: 'object',
      name: name.trim(),
      typeId: params.typeId,
      categoryId: params.categoryId,
      ebay_last_price: lastPrice?.price,
      ebay_last_price_currency: lastPrice?.currency,
      ebay_last_price_date: lastPrice?.date,
      ebay_last_price_updated_at: lastPrice ? now : undefined,
      ebay_price_not_found: notFound,
      frontImageUri: params.obverseUri,
      backImageUri: params.reverseUri,
      possessionStatusId: possessionId,
      notes: notes.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    };
    await addOrUpdateObject(item);
    nav.popToTop();
  };

  if (loading) return <LoadingView label="Buscando en eBay…" />;

  const selectedPos = config.possessionStatuses.find((p) => p.id === possessionId);

  return (
    <ScrollView className="flex-1 bg-bg p-3">
      <Text className="text-white text-xl font-bold mb-2">Confirmar objeto</Text>

      <View className="bg-surface p-3 rounded-md mb-2">
        <Text className="text-muted text-xs mb-1">Nombre</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          className="text-white text-base"
        />
      </View>

      {lastPrice && (
        <View className="bg-surface p-3 rounded-md mb-2">
          <Text className="text-muted text-xs">Último precio eBay</Text>
          <Text className="text-white text-base">
            {formatCurrency(lastPrice.price, lastPrice.currency)}
          </Text>
        </View>
      )}
      {notFound && (
        <View className="bg-surface p-3 rounded-md mb-2">
          <Text className="text-accent text-xs">⚠️ Sin resultados en eBay.</Text>
        </View>
      )}

      {listings.length > 0 && (
        <View className="bg-surface p-3 rounded-md mb-2">
          <Text className="text-white font-semibold mb-2">
            Coincidencia visual (opcional)
          </Text>
          <Text className="text-muted text-xs mb-2">
            Pulsa el resultado más parecido para importar su título exacto.
          </Text>
          {listings.map((l, idx) => (
            <Pressable
              key={idx}
              onPress={() => {
                setChosen(l);
                setName(l.title);
                setLastPrice({ price: l.price, currency: l.currency });
                setNotFound(false);
              }}
              className={`flex-row mb-2 p-2 rounded-md ${
                chosen === l ? 'bg-primary/30' : 'bg-bg'
              }`}
            >
              {l.imageUrl ? (
                <Image source={{ uri: l.imageUrl }} className="w-16 h-16 rounded-md mr-2" />
              ) : (
                <View className="w-16 h-16 rounded-md bg-surface2 mr-2" />
              )}
              <View className="flex-1">
                <Text className="text-white text-xs" numberOfLines={2}>
                  {l.title}
                </Text>
                <Text className="text-primary text-xs mt-1">
                  {formatCurrency(l.price, l.currency)}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}

      <View className="bg-surface p-3 rounded-md mb-2">
        <Text className="text-muted text-xs mb-1">Posesión</Text>
        <Text className="text-white text-base" onPress={() => setPickerOpen(true)}>
          {selectedPos ? `${selectedPos.emoji} ${selectedPos.name}` : '—'} ▾
        </Text>
      </View>

      <View className="bg-surface p-3 rounded-md mb-3">
        <Text className="text-muted text-xs mb-1">Notas</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          multiline
          placeholder="Opcional"
          placeholderTextColor="#64748b"
          className="text-white text-base min-h-[60px]"
        />
      </View>

      <PrimaryButton label="Guardar objeto" onPress={save} />
      <View className="h-16" />

      <PickerSheet
        title="Posesión"
        open={pickerOpen}
        options={config.possessionStatuses.map((p) => ({
          value: p.id,
          label: p.name,
          emoji: p.emoji,
          color: p.color,
        }))}
        selectedValue={possessionId}
        onSelect={setPossessionId}
        onClose={() => setPickerOpen(false)}
      />
    </ScrollView>
  );
};
