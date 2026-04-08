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
import { Pencil, X, MapPin, Clock, Star, User, Plus } from 'lucide-react-native';
import { Bar, Review } from '../../src/types';
import { getBar, getBarReviews } from '../../src/utils/api';
import { AddReviewModal } from '../../src/components/AddReviewModal';
import { AuthModal } from '../../src/components/AuthModal';
import { DefaultBarPhoto } from '../../src/components/DefaultBarPhoto';
import { getSupabaseClient } from '../../src/utils/supabase/client';

const supabase = getSupabaseClient();

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
    const { data: { session } } = await supabase.auth.getSession();
    if (session) setUser(session.user);
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
      <View className="flex-1 items-center justify-center bg-planb-cream">
        <ActivityIndicator size="large" color="#8E1212" />
      </View>
    );
  }

  const isHappyHourActive = checkHappyHour(bar);

  return (
    <View className="flex-1 bg-planb-cream">
      <ScrollView>
        {/* Hero image */}
        <View style={{ position: 'relative', height: 288, width: '100%' }}>
          {bar.photo ? (
            <Image
              source={{ uri: bar.photo }}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
              resizeMode="cover"
            />
          ) : (
            <DefaultBarPhoto width="100%" height={288} />
          )}
          <View className="absolute inset-0" style={{ backgroundColor: 'rgba(14, 9, 6, 0.2)' }} />
          {isHappyHourActive && (
            <View className="absolute top-14 left-4 flex-row items-center gap-1.5 px-4 py-2 rounded-full" style={{ backgroundColor: '#FF8B60' }}>
              <Clock size={13} color="#FDFAEA" strokeWidth={2.5} />
              <Text className="text-planb-cream font-bold text-sm">Happy Hour en cours !</Text>
            </View>
          )}
          <View className="absolute top-14 right-4 flex-row gap-2">
            <TouchableOpacity
              onPress={() => router.push(`/bar/edit/${id}`)}
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: 'rgba(253, 250, 234, 0.9)' }}
            >
              <Pencil size={16} color="#100906" strokeWidth={2} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: 'rgba(253, 250, 234, 0.9)' }}
            >
              <X size={18} color="#100906" strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>

        <View className="px-5 -mt-6">
          {/* Main card */}
          <View className="bg-white rounded-2xl p-5 mb-4" style={{ shadowColor: '#100906', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 }}>
            <View className="flex-row items-start justify-between mb-1">
              <View className="flex-1 mr-3">
                <Text className="text-2xl font-bold text-planb-dark">{bar.name}</Text>
                <View className="mt-1 self-start rounded-full px-3 py-1" style={{ backgroundColor: '#F8ECAB' }}>
                  <Text className="text-planb-dark text-xs font-semibold">{bar.type}</Text>
                </View>
              </View>
              <View className="flex-row items-center gap-1 mt-1">
                <Star size={16} color="#F59E0B" fill="#F59E0B" />
                <Text className="text-xl font-bold text-planb-dark">{bar.rating || 0}</Text>
              </View>
            </View>

            <View className="flex-row items-start gap-2 mt-4">
              <MapPin size={15} color="#6B5C4D" strokeWidth={2} style={{ marginTop: 2 }} />
              <Text className="text-planb-dark opacity-60 flex-1">{bar.address}</Text>
            </View>
          </View>

          {/* Happy Hour card */}
          <View className="bg-white rounded-2xl p-5 mb-4" style={{ shadowColor: '#100906', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 }}>
            <View className="flex-row items-center gap-2 mb-3">
              <Clock size={16} color="#8E1212" strokeWidth={2} />
              <Text className="text-lg font-bold text-planb-dark">Happy Hour</Text>
            </View>
            <View className="rounded-xl px-4 py-2.5 mb-4" style={{ backgroundColor: '#F8ECAB' }}>
              <Text className="text-planb-dark font-semibold text-center">
                {bar.happyHourStart} — {bar.happyHourEnd}
              </Text>
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1 p-4 rounded-xl" style={{ backgroundColor: '#FFF5EE' }}>
                <Text className="text-xs text-planb-dark opacity-50 mb-1">Bière</Text>
                <Text className="text-2xl font-bold" style={{ color: '#8E1212' }}>
                  {bar.prices?.beer || 0}€
                </Text>
              </View>

              <View className="flex-1 p-4 rounded-xl" style={{ backgroundColor: '#FFF5EE' }}>
                <Text className="text-xs text-planb-dark opacity-50 mb-1">Cocktail</Text>
                <Text className="text-2xl font-bold" style={{ color: '#8E1212' }}>
                  {bar.prices?.cocktail || 0}€
                </Text>
              </View>
            </View>
          </View>

          {/* Reviews */}
          <View className="bg-white rounded-2xl p-5 mb-8" style={{ shadowColor: '#100906', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 }}>
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold text-planb-dark">
                Avis ({reviews.length})
              </Text>
              <TouchableOpacity
                onPress={handleAddReview}
                className="px-4 py-2.5 rounded-xl flex-row items-center gap-1.5"
                style={{ backgroundColor: '#FF8B60' }}
              >
                <Plus size={14} color="#FDFAEA" strokeWidth={2.5} />
                <Text className="text-planb-cream font-bold text-sm">Ajouter</Text>
              </TouchableOpacity>
            </View>

            {reviews.length === 0 ? (
              <View className="py-8 items-center">
                <Text className="text-planb-dark opacity-40 text-center">
                  Aucun avis pour le moment
                </Text>
                <Text className="text-planb-dark opacity-30 text-sm mt-2 text-center">
                  Soyez le premier à laisser un avis !
                </Text>
              </View>
            ) : (
              <View className="gap-3">
                {reviews.map((review) => (
                  <View
                    key={review?.id}
                    className="p-4 rounded-xl"
                    style={{ backgroundColor: '#FDFAEA' }}
                  >
                    <View className="flex-row items-start gap-3 mb-2">
                      <View className="w-9 h-9 rounded-full items-center justify-center" style={{ backgroundColor: '#F8ECAB' }}>
                        <User size={16} color="#8E1212" strokeWidth={2} />
                      </View>
                      <View className="flex-1">
                        <View className="flex-row items-center justify-between mb-1">
                          <Text className="font-bold text-planb-dark">
                            {review?.userName}
                          </Text>
                          <Text className="text-xs text-planb-dark opacity-40">
                            {new Date(review?.date).toLocaleDateString('fr-FR')}
                          </Text>
                        </View>

                        <View className="flex-row gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              size={13}
                              color="#F59E0B"
                              fill={i < review?.rating ? '#F59E0B' : 'transparent'}
                              strokeWidth={1.5}
                            />
                          ))}
                        </View>
                      </View>
                    </View>

                    {review?.comment && (
                      <Text className="text-planb-dark opacity-70 mt-1">{review?.comment}</Text>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

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
