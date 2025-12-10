import { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Bar, Review } from '../src/types';
import { BarCard } from '../src/components/BarCard';
import { FilterBar } from '../src/components/FilterBar';
import { MapView } from '../src/components/MapView';
import { AuthModal } from '../src/components/AuthModal';
import { getAllBars, seedDatabase } from '../src/utils/api';
import { getSupabaseClient } from '../src/utils/supabase/client';
import * as Location from 'expo-location';

const supabase = getSupabaseClient();

// Icons as simple components
const MapIcon = () => <Text className="text-2xl">🗺️</Text>;
const ListIcon = () => <Text className="text-2xl">📋</Text>;
const UserIcon = () => <Text className="text-2xl">👤</Text>;
const DatabaseIcon = () => <Text className="text-2xl">💾</Text>;
const NavigationIcon = () => <Text className="text-2xl">🧭</Text>;

export default function HomeScreen() {
  const router = useRouter();
  const [view, setView] = useState<'map' | 'list'>('list');
  const [onlyHappyHour, setOnlyHappyHour] = useState(false);
  const [sortBy, setSortBy] = useState('rating');
  const [userLocation, setUserLocation] = useState<[number, number]>([48.8566, 2.3522]);

  // Auth state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Data state
  const [bars, setBars] = useState<Bar[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);

  useEffect(() => {
    checkSession();
    loadBars();
    requestLocation();
  }, []);

  const requestLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation([location.coords.latitude, location.coords.longitude]);
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const checkSession = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session) {
      setUser(session.user);
      await AsyncStorage.setItem('access_token', session.access_token);
    }
  };

  const loadBars = async () => {
    setIsLoading(true);
    const { data, error } = await getAllBars();

    if (error) {
      console.error('Error loading bars:', error);
    } else if (data) {
      setBars(data.bars || []);
    }

    setIsLoading(false);
  };

  const handleBarClick = (bar: Bar) => {
    router.push(`/bar/${bar.id}`);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    await AsyncStorage.removeItem('access_token');
    setUser(null);
  };

  const handleAuthSuccess = (accessToken: string, userData: any) => {
    setUser(userData);
  };

  const handleSeedDatabase = async () => {
    setIsSeeding(true);
    const { error } = await seedDatabase();

    if (error) {
      console.error('Error seeding database:', error);
      Alert.alert('Erreur', "Erreur lors de l'initialisation de la base de données");
    } else {
      Alert.alert('Succès', 'Base de données initialisée avec succès !');
      await loadBars();
    }

    setIsSeeding(false);
  };

  const checkHappyHour = (bar: Bar) => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    return (
      currentTime >= bar.happyHourStart && currentTime <= bar.happyHourEnd
    );
  };

  const filteredAndSortedBars = useMemo(() => {
    let filtered = bars.filter(
      (bar): bar is Bar => bar !== null && bar !== undefined
    );

    if (onlyHappyHour) {
      filtered = filtered.filter(checkHappyHour);
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return (b?.rating || 0) - (a?.rating || 0);
        case 'price-low':
          return (a?.prices?.beer || 0) - (b?.prices?.beer || 0);
        case 'price-high':
          return (b?.prices?.beer || 0) - (a?.prices?.beer || 0);
        case 'distance':
          const distA = Math.sqrt(
            Math.pow((a?.latitude || 0) - userLocation[0], 2) +
              Math.pow((a?.longitude || 0) - userLocation[1], 2)
          );
          const distB = Math.sqrt(
            Math.pow((b?.latitude || 0) - userLocation[0], 2) +
              Math.pow((b?.longitude || 0) - userLocation[1], 2)
          );
          return distA - distB;
        default:
          return 0;
      }
    });

    return filtered;
  }, [bars, onlyHappyHour, sortBy, userLocation]);

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-orange-500 pt-12 pb-4 px-4 shadow-lg">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <NavigationIcon />
            <View>
              <Text className="text-white text-2xl font-bold">Plan B</Text>
              <Text className="text-orange-100 text-sm">
                Trouvez les meilleurs happy hours
              </Text>
            </View>
          </View>

          <View className="flex-row items-center gap-2">
            {bars.length === 0 && !isLoading && (
              <TouchableOpacity
                onPress={handleSeedDatabase}
                disabled={isSeeding}
                className="bg-white px-3 py-2 rounded-lg flex-row items-center"
              >
                {isSeeding ? (
                  <ActivityIndicator size="small" color="#f97316" />
                ) : (
                  <DatabaseIcon />
                )}
              </TouchableOpacity>
            )}

            {user ? (
              <TouchableOpacity
                onPress={handleSignOut}
                className="bg-white p-2 rounded-lg"
              >
                <Text className="text-orange-500 font-semibold">Déconnexion</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => setIsAuthModalOpen(true)}
                className="bg-white px-3 py-2 rounded-lg flex-row items-center gap-2"
              >
                <UserIcon />
                <Text className="text-orange-500 font-semibold">Connexion</Text>
              </TouchableOpacity>
            )}

            <View className="flex-row gap-1">
              <TouchableOpacity
                onPress={() => setView('list')}
                className={`p-2 rounded-lg ${view === 'list' ? 'bg-white' : 'bg-orange-400'}`}
              >
                <ListIcon />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setView('map')}
                className={`p-2 rounded-lg ${view === 'map' ? 'bg-white' : 'bg-orange-400'}`}
              >
                <MapIcon />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* Filters */}
      <FilterBar
        onlyHappyHour={onlyHappyHour}
        setOnlyHappyHour={setOnlyHappyHour}
        sortBy={sortBy}
        setSortBy={setSortBy}
      />

      {/* Main Content */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#f97316" />
          <Text className="text-gray-500 mt-4">Chargement des bars...</Text>
        </View>
      ) : view === 'list' ? (
        <ScrollView className="flex-1 p-4">
          {filteredAndSortedBars.length === 0 ? (
            <View className="items-center py-12">
              <Text className="text-gray-500 text-center">
                {bars.length === 0
                  ? "Aucun bar dans la base de données. Cliquez sur 'Initialiser les données' pour commencer."
                  : 'Aucun bar trouvé avec ces critères'}
              </Text>
            </View>
          ) : (
            <View className="gap-4">
              {filteredAndSortedBars.map((bar) => (
                <BarCard
                  key={bar.id}
                  bar={bar}
                  onClick={() => handleBarClick(bar)}
                  isHappyHourActive={checkHappyHour(bar)}
                />
              ))}
            </View>
          )}
        </ScrollView>
      ) : (
        <MapView
          bars={filteredAndSortedBars}
          center={userLocation}
          onBarClick={handleBarClick}
          checkHappyHour={checkHappyHour}
        />
      )}

      {/* Floating Action Button - Add Bar */}
      <TouchableOpacity
        onPress={() => router.push('/bar/add')}
        className="absolute bottom-6 right-6 bg-orange-500 rounded-full w-16 h-16 items-center justify-center shadow-lg"
        style={{
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 4,
        }}
      >
        <Text className="text-white text-3xl">+</Text>
      </TouchableOpacity>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </View>
  );
}

