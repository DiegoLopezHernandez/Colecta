import React from 'react';
import { View, Text } from 'react-native';

interface Props {
  emoji?: string;
  title: string;
  description?: string;
}
export const EmptyState: React.FC<Props> = ({ emoji = '📭', title, description }) => (
  <View className="flex-1 items-center justify-center p-8">
    <Text className="text-6xl mb-3">{emoji}</Text>
    <Text className="text-white text-lg font-semibold text-center">{title}</Text>
    {description ? (
      <Text className="text-muted text-sm text-center mt-1">{description}</Text>
    ) : null}
  </View>
);
