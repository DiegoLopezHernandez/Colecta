import React from 'react';
import { View, Text } from 'react-native';

interface Props {
  title: string;
  description?: string;
  children: React.ReactNode;
}
export const Section: React.FC<Props> = ({ title, description, children }) => (
  <View className="mb-5">
    <Text className="text-white text-base font-semibold mb-1">{title}</Text>
    {description ? (
      <Text className="text-muted text-xs mb-2">{description}</Text>
    ) : null}
    <View>{children}</View>
  </View>
);
