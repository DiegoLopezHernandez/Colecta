import React, { useState } from 'react';
import { View, Text, Alert, ScrollView, Share } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { PrimaryButton } from '@/components/PrimaryButton';
import { exportAllAsJson, importFromJson, wipeAllData } from '@/storage/dataBackup';
import { useCollection } from '@/context/CollectionContext';
import { useAppConfig } from '@/context/ConfigContext';
import { buildDefaultConfig } from '@/utils/defaults';

export const DataMgmtScreen: React.FC = () => {
  const { reload, replaceAll } = useCollection();
  const { setConfig } = useAppConfig();
  const [busy, setBusy] = useState(false);

  const doExport = async () => {
    setBusy(true);
    try {
      const json = await exportAllAsJson();
      const path = `${FileSystem.cacheDirectory}backup_${Date.now()}.json`;
      await FileSystem.writeAsStringAsync(path, json);
      await Share.share({
        message: json,
        title: 'Backup AppMovilNumismatica',
      });
      Alert.alert('Exportado', `Guardado temporalmente en:\n${path}`);
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const doImport = async () => {
    Alert.alert(
      'Importar',
      'Pega el JSON manualmente en el archivo de import. (En esta versión gratis sin DocumentPicker, lee de /backup_in.json del cache si existe.)',
      [
        { text: 'OK' },
        {
          text: 'Leer cache',
          onPress: async () => {
            try {
              setBusy(true);
              const target = `${FileSystem.cacheDirectory}backup_in.json`;
              const info = await FileSystem.getInfoAsync(target);
              if (!info.exists) {
                Alert.alert('Sin archivo', `Crea ${target} y vuelve a intentar.`);
                return;
              }
              const raw = await FileSystem.readAsStringAsync(target);
              await importFromJson(raw);
              await reload();
              Alert.alert('Importado', 'Datos restaurados.');
            } catch (e) {
              Alert.alert('Error', (e as Error).message);
            } finally {
              setBusy(false);
            }
          },
        },
      ]
    );
  };

  const doWipe = () =>
    Alert.alert(
      '¿Borrar TODO?',
      'Se eliminarán colecciones, snapshots y configuración. No se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar',
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            try {
              await wipeAllData();
              await replaceAll([], []);
              await setConfig(buildDefaultConfig());
              Alert.alert('Borrado', 'Datos eliminados.');
            } finally {
              setBusy(false);
            }
          },
        },
      ]
    );

  return (
    <ScrollView className="flex-1 bg-bg p-3">
      <Text className="text-white text-xl font-bold mb-3">Datos</Text>
      <Text className="text-muted text-xs mb-3">
        El export incluye configuración, monedas, objetos y snapshots. Las
        imágenes quedan referenciadas por su ruta local; si reinstalas la app
        las referencias se perderán.
      </Text>
      <PrimaryButton label="Exportar JSON" onPress={doExport} loading={busy} />
      <View className="h-3" />
      <PrimaryButton
        label="Importar JSON"
        onPress={doImport}
        loading={busy}
        variant="secondary"
      />
      <View className="h-3" />
      <PrimaryButton label="Borrar todo" onPress={doWipe} variant="danger" />
      <View className="h-16" />
    </ScrollView>
  );
};
