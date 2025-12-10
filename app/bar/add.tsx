import { useState } from 'react';
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
import { useRouter } from 'expo-router';
import { createBar } from '../../src/utils/api';

const PlusIcon = () => <Text className="text-xl">➕</Text>;
const LocationIcon = () => <Text className="text-xl">📍</Text>;
const PhotoIcon = () => <Text className="text-xl">📷</Text>;
const ClockIcon = () => <Text className="text-xl">🕐</Text>;
const EuroIcon = () => <Text className="text-xl">💶</Text>;
const TagIcon = () => <Text className="text-xl">🏷️</Text>;

export default function AddBarScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [type, setType] = useState('');
  const [photo, setPhoto] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [happyHourStart, setHappyHourStart] = useState('');
  const [happyHourEnd, setHappyHourEnd] = useState('');
  const [beerPrice, setBeerPrice] = useState('');
  const [cocktailPrice, setCocktailPrice] = useState('');

  const validateForm = () => {
    if (!name.trim()) return 'Le nom du bar est requis';
    if (!address.trim()) return 'L\'adresse est requise';
    if (!type.trim()) return 'Le type de bar est requis';
    if (!happyHourStart.match(/^\d{2}:\d{2}$/)) return 'Format de l\'heure de début invalide (HH:MM)';
    if (!happyHourEnd.match(/^\d{2}:\d{2}$/)) return 'Format de l\'heure de fin invalide (HH:MM)';
    if (!beerPrice || isNaN(Number(beerPrice))) return 'Prix de la bière invalide';
    if (!cocktailPrice || isNaN(Number(cocktailPrice))) return 'Prix du cocktail invalide';
    
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (latitude && (isNaN(lat) || lat < -90 || lat > 90)) return 'Latitude invalide';
    if (longitude && (isNaN(lng) || lng < -180 || lng > 180)) return 'Longitude invalide';
    
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const barData = {
        name: name.trim(),
        address: address.trim(),
        type: type.trim(),
        photo: photo.trim() || 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800',
        latitude: latitude ? Number(latitude) : 48.8566,
        longitude: longitude ? Number(longitude) : 2.3522,
        happyHourStart,
        happyHourEnd,
        prices: {
          beer: Number(beerPrice),
          cocktail: Number(cocktailPrice),
        },
      };

      const { data, error } = await createBar(barData);

      if (error) throw new Error(error);

      Alert.alert(
        'Succès !',
        'Le bar a été ajouté avec succès',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (err: any) {
      console.error('Add bar error:', err);
      setError(err.message || 'Erreur lors de l\'ajout du bar');
    } finally {
      setIsLoading(false);
    }
  };

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
            <Text className="text-white text-2xl font-bold">Ajouter un Bar</Text>
            <View className="w-8" />
          </View>
        </View>

        <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
          {/* Basic Info */}
          <View className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
            <Text className="text-lg font-semibold mb-4">Informations de base</Text>

            <View className="mb-4">
              <View className="flex-row items-center gap-2 mb-2">
                <TagIcon />
                <Text className="font-semibold">Nom du bar *</Text>
              </View>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3"
                placeholder="Le nom du bar"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View className="mb-4">
              <View className="flex-row items-center gap-2 mb-2">
                <LocationIcon />
                <Text className="font-semibold">Adresse *</Text>
              </View>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3"
                placeholder="123 Rue de la Paix, Paris"
                value={address}
                onChangeText={setAddress}
                multiline
              />
            </View>

            <View className="mb-4">
              <View className="flex-row items-center gap-2 mb-2">
                <TagIcon />
                <Text className="font-semibold">Type de bar *</Text>
              </View>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3"
                placeholder="Bar à cocktails, Pub, Brasserie..."
                value={type}
                onChangeText={setType}
              />
            </View>

            <View className="mb-4">
              <View className="flex-row items-center gap-2 mb-2">
                <PhotoIcon />
                <Text className="font-semibold">URL de la photo</Text>
              </View>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3"
                placeholder="https://exemple.com/photo.jpg"
                value={photo}
                onChangeText={setPhoto}
                autoCapitalize="none"
                keyboardType="url"
              />
              <Text className="text-xs text-gray-500 mt-1">
                Laisser vide pour une photo par défaut
              </Text>
            </View>
          </View>

          {/* Location */}
          <View className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
            <Text className="text-lg font-semibold mb-4">Coordonnées GPS (optionnel)</Text>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text className="font-semibold mb-2">Latitude</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg px-4 py-3"
                  placeholder="48.8566"
                  value={latitude}
                  onChangeText={setLatitude}
                  keyboardType="decimal-pad"
                />
              </View>

              <View className="flex-1">
                <Text className="font-semibold mb-2">Longitude</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg px-4 py-3"
                  placeholder="2.3522"
                  value={longitude}
                  onChangeText={setLongitude}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
            <Text className="text-xs text-gray-500 mt-2">
              Utilisé pour afficher le bar sur la carte
            </Text>
          </View>

          {/* Happy Hour */}
          <View className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
            <View className="flex-row items-center gap-2 mb-4">
              <ClockIcon />
              <Text className="text-lg font-semibold">Happy Hour *</Text>
            </View>

            <View className="flex-row gap-3 mb-4">
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
              <Text className="text-lg font-semibold">Prix Happy Hour *</Text>
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

          <Text className="text-xs text-gray-500 text-center mb-4">
            * Champs obligatoires
          </Text>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isLoading}
            className={`py-4 rounded-lg mb-8 ${
              isLoading ? 'bg-orange-300' : 'bg-orange-500'
            }`}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-center font-semibold text-lg">
                Ajouter le bar
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

