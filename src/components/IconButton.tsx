import React from 'react';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';

interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  accessibilityLabel?: string;
  size?: number;
}

/**
 * Botón cuadrado 36x36 con borde sutil. Usado en headers junto a PrimaryButton
 * para acciones secundarias (cambiar layout, estadísticas, etc.).
 */
export const IconButton: React.FC<Props> = ({
  icon,
  onPress,
  accessibilityLabel,
  size = 16,
}) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel}
    hitSlop={6}
    style={({ pressed }) => ({
      width: 36,
      height: 36,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      opacity: pressed ? 0.7 : 1,
    })}
  >
    <Ionicons name={icon} size={size} color={colors.text} />
  </Pressable>
);
