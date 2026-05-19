import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, Alert } from 'react-native';
import { useAppConfig } from '@/context/ConfigContext';
import { verifyApiKey as verifyNumista } from '@/services/numistaService';
import { verifyCredentials as verifyEbay } from '@/services/ebayService';
import { PrimaryButton } from '@/components/PrimaryButton';

export const ApiKeysScreen: React.FC = () => {
  const { config, patchConfig } = useAppConfig();
  const [numKey, setNumKey] = useState(config.numistaApiKey);
  const [ebayId, setEbayId] = useState(config.ebayClientId);
  const [ebaySec, setEbaySec] = useState(config.ebayClientSecret);
  const [verifyingN, setVerifyingN] = useState(false);
  const [verifyingE, setVerifyingE] = useState(false);

  const saveAll = async () => {
    await patchConfig({
      numistaApiKey: numKey.trim(),
      ebayClientId: ebayId.trim(),
      ebayClientSecret: ebaySec.trim(),
    });
    Alert.alert('Guardado', 'Las claves se han guardado.');
  };

  const testNumista = async () => {
    setVerifyingN(true);
    try {
      const ok = await verifyNumista(numKey.trim());
      Alert.alert(ok ? '✅ Numista OK' : '❌ Numista falló', ok ? 'La key responde.' : 'Revisa la key.');
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
      Alert.alert(ok ? '✅ eBay OK' : '❌ eBay falló', ok ? 'El App ID responde.' : 'Revisa el App ID.');
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    } finally {
      setVerifyingE(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-bg p-3">
      <Text className="text-white text-xl font-bold mb-3">API Keys</Text>

      <Text className="text-muted text-xs mb-1">
        Numista API Key (header `Numista-API-Key`)
      </Text>
      <TextInput
        value={numKey}
        onChangeText={setNumKey}
        placeholder="Tu API key de Numista"
        placeholderTextColor="#64748b"
        autoCapitalize="none"
        className="bg-surface text-white px-3 py-2 rounded-md mb-2"
      />
      <PrimaryButton label="Verificar Numista" onPress={testNumista} loading={verifyingN} variant="secondary" />

      <View className="h-5" />

      <Text className="text-muted text-xs mb-1">
        eBay Client ID (App ID) — usado para Finding API
      </Text>
      <TextInput
        value={ebayId}
        onChangeText={setEbayId}
        placeholder="MyApp-Name-PRD-xxxxxxxxx-xxxxxxxx"
        placeholderTextColor="#64748b"
        autoCapitalize="none"
        className="bg-surface text-white px-3 py-2 rounded-md mb-2"
      />
      <Text className="text-muted text-xs mb-1">
        eBay Client Secret (no se usa con Finding API; reservado para Browse API futura)
      </Text>
      <TextInput
        value={ebaySec}
        onChangeText={setEbaySec}
        placeholder="PRD-xxxxxxxx"
        placeholderTextColor="#64748b"
        autoCapitalize="none"
        secureTextEntry
        className="bg-surface text-white px-3 py-2 rounded-md mb-2"
      />
      <PrimaryButton label="Verificar eBay" onPress={testEbay} loading={verifyingE} variant="secondary" />

      <View className="h-5" />
      <PrimaryButton label="Guardar claves" onPress={saveAll} />
      <View className="h-16" />
    </ScrollView>
  );
};
