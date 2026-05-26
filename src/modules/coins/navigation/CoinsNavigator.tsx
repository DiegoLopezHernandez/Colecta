import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CoinsListScreen } from '../screens/CoinsListScreen';
import { CoinAddCoinScreen } from '../screens/CoinAddCoinScreen';
import { CoinAddIdentifyScreen } from '../screens/CoinAddIdentifyScreen';
import { CoinAddConfirmScreen } from '../screens/CoinAddConfirmScreen';
import { CoinDetailScreen } from '../screens/CoinDetailScreen';
import { CoinEditScreen } from '../screens/CoinEditScreen';
import { CoinsStatsScreen } from '../screens/CoinsStatsScreen';
import { colors } from '@/theme/colors';

export type CoinsStackParamList = {
  CoinsList: undefined;
  AddCoin: undefined;
  AddIdentify: {
    obverseUri?: string;
    reverseUri?: string;
    countryCode: string;
    countryName: string;
    year: number;
    query?: string;
  };
  AddConfirm: {
    numistaId?: number;
    obverseUri?: string;
    reverseUri?: string;
    countryCode: string;
    countryName: string;
    year: number;
    title?: string;
  };
  CoinDetail: { id: string };
  CoinEdit: { id: string };
  Stats: undefined;
};

const Stack = createNativeStackNavigator<CoinsStackParamList>();

export const CoinsNavigator: React.FC = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: colors.bg },
      headerTintColor: colors.text,
      headerTitleStyle: { color: colors.text, fontSize: 17, fontWeight: '600' },
      headerShadowVisible: false,
      contentStyle: { backgroundColor: colors.bg },
    }}
  >
    <Stack.Screen
      name="CoinsList"
      component={CoinsListScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="AddCoin"
      component={CoinAddCoinScreen}
      options={{ title: 'Añadir moneda' }}
    />
    <Stack.Screen
      name="AddIdentify"
      component={CoinAddIdentifyScreen}
      options={{ title: 'Identificar' }}
    />
    <Stack.Screen
      name="AddConfirm"
      component={CoinAddConfirmScreen}
      options={{ title: 'Confirmar' }}
    />
    <Stack.Screen
      name="CoinDetail"
      component={CoinDetailScreen}
      options={{ title: 'Detalle' }}
    />
    <Stack.Screen
      name="CoinEdit"
      component={CoinEditScreen}
      options={{ title: 'Editar moneda' }}
    />
    <Stack.Screen
      name="Stats"
      component={CoinsStatsScreen}
      options={{ title: 'Estadísticas' }}
    />
  </Stack.Navigator>
);
