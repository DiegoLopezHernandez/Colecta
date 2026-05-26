import React, { useEffect, useRef, useState } from 'react';
import { View, ScrollView, Alert, Text } from 'react-native';
import { useAppConfig } from '@/context/ConfigContext';
import { verifyApiKey as verifyNumista } from '@/services/numistaService';
import { verifyCredentials as verifyEbay, detectSandbox } from '@/services/ebayService';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Field } from '@/components/Field';
import { Section } from '@/components/Section';

export const ApiKeysScreen: React.FC = () => {
  const { config, patchConfig } = useAppConfig();
  const [numKey, setNumKey] = useState(config.numistaApiKey);
  const [ebayId, setEbayId] = useState(config.ebayClientId);
  const [ebaySec, setEbaySec] = useState(config.ebayClientSecret);
  const [verifyingN, setVerifyingN] = useState(false);
  const [verifyingE, setVerifyingE] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isSbx = detectSandbox(ebayId.trim());

  useEffect(() => {
    setNumKey(config.numistaApiKey);
    setEbayId(config.ebayClientId);
    setEbaySec(config.ebayClientSecret);
  }, [config.numistaApiKey, config.ebayClientId, config.ebayClientSecret]);

  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    const next = {
      numistaApiKey: numKey.trim(),
      ebayClientId: ebayId.trim(),
      ebayClientSecret: ebaySec.trim(),
    };
    const changed =
      next.numistaApiKey !== config.numistaApiKey ||
      next.ebayClientId !== config.ebayClientId ||
      next.ebayClientSecret !== config.ebayClientSecret;
    if (!changed) return;
    saveTimer.current = setTimeout(() => {
      patchConfig(next).then(() => setSavedAt(Date.now()));
    }, 400);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numKey, ebayId, ebaySec]);

  const saveNow = async () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    await patchConfig({
      numistaApiKey: numKey.trim(),
      ebayClientId: ebayId.trim(),
      ebayClientSecret: ebaySec.trim(),
    });
    setSavedAt(Date.now());
    Alert.alert('Guardado', 'Las claves se han guardado.');
  };

  const testNumista = async () => {
    setVerifyingN(true);
    try {
      const ok = await verifyNumista(numKey.trim());
      Alert.alert(
        ok ? 'Numista OK' : 'Numista falló',
        ok ? 'La key responde correctamente.' : 'Revisa la API key.'
      );
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    } finally {
      setVerifyingN(false);
    }
  };

  const testEbay = async () => {
    setVerifyingE(true);
    try {
      const ok = await verifyEbay(ebayId.trim());
      const sbxNote = isSbx ? ' (entorno Sandbox)' : '';
      Alert.alert(
        ok ? 'eBay OK' : 'eBay falló',
        ok
          ? `El App ID responde correctamente${sbxNote}.`
          : `Revisa el App ID${sbxNote}.`
      );
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    } finally {
      setVerifyingE(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#0B0B0D' }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
    >
      <Section
        title="Numista"
        description="Header Numista-API-Key. Necesaria para identificar monedas."
      >
        <Field
          label="API Key"
          value={numKey}
          onChangeText={setNumKey}
          placeholder="Tu API key de Numista"
          autoCapitalize="none"
        />
        <PrimaryButton
          label="Verificar Numista"
          onPress={testNumista}
          loading={verifyingN}
          variant="secondary"
          fullWidth
        />
      </Section>

      <Section
        title="eBay"
        description="App ID se usa para Finding API (no requiere Client Secret). La app detecta automáticamente si es Sandbox o Producción."
      >
        <Field
          label="Client ID (App ID)"
          value={ebayId}
          onChangeText={setEbayId}
          placeholder="MyApp-Name-PRD-xxxxxxxxx-xxxxxxxx"
          autoCapitalize="none"
        />
        {isSbx && (
          <View
            style={{
              backgroundColor: '#451A03',
              borderRadius: 10,
              padding: 12,
              borderWidth: 1,
              borderColor: '#92400E',
              marginTop: 6,
            }}
          >
            <Text style={{ color: '#FCD34D', fontSize: 13, fontWeight: '600', marginBottom: 4 }}>
              Credenciales Sandbox detectadas
            </Text>
            <Text style={{ color: '#FDE68A', fontSize: 12, lineHeight: 18 }}>
              Tu App ID contiene "SBX": la app usará el entorno Sandbox de eBay,
              que tiene inventario de prueba limitado. Para precios reales, obtén un
              App ID de Producción (PRD) en developer.ebay.com.
            </Text>
          </View>
        )}
        <Field
          label="Client Secret (reservado)"
          value={ebaySec}
          onChangeText={setEbaySec}
          placeholder="PRD-xxxxxxxx"
          autoCapitalize="none"
          secureTextEntry
        />
        <PrimaryButton
          label="Verificar eBay"
          onPress={testEbay}
          loading={verifyingE}
          variant="secondary"
          fullWidth
        />
      </Section>

      <View style={{ marginTop: 8 }}>
        <PrimaryButton label="Guardar claves" onPress={saveNow} size="lg" fullWidth />
        <Text
          style={{
            color: savedAt ? '#22C55E' : '#71717A',
            fontSize: 12,
            textAlign: 'center',
            marginTop: 8,
          }}
        >
          {savedAt
            ? 'Guardado automáticamente'
            : 'Las claves se guardan automáticamente al escribir.'}
        </Text>
      </View>
    </ScrollView>
  );
};
