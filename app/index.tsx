import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { RefreshCw, Heart } from 'lucide-react-native';
import { Bar } from '../src/types';
import { BarCard } from '../src/components/BarCard';
import { FilterBar, ColorFilter } from '../src/components/FilterBar';
import { MapView } from '../src/components/MapView';
import { AuthModal } from '../src/components/AuthModal';
import { BottomTabBar } from '../src/components/BottomTabBar';
import { LogoPlanB } from '../src/components/LogoPlanB';
import { getAllBars, seedDatabase } from '../src/utils/api';
import { getSupabaseClient } from '../src/utils/supabase/client';
import { useUserPrefs } from '../src/hooks/useUserPrefs';
import * as Location from 'expo-location';

const supabase = getSupabaseClient();

type ActiveTab = 'list' | 'map' | 'favorites';

export default function HomeScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ActiveTab>('list');
  const [onlyHappyHour, setOnlyHappyHour] = useState(false);
  const [colorFilter, setColorFilter] = useState<ColorFilter>('all');
  const [minRating, setMinRating] = useState(0);
  const [selectedType, setSelectedType] = useState('all');
  const [userLocation, setUserLocation] = useState<[number, number]>([44.8378, -0.5792]);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  const [bars, setBars] = useState<Bar[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const { favorites, toggleFavorite, getPriceColor, reloadPrefs } = useUserPrefs();

  useEffect(() => {
    checkSession();
    loadBars();
    requestLocation();
  }, []);

  useFocusEffect(
    useCallback(() => {
      reloadPrefs();
      checkSession();
      loadBars();
    }, [])
  );

  const requestLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation([location.coords.latitude, location.coords.longitude]);
      }
    } catch (_) {}
  };

  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user ?? null);
  };

  const loadBars = async () => {
    setIsLoading(true);
    const { data, error } = await getAllBars();
    if (!error && data) setBars(data.bars || []);
    setIsLoading(false);
  };

  const handlePullToRefresh = useCallback(async () => {
    setIsRefreshing(true);
    const { data, error } = await getAllBars();
    if (!error && data) setBars(data.bars || []);
    setIsRefreshing(false);
  }, []);

  const handleBarClick = (bar: Bar) => router.push(`/bar/${bar.id}`);
  const handleAuthSuccess = (_token: string, userData: any) => setUser(userData);

  const handleAddBar = () => {
    if (!user) {
      Alert.alert(
        'Connexion requise',
        'Vous devez être connecté pour ajouter un bar.',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Se connecter', onPress: () => setIsAuthModalOpen(true) },
        ]
      );
      return;
    }
    router.push('/bar/add');
  };

  const handleFavoritesTab = () => {
    if (!user) {
      Alert.alert(
        'Connexion requise',
        'Connectez-vous pour accéder à vos bars favoris.',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Se connecter', onPress: () => setIsAuthModalOpen(true) },
        ]
      );
      return;
    }
    setActiveTab('favorites');
  };

  const handleSeedDatabase = async () => {
    setIsSeeding(true);
    const { error } = await seedDatabase();
    if (error) {
      Alert.alert('Erreur', "Erreur lors de l'initialisation de la base de données");
    } else {
      Alert.alert('Succès', 'Base de données initialisée !');
      await loadBars();
    }
    setIsSeeding(false);
  };

  const checkHappyHour = (bar: Bar) => {
    const now = new Date();
    const t = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    return t >= bar.happyHourStart && t <= bar.happyHourEnd;
  };

  const availableTypes = useMemo(() => {
    const types = bars
      .map((b) => b?.type)
      .filter((t): t is string => !!t);
    return [...new Set(types)].sort();
  }, [bars]);

  const filteredAndSortedBars = useMemo(() => {
    let filtered = bars.filter((bar): bar is Bar => bar !== null && bar !== undefined);
    if (onlyHappyHour) filtered = filtered.filter(checkHappyHour);
    if (colorFilter !== 'all') filtered = filtered.filter((bar) => getPriceColor(bar.prices?.beer || 0) === colorFilter);
    if (minRating > 0) filtered = filtered.filter((bar) => (bar.rating || 0) >= minRating);
    if (selectedType !== 'all') filtered = filtered.filter((bar) => bar.type === selectedType);
    // Trier par note par défaut
    filtered.sort((a, b) => (b?.rating || 0) - (a?.rating || 0));
    return filtered;
  }, [bars, onlyHappyHour, colorFilter, minRating, selectedType, userLocation, getPriceColor]);

  const favoriteBars = useMemo(
    () => filteredAndSortedBars.filter((b) => favorites.includes(b.id)),
    [filteredAndSortedBars, favorites]
  );

  const displayedBars = activeTab === 'favorites' ? favoriteBars : filteredAndSortedBars;

  return (
    <View className="flex-1" style={{ backgroundColor: '#FDFAEA' }}>
      {/* Header */}
      <View style={{ backgroundColor: '#8E1212', paddingTop: 52, paddingBottom: 6, alignItems: 'center', justifyContent: 'center' }}>
        {/* Bouton refresh positionné en absolu à droite */}
        <TouchableOpacity
          onPress={handleSeedDatabase}
          disabled={isSeeding}
          style={{
            position: 'absolute',
            right: 20,
            bottom: 6,
            width: 36,
            height: 36,
            borderRadius: 18,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(253, 250, 234, 0.15)',
          }}
        >
          {isSeeding
            ? <ActivityIndicator size="small" color="#FDFAEA" />
            : <RefreshCw size={18} color="#FDFAEA" />
          }
        </TouchableOpacity>
        <LogoPlanB size={64} />
      </View>

      {/* Filters — présents sur les 3 onglets */}
      <FilterBar
        onlyHappyHour={onlyHappyHour}
        setOnlyHappyHour={setOnlyHappyHour}
        colorFilter={colorFilter}
        setColorFilter={setColorFilter}
        minRating={minRating}
        setMinRating={setMinRating}
        selectedType={selectedType}
        setSelectedType={setSelectedType}
        availableTypes={availableTypes}
        isAuthenticated={!!user}
      />

      {/* Main Content */}
      <View className="flex-1">
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#8E1212" />
            <Text className="mt-4 opacity-60" style={{ color: '#100906' }}>Chargement des bars...</Text>
          </View>
        ) : activeTab === 'map' ? (
          <MapView
            bars={filteredAndSortedBars}
            center={userLocation}
            onBarClick={handleBarClick}
            checkHappyHour={checkHappyHour}
          />
        ) : (
          <ScrollView
            className="flex-1 px-4 pt-3"
            refreshControl={
              activeTab === 'list' ? (
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={handlePullToRefresh}
                  colors={['#8E1212']}
                  tintColor="#8E1212"
                  title="Actualisation..."
                  titleColor="#8E1212"
                />
              ) : undefined
            }
          >
            {displayedBars.length === 0 ? (
              <View className="items-center py-16">
                {activeTab === 'favorites' ? (
                  <>
                    <Heart size={48} color="#E8E0D0" strokeWidth={1.5} />
                    <Text className="text-base font-bold mt-4 mb-1" style={{ color: '#100906' }}>
                      Aucun favori
                    </Text>
                    <Text className="text-sm text-center opacity-60" style={{ color: '#100906' }}>
                      Appuyez sur le cœur d'un bar{'\n'}pour l'ajouter à vos favoris
                    </Text>
                  </>
                ) : (
                  <Text className="text-center opacity-50" style={{ color: '#100906' }}>
                    {bars.length === 0
                      ? 'Aucun bar. Tirez vers le bas pour actualiser.'
                      : 'Aucun bar avec ces critères'}
                  </Text>
                )}
              </View>
            ) : (
              <View className="gap-4 pb-28">
                {displayedBars.map((bar) => (
                  <BarCard
                    key={bar.id}
                    bar={bar}
                    onClick={() => handleBarClick(bar)}
                    isHappyHourActive={checkHappyHour(bar)}
                    isFavorite={favorites.includes(bar.id)}
                    onToggleFavorite={toggleFavorite}
                    priceColor={user ? getPriceColor(bar.prices?.beer || 0) : undefined}
                  />
                ))}
              </View>
            )}
          </ScrollView>
        )}
      </View>

      {/* Bottom Tab Bar */}
      <View className="absolute bottom-0 left-0 right-0">
        <BottomTabBar
          activeTab={activeTab}
          user={user}
          favorites={favorites}
          onTabPress={(tab) => {
            if (tab === 'favorites') { handleFavoritesTab(); return; }
            setActiveTab(tab as 'list' | 'map');
          }}
          onAddPress={handleAddBar}
          onOpenAuth={() => setIsAuthModalOpen(true)}
        />
      </View>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </View>
  );
}

