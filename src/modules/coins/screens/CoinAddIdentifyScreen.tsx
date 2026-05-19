import React, { useEffect, useState } from 'react';
import { View, Text, Image, Pressable, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, RouteProp } from '@react-navigation/native-stack';
import { searchCandidates, NumistaError } from '@/services/numistaService';
import { rankByVisualSimilarity } from '@/services/imageMatchService';
import { useAppConfig } from '@/context/ConfigContext';
import { LoadingView } from '@/components/LoadingView';
import { ErrorView } from '@/components/ErrorView';
import type { CoinsStackParamList } from '../navigation/CoinsNavigator';
import type { NumistaCandidate } from '@/types';

type Nav = NativeStackNavigationProp<CoinsStackParamList, 'AddIdentify'>;
type RouteT = RouteProp<CoinsStackParamList, 'AddIdentify'>;

interface Ranked {
  candidate: NumistaCandidate;
  hammingDistance: number;
  confidence: number;
}

export const CoinAddIdentifyScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const { params } = useRoute<RouteT>();
  const { config } = useAppConfig();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Ranked[]>([]);

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      const cands = await searchCandidates(
        config.numistaApiKey,
        params.countryCode,
        params.year
      );
      if (cands.length === 0) {
        setResults([]);
        return;
      }
      const ranked = await rankByVisualSimilarity(
        params.obverseUri,
        params.reverseUri,
        cands
      );
      setResults(ranked.slice(0, 3));
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

  if (loading) return <LoadingView label="Consultando Numista y comparando imágenes…" />;
  if (error) return <ErrorView error={error} onRetry={run} />;

  return (
    <ScrollView className="flex-1 bg-bg p-3">
      <Text className="text-white text-xl font-bold mb-2">Candidatos</Text>
      <Text className="text-muted text-xs mb-3">
        Top 3 ordenados por similitud visual. Pulsa el que coincida.
      </Text>

      {results.length === 0 ? (
        <View className="bg-surface p-4 rounded-lg">
          <Text className="text-white">
            No se encontraron monedas para {params.countryName} en {params.year}.
          </Text>
          <Pressable
            onPress={() =>
              nav.replace('AddConfirm', {
                manual: true,
                obverseUri: params.obverseUri,
                reverseUri: params.reverseUri,
                countryCode: params.countryCode,
                countryName: params.countryName,
                year: params.year,
              })
            }
            className="bg-primary py-2 rounded-md mt-3 items-center"
          >
            <Text className="text-white font-semibold">Añadir manualmente</Text>
          </Pressable>
        </View>
      ) : (
        results.map((r) => (
          <Pressable
            key={r.candidate.numista_id}
            onPress={() =>
              nav.replace('AddConfirm', {
                manual: false,
                numistaId: r.candidate.numista_id,
                obverseUri: params.obverseUri,
                reverseUri: params.reverseUri,
                countryCode: params.countryCode,
                countryName: params.countryName,
                year: params.year,
              })
            }
            className="bg-surface rounded-lg p-3 mb-3 flex-row"
          >
            {r.candidate.obverse_thumb ? (
              <Image
                source={{ uri: r.candidate.obverse_thumb }}
                className="w-20 h-20 rounded-md mr-3"
              />
            ) : (
              <View className="w-20 h-20 rounded-md bg-surface2 mr-3 items-center justify-center">
                <Text className="text-3xl">🪙</Text>
              </View>
            )}
            <View className="flex-1">
              <Text className="text-white font-semibold" numberOfLines={2}>
                {r.candidate.title}
              </Text>
              <Text className="text-muted text-xs">
                {r.candidate.country} · {r.candidate.year}
              </Text>
              <Text className="text-primary text-xs mt-1">
                Similitud {r.confidence}% (d={r.hammingDistance.toFixed(0)})
              </Text>
            </View>
          </Pressable>
        ))
      )}
    </ScrollView>
  );
};
