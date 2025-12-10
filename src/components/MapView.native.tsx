import { View, Text, StyleSheet } from 'react-native';
import RNMapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Bar } from '../types';

interface MapViewProps {
  bars: Bar[];
  center: [number, number];
  onBarClick: (bar: Bar) => void;
  checkHappyHour: (bar: Bar) => boolean;
}

export function MapView({ bars, center, onBarClick, checkHappyHour }: MapViewProps) {
  return (
    <View className="flex-1">
      <RNMapView
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFillObject}
        initialRegion={{
          latitude: center[0],
          longitude: center[1],
          latitudeDelta: 0.02,
          longitudeDelta: 0.03,
        }}
        showsUserLocation
        showsMyLocationButton
      >
        {bars.map((bar) => {
          const isHappyHour = checkHappyHour(bar);
          
          return (
            <Marker
              key={bar.id}
              coordinate={{
                latitude: bar.latitude,
                longitude: bar.longitude,
              }}
              pinColor={isHappyHour ? '#f97316' : '#ef4444'}
              onPress={() => onBarClick(bar)}
              title={bar.name}
              description={`${bar.rating}/5 ⭐ | 🍺 ${bar.prices.beer}€`}
            >
              <View className="items-center">
                <View
                  className={`${
                    isHappyHour ? 'bg-orange-500' : 'bg-red-500'
                  } rounded-full p-2 border-2 border-white shadow-lg`}
                >
                  <Text className="text-white text-lg">📍</Text>
                </View>
              </View>
            </Marker>
          );
        })}
      </RNMapView>

      {/* Legend */}
      <View className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4">
        <Text className="font-semibold mb-3 text-lg">Légende</Text>
        <View className="gap-2">
          <View className="flex-row items-center gap-2">
            <View className="bg-orange-500 rounded-full p-1">
              <Text>📍</Text>
            </View>
            <Text className="text-sm">Happy Hour actif</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <View className="bg-red-500 rounded-full p-1">
              <Text>📍</Text>
            </View>
            <Text className="text-sm">Bar disponible</Text>
          </View>
        </View>
      </View>

      {/* Info banner */}
      <View className="absolute top-4 self-center">
        <View className="bg-white/90 rounded-full px-4 py-2 shadow-md">
          <Text className="text-sm font-semibold">
            {bars.length} bar{bars.length > 1 ? 's' : ''} trouvé{bars.length > 1 ? 's' : ''}
          </Text>
        </View>
      </View>
    </View>
  );
}


