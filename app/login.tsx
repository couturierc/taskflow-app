/**
 * Login Screen
 * 
 * Allows users to authenticate with their Todoist API token
 */

import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Linking, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useAuth } from '@/lib/auth-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColors } from '@/hooks/use-colors';

export default function LoginScreen() {
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();
  const colors = useColors();

  async function handleSignIn() {
    if (!token.trim()) {
      Alert.alert('Error', 'Please enter your API token');
      return;
    }

    setIsLoading(true);
    try {
      await signIn(token.trim());
      // Navigation will happen automatically via the auth state change
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert(
        'Authentication Failed',
        'Invalid API token. Please check your token and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  }

  function openTodoistSettings() {
    Linking.openURL('https://app.todoist.com/app/settings/integrations/developer');
  }

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="items-center gap-8">
            {/* Logo and Title */}
            <View className="items-center gap-4">
              <View className="w-24 h-24 bg-primary rounded-3xl items-center justify-center">
                <IconSymbol name="house.fill" size={48} color="#FFFFFF" />
              </View>
              <Text className="text-3xl font-bold text-foreground">TaskFlow</Text>
              <Text className="text-base text-muted text-center max-w-sm">
                Connect to your Todoist account to manage your tasks
              </Text>
            </View>

            {/* Token Input */}
            <View className="w-full max-w-sm gap-4">
              <View className="gap-2">
                <Text className="text-sm font-semibold text-foreground">API Token</Text>
                <TextInput
                  className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground text-base"
                  placeholder="Enter your Todoist API token"
                  placeholderTextColor={colors.muted}
                  value={token}
                  onChangeText={setToken}
                  autoCapitalize="none"
                  autoCorrect={false}
                  secureTextEntry
                  returnKeyType="done"
                  onSubmitEditing={handleSignIn}
                  editable={!isLoading}
                />
              </View>

              {/* Sign In Button */}
              <TouchableOpacity
                className="bg-primary rounded-xl py-4 items-center active:opacity-80"
                onPress={handleSignIn}
                disabled={isLoading}
                style={{ opacity: isLoading ? 0.5 : 1 }}
              >
                <Text className="text-white font-semibold text-base">
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </Text>
              </TouchableOpacity>

              {/* Get Token Link */}
              <TouchableOpacity
                className="py-2 items-center active:opacity-60"
                onPress={openTodoistSettings}
                disabled={isLoading}
              >
                <Text className="text-primary text-sm font-medium">
                  Get your API token from Todoist →
                </Text>
              </TouchableOpacity>
            </View>

            {/* Help Text */}
            <View className="w-full max-w-sm bg-surface rounded-xl p-4 gap-2">
              <Text className="text-sm font-semibold text-foreground">How to get your token:</Text>
              <Text className="text-sm text-muted leading-relaxed">
                1. Tap the link above to open Todoist settings{'\n'}
                2. Go to Settings → Integrations → Developer{'\n'}
                3. Copy your API token{'\n'}
                4. Paste it in the field above
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
