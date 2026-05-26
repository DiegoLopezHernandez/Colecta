import React, { useEffect, useState } from 'react';
import { View, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { fetchFullData } from '@/services/numistaService';
import { fetchLastPrice } from '@/services/ebayService';
import { useAppConfig } from '@/context/ConfigContext';
import { useCollection } from '@/context/CollectionContext';
import { LoadingView } from '@/components/LoadingView';
import { ErrorView } from '@/components/ErrorView';
import { PickerSheet } from '@/components/PickerSheet';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Field } from '@/components/Field';
import { Section } from '@/components/Section';
import { Card } from '@/components/Card';
import { DataRow } from '@/components/DataRow';
import { Selector } from '@/components/Selector';
import { KeyboardScroll } from '@/components/KeyboardScroll';
import { newId } from '@/utils/id';
import { haptic } from '@/utils/haptics';
import { COIN_CONDITIONS } from '@/types';
import { CONDITION_LABEL_ES } from '@/utils/conditions';
import type { CoinsStackParamList } from '../navigation/CoinsNavigator';
import type { CoinCondition, CoinItem, NumistaFullData } from '@/types';

type Nav = NativeStackNavigationProp<CoinsStackParamList, 'AddConfirm'>;
type RouteT = RouteProp<CoinsStackParamList, 'AddConfirm'>;

