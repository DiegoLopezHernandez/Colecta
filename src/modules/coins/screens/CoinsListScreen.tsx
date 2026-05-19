import React, { useState } from 'react';
import { View, Text, Pressable, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCollection } from '@/context/CollectionContext';
import { CoinFilters } from '../components/CoinFilters';
import { CoinCard } from '../components/CoinCard';
import { EmptyState } from '@/components/EmptyState';
import { useCoinFilters } from '../hooks/useCoinFilters';
import type { CoinsStackParamList } from '../navigation/CoinsNavigator';

type Nav = NativeStackNavigationProp<CoinsStackParamList, 'CoinsList'>;

export const CoinsListScreen: React.FC = () => {
  const { coins } = useCollection();
  const nav = useNavigation<Nav>();
  const [layout, setLayout] = useState<'list' | 'grid'>('list');
  const { state, setState, filtered } = useCoinFilters(coins);

  return (
    <View className="flex-1 bg-bg px-3 pt-2">
      <View className="flex-row items-center mb-2">
        <Text className="text-white text-xl font-bold flex-1">Mis Monedas</Text>
        <Pressable
          onPress={() => setLayout((l) => (l === 'list' ? 'grid' : 'list'))}
          className="bg-surface px-3 py-2 rounded-md mr-2"
        >
          <Text className="text-white text-xs">
            {layout === 'list' ? '▦ Cuadrícula' : '☰ Lista'}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => nav.navigate('Stats')}
          className="bg-surface px-3 py-2 rounded-md mr-2"
        >
          <Text className="text-white text-xs">📊</Text>
        </Pressable>
        <Pressable
          onPress={() => nav.navigate('AddCapture')}
          className="bg-primary px-3 py-2 rounded-md"
        >
          <Text className="text-white text-xs font-semibold">+ Añadir</Text>
        </Pressable>
      </View>

      <CoinFilters state={state} onChange={setState} />

      {filtered.length === 0 ? (
        <EmptyState
          emoji="🪙"
          title="Sin monedas todavía"
          description="Pulsa + Añadir para empezar tu colección."
        />
      ) : (
        <FlatList
          data={filtered}
          key={layout}
          numColumns={layout === 'grid' ? 2 : 1}
          keyExtractor={(c) => c.id}
          renderItem={({ item }) => (
            <CoinCard
              coin={item}
              layout={layout}
              onPress={() => nav.navigate('CoinDetail', { id: item.id })}
            />
          )}
          contentContainerStyle={{ paddingBottom: 80 }}
        />
      )}
    </View>
  );
};
