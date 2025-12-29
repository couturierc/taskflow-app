/**
 * Batch Action Bar
 * 
 * Floating action bar for batch operations in multi-select mode
 */

import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useBatch } from '@/lib/batch-context';
import { useAuth } from '@/lib/auth-context';
import { useColors } from '@/hooks/use-colors';
import { TodoistProject } from '@/lib/todoist-api';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';

interface BatchActionBarProps {
  onComplete: () => void;
  onDelete: () => void;
  onMove?: (projectId: string) => void;
  projects?: TodoistProject[];
}

export function BatchActionBar({ onComplete, onDelete, onMove, projects }: BatchActionBarProps) {
  const { isMultiSelectMode, getSelectedCount, toggleMultiSelectMode } = useBatch();
  const colors = useColors();
  const [showProjectPicker, setShowProjectPicker] = useState(false);

  if (!isMultiSelectMode) {
    return null;
  }

  const selectedCount = getSelectedCount();

  function handleComplete() {
    if (selectedCount === 0) {
      Alert.alert('No tasks selected', 'Please select at least one task');
      return;
    }

    Alert.alert(
      'Complete Tasks',
      `Complete ${selectedCount} selected task(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          style: 'default',
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onComplete();
          },
        },
      ]
    );
  }

  function handleDelete() {
    if (selectedCount === 0) {
      Alert.alert('No tasks selected', 'Please select at least one task');
      return;
    }

    Alert.alert(
      'Delete Tasks',
      `Delete ${selectedCount} selected task(s)? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            onDelete();
          },
        },
      ]
    );
  }

  function handleMove() {
    if (selectedCount === 0) {
      Alert.alert('No tasks selected', 'Please select at least one task');
      return;
    }

    if (!projects || projects.length === 0) {
      Alert.alert('No projects available');
      return;
    }

    // Show project picker
    Alert.alert(
      'Move Tasks',
      'Select a project to move the selected tasks to:',
      [
        ...projects.map(project => ({
          text: project.name,
          onPress: () => {
            if (onMove) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onMove(project.id);
            }
          },
        })),
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  }

  return (
    <View
      className="absolute bottom-0 left-0 right-0 border-t border-border"
      style={{ backgroundColor: colors.surface }}
    >
      <View className="flex-row items-center justify-between px-4 py-3">
        <View className="flex-row items-center gap-2">
          <Text className="text-base font-semibold text-foreground">
            {selectedCount} selected
          </Text>
        </View>

        <View className="flex-row items-center gap-2">
          {onMove && projects && projects.length > 0 && (
            <TouchableOpacity
              onPress={handleMove}
              className="px-4 py-2 rounded-lg active:opacity-70"
              style={{ backgroundColor: colors.primary + '20' }}
            >
              <Text className="text-sm font-medium" style={{ color: colors.primary }}>
                Move
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={handleComplete}
            className="px-4 py-2 rounded-lg active:opacity-70"
            style={{ backgroundColor: colors.success + '20' }}
          >
            <Text className="text-sm font-medium" style={{ color: colors.success }}>
              Complete
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleDelete}
            className="px-4 py-2 rounded-lg active:opacity-70"
            style={{ backgroundColor: colors.error + '20' }}
          >
            <Text className="text-sm font-medium" style={{ color: colors.error }}>
              Delete
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              toggleMultiSelectMode();
            }}
            className="px-4 py-2 rounded-lg active:opacity-70"
            style={{ backgroundColor: colors.border }}
          >
            <Text className="text-sm font-medium text-foreground">
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
