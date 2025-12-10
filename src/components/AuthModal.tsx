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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

  // Sign in form
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Sign up form
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpName, setSignUpName] = useState('');

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
        await AsyncStorage.setItem('access_token', data.session.access_token);
        onSuccess(data.session.access_token, data.user);
        onClose();
      }
    } catch (err: any) {
      console.error('Sign in error:', err);
      setError(err.message || 'Erreur lors de la connexion');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
    setError('');
    setIsLoading(true);

    try {
      const { data, error } = await signUp(signUpEmail, signUpPassword, signUpName);

      if (error) throw new Error(error);

      // Now sign in
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: signUpEmail,
        password: signUpPassword,
      });

      if (signInError) throw signInError;

      if (signInData.session) {
        await AsyncStorage.setItem('access_token', signInData.session.access_token);
        onSuccess(signInData.session.access_token, signInData.user);
        onClose();
      }
    } catch (err: any) {
      console.error('Sign up error:', err);
      setError(err.message || "Erreur lors de l'inscription");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6 max-h-[90%]">
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-2xl font-bold">
                Connexion / Inscription
              </Text>
              <TouchableOpacity onPress={onClose}>
                <Text className="text-3xl text-gray-500">×</Text>
              </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View className="flex-row mb-6 bg-gray-100 rounded-lg p-1">
              <TouchableOpacity
                onPress={() => setActiveTab('signin')}
                className={`flex-1 py-3 rounded-lg ${
                  activeTab === 'signin' ? 'bg-white shadow' : ''
                }`}
              >
                <Text
                  className={`text-center font-semibold ${
                    activeTab === 'signin' ? 'text-orange-500' : 'text-gray-600'
                  }`}
                >
                  Connexion
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setActiveTab('signup')}
                className={`flex-1 py-3 rounded-lg ${
                  activeTab === 'signup' ? 'bg-white shadow' : ''
                }`}
              >
                <Text
                  className={`text-center font-semibold ${
                    activeTab === 'signup' ? 'text-orange-500' : 'text-gray-600'
                  }`}
                >
                  Inscription
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {activeTab === 'signin' ? (
                <View className="gap-4">
                  <View>
                    <Text className="mb-2 font-semibold">Email</Text>
                    <TextInput
                      className="border border-gray-300 rounded-lg px-4 py-3"
                      placeholder="votre@email.com"
                      value={signInEmail}
                      onChangeText={setSignInEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>

                  <View>
                    <Text className="mb-2 font-semibold">Mot de passe</Text>
                    <TextInput
                      className="border border-gray-300 rounded-lg px-4 py-3"
                      placeholder="••••••••"
                      value={signInPassword}
                      onChangeText={setSignInPassword}
                      secureTextEntry
                    />
                  </View>

                  {error ? (
                    <Text className="text-red-500 text-sm">{error}</Text>
                  ) : null}

                  <TouchableOpacity
                    onPress={handleSignIn}
                    disabled={isLoading}
                    className="bg-orange-500 py-4 rounded-lg mt-2"
                  >
                    {isLoading ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text className="text-white text-center font-semibold text-lg">
                        Se connecter
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                <View className="gap-4">
                  <View>
                    <Text className="mb-2 font-semibold">Nom complet</Text>
                    <TextInput
                      className="border border-gray-300 rounded-lg px-4 py-3"
                      placeholder="Jean Dupont"
                      value={signUpName}
                      onChangeText={setSignUpName}
                    />
                  </View>

                  <View>
                    <Text className="mb-2 font-semibold">Email</Text>
                    <TextInput
                      className="border border-gray-300 rounded-lg px-4 py-3"
                      placeholder="votre@email.com"
                      value={signUpEmail}
                      onChangeText={setSignUpEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>

                  <View>
                    <Text className="mb-2 font-semibold">Mot de passe</Text>
                    <TextInput
                      className="border border-gray-300 rounded-lg px-4 py-3"
                      placeholder="••••••••"
                      value={signUpPassword}
                      onChangeText={setSignUpPassword}
                      secureTextEntry
                    />
                  </View>

                  {error ? (
                    <Text className="text-red-500 text-sm">{error}</Text>
                  ) : null}

                  <TouchableOpacity
                    onPress={handleSignUp}
                    disabled={isLoading}
                    className="bg-orange-500 py-4 rounded-lg mt-2"
                  >
                    {isLoading ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text className="text-white text-center font-semibold text-lg">
                        S'inscrire
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
