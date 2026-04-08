import { View, Text, StyleSheet } from 'react-native';
import RNMapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Clock } from 'lucide-react-native';
import { Bar } from '../types';

// Cache uniquement nos markers + noms de rues, sans les POIs Google
const CLEAN_MAP_STYLE = [
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.attraction', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.government', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.medical', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.place_of_worship', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.school', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.sports_complex', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'labels', stylers: [{ visibility: 'on' }] },
];

interface MapViewProps {
  bars: Bar[];
  center: [number, number];
  onBarClick: (bar: Bar) => void;
  checkHappyHour: (bar: Bar) => boolean;
}

export function MapView({ bars, center, onBarClick, checkHappyHour }: MapViewProps) {
  return (
    <View style={{ flex: 1 }}>
      <RNMapView
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFillObject}
        initialRegion={{
          latitude: center[0],
          longitude: center[1],
          latitudeDelta: 0.02,
          longitudeDelta: 0.03,
        }}
        customMapStyle={CLEAN_MAP_STYLE}
        showsUserLocation
        showsMyLocationButton
        showsPointsOfInterest={false}
      >
        {bars.map((bar) => {
          const isHappyHour = checkHappyHour(bar);
          return (
            <Marker
              key={bar.id}
              coordinate={{ latitude: bar.latitude, longitude: bar.longitude }}
              onPress={() => onBarClick(bar)}
              title={bar.name}
              description={`${bar.rating}/5 ★  Bière ${bar.prices.beer}€`}
            >
              <View style={{ alignItems: 'center' }}>
                <View
                  style={{
                    backgroundColor: isHappyHour ? '#FF8B60' : '#8E1212',
                    borderRadius: 20,
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderWidth: 2,
                    borderColor: '#FFFFFF',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 4,
                    elevation: 4,
                  }}
                >
                  <Text style={{ color: '#FDFAEA', fontSize: 11, fontWeight: '700' }}>
                    {bar.name.length > 12 ? bar.name.slice(0, 11) + '…' : bar.name}
                  </Text>
                </View>
                {/* Pointe */}
                <View
                  style={{
                    width: 0,
                    height: 0,
                    borderLeftWidth: 5,
                    borderRightWidth: 5,
                    borderTopWidth: 6,
                    borderLeftColor: 'transparent',
                    borderRightColor: 'transparent',
                    borderTopColor: isHappyHour ? '#FF8B60' : '#8E1212',
                    marginTop: -1,
                  }}
                />
              </View>
            </Marker>
          );
        })}
      </RNMapView>

      {/* Légende */}
      <View
        style={{
          position: 'absolute',
          bottom: 100,
          left: 12,
          backgroundColor: '#FFFFFF',
          borderRadius: 14,
          padding: 12,
          shadowColor: '#100906',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 6,
          borderWidth: 1,
          borderColor: '#E8E0D0',
          minWidth: 150,
        }}
      >
        <Text style={{ fontWeight: '700', fontSize: 12, color: '#100906', marginBottom: 8 }}>
          Légende
        </Text>
        <View style={{ gap: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FF8B60', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 }}>
              <Clock size={10} color="#FDFAEA" strokeWidth={2.5} />
              <Text style={{ color: '#FDFAEA', fontSize: 10, fontWeight: '700' }}>HH</Text>
            </View>
            <Text style={{ fontSize: 12, color: '#6B5C4D' }}>Happy Hour actif</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ backgroundColor: '#8E1212', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 }}>
              <Text style={{ color: '#FDFAEA', fontSize: 10, fontWeight: '700' }}>Bar</Text>
            </View>
            <Text style={{ fontSize: 12, color: '#6B5C4D' }}>Bar disponible</Text>
          </View>
        </View>
      </View>

      {/* Compteur de bars */}
      <View
        style={{
          position: 'absolute',
          top: 12,
          alignSelf: 'center',
          backgroundColor: 'rgba(255,255,255,0.95)',
          borderRadius: 20,
          paddingHorizontal: 16,
          paddingVertical: 7,
          shadowColor: '#100906',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.12,
          shadowRadius: 6,
          elevation: 4,
          borderWidth: 1,
          borderColor: '#E8E0D0',
        }}
      >
        <Text style={{ fontSize: 13, fontWeight: '600', color: '#100906' }}>
          {bars.length} bar{bars.length !== 1 ? 's' : ''} trouvé{bars.length !== 1 ? 's' : ''}
        </Text>
      </View>
    </View>
  );
}
