import React from 'react';
import { View, Text } from 'react-native';

interface Props {
  label: string;
  emoji?: string;
  color?: string;
  variant?: 'soft' | 'outline' | 'solid';
}

/**
 * Badge minimalista. Por defecto usa 'soft' (fondo translúcido del color, texto del color).
 * Sin bordes gruesos para evitar ruido visual.
 */
export const Badge: React.FC<Props> = ({
  label,
  emoji,
  color = '#A1A1AA',
  variant = 'soft',
}) => {
  const styles =
    variant === 'solid'
      ? { backgroundColor: color, borderColor: color }
      : variant === 'outline'
      ? { backgroundColor: 'transparent', borderColor: color }
      : { backgroundColor: color + '22', borderColor: 'transparent' };

  const textColor = variant === 'solid' ? '#0B0B0D' : color;

  return (
    <View
      style={styles}
      className="px-2 py-0.5 rounded-md border flex-row items-center self-start"
    >
      {emoji ? <Text className="text-xs mr-1">{emoji}</Text> : null}
      <Text style={{ color: textColor }} className="text-xs font-medium">
        {label}
      </Text>
    </View>
  );
};
