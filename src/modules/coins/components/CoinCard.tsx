import React from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import type { CoinItem } from '@/types';
import { useAppConfig } from '@/context/ConfigContext';
import { Badge } from '@/components/Badge';
import { formatCurrency } from '@/utils/format';
import { RARITY_LABEL_ES } from '@/utils/conditions';
import { colors } from '@/theme/colors';

type Layout = 'list' | 'grid2' | 'grid4';

interface Props {
  coin: CoinItem;
  onPress: () => void;
  layout: Layout;
  itemWidth?: number;
}

const CoinCardInner: React.FC<Props> = ({ coin, onPress, layout, itemWidth }) => {
  const { config } = useAppConfig();
  const cat = config.coinCategories.find((c) => c.id === coin.categoryId);
  const pos = config.possessionStatuses.find((p) => p.id === coin.possessionStatusId);
  const price = coin.ebay_last_price ?? coin.numista_typical_value ?? undefined;
  const currency = coin.ebay_last_price_currency || 'EUR';

  // Foto propia > imagen oficial Numista > nada
  const imageUri = coin.frontImageUri || coin.officialObverseUrl || undefined;
  const isOfficialOnly = !coin.frontImageUri && !!coin.officialObverseUrl;

  if (layout === 'grid2' || layout === 'grid4') {
    const isSmall = layout === 'grid4';
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={coin.title}
        style={({ pressed }) => ({
          width: itemWidth,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 12,
          padding: isSmall ? 6 : 10,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <View
          style={{
            width: '100%',
            aspectRatio: 1,
            borderRadius: 8,
            overflow: 'hidden',
            backgroundColor: colors.surface2,
          }}
        >
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={{ width: '100%', height: '100%' }}
              resizeMode={isOfficialOnly ? 'contain' : 'cover'}
            />
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: isSmall ? 18 : 28 }}>🪙</Text>
            </View>
          )}
        </View>
        <Text
          numberOfLines={1}
          style={{
            color: colors.text,
            fontSize: isSmall ? 10 : 13,
            fontWeight: '600',
            marginTop: isSmall ? 4 : 8,
          }}
        >
          {coin.title}
        </Text>
        {!isSmall && (
          <Text numberOfLines={1} style={{ color: colors.textMuted, fontSize: 11, marginTop: 2 }}>
            {coin.country} · {coin.year}
          </Text>
        )}
        {!isSmall && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 6 }}>
            <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700' }} numberOfLines={1}>
              {formatCurrency(price, currency)}
            </Text>
            {coin.ebay_price_not_found ? (
              <Text style={{ color: colors.warn, fontSize: 11 }}>!</Text>
            ) : null}
          </View>
        )}
      </Pressable>
    );
  }

  // layout === 'list'
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={coin.title}
      style={({ pressed }) => ({
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 14,
        padding: 12,
        flexDirection: 'row',
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 10,
          overflow: 'hidden',
          backgroundColor: colors.surface2,
          marginRight: 12,
        }}
      >
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={{ width: '100%', height: '100%' }}
            resizeMode={isOfficialOnly ? 'contain' : 'cover'}
          />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 28 }}>🪙</Text>
          </View>
        )}
      </View>
      <View style={{ flex: 1, justifyContent: 'space-between' }}>
        <View>
          <Text style={{ color: colors.text, fontSize: 15, fontWeight: '600' }} numberOfLines={1}>
            {coin.title}
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }} numberOfLines={1}>
            {coin.country} · {coin.year}
            {coin.denomination ? ` · ${coin.denomination}` : ''}
          </Text>
        </View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 6,
          }}
        >
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, flex: 1 }}>
            {cat ? <Badge label={cat.name} emoji={cat.emoji} color={cat.color} /> : null}
            {pos ? <Badge label={pos.name} emoji={pos.emoji} color={pos.color} /> : null}
            {coin.rarity ? <Badge label={RARITY_LABEL_ES[coin.rarity]} color={colors.rarity} /> : null}
          </View>
          <View style={{ alignItems: 'flex-end', marginLeft: 8 }}>
            <Text style={{ color: colors.primary, fontSize: 15, fontWeight: '700' }}>
              {formatCurrency(price, currency)}
            </Text>
            {coin.ebay_price_not_found ? (
              <Text style={{ color: colors.warn, fontSize: 10, marginTop: 1 }}>sin precio</Text>
            ) : null}
          </View>
        </View>
      </View>
    </Pressable>
  );
};

/**
 * Memoizado: solo se re-renderiza si cambia la propia moneda (por id/updatedAt)
 * o el layout. Esto reduce drásticamente los re-renders al filtrar/escribir en
 * la búsqueda.
 */
export const CoinCard = React.memo(
  CoinCardInner,
  (a, b) =>
    a.layout === b.layout &&
    a.itemWidth === b.itemWidth &&
    a.coin.id === b.coin.id &&
    a.coin.updatedAt === b.coin.updatedAt
);
