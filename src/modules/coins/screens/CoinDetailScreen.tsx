import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, Image, ScrollView, Alert, Pressable,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCollection } from '@/context/CollectionContext';
import { useAppConfig } from '@/context/ConfigContext';
import { fetchLastPrice } from '@/services/ebayService';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Badge } from '@/components/Badge';
import { Card } from '@/components/Card';
import { Section } from '@/components/Section';
import { DataRow } from '@/components/DataRow';
import { ImageZoomViewer } from '@/components/ImageZoomViewer';
import { formatCurrency, formatDate, percentDiff, formatPercent } from '@/utils/format';
import { CONDITION_LABEL_ES, RARITY_LABEL_ES } from '@/utils/conditions';
import { colors } from '@/theme/colors';
import { haptic } from '@/utils/haptics';
import type { CoinsStackParamList } from '../navigation/CoinsNavigator';

type Nav = NativeStackNavigationProp<CoinsStackParamList, 'CoinDetail'>;
type RouteT = RouteProp<CoinsStackParamList, 'CoinDetail'>;

export const CoinDetailScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const { params } = useRoute<RouteT>();
  const { coins, addOrUpdateCoin, removeCoin } = useCollection();
  const { config } = useAppConfig();
  // Lookup memoizado: la referencia solo cambia cuando cambia la lista o el id.
  const coin = useMemo(
    () => coins.find((c) => c.id === params.id),
    [coins, params.id]
  );
  const [updating, setUpdating] = useState(false);
  const [delta, setDelta] = useState<{ old?: number; neu: number } | null>(null);
  const [zoomUri, setZoomUri] = useState<string | null>(null);

  useEffect(() => {
    if (!coin) return;
    const coinId = coin.id;
    const goEdit = () => nav.navigate('CoinEdit', { id: coinId });
    const goDelete = () =>
      Alert.alert('Eliminar moneda', 'Esta acción no se puede deshacer.', [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await removeCoin(coinId);
            haptic.warning();
            nav.goBack();
          },
        },
      ]);
    nav.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row', gap: 16, marginRight: 4, alignItems: 'center' }}>
          <Pressable
            onPress={goEdit}
            hitSlop={10}
            accessibilityLabel="Editar"
            style={({ pressed }) => ({ opacity: pressed ? 0.4 : 1 })}
          >
            <Ionicons name="pencil-outline" size={21} color={colors.primary} />
          </Pressable>
          <Pressable
            onPress={goDelete}
            hitSlop={10}
            accessibilityLabel="Eliminar"
            style={({ pressed }) => ({ opacity: pressed ? 0.4 : 1 })}
          >
            <Ionicons name="trash-outline" size={21} color={colors.err} />
          </Pressable>
        </View>
      ),
    });
  }, [coin, nav, removeCoin]);

  if (!coin) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: colors.text, fontSize: 15 }}>Moneda no encontrada</Text>
      </View>
    );
  }

  const cat = config.coinCategories.find((c) => c.id === coin.categoryId);
  const pos = config.possessionStatuses.find((p) => p.id === coin.possessionStatusId);

  const updatePrice = async () => {
    setUpdating(true);
    setDelta(null);
    try {
      const r = await fetchLastPrice(config.ebayClientId, coin.title);
      const now = new Date().toISOString();
      if (r) {
        setDelta({ old: coin.ebay_last_price, neu: r.price });
        await addOrUpdateCoin({
          ...coin,
          ebay_last_price: r.price,
          ebay_last_price_currency: r.currency,
          ebay_last_price_date: r.endDate,
          ebay_last_price_updated_at: now,
          ebay_price_not_found: false,
          updatedAt: now,
        });
        haptic.success();
      } else {
        await addOrUpdateCoin({
          ...coin,
          ebay_price_not_found: true,
          ebay_last_price_updated_at: now,
          updatedAt: now,
        });
        Alert.alert('Sin resultados', 'No se ha encontrado ningún listing en eBay.');
      }
    } catch (e) {
      Alert.alert('Error eBay', (e as Error).message);
    } finally {
      setUpdating(false);
    }
  };

  const diff =
    delta && delta.old !== undefined ? percentDiff(delta.old, delta.neu) : undefined;
  const subtitle =
    coin.country +
    ' · ' +
    coin.year +
    (coin.denomination ? ' · ' + coin.denomination : '');

  return (
    <>
      <ImageZoomViewer uri={zoomUri} onClose={() => setZoomUri(null)} />

      <ScrollView
        style={{ flex: 1, backgroundColor: colors.bg }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      >
        <Text
          style={{
            color: colors.text, fontSize: 22, fontWeight: '700',
            letterSpacing: -0.3, marginBottom: 4,
          }}
        >
          {coin.title}
        </Text>
        <Text style={{ color: colors.textMuted, fontSize: 13, marginBottom: 20 }}>
          {subtitle}
        </Text>

        {coin.frontImageUri ? (
          <Section title="Tu fotografía">
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <ImageTile label="Anverso" uri={coin.frontImageUri} onZoom={setZoomUri} />
              {coin.backImageUri ? (
                <ImageTile label="Reverso" uri={coin.backImageUri} onZoom={setZoomUri} />
              ) : null}
            </View>
          </Section>
        ) : null}

        {(coin.officialObverseUrl || coin.officialReverseUrl) ? (
          <Section title="Imagen oficial (Numista)">
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {coin.officialObverseUrl ? (
                <ImageTile
                  label="Anverso"
                  uri={coin.officialObverseUrl}
                  contain
                  onZoom={setZoomUri}
                />
              ) : null}
              {coin.officialReverseUrl ? (
                <ImageTile
                  label="Reverso"
                  uri={coin.officialReverseUrl}
                  contain
                  onZoom={setZoomUri}
                />
              ) : null}
            </View>
          </Section>
        ) : null}

        <Section title="Ficha">
          <Card>
            <DataRow k="País" v={coin.country} />
            <DataRow k="Año" v={coin.year} />
            {coin.denomination ? <DataRow k="Denominación" v={coin.denomination} /> : null}
            {coin.composition ? <DataRow k="Composición" v={coin.composition} /> : null}
            {coin.weight_g ? <DataRow k="Peso" v={`${coin.weight_g} g`} /> : null}
            {coin.diameter_mm ? <DataRow k="Diámetro" v={`${coin.diameter_mm} mm`} /> : null}
            {coin.mintage ? <DataRow k="Tirada" v={coin.mintage.toLocaleString()} /> : null}
            {coin.rarity ? <DataRow k="Rareza" v={RARITY_LABEL_ES[coin.rarity]} /> : null}
            <DataRow k="Conservación" v={CONDITION_LABEL_ES[coin.condition]} last />
            {(cat || pos) && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
                {cat ? <Badge label={cat.name} emoji={cat.emoji} color={cat.color} /> : null}
                {pos ? <Badge label={pos.name} emoji={pos.emoji} color={pos.color} /> : null}
              </View>
            )}
          </Card>
        </Section>

        <Section title="Valoraciones">
          <Card>
            {coin.numista_typical_value !== undefined ? (
              <DataRow k="Numista típico" v={formatCurrency(coin.numista_typical_value, 'EUR')} />
            ) : null}
            {coin.numista_min_value !== undefined ? (
              <DataRow k="Numista mín" v={formatCurrency(coin.numista_min_value, 'EUR')} />
            ) : null}
            {coin.numista_max_value !== undefined ? (
              <DataRow k="Numista máx" v={formatCurrency(coin.numista_max_value, 'EUR')} />
            ) : null}
            <DataRow
              k={'eBay' + (coin.ebay_last_price_date
                ? '\n' + formatDate(coin.ebay_last_price_date)
                : '')}
              v={coin.ebay_last_price !== undefined
                ? formatCurrency(coin.ebay_last_price, coin.ebay_last_price_currency || 'EUR')
                : '—'}
              last
            />
            {coin.ebay_price_not_found ? (
              <Text style={{ color: colors.warn, fontSize: 12, marginTop: 8 }}>
                Sin resultados en eBay
              </Text>
            ) : null}
            {delta && (
              <View
                style={{
                  backgroundColor: colors.surface2,
                  borderRadius: 10,
                  padding: 12,
                  marginTop: 12,
                }}
              >
                <Text style={{ color: colors.textMuted, fontSize: 11 }}>
                  Antes: {formatCurrency(delta.old, coin.ebay_last_price_currency || 'EUR')}
                </Text>
                <Text style={{ color: colors.text, fontSize: 14, marginTop: 4 }}>
                  Ahora: {formatCurrency(delta.neu, coin.ebay_last_price_currency || 'EUR')}
                  {diff !== undefined ? (
                    <Text style={{ color: diff >= 0 ? colors.ok : colors.err }}>
                      {'  '}{diff >= 0 ? '+' : ''}{formatPercent(diff)}
                    </Text>
                  ) : null}
                </Text>
              </View>
            )}
          </Card>
        </Section>

        {coin.notes ? (
          <Section title="Notas">
            <Card>
              <Text style={{ color: colors.text, fontSize: 14, lineHeight: 22 }}>
                {coin.notes}
              </Text>
            </Card>
          </Section>
        ) : null}

        <View style={{ gap: 10, marginTop: 8 }}>
          <PrimaryButton
            label="Actualizar precio eBay"
            onPress={updatePrice}
            loading={updating}
            fullWidth
          />
          <PrimaryButton
            label="Editar moneda"
            onPress={() => nav.navigate('CoinEdit', { id: coin.id })}
            variant="secondary"
            fullWidth
          />
          <PrimaryButton
            label="Eliminar moneda"
            onPress={() =>
              Alert.alert('Eliminar moneda', 'Esta acción no se puede deshacer.', [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'Eliminar',
                  style: 'destructive',
                  onPress: async () => {
                    await removeCoin(coin.id);
                    haptic.warning();
                    nav.goBack();
                  },
                },
              ])
            }
            variant="danger"
            fullWidth
          />
        </View>
      </ScrollView>
    </>
  );
};

const ImageTile: React.FC<{
  label: string;
  uri: string;
  contain?: boolean;
  onZoom: (uri: string) => void;
}> = ({ label, uri, contain, onZoom }) => (
  <Pressable style={{ flex: 1 }} onPress={() => onZoom(uri)} accessibilityLabel={`Ampliar ${label}`}>
    <Text
      style={{
        color: colors.textSubtle, fontSize: 10, fontWeight: '700',
        letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 6,
      }}
    >
      {label}
    </Text>
    <View
      style={{
        width: '100%', aspectRatio: 1, borderRadius: 12,
        overflow: 'hidden', backgroundColor: colors.surface2,
        borderWidth: 1, borderColor: colors.border,
      }}
    >
      <Image
        source={{ uri }}
        style={{ width: '100%', height: '100%' }}
        resizeMode={contain ? 'contain' : 'cover'}
      />
      <View
        style={{
          position: 'absolute', bottom: 6, right: 6,
          backgroundColor: colors.overlay, borderRadius: 8, padding: 4,
        }}
      >
        <Ionicons name="expand-outline" size={13} color={colors.text} />
      </View>
    </View>
  </Pressable>
);
