import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COUNTRIES } from '@/utils/countries';

interface Props {
  value?: string; // ISO Alpha-2
  onChange: (code: string, name: string) => void;
  placeholder?: string;
  label?: string;
}

export const CountryPicker: React.FC<Props> = ({
  value,
  onChange,
  placeholder = 'Selecciona país',
  label = 'País',
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
        style={({ pressed }) => ({
          backgroundColor: '#1C1C20',
          borderRadius: 10,
          borderWidth: 1,
          borderColor: '#26262B',
          paddingVertical: 10,
          paddingHorizontal: 12,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Text
          style={{
            color: '#71717A',
            fontSize: 11,
            fontWeight: '600',
            letterSpacing: 0.5,
            textTransform: 'uppercase',
          }}
        >
          {label}
        </Text>
        <Text
          style={{
            color: selected ? '#F4F4F5' : '#71717A',
            fontSize: 15,
            marginTop: 4,
          }}
        >
          {selected ? `${selected.name} (${selected.code})` : placeholder}
        </Text>
      </Pressable>

      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#0B0B0D' }} edges={['top']}>
          <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 14,
              }}
            >
              <Pressable onPress={() => setOpen(false)} hitSlop={8}>
                <Text style={{ color: '#D4A24B', fontSize: 15, fontWeight: '500' }}>
                  Cerrar
                </Text>
              </Pressable>
              <Text
                style={{
                  color: '#F4F4F5',
                  fontSize: 17,
                  fontWeight: '600',
                  marginLeft: 16,
                }}
              >
                Países
              </Text>
            </View>
            <TextInput
              placeholder="Buscar país…"
              placeholderTextColor="#71717A"
              value={q}
              onChangeText={setQ}
              style={{
                backgroundColor: '#1C1C20',
                borderWidth: 1,
                borderColor: '#26262B',
                color: '#F4F4F5',
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderRadius: 10,
                fontSize: 15,
                marginBottom: 12,
              }}
            />
          </View>
          <FlatList
            data={filtered}
            keyExtractor={(c) => c.code}
            style={{ flex: 1 }}
            keyboardShouldPersistTaps="handled"
            initialNumToRender={30}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  onChange(item.code, item.name);
                  setOpen(false);
                  setQ('');
                }}
                style={({ pressed }) => ({
                  paddingVertical: 13,
                  borderBottomWidth: 1,
                  borderBottomColor: '#1C1C20',
                  opacity: pressed ? 0.6 : 1,
                })}
              >
                <Text style={{ color: '#F4F4F5', fontSize: 15 }}>
                  {item.name}{' '}
                  <Text style={{ color: '#71717A', fontSize: 12 }}>({item.code})</Text>
                </Text>
              </Pressable>
            )}
          />
        </SafeAreaView>
      </Modal>
    </>
  );
};
