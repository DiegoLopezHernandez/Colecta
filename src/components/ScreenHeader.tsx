import React from 'react';
import { View, Text } from 'react-native';

interface Props {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}

/**
 * Cabecera de pantalla consistente: título grande + subtítulo opcional + slot derecho
 * para acciones. Sustituye al patrón "Text+Pressable en flex-row" repetido por pantalla.
 */
export const ScreenHeader: React.FC<Props> = ({ title, subtitle, right }) => (
  <View
    style={{
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingTop: 8,
      paddingBottom: 14,
      gap: 12,
    }}
  >
    <View style={{ flex: 1 }}>
      <Text
        style={{
          color: '#F4F4F5',
          fontSize: 24,
          fontWeight: '700',
          letterSpacing: -0.3,
        }}
      >
        {title}
      </Text>
      {subtitle ? (
        <Text
          style={{
            color: '#A1A1AA',
            fontSize: 13,
            marginTop: 2,
          }}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
    {right ? <View style={{ flexDirection: 'row', gap: 8 }}>{right}</View> : null}
  </View>
);
