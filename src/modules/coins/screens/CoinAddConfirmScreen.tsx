import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, ScrollView, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, RouteProp } from '@react-navigation/native-stack';
import { fetchFullData } from '@/services/numistaService';
import { fetchLastPrice } from '@/services/ebayService';
import { useAppConfig } from '@/context/ConfigContext';
import { useCollection } from '@/context/CollectionContext';
import { LoadingView } from '@/components/LoadingView';
import { ErrorView } from '@/components/ErrorView';
import { PickerSheet } from '@/components/PickerSheet';
import { PrimaryButton } from '@/components/PrimaryButton';
import { newId } from '@/utils/id';
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

  const [loading, setLoading] = useState(!params.manual);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<NumistaFullData | null>(null);
  const [title, setTitle] = useState('');

  const [condition, setCondition] = useState<CoinCondition>('Very Fine');
  const [categoryId, setCategoryId] = useState(config.coinCategories[0]?.id ?? '');
  const [possessionId, setPossessionId] = useState(
    config.possessionStatuses[0]?.id ?? ''
  );
  const [notes, setNotes] = useState('');

  const [pickerOpen, setPickerOpen] = useState<
    null | 'condition' | 'category' | 'possession'
  >(null);

  // eBay
  const [ebayPrice, setEbayPrice] = useState<number | undefined>();
  const [ebayCurrency, setEbayCurrency] = useState<string | undefined>();
  const [ebayDate, setEbayDate] = useState<string | undefined>();
  const [ebayNotFound, setEbayNotFound] = useState(false);

  useEffect(() => {
    if (params.manual) return;
    setLoading(true);
    fetchFullData(config.numistaApiKey, params.numistaId!)
      .then(async (full) => {
        setData(full);
        setTitle(full.title);
        try {
          const r = await fetchLastPrice(config.ebayClientId, full.title);
          if (r) {
            setEbayPrice(r.price);
            setEbayCurrency(r.currency);
            setEbayDate(r.endDate);
          } else {
            setEbayNotFound(true);
          }
        } catch (e) {
          console.warn('eBay error', e);
          setEbayNotFound(true);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkDuplicate = (): boolean => {
    if (!config.duplicateDetection.enabled) return false;
    const crit = config.duplicateDetection.coinCriteria;
    return coins.some((c) => {
      if (crit === 'numista_id') {
        return data?.numista_id && c.numista_id === data.numista_id;
      }
      if (crit === 'name_year') {
        return (
          c.title.toLowerCase() === (data?.title || title).toLowerCase() &&
          c.year === params.year
        );
      }
      // both
      return (
        (data?.numista_id && c.numista_id === data.numista_id) ||
        (c.title.toLowerCase() === (data?.title || title).toLowerCase() &&
          c.year === params.year)
      );
    });
  };

  const save = async () => {
    if (!title.trim()) {
      Alert.alert('Falta título', 'Introduce un título.');
      return;
    }
    if (checkDuplicate()) {
      Alert.alert(
        'Duplicado detectado',
        '¿Guardar igualmente?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Guardar', onPress: doSave },
        ]
      );
      return;
    }
    await doSave();
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
      frontImageUri: params.obverseUri,
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
    nav.popToTop();
  };

  if (loading) return <LoadingView label="Descargando ficha y precio…" />;
  if (error) return <ErrorView error={error} onRetry={() => nav.goBack()} />;

  const selectedCondition = condition;
  const selectedCat = config.coinCategories.find((c) => c.id === categoryId);
  const selectedPos = config.possessionStatuses.find((p) => p.id === possessionId);

  return (
    <ScrollView className="flex-1 bg-bg p-3">
      <Text className="text-white text-xl font-bold mb-3">Confirmar datos</Text>

      <View className="bg-surface p-3 rounded-md mb-2">
        <Text className="text-muted text-xs mb-1">Título</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          className="text-white text-base"
        />
      </View>

      {data && (
        <View className="bg-surface p-3 rounded-md mb-2">
          <Row k="País" v={data.country} />
          <Row k="Año" v={String(params.year)} />
          {data.denomination ? <Row k="Denominación" v={data.denomination} /> : null}
          {data.composition ? <Row k="Composición" v={data.composition} /> : null}
          {data.weight_g ? <Row k="Peso" v={`${data.weight_g} g`} /> : null}
          {data.diameter_mm ? <Row k="Diámetro" v={`${data.diameter_mm} mm`} /> : null}
          {data.mintage ? <Row k="Tirada" v={String(data.mintage)} /> : null}
          {data.rarity ? <Row k="Rareza" v={data.rarity} /> : null}
          {data.numista_typical_value !== undefined ? (
            <Row
              k="Valor Numista (típico)"
              v={`${data.numista_typical_value} €`}
            />
          ) : null}
          {ebayPrice !== undefined ? (
            <Row
              k="eBay último"
              v={`${ebayPrice} ${ebayCurrency || 'EUR'}`}
            />
          ) : ebayNotFound ? (
            <Row k="eBay" v="Sin resultados" />
          ) : null}
        </View>
      )}

      <Selector
        label="Conservación"
        value={CONDITION_LABEL_ES[selectedCondition]}
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

      <PrimaryButton label="Guardar moneda" onPress={save} />
      <View className="h-16" />

      <PickerSheet
        title="Conservación"
        open={pickerOpen === 'condition'}
        options={COIN_CONDITIONS.map((c) => ({
          value: c,
          label: CONDITION_LABEL_ES[c],
        }))}
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
    </ScrollView>
  );
};

const Row: React.FC<{ k: string; v: string }> = ({ k, v }) => (
  <View className="flex-row mb-1">
    <Text className="text-muted text-xs flex-1">{k}</Text>
    <Text className="text-white text-xs">{v}</Text>
  </View>
);

const Selector: React.FC<{ label: string; value: string; onPress: () => void }> = ({
  label,
  value,
  onPress,
}) => (
  <View className="bg-surface p-3 rounded-md mb-2">
    <Text className="text-muted text-xs mb-1">{label}</Text>
    <Text className="text-white text-base" onPress={onPress}>
      {value} ▾
    </Text>
  </View>
);
