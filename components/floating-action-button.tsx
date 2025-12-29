/**
 * Floating Action Button (FAB)
 * 
 * A circular button that floats above the content
 */

import { TouchableOpacity, Text, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/use-colors';

interface FloatingActionButtonProps {
  onPress: () => void;
  icon?: string;
}

export function FloatingActionButton({ onPress, icon = '+' }: FloatingActionButtonProps) {
  const colors = useColors();

  function handlePress() {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onPress();
  }

  return (
    <TouchableOpacity
      className="absolute bottom-6 right-6 w-14 h-14 rounded-full items-center justify-center shadow-lg active:opacity-80"
      style={{ 
        backgroundColor: colors.primary,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
      }}
      onPress={handlePress}
    >
      <Text className="text-3xl font-bold text-white">{icon}</Text>
    </TouchableOpacity>
  );
}
