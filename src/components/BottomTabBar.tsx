import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { List, Map, Plus, Heart, User } from 'lucide-react-native';

export type TabName = 'list' | 'map' | 'favorites' | 'profile';

interface BottomTabBarProps {
  activeTab?: TabName;
  user: any;
  favorites?: string[];
  onTabPress?: (tab: TabName) => void;
  onAddPress: () => void;
  onOpenAuth: () => void;
}

export function BottomTabBar({
  activeTab,
  user,
  favorites = [],
  onTabPress,
  onAddPress,
  onOpenAuth,
}: BottomTabBarProps) {
  const router = useRouter();

  const getInitials = () => {
    if (!user) return '';
    const meta = user.user_metadata;
    if (meta?.firstName && meta?.lastName) return (meta.firstName[0] + meta.lastName[0]).toUpperCase();
    if (meta?.name) {
      const parts = meta.name.split(' ');
      return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase();
    }
    return user.email?.[0]?.toUpperCase() || '?';
  };

  const handleFavorites = () => {
    if (!user) { onOpenAuth(); return; }
    onTabPress?.('favorites');
  };

  const handleProfile = () => {
    if (!user) { onOpenAuth(); return; }
    if (activeTab === 'profile') return;
    router.push('/profile');
  };

  return (
    <View
      style={{
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E8E0D0',
        paddingBottom: 24,
        paddingTop: 10,
        shadowColor: '#100906',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 10,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 8 }}>

        {/* Liste */}
        <TabBtn
          icon={<List size={22} color={activeTab === 'list' ? '#8E1212' : '#6B5C4D'} strokeWidth={activeTab === 'list' ? 2.5 : 1.8} />}
          label="Liste"
          active={activeTab === 'list'}
          onPress={() => onTabPress?.('list')}
        />

        {/* Carte */}
        <TabBtn
          icon={<Map size={22} color={activeTab === 'map' ? '#8E1212' : '#6B5C4D'} strokeWidth={activeTab === 'map' ? 2.5 : 1.8} />}
          label="Carte"
          active={activeTab === 'map'}
          onPress={() => onTabPress?.('map')}
        />

        {/* Bouton ajout */}
        <View style={{ flex: 1, alignItems: 'center', marginTop: -22 }}>
          <TouchableOpacity
            onPress={onAddPress}
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: '#FF8B60',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#8E1212',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 8,
              elevation: 8,
              borderWidth: 3,
              borderColor: '#FFFFFF',
            }}
          >
            <Plus size={28} color="#FDFAEA" strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={{ fontSize: 11, color: '#6B5C4D', fontWeight: '500', marginTop: 4 }}>Ajouter</Text>
        </View>

        {/* Favoris */}
        <TouchableOpacity onPress={handleFavorites} style={{ flex: 1, alignItems: 'center', paddingVertical: 4 }}>
          <View style={{ position: 'relative' }}>
            <Heart
              size={22}
              color={activeTab === 'favorites' ? '#8E1212' : '#6B5C4D'}
              fill={activeTab === 'favorites' ? '#8E1212' : 'transparent'}
              strokeWidth={activeTab === 'favorites' ? 2.5 : 1.8}
            />
            {user && favorites.length > 0 && (
              <View
                style={{
                  position: 'absolute',
                  top: -4,
                  right: -8,
                  width: 16,
                  height: 16,
                  borderRadius: 8,
                  backgroundColor: '#8E1212',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#FDFAEA', fontSize: 9, fontWeight: 'bold' }}>{favorites.length}</Text>
              </View>
            )}
          </View>
          <Text style={{ fontSize: 11, color: activeTab === 'favorites' ? '#8E1212' : '#6B5C4D', fontWeight: '500', marginTop: 2 }}>
            Favoris
          </Text>
          {activeTab === 'favorites' && (
            <View style={{ width: 16, height: 2, borderRadius: 1, backgroundColor: '#8E1212', marginTop: 2 }} />
          )}
        </TouchableOpacity>

        {/* Profil */}
        <TouchableOpacity onPress={handleProfile} style={{ flex: 1, alignItems: 'center', paddingVertical: 4 }}>
          {user ? (
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: activeTab === 'profile' ? '#8E1212' : '#FF8B60',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#FDFAEA' }}>{getInitials()}</Text>
            </View>
          ) : (
            <User size={22} color="#6B5C4D" strokeWidth={1.8} />
          )}
          <Text style={{ fontSize: 11, color: activeTab === 'profile' ? '#8E1212' : '#6B5C4D', fontWeight: '500', marginTop: 2 }}>
            {user ? 'Profil' : 'Connexion'}
          </Text>
          {activeTab === 'profile' && (
            <View style={{ width: 16, height: 2, borderRadius: 1, backgroundColor: '#8E1212', marginTop: 2 }} />
          )}
        </TouchableOpacity>

      </View>
    </View>
  );
}

function TabBtn({ icon, label, active, onPress }: { icon: React.ReactNode; label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={{ flex: 1, alignItems: 'center', paddingVertical: 4 }}>
      {icon}
      <Text style={{ fontSize: 11, color: active ? '#8E1212' : '#6B5C4D', fontWeight: '500', marginTop: 2 }}>
        {label}
      </Text>
      {active && (
        <View style={{ width: 16, height: 2, borderRadius: 1, backgroundColor: '#8E1212', marginTop: 2 }} />
      )}
    </TouchableOpacity>
  );
}
