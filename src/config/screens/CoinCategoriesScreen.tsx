import React from 'react';
import { View } from 'react-native';
import { useAppConfig } from '@/context/ConfigContext';
import { EditableListEditor } from '../components/EditableListEditor';
import type { Category } from '@/types';

export const CoinCategoriesScreen: React.FC = () => {
  const { config, patchConfig } = useAppConfig();
  return (
    <View style={{ flex: 1, backgroundColor: '#0B0B0D', padding: 16 }}>
      <EditableListEditor
        title="Categorías de monedas"
        entries={config.coinCategories}
        withColor
        withEmoji
        onChange={(next) =>
          patchConfig({
            coinCategories: next.map((e) => ({
              id: e.id,
              name: e.name,
              color: e.color ?? '#475569',
              emoji: e.emoji ?? '🪙',
            })) as Category[],
          })
        }
      />
    </View>
  );
};
