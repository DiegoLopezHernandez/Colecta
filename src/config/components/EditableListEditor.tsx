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
  '#3b82f6',
  '#22c55e',
  '#ef4444',
  '#f59e0b',
  '#a855f7',
  '#ec4899',
  '#14b8a6',
  '#eab308',
  '#06b6d4',
  '#f97316',
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
    <View className="flex-1">
      <Text className="text-white text-xl font-bold mb-3">{title}</Text>
      <ScrollView className="mb-3">
        {entries.map((e, i) => (
          <View key={e.id} className="bg-surface rounded-md p-3 mb-2 flex-row items-center">
            {withEmoji ? (
              <TextInput
                value={e.emoji ?? ''}
                onChangeText={(v) =>
                  onChange(entries.map((x) => (x.id === e.id ? { ...x, emoji: v } : x)))
                }
                className="bg-bg text-white text-lg px-2 py-1 rounded-md mr-2 w-12 text-center"
                maxLength={3}
              />
            ) : null}
            <TextInput
              value={e.name}
              onChangeText={(v) => updateName(e.id, v)}
              className="flex-1 bg-bg text-white px-2 py-1 rounded-md mr-2"
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
                style={{ backgroundColor: e.color ?? '#475569' }}
                className="w-6 h-6 rounded-full mr-2"
              />
            ) : null}
            <Pressable onPress={() => move(e.id, -1)} disabled={i === 0} className="px-2">
              <Text className={`text-lg ${i === 0 ? 'text-surface2' : 'text-white'}`}>▲</Text>
            </Pressable>
            <Pressable
              onPress={() => move(e.id, 1)}
              disabled={i === entries.length - 1}
              className="px-2"
            >
              <Text
                className={`text-lg ${
                  i === entries.length - 1 ? 'text-surface2' : 'text-white'
                }`}
              >
                ▼
              </Text>
            </Pressable>
            <Pressable onPress={() => remove(e.id)} className="px-2">
              <Text className="text-err">🗑</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>

      <View className="bg-surface rounded-md p-3">
        <Text className="text-white font-semibold mb-2">Añadir nuevo</Text>
        <View className="flex-row mb-2">
          {withEmoji ? (
            <TextInput
              value={newEmoji}
              onChangeText={setNewEmoji}
              placeholder="🆕"
              placeholderTextColor="#64748b"
              maxLength={3}
              className="bg-bg text-white text-lg px-2 py-1 rounded-md mr-2 w-12 text-center"
            />
          ) : null}
          <TextInput
            value={newName}
            onChangeText={setNewName}
            placeholder="Nombre"
            placeholderTextColor="#64748b"
            className="flex-1 bg-bg text-white px-2 py-1 rounded-md"
          />
        </View>
        {withColor && (
          <ScrollView horizontal className="mb-2">
            {PALETTE.map((c) => (
              <Pressable
                key={c}
                onPress={() => setNewColor(c)}
                style={{ backgroundColor: c }}
                className={`w-7 h-7 rounded-full mr-2 ${
                  newColor === c ? 'border-2 border-white' : ''
                }`}
              />
            ))}
          </ScrollView>
        )}
        <Pressable onPress={add} className="bg-primary py-2 rounded-md items-center">
          <Text className="text-white font-semibold">Añadir</Text>
        </Pressable>
      </View>
    </View>
  );
};
