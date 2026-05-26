import React from 'react';
import { View, Image, Pressable, StatusBar, Modal, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  GestureHandlerRootView,
  GestureDetector,
  Gesture,
} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { colors } from '@/theme/colors';

interface Props {
  uri: string | null;
  onClose: () => void;
}

const AnimatedImage = Animated.createAnimatedComponent(Image);

/**
 * Visor de imagen a pantalla completa con:
 *   - Pellizco para zoom (1x a 5x).
 *   - Arrastrar para mover la imagen cuando está ampliada.
 *   - Arrastrar verticalmente para cerrar (cuando NO está ampliada).
 *   - Doble tap para alternar zoom 1x ↔ 2.5x centrado en el punto pulsado.
 *
 * Implementado con Gesture Handler API moderna (Gesture.Race/Simultaneous) y
 * Reanimated 3, sin instalar dependencias extra (ya vienen con Expo SDK 51).
 */
export const ImageZoomViewer: React.FC<Props> = ({ uri, onClose }) => {
  const { width: W, height: H } = useWindowDimensions();

  const scale = useSharedValue(1);
  const startScale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const startTx = useSharedValue(0);
  const startTy = useSharedValue(0);

  const reset = () => {
    scale.value = withTiming(1);
    tx.value = withTiming(0);
    ty.value = withTiming(0);
  };

  const closeAnimated = () => {
    'worklet';
    runOnJS(onClose)();
  };

  // Pinch para zoom
  const pinch = Gesture.Pinch()
    .onStart(() => {
      startScale.value = scale.value;
    })
    .onUpdate((e) => {
      scale.value = Math.max(1, Math.min(5, startScale.value * e.scale));
    })
    .onEnd(() => {
      if (scale.value < 1.05) {
        scale.value = withTiming(1);
        tx.value = withTiming(0);
        ty.value = withTiming(0);
      }
    });

  // Pan: si zoom > 1 mueve la imagen; si zoom = 1, gestiona el swipe para cerrar
  const pan = Gesture.Pan()
    .onStart(() => {
      startTx.value = tx.value;
      startTy.value = ty.value;
    })
    .onUpdate((e) => {
      if (scale.value > 1) {
        tx.value = startTx.value + e.translationX;
        ty.value = startTy.value + e.translationY;
      } else {
        // En 1x solo se permite arrastrar verticalmente (para cerrar)
        ty.value = e.translationY;
      }
    })
    .onEnd((e) => {
      if (scale.value <= 1) {
        // Si el arrastre vertical superó un umbral, cerrar
        if (Math.abs(e.translationY) > 120 || Math.abs(e.velocityY) > 800) {
          closeAnimated();
        } else {
          ty.value = withTiming(0);
        }
      } else {
        // Limitar pan dentro de los bordes aproximados
        const maxX = ((scale.value - 1) * W) / 2;
        const maxY = ((scale.value - 1) * H) / 2;
        if (tx.value > maxX) tx.value = withTiming(maxX);
        if (tx.value < -maxX) tx.value = withTiming(-maxX);
        if (ty.value > maxY) ty.value = withTiming(maxY);
        if (ty.value < -maxY) ty.value = withTiming(-maxY);
      }
    });

  // Doble tap: zoom toggle
  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > 1) {
        scale.value = withTiming(1);
        tx.value = withTiming(0);
        ty.value = withTiming(0);
      } else {
        scale.value = withTiming(2.5);
      }
    });

  const composed = Gesture.Simultaneous(pinch, pan, doubleTap);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { scale: scale.value },
    ],
  }));

  // Fondo: se atenúa con el arrastre vertical para dar feedback de "cerrar"
  const backdropStyle = useAnimatedStyle(() => {
    if (scale.value > 1) return { opacity: 1 };
    const dist = Math.min(Math.abs(ty.value), 200);
    return { opacity: 1 - dist / 400 };
  });

  return (
    <Modal
      visible={!!uri}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {
        reset();
        onClose();
      }}
    >
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#000' }}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <Animated.View style={[{ flex: 1, backgroundColor: '#000' }, backdropStyle]}>
          <GestureDetector gesture={composed}>
            <Animated.View
              style={[
                { flex: 1, alignItems: 'center', justifyContent: 'center' },
              ]}
            >
              {uri ? (
                <AnimatedImage
                  source={{ uri }}
                  style={[
                    { width: W, height: H },
                    animatedStyle,
                  ]}
                  resizeMode="contain"
                />
              ) : null}
            </Animated.View>
          </GestureDetector>

          <SafeAreaView edges={['top']} style={{ position: 'absolute', top: 0, right: 16 }}>
            <Pressable
              onPress={() => {
                reset();
                onClose();
              }}
              accessibilityLabel="Cerrar"
              hitSlop={10}
              style={({ pressed }) => ({
                marginTop: 8,
                backgroundColor: colors.overlay,
                borderRadius: 20,
                padding: 8,
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </SafeAreaView>
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
};
