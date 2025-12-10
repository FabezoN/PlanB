import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Bar, Review } from '../../src/types';
import { getBar, getBarReviews } from '../../src/utils/api';
import { AddReviewModal } from '../../src/components/AddReviewModal';
import { AuthModal } from '../../src/components/AuthModal';
import { getSupabaseClient } from '../../src/utils/supabase/client';

const supabase = getSupabaseClient();

const MapPinIcon = () => <Text>📍</Text>;
const ClockIcon = () => <Text>🕐</Text>;
const StarIcon = ({ filled }: { filled: boolean }) => (
  <Text className="text-lg">{filled ? '⭐' : '☆'}</Text>
);
const EuroIcon = () => <Text>€</Text>;
const UserIcon = () => <Text>👤</Text>;
const PlusIcon = () => <Text className="text-xl">+</Text>;

export default function BarDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [bar, setBar] = useState<Bar | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddReviewModalOpen, setIsAddReviewModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadBarDetails();
    checkSession();
  }, [id]);

  const checkSession = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session) {
      setUser(session.user);
    }
  };

  const loadBarDetails = async () => {
    setIsLoading(true);
    const [barResult, reviewsResult] = await Promise.all([
      getBar(id),
      getBarReviews(id),
    ]);

    if (barResult.data) {
      setBar(barResult.data.bar);
    }

    if (reviewsResult.data) {
      setReviews(reviewsResult.data.reviews || []);
    }

    setIsLoading(false);
  };

  const checkHappyHour = (bar: Bar) => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;
    return (
      currentTime >= bar.happyHourStart && currentTime <= bar.happyHourEnd
    );
  };

  const handleAddReview = () => {
    if (!user) {
      setIsAuthModalOpen(true);
    } else {
      setIsAddReviewModalOpen(true);
    }
  };

  const handleReviewAdded = async () => {
    await loadBarDetails();
  };

  const handleAuthSuccess = () => {
    checkSession();
    setIsAddReviewModalOpen(true);
  };

  if (isLoading || !bar) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#f97316" />
      </View>
    );
  }

  const isHappyHourActive = checkHappyHour(bar);

  return (
    <View className="flex-1 bg-white">
      <ScrollView>
        {/* Header */}
        <View className="relative">
          <Image
            source={{ uri: bar.photo }}
            className="w-full h-64"
            resizeMode="cover"
          />
          {isHappyHourActive && (
            <View className="absolute top-4 left-4 bg-orange-500 px-4 py-2 rounded-full">
              <Text className="text-white font-semibold">
                Happy Hour en cours !
              </Text>
            </View>
          )}
          <View className="absolute top-12 right-4 flex-row gap-2">
            <TouchableOpacity
              onPress={() => router.push(`/bar/edit/${id}`)}
              className="bg-white rounded-full p-2 shadow-lg"
            >
              <Text className="text-xl">✏️</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.back()}
              className="bg-white rounded-full p-2 shadow-lg"
            >
              <Text className="text-2xl">×</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="p-6 gap-6">
          {/* Bar Info */}
          <View>
            <View className="flex-row items-start justify-between mb-2">
              <View className="flex-1">
                <Text className="text-2xl font-bold mb-1">{bar.name}</Text>
                <Text className="text-gray-600">{bar.type}</Text>
              </View>
              <View className="flex-row items-center gap-1">
                <StarIcon filled />
                <Text className="text-xl font-semibold">{bar.rating || 0}</Text>
              </View>
            </View>

            <View className="flex-row items-start gap-2 mt-4">
              <MapPinIcon />
              <Text className="text-gray-600 flex-1">{bar.address}</Text>
            </View>
          </View>

          {/* Separator */}
          <View className="h-px bg-gray-200" />

          {/* Happy Hour */}
          <View>
            <View className="flex-row items-center gap-2 mb-3">
              <ClockIcon />
              <Text className="text-lg font-semibold">Happy Hour</Text>
            </View>
            <Text className="text-gray-600 mb-4">
              De {bar.happyHourStart} à {bar.happyHourEnd}
            </Text>

            <View className="flex-row gap-4">
              <View className="flex-1 p-4 rounded-lg bg-green-50 border border-green-200">
                <View className="flex-row items-center gap-2 mb-2">
                  <EuroIcon />
                  <Text className="text-sm text-gray-600">Bière</Text>
                </View>
                <Text className="text-2xl text-green-700 font-bold">
                  {bar.prices?.beer || 0}€
                </Text>
              </View>

              <View className="flex-1 p-4 rounded-lg bg-green-50 border border-green-200">
                <View className="flex-row items-center gap-2 mb-2">
                  <EuroIcon />
                  <Text className="text-sm text-gray-600">Cocktail</Text>
                </View>
                <Text className="text-2xl text-green-700 font-bold">
                  {bar.prices?.cocktail || 0}€
                </Text>
              </View>
            </View>
          </View>

          {/* Separator */}
          <View className="h-px bg-gray-200" />

          {/* Reviews */}
          <View>
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold">
                Avis des clients ({reviews.length})
              </Text>
              <TouchableOpacity
                onPress={handleAddReview}
                className="bg-orange-500 px-4 py-2 rounded-lg flex-row items-center gap-2"
              >
                <PlusIcon />
                <Text className="text-white font-semibold">Ajouter</Text>
              </TouchableOpacity>
            </View>

            {reviews.length === 0 ? (
              <View className="py-8 items-center">
                <Text className="text-gray-500 text-center">
                  Aucun avis pour le moment
                </Text>
                <Text className="text-gray-400 text-sm mt-2 text-center">
                  Soyez le premier à laisser un avis !
                </Text>
              </View>
            ) : (
              <View className="gap-4">
                {reviews.map((review) => (
                  <View
                    key={review?.id}
                    className="p-4 rounded-lg border border-gray-200"
                  >
                    <View className="flex-row items-start gap-3 mb-3">
                      <View className="w-10 h-10 rounded-full bg-gray-200 items-center justify-center">
                        <UserIcon />
                      </View>
                      <View className="flex-1">
                        <View className="flex-row items-center justify-between mb-1">
                          <Text className="font-semibold">
                            {review?.userName}
                          </Text>
                          <Text className="text-sm text-gray-500">
                            {new Date(review?.date).toLocaleDateString('fr-FR')}
                          </Text>
                        </View>

                        <View className="flex-row gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <StarIcon key={i} filled={i < review?.rating} />
                          ))}
                        </View>
                      </View>
                    </View>

                    {review?.comment && (
                      <Text className="text-gray-600">{review?.comment}</Text>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      {bar && (
        <AddReviewModal
          isOpen={isAddReviewModalOpen}
          onClose={() => setIsAddReviewModalOpen(false)}
          barId={bar.id}
          barName={bar.name}
          onSuccess={handleReviewAdded}
        />
      )}
    </View>
  );
}

