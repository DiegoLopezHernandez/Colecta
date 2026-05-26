import React, { useState } from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';

interface Props extends Omit<TextInputProps, 'style'> {
  label?: string;
  hint?: string;
  error?: string;
}

/**
 * Input de texto unificado: corrige el problema de "letras negras sobre fondo azul"
 * forzando siempre el color de texto y placeholder. Etiqueta en mayúsculas finas
 * arriba para sensación de formulario profesional.
 */
export const Field: React.FC<Props> = ({ label, hint, error, ...rest }) => {
  const [focused, setFocused] = useState(false);

  return (
    <View style={{ marginBottom: 12 }}>
      {label ? (
        <Text
          style={{
            color: '#A1A1AA',
            fontSize: 11,
            fontWeight: '600',
            letterSpacing: 0.6,
            textTransform: 'uppercase',
            marginBottom: 6,
          }}
        >
          {label}
        </Text>
      ) : null}
      <TextInput
        {...rest}
        onFocus={(e) => {
          setFocused(true);
          rest.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          rest.onBlur?.(e);
        }}
        placeholderTextColor="#71717A"
        style={{
          backgroundColor: '#1C1C20',
          borderWidth: 1,
          borderColor: error ? '#F87171' : focused ? '#D4A24B' : '#26262B',
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 10,
          color: '#F4F4F5',
          fontSize: 15,
          minHeight: 42,
        }}
      />
      {error ? (
        <Text style={{ color: '#F87171', fontSize: 12, marginTop: 4 }}>{error}</Text>
      ) : hint ? (
        <Text style={{ color: '#71717A', fontSize: 12, marginTop: 4 }}>{hint}</Text>
      ) : null}
    </View>
  );
};
