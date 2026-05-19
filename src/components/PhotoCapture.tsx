import React, { useRef, useState } from 'react';
import { View, Text, Pressable, Image, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';

interface Props {
  label: string;
  uri?: string;
  onCaptured: (uri: string) => void;
}

export const PhotoCapture: React.FC<Props> = ({ label, uri, onCaptured }) => {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);

  const openCamera = async () => {
    if (!permission?.granted) {
      const p = await requestPermission();
      if (!p.granted) {
        Alert.alert('Permiso requerido', 'Necesitamos acceso a la cámara.');
        return;
      }
    }
    setShowCamera(true);
  };

  const takePhoto = async () => {
    const photo = await cameraRef.current?.takePictureAsync({ quality: 0.7 });
    if (photo?.uri) {
      onCaptured(photo.uri);
      setShowCamera(false);
    }
  };

  const pickFromGallery = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!r.canceled && r.assets[0]) onCaptured(r.assets[0].uri);
  };

  if (showCamera) {
    return (
      <View className="rounded-lg overflow-hidden bg-black aspect-square">
        <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back" />
        <View className="flex-row absolute bottom-3 self-center gap-3">
          <Pressable
            onPress={takePhoto}
            className="bg-white px-5 py-3 rounded-full"
          >
            <Text className="text-black font-semibold">📷 Capturar</Text>
          </Pressable>
          <Pressable
            onPress={() => setShowCamera(false)}
            className="bg-surface px-4 py-3 rounded-full"
          >
            <Text className="text-white">Cancelar</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View className="bg-surface rounded-lg p-3">
      <Text className="text-muted text-xs mb-2">{label}</Text>
      {uri ? (
        <Image
          source={{ uri }}
          className="w-full aspect-square rounded-md mb-2"
          resizeMode="cover"
        />
      ) : (
        <View className="w-full aspect-square rounded-md bg-surface2 items-center justify-center mb-2">
          <Text className="text-5xl">📷</Text>
        </View>
      )}
      <View className="flex-row gap-2">
        <Pressable
          onPress={openCamera}
          className="flex-1 bg-primary py-2 rounded-md items-center"
        >
          <Text className="text-white font-semibold">Cámara</Text>
        </Pressable>
        <Pressable
          onPress={pickFromGallery}
          className="flex-1 bg-surface2 py-2 rounded-md items-center"
        >
          <Text className="text-white">Galería</Text>
        </Pressable>
      </View>
    </View>
  );
};
