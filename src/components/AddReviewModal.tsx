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
import { addReview } from '../utils/api';

interface AddReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  barId: string;
  barName: string;
  onSuccess: () => void;
}

const StarIcon = ({ filled }: { filled: boolean }) => (
  <Text className="text-3xl">{filled ? '⭐' : '☆'}</Text>
);

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

      // Reset form
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
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6 max-h-[90%]">
            <View className="flex-row items-center justify-between mb-6">
              <View className="flex-1">
                <Text className="text-xl font-bold">Laisser un avis</Text>
                <Text className="text-gray-600 mt-1">{barName}</Text>
              </View>
              <TouchableOpacity onPress={onClose}>
                <Text className="text-3xl text-gray-500">×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="gap-6">
                <View>
                  <Text className="mb-3 font-semibold text-base">
                    Votre note
                  </Text>
                  <View className="flex-row items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <TouchableOpacity
                        key={star}
                        onPress={() => setRating(star)}
                      >
                        <StarIcon filled={star <= rating} />
                      </TouchableOpacity>
                    ))}
                    {rating > 0 && (
                      <Text className="ml-2 text-gray-600">{rating}/5</Text>
                    )}
                  </View>
                </View>

                <View>
                  <Text className="mb-2 font-semibold">Votre commentaire</Text>
                  <TextInput
                    className="border border-gray-300 rounded-lg px-4 py-3 min-h-[120px]"
                    placeholder="Partagez votre expérience..."
                    value={comment}
                    onChangeText={setComment}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>

                {error ? (
                  <Text className="text-red-500 text-sm">{error}</Text>
                ) : null}

                <View className="flex-row gap-3">
                  <TouchableOpacity
                    onPress={onClose}
                    className="flex-1 bg-gray-200 py-4 rounded-lg"
                  >
                    <Text className="text-gray-700 text-center font-semibold">
                      Annuler
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={isLoading}
                    className="flex-1 bg-orange-500 py-4 rounded-lg"
                  >
                    {isLoading ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text className="text-white text-center font-semibold">
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
