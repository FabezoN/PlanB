import { View, Text, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';

const FilterIcon = () => <Text>🔍</Text>;
const ClockIcon = () => <Text>🕐</Text>;

interface FilterBarProps {
  onlyHappyHour: boolean;
  setOnlyHappyHour: (value: boolean) => void;
  sortBy: string;
  setSortBy: (value: string) => void;
}

export function FilterBar({
  onlyHappyHour,
  setOnlyHappyHour,
  sortBy,
  setSortBy,
}: FilterBarProps) {
  return (
    <View className="bg-white border-b border-gray-200 p-4">
      <View className="flex-row items-center gap-2 mb-3">
        <FilterIcon />
        <Text className="text-sm text-gray-600">Filtres</Text>
      </View>
      
      <View className="gap-3">
        <TouchableOpacity
          onPress={() => setOnlyHappyHour(!onlyHappyHour)}
          className={`flex-row items-center justify-center px-4 py-3 rounded-lg ${
            onlyHappyHour ? 'bg-orange-500' : 'bg-gray-100'
          }`}
        >
          <ClockIcon />
          <Text
            className={`ml-2 font-semibold ${
              onlyHappyHour ? 'text-white' : 'text-gray-700'
            }`}
          >
            Happy Hour actif {onlyHappyHour ? '✓' : ''}
          </Text>
        </TouchableOpacity>
        
        <View className="bg-gray-100 rounded-lg overflow-hidden">
          <Picker
            selectedValue={sortBy}
            onValueChange={(value) => setSortBy(value)}
            style={{ height: 50 }}
          >
            <Picker.Item label="Trier par: Meilleure note" value="rating" />
            <Picker.Item label="Trier par: Prix croissant" value="price-low" />
            <Picker.Item label="Trier par: Prix décroissant" value="price-high" />
            <Picker.Item label="Trier par: Distance" value="distance" />
          </Picker>
        </View>
      </View>
    </View>
  );
}
