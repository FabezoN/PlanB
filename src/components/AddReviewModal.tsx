import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Star, X } from 'lucide-react-native';
import { addReview } from '../utils/api';

interface AddReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  barId: string;
  barName: string;
  onSuccess: () => void;
}

export function AddReviewModal({
  isOpen,
  onClose,
  barId,
  barName,
  onSuccess,
}: AddReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Veuillez sélectionner une note');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const { error } = await addReview(barId, rating, comment);

      if (error) throw new Error(error);

      setRating(0);
      setComment('');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Add review error:', err);
      setError(err.message || "Erreur lors de l'ajout de l'avis");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(16, 9, 6, 0.5)' }}>
          <View className="rounded-t-3xl p-6 max-h-[90%]" style={{ backgroundColor: '#FDFAEA' }}>
            <View className="flex-row items-center justify-between mb-6">
              <View className="flex-1">
                <Text className="text-xl font-bold" style={{ color: '#100906' }}>Laisser un avis</Text>
                <Text className="mt-1 opacity-60" style={{ color: '#100906' }}>{barName}</Text>
              </View>
              <TouchableOpacity onPress={onClose} className="w-9 h-9 rounded-full items-center justify-center" style={{ backgroundColor: '#F3EDD8' }}>
                <X size={18} color="#100906" strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="gap-6">
                <View>
                  <Text className="mb-3 font-bold text-base" style={{ color: '#100906' }}>
                    Votre note
                  </Text>
                  <View className="flex-row items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <TouchableOpacity key={star} onPress={() => setRating(star)}>
                        <Star
                          size={32}
                          color="#F59E0B"
                          fill={star <= rating ? '#F59E0B' : 'transparent'}
                          strokeWidth={1.5}
                        />
                      </TouchableOpacity>
                    ))}
                    {rating > 0 && (
                      <Text className="ml-2 font-semibold" style={{ color: '#8E1212' }}>{rating}/5</Text>
                    )}
                  </View>
                </View>

                <View>
                  <Text className="mb-2 font-bold" style={{ color: '#100906' }}>Votre commentaire</Text>
                  <TextInput
                    className="rounded-xl px-4 py-3 min-h-[120px]"
                    style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8E0D0', color: '#100906' }}
                    placeholder="Partagez votre expérience..."
                    placeholderTextColor="#A09080"
                    value={comment}
                    onChangeText={setComment}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>

                {error ? (
                  <Text className="text-sm font-semibold" style={{ color: '#8E1212' }}>{error}</Text>
                ) : null}

                <View className="flex-row gap-3">
                  <TouchableOpacity
                    onPress={onClose}
                    className="flex-1 py-4 rounded-xl"
                    style={{ backgroundColor: '#F3EDD8' }}
                  >
                    <Text className="text-center font-bold" style={{ color: '#100906' }}>
                      Annuler
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={isLoading}
                    className="flex-1 py-4 rounded-xl"
                    style={{ backgroundColor: isLoading ? '#D4A08A' : '#FF8B60' }}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#FDFAEA" />
                    ) : (
                      <Text className="text-center font-bold" style={{ color: '#FDFAEA' }}>
                        Publier
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
