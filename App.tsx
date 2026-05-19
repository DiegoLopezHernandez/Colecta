import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { ConfigProvider } from '@/context/ConfigContext';
import { CollectionProvider } from '@/context/CollectionContext';
import { RootNavigator } from '@/navigation/RootNavigator';

const NavTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    background: '#0f172a',
    card: '#0f172a',
    text: '#ffffff',
    border: '#1e293b',
    primary: '#3b82f6',
  },
};

export default function App() {
  return (
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
  );
}
