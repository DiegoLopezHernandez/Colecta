import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ScrollViewProps,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { colors } from '@/theme/colors';

interface Props extends ScrollViewProps {
  children: React.ReactNode;
  /** Padding inferior por defecto para que el último botón no quede pegado. */
  bottomPadding?: number;
  containerStyle?: StyleProp<ViewStyle>;
}

/**
 * ScrollView envuelto en KeyboardAvoidingView con los ajustes correctos por
 * plataforma. Evita que el teclado tape los botones de Guardar en formularios.
 */
export const KeyboardScroll: React.FC<Props> = ({
  children,
  bottomPadding = 40,
  contentContainerStyle,
  containerStyle,
  ...rest
}) => (
  <KeyboardAvoidingView
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    style={[{ flex: 1, backgroundColor: colors.bg }, containerStyle]}
  >
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[
        { padding: 16, paddingBottom: bottomPadding },
        contentContainerStyle,
      ]}
      keyboardShouldPersistTaps="handled"
      {...rest}
    >
      {children}
    </ScrollView>
  </KeyboardAvoidingView>
);
