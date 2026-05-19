import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  FlatList,
} from 'react-native';
import { COUNTRIES } from '@/utils/countries';

interface Props {
  value?: string; // ISO Alpha-2
  onChange: (code: string, name: string) => void;
  placeholder?: string;
}

export const CountryPicker: React.FC<Props> = ({
  value,
  onChange,
  placeholder = 'Selecciona país',
}) => {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');

  const selected = COUNTRIES.find((c) => c.code === value);
  const filtered = useMemo(() => {
    const norm = q.trim().toLowerCase();
    if (!norm) return COUNTRIES;
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(norm) ||
        c.code.toLowerCase().includes(norm)
    );
  }, [q]);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        className="bg-surface p-3 rounded-md border border-surface2"
      >
        <Text className="text-muted text-xs">País</Text>
        <Text className="text-white text-base mt-1">
          {selected ? `${selected.name} (${selected.code})` : placeholder}
        </Text>
      </Pressable>

      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <View className="flex-1 bg-bg pt-12 px-4">
          <View className="flex-row items-center mb-3">
            <Pressable onPress={() => setOpen(false)} className="mr-3">
              <Text className="text-primary text-base">Cerrar</Text>
            </Pressable>
            <Text className="text-white text-lg font-semibold">Países</Text>
          </View>
          <TextInput
            placeholder="Buscar país…"
            placeholderTextColor="#64748b"
            value={q}
            onChangeText={setQ}
            className="bg-surface text-white px-3 py-2 rounded-md mb-3"
          />
          <FlatList
            data={filtered}
            keyExtractor={(c) => c.code}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  onChange(item.code, item.name);
                  setOpen(false);
                  setQ('');
                }}
                className="py-3 border-b border-surface"
              >
                <Text className="text-white text-base">
                  {item.name}{' '}
                  <Text className="text-muted text-xs">({item.code})</Text>
                </Text>
              </Pressable>
            )}
          />
        </View>
      </Modal>
    </>
  );
};
