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

const ClockIcon = () => <Text className="text-xl">🕐</Text>;
const EuroIcon = () => <Text className="text-xl">💶</Text>;

export default function EditBarScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [bar, setBar] = useState<Bar | null>(null);

  // Form state
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
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
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
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#f97316" />
        <Text className="text-gray-500 mt-4">Chargement...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <View className="flex-1">
        {/* Header */}
        <View className="bg-orange-500 pt-12 pb-4 px-4">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity onPress={() => router.back()}>
              <Text className="text-white text-3xl">←</Text>
            </TouchableOpacity>
            <Text className="text-white text-xl font-bold">Modifier le bar</Text>
            <View className="w-8" />
          </View>
        </View>

        <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
          {/* Bar Info */}
          <View className="bg-gray-50 rounded-lg p-4 mb-6">
            <Text className="text-lg font-bold mb-1">{bar.name}</Text>
            <Text className="text-gray-600">{bar.address}</Text>
            <Text className="text-sm text-gray-500 mt-2">{bar.type}</Text>
          </View>

          {/* Happy Hour */}
          <View className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
            <View className="flex-row items-center gap-2 mb-4">
              <ClockIcon />
              <Text className="text-lg font-semibold">Horaires Happy Hour</Text>
            </View>

            <View className="flex-row gap-3 mb-2">
              <View className="flex-1">
                <Text className="font-semibold mb-2">Début</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg px-4 py-3"
                  placeholder="17:00"
                  value={happyHourStart}
                  onChangeText={setHappyHourStart}
                  keyboardType="numbers-and-punctuation"
                />
              </View>

              <View className="flex-1">
                <Text className="font-semibold mb-2">Fin</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg px-4 py-3"
                  placeholder="20:00"
                  value={happyHourEnd}
                  onChangeText={setHappyHourEnd}
                  keyboardType="numbers-and-punctuation"
                />
              </View>
            </View>
            <Text className="text-xs text-gray-500">Format: HH:MM (ex: 17:00)</Text>
          </View>

          {/* Prices */}
          <View className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
            <View className="flex-row items-center gap-2 mb-4">
              <EuroIcon />
              <Text className="text-lg font-semibold">Prix Happy Hour</Text>
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text className="font-semibold mb-2">Bière (€)</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg px-4 py-3"
                  placeholder="3.50"
                  value={beerPrice}
                  onChangeText={setBeerPrice}
                  keyboardType="decimal-pad"
                />
              </View>

              <View className="flex-1">
                <Text className="font-semibold mb-2">Cocktail (€)</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg px-4 py-3"
                  placeholder="6.00"
                  value={cocktailPrice}
                  onChangeText={setCocktailPrice}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
          </View>

          {error ? (
            <View className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <Text className="text-red-600 text-center">{error}</Text>
            </View>
          ) : null}

          {/* Save Button */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={isSaving}
            className={`py-4 rounded-lg mb-8 ${
              isSaving ? 'bg-orange-300' : 'bg-orange-500'
            }`}
          >
            {isSaving ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-center font-semibold text-lg">
                Enregistrer les modifications
              </Text>
            )}
          </TouchableOpacity>

          <Text className="text-xs text-gray-500 text-center mb-4">
            💡 Seuls les horaires et les prix peuvent être modifiés
          </Text>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

