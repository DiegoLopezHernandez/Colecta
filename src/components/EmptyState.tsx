import React from 'react';
import { View, Text } from 'react-native';

interface Props {
  emoji?: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export const EmptyState: React.FC<Props> = ({
  emoji = '📭',
  title,
  description,
  children,
}) => (
  <View className="flex-1 items-center justify-center px-8 py-12">
    <View
      style={{
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#141417',
        borderWidth: 1,
        borderColor: '#26262B',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
      }}
    >
      <Text style={{ fontSize: 32 }}>{emoji}</Text>
    </View>
    <Text
      style={{
        color: '#F4F4F5',
        fontSize: 17,
        fontWeight: '600',
        textAlign: 'center',
      }}
    >
      {title}
    </Text>
    {description ? (
      <Text
        style={{
          color: '#A1A1AA',
          fontSize: 13,
          lineHeight: 19,
          textAlign: 'center',
          marginTop: 6,
          maxWidth: 280,
        }}
      >
        {description}
      </Text>
    ) : null}
    {children ? <View style={{ marginTop: 16 }}>{children}</View> : null}
  </View>
);
