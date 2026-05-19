import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { SettingsStackParamList } from '../navigation/SettingsNavigator';
import { useAppConfig } from '@/context/ConfigContext';
import { formatDateTime } from '@/utils/format';

type Nav = NativeStackNavigationProp<SettingsStackParamList, 'SettingsHome'>;

export const SettingsHomeScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const { config } = useAppConfig();

  const Item: React.FC<{ icon: string; title: string; route: keyof SettingsStackParamList; subtitle?: string }> = ({
    icon,
    title,
    route,
    subtitle,
  }) => (
    <Pressable
      onPress={() => nav.navigate(route as never)}
      className="bg-surface rounded-lg p-4 mb-2 flex-row items-center"
    >
      <Text className="text-2xl mr-3">{icon}</Text>
      <View className="flex-1">
        <Text className="text-white font-semibold">{title}</Text>
        {subtitle ? <Text className="text-muted text-xs">{subtitle}</Text> : null}
      </View>
      <Text className="text-muted text-lg">›</Text>
    </Pressable>
  );

  return (
    <ScrollView className="flex-1 bg-bg p-3">
      <Text className="text-white text-xl font-bold mb-3">Ajustes</Text>
      <Item
        icon="🔑"
        title="API Keys"
        route="ApiKeys"
        subtitle={
          config.numistaApiKey && config.ebayClientId
            ? 'Configuradas'
            : 'Pendientes de configurar'
        }
      />
      <Item icon="🪙" title="Categorías de monedas" route="CoinCategories" />
      <Item icon="📦" title="Categorías de objetos" route="ObjectCategories" />
      <Item icon="🏷️" title="Tipos de objetos" route="ObjectTypes" />
      <Item icon="✅" title="Estados de posesión" route="PossessionStatuses" />
      <Item icon="🔎" title="Filtros visibles" route="FiltersConfig" />
      <Item icon="🧬" title="Detección de duplicados" route="DuplicatesConfig" />
      <Item
        icon="💸"
        title="Actualización de precios"
        route="PriceUpdate"
        subtitle={
          config.lastFullUpdateAt
            ? `Última: ${formatDateTime(config.lastFullUpdateAt)}`
            : 'Nunca actualizado'
        }
      />
      <Item icon="💾" title="Datos (export/import/borrar)" route="DataMgmt" />
      <View className="h-16" />
    </ScrollView>
  );
};
