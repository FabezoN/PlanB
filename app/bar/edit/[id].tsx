import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getBar, updateBar } from '../../../src/utils/api';
import { Bar } from '../../../src/types';

export default function EditBarScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [bar, setBar] = useState<Bar | null>(null);

  const [happyHourStart, setHappyHourStart] = useState('');
  const [happyHourEnd, setHappyHourEnd] = useState('');
  const [beerPrice, setBeerPrice] = useState('');
  const [cocktailPrice, setCocktailPrice] = useState('');

  useEffect(() => {
    loadBar();
  }, [id]);

  const loadBar = async () => {
    setIsLoading(true);
    const { data, error } = await getBar(id);

    if (error || !data) {
      Alert.alert('Erreur', 'Impossible de charger les informations du bar');
      router.back();
      return;
    }

    const barData = data.bar;
    setBar(barData);
    setHappyHourStart(barData.happyHourStart);
    setHappyHourEnd(barData.happyHourEnd);
    setBeerPrice(barData.prices.beer.toString());
    setCocktailPrice(barData.prices.cocktail.toString());
    setIsLoading(false);
  };

  const validateForm = () => {
    if (!happyHourStart.match(/^\d{2}:\d{2}$/)) return 'Format de l\'heure de début invalide (HH:MM)';
    if (!happyHourEnd.match(/^\d{2}:\d{2}$/)) return 'Format de l\'heure de fin invalide (HH:MM)';
    if (!beerPrice || isNaN(Number(beerPrice))) return 'Prix de la bière invalide';
    if (!cocktailPrice || isNaN(Number(cocktailPrice))) return 'Prix du cocktail invalide';
    return null;
  };

  const handleSave = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setIsSaving(true);

    try {
      const updates = {
        happyHourStart,
        happyHourEnd,
        prices: {
          beer: Number(beerPrice),
          cocktail: Number(cocktailPrice),
        },
      };

      const { error } = await updateBar(id, updates);

      if (error) throw new Error(error);

      Alert.alert(
        'Succès !',
        'Le bar a été mis à jour avec succès',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (err: any) {
      console.error('Update bar error:', err);
      setError(err.message || 'Erreur lors de la mise à jour du bar');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !bar) {
    return (
      <View className="flex-1 items-center justify-center bg-planb-cream">
        <ActivityIndicator size="large" color="#8E1212" />
        <Text className="text-planb-dark mt-4 opacity-60">Chargement...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-planb-cream"
    >
      <View className="flex-1">
        {/* Header */}
        <View className="pt-14 pb-5 px-5" style={{ backgroundColor: '#8E1212' }}>
          <View className="flex-row items-center justify-between">
            <TouchableOpacity onPress={() => router.back()} className="w-10">
              <Text className="text-planb-cream text-2xl">←</Text>
            </TouchableOpacity>
            <Text className="text-planb-cream text-xl font-bold">Modifier</Text>
            <View className="w-10" />
          </View>
        </View>

        <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
          {/* Bar Info */}
          <View className="rounded-2xl p-4 mb-5" style={{ backgroundColor: '#F8ECAB' }}>
            <Text className="text-lg font-bold text-planb-dark">{bar.name}</Text>
            <Text className="text-planb-dark opacity-60 mt-1">{bar.address}</Text>
            <View className="self-start mt-2 rounded-full px-3 py-1" style={{ backgroundColor: 'rgba(142, 18, 18, 0.1)' }}>
              <Text className="text-xs font-semibold" style={{ color: '#8E1212' }}>{bar.type}</Text>
            </View>
          </View>

          {/* Happy Hour */}
          <View className="bg-white rounded-2xl p-5 mb-4" style={{ shadowColor: '#100906', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 }}>
            <Text className="text-lg font-bold text-planb-dark mb-4">🕐 Horaires Happy Hour</Text>

            <View className="flex-row gap-3 mb-2">
              <View className="flex-1">
                <Text className="font-semibold text-planb-dark mb-2">Début</Text>
                <TextInput
                  className="rounded-xl px-4 py-3.5 text-planb-dark"
                  style={{ backgroundColor: '#FDFAEA', borderWidth: 1, borderColor: '#E8E0D0' }}
                  placeholder="17:00"
                  placeholderTextColor="#A09080"
                  value={happyHourStart}
                  onChangeText={setHappyHourStart}
                  keyboardType="numbers-and-punctuation"
                />
              </View>

              <View className="flex-1">
                <Text className="font-semibold text-planb-dark mb-2">Fin</Text>
                <TextInput
                  className="rounded-xl px-4 py-3.5 text-planb-dark"
                  style={{ backgroundColor: '#FDFAEA', borderWidth: 1, borderColor: '#E8E0D0' }}
                  placeholder="20:00"
                  placeholderTextColor="#A09080"
                  value={happyHourEnd}
                  onChangeText={setHappyHourEnd}
                  keyboardType="numbers-and-punctuation"
                />
              </View>
            </View>
            <Text className="text-xs text-planb-dark opacity-40">Format: HH:MM</Text>
          </View>

          {/* Prices */}
          <View className="bg-white rounded-2xl p-5 mb-4" style={{ shadowColor: '#100906', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 }}>
            <Text className="text-lg font-bold text-planb-dark mb-4">💶 Prix Happy Hour</Text>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text className="font-semibold text-planb-dark mb-2">Bière (€)</Text>
                <TextInput
                  className="rounded-xl px-4 py-3.5 text-planb-dark"
                  style={{ backgroundColor: '#FDFAEA', borderWidth: 1, borderColor: '#E8E0D0' }}
                  placeholder="3.50"
                  placeholderTextColor="#A09080"
                  value={beerPrice}
                  onChangeText={setBeerPrice}
                  keyboardType="decimal-pad"
                />
              </View>

              <View className="flex-1">
                <Text className="font-semibold text-planb-dark mb-2">Cocktail (€)</Text>
                <TextInput
                  className="rounded-xl px-4 py-3.5 text-planb-dark"
                  style={{ backgroundColor: '#FDFAEA', borderWidth: 1, borderColor: '#E8E0D0' }}
                  placeholder="6.00"
                  placeholderTextColor="#A09080"
                  value={cocktailPrice}
                  onChangeText={setCocktailPrice}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
          </View>

          {error ? (
            <View className="rounded-xl p-4 mb-4" style={{ backgroundColor: '#FEE2E2' }}>
              <Text className="text-center font-semibold" style={{ color: '#8E1212' }}>{error}</Text>
            </View>
          ) : null}

          {/* Save */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={isSaving}
            className="py-4 rounded-xl mb-4 items-center"
            style={{ backgroundColor: isSaving ? '#D4A08A' : '#FF8B60' }}
          >
            {isSaving ? (
              <ActivityIndicator color="#FDFAEA" />
            ) : (
              <Text className="text-planb-cream text-center font-bold text-lg">
                Enregistrer
              </Text>
            )}
          </TouchableOpacity>

          <Text className="text-xs text-planb-dark opacity-40 text-center mb-8">
            Seuls les horaires et les prix peuvent être modifiés
          </Text>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}
