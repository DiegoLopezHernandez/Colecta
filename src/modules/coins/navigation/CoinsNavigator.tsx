import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CoinsListScreen } from '../screens/CoinsListScreen';
import { CoinAddCaptureScreen } from '../screens/CoinAddCaptureScreen';
import { CoinAddIdentifyScreen } from '../screens/CoinAddIdentifyScreen';
import { CoinAddConfirmScreen } from '../screens/CoinAddConfirmScreen';
import { CoinDetailScreen } from '../screens/CoinDetailScreen';
import { CoinsStatsScreen } from '../screens/CoinsStatsScreen';

export type CoinsStackParamList = {
  CoinsList: undefined;
  AddCapture: undefined;
  AddIdentify: {
    obverseUri: string;
    reverseUri: string;
    countryCode: string;
    countryName: string;
    year: number;
  };
  AddConfirm:
    | {
        manual: false;
        numistaId: number;
        obverseUri: string;
        reverseUri: string;
        countryCode: string;
        countryName: string;
        year: number;
      }
    | {
        manual: true;
        obverseUri: string;
        reverseUri: string;
        countryCode: string;
        countryName: string;
        year: number;
        numistaId?: number;
      };
  CoinDetail: { id: string };
  Stats: undefined;
};

const Stack = createNativeStackNavigator<CoinsStackParamList>();

export const CoinsNavigator: React.FC = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: '#0f172a' },
      headerTintColor: '#fff',
      headerTitleStyle: { color: '#fff' },
      contentStyle: { backgroundColor: '#0f172a' },
    }}
  >
    <Stack.Screen
      name="CoinsList"
      component={CoinsListScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="AddCapture"
      component={CoinAddCaptureScreen}
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
      name="Stats"
      component={CoinsStatsScreen}
      options={{ title: 'Estadísticas' }}
    />
  </Stack.Navigator>
);
