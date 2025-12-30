/**
 * Settings Screen
 * 
 * App configuration and account management
 */

import { View, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useAuth } from '@/lib/auth-context';
import { useColors } from '@/hooks/use-colors';
import { IconSymbol } from '@/components/ui/icon-symbol';
import packageJson from '../../package.json';

export default function SettingsScreen() {
  const { signOut, isAuthenticated } = useAuth();
  const colors = useColors();
  const router = useRouter();

  async function handleSignOut() {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/login');
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <ScreenContainer>
      <ScrollView className="flex-1 px-4 pt-6">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-foreground">Settings</Text>
        </View>

        {/* App Info Section */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-muted uppercase mb-3">App Info</Text>
          <View className="bg-surface border border-border rounded-xl overflow-hidden">
            <View className="p-4 border-b border-border">
              <Text className="text-base text-foreground font-medium">TaskFlow</Text>
              <Text className="text-sm text-muted mt-1">Version {packageJson.version}</Text>
            </View>
            <View className="p-4">
              <Text className="text-sm text-muted">
                An unofficial, open-source Todoist client for managing your tasks and projects.
              </Text>
              <Text className="text-xs text-muted mt-2 italic">
                Not affiliated with or endorsed by Doist.
              </Text>
            </View>
          </View>
        </View>

        {/* Account Section */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-muted uppercase mb-3">Account</Text>
          <View className="bg-surface border border-border rounded-xl overflow-hidden">
            <TouchableOpacity
              className="p-4 flex-row items-center justify-between active:opacity-70"
              onPress={() => Alert.alert('Info', 'Connected to Todoist via API token')}
            >
              <View className="flex-row items-center gap-3">
                <View 
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{ backgroundColor: colors.primary + '20' }}
                >
                  <IconSymbol name="house.fill" size={20} color={colors.primary} />
                </View>
                <View>
                  <Text className="text-base text-foreground font-medium">Connected</Text>
                  <Text className="text-sm text-muted">Todoist Account</Text>
                </View>
              </View>
              <IconSymbol name="chevron.right" size={20} color={colors.muted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Organization Section */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-muted uppercase mb-3">Organization</Text>
          <View className="bg-surface border border-border rounded-xl overflow-hidden">
            <TouchableOpacity
              className="p-4 flex-row items-center justify-between active:opacity-70"
              onPress={() => router.push('/labels')}
            >
              <Text className="text-base text-foreground">Manage Labels</Text>
              <IconSymbol name="chevron.right" size={20} color={colors.muted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* About Section */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-muted uppercase mb-3">About</Text>
          <View className="bg-surface border border-border rounded-xl overflow-hidden">
            <TouchableOpacity
              className="p-4 flex-row items-center justify-between border-b border-border active:opacity-70"
              onPress={() => Alert.alert('Privacy', 'Your API token is stored securely on your device. We do not collect or store any personal data.')}
            >
              <Text className="text-base text-foreground">Privacy Policy</Text>
              <IconSymbol name="chevron.right" size={20} color={colors.muted} />
            </TouchableOpacity>
            <TouchableOpacity
              className="p-4 flex-row items-center justify-between border-b border-border active:opacity-70"
              onPress={() => Alert.alert('Terms', 'By using this app, you agree to follow Todoist\'s Terms of Service and API usage guidelines.')}
            >
              <Text className="text-base text-foreground">Terms of Service</Text>
              <IconSymbol name="chevron.right" size={20} color={colors.muted} />
            </TouchableOpacity>
            <TouchableOpacity
              className="p-4 flex-row items-center justify-between active:opacity-70"
              onPress={() => Alert.alert(
                'Open Source',
                'TaskFlow is open source software licensed under the GNU General Public License v3.0 (GPL-3.0).\n\nThis means all derivative works must also be open source.\n\nBuilt with:\n• Expo & React Native\n• NativeWind (TailwindCSS)\n• TanStack Query\n• tRPC\n• Todoist API\n\nView source code on GitHub:\ngithub.com/couturierc/taskflow-app'
              )}
            >
              <Text className="text-base text-foreground">Open Source Licenses</Text>
              <IconSymbol name="chevron.right" size={20} color={colors.muted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          className="bg-surface border rounded-xl p-4 items-center active:opacity-70 mb-8"
          style={{ borderColor: colors.error }}
          onPress={handleSignOut}
        >
          <Text className="text-base font-semibold" style={{ color: colors.error }}>
            Sign Out
          </Text>
        </TouchableOpacity>

        {/* Footer */}
        <View className="items-center pb-8">
          <Text className="text-xs text-muted text-center">
            Made with ❤️ by Camille Couturier
          </Text>
          <Text className="text-xs text-muted text-center mt-1">
            Open source • GPL-3.0 License
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
