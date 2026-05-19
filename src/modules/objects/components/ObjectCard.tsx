import React from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import type { ObjectItem } from '@/types';
import { useAppConfig } from '@/context/ConfigContext';
import { Badge } from '@/components/Badge';
import { formatCurrency } from '@/utils/format';

interface Props {
  object: ObjectItem;
  onPress: () => void;
  layout: 'list' | 'grid';
}

export const ObjectCard: React.FC<Props> = ({ object, onPress, layout }) => {
  const { config } = useAppConfig();
  const cat = config.objectCategories.find((c) => c.id === object.categoryId);
  const t = config.objectTypes.find((x) => x.id === object.typeId);
  const pos = config.possessionStatuses.find(
    (p) => p.id === object.possessionStatusId
  );

  if (layout === 'grid') {
    return (
      <Pressable onPress={onPress} className="flex-1 bg-surface m-1 rounded-lg p-2">
        <Image
          source={{ uri: object.frontImageUri }}
          className="w-full aspect-square rounded-md"
        />
        <Text className="text-white text-xs mt-2 font-semibold" numberOfLines={1}>
          {object.name}
        </Text>
        <Text className="text-muted text-xs" numberOfLines={1}>
          {t?.name ?? ''}
        </Text>
        <Text className="text-primary text-xs font-semibold mt-1">
          {formatCurrency(object.ebay_last_price, object.ebay_last_price_currency || 'EUR')}
        </Text>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={onPress} className="bg-surface rounded-lg p-3 mb-2 flex-row">
      <Image
        source={{ uri: object.frontImageUri }}
        className="w-20 h-20 rounded-md mr-3"
      />
      <View className="flex-1">
        <Text className="text-white font-semibold" numberOfLines={1}>
          {object.name}
        </Text>
        <View className="flex-row flex-wrap gap-1 mt-1">
          {t ? <Badge label={t.name} emoji={t.emoji} /> : null}
          {cat ? <Badge label={cat.name} emoji={cat.emoji} color={cat.color} /> : null}
          {pos ? <Badge label={pos.name} emoji={pos.emoji} color={pos.color} /> : null}
        </View>
        <View className="flex-row items-center mt-1">
          <Text className="text-primary font-semibold">
            {formatCurrency(
              object.ebay_last_price,
              object.ebay_last_price_currency || 'EUR'
            )}
          </Text>
          {object.ebay_price_not_found ? (
            <Text className="text-accent text-xs ml-2">⚠️ sin precio</Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
};
