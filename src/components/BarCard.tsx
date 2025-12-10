import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Bar } from '../types';

// Simple icon replacements
const MapPinIcon = () => <Text>📍</Text>;
const ClockIcon = () => <Text>🕐</Text>;
const StarIcon = () => <Text>⭐</Text>;
const EuroIcon = () => <Text>€</Text>;
const MessageIcon = () => <Text>💬</Text>;

interface BarCardProps {
  bar: Bar;
  onClick: () => void;
  isHappyHourActive: boolean;
}

export function BarCard({ bar, onClick, isHappyHourActive }: BarCardProps) {
  return (
    <TouchableOpacity
      onPress={onClick}
      className="bg-white rounded-lg shadow-sm overflow-hidden"
    >
      <View className="relative h-48">
        <Image
          source={{ uri: bar.photo }}
          className="w-full h-full"
          resizeMode="cover"
        />
        {isHappyHourActive && (
          <View className="absolute top-3 right-3 bg-orange-500 px-3 py-1 rounded-full">
            <Text className="text-white text-xs font-semibold">
              Happy Hour en cours
            </Text>
          </View>
        )}
      </View>
      
      <View className="p-4">
        <View className="flex-row items-start justify-between mb-2">
          <View className="flex-1">
            <Text className="text-lg font-semibold mb-1">{bar.name}</Text>
            <Text className="text-gray-500 text-sm">{bar.type}</Text>
          </View>
          <View className="items-end gap-1 ml-2">
            <View className="flex-row items-center gap-1">
              <StarIcon />
              <Text className="font-semibold">{bar.rating || 0}</Text>
            </View>
            {bar.reviewCount !== undefined && bar.reviewCount > 0 && (
              <View className="flex-row items-center gap-1">
                <MessageIcon />
                <Text className="text-xs text-gray-500">{bar.reviewCount}</Text>
              </View>
            )}
          </View>
        </View>
        
        <View className="flex-row items-start gap-2 text-sm text-gray-500 mb-3">
          <MapPinIcon />
          <Text className="text-gray-500 text-sm flex-1" numberOfLines={1}>
            {bar.address}
          </Text>
        </View>
        
        <View className="flex-row items-center gap-2 text-sm text-gray-500 mb-3">
          <ClockIcon />
          <Text className="text-gray-500 text-sm">
            HH: {bar.happyHourStart} - {bar.happyHourEnd}
          </Text>
        </View>
        
        <View className="flex-row items-center gap-4 pt-3 border-t border-gray-200">
          <View className="flex-row items-center gap-1">
            <EuroIcon />
            <Text className="text-sm text-gray-700">
              Bière: {bar.prices?.beer || 0}€
            </Text>
          </View>
          <View className="flex-row items-center gap-1">
            <EuroIcon />
            <Text className="text-sm text-gray-700">
              Cocktail: {bar.prices?.cocktail || 0}€
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
