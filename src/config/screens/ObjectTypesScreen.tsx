import React from 'react';
import { View } from 'react-native';
import { useAppConfig } from '@/context/ConfigContext';
import { EditableListEditor } from '../components/EditableListEditor';
import type { ObjectType } from '@/types';

export const ObjectTypesScreen: React.FC = () => {
  const { config, patchConfig } = useAppConfig();
  return (
    <View style={{ flex: 1, backgroundColor: '#0B0B0D', padding: 16 }}>
      <EditableListEditor
        title="Tipos de objetos"
        entries={config.objectTypes}
        withColor={false}
        withEmoji
        onChange={(next) =>
          patchConfig({
            objectTypes: next.map((e) => ({
              id: e.id,
              name: e.name,
              emoji: e.emoji ?? '📦',
            })) as ObjectType[],
          })
        }
      />
    </View>
  );
};
