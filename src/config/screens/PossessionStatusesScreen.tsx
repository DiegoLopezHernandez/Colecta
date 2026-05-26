import React from 'react';
import { View } from 'react-native';
import { useAppConfig } from '@/context/ConfigContext';
import { EditableListEditor } from '../components/EditableListEditor';
import type { PossessionStatus } from '@/types';

export const PossessionStatusesScreen: React.FC = () => {
  const { config, patchConfig } = useAppConfig();
  return (
    <View style={{ flex: 1, backgroundColor: '#0B0B0D', padding: 16 }}>
      <EditableListEditor
        title="Estados de posesión"
        entries={config.possessionStatuses}
        withColor
        withEmoji
        onChange={(next) =>
          patchConfig({
            possessionStatuses: next.map((e) => ({
              id: e.id,
              name: e.name,
              emoji: e.emoji ?? '🏷️',
              color: e.color ?? '#475569',
            })) as PossessionStatus[],
          })
        }
      />
    </View>
  );
};
