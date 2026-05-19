import React from 'react';
import { View, Text } from 'react-native';

interface Props {
  label: string;
  emoji?: string;
  color?: string;
}
export const Badge: React.FC<Props> = ({ label, emoji, color = '#475569' }) => (
  <View
    style={{ backgroundColor: color + '33', borderColor: color }}
    className="px-2 py-0.5 rounded-full border flex-row items-center"
  >
    {emoji ? <Text className="text-xs mr-1">{emoji}</Text> : null}
    <Text style={{ color }} className="text-xs font-medium">
      {label}
    </Text>
  </View>
);
