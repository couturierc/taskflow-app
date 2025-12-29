/**
 * Projects Screen
 * 
 * Displays all user projects
 */

import { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useAuth } from '@/lib/auth-context';
import { TodoistProject } from '@/lib/todoist-api';
import { useColors } from '@/hooks/use-colors';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function ProjectsScreen() {
  const { apiClient, isAuthenticated } = useAuth();
  const [projects, setProjects] = useState<TodoistProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const colors = useColors();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    loadProjects();
  }, [isAuthenticated]);

  async function loadProjects() {
    if (!apiClient) return;

    try {
      const allProjects = await apiClient.getProjects();
      setProjects(allProjects);
    } catch (error) {
      console.error('Failed to load projects:', error);
      Alert.alert('Error', 'Failed to load projects. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadProjects();
  }, [apiClient]);

  function getProjectColor(colorName: string): string {
    // Map Todoist color names to hex values
    const colorMap: Record<string, string> = {
      berry_red: '#B8256F',
      red: '#DB4035',
      orange: '#FF9933',
      yellow: '#FAD000',
      olive_green: '#AFB83B',
      lime_green: '#7ECC49',
      green: '#299438',
      mint_green: '#6ACCBC',
      teal: '#158FAD',
      sky_blue: '#14AAF5',
      light_blue: '#96C3EB',
      blue: '#4073FF',
      grape: '#884DFF',
      violet: '#AF38EB',
      lavender: '#EB96EB',
      magenta: '#E05194',
      salmon: '#FF8D85',
      charcoal: '#808080',
      grey: '#B8B8B8',
      taupe: '#CCAC93',
    };
    return colorMap[colorName] || colors.primary;
  }

  function renderProject({ item }: { item: TodoistProject }) {
    return (
      <TouchableOpacity
        className="bg-surface border border-border rounded-xl p-4 mb-3 active:opacity-70"
        onPress={() => {
          router.push(`/project/${item.id}`);
        }}
      >
        <View className="flex-row items-center gap-3">
          {/* Color Indicator */}
          <View 
            className="w-1 h-12 rounded-full"
            style={{ backgroundColor: getProjectColor(item.color) }}
          />

          {/* Project Info */}
          <View className="flex-1">
            <View className="flex-row items-center gap-2">
              <Text className="text-lg font-semibold text-foreground flex-1">
                {item.name}
              </Text>
              {item.is_favorite && (
                <Text className="text-base">⭐</Text>
              )}
            </View>
            
            {item.comment_count > 0 && (
              <Text className="text-sm text-muted mt-1">
                {item.comment_count} comment{item.comment_count !== 1 ? 's' : ''}
              </Text>
            )}
          </View>

          {/* Chevron */}
          <IconSymbol name="chevron.right" size={20} color={colors.muted} />
        </View>
      </TouchableOpacity>
    );
  }

  if (isLoading) {
    return (
      <ScreenContainer className="justify-center items-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View className="flex-1 px-4 pt-6">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-foreground">Projects</Text>
          {projects.length > 0 && (
            <Text className="text-sm text-muted mt-2">
              {projects.length} project{projects.length !== 1 ? 's' : ''}
            </Text>
          )}
        </View>

        {/* Project List */}
        <FlatList
          data={projects}
          renderItem={renderProject}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-12">
              <Text className="text-6xl mb-4">📁</Text>
              <Text className="text-xl font-semibold text-foreground mb-2">No projects</Text>
              <Text className="text-base text-muted text-center">
                Create projects in Todoist to organize your tasks
              </Text>
            </View>
          }
        />
      </View>
    </ScreenContainer>
  );
}
