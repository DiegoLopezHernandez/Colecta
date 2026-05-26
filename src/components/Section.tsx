import React from 'react';
import { View, Text } from 'react-native';

interface Props {
  title?: string;
  description?: string;
  children: React.ReactNode;
  /** Renderiza el contenido dentro de una tarjeta con fondo de superficie. */
  card?: boolean;
}

/**
 * Bloque de sección con espaciado y jerarquía tipográfica consistentes.
 * Usar `card` cuando los hijos deban ir agrupados visualmente sobre un fondo elevado.
 */
export const Section: React.FC<Props> = ({ title, description, children, card }) => (
  <View className="mb-6">
    {title ? (
      <Text
        style={{
          color: '#A1A1AA',
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 1,
          textTransform: 'uppercase',
          marginBottom: description ? 4 : 8,
        }}
      >
        {title}
      </Text>
    ) : null}
    {description ? (
      <Text style={{ color: '#71717A', fontSize: 12, marginBottom: 10 }}>
        {description}
      </Text>
    ) : null}
    {card ? (
      <View
        style={{
          backgroundColor: '#141417',
          borderRadius: 14,
          borderWidth: 1,
          borderColor: '#26262B',
          padding: 14,
        }}
      >
        {children}
      </View>
    ) : (
      <View>{children}</View>
    )}
  </View>
);
