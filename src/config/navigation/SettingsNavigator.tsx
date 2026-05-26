import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SettingsHomeScreen } from '../screens/SettingsHomeScreen';
import { ApiKeysScreen } from '../screens/ApiKeysScreen';
import { CoinCategoriesScreen } from '../screens/CoinCategoriesScreen';
import { ObjectCategoriesScreen } from '../screens/ObjectCategoriesScreen';
import { ObjectTypesScreen } from '../screens/ObjectTypesScreen';
import { PossessionStatusesScreen } from '../screens/PossessionStatusesScreen';
import { FiltersConfigScreen } from '../screens/FiltersConfigScreen';
import { DuplicatesConfigScreen } from '../screens/DuplicatesConfigScreen';
import { PriceUpdateScreen } from '../screens/PriceUpdateScreen';
import { DataMgmtScreen } from '../screens/DataMgmtScreen';

export type SettingsStackParamList = {
  SettingsHome: undefined;
  ApiKeys: undefined;
  CoinCategories: undefined;
  ObjectCategories: undefined;
  ObjectTypes: undefined;
  PossessionStatuses: undefined;
  FiltersConfig: undefined;
  DuplicatesConfig: undefined;
  PriceUpdate: undefined;
  DataMgmt: undefined;
};

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export const SettingsNavigator: React.FC = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: '#0B0B0D' },
      headerTintColor: '#F4F4F5',
      headerTitleStyle: { color: '#F4F4F5', fontSize: 17, fontWeight: '600' },
      headerShadowVisible: false,
      contentStyle: { backgroundColor: '#0B0B0D' },
    }}
  >
    <Stack.Screen
      name="SettingsHome"
      component={SettingsHomeScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen name="ApiKeys" component={ApiKeysScreen} options={{ title: 'API Keys' }} />
    <Stack.Screen
      name="CoinCategories"
      component={CoinCategoriesScreen}
      options={{ title: 'Categorías monedas' }}
    />
    <Stack.Screen
      name="ObjectCategories"
      component={ObjectCategoriesScreen}
      options={{ title: 'Categorías objetos' }}
    />
    <Stack.Screen
      name="ObjectTypes"
      component={ObjectTypesScreen}
      options={{ title: 'Tipos de objetos' }}
    />
    <Stack.Screen
      name="PossessionStatuses"
      component={PossessionStatusesScreen}
      options={{ title: 'Estados' }}
    />
    <Stack.Screen
      name="FiltersConfig"
      component={FiltersConfigScreen}
      options={{ title: 'Filtros' }}
    />
    <Stack.Screen
      name="DuplicatesConfig"
      component={DuplicatesConfigScreen}
      options={{ title: 'Duplicados' }}
    />
    <Stack.Screen
      name="PriceUpdate"
      component={PriceUpdateScreen}
      options={{ title: 'Precios' }}
    />
    <Stack.Screen
      name="DataMgmt"
      component={DataMgmtScreen}
      options={{ title: 'Datos' }}
    />
  </Stack.Navigator>
);
