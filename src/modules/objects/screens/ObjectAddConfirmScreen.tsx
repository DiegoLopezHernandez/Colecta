import React, { useEffect, useState } from 'react';
import { View, Text, Image, Pressable, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppConfig } from '@/context/ConfigContext';
import { useCollection } from '@/context/CollectionContext';
import { searchListings, fetchLastPrice } from '@/services/ebayService';
import { LoadingView } from '@/components/LoadingView';
import { PrimaryButton } from '@/components/PrimaryButton';
import { PickerSheet } from '@/components/PickerSheet';
import { Field } from '@/components/Field';
import { Section } from '@/components/Section';
import { Card } from '@/components/Card';
import { Selector } from '@/components/Selector';
import { KeyboardScroll } from '@/components/KeyboardScroll';
import { newId } from '@/utils/id';
import { formatCurrency } from '@/utils/format';
import { similarityPercent } from '@/utils/similarity';
import { colors } from '@/theme/colors';
import { haptic } from '@/utils/haptics';
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
  const [possessionId, setPossessionId] = useState(config.possessionStatuses[0]?.id ?? '');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [lastPrice, setLastPrice] = useState<{ price: number; currency: string; date?: string } | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await searchListings(config.ebayClientId, params.name, 6);
        if (cancelled) return;
        setListings(r);
        try {
          const p = await fetchLastPrice(config.ebayClientId, params.name);
          if (cancelled) return;
          if (p) setLastPrice({ price: p.price, currency: p.currency, date: p.endDate });
          else setNotFound(true);
        } catch {
          if (!cancelled) setNotFound(true);
        }
      } catch (e) {
        if (!cancelled) Alert.alert('Error eBay', (e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [config.ebayClientId, params.name]);

  const checkDuplicate = () => {
    if (!config.duplicateDetection.enabled) return false;
    const crit = config.duplicateDetection.objectCriteria;
    const threshold = config.duplicateDetection.similarityThreshold;
    return objects.some((o) => {
      if (crit === 'exact') return o.name.toLowerCase() === name.toLowerCase();
      return similarityPercent(o.name, name) >= threshold;
    });
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
    haptic.success();
    nav.popToTop();
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

  if (loading) return <LoadingView label="Buscando en eBay…" />;

  const selectedPos = config.possessionStatuses.find((p) => p.id === possessionId);

  return (
    <KeyboardScroll>
      <Section title="Información">
        <Field label="Nombre" value={name} onChangeText={setName} />
      </Section>

      <Section title="Precio">
        <Card>
          {lastPrice ? (
            <>
              <Text style={{ color: colors.textSubtle, fontSize: 11, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                Último precio eBay
              </Text>
              <Text style={{ color: colors.primary, fontSize: 22, fontWeight: '700', marginTop: 4 }}>
                {formatCurrency(lastPrice.price, lastPrice.currency)}
              </Text>
            </>
          ) : notFound ? (
            <Text style={{ color: colors.warn, fontSize: 13 }}>Sin resultados en eBay.</Text>
          ) : null}
        </Card>
      </Section>

      {listings.length > 0 && (
        <Section title="Coincidencia visual" description="Pulsa el resultado más parecido para importar su título y precio exactos.">
          {listings.map((l, idx) => {
            const active = chosen === l;
            return (
              <Pressable
                key={idx}
                onPress={() => {
                  setChosen(l);
                  setName(l.title);
                  setLastPrice({ price: l.price, currency: l.currency });
                  setNotFound(false);
                  haptic.light();
                }}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  marginBottom: 8,
                  padding: 10,
                  borderRadius: 12,
                  backgroundColor: active ? colors.primary + '22' : colors.surface,
                  borderWidth: 1,
                  borderColor: active ? colors.primary : colors.border,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                {l.imageUrl ? (
                  <Image
                    source={{ uri: l.imageUrl }}
                    style={{ width: 64, height: 64, borderRadius: 8, marginRight: 10, backgroundColor: colors.surface2 }}
                  />
                ) : (
                  <View style={{ width: 64, height: 64, borderRadius: 8, backgroundColor: colors.surface2, marginRight: 10 }} />
                )}
                <View style={{ flex: 1, justifyContent: 'space-between' }}>
                  <Text style={{ color: colors.text, fontSize: 12, lineHeight: 16 }} numberOfLines={2}>
                    {l.title}
                  </Text>
                  <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '700' }}>
                    {formatCurrency(l.price, l.currency)}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </Section>
      )}

      <Section title="Clasificación">
        <Selector
          label="Posesión"
          value={selectedPos ? `${selectedPos.emoji} ${selectedPos.name}` : '—'}
          onPress={() => setPickerOpen(true)}
        />
      </Section>

      <Section title="Notas">
        <Field value={notes} onChangeText={setNotes} multiline placeholder="Opcional…" />
      </Section>

      <PrimaryButton label="Guardar objeto" onPress={save} size="lg" fullWidth />

      <PickerSheet
        title="Posesión"
        open={pickerOpen}
        options={config.possessionStatuses.map((p) => ({ value: p.id, label: p.name, emoji: p.emoji, color: p.color }))}
        selectedValue={possessionId}
        onSelect={setPossessionId}
        onClose={() => setPickerOpen(false)}
      />
    </KeyboardScroll>
  );
};
