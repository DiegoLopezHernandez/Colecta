import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ObjectsListScreen } from '../screens/ObjectsListScreen';
import { ObjectAddCaptureScreen } from '../screens/ObjectAddCaptureScreen';
import { ObjectAddConfirmScreen } from '../screens/ObjectAddConfirmScreen';
import { ObjectDetailScreen } from '../screens/ObjectDetailScreen';
import { colors } from '@/theme/colors';

export type ObjectsStackParamList = {
  ObjectsList: undefined;
  AddCapture: undefined;
  AddConfirm: {
    obverseUri: string;
    reverseUri?: string;
    name: string;
    typeId: string;
    categoryId: string;
  };
  ObjectDetail: { id: string };
};

const Stack = createNativeStackNavigator<ObjectsStackParamList>();

export const ObjectsNavigator: React.FC = () => (
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
      name="ObjectsList"
      component={ObjectsListScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="AddCapture"
      component={ObjectAddCaptureScreen}
      options={{ title: 'Añadir objeto' }}
    />
    <Stack.Screen
      name="AddConfirm"
      component={ObjectAddConfirmScreen}
      options={{ title: 'Confirmar' }}
    />
    <Stack.Screen
      name="ObjectDetail"
      component={ObjectDetailScreen}
      options={{ title: 'Detalle' }}
    />
  </Stack.Navigator>
);
