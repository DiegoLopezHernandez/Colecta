import 'react-native-gesture-handler';
import './global.css';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { ConfigProvider } from '@/context/ConfigContext';
import { CollectionProvider } from '@/context/CollectionContext';
import { RootNavigator } from '@/navigation/RootNavigator';
import { getDb } from '@/db';
import { migrateFromAsyncStorageIfNeeded } from '@/db/migration';
import { LoadingView } from '@/components/LoadingView';

const NavTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    background: '#0B0B0D',
    card: '#141417',
    text: '#F4F4F5',
    border: '#26262B',
    primary: '#D4A24B',
    notification: '#D4A24B',
  },
};

export default function App() {
  const [dbReady, setDbReady] = useState(false);

  // Inicializa la DB y, si procede, migra los datos heredados de AsyncStorage.
  // No bloquea más allá del arranque inicial.
  useEffect(() => {
    (async () => {
      try {
        await getDb();
        await migrateFromAsyncStorageIfNeeded();
      } finally {
        setDbReady(true);
      }
    })();
  }, []);

  if (!dbReady) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0B0B0D' }}>
        <LoadingView label="Preparando datos…" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ConfigProvider>
          <CollectionProvider>
            <NavigationContainer theme={NavTheme}>
              <StatusBar style="light" />
              <RootNavigator />
            </NavigationContainer>
          </CollectionProvider>
        </ConfigProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
