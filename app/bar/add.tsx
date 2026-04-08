import { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  Modal,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  Camera, ImageIcon, Clock, ChevronLeft, MapPin,
  CheckCircle2, Search, ChevronDown, X, Trash2,
} from 'lucide-react-native';
import { createBar, uploadBarPhoto } from '../../src/utils/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AddressSuggestion {
  placeId: string;
  displayName: string;
  shortName: string;
  latitude: number;
  longitude: number;
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const BAR_TYPES = [
  'Pub anglais',
  'Bar à cocktails',
  'Bar à bières',
  'Bar ambiance / festif',
  'Brasserie',
  'Bar à vins',
  'Bar à tapas',
  'Bar sportif',
  'Rooftop / bar panoramique',
  'Bar musical / concert',
  'Autre',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (!digits) return '';

  let hh: string, mm: string;
  if (digits.length <= 2) {
    // "15" → 15h00,  "9" → 09h00
    hh = digits.padStart(2, '0');
    mm = '00';
  } else if (digits.length === 3) {
    // "930" → 09h30
    hh = digits.slice(0, 1).padStart(2, '0');
    mm = digits.slice(1, 3);
  } else {
    // "1730" → 17h30
    hh = digits.slice(0, 2);
    mm = digits.slice(2, 4);
  }

  const hours = Math.min(23, parseInt(hh, 10));
  const minutes = Math.min(59, parseInt(mm, 10));
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function formatPrice(raw: string): string {
  const normalized = raw.replace(',', '.');
  const num = parseFloat(normalized);
  if (isNaN(num) || num < 0) return '';
  return num.toFixed(2);
}

// ─── Hook autocomplete adresse ────────────────────────────────────────────────

function useAddressAutocomplete() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (text: string) => {
    if (text.length < 4) { setSuggestions([]); return; }
    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(text)}&format=json&limit=6&addressdetails=1&countrycodes=fr`,
        { headers: { 'User-Agent': 'PlanB-App/1.0' } }
      );
      const data = await res.json();
      setSuggestions((data || []).map((item: any) => {
        const a = item.address || {};
        const parts = [a.house_number, a.road || a.pedestrian || a.footway, a.postcode, a.city || a.town || a.village].filter(Boolean);
        return {
          placeId: item.place_id,
          displayName: item.display_name,
          shortName: parts.join(', ') || item.display_name,
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
        };
      }));
    } catch { setSuggestions([]); }
    finally { setIsSearching(false); }
  }, []);

  const onChangeText = useCallback((text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(text), 350);
  }, [search]);

  const clear = useCallback(() => { setSuggestions([]); if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  return { query, setQuery, suggestions, isSearching, onChangeText, clear };
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function AddBarScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  // Horaires
  const [happyHourStart, setHappyHourStart] = useState('');
  const [happyHourEnd, setHappyHourEnd] = useState('');

  // Prix (stockés comme string pendant la saisie)
  const [beerPrice, setBeerPrice] = useState('');
  const [cocktailPrice, setCocktailPrice] = useState('');

  // Adresse
  const [selectedAddress, setSelectedAddress] = useState<AddressSuggestion | null>(null);
  const [addressFocused, setAddressFocused] = useState(false);
  const { query, setQuery, suggestions, isSearching, onChangeText, clear } = useAddressAutocomplete();

  const showSuggestions = addressFocused && (suggestions.length > 0 || isSearching) && !selectedAddress;

  // ── Adresse ──

  const handleSelectAddress = (s: AddressSuggestion) => {
    setSelectedAddress(s);
    setQuery(s.shortName);
    clear();
    setAddressFocused(false);
  };

  const handleAddressChange = (text: string) => {
    setSelectedAddress(null);
    onChangeText(text);
  };

  // ── Photo ──

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission refusée', "Autorisez l'accès à la galerie."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images' as any,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.6,
    });
    if (!result.canceled && result.assets[0]) setPhotoUri(result.assets[0].uri);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission refusée', "Autorisez l'accès à la caméra."); return; }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.6,
    });
    if (!result.canceled && result.assets[0]) setPhotoUri(result.assets[0].uri);
  };

  const showImageOptions = () => {
    Alert.alert('Ajouter une photo', 'Choisissez une source', [
      { text: 'Galerie', onPress: pickImage },
      { text: 'Appareil photo', onPress: takePhoto },
      { text: 'Annuler', style: 'cancel' },
    ]);
  };

  const removePhoto = () => {
    Alert.alert('Supprimer la photo', 'Confirmer la suppression ?', [
      { text: 'Supprimer', style: 'destructive', onPress: () => setPhotoUri(null) },
      { text: 'Annuler', style: 'cancel' },
    ]);
  };

  // ── Validation & Submit ──

  const validateForm = () => {
    if (!name.trim()) return 'Le nom du bar est requis';
    if (!selectedAddress) return 'Sélectionnez une adresse dans la liste';
    if (!type) return 'Le type de bar est requis';
    if (!happyHourStart.match(/^\d{2}:\d{2}$/)) return "Heure de début invalide";
    if (!happyHourEnd.match(/^\d{2}:\d{2}$/)) return "Heure de fin invalide";
    if (!beerPrice || isNaN(Number(beerPrice))) return 'Prix de la bière invalide';
    if (!cocktailPrice || isNaN(Number(cocktailPrice))) return 'Prix du cocktail invalide';
    return null;
  };

  const handleSubmit = async () => {
    const err = validateForm();
    if (err) { setError(err); return; }
    setError('');
    setIsLoading(true);
    try {
      let photoUrl = '';
      if (photoUri) {
        try {
          photoUrl = await uploadBarPhoto(photoUri);
        } catch (e: any) {
          setIsLoading(false);
          setError(`Erreur lors de l'upload de la photo : ${e.message}`);
          return;
        }
      }
      const { error } = await createBar({
        name: name.trim(),
        address: selectedAddress!.shortName,
        type,
        photo: photoUrl,
        latitude: selectedAddress!.latitude,
        longitude: selectedAddress!.longitude,
        happyHourStart,
        happyHourEnd,
        prices: { beer: Number(beerPrice), cocktail: Number(cocktailPrice) },
      });
      if (error) throw new Error(error);
      Alert.alert('Bar ajouté !', `"${name}" a bien été ajouté.`, [{ text: 'OK', onPress: () => router.back() }]);
    } catch (e: any) {
      setError(e.message || "Erreur lors de l'ajout");
    } finally {
      setIsLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: '#FDF8F0' }}>
      <View style={{ flex: 1 }}>

        {/* Header */}
        <View style={{ paddingTop: 56, paddingBottom: 20, paddingHorizontal: 20, backgroundColor: '#8E1212' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <TouchableOpacity onPress={() => router.back()} style={{ width: 36, height: 36, justifyContent: 'center' }}>
              <ChevronLeft size={24} color="#FDFAEA" strokeWidth={2.5} />
            </TouchableOpacity>
            <Text style={{ color: '#FDFAEA', fontSize: 18, fontWeight: '700' }}>Ajouter un bar</Text>
            <View style={{ width: 36 }} />
          </View>
        </View>

        <ScrollView style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* ── Photo ── */}
          <View style={card}>
            <Text style={sectionTitle}>Photo du bar</Text>
            {photoUri ? (
              <View style={{ borderRadius: 12, overflow: 'hidden' }}>
                <Image source={{ uri: photoUri }} style={{ width: '100%', height: 180 }} resizeMode="cover" />
                {/* Boutons overlay */}
                <View style={{ position: 'absolute', bottom: 8, right: 8, flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity onPress={removePhoto} style={{ backgroundColor: 'rgba(142,18,18,0.85)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <Trash2 size={13} color="#FFFFFF" />
                    <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '600' }}>Supprimer</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={showImageOptions} style={{ backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <Camera size={13} color="#FFFFFF" />
                    <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '600' }}>Changer</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity onPress={showImageOptions} activeOpacity={0.85}>
                <View style={{ height: 160, borderRadius: 12, borderWidth: 2, borderColor: '#E8E0D0', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FDFAEA', gap: 10 }}>
                  <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#F0E8D8', alignItems: 'center', justifyContent: 'center' }}>
                    <ImageIcon size={22} color="#8E1212" strokeWidth={1.8} />
                  </View>
                  <Text style={{ color: '#100906', fontWeight: '600', fontSize: 14 }}>Ajouter une photo</Text>
                  <Text style={{ color: '#A09080', fontSize: 12 }}>Galerie ou appareil photo</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>

          {/* ── Informations ── */}
          <View style={card}>
            <Text style={sectionTitle}>Informations</Text>

            {/* Nom */}
            <View style={{ marginBottom: 14 }}>
              <Text style={label}>Nom du bar *</Text>
              <TextInput
                style={input}
                placeholder="Le nom du bar"
                placeholderTextColor="#A09080"
                value={name}
                onChangeText={setName}
              />
            </View>

            {/* Adresse avec autocomplete */}
            <View style={{ marginBottom: 14 }}>
              <Text style={label}>Adresse *</Text>
              <View style={[inputRow, { borderColor: selectedAddress ? '#22C55E' : addressFocused ? '#FF8B60' : '#E8E0D0' }]}>
                {selectedAddress
                  ? <CheckCircle2 size={16} color="#22C55E" strokeWidth={2} style={{ marginRight: 6 }} />
                  : <Search size={16} color="#A09080" strokeWidth={2} style={{ marginRight: 6 }} />
                }
                <TextInput
                  style={{ flex: 1, paddingVertical: 12, color: '#100906', fontSize: 15 }}
                  placeholder="Rechercher une adresse..."
                  placeholderTextColor="#A09080"
                  value={query}
                  onChangeText={handleAddressChange}
                  onFocus={() => setAddressFocused(true)}
                  onBlur={() => setTimeout(() => setAddressFocused(false), 150)}
                  autoCorrect={false}
                  autoCapitalize="words"
                />
                {isSearching && <ActivityIndicator size="small" color="#FF8B60" />}
              </View>

              {/* Suggestions */}
              {showSuggestions && (
                <View style={suggestionBox}>
                  {isSearching && suggestions.length === 0 ? (
                    <View style={{ padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <ActivityIndicator size="small" color="#FF8B60" />
                      <Text style={{ color: '#6B5C4D', fontSize: 14 }}>Recherche en cours...</Text>
                    </View>
                  ) : suggestions.map((item, i) => (
                    <TouchableOpacity
                      key={item.placeId}
                      onPress={() => handleSelectAddress(item)}
                      style={{ flexDirection: 'row', alignItems: 'flex-start', padding: 12, gap: 10, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: '#F0EBE3' }}
                      activeOpacity={0.7}
                    >
                      <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#FFF0E8', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <MapPin size={14} color="#FF8B60" strokeWidth={2} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: '#100906' }} numberOfLines={1}>{item.shortName}</Text>
                        <Text style={{ fontSize: 11, color: '#A09080', marginTop: 1 }} numberOfLines={2}>{item.displayName}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {selectedAddress && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, paddingHorizontal: 2 }}>
                  <MapPin size={12} color="#22C55E" strokeWidth={2} />
                  <Text style={{ fontSize: 11, color: '#22C55E', fontWeight: '600' }}>
                    Localisé · {selectedAddress.latitude.toFixed(5)}, {selectedAddress.longitude.toFixed(5)}
                  </Text>
                </View>
              )}
              {!selectedAddress && query.length >= 4 && !isSearching && suggestions.length === 0 && (
                <Text style={{ fontSize: 11, color: '#F97316', marginTop: 6 }}>
                  Aucune adresse trouvée. Essayez : "12 Rue Victor Hugo, Bordeaux"
                </Text>
              )}
            </View>

            {/* Type de bar — select personnalisé */}
            <View>
              <Text style={label}>Type de bar *</Text>
              <TouchableOpacity
                onPress={() => setShowTypePicker(true)}
                activeOpacity={0.8}
                style={[inputRow, { borderColor: '#E8E0D0', paddingVertical: 0 }]}
              >
                <Text style={{ flex: 1, paddingVertical: 13, fontSize: 15, color: type ? '#100906' : '#A09080' }}>
                  {type || 'Sélectionner un type...'}
                </Text>
                <ChevronDown size={18} color="#A09080" strokeWidth={2} />
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Happy Hour ── */}
          <View style={card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Clock size={18} color="#100906" strokeWidth={2} />
              <Text style={sectionTitle}>Happy Hour *</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 6 }}>
              <View style={{ flex: 1 }}>
                <Text style={label}>Début</Text>
                <TextInput
                  style={[input, { textAlign: 'center', letterSpacing: 2 }]}
                  placeholder="17:00"
                  placeholderTextColor="#A09080"
                  value={happyHourStart}
                  onChangeText={(t) => setHappyHourStart(t.replace(/\D/g, '').slice(0, 4))}
                  onBlur={() => { const f = formatTime(happyHourStart); if (f) setHappyHourStart(f); }}
                  keyboardType="number-pad"
                  maxLength={5}
                />
              </View>
              <View style={{ alignSelf: 'flex-end', paddingBottom: 14 }}>
                <Text style={{ fontSize: 22, color: '#6B5C4D', fontWeight: '300' }}>→</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={label}>Fin</Text>
                <TextInput
                  style={[input, { textAlign: 'center', letterSpacing: 2 }]}
                  placeholder="20:00"
                  placeholderTextColor="#A09080"
                  value={happyHourEnd}
                  onChangeText={(t) => setHappyHourEnd(t.replace(/\D/g, '').slice(0, 4))}
                  onBlur={() => { const f = formatTime(happyHourEnd); if (f) setHappyHourEnd(f); }}
                  keyboardType="number-pad"
                  maxLength={5}
                />
              </View>
            </View>
            <Text style={{ fontSize: 11, color: '#A09080' }}>Tapez les chiffres (ex: 1700) — formaté automatiquement</Text>
          </View>

          {/* ── Prix ── */}
          <View style={card}>
            <Text style={sectionTitle}>Prix Happy Hour *</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={label}>Bière</Text>
                <View style={[inputRow, { borderColor: '#E8E0D0' }]}>
                  <TextInput
                    style={{ flex: 1, paddingVertical: 12, color: '#100906', fontSize: 15, textAlign: 'center' }}
                    placeholder="3.50"
                    placeholderTextColor="#A09080"
                    value={beerPrice}
                    onChangeText={setBeerPrice}
                    onBlur={() => { const f = formatPrice(beerPrice); if (f) setBeerPrice(f); }}
                    keyboardType="decimal-pad"
                  />
                  <Text style={{ color: '#6B5C4D', fontWeight: '600', paddingRight: 6 }}>€</Text>
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={label}>Cocktail</Text>
                <View style={[inputRow, { borderColor: '#E8E0D0' }]}>
                  <TextInput
                    style={{ flex: 1, paddingVertical: 12, color: '#100906', fontSize: 15, textAlign: 'center' }}
                    placeholder="6.00"
                    placeholderTextColor="#A09080"
                    value={cocktailPrice}
                    onChangeText={setCocktailPrice}
                    onBlur={() => { const f = formatPrice(cocktailPrice); if (f) setCocktailPrice(f); }}
                    keyboardType="decimal-pad"
                  />
                  <Text style={{ color: '#6B5C4D', fontWeight: '600', paddingRight: 6 }}>€</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Erreur */}
          {error ? (
            <View style={{ backgroundColor: '#FEE2E2', borderRadius: 12, padding: 14, marginBottom: 12 }}>
              <Text style={{ color: '#8E1212', fontWeight: '600', textAlign: 'center' }}>{error}</Text>
            </View>
          ) : null}

          <Text style={{ fontSize: 11, color: '#A09080', textAlign: 'center', marginBottom: 10 }}>* Champs obligatoires</Text>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isLoading}
            style={{ backgroundColor: isLoading ? '#D4A08A' : '#FF8B60', paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginBottom: 40 }}
          >
            {isLoading ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <ActivityIndicator color="#FDFAEA" />
                <Text style={{ color: '#FDFAEA', fontWeight: '700', fontSize: 16 }}>Envoi en cours...</Text>
              </View>
            ) : (
              <Text style={{ color: '#FDFAEA', fontWeight: '700', fontSize: 16 }}>Ajouter le bar</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* ── Modal sélection type ── */}
      <Modal visible={showTypePicker} transparent animationType="slide" onRequestClose={() => setShowTypePicker(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' }} onPress={() => setShowTypePicker(false)} />
        <View style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40 }}>
          {/* Handle + titre */}
          <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#E8E0D0' }} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 }}>
            <Text style={{ fontSize: 17, fontWeight: '700', color: '#100906' }}>Type de bar</Text>
            <TouchableOpacity onPress={() => setShowTypePicker(false)}>
              <X size={22} color="#6B5C4D" strokeWidth={2} />
            </TouchableOpacity>
          </View>
          <View style={{ height: 1, backgroundColor: '#F0EBE3' }} />
          {/* Liste */}
          <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
            {BAR_TYPES.map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => { setType(t); setShowTypePicker(false); }}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F0EBE3' }}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 16, color: type === t ? '#FF8B60' : '#100906', fontWeight: type === t ? '700' : '400' }}>{t}</Text>
                {type === t && <CheckCircle2 size={20} color="#FF8B60" strokeWidth={2} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

// ─── Styles réutilisables ─────────────────────────────────────────────────────

const card: object = {
  backgroundColor: '#FFFFFF',
  borderRadius: 16,
  padding: 20,
  marginBottom: 16,
  shadowColor: '#100906',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 3,
};

const sectionTitle: object = {
  fontSize: 16,
  fontWeight: '700',
  color: '#100906',
  marginBottom: 14,
};

const label: object = {
  fontWeight: '600',
  color: '#100906',
  marginBottom: 6,
  fontSize: 14,
};

const input: object = {
  backgroundColor: '#FDFAEA',
  borderWidth: 1,
  borderColor: '#E8E0D0',
  borderRadius: 12,
  paddingHorizontal: 14,
  paddingVertical: 12,
  color: '#100906',
  fontSize: 15,
};

const inputRow: object = {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#FDFAEA',
  borderWidth: 1.5,
  borderRadius: 12,
  paddingHorizontal: 12,
};

const suggestionBox: object = {
  backgroundColor: '#FFFFFF',
  borderRadius: 12,
  borderWidth: 1,
  borderColor: '#E8E0D0',
  marginTop: 4,
  shadowColor: '#100906',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.1,
  shadowRadius: 12,
  elevation: 8,
  overflow: 'hidden',
};
