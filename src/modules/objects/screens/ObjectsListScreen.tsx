import React, { useState } from 'react';
import { View, Text, Pressable, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCollection } from '@/context/CollectionContext';
import { ObjectFilters } from '../components/ObjectFilters';
import { ObjectCard } from '../components/ObjectCard';
import { EmptyState } from '@/components/EmptyState';
import { useObjectFilters } from '../hooks/useObjectFilters';
import type { ObjectsStackParamList } from '../navigation/ObjectsNavigator';

type Nav = NativeStackNavigationProp<ObjectsStackParamList, 'ObjectsList'>;

export const ObjectsListScreen: React.FC = () => {
  const { objects } = useCollection();
  const nav = useNavigation<Nav>();
  const [layout, setLayout] = useState<'list' | 'grid'>('list');
  const { state, setState, filtered } = useObjectFilters(objects);

  return (
    <View className="flex-1 bg-bg px-3 pt-2">
      <View className="flex-row items-center mb-2">
        <Text className="text-white text-xl font-bold flex-1">Mis Objetos</Text>
        <Pressable
          onPress={() => setLayout((l) => (l === 'list' ? 'grid' : 'list'))}
          className="bg-surface px-3 py-2 rounded-md mr-2"
        >
          <Text className="text-white text-xs">
            {layout === 'list' ? '▦ Cuadrícula' : '☰ Lista'}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => nav.navigate('AddCapture')}
          className="bg-primary px-3 py-2 rounded-md"
        >
          <Text className="text-white text-xs font-semibold">+ Añadir</Text>
        </Pressable>
      </View>
      <ObjectFilters state={state} onChange={setState} />
      {filtered.length === 0 ? (
        <EmptyState
          emoji="📦"
          title="Sin objetos todavía"
          description="Pulsa + Añadir para empezar."
        />
      ) : (
        <FlatList
          data={filtered}
          key={layout}
          numColumns={layout === 'grid' ? 2 : 1}
          keyExtractor={(o) => o.id}
          renderItem={({ item }) => (
            <ObjectCard
              object={item}
              layout={layout}
              onPress={() => nav.navigate('ObjectDetail', { id: item.id })}
            />
          )}
          contentContainerStyle={{ paddingBottom: 80 }}
        />
      )}
    </View>
  );
};
