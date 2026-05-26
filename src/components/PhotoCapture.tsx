import React, { useRef, useState } from 'react';
import {
  View, Text, Pressable, Image, Alert, Modal, StatusBar, ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';

type FlashMode = 'off' | 'on' | 'auto';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { haptic } from '@/utils/haptics';
import { processAndPersistPhoto } from '@/utils/image';

interface Props {
  label: string;
  uri?: string;
  onCaptured: (uri: string) => void;
}

/**
 * Captura de foto con tres mejoras importantes:
 *   1. PREVIEW: tras disparar, el usuario ve la foto y decide "Usar" / "Repetir".
 *      Antes la foto se aceptaba a ciegas y la única forma de rehacerla era
 *      volver a la card y pulsar "Repetir".
 *   2. PERSISTENCIA + COMPRESIÓN: la URI nativa va al caché del SO (volátil).
 *      Aquí se redimensiona a 1600 px máx, se recomprime y se mueve a
 *      `documentDirectory/photos/`. Resultado: archivos pequeños (~300 KB) y
 *      la foto no desaparece si el SO limpia el caché.
 *   3. FLASH togglable. Útil con poca luz para monedas.
 */
export const PhotoCapture: React.FC<Props> = ({ label, uri, onCaptured }) => {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);
  const [flash, setFlash] = useState<FlashMode>('off');
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const insets = useSafeAreaInsets();

  const openCamera = async () => {
    if (!permission?.granted) {
      const p = await requestPermission();
      if (!p.granted) {
        Alert.alert(
          'Permiso requerido',
          'Necesitamos acceso a la cámara para capturar fotos de las monedas.'
        );
        return;
      }
    }
    setPreview(null);
    setShowCamera(true);
  };

  const takePhoto = async () => {
    try {
      haptic.medium();
      const photo = await cameraRef.current?.takePictureAsync({ quality: 0.9 });
      if (photo?.uri) {
        setPreview(photo.uri);
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo capturar la foto.');
    }
  };

  const acceptPreview = async () => {
    if (!preview) return;
    setBusy(true);
    try {
      const finalUri = await processAndPersistPhoto(preview);
      haptic.success();
      onCaptured(finalUri);
      setPreview(null);
      setShowCamera(false);
    } catch (e) {
      Alert.alert('Error', 'No se pudo procesar la foto.');
    } finally {
      setBusy(false);
    }
  };

  const retakePreview = () => {
    haptic.light();
    setPreview(null);
  };

  const pickFromGallery = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    });
    if (!r.canceled && r.assets[0]) {
      setBusy(true);
      try {
        const finalUri = await processAndPersistPhoto(r.assets[0].uri);
        haptic.success();
        onCaptured(finalUri);
      } finally {
        setBusy(false);
      }
    }
  };

  const toggleFlash = () => setFlash((f) => (f === 'off' ? 'on' : 'off'));

  return (
    <>
      {/* Modal cámara pantalla completa */}
      <Modal visible={showCamera} animationType="slide" statusBarTranslucent onRequestClose={() => setShowCamera(false)}>
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

          {preview ? (
            // ── Preview de la foto recién tomada ─────────────────────────
            <View style={{ flex: 1 }}>
              <Image
                source={{ uri: preview }}
                style={{ flex: 1, width: '100%', backgroundColor: '#000' }}
                resizeMode="contain"
              />
              {busy ? (
                <View
                  style={{
                    ...StyleSheetFull,
                    backgroundColor: 'rgba(0,0,0,0.45)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              ) : null}

              <View
                style={{
                  backgroundColor: colors.bg,
                  paddingTop: 16,
                  paddingBottom: Math.max(insets.bottom, 16),
                  paddingHorizontal: 24,
                  flexDirection: 'row',
                  gap: 12,
                }}
              >
                <Pressable
                  onPress={retakePreview}
                  disabled={busy}
                  accessibilityLabel="Repetir foto"
                  style={({ pressed }) => ({
                    flex: 1,
                    backgroundColor: colors.surface2,
                    paddingVertical: 14,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: colors.border,
                    alignItems: 'center',
                    opacity: pressed || busy ? 0.6 : 1,
                  })}
                >
                  <Text style={{ color: colors.text, fontWeight: '600', fontSize: 15 }}>
                    Repetir
                  </Text>
                </Pressable>
                <Pressable
                  onPress={acceptPreview}
                  disabled={busy}
                  accessibilityLabel="Usar foto"
                  style={({ pressed }) => ({
                    flex: 1,
                    backgroundColor: colors.primary,
                    paddingVertical: 14,
                    borderRadius: 12,
                    alignItems: 'center',
                    opacity: pressed || busy ? 0.8 : 1,
                  })}
                >
                  <Text style={{ color: colors.primaryFg, fontWeight: '700', fontSize: 15 }}>
                    Usar
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : (
            // ── Visor de cámara ──────────────────────────────────────────
            <>
              <CameraView
                ref={cameraRef}
                style={{ flex: 1 }}
                facing="back"
                flash={flash}
              />

              {/* Botón de flash superpuesto arriba a la derecha */}
              <SafeAreaView edges={['top']} style={{ position: 'absolute', top: 0, right: 16 }}>
                <Pressable
                  onPress={toggleFlash}
                  accessibilityLabel={flash === 'on' ? 'Desactivar flash' : 'Activar flash'}
                  style={({ pressed }) => ({
                    marginTop: 12,
                    backgroundColor: 'rgba(0,0,0,0.55)',
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: pressed ? 0.6 : 1,
                  })}
                >
                  <Ionicons
                    name={flash === 'on' ? 'flash' : 'flash-off'}
                    size={20}
                    color={flash === 'on' ? colors.primary : colors.text}
                  />
                </Pressable>
              </SafeAreaView>

              <View
                style={{
                  backgroundColor: colors.bg,
                  paddingTop: 20,
                  paddingBottom: Math.max(insets.bottom, 20),
                  paddingHorizontal: 32,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Pressable
                  onPress={() => setShowCamera(false)}
                  accessibilityLabel="Cancelar"
                  style={({ pressed }) => ({
                    backgroundColor: colors.surface2,
                    paddingHorizontal: 20,
                    paddingVertical: 12,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: colors.border,
                    opacity: pressed ? 0.6 : 1,
                    minWidth: 90,
                    alignItems: 'center',
                  })}
                >
                  <Text style={{ color: colors.text, fontWeight: '600', fontSize: 15 }}>
                    Cancelar
                  </Text>
                </Pressable>

                <Pressable
                  onPress={takePhoto}
                  accessibilityLabel="Disparar foto"
                  style={({ pressed }) => ({
                    width: 76,
                    height: 76,
                    borderRadius: 38,
                    backgroundColor: colors.primary,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: pressed ? 0.8 : 1,
                    shadowColor: colors.primary,
                    shadowOpacity: 0.6,
                    shadowRadius: 12,
                    elevation: 10,
                  })}
                >
                  <View
                    style={{
                      width: 58,
                      height: 58,
                      borderRadius: 29,
                      borderWidth: 3,
                      borderColor: 'rgba(0,0,0,0.25)',
                      backgroundColor: 'rgba(255,255,255,0.15)',
                    }}
                  />
                </Pressable>

                <View style={{ minWidth: 90 }} />
              </View>
            </>
          )}
        </View>
      </Modal>

      {/* Tarjeta normal con miniatura */}
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: colors.border,
          padding: 10,
        }}
      >
        <Text
          style={{
            color: colors.textSubtle,
            fontSize: 10,
            fontWeight: '700',
            letterSpacing: 0.8,
            textTransform: 'uppercase',
            marginBottom: 8,
          }}
        >
          {label}
        </Text>

        {uri ? (
          <Image
            source={{ uri }}
            style={{
              width: '100%',
              aspectRatio: 1,
              borderRadius: 10,
              marginBottom: 8,
              backgroundColor: colors.surface2,
            }}
            resizeMode="cover"
          />
        ) : (
          <View
            style={{
              width: '100%',
              aspectRatio: 1,
              borderRadius: 10,
              backgroundColor: colors.surface2,
              borderWidth: 1,
              borderColor: colors.border,
              borderStyle: 'dashed',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 8,
            }}
          >
            <Ionicons name="camera-outline" size={28} color={colors.textSubtle} />
          </View>
        )}

        <Pressable
          onPress={openCamera}
          disabled={busy}
          accessibilityLabel={uri ? 'Repetir foto' : 'Abrir cámara'}
          style={({ pressed }) => ({
            backgroundColor: colors.primary,
            paddingVertical: 9,
            borderRadius: 10,
            alignItems: 'center',
            marginBottom: 6,
            opacity: pressed || busy ? 0.8 : 1,
          })}
        >
          {busy ? (
            <ActivityIndicator size="small" color={colors.primaryFg} />
          ) : (
            <Text style={{ color: colors.primaryFg, fontWeight: '700', fontSize: 13 }}>
              {uri ? 'Repetir' : 'Cámara'}
            </Text>
          )}
        </Pressable>

        <Pressable
          onPress={pickFromGallery}
          disabled={busy}
          accessibilityLabel="Elegir de galería"
          style={({ pressed }) => ({
            backgroundColor: colors.surface2,
            borderWidth: 1,
            borderColor: colors.border,
            paddingVertical: 9,
            borderRadius: 10,
            alignItems: 'center',
            opacity: pressed || busy ? 0.8 : 1,
          })}
        >
          <Text style={{ color: colors.text, fontWeight: '500', fontSize: 13 }}>
            Galería
          </Text>
        </Pressable>
      </View>
    </>
  );
};

// Posición absoluta cubriendo el padre (preview overlay)
const StyleSheetFull = {
  position: 'absolute' as const,
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
};
