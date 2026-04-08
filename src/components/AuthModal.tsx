import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { X, Mail, Lock, User, Eye, EyeOff } from 'lucide-react-native';
import { getSupabaseClient } from '../utils/supabase/client';
import { signUp } from '../utils/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (accessToken: string, user: any) => void;
}

const supabase = getSupabaseClient();

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');

  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [showSignInPwd, setShowSignInPwd] = useState(false);

  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpFirstName, setSignUpFirstName] = useState('');
  const [signUpLastName, setSignUpLastName] = useState('');
  const [showSignUpPwd, setShowSignUpPwd] = useState(false);

  const handleSignIn = async () => {
    setError('');
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: signInEmail,
        password: signInPassword,
      });
      if (error) throw error;
      if (data.session) {
        onSuccess(data.session.access_token, data.user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la connexion');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
    setError('');
    setIsLoading(true);
    try {
      const { data, error } = await signUp(signUpEmail, signUpPassword, signUpFirstName, signUpLastName);
      if (error) throw new Error(error);
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: signUpEmail,
        password: signUpPassword,
      });
      if (signInError) throw signInError;
      if (signInData.session) {
        onSuccess(signInData.session.access_token, signInData.user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'inscription");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Backdrop */}
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(16, 9, 6, 0.6)' }}
          onPress={onClose}
        />

        {/* Sheet */}
        <View style={{
          backgroundColor: '#FDFAEA',
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          paddingBottom: Platform.OS === 'ios' ? 36 : 24,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -8 },
          shadowOpacity: 0.15,
          shadowRadius: 24,
          elevation: 20,
        }}>
          {/* Handle */}
          <View style={{ alignItems: 'center', paddingTop: 14, paddingBottom: 6 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#D4C8B4' }} />
          </View>

          {/* En-tête */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 8, paddingBottom: 20 }}>
            <View>
              <Text style={{ fontSize: 22, fontWeight: '800', color: '#100906', letterSpacing: -0.5 }}>
                {activeTab === 'signin' ? 'Bon retour 👋' : 'Rejoins-nous'}
              </Text>
              <Text style={{ fontSize: 13, color: '#6B5C4D', marginTop: 2 }}>
                {activeTab === 'signin' ? 'Connecte-toi pour accéder à toutes les fonctionnalités' : 'Crée ton compte gratuitement'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#EDE5D0', alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={16} color="#6B5C4D" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={{ marginHorizontal: 24, marginBottom: 20, flexDirection: 'row', backgroundColor: '#EDE5D0', borderRadius: 14, padding: 4 }}>
            {(['signin', 'signup'] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => { setActiveTab(tab); setError(''); }}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 10,
                  alignItems: 'center',
                  backgroundColor: activeTab === tab ? '#FDFAEA' : 'transparent',
                  shadowColor: activeTab === tab ? '#100906' : 'transparent',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: activeTab === tab ? 0.08 : 0,
                  shadowRadius: 4,
                  elevation: activeTab === tab ? 2 : 0,
                }}
              >
                <Text style={{
                  fontSize: 14,
                  fontWeight: activeTab === tab ? '700' : '500',
                  color: activeTab === tab ? '#8E1212' : '#6B5C4D',
                }}>
                  {tab === 'signin' ? 'Connexion' : 'Inscription'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView
            style={{ paddingHorizontal: 24 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {activeTab === 'signin' ? (
              <View style={{ gap: 14 }}>
                <InputField
                  label="Email"
                  placeholder="votre@email.com"
                  value={signInEmail}
                  onChangeText={setSignInEmail}
                  icon={<Mail size={16} color="#A09080" strokeWidth={1.8} />}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <InputField
                  label="Mot de passe"
                  placeholder="••••••••"
                  value={signInPassword}
                  onChangeText={setSignInPassword}
                  icon={<Lock size={16} color="#A09080" strokeWidth={1.8} />}
                  secureTextEntry={!showSignInPwd}
                  rightAction={
                    <TouchableOpacity onPress={() => setShowSignInPwd(!showSignInPwd)} style={{ padding: 4 }}>
                      {showSignInPwd
                        ? <EyeOff size={16} color="#A09080" strokeWidth={1.8} />
                        : <Eye size={16} color="#A09080" strokeWidth={1.8} />
                      }
                    </TouchableOpacity>
                  }
                />

                {error ? <ErrorBanner message={error} /> : null}

                <TouchableOpacity
                  onPress={handleSignIn}
                  disabled={isLoading}
                  style={{
                    paddingVertical: 15,
                    borderRadius: 14,
                    alignItems: 'center',
                    marginTop: 4,
                    backgroundColor: isLoading ? '#D4A08A' : '#8E1212',
                    shadowColor: '#8E1212',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                >
                  {isLoading
                    ? <ActivityIndicator color="#FDFAEA" />
                    : <Text style={{ color: '#FDFAEA', fontWeight: '700', fontSize: 16 }}>Se connecter</Text>
                  }
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ gap: 14 }}>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <InputField
                      label="Prénom"
                      placeholder="Jean"
                      value={signUpFirstName}
                      onChangeText={setSignUpFirstName}
                      icon={<User size={16} color="#A09080" strokeWidth={1.8} />}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <InputField
                      label="Nom"
                      placeholder="Dupont"
                      value={signUpLastName}
                      onChangeText={setSignUpLastName}
                      icon={<User size={16} color="#A09080" strokeWidth={1.8} />}
                    />
                  </View>
                </View>

                <InputField
                  label="Email"
                  placeholder="votre@email.com"
                  value={signUpEmail}
                  onChangeText={setSignUpEmail}
                  icon={<Mail size={16} color="#A09080" strokeWidth={1.8} />}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <InputField
                  label="Mot de passe"
                  placeholder="••••••••"
                  value={signUpPassword}
                  onChangeText={setSignUpPassword}
                  icon={<Lock size={16} color="#A09080" strokeWidth={1.8} />}
                  secureTextEntry={!showSignUpPwd}
                  rightAction={
                    <TouchableOpacity onPress={() => setShowSignUpPwd(!showSignUpPwd)} style={{ padding: 4 }}>
                      {showSignUpPwd
                        ? <EyeOff size={16} color="#A09080" strokeWidth={1.8} />
                        : <Eye size={16} color="#A09080" strokeWidth={1.8} />
                      }
                    </TouchableOpacity>
                  }
                />

                {error ? <ErrorBanner message={error} /> : null}

                <TouchableOpacity
                  onPress={handleSignUp}
                  disabled={isLoading}
                  style={{
                    paddingVertical: 15,
                    borderRadius: 14,
                    alignItems: 'center',
                    marginTop: 4,
                    backgroundColor: isLoading ? '#D4A08A' : '#FF8B60',
                    shadowColor: '#FF8B60',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                >
                  {isLoading
                    ? <ActivityIndicator color="#FDFAEA" />
                    : <Text style={{ color: '#FDFAEA', fontWeight: '700', fontSize: 16 }}>Créer mon compte</Text>
                  }
                </TouchableOpacity>

                <Text style={{ fontSize: 11, color: '#A09080', textAlign: 'center', marginBottom: 4 }}>
                  En t'inscrivant, tu acceptes nos conditions d'utilisation
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Composants internes ──────────────────────────────────────────────────────

interface InputFieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
  icon?: React.ReactNode;
  rightAction?: React.ReactNode;
  secureTextEntry?: boolean;
  keyboardType?: any;
  autoCapitalize?: any;
}

function InputField({ label, placeholder, value, onChangeText, icon, rightAction, secureTextEntry, keyboardType, autoCapitalize }: InputFieldProps) {
  return (
    <View>
      <Text style={{ fontSize: 13, fontWeight: '600', color: '#6B5C4D', marginBottom: 6 }}>{label}</Text>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1.5,
        borderColor: '#E8E0D0',
        borderRadius: 12,
        paddingHorizontal: 12,
        gap: 8,
      }}>
        {icon}
        <TextInput
          style={{ flex: 1, paddingVertical: 13, fontSize: 15, color: '#100906' }}
          placeholder={placeholder}
          placeholderTextColor="#BDB0A0"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize ?? 'words'}
        />
        {rightAction}
      </View>
    </View>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <View style={{ backgroundColor: '#FEE2E2', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#8E1212' }} />
      <Text style={{ flex: 1, fontSize: 13, color: '#8E1212', fontWeight: '500' }}>{message}</Text>
    </View>
  );
}
