import React from 'react';
import { Pressable, Text, ActivityIndicator, View } from 'react-native';

interface Props {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
}
export const PrimaryButton: React.FC<Props> = ({
  label,
  onPress,
  loading,
  disabled,
  variant = 'primary',
}) => {
  const bg =
    variant === 'primary'
      ? 'bg-primary'
      : variant === 'danger'
      ? 'bg-err'
      : 'bg-surface2';
  const op = disabled || loading ? 'opacity-50' : '';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={`${bg} ${op} py-3 px-4 rounded-lg`}
    >
      <View className="flex-row items-center justify-center">
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-semibold">{label}</Text>
        )}
      </View>
    </Pressable>
  );
};
