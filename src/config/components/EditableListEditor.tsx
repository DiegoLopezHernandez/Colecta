import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  ScrollView,
} from 'react-native';
import { newId } from '@/utils/id';
import { PrimaryButton } from '@/components/PrimaryButton';

export interface ListEntry {
  id: string;
  name: string;
  color?: string;
  emoji?: string;
}

interface Props {
  title: string;
  entries: ListEntry[];
  withColor: boolean;
  withEmoji: boolean;
  onChange: (next: ListEntry[]) => void;
}

const PALETTE = [
  '#D4A24B',
  '#4ADE80',
  '#F87171',
  '#FBBF24',
  '#C084FC',
  '#F472B6',
  '#2DD4BF',
  '#FCD34D',
  '#22D3EE',
  '#FB923C',
];

export const EditableListEditor: React.FC<Props> = ({
  title,
  entries,
  withColor,
  withEmoji,
  onChange,
}) => {
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState('');
  const [newColor, setNewColor] = useState(PALETTE[0]!);

  const add = () => {
    if (!newName.trim()) return;
    const e: ListEntry = {
      id: newId(),
      name: newName.trim(),
      emoji: withEmoji ? newEmoji || '📦' : undefined,
      color: withColor ? newColor : undefined,
    };
    onChange([...entries, e]);
    setNewName('');
    setNewEmoji('');
  };

  const remove = (id: string) =>
    Alert.alert('Eliminar', '¿Eliminar este elemento?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => onChange(entries.filter((e) => e.id !== id)),
      },
    ]);

  const move = (id: string, dir: -1 | 1) => {
    const idx = entries.findIndex((e) => e.id === id);
    if (idx < 0) return;
    const target = idx + dir;
    if (target < 0 || target >= entries.length) return;
    const next = [...entries];
    const [it] = next.splice(idx, 1);
    next.splice(target, 0, it!);
    onChange(next);
  };

  const updateName = (id: string, name: string) =>
    onChange(entries.map((e) => (e.id === id ? { ...e, name } : e)));

  return (
    <View style={{ flex: 1, backgroundColor: '#0B0B0D' }}>
      <Text
        style={{
          color: '#F4F4F5',
          fontSize: 22,
          fontWeight: '700',
          letterSpacing: -0.3,
          marginBottom: 16,
        }}
      >
        {title}
      </Text>

      <ScrollView style={{ flex: 1, marginBottom: 12 }} showsVerticalScrollIndicator={false}>
        {entries.map((e, i) => (
          <View
            key={e.id}
            style={{
              backgroundColor: '#141417',
              borderWidth: 1,
              borderColor: '#26262B',
              borderRadius: 12,
              padding: 10,
              marginBottom: 8,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
            }}
          >
            {withEmoji ? (
              <TextInput
                value={e.emoji ?? ''}
                onChangeText={(v) =>
                  onChange(
                    entries.map((x) =>
                      x.id === e.id ? { ...x, emoji: v } : x
                    )
                  )
                }
                style={{
                  width: 44,
                  textAlign: 'center',
                  backgroundColor: '#1C1C20',
                  color: '#F4F4F5',
                  fontSize: 18,
                  paddingVertical: 6,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: '#26262B',
                }}
                maxLength={3}
              />
            ) : null}
            <TextInput
              value={e.name}
              onChangeText={(v) => updateName(e.id, v)}
              placeholderTextColor="#71717A"
              style={{
                flex: 1,
                backgroundColor: '#1C1C20',
                color: '#F4F4F5',
                fontSize: 14,
                paddingHorizontal: 10,
                paddingVertical: 8,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#26262B',
              }}
            />
            {withColor ? (
              <Pressable
                onPress={() =>
                  onChange(
                    entries.map((x) =>
                      x.id === e.id
                        ? {
                            ...x,
                            color:
                              PALETTE[
                                (PALETTE.indexOf(x.color ?? PALETTE[0]!) + 1) %
                                  PALETTE.length
                              ],
                          }
                        : x
                    )
                  )
                }
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: e.color ?? '#475569',
                  borderWidth: 2,
                  borderColor: '#26262B',
                }}
              />
            ) : null}
            <IconBtn
              symbol="▲"
              onPress={() => move(e.id, -1)}
              disabled={i === 0}
            />
            <IconBtn
              symbol="▼"
              onPress={() => move(e.id, 1)}
              disabled={i === entries.length - 1}
            />
            <IconBtn symbol="🗑" onPress={() => remove(e.id)} />
          </View>
        ))}
      </ScrollView>

      <View
        style={{
          backgroundColor: '#141417',
          borderWidth: 1,
          borderColor: '#26262B',
          borderRadius: 14,
          padding: 12,
        }}
      >
        <Text
          style={{
            color: '#71717A',
            fontSize: 11,
            fontWeight: '600',
            letterSpacing: 0.6,
            textTransform: 'uppercase',
            marginBottom: 10,
          }}
        >
          Añadir nuevo
        </Text>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
          {withEmoji ? (
            <TextInput
              value={newEmoji}
              onChangeText={setNewEmoji}
              placeholder="🆕"
              placeholderTextColor="#71717A"
              maxLength={3}
              style={{
                width: 48,
                textAlign: 'center',
                backgroundColor: '#1C1C20',
                color: '#F4F4F5',
                fontSize: 18,
                paddingVertical: 9,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: '#26262B',
              }}
            />
          ) : null}
          <TextInput
            value={newName}
            onChangeText={setNewName}
            placeholder="Nombre"
            placeholderTextColor="#71717A"
            style={{
              flex: 1,
              backgroundColor: '#1C1C20',
              color: '#F4F4F5',
              fontSize: 14,
              paddingHorizontal: 12,
              paddingVertical: 9,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: '#26262B',
            }}
          />
        </View>
        {withColor && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, marginBottom: 12 }}
          >
            {PALETTE.map((c) => {
              const selected = newColor === c;
              return (
                <Pressable
                  key={c}
                  onPress={() => setNewColor(c)}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 15,
                    backgroundColor: c,
                    borderWidth: 2,
                    borderColor: selected ? '#F4F4F5' : 'transparent',
                  }}
                />
              );
            })}
          </ScrollView>
        )}
        <PrimaryButton label="Añadir" onPress={add} fullWidth />
      </View>
    </View>
  );
};

const IconBtn: React.FC<{
  symbol: string;
  onPress: () => void;
  disabled?: boolean;
}> = ({ symbol, onPress, disabled }) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    style={({ pressed }) => ({
      width: 30,
      height: 30,
      borderRadius: 8,
      backgroundColor: '#1C1C20',
      borderWidth: 1,
      borderColor: '#26262B',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: disabled ? 0.35 : pressed ? 0.6 : 1,
    })}
  >
    <Text style={{ color: '#F4F4F5', fontSize: 13 }}>{symbol}</Text>
  </Pressable>
);