export const CoinAddConfirmScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const { params } = useRoute<RouteT>();
  const { config } = useAppConfig();
  const { coins, addOrUpdateCoin } = useCollection();

  const hasNumista = params.numistaId !== undefined;

  const [loading, setLoading] = useState(hasNumista);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<NumistaFullData | null>(null);
  const [title, setTitle] = useState(params.title ?? '');

  const [condition, setCondition] = useState<CoinCondition>('Very Fine');
  const [categoryId, setCategoryId] = useState(config.coinCategories[0]?.id ?? '');
  const [possessionId, setPossessionId] = useState(config.possessionStatuses[0]?.id ?? '');
  const [notes, setNotes] = useState('');

  const [pickerOpen, setPickerOpen] = useState<null | 'condition' | 'category' | 'possession'>(null);

  const [ebayPrice, setEbayPrice] = useState<number | undefined>();
  const [ebayCurrency, setEbayCurrency] = useState<string | undefined>();
  const [ebayDate, setEbayDate] = useState<string | undefined>();
  const [ebayNotFound, setEbayNotFound] = useState(false);

  useEffect(() => {
    if (!hasNumista || params.numistaId === undefined) return;
    let cancelled = false;
    setLoading(true);
    fetchFullData(config.numistaApiKey, params.numistaId)
      .then(async (full) => {
        if (cancelled) return;
        setData(full);
        setTitle(full.title);
        try {
          const r = await fetchLastPrice(config.ebayClientId, full.title);
          if (cancelled) return;
          if (r) {
            setEbayPrice(r.price);
            setEbayCurrency(r.currency);
            setEbayDate(r.endDate);
          } else {
            setEbayNotFound(true);
          }
        } catch {
          if (!cancelled) setEbayNotFound(true);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [hasNumista, params.numistaId, config.numistaApiKey, config.ebayClientId]);

  const checkDuplicate = (): boolean => {
    if (!config.duplicateDetection.enabled) return false;
    const crit = config.duplicateDetection.coinCriteria;
    const incomingTitle = (data?.title || title).trim().toLowerCase();
    return coins.some((c) => {
      const sameTitle = c.title.trim().toLowerCase() === incomingTitle;
      if (crit === 'numista_id') return !!(data?.numista_id && c.numista_id === data.numista_id);
      if (crit === 'name_only') return sameTitle;
      if (crit === 'name_year') return sameTitle && c.year === params.year;
      return (
        !!(data?.numista_id && c.numista_id === data.numista_id) ||
        (sameTitle && c.year === params.year)
      );
    });
  };

  const doSave = async () => {
    const now = new Date().toISOString();
    const item: CoinItem = {
      id: newId(),
      module: 'coin',
      numista_id: data?.numista_id,
      title: title.trim(),
      country: data?.country || params.countryName,
      year: params.year,
      denomination: data?.denomination,
      composition: data?.composition,
      weight_g: data?.weight_g,
      diameter_mm: data?.diameter_mm,
      mintage: data?.mintage,
      rarity: data?.rarity,
      numista_min_value: data?.numista_min_value,
      numista_typical_value: data?.numista_typical_value,
      numista_max_value: data?.numista_max_value,
      numista_url: data?.numista_url,
      ebay_last_price: ebayPrice,
      ebay_last_price_currency: ebayCurrency,
      ebay_last_price_date: ebayDate,
      ebay_last_price_updated_at: ebayPrice ? now : undefined,
      ebay_price_not_found: ebayNotFound,
      frontImageUri: params.obverseUri ?? '',
      backImageUri: params.reverseUri,
      officialObverseUrl: data?.officialObverseUrl,
      officialReverseUrl: data?.officialReverseUrl,
      condition,
      possessionStatusId: possessionId,
      categoryId,
      notes: notes.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    };
    await addOrUpdateCoin(item);
    haptic.success();
    nav.popToTop();
  };

  const save = async () => {
    if (!title.trim()) {
      Alert.alert('Falta título', 'Introduce un título para la moneda.');
      return;
    }
    if (checkDuplicate()) {
      Alert.alert('Duplicado detectado', 'Ya tienes una moneda similar. ¿Guardar igualmente?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Guardar', onPress: doSave },
      ]);
      return;
    }
    await doSave();
  };

  if (loading) return <LoadingView label="Descargando ficha y precio…" />;
  if (error) return <ErrorView error={error} onRetry={() => nav.goBack()} />;

  const selectedCat = config.coinCategories.find((c) => c.id === categoryId);
  const selectedPos = config.possessionStatuses.find((p) => p.id === possessionId);

  return (
    <KeyboardScroll>
      <Section title="Información">
        <Field label="Título" value={title} onChangeText={setTitle} />
        {data && (
          <Card>
            <DataRow k="País" v={data.country} />
            <DataRow k="Año" v={params.year} />
            {data.denomination ? <DataRow k="Denominación" v={data.denomination} /> : null}
            {data.composition ? <DataRow k="Composición" v={data.composition} /> : null}
            {data.weight_g ? <DataRow k="Peso" v={`${data.weight_g} g`} /> : null}
            {data.diameter_mm ? <DataRow k="Diámetro" v={`${data.diameter_mm} mm`} /> : null}
            {data.mintage ? <DataRow k="Tirada" v={data.mintage.toLocaleString()} /> : null}
            {data.rarity ? <DataRow k="Rareza" v={data.rarity} /> : null}
            {data.numista_typical_value !== undefined ? (
              <DataRow k="Valor Numista" v={`${data.numista_typical_value} EUR`} />
            ) : null}
            {ebayPrice !== undefined ? (
              <DataRow k="eBay último" v={`${ebayPrice} ${ebayCurrency || 'EUR'}`} last />
            ) : ebayNotFound ? (
              <DataRow k="eBay" v="Sin resultados" last />
            ) : null}
          </Card>
        )}
      </Section>

      <Section title="Clasificación">
        <View style={{ gap: 10 }}>
          <Selector
            label="Conservación"
            value={CONDITION_LABEL_ES[condition]}
            onPress={() => setPickerOpen('condition')}
          />
          <Selector
            label="Categoría"
            value={selectedCat ? `${selectedCat.emoji} ${selectedCat.name}` : '—'}
            onPress={() => setPickerOpen('category')}
          />
          <Selector
            label="Posesión"
            value={selectedPos ? `${selectedPos.emoji} ${selectedPos.name}` : '—'}
            onPress={() => setPickerOpen('possession')}
          />
        </View>
      </Section>

      <Section title="Notas">
        <Field value={notes} onChangeText={setNotes} multiline placeholder="Opcional…" />
      </Section>

      <PrimaryButton label="Guardar moneda" onPress={save} size="lg" fullWidth />

      <PickerSheet
        title="Conservación"
        open={pickerOpen === 'condition'}
        options={COIN_CONDITIONS.map((c) => ({ value: c, label: CONDITION_LABEL_ES[c] }))}
        selectedValue={condition}
        onSelect={(v) => setCondition(v as CoinCondition)}
        onClose={() => setPickerOpen(null)}
      />
      <PickerSheet
        title="Categoría"
        open={pickerOpen === 'category'}
        options={config.coinCategories.map((c) => ({
          value: c.id,
          label: c.name,
          emoji: c.emoji,
          color: c.color,
        }))}
        selectedValue={categoryId}
        onSelect={setCategoryId}
        onClose={() => setPickerOpen(null)}
      />
      <PickerSheet
        title="Posesión"
        open={pickerOpen === 'possession'}
        options={config.possessionStatuses.map((p) => ({
          value: p.id,
          label: p.name,
          emoji: p.emoji,
          color: p.color,
        }))}
        selectedValue={possessionId}
        onSelect={setPossessionId}
        onClose={() => setPickerOpen(null)}
      />
    </KeyboardScroll>
  );
};
