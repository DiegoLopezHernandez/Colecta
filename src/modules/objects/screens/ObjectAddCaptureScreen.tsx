import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PhotoCapture } from '@/components/PhotoCapture';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useAppConfig } from '@/context/ConfigContext';
import { PickerSheet } from '@/components/PickerSheet';
import type { ObjectsStackParamList } from '../navigation/ObjectsNavigator';

type Nav = NativeStackNavigationProp<ObjectsStackParamList, 'AddCapture'>;

export const ObjectAddCaptureScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const { config } = useAppConfig();
  const [obv, setObv] = useState<string | undefined>();
  const [rev, setRev] = useState<string | undefined>();
  const [name, setName] = useState('');
  const [typeId, setTypeId] = useState(config.objectTypes[0]?.id ?? '');
  const [categoryId, setCategoryId] = useState(
    config.objectCategories[0]?.id ?? ''
  );
  const [pickerOpen, setPickerOpen] = useState<null | 'type' | 'category'>(null);

  const t = config.objectTypes.find((x) => x.id === typeId);
  const c = config.objectCategories.find((x) => x.id === categoryId);

  const canContinue = !!obv && !!name.trim();

  const proceed = () => {
    if (!canContinue) {
      Alert.alert('Faltan datos', 'Captura al menos la foto principal y el nombre.');
      return;
    }
    nav.navigate('AddConfirm', {
      obverseUri: obv!,
      reverseUri: rev,
      name: name.trim(),
      typeId,
      categoryId,
    });
  };

  return (
    <ScrollView className="flex-1 bg-bg p-3">
      <Text className="text-white text-xl font-bold mb-3">Nuevo objeto</Text>
      <PhotoCapture label="Foto principal" uri={obv} onCaptured={setObv} />
      <View className="h-3" />
      <PhotoCapture label="Foto secundaria (opcional)" uri={rev} onCaptured={setRev} />
      <View className="h-3" />
      <View className="bg-surface p-3 rounded-md mb-2">
        <Text className="text-muted text-xs mb-1">Nombre</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Ej: Pikachu Holo 1999 #25"
          placeholderTextColor="#64748b"
          className="text-white text-base"
        />
      </View>
      <Selector
        label="Tipo"
        value={t ? `${t.emoji} ${t.name}` : '—'}
        onPress={() => setPickerOpen('type')}
      />
      <Selector
        label="Categoría"
        value={c ? `${c.emoji} ${c.name}` : '—'}
        onPress={() => setPickerOpen('category')}
      />
      <View className="h-4" />
      <PrimaryButton
        label="Buscar en eBay"
        onPress={proceed}
        disabled={!canContinue}
      />
      <View className="h-16" />

      <PickerSheet
        title="Tipo"
        open={pickerOpen === 'type'}
        options={config.objectTypes.map((x) => ({
          value: x.id,
          label: x.name,
          emoji: x.emoji,
        }))}
        selectedValue={typeId}
        onSelect={setTypeId}
        onClose={() => setPickerOpen(null)}
      />
      <PickerSheet
        title="Categoría"
        open={pickerOpen === 'category'}
        options={config.objectCategories.map((x) => ({
          value: x.id,
          label: x.name,
          emoji: x.emoji,
          color: x.color,
        }))}
        selectedValue={categoryId}
        onSelect={setCategoryId}
        onClose={() => setPickerOpen(null)}
      />
    </ScrollView>
  );
};

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
