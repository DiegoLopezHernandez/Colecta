import React from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import type { CoinItem } from '@/types';
import { useAppConfig } from '@/context/ConfigContext';
import { Badge } from '@/components/Badge';
import { formatCurrency } from '@/utils/format';
import { RARITY_LABEL_ES } from '@/utils/conditions';

interface Props {
  coin: CoinItem;
  onPress: () => void;
  layout: 'list' | 'grid';
}

export const CoinCard: React.FC<Props> = ({ coin, onPress, layout }) => {
  const { config } = useAppConfig();
  const cat = config.coinCategories.find((c) => c.id === coin.categoryId);
  const pos = config.possessionStatuses.find((p) => p.id === coin.possessionStatusId);
  const price =
    coin.ebay_last_price ??
    coin.numista_typical_value ??
    undefined;
  const currency = coin.ebay_last_price_currency || 'EUR';

  if (layout === 'grid') {
    return (
      <Pressable onPress={onPress} className="flex-1 bg-surface m-1 rounded-lg p-2">
        <Image
          source={{ uri: coin.frontImageUri }}
          className="w-full aspect-square rounded-md"
        />
        <Text className="text-white text-xs mt-2 font-semibold" numberOfLines={1}>
          {coin.title}
        </Text>
        <Text className="text-muted text-xs" numberOfLines={1}>
          {coin.country} · {coin.year}
        </Text>
        <View className="flex-row items-center mt-1">
          {coin.ebay_price_not_found ? (
            <Text className="text-accent text-xs mr-2">⚠️</Text>
          ) : null}
          <Text className="text-primary text-xs font-semibold">
            {formatCurrency(price, currency)}
          </Text>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={onPress} className="bg-surface rounded-lg p-3 mb-2 flex-row">
      <Image
        source={{ uri: coin.frontImageUri }}
        className="w-20 h-20 rounded-md mr-3"
      />
      <View className="flex-1">
        <Text className="text-white font-semibold" numberOfLines={1}>
          {coin.title}
        </Text>
        <Text className="text-muted text-xs">
          {coin.country} · {coin.year}
          {coin.denomination ? ` · ${coin.denomination}` : ''}
        </Text>
        <View className="flex-row flex-wrap gap-1 mt-1">
          {cat ? <Badge label={cat.name} emoji={cat.emoji} color={cat.color} /> : null}
          {pos ? <Badge label={pos.name} emoji={pos.emoji} color={pos.color} /> : null}
          {coin.rarity ? (
            <Badge label={RARITY_LABEL_ES[coin.rarity]} color="#a855f7" />
          ) : null}
        </View>
        <View className="flex-row items-center mt-1">
          <Text className="text-primary font-semibold">
            {formatCurrency(price, currency)}
          </Text>
          {coin.ebay_price_not_found ? (
            <Text className="text-accent text-xs ml-2">⚠️ sin precio</Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
};
