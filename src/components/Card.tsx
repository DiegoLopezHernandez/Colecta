import React from 'react';
import { View, Pressable, ViewProps } from 'react-native';

interface Props extends ViewProps {
  onPress?: () => void;
  padded?: boolean;
}

/**
 * Contenedor de tarjeta consistente: fondo superficie, borde sutil, radio uniforme.
 * Si se pasa onPress, es pulsable con feedback de opacidad.
 */
export const Card: React.FC<Props> = ({
  onPress,
  padded = true,
  children,
  style,
  ...rest
}) => {
  const baseStyle = {
    backgroundColor: '#141417',
    borderWidth: 1,
    borderColor: '#26262B',
    borderRadius: 14,
    padding: padded ? 14 : 0,
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [baseStyle, { opacity: pressed ? 0.7 : 1 }, style]}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View style={[baseStyle, style]} {...rest}>
      {children}
    </View>
  );
};
