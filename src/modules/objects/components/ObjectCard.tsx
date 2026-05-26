import React from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import type { ObjectItem } from '@/types';
import { useAppConfig } from '@/context/ConfigContext';
import { Badge } from '@/components/Badge';
import { formatCurrency } from '@/utils/format';
import { colors } from '@/theme/colors';

interface Props {
  object: ObjectItem;
  onPress: () => void;
  layout: 'list' | 'grid';
}

const ObjectCardInner: React.FC<Props> = ({ object, onPress, layout }) => {
  const { config } = useAppConfig();
  const cat = config.objectCategories.find((c) => c.id === object.categoryId);
  const t = config.objectTypes.find((x) => x.id === object.typeId);
  const pos = config.possessionStatuses.find(
    (p) => p.id === object.possessionStatusId
  );

  if (layout === 'grid') {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={object.name}
        style={({ pressed }) => ({
          flex: 1,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 14,
          padding: 10,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <View
          style={{
            width: '100%',
            aspectRatio: 1,
            borderRadius: 10,
            overflow: 'hidden',
            backgroundColor: colors.surface2,
          }}
        >
          {object.frontImageUri ? (
            <Image
              source={{ uri: object.frontImageUri }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 28 }}>📦</Text>
            </View>
          )}
        </View>
        <Text
          numberOfLines={1}
          style={{
            color: colors.text,
            fontSize: 13,
            fontWeight: '600',
            marginTop: 8,
          }}
        >
          {object.name}
        </Text>
        <Text
          numberOfLines={1}
          style={{ color: colors.textMuted, fontSize: 11, marginTop: 2 }}
        >
          {t?.name ?? ''}
        </Text>
        <Text
          style={{ color: colors.primary, fontSize: 13, fontWeight: '700', marginTop: 6 }}
          numberOfLines={1}
        >
          {formatCurrency(
            object.ebay_last_price,
            object.ebay_last_price_currency || 'EUR'
          )}
        </Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={object.name}
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
        {object.frontImageUri ? (
          <Image
            source={{ uri: object.frontImageUri }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 28 }}>📦</Text>
          </View>
        )}
      </View>
      <View style={{ flex: 1, justifyContent: 'space-between' }}>
        <Text
          style={{ color: colors.text, fontSize: 15, fontWeight: '600' }}
          numberOfLines={1}
        >
          {object.name}
        </Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 4,
          }}
        >
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, flex: 1 }}>
            {t ? <Badge label={t.name} emoji={t.emoji} /> : null}
            {cat ? (
              <Badge label={cat.name} emoji={cat.emoji} color={cat.color} />
            ) : null}
            {pos ? (
              <Badge label={pos.name} emoji={pos.emoji} color={pos.color} />
            ) : null}
          </View>
          <View style={{ alignItems: 'flex-end', marginLeft: 8 }}>
            <Text style={{ color: colors.primary, fontSize: 15, fontWeight: '700' }}>
              {formatCurrency(
                object.ebay_last_price,
                object.ebay_last_price_currency || 'EUR'
              )}
            </Text>
            {object.ebay_price_not_found ? (
              <Text style={{ color: colors.warn, fontSize: 10, marginTop: 1 }}>
                sin precio
              </Text>
            ) : null}
          </View>
        </View>
      </View>
    </Pressable>
  );
};

export const ObjectCard = React.memo(
  ObjectCardInner,
  (a, b) =>
    a.layout === b.layout &&
    a.object.id === b.object.id &&
    a.object.updatedAt === b.object.updatedAt
);
