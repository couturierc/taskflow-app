/**
 * Search Bar Component
 * 
 * Search input with filter options
 */

import { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text } from 'react-native';
import { useColors } from '@/hooks/use-colors';
import { IconSymbol } from './ui/icon-symbol';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onFilterPress?: () => void;
  placeholder?: string;
}

export function SearchBar({ 
  value, 
  onChangeText, 
  onFilterPress,
  placeholder = 'Search tasks...' 
}: SearchBarProps) {
  const colors = useColors();

  return (
    <View className="flex-row items-center gap-2 mb-4">
      {/* Search Input */}
      <View 
        className="flex-1 flex-row items-center bg-surface border border-border rounded-xl px-4 py-2"
      >
        <Text className="text-lg mr-2">🔍</Text>
        <TextInput
          className="flex-1 text-foreground text-base py-1"
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          value={value}
          onChangeText={onChangeText}
          returnKeyType="search"
        />
        {value.length > 0 && (
          <TouchableOpacity 
            onPress={() => onChangeText('')}
            className="ml-2 active:opacity-60"
          >
            <Text className="text-lg">✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Button */}
      {onFilterPress && (
        <TouchableOpacity
          className="bg-surface border border-border rounded-xl p-3 active:opacity-70"
          onPress={onFilterPress}
        >
          <Text className="text-lg">⚙️</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
