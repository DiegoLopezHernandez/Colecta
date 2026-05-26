import React, { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PhotoCapture } from '@/components/PhotoCapture';
import { CountryPicker } from '@/components/CountryPicker';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Field } from '@/components/Field';
import { Section } from '@/components/Section';
import { KeyboardScroll } from '@/components/KeyboardScroll';
import { colors } from '@/theme/colors';
import type { CoinsStackParamList } from '../navigation/CoinsNavigator';

type Nav = NativeStackNavigationProp<CoinsStackParamList, 'AddCoin'>;

export const CoinAddCoinScreen: React.FC = () => {
  const nav = useNavigation<Nav>();

  const [query, setQuery] = useState('');
  const [countryCode, setCountryCode] = useState<string | undefined>();
  const [countryName, setCountryName] = useState<string | undefined>();
  const [year, setYear] = useState('');
  const [obv, setObv] = useState<string | undefined>();
  const [rev, setRev] = useState<string | undefined>();

  const validate = (): string | null => {
    if (!countryCode) return 'Selecciona el país.';
    if (!/^\d{3,4}$/.test(year)) return 'Introduce un año de 3 o 4 dígitos.';
    return null;
  };

  const searchNumista = () => {
    const err = validate();
    if (err) { Alert.alert('Datos incompletos', err); return; }
    nav.navigate('AddIdentify', {
      obverseUri: obv,
      reverseUri: rev,
      countryCode: countryCode!,
      countryName: countryName!,
      year: parseInt(year, 10),
      query: query.trim() || undefined,
    });
  };

  const saveWithoutNumista = () => {
    const err = validate();
    if (err) { Alert.alert('Datos incompletos', err); return; }
    nav.navigate('AddConfirm', {
      obverseUri: obv,
      reverseUri: rev,
      countryCode: countryCode!,
      countryName: countryName!,
      year: parseInt(year, 10),
      title: query.trim() || undefined,
    });
  };

  const hasObv = !!obv;
  const hasRev = !!rev;

  return (
    <KeyboardScroll>
      <Section
        title="Fotografías"
        description="Opcional. Con foto el reconocimiento es más preciso."
      >
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <PhotoCapture label="Anverso" uri={obv} onCaptured={setObv} />
          </View>
          <View style={{ flex: 1 }}>
            <PhotoCapture label="Reverso" uri={rev} onCaptured={setRev} />
          </View>
        </View>
        {hasObv && (
          <Text style={{ color: colors.ok, fontSize: 12, marginTop: 8 }}>
            {hasRev
              ? 'Ambas fotos capturadas — identificación óptima.'
              : 'Anverso OK. Captura el reverso para mejor identificación.'}
          </Text>
        )}
      </Section>

      <Section
        title="Datos"
        description="País y año son obligatorios. La denominación ayuda a afinar la búsqueda."
      >
        <View style={{ gap: 10 }}>
          <CountryPicker
            value={countryCode}
            onChange={(code, name) => {
              setCountryCode(code);
              setCountryName(name);
            }}
          />
          <Field
            label="Año"
            placeholder="Ej: 2001"
            keyboardType="number-pad"
            value={year}
            onChangeText={setYear}
            maxLength={4}
          />
          <Field
            label="Denominación o nombre (opcional)"
            placeholder="Ej: 50 céntimos"
            value={query}
            onChangeText={setQuery}
          />
        </View>
      </Section>

      <PrimaryButton
        label={hasObv ? 'Identificar con Numista' : 'Buscar en Numista'}
        onPress={searchNumista}
        size="lg"
        fullWidth
      />
      <View style={{ height: 10 }} />
      <PrimaryButton
        label="Guardar sin Numista"
        onPress={saveWithoutNumista}
        variant="ghost"
        size="lg"
        fullWidth
      />
    </KeyboardScroll>
  );
};
