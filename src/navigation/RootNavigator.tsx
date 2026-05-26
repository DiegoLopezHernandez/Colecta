import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { CoinsNavigator } from '@/modules/coins/navigation/CoinsNavigator';
import { ObjectsNavigator } from '@/modules/objects/navigation/ObjectsNavigator';
import { SettingsNavigator } from '@/config/navigation/SettingsNavigator';

export type RootTabsParamList = {
  CoinsTab: undefined;
  ObjectsTab: undefined;
  SettingsTab: undefined;
};

const Tab = createBottomTabNavigator<RootTabsParamList>();

export const RootNavigator: React.FC = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarStyle: {
        backgroundColor: '#0B0B0D',
        borderTopColor: '#26262B',
        borderTopWidth: 1,
        height: 62,
        paddingTop: 6,
        paddingBottom: 8,
      },
      tabBarLabelStyle: {
        fontSize: 11,
        fontWeight: '500',
        marginTop: 2,
      },
      tabBarActiveTintColor: '#D4A24B',
      tabBarInactiveTintColor: '#71717A',
      tabBarIcon: ({ color, size }) => {
        const map: Record<keyof RootTabsParamList, keyof typeof Ionicons.glyphMap> = {
          CoinsTab: 'pricetags',
          ObjectsTab: 'cube',
          SettingsTab: 'settings',
        };
        return <Ionicons name={map[route.name]} size={size} color={color} />;
      },
    })}
  >
    <Tab.Screen
      name="CoinsTab"
      component={CoinsNavigator}
      options={{ title: 'Monedas' }}
    />
    <Tab.Screen
      name="ObjectsTab"
      component={ObjectsNavigator}
      options={{ title: 'Objetos' }}
    />
    <Tab.Screen
      name="SettingsTab"
      component={SettingsNavigator}
      options={{ title: 'Ajustes' }}
    />
  </Tab.Navigator>
);
