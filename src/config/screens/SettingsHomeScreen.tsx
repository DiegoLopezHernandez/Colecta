import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { SettingsStackParamList } from '../navigation/SettingsNavigator';
import { useAppConfig } from '@/context/ConfigContext';
import { formatDateTime } from '@/utils/format';
import { ScreenHeader } from '@/components/ScreenHeader';

type Nav = NativeStackNavigationProp<SettingsStackParamList, 'SettingsHome'>;

interface ItemDef {
  icon: string;
  title: string;
  route: keyof SettingsStackParamList;
  subtitle?: string;
}

export const SettingsHomeScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const { config } = useAppConfig();

  const groups: { title: string; items: ItemDef[] }[] = [
    {
      title: 'Conexiones',
      items: [
        {
          icon: '🔑',
          title: 'API Keys',
          route: 'ApiKeys',
          subtitle:
            config.numistaApiKey && config.ebayClientId
              ? 'Configuradas'
              : 'Pendientes de configurar',
        },
      ],
    },
    {
      title: 'Catálogos',
      items: [
        { icon: '🪙', title: 'Categorías de monedas', route: 'CoinCategories' },
        { icon: '📦', title: 'Categorías de objetos', route: 'ObjectCategories' },
        { icon: '🏷️', title: 'Tipos de objetos', route: 'ObjectTypes' },
        { icon: '✅', title: 'Estados de posesión', route: 'PossessionStatuses' },
      ],
    },
    {
      title: 'Comportamiento',
      items: [
        { icon: '🔎', title: 'Filtros visibles', route: 'FiltersConfig' },
        { icon: '🧬', title: 'Detección de duplicados', route: 'DuplicatesConfig' },
      ],
    },
    {
      title: 'Mantenimiento',
      items: [
        {
          icon: '💸',
          title: 'Actualización de precios',
          route: 'PriceUpdate',
          subtitle: config.lastFullUpdateAt
            ? `Última: ${formatDateTime(config.lastFullUpdateAt)}`
            : 'Nunca actualizado',
        },
        { icon: '💾', title: 'Datos · exportar / importar / borrar', route: 'DataMgmt' },
      ],
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0B0B0D' }} edges={['top']}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
      >
        <ScreenHeader title="Ajustes" subtitle="Configura tu colección y conexiones" />
        {groups.map((g) => (
          <View key={g.title} style={{ marginBottom: 22 }}>
            <Text
              style={{
                color: '#A1A1AA',
                fontSize: 11,
                fontWeight: '600',
                letterSpacing: 1,
                textTransform: 'uppercase',
                marginBottom: 8,
              }}
            >
              {g.title}
            </Text>
            <View
              style={{
                backgroundColor: '#141417',
                borderRadius: 14,
                borderWidth: 1,
                borderColor: '#26262B',
                overflow: 'hidden',
              }}
            >
              {g.items.map((it, idx) => (
                <Pressable
                  key={it.route}
                  onPress={() => nav.navigate(it.route as never)}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 12,
                    paddingHorizontal: 14,
                    borderBottomWidth: idx === g.items.length - 1 ? 0 : 1,
                    borderBottomColor: '#1C1C20',
                    backgroundColor: pressed ? '#1C1C20' : 'transparent',
                  })}
                >
                  <Text style={{ fontSize: 20, marginRight: 12 }}>{it.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{ color: '#F4F4F5', fontSize: 15, fontWeight: '500' }}
                    >
                      {it.title}
                    </Text>
                    {it.subtitle ? (
                      <Text
                        style={{ color: '#71717A', fontSize: 12, marginTop: 2 }}
                      >
                        {it.subtitle}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={{ color: '#3A3A40', fontSize: 18 }}>›</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};
