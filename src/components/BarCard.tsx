import { View, Text, Image, TouchableOpacity } from 'react-native';
import { MapPin, Clock, Star, Heart } from 'lucide-react-native';
import { Bar } from '../types';
import { PriceColor } from '../hooks/useUserPrefs';
import { DefaultBarPhoto } from './DefaultBarPhoto';

const PRICE_COLOR_MAP: Record<PriceColor, string> = {
  green: '#22C55E',
  orange: '#F97316',
  red: '#EF4444',
};

interface BarCardProps {
  bar: Bar;
  onClick: () => void;
  isHappyHourActive: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: (barId: string) => void;
  priceColor?: PriceColor;
}

export function BarCard({
  bar,
  onClick,
  isHappyHourActive,
  isFavorite = false,
  onToggleFavorite,
  priceColor,
}: BarCardProps) {
  return (
    <TouchableOpacity
      onPress={onClick}
      className="bg-white rounded-2xl overflow-hidden"
      style={{
        shadowColor: '#100906',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
      }}
    >
      <View style={{ position: 'relative', height: 176, width: '100%' }}>
        {bar.photo ? (
          <Image
            source={{ uri: bar.photo }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            resizeMode="cover"
          />
        ) : (
          <DefaultBarPhoto width="100%" height={176} />
        )}
        <View className="absolute inset-0" style={{ backgroundColor: 'rgba(14, 9, 6, 0.15)' }} />

        {isHappyHourActive && (
          <View
            className="absolute top-3 left-3 flex-row items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{ backgroundColor: '#FF8B60' }}
          >
            <Clock size={11} color="#FDFAEA" strokeWidth={2.5} />
            <Text style={{ color: '#FDFAEA', fontSize: 12, fontWeight: '700' }}>Happy Hour</Text>
          </View>
        )}

        {onToggleFavorite && (
          <TouchableOpacity
            onPress={() => onToggleFavorite(bar.id)}
            className="absolute top-3 right-3 w-9 h-9 rounded-full items-center justify-center"
            style={{ backgroundColor: isFavorite ? '#8E1212' : 'rgba(253, 250, 234, 0.85)' }}
          >
            <Heart
              size={16}
              color={isFavorite ? '#FDFAEA' : '#8E1212'}
              fill={isFavorite ? '#FDFAEA' : 'transparent'}
              strokeWidth={2}
            />
          </TouchableOpacity>
        )}

        {/* Price badges */}
        <View className="absolute bottom-3 left-3 flex-row gap-2 items-center">
          {priceColor && (
            <View className="w-3 h-3 rounded-full" style={{ backgroundColor: PRICE_COLOR_MAP[priceColor] }} />
          )}
          <View className="px-3 py-1.5 rounded-full" style={{ backgroundColor: 'rgba(253, 250, 234, 0.92)' }}>
            <Text className="text-xs font-bold" style={{ color: '#8E1212' }}>
              Bière {bar.prices?.beer || 0}€
            </Text>
          </View>
          <View className="px-3 py-1.5 rounded-full" style={{ backgroundColor: 'rgba(253, 250, 234, 0.92)' }}>
            <Text className="text-xs font-bold" style={{ color: '#8E1212' }}>
              Cocktail {bar.prices?.cocktail || 0}€
            </Text>
          </View>
        </View>
      </View>

      <View className="p-4">
        <View className="flex-row items-start justify-between mb-2">
          <View className="flex-1 mr-2">
            <Text className="text-lg font-bold" style={{ color: '#100906' }}>{bar.name}</Text>
            <View className="self-start mt-1 rounded-full px-2.5 py-0.5" style={{ backgroundColor: '#F8ECAB' }}>
              <Text className="text-xs font-semibold" style={{ color: '#100906' }}>{bar.type}</Text>
            </View>
          </View>
          <View className="items-end gap-0.5">
            <View className="flex-row items-center gap-1">
              <Star size={13} color="#F59E0B" fill="#F59E0B" />
              <Text className="font-bold" style={{ color: '#100906' }}>{bar.rating || 0}</Text>
            </View>
            {bar.reviewCount !== undefined && bar.reviewCount > 0 && (
              <Text className="text-xs" style={{ color: '#8E1212' }}>{bar.reviewCount} avis</Text>
            )}
          </View>
        </View>

        <View className="flex-row items-center gap-2 mt-1">
          <MapPin size={13} color="#6B5C4D" strokeWidth={2} />
          <Text className="text-sm flex-1 opacity-60" style={{ color: '#100906' }} numberOfLines={1}>
            {bar.address}
          </Text>
        </View>

        <View className="flex-row items-center gap-2 mt-1.5">
          <Clock size={13} color="#6B5C4D" strokeWidth={2} />
          <Text className="text-sm opacity-60" style={{ color: '#100906' }}>
            {bar.happyHourStart} — {bar.happyHourEnd}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
