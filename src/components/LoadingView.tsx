import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';

export const LoadingView: React.FC<{ label?: string }> = ({ label }) => (
  <View className="flex-1 items-center justify-center p-6 bg-bg">
    <ActivityIndicator size="large" color="#3b82f6" />
    {label ? <Text className="text-muted mt-3">{label}</Text> : null}
  </View>
);
