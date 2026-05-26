import React, { useCallback, useState } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  useWindowDimensions,
  type ListRenderItem,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCollection } from '@/context/CollectionContext';
import { CoinFilters } from '../components/CoinFilters';
import { CoinCard } from '../components/CoinCard';
import { EmptyState } from '@/components/EmptyState';
import { ScreenHeader } from '@/components/ScreenHeader';
import { PrimaryButton } from '@/components/PrimaryButton';
import { IconButton } from '@/components/IconButton';
import { useCoinFilters } from '../hooks/useCoinFilters';
import { colors } from '@/theme/colors';
import type { CoinsStackParamList } from '../navigation/CoinsNavigator';
import type { CoinItem } from '@/types';
import type { Ionicons } from '@expo/vector-icons';

type Nav = NativeStackNavigationProp<CoinsStackParamList, 'CoinsList'>;
type Layout = 'list' | 'grid2' | 'grid4';

const LAYOUT_CYCLE: Layout[] = ['list', 'grid2', 'grid4'];
const LAYOUT_ICON: Record<Layout, keyof typeof Ionicons.glyphMap> = {
  list: 'list-outline',
  grid2: 'grid-outline',
  grid4: 'apps-outline',
};
const LAYOUT_COLS: Record<Layout, number> = { list: 1, grid2: 2, grid4: 4 };
const ITEM_GAP = 8;
const H_PADDING = 32;
const LIST_ITEM_HEIGHT = 96; // 72 thumb + paddings + separador (aprox)

export const CoinsListScreen: React.FC = () => {
  const { coins, reload } = useCollection();
  const nav = useNavigation<Nav>();
  const [layout, setLayout] = useState<Layout>('list');
  const [refreshing, setRefreshing] = useState(false);
  const { state, setState, filtered } = useCoinFilters(coins);
  const { width: screenWidth } = useWindowDimensions();

  const nextLayout = () =>
    setLayout((l) => {
      const idx = LAYOUT_CYCLE.indexOf(l);
      return LAYOUT_CYCLE[(idx + 1) % LAYOUT_CYCLE.length] as Layout;
    });

  const numCols = LAYOUT_COLS[layout];
  const itemWidth =
    numCols > 1
      ? (screenWidth - H_PADDING - (numCols - 1) * ITEM_GAP) / numCols
      : undefined;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await reload();
    } finally {
      setRefreshing(false);
    }
  }, [reload]);

  const renderItem: ListRenderItem<CoinItem> = useCallback(
    ({ item }) => (
      <CoinCard
        coin={item}
        layout={layout}
        itemWidth={itemWidth}
        onPress={() => nav.navigate('CoinDetail', { id: item.id })}
      />
    ),
    [layout, itemWidth, nav]
  );

  // Solo aplica en layout list: altura fija → getItemLayout para scroll fluido.
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
          title="Mis monedas"
          subtitle={
            coins.length === 0
              ? 'Tu colección está vacía'
              : `${filtered.length} de ${coins.length} ${coins.length === 1 ? 'pieza' : 'piezas'}`
          }
          right={
            <>
              <IconButton
                icon={LAYOUT_ICON[layout]}
                onPress={nextLayout}
                accessibilityLabel="Cambiar disposición"
              />
              <IconButton
                icon="stats-chart-outline"
                onPress={() => nav.navigate('Stats')}
                accessibilityLabel="Estadísticas"
              />
              <PrimaryButton
                label="Añadir"
                icon="+"
                size="sm"
                onPress={() => nav.navigate('AddCoin')}
              />
            </>
          }
        />

        <CoinFilters state={state} onChange={setState} />

        {filtered.length === 0 ? (
          <EmptyState
            emoji="🪙"
            title="Sin monedas todavía"
            description={
              coins.length === 0
                ? 'Pulsa “Añadir” para empezar tu colección.'
                : 'Ninguna moneda coincide con los filtros actuales.'
            }
          />
        ) : (
          <FlatList
            data={filtered}
            key={layout}
            numColumns={numCols}
            keyExtractor={(c) => c.id}
            style={{ flex: 1 }}
            columnWrapperStyle={
              numCols > 1 ? { gap: ITEM_GAP, marginBottom: ITEM_GAP } : undefined
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
