import React from 'react';
import { Pressable, View, Text } from 'react-native';
import { colors } from '@/theme/colors';

interface Props {
  label: string;
  value: string;
  onPress: () => void;
}

/**
 * Selector tipo "list-item desplegable": etiqueta arriba en mayúsculas finas,
 * valor abajo y chevron a la derecha. Se usa para conservación, categoría,
 * estado de posesión. Sustituye al Selector local repetido por pantalla.
 */
export const Selector: React.FC<Props> = ({ label, value, onPress }) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={`${label}: ${value}`}
    style={({ pressed }) => ({
      backgroundColor: colors.surface2,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
      opacity: pressed ? 0.7 : 1,
    })}
  >
    <View style={{ flex: 1 }}>
      <Text
        style={{
          color: colors.textSubtle,
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 0.8,
          textTransform: 'uppercase',
          marginBottom: 3,
        }}
      >
        {label}
      </Text>
      <Text style={{ color: colors.text, fontSize: 15, fontWeight: '500' }}>
        {value}
      </Text>
    </View>
    <Text style={{ color: colors.textDim, fontSize: 20, marginLeft: 8 }}>›</Text>
  </Pressable>
);
