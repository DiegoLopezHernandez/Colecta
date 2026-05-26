import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';

export const LoadingView: React.FC<{ label?: string }> = ({ label }) => (
  <View
    style={{
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      backgroundColor: '#0B0B0D',
    }}
  >
    <ActivityIndicator size="large" color="#D4A24B" />
    {label ? (
      <Text style={{ color: '#A1A1AA', marginTop: 12, fontSize: 13 }}>{label}</Text>
    ) : null}
  </View>
);
