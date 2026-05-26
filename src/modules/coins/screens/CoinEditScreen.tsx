import React, { useMemo, useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCollection } from '@/context/CollectionContext';
import { useAppConfig } from '@/context/ConfigContext';
import { PhotoCapture } from '@/components/PhotoCapture';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Field } from '@/components/Field';
import { Section } from '@/components/Section';
import { Card } from '@/components/Card';
import { PickerSheet } from '@/components/PickerSheet';
import { DataRow } from '@/components/DataRow';
import { Selector } from '@/components/Selector';
import { KeyboardScroll } from '@/components/KeyboardScroll';
import { COIN_CONDITIONS } from '@/types';
import { CONDITION_LABEL_ES } from '@/utils/conditions';
import { colors } from '@/theme/colors';
import { haptic } from '@/utils/haptics';
import type { CoinsStackParamList } from '../navigation/CoinsNavigator';
import type { CoinCondition } from '@/types';

type Nav = NativeStackNavigationProp<CoinsStackParamList, 'CoinEdit'>;
type RouteT = RouteProp<CoinsStackParamList, 'CoinEdit'>;

export const CoinEditScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const { params } = useRoute<RouteT>();
  const { coins, addOrUpdateCoin } = useCollection();
  const { config } = useAppConfig();

  // Lookup memoizado: evita recalcular la referencia en cada render del padre.
  const coin = useMemo(
    () => coins.find((c) => c.id === params.id),
    [coins, params.id]
  );

  // Todos los hooks se declaran antes del posible early return para no
  // violar las reglas de hooks. Si la moneda no existe, los valores son neutros.
  const [title, setTitle] = useState(coin?.title ?? '');
  const [year, setYear] = useState(String(coin?.year ?? ''));
  const [notes, setNotes] = useState(coin?.notes ?? '');
  const [condition, setCondition] = useState<CoinCondition>(coin?.condition ?? 'Very Fine');
  const [categoryId, setCategoryId] = useState(coin?.categoryId ?? '');
  const [possessionId, setPossessionId] = useState(coin?.possessionStatusId ?? '');
  const [frontUri, setFrontUri] = useState<string | undefined>(coin?.frontImageUri);
  const [backUri, setBackUri] = useState<string | undefined>(coin?.backImageUri);
  const [pickerOpen, setPickerOpen] = useState<null | 'condition' | 'category' | 'possession'>(null);

  if (!coin) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: colors.text, fontSize: 15 }}>Moneda no encontrada</Text>
      </View>
    );
  }

  const selectedCat = config.coinCategories.find((c) => c.id === categoryId);
  const selectedPos = config.possessionStatuses.find((p) => p.id === possessionId);

  const save = async () => {
    if (!title.trim()) {
      Alert.alert('Falta título', 'Introduce un título.');
      return;
    }
    const parsedYear = parseInt(year, 10);
    if (isNaN(parsedYear) || year.trim().length < 3) {
      Alert.alert('Año inválido', 'Introduce un año de 3 o 4 dígitos.');
      return;
    }
    const now = new Date().toISOString();
    await addOrUpdateCoin({
      ...coin,
      title: title.trim(),
      year: parsedYear,
      condition,
      categoryId,
      possessionStatusId: possessionId,
      notes: notes.trim() || undefined,
      frontImageUri: frontUri ?? '',
      backImageUri: backUri,
      updatedAt: now,
    });
    haptic.success();
    nav.goBack();
  };

  return (
    <KeyboardScroll>
      {coin.numista_id && (
        <Section title="Datos Numista (solo lectura)">
          <Card>
            {coin.denomination ? <DataRow k="Denominación" v={coin.denomination} /> : null}
            {coin.composition ? <DataRow k="Composición" v={coin.composition} /> : null}
            {coin.weight_g ? <DataRow k="Peso" v={`${coin.weight_g} g`} /> : null}
            {coin.diameter_mm ? <DataRow k="Diámetro" v={`${coin.diameter_mm} mm`} last /> : null}
          </Card>
        </Section>
      )}

      <Section title="Identificación">
        <View style={{ gap: 10 }}>
          <Field label="Título" value={title} onChangeText={setTitle} />
          <Field
            label="Año"
            value={year}
            onChangeText={setYear}
            keyboardType="number-pad"
            maxLength={4}
          />
        </View>
      </Section>

      <Section title="Fotos" description="Toca para cambiar la imagen.">
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <PhotoCapture label="Anverso" uri={frontUri} onCaptured={setFrontUri} />
          </View>
          <View style={{ flex: 1 }}>
            <PhotoCapture label="Reverso" uri={backUri} onCaptured={setBackUri} />
          </View>
        </View>
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
        <Field value={notes} onChangeText={setNotes} multiline placeholder="Opcional..." />
      </Section>

      <PrimaryButton label="Guardar cambios" onPress={save} size="lg" fullWidth />

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
