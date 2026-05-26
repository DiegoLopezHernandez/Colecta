import React, { useState } from 'react';
import { View, Text, Alert, ScrollView, Share } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Section } from '@/components/Section';
import { Card } from '@/components/Card';
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
      'Coloca el archivo JSON en backup_in.json dentro del cache y pulsa “Leer cache”.',
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
    <ScrollView
      style={{ flex: 1, backgroundColor: '#0B0B0D' }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
    >
      <Section
        title="Información"
        description="El export incluye configuración, monedas, objetos y snapshots."
      >
        <Card>
          <Text style={{ color: '#A1A1AA', fontSize: 13, lineHeight: 19 }}>
            Las imágenes quedan referenciadas por su ruta local. Si reinstalas la app,
            las referencias a fotos se perderán aunque se restauren los datos.
          </Text>
        </Card>
      </Section>

      <Section title="Acciones">
        <View style={{ gap: 10 }}>
          <PrimaryButton
            label="Exportar JSON"
            icon="📤"
            onPress={doExport}
            loading={busy}
            fullWidth
          />
          <PrimaryButton
            label="Importar JSON"
            icon="📥"
            onPress={doImport}
            loading={busy}
            variant="secondary"
            fullWidth
          />
          <PrimaryButton
            label="Borrar todo"
            icon="🗑"
            onPress={doWipe}
            variant="danger"
            fullWidth
          />
        </View>
      </Section>
    </ScrollView>
  );
};
