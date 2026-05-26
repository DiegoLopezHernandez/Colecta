import React from 'react';
import { View, Text } from 'react-native';
import { colors } from '@/theme/colors';

interface Props {
  k: string;
  v: string | number | undefined | null;
  last?: boolean;
}

/**
 * Fila clave/valor con clave de ancho fijo y valor flex:1 alineado a la derecha.
 * Sustituye a la implementación local repetida en CoinDetail / CoinAddConfirm /
 * CoinEdit. Si v está vacío, muestra un guion largo.
 */
export const DataRow: React.FC<Props> = ({ k, v, last }) => (
  <View
    style={{
      flexDirection: 'row',
      paddingVertical: 8,
      borderBottomWidth: last ? 0 : 1,
      borderBottomColor: colors.borderSubtle,
      alignItems: 'flex-start',
    }}
  >
    <Text
      style={{
        color: colors.textMuted,
        fontSize: 12,
        width: 96,
        flexShrink: 0,
        lineHeight: 18,
      }}
    >
      {k}
    </Text>
    <Text
      style={{
        color: colors.text,
        fontSize: 13,
        fontWeight: '500',
        flex: 1,
        textAlign: 'right',
        lineHeight: 18,
      }}
    >
      {v === undefined || v === null || v === '' ? '—' : String(v)}
    </Text>
  </View>
);
