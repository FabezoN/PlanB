import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  User,
  Palette,
  Heart,
  ChevronRight,
  LogOut,
  Plus,
  Minus,
  MapPin,
  Star,
  Pencil,
  Check,
  X,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BottomTabBar } from '../src/components/BottomTabBar';
import { AuthModal } from '../src/components/AuthModal';
import { getSupabaseClient } from '../src/utils/supabase/client';
import { getAllBars } from '../src/utils/api';
import { useUserPrefs, PricePrefs } from '../src/hooks/useUserPrefs';
import { Bar } from '../src/types';

const supabase = getSupabaseClient();

const COLOR_CONFIG = {
  green: { color: '#22C55E', label: 'Abordable' },
  orange: { color: '#F97316', label: 'Modéré' },
  red: { color: '#EF4444', label: 'Élevé' },
} as const;

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [bars, setBars] = useState<Bar[]>([]);
  const [isLoadingBars, setIsLoadingBars] = useState(true);

  const { favorites, pricePrefs, isLoaded, updatePricePrefs, getPriceColor } = useUserPrefs();

  const [localGreenMax, setLocalGreenMax] = useState('');
  const [localRedMin, setLocalRedMin] = useState('');
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);

  // Edition profil
  const [isEditing, setIsEditing] = useState(false);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    loadUser();
    loadBars();
  }, []);

  useEffect(() => {
    if (isLoaded) {
      setLocalGreenMax(String(pricePrefs.greenMax));
      setLocalRedMin(String(pricePrefs.redMin));
    }
  }, [isLoaded, pricePrefs]);

  const loadUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.replace('/'); return; }
    const u = session.user;
    setUser(u);
    setEditFirstName(u.user_metadata?.firstName || u.user_metadata?.name?.split(' ')[0] || '');
    setEditLastName(u.user_metadata?.lastName || u.user_metadata?.name?.split(' ').slice(1).join(' ') || '');
    setEditEmail(u.email || '');
    setIsLoadingUser(false);
  };

  const loadBars = async () => {
    const { data } = await getAllBars();
    if (data?.bars) setBars(data.bars);
    setIsLoadingBars(false);
  };

  const handleSignOut = async () => {
    Alert.alert('Déconnexion', 'Êtes-vous sûr de vouloir vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnecter',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          await AsyncStorage.removeItem('access_token');
          router.replace('/');
        },
      },
    ]);
  };

  const handleSavePrefs = async () => {
    const greenMax = parseFloat(localGreenMax);
    const redMin = parseFloat(localRedMin);
    if (isNaN(greenMax) || isNaN(redMin) || greenMax <= 0 || redMin <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer des valeurs valides');
      return;
    }
    if (greenMax >= redMin) {
      Alert.alert('Erreur', 'Le seuil "Abordable" doit être inférieur au seuil "Élevé"');
      return;
    }
    setIsSavingPrefs(true);
    await updatePricePrefs({ greenMax, redMin });
    setIsSavingPrefs(false);
    Alert.alert('Sauvegardé', 'Vos préférences ont été mises à jour');
  };

  const handleSaveProfile = async () => {
    if (!editFirstName.trim() || !editLastName.trim()) {
      Alert.alert('Erreur', 'Le prénom et le nom sont obligatoires');
      return;
    }
    if (!editEmail.trim() || !editEmail.includes('@')) {
      Alert.alert('Erreur', 'Adresse email invalide');
      return;
    }
    setIsSavingProfile(true);
    try {
      const updates: any = {
        data: {
          firstName: editFirstName.trim(),
          lastName: editLastName.trim(),
          name: `${editFirstName.trim()} ${editLastName.trim()}`,
        },
      };
      if (editEmail.trim() !== user.email) {
        updates.email = editEmail.trim();
      }
      const { data, error } = await supabase.auth.updateUser(updates);
      if (error) throw error;
      setUser(data.user);
      setIsEditing(false);
      if (updates.email) {
        Alert.alert('Profil mis à jour', `Un email de confirmation a été envoyé à ${editEmail.trim()}`);
      } else {
        Alert.alert('Sauvegardé', 'Vos informations ont été mises à jour');
      }
    } catch (err: any) {
      Alert.alert('Erreur', err.message || 'Erreur lors de la mise à jour');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleCancelEdit = () => {
    setEditFirstName(getFirstName());
    setEditLastName(getLastName());
    setEditEmail(user?.email || '');
    setIsEditing(false);
  };

  const step = (field: 'green' | 'red', dir: 1 | -1) => {
    if (field === 'green') {
      const v = Math.max(0.5, (parseFloat(localGreenMax) || 4) + dir * 0.5);
      setLocalGreenMax(String(v));
    } else {
      const v = Math.max(0.5, (parseFloat(localRedMin) || 6) + dir * 0.5);
      setLocalRedMin(String(v));
    }
  };

  const getInitials = () => {
    if (!user) return '?';
    const meta = user.user_metadata;
    if (meta?.firstName && meta?.lastName) return (meta.firstName[0] + meta.lastName[0]).toUpperCase();
    if (meta?.name) {
      const parts = meta.name.split(' ');
      return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase();
    }
    return user.email?.[0]?.toUpperCase() || '?';
  };

  const getFirstName = () => user?.user_metadata?.firstName || user?.user_metadata?.name?.split(' ')[0] || '—';
  const getLastName = () => user?.user_metadata?.lastName || user?.user_metadata?.name?.split(' ').slice(1).join(' ') || '—';

  const favoriteBars = bars.filter((b) => favorites.includes(b.id));

  if (isLoadingUser) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: '#FDFAEA' }}>
        <ActivityIndicator size="large" color="#8E1212" />
      </View>
    );
  }

  const handleAddBar = () => {
    if (!user) { setIsAuthModalOpen(true); return; }
    router.push('/bar/add');
  };

  return (
    <View className="flex-1" style={{ backgroundColor: '#FDFAEA' }}>
      {/* Header */}
      <View className="pt-14 pb-6 px-5" style={{ backgroundColor: '#8E1212' }}>
        <View className="flex-row items-center mb-4">
          <Text className="text-xl font-bold" style={{ color: '#FDFAEA' }}>Mon Profil</Text>
        </View>

        <View className="flex-row items-center gap-4">
          <View className="w-16 h-16 rounded-full items-center justify-center" style={{ backgroundColor: '#FF8B60' }}>
            <Text className="text-2xl font-bold" style={{ color: '#FDFAEA' }}>{getInitials()}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-xl font-bold" style={{ color: '#FDFAEA' }}>
              {isEditing
                ? `${editFirstName || '—'} ${editLastName || '—'}`.trim()
                : `${getFirstName()} ${getLastName()}`}
            </Text>
            <Text className="text-sm mt-0.5 opacity-80" style={{ color: '#F8ECAB' }}>
              {isEditing ? editEmail : user?.email}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-4 pt-5 gap-4 pb-36">

          {/* Informations personnelles */}
          <View className="rounded-2xl p-5 bg-white" style={{ shadowColor: '#100906', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center gap-2">
                <User size={16} color="#8E1212" strokeWidth={2} />
                <Text className="text-base font-bold" style={{ color: '#100906' }}>Informations personnelles</Text>
              </View>
              {!isEditing ? (
                <TouchableOpacity
                  onPress={() => setIsEditing(true)}
                  className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl"
                  style={{ backgroundColor: '#F3EDD8' }}
                >
                  <Pencil size={13} color="#8E1212" strokeWidth={2} />
                  <Text className="text-xs font-semibold" style={{ color: '#8E1212' }}>Modifier</Text>
                </TouchableOpacity>
              ) : (
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={handleCancelEdit}
                    className="w-8 h-8 rounded-full items-center justify-center"
                    style={{ backgroundColor: '#F3EDD8' }}
                  >
                    <X size={15} color="#6B5C4D" strokeWidth={2} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSaveProfile}
                    disabled={isSavingProfile}
                    className="w-8 h-8 rounded-full items-center justify-center"
                    style={{ backgroundColor: isSavingProfile ? '#D4A08A' : '#FF8B60' }}
                  >
                    {isSavingProfile
                      ? <ActivityIndicator size="small" color="#FDFAEA" />
                      : <Check size={15} color="#FDFAEA" strokeWidth={2.5} />
                    }
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View style={{ gap: 0 }}>
              {/* Prénom */}
              <View style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3EDD8' }}>
                <Text style={{ fontSize: 11, fontWeight: '600', color: '#6B5C4D', marginBottom: 4 }}>PRÉNOM</Text>
                {isEditing ? (
                  <TextInput
                    value={editFirstName}
                    onChangeText={setEditFirstName}
                    placeholder="Votre prénom"
                    placeholderTextColor="#A09080"
                    style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color: '#100906',
                      backgroundColor: '#FDFAEA',
                      borderRadius: 10,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderWidth: 1,
                      borderColor: '#FF8B60',
                    }}
                  />
                ) : (
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#100906' }}>{getFirstName()}</Text>
                )}
              </View>

              {/* Nom */}
              <View style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3EDD8' }}>
                <Text style={{ fontSize: 11, fontWeight: '600', color: '#6B5C4D', marginBottom: 4 }}>NOM</Text>
                {isEditing ? (
                  <TextInput
                    value={editLastName}
                    onChangeText={setEditLastName}
                    placeholder="Votre nom"
                    placeholderTextColor="#A09080"
                    style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color: '#100906',
                      backgroundColor: '#FDFAEA',
                      borderRadius: 10,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderWidth: 1,
                      borderColor: '#FF8B60',
                    }}
                  />
                ) : (
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#100906' }}>{getLastName()}</Text>
                )}
              </View>

              {/* Email */}
              <View style={{ paddingVertical: 10 }}>
                <Text style={{ fontSize: 11, fontWeight: '600', color: '#6B5C4D', marginBottom: 4 }}>EMAIL</Text>
                {isEditing ? (
                  <>
                    <TextInput
                      value={editEmail}
                      onChangeText={setEditEmail}
                      placeholder="votre@email.com"
                      placeholderTextColor="#A09080"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      style={{
                        fontSize: 14,
                        fontWeight: '600',
                        color: '#100906',
                        backgroundColor: '#FDFAEA',
                        borderRadius: 10,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderWidth: 1,
                        borderColor: '#FF8B60',
                      }}
                    />
                    {editEmail !== user?.email && (
                      <Text style={{ fontSize: 11, color: '#F97316', marginTop: 4 }}>
                        Un email de confirmation sera envoyé à cette adresse
                      </Text>
                    )}
                  </>
                ) : (
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#100906' }}>{user?.email}</Text>
                )}
              </View>
            </View>
          </View>

          {/* Code couleur des prix */}
          <View className="rounded-2xl p-5 bg-white" style={{ shadowColor: '#100906', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
            <View className="flex-row items-center gap-2 mb-1">
              <Palette size={16} color="#8E1212" strokeWidth={2} />
              <Text className="text-base font-bold" style={{ color: '#100906' }}>Code couleur des prix</Text>
            </View>
            <Text className="text-xs mb-5" style={{ color: '#6B5C4D' }}>
              Définissez vos fourchettes de prix (bière en €)
            </Text>

            {/* Aperçu */}
            <View className="flex-row gap-2 mb-5">
              {(['green', 'orange', 'red'] as const).map((c) => (
                <View key={c} className="flex-1 rounded-xl py-2.5 items-center" style={{ backgroundColor: COLOR_CONFIG[c].color + '18' }}>
                  <View className="w-4 h-4 rounded-full mb-1" style={{ backgroundColor: COLOR_CONFIG[c].color }} />
                  <Text className="text-xs font-bold" style={{ color: COLOR_CONFIG[c].color }}>{COLOR_CONFIG[c].label}</Text>
                </View>
              ))}
            </View>

            {/* Seuil vert */}
            <PriceThresholdRow
              color="#22C55E"
              label="Abordable — bière ≤ X €"
              value={localGreenMax}
              onChange={setLocalGreenMax}
              onDecrement={() => step('green', -1)}
              onIncrement={() => step('green', 1)}
            />

            {/* Zone orange */}
            <View className="rounded-xl py-2.5 px-3 my-3 flex-row items-center gap-2" style={{ backgroundColor: '#FFF7ED' }}>
              <View className="w-3 h-3 rounded-full" style={{ backgroundColor: '#F97316' }} />
              <Text className="text-sm" style={{ color: '#6B5C4D' }}>
                <Text className="font-bold" style={{ color: '#F97316' }}>Modéré</Text>
                {' — entre '}
                <Text className="font-bold" style={{ color: '#100906' }}>{localGreenMax || '4'}€</Text>
                {' et '}
                <Text className="font-bold" style={{ color: '#100906' }}>{localRedMin || '6'}€</Text>
              </Text>
            </View>

            {/* Seuil rouge */}
            <PriceThresholdRow
              color="#EF4444"
              label="Élevé — bière ≥ Y €"
              value={localRedMin}
              onChange={setLocalRedMin}
              onDecrement={() => step('red', -1)}
              onIncrement={() => step('red', 1)}
            />

            <TouchableOpacity
              onPress={handleSavePrefs}
              disabled={isSavingPrefs}
              className="mt-4 py-3.5 rounded-xl items-center"
              style={{ backgroundColor: isSavingPrefs ? '#D4A08A' : '#FF8B60' }}
            >
              {isSavingPrefs
                ? <ActivityIndicator color="#FDFAEA" size="small" />
                : <Text className="font-bold" style={{ color: '#FDFAEA' }}>Sauvegarder</Text>
              }
            </TouchableOpacity>
          </View>

          {/* Bars favoris */}
          <View className="rounded-2xl p-5 bg-white" style={{ shadowColor: '#100906', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center gap-2">
                <Heart size={16} color="#8E1212" fill="#8E1212" strokeWidth={2} />
                <Text className="text-base font-bold" style={{ color: '#100906' }}>Bars Favoris</Text>
              </View>
              <View className="px-2.5 py-0.5 rounded-full" style={{ backgroundColor: '#8E1212' }}>
                <Text className="text-xs font-bold" style={{ color: '#FDFAEA' }}>{favoriteBars.length}</Text>
              </View>
            </View>

            {isLoadingBars ? (
              <ActivityIndicator size="small" color="#8E1212" />
            ) : favoriteBars.length === 0 ? (
              <View className="items-center py-6">
                <Heart size={40} color="#E8E0D0" strokeWidth={1.5} />
                <Text className="text-sm text-center mt-3" style={{ color: '#6B5C4D' }}>
                  Aucun bar favori.{'\n'}Appuyez sur le cœur d'un bar pour l'ajouter.
                </Text>
              </View>
            ) : (
              <View className="gap-2">
                {favoriteBars.map((bar) => {
                  const c = getPriceColor(bar.prices?.beer || 0);
                  const colorMap = { green: '#22C55E', orange: '#F97316', red: '#EF4444' };
                  return (
                    <TouchableOpacity
                      key={bar.id}
                      onPress={() => router.push(`/bar/${bar.id}`)}
                      className="flex-row items-center gap-3 p-3 rounded-xl"
                      style={{ backgroundColor: '#FDFAEA' }}
                    >
                      <View className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: colorMap[c] }} />
                      <View className="flex-1">
                        <Text className="font-bold text-sm" style={{ color: '#100906' }}>{bar.name}</Text>
                        <View className="flex-row items-center gap-1 mt-0.5">
                          <MapPin size={11} color="#6B5C4D" strokeWidth={2} />
                          <Text className="text-xs" style={{ color: '#6B5C4D' }} numberOfLines={1}>{bar.address}</Text>
                        </View>
                      </View>
                      <View className="items-end">
                        <Text className="text-xs font-bold" style={{ color: '#8E1212' }}>{bar.prices?.beer || 0}€</Text>
                        <View className="flex-row items-center gap-0.5 mt-0.5">
                          <Star size={10} color="#F59E0B" fill="#F59E0B" />
                          <Text className="text-xs" style={{ color: '#6B5C4D' }}>{bar.rating}</Text>
                        </View>
                      </View>
                      <ChevronRight size={16} color="#8E1212" strokeWidth={2} />
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* Déconnexion */}
          <TouchableOpacity
            onPress={handleSignOut}
            className="py-4 rounded-2xl flex-row items-center justify-center gap-2"
            style={{ backgroundColor: '#FEE2E2' }}
          >
            <LogOut size={18} color="#DC2626" strokeWidth={2} />
            <Text className="font-bold" style={{ color: '#DC2626' }}>Se déconnecter</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>

      {/* Bottom Tab Bar */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
        <BottomTabBar
          activeTab="profile"
          user={user}
          favorites={favorites}
          onTabPress={(tab) => {
            if (tab === 'list' || tab === 'map') router.replace('/');
          }}
          onAddPress={handleAddBar}
          onOpenAuth={() => setIsAuthModalOpen(true)}
        />
      </View>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(_t, userData) => setUser(userData)}
      />
    </View>
  );
}

function PriceThresholdRow({
  color, label, value, onChange, onDecrement, onIncrement,
}: {
  color: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  onDecrement: () => void;
  onIncrement: () => void;
}) {
  return (
    <View>
      <View className="flex-row items-center gap-2 mb-2">
        <View className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
        <Text className="text-sm font-semibold" style={{ color: '#100906' }}>{label}</Text>
      </View>
      <View className="flex-row items-center gap-3">
        <TouchableOpacity
          onPress={onDecrement}
          className="w-9 h-9 rounded-full items-center justify-center"
          style={{ backgroundColor: '#F3EDD8' }}
        >
          <Minus size={14} color="#100906" strokeWidth={2.5} />
        </TouchableOpacity>
        <TextInput
          className="flex-1 text-center py-2 rounded-xl text-base font-bold"
          style={{ backgroundColor: '#F3EDD8', color: '#100906' }}
          value={value}
          onChangeText={onChange}
          keyboardType="decimal-pad"
        />
        <TouchableOpacity
          onPress={onIncrement}
          className="w-9 h-9 rounded-full items-center justify-center"
          style={{ backgroundColor: '#F3EDD8' }}
        >
          <Plus size={14} color="#100906" strokeWidth={2.5} />
        </TouchableOpacity>
        <Text className="text-sm font-bold w-5" style={{ color }}>€</Text>
      </View>
    </View>
  );
}
