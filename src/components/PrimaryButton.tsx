import React from 'react';
import { Pressable, Text, ActivityIndicator, View } from 'react-native';
import { colors } from '@/theme/colors';
import { haptic } from '@/utils/haptics';

interface Props {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: string;
  fullWidth?: boolean;
  /** Desactiva el feedback háptico (por defecto activado). */
  noHaptic?: boolean;
}

/**
 * Botón unificado de la app.
 * - primary: dorado sólido (texto oscuro `primaryFg` para contraste accesible)
 * - secondary: superficie elevada, texto claro
 * - ghost: transparente con borde sutil
 * - danger: rojo sólido con texto muy oscuro
 *
 * Da un toque háptico ligero al pulsar (configurable via `noHaptic`).
 */
export const PrimaryButton: React.FC<Props> = ({
  label,
  onPress,
  loading,
  disabled,
  variant = 'primary',
  size = 'md',
  icon,
  fullWidth = false,
  noHaptic = false,
}) => {
  const palette = {
    primary: { bg: colors.primary, fg: colors.primaryFg, border: colors.primary },
    secondary: { bg: colors.surface2, fg: colors.text, border: colors.border },
    ghost: { bg: 'transparent', fg: colors.text, border: colors.borderStrong },
    danger: { bg: colors.err, fg: colors.dangerFg, border: colors.err },
  }[variant];

  const sizing = {
    sm: { paddingV: 8, paddingH: 12, fontSize: 13, radius: 8, spinner: 'small' as const },
    md: { paddingV: 11, paddingH: 16, fontSize: 14, radius: 10, spinner: 'small' as const },
    lg: { paddingV: 14, paddingH: 20, fontSize: 15, radius: 12, spinner: 'small' as const },
  }[size];

  const op = disabled || loading ? 0.5 : 1;

  const handlePress = () => {
    if (!noHaptic) {
      if (variant === 'danger') haptic.warning();
      else haptic.light();
    }
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled, busy: !!loading }}
      style={({ pressed }) => ({
        backgroundColor: palette.bg,
        borderColor: palette.border,
        borderWidth: 1,
        paddingVertical: sizing.paddingV,
        paddingHorizontal: sizing.paddingH,
        borderRadius: sizing.radius,
        opacity: pressed ? op * 0.8 : op,
        alignSelf: fullWidth ? 'stretch' : 'auto',
      })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
        {loading ? (
          <ActivityIndicator size={sizing.spinner} color={palette.fg} />
        ) : (
          <>
            {icon ? (
              <Text
                style={{ color: palette.fg, fontSize: sizing.fontSize, marginRight: 6 }}
              >
                {icon}
              </Text>
            ) : null}
            <Text
              style={{
                color: palette.fg,
                fontSize: sizing.fontSize,
                fontWeight: '600',
                letterSpacing: 0.1,
              }}
            >
              {label}
            </Text>
          </>
        )}
      </View>
    </Pressable>
  );
};
