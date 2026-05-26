import React from 'react';
import { View, Text } from 'react-native';
import { PrimaryButton } from './PrimaryButton';

interface Props {
  error: string;
  onRetry?: () => void;
}
export const ErrorView: React.FC<Props> = ({ error, onRetry }) => (
  <View
    style={{
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      backgroundColor: '#0B0B0D',
    }}
  >
    <View
      style={{
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#2A1414',
        borderWidth: 1,
        borderColor: '#F87171',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
      }}
    >
      <Text style={{ fontSize: 28 }}>⚠️</Text>
    </View>
    <Text
      style={{
        color: '#F4F4F5',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
      }}
    >
      Algo ha fallado
    </Text>
    <Text
      style={{
        color: '#A1A1AA',
        fontSize: 13,
        lineHeight: 19,
        textAlign: 'center',
        marginTop: 6,
        maxWidth: 300,
      }}
    >
      {error}
    </Text>
    {onRetry ? (
      <View style={{ marginTop: 18 }}>
        <PrimaryButton label="Reintentar" onPress={onRetry} />
      </View>
    ) : null}
  </View>
);
