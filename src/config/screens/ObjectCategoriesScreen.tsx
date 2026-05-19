import React from 'react';
import { View } from 'react-native';
import { useAppConfig } from '@/context/ConfigContext';
import { EditableListEditor } from '../components/EditableListEditor';
import type { Category } from '@/types';

export const ObjectCategoriesScreen: React.FC = () => {
  const { config, patchConfig } = useAppConfig();
  return (
    <View className="flex-1 bg-bg p-3">
      <EditableListEditor
        title="Categorías de objetos"
        entries={config.objectCategories}
        withColor
        withEmoji
        onChange={(next) =>
          patchConfig({
            objectCategories: next.map((e) => ({
              id: e.id,
              name: e.name,
              color: e.color ?? '#475569',
              emoji: e.emoji ?? '📦',
            })) as Category[],
          })
        }
      />
    </View>
  );
};
