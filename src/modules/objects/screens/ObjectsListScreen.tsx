import React, { useCallback, useState } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  type ListRenderItem,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCollection } from '@/context/CollectionContext';
import { ObjectFilters } from '../components/ObjectFilters';
import { ObjectCard } from '../components/ObjectCard';
import { EmptyState } from '@/components/EmptyState';
import { ScreenHeader } from '@/components/ScreenHeader';
import { PrimaryButton } from '@/components/PrimaryButton';
import { IconButton } from '@/components/IconButton';
import { useObjectFilters } from '../hooks/useObjectFilters';
import { colors } from '@/theme/colors';
import type { ObjectsStackParamList } from '../navigation/ObjectsNavigator';
import type { ObjectItem } from '@/types';

type Nav = NativeStackNavigationProp<ObjectsStackParamList, 'ObjectsList'>;
const LIST_ITEM_HEIGHT = 96;

export const ObjectsListScreen: React.FC = () => {
  const { objects, reload } = useCollection();
  const nav = useNavigation<Nav>();
  const [layout, setLayout] = useState<'list' | 'grid'>('list');
  const [refreshing, setRefreshing] = useState(false);
  const { state, setState, filtered } = useObjectFilters(objects);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await reload();
    } finally {
      setRefreshing(false);
    }
  }, [reload]);

  const renderItem: ListRenderItem<ObjectItem> = useCallback(
    ({ item }) => (
      <ObjectCard
        object={item}
        layout={layout}
        onPress={() => nav.navigate('ObjectDetail', { id: item.id })}
      />
    ),
    [layout, nav]
  );

  const getItemLayout = layout === 'list'
    ? (_: unknown, index: number) => ({
        length: LIST_ITEM_HEIGHT,
        offset: LIST_ITEM_HEIGHT * index,
        index,
      })
    : undefined;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <View style={{ flex: 1, paddingHorizontal: 16 }}>
        <ScreenHeader
          title="Mis objetos"
          subtitle={
            objects.length === 0
              ? 'Aún no tienes objetos'
              : `${filtered.length} de ${objects.length} ${objects.length === 1 ? 'objeto' : 'objetos'}`
          }
          right={
            <>
              <IconButton
                icon={layout === 'list' ? 'grid-outline' : 'list-outline'}
                accessibilityLabel="Cambiar disposición"
                onPress={() => setLayout((l) => (l === 'list' ? 'grid' : 'list'))}
              />
              <PrimaryButton
                label="Añadir"
                icon="+"
                size="sm"
                onPress={() => nav.navigate('AddCapture')}
              />
            </>
          }
        />

        <ObjectFilters state={state} onChange={setState} />

        {filtered.length === 0 ? (
          <EmptyState
            emoji="📦"
            title="Sin objetos todavía"
            description={
              objects.length === 0
                ? 'Pulsa “Añadir” para empezar tu colección.'
                : 'Ningún objeto coincide con los filtros actuales.'
            }
          />
        ) : (
          <FlatList
            data={filtered}
            key={layout}
            numColumns={layout === 'grid' ? 2 : 1}
            keyExtractor={(o) => o.id}
            columnWrapperStyle={
              layout === 'grid' ? { gap: 10, marginBottom: 10 } : undefined
            }
            ItemSeparatorComponent={
              layout === 'list' ? () => <View style={{ height: 10 }} /> : undefined
            }
            renderItem={renderItem}
            getItemLayout={getItemLayout}
            removeClippedSubviews
            initialNumToRender={12}
            maxToRenderPerBatch={10}
            windowSize={9}
            contentContainerStyle={{ paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
};
