import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Clock, Check, Star, Tag } from 'lucide-react-native';

export type ColorFilter = 'all' | 'green' | 'orange' | 'red';

const COLOR_DOT: Record<ColorFilter, string | null> = {
  all: null,
  green: '#22C55E',
  orange: '#F97316',
  red: '#EF4444',
};

const COLOR_LABEL: Record<ColorFilter, string> = {
  all: 'Tous',
  green: 'Abordable',
  orange: 'Modéré',
  red: 'Élevé',
};

const RATING_OPTIONS: { label: string; value: number }[] = [
  { label: 'Tous', value: 0 },
  { label: '≥ 3', value: 3 },
  { label: '≥ 4', value: 4 },
  { label: '≥ 4.5', value: 4.5 },
];

interface FilterBarProps {
  onlyHappyHour: boolean;
  setOnlyHappyHour: (v: boolean) => void;
  colorFilter: ColorFilter;
  setColorFilter: (v: ColorFilter) => void;
  minRating: number;
  setMinRating: (v: number) => void;
  selectedType: string;
  setSelectedType: (v: string) => void;
  availableTypes: string[];
  isAuthenticated?: boolean;
}

export function FilterBar({
  onlyHappyHour,
  setOnlyHappyHour,
  colorFilter,
  setColorFilter,
  minRating,
  setMinRating,
  selectedType,
  setSelectedType,
  availableTypes,
  isAuthenticated = false,
}: FilterBarProps) {
  return (
    <View
      style={{
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E8E0D0',
        paddingHorizontal: 12,
        paddingVertical: 8,
        gap: 8,
      }}
    >
      {/* Row 1: Happy Hour + filtre couleur prix (si connecté) */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>

          {/* Happy Hour */}
          <TouchableOpacity
            onPress={() => setOnlyHappyHour(!onlyHappyHour)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 20,
              backgroundColor: onlyHappyHour ? '#8E1212' : '#FDFAEA',
              borderWidth: 1,
              borderColor: onlyHappyHour ? '#8E1212' : '#E8E0D0',
            }}
          >
            {onlyHappyHour
              ? <Check size={13} color="#FDFAEA" strokeWidth={2.5} />
              : <Clock size={13} color="#6B5C4D" strokeWidth={2} />
            }
            <Text style={{ fontSize: 13, fontWeight: '600', color: onlyHappyHour ? '#FDFAEA' : '#100906' }}>
              Happy Hour
            </Text>
          </TouchableOpacity>

          {/* Filtre couleur prix — uniquement si connecté */}
          {isAuthenticated && (
            <>
              <View style={{ width: 1, height: 24, backgroundColor: '#E8E0D0' }} />
              <Text style={{ fontSize: 12, color: '#6B5C4D', fontWeight: '500' }}>Prix :</Text>
              {(['all', 'green', 'orange', 'red'] as ColorFilter[]).map((c) => {
                const active = colorFilter === c;
                return (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setColorFilter(c)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 5,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 20,
                      backgroundColor: active
                        ? (COLOR_DOT[c] ? COLOR_DOT[c] + '22' : '#1009060F')
                        : '#FDFAEA',
                      borderWidth: 1,
                      borderColor: active ? (COLOR_DOT[c] || '#100906') : '#E8E0D0',
                    }}
                  >
                    {COLOR_DOT[c] ? (
                      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: COLOR_DOT[c]! }} />
                    ) : null}
                    <Text style={{
                      fontSize: 12,
                      fontWeight: '600',
                      color: active ? (COLOR_DOT[c] || '#100906') : '#6B5C4D',
                    }}>
                      {COLOR_LABEL[c]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </>
          )}
        </View>
      </ScrollView>

      {/* Row 2: Filtre note */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Star size={13} color="#F59E0B" fill="#F59E0B" />
          <Text style={{ fontSize: 12, color: '#6B5C4D', fontWeight: '500' }}>Note :</Text>

          {RATING_OPTIONS.map((opt) => {
            const active = minRating === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                onPress={() => setMinRating(opt.value)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor: active ? '#F59E0B22' : '#FDFAEA',
                  borderWidth: 1,
                  borderColor: active ? '#F59E0B' : '#E8E0D0',
                }}
              >
                {opt.value > 0 && <Star size={11} color={active ? '#F59E0B' : '#6B5C4D'} fill={active ? '#F59E0B' : 'transparent'} strokeWidth={1.5} />}
                <Text style={{ fontSize: 12, fontWeight: '600', color: active ? '#B45309' : '#6B5C4D' }}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Row 3: Filtre type de bar */}
      {availableTypes.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Tag size={13} color="#6B5C4D" strokeWidth={2} />
            <Text style={{ fontSize: 12, color: '#6B5C4D', fontWeight: '500' }}>Type :</Text>

            {/* Chip "Tous" */}
            <TouchableOpacity
              onPress={() => setSelectedType('all')}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: selectedType === 'all' ? '#8E121222' : '#FDFAEA',
                borderWidth: 1,
                borderColor: selectedType === 'all' ? '#8E1212' : '#E8E0D0',
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '600', color: selectedType === 'all' ? '#8E1212' : '#6B5C4D' }}>
                Tous
              </Text>
            </TouchableOpacity>

            {availableTypes.map((type) => {
              const active = selectedType === type;
              return (
                <TouchableOpacity
                  key={type}
                  onPress={() => setSelectedType(active ? 'all' : type)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 20,
                    backgroundColor: active ? '#8E121222' : '#FDFAEA',
                    borderWidth: 1,
                    borderColor: active ? '#8E1212' : '#E8E0D0',
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '600', color: active ? '#8E1212' : '#6B5C4D' }}>
                    {type}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
