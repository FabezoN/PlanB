import { View, Text } from 'react-native';
import { Bar } from '../types';

interface MapViewProps {
  bars: Bar[];
  center: [number, number];
  onBarClick: (bar: Bar) => void;
  checkHappyHour: (bar: Bar) => boolean;
}

export function MapView({ bars, center, onBarClick, checkHappyHour }: MapViewProps) {
  return (
    <View className="flex-1 bg-gradient-to-br from-blue-50 to-green-50 items-center justify-center p-4">
      <View className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <Text className="text-2xl font-bold mb-4 text-center">🗺️ Carte interactive</Text>
        <Text className="text-gray-600 text-center mb-4">
          La vue carte est disponible uniquement sur l'application mobile native.
        </Text>
        <Text className="text-gray-500 text-sm text-center mb-6">
          Utilisez la vue liste pour explorer les bars, ou installez l'application sur votre téléphone pour accéder à la carte interactive avec votre localisation en temps réel.
        </Text>
        
        <View className="gap-3">
          <View className="flex-row items-center gap-3">
            <Text className="text-2xl">📱</Text>
            <Text className="text-gray-700 flex-1">Disponible sur iOS et Android</Text>
          </View>
          <View className="flex-row items-center gap-3">
            <Text className="text-2xl">📍</Text>
            <Text className="text-gray-700 flex-1">Localisation en temps réel</Text>
          </View>
          <View className="flex-row items-center gap-3">
            <Text className="text-2xl">🗺️</Text>
            <Text className="text-gray-700 flex-1">Navigation interactive</Text>
          </View>
        </View>

        <View className="mt-6 pt-6 border-t border-gray-200">
          <Text className="text-sm text-gray-500 text-center">
            {bars.length} bar{bars.length > 1 ? 's' : ''} disponible{bars.length > 1 ? 's' : ''} dans la liste
          </Text>
        </View>
      </View>
    </View>
  );
}


