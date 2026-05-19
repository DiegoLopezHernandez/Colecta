import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PhotoCapture } from '@/components/PhotoCapture';
import { CountryPicker } from '@/components/CountryPicker';
import { PrimaryButton } from '@/components/PrimaryButton';
import type { CoinsStackParamList } from '../navigation/CoinsNavigator';

type Nav = NativeStackNavigationProp<CoinsStackParamList, 'AddCapture'>;

export const CoinAddCaptureScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const [obv, setObv] = useState<string | undefined>();
  const [rev, setRev] = useState<string | undefined>();
  const [countryCode, setCountryCode] = useState<string | undefined>();
  const [countryName, setCountryName] = useState<string | undefined>();
  const [year, setYear] = useState<string>('');

  const canContinue = !!obv && !!rev && !!countryCode && /^\d{3,4}$/.test(year);

  const proceed = () => {
    if (!canContinue) {
      Alert.alert('Faltan datos', 'Capture ambas fotos, país y año (4 dígitos).');
      return;
    }
    nav.navigate('AddIdentify', {
      obverseUri: obv!,
      reverseUri: rev!,
      countryCode: countryCode!,
      countryName: countryName!,
      year: parseInt(year, 10),
    });
  };

  return (
    <ScrollView className="flex-1 bg-bg p-3">
      <Text className="text-white text-xl font-bold mb-3">Nueva moneda</Text>
      <PhotoCapture
        label="Anverso (cara)"
        uri={obv}
        onCaptured={setObv}
      />
      <View className="h-3" />
      <PhotoCapture
        label="Reverso (cruz)"
        uri={rev}
        onCaptured={setRev}
      />
      <View className="h-3" />
      <CountryPicker
        value={countryCode}
        onChange={(c, n) => {
          setCountryCode(c);
          setCountryName(n);
        }}
      />
      <View className="h-3" />
      <View className="bg-surface p-3 rounded-md">
        <Text className="text-muted text-xs mb-1">Año</Text>
        <TextInput
          placeholder="Ej: 1998"
          placeholderTextColor="#64748b"
          keyboardType="number-pad"
          value={year}
          onChangeText={setYear}
          className="text-white text-base"
        />
      </View>
      <View className="h-4" />
      <PrimaryButton
        label="Identificar con Numista"
        onPress={proceed}
        disabled={!canContinue}
      />
      <View className="h-16" />
    </ScrollView>
  );
};
