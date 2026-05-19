import React from 'react';
import { View, Text, Pressable } from 'react-native';

interface Props {
  error: string;
  onRetry?: () => void;
}
export const ErrorView: React.FC<Props> = ({ error, onRetry }) => (
  <View className="flex-1 items-center justify-center p-6 bg-bg">
    <Text className="text-5xl mb-2">⚠️</Text>
    <Text className="text-white text-base font-semibold">Algo ha fallado</Text>
    <Text className="text-muted text-sm text-center mt-2">{error}</Text>
    {onRetry ? (
      <Pressable
        onPress={onRetry}
        className="mt-5 bg-primary px-5 py-3 rounded-lg"
      >
        <Text className="text-white font-semibold">Reintentar</Text>
      </Pressable>
    ) : null}
  </View>
);
