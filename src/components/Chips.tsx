import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { colors } from '@/theme/colors';

export interface ChipOption {
  value: string;
  label: string;
}

interface Props {
  label?: string;
  value?: string;
  options: ChipOption[];
  onChange: (v: string | undefined) => void;
  /** Si true, vuelve a hacer toggle al pulsar el activo (limpia el filtro). */
  toggleable?: boolean;
}

/**
 * Fila horizontal de chips estilo pill. Reutilizado en filtros de monedas y objetos.
 * Pulsar un chip activo lo limpia (si `toggleable`, por defecto true).
 */
export const Chips: React.FC<Props> = ({
  label,
  value,
  options,
  onChange,
  toggleable = true,
}) => (
  <View style={{ marginBottom: 10 }}>
    {label ? (
      <Text
        style={{
          color: colors.textSubtle,
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.5,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Text>
    ) : null}
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ gap: 6, paddingTop: 6 }}
    >
      {options.map((o) => {
        const active = value === o.value;
        return (
          <Pressable
            key={o.value}
            onPress={() => {
              if (toggleable && active) onChange(undefined);
              else onChange(o.value);
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={({ pressed }) => ({
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 999,
              backgroundColor: active ? colors.primary : colors.surface2,
              borderWidth: 1,
              borderColor: active ? colors.primary : colors.border,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text
              style={{
                color: active ? colors.primaryFg : colors.text,
                fontSize: 12,
                fontWeight: active ? '700' : '500',
              }}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  </View>
);
