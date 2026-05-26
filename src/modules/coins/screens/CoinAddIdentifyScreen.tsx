import React, { useEffect, useState } from 'react';
import { View, Text, Image, Pressable, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { searchCandidates, NumistaError } from '@/services/numistaService';
import { useAppConfig } from '@/context/ConfigContext';
import { LoadingView } from '@/components/LoadingView';
import { ErrorView } from '@/components/ErrorView';
import { Card } from '@/components/Card';
import { PrimaryButton } from '@/components/PrimaryButton';
import { colors } from '@/theme/colors';
import { haptic } from '@/utils/haptics';
import type { CoinsStackParamList } from '../navigation/CoinsNavigator';
import type { NumistaCandidate } from '@/types';

type Nav = NativeStackNavigationProp<CoinsStackParamList, 'AddIdentify'>;
type RouteT = RouteProp<CoinsStackParamList, 'AddIdentify'>;

/**
 * Lista de candidatos de Numista para que el usuario elija.
 *
 * Se eliminó el "ranking visual por similitud" anterior porque comparaba bytes
 * del JPEG, no píxeles, y reportaba un porcentaje engañoso al usuario. Los
 * candidatos se muestran tal cual los devuelve Numista, ya están ordenados por
 * proximidad de año en el servicio.
 */
export const CoinAddIdentifyScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const { params } = useRoute<RouteT>();
  const { config } = useAppConfig();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<NumistaCandidate[]>([]);

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      const cands = await searchCandidates(
        config.numistaApiKey,
        params.countryCode,
        params.year,
        params.query,
      );
      setResults(cands.slice(0, 15));
    } catch (e) {
      if (e instanceof NumistaError) setError(e.message);
      else setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goToConfirm = (numistaId: number) => {
    haptic.light();
    nav.replace('AddConfirm', {
      numistaId,
      obverseUri: params.obverseUri,
      reverseUri: params.reverseUri,
      countryCode: params.countryCode,
      countryName: params.countryName,
      year: params.year,
    });
  };

  const goWithoutNumista = () => {
    nav.replace('AddConfirm', {
      obverseUri: params.obverseUri,
      reverseUri: params.reverseUri,
      countryCode: params.countryCode,
      countryName: params.countryName,
      year: params.year,
    });
  };

  if (loading) return <LoadingView label="Buscando en Numista…" />;
  if (error) return <ErrorView error={error} onRetry={run} />;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
    >
      <Text style={{ color: colors.text, fontSize: 22, fontWeight: '700', letterSpacing: -0.3 }}>
        Candidatos
      </Text>
      <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 4, marginBottom: 18 }}>
        {results.length === 0
          ? `Sin resultados para ${params.countryName} · ${params.year}.`
          : `${results.length} ${results.length === 1 ? 'moneda encontrada' : 'monedas encontradas'}. Pulsa la que corresponda.`}
      </Text>

      {results.length === 0 ? (
        <Card>
          <Text style={{ color: colors.text, fontSize: 15, marginBottom: 12 }}>
            No se encontraron monedas en Numista para {params.countryName} en {params.year}.
          </Text>
          <PrimaryButton label="Guardar sin Numista" onPress={goWithoutNumista} />
        </Card>
      ) : (
        <>
          {results.map((c) => (
            <Pressable
              key={c.numista_id}
              onPress={() => goToConfirm(c.numista_id)}
              accessibilityRole="button"
              accessibilityLabel={c.title}
              style={({ pressed }) => ({
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 14,
                padding: 12,
                marginBottom: 10,
                flexDirection: 'row',
                opacity: pressed ? 0.7 : 1,
              })}
            >
              {c.obverse_thumb ? (
                <Image
                  source={{ uri: c.obverse_thumb }}
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 10,
                    marginRight: 12,
                    backgroundColor: colors.surface2,
                  }}
                  resizeMode="contain"
                />
              ) : (
                <View
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 10,
                    backgroundColor: colors.surface2,
                    marginRight: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 28 }}>🪙</Text>
                </View>
              )}
              <View style={{ flex: 1, justifyContent: 'center' }}>
                <Text
                  style={{ color: colors.text, fontSize: 14, fontWeight: '600' }}
                  numberOfLines={2}
                >
                  {c.title}
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>
                  {c.country} · {c.year}
                </Text>
              </View>
            </Pressable>
          ))}

          <Pressable
            onPress={goWithoutNumista}
            accessibilityRole="button"
            style={({ pressed }) => ({
              marginTop: 8,
              paddingVertical: 12,
              borderRadius: 10,
              backgroundColor: colors.surface2,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: 'center',
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={{ color: colors.textMuted, fontSize: 14, fontWeight: '500' }}>
              Ninguna coincide — guardar sin Numista
            </Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
};
