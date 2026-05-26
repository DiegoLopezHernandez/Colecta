import React, { useState } from 'react';
import { View, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PhotoCapture } from '@/components/PhotoCapture';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Field } from '@/components/Field';
import { Section } from '@/components/Section';
import { Selector } from '@/components/Selector';
import { KeyboardScroll } from '@/components/KeyboardScroll';
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
    <KeyboardScroll>
      <Section title="Fotografías" description="La principal es obligatoria; la secundaria es opcional.">
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <PhotoCapture label="Principal" uri={obv} onCaptured={setObv} />
          </View>
          <View style={{ flex: 1 }}>
            <PhotoCapture label="Secundaria" uri={rev} onCaptured={setRev} />
          </View>
        </View>
      </Section>

      <Section title="Identificación">
        <Field
          label="Nombre"
          value={name}
          onChangeText={setName}
          placeholder="Ej: Pikachu Holo 1999 #25"
        />
        <View style={{ gap: 10 }}>
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
        </View>
      </Section>

      <PrimaryButton
        label="Buscar en eBay"
        onPress={proceed}
        disabled={!canContinue}
        size="lg"
        fullWidth
      />

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
    </KeyboardScroll>
  );
};
