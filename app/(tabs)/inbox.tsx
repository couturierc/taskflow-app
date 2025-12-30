/**
 * Inbox Screen
 * 
 * Displays all tasks in the Inbox project
 */

import { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useAuth } from '@/lib/auth-context';
import { TodoistTask, TodoistCompletedTask } from '@/lib/todoist-api';
import { useColors } from '@/hooks/use-colors';
import * as Haptics from 'expo-haptics';
import { FloatingActionButton } from '@/components/floating-action-button';
import { TaskFormModal } from '@/components/task-form-modal';
import { SearchBar } from '@/components/search-bar';
import { FilterModal, FilterOptions } from '@/components/filter-modal';
import { TodoistProject, TodoistLabel } from '@/lib/todoist-api';
import { LabelBadges } from '@/components/label-badges';

export default function InboxScreen() {
  const { apiClient, isAuthenticated } = useAuth();
  const [tasks, setTasks] = useState<TodoistTask[]>([]);
  const [completedTasks, setCompletedTasks] = useState<TodoistCompletedTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isTaskModalVisible, setIsTaskModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TodoistTask | null>(null);
  const [inboxProjectId, setInboxProjectId] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({ priority: null, projectId: null });
  const [projects, setProjects] = useState<TodoistProject[]>([]);
  const [labels, setLabels] = useState<TodoistLabel[]>([]);
  const [showCompleted, setShowCompleted] = useState(false);
  const colors = useColors();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    loadTasks();
  }, [isAuthenticated]);

  useEffect(() => {
    if (showCompleted && inboxProjectId && apiClient) {
      loadCompletedTasks();
    }
  }, [showCompleted, inboxProjectId]);

  async function loadCompletedTasks() {
    if (!apiClient || !inboxProjectId) return;

    try {
      const completed = await apiClient.getCompletedTasks({ 
        project_id: inboxProjectId,
        limit: 50 
      });
      setCompletedTasks(completed);
    } catch (error) {
      console.error('Failed to load completed tasks:', error);
    }
  }

  async function loadTasks() {
    if (!apiClient) return;

    try {
      // Get inbox project ID, all projects, and labels
      const [allProjects, inboxTasks, allLabels] = await Promise.all([
        apiClient.getProjects(),
        apiClient.getInboxTasks(),
        apiClient.getLabels(),
      ]);
      
      const inbox = allProjects.find(p => p.is_inbox_project);
      if (inbox) {
        setInboxProjectId(inbox.id);
      }
      
      setProjects(allProjects);
      setTasks(inboxTasks);
      setLabels(allLabels);
    } catch (error) {
      console.error('Failed to load inbox tasks:', error);
      Alert.alert('Error', 'Failed to load inbox tasks. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadTasks();
  }, [apiClient]);

  function handleTaskPress(task: TodoistTask) {
    setSelectedTask(task);
    setIsTaskModalVisible(true);
  }

  async function handleToggleComplete(task: TodoistTask) {
    if (!apiClient) return;

    // Optimistic update
    setTasks(prev => prev.map(t => 
      t.id === task.id ? { ...t, is_completed: !t.is_completed } : t
    ));

    try {
      if (task.is_completed) {
        await apiClient.reopenTask(task.id);
      } else {
        await apiClient.closeTask(task.id);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      // Reload to get fresh data
      await loadTasks();
    } catch (error) {
      // Revert optimistic update on error
      setTasks(prev => prev.map(t => 
        t.id === task.id ? { ...t, is_completed: task.is_completed } : t
      ));
      Alert.alert('Error', 'Failed to update task. Please try again.');
    }
  }

  async function handleUncompleteTask(completedTask: TodoistCompletedTask) {
    if (!apiClient) return;

    // Optimistic update - remove from completed list
    setCompletedTasks(prev => prev.filter(t => t.task_id !== completedTask.task_id));

    try {
      await apiClient.reopenTask(completedTask.task_id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Reload to get fresh data
      await loadTasks();
      if (showCompleted && inboxProjectId) {
        await loadCompletedTasks();
      }
    } catch (error) {
      // Revert optimistic update on error
      setCompletedTasks(prev => [...prev, completedTask]);
      Alert.alert('Error', 'Failed to reopen task. Please try again.');
    }
  }

  // Filter and search tasks
  const filteredTasks = tasks.filter(task => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesContent = task.content.toLowerCase().includes(query);
      const matchesDescription = task.description?.toLowerCase().includes(query);
      if (!matchesContent && !matchesDescription) return false;
    }

    // Priority filter
    if (filters.priority !== null && task.priority !== filters.priority) {
      return false;
    }

    // Project filter (not applicable for inbox, but keep for consistency)
    if (filters.projectId !== null && task.project_id !== filters.projectId) {
      return false;
    }

    return true;
  });

  // Filter completed tasks for display
  const filteredCompletedTasks = showCompleted ? completedTasks.filter(task => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!task.content.toLowerCase().includes(query)) return false;
    }
    return true;
  }) : [];

  // Combined task list type for display
  type DisplayTask = (TodoistTask & { isCompletedTask?: false }) | (TodoistCompletedTask & { isCompletedTask: true });
  
  const displayTasks: DisplayTask[] = [
    ...filteredTasks.map(t => ({ ...t, isCompletedTask: false as const })),
    ...filteredCompletedTasks.map(t => ({ ...t, isCompletedTask: true as const })),
  ];

  function renderTask({ item }: { item: DisplayTask }) {
    const isCompleted = item.isCompletedTask;
    
    return (
      <TouchableOpacity
        className="bg-surface border border-border rounded-xl p-4 mb-3 active:opacity-70"
        onPress={() => {
          if (isCompleted) {
            handleUncompleteTask(item as TodoistCompletedTask);
          } else {
            handleTaskPress(item as TodoistTask);
          }
        }}
        style={{ opacity: isCompleted ? 0.6 : 1 }}
      >
        <View className="flex-row items-start gap-3">
          {/* Checkbox */}
          <TouchableOpacity
            onPress={(e: any) => {
              e.stopPropagation();
              if (isCompleted) {
                handleUncompleteTask(item as TodoistCompletedTask);
              } else {
                handleToggleComplete(item as TodoistTask);
              }
            }}
          >
            <View 
            className="w-6 h-6 rounded-full border-2 items-center justify-center mt-0.5"
            style={{ 
              borderColor: isCompleted ? colors.success : colors.primary,
              backgroundColor: isCompleted ? colors.success : 'transparent'
            }}
          >
              {isCompleted && (
                <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' }}>✓</Text>
              )}
            </View>
          </TouchableOpacity>

          {/* Task Content */}
          <View className="flex-1">
            <Text 
              className="text-base text-foreground"
              style={{ 
                textDecorationLine: isCompleted ? 'line-through' : 'none',
                opacity: isCompleted ? 0.6 : 1
              }}
            >
              {item.content}
            </Text>
            
            {!isCompleted && (item as TodoistTask).description && (
              <Text className="text-sm text-muted mt-1" numberOfLines={2}>
                {(item as TodoistTask).description}
              </Text>
            )}

            {/* Metadata */}
            <View className="flex-row items-center gap-2 mt-2 flex-wrap">
              {isCompleted && (
                <View 
                  className="px-2 py-1 rounded"
                  style={{ backgroundColor: colors.success + '20' }}
                >
                  <Text className="text-xs font-medium" style={{ color: colors.success }}>
                    Tap to reopen
                  </Text>
                </View>
              )}
              
              {!isCompleted && (item as TodoistTask).due && (
                <View 
                  className="px-2 py-1 rounded"
                  style={{ backgroundColor: colors.muted + '20' }}
                >
                  <Text className="text-xs font-medium" style={{ color: colors.muted }}>
                    {(item as TodoistTask).due!.string}
                  </Text>
                </View>
              )}
              
              {!isCompleted && (item as TodoistTask).priority > 1 && (
                <View 
                  className="px-2 py-1 rounded"
                  style={{ backgroundColor: (item as TodoistTask).priority === 4 ? colors.error + '20' : (item as TodoistTask).priority === 3 ? colors.warning + '20' : colors.primary + '20' }}
                >
                  <Text className="text-xs font-medium" style={{ color: (item as TodoistTask).priority === 4 ? colors.error : (item as TodoistTask).priority === 3 ? colors.warning : colors.primary }}>
                    P{5 - (item as TodoistTask).priority}
                  </Text>
                </View>
              )}
            </View>
            {!isCompleted && <LabelBadges labelNames={(item as TodoistTask).labels || []} labels={labels} />}
          </View>
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
        <View className="mb-4">
          <Text className="text-3xl font-bold text-foreground">Inbox</Text>
          {tasks.length > 0 && (
            <Text className="text-sm text-muted mt-2">
              {tasks.filter(t => !t.is_completed).length} tasks
            </Text>
          )}
        </View>

        {/* Search Bar */}
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFilterPress={() => setIsFilterModalVisible(true)}
        />

        {/* Show/Hide Completed Toggle */}
        <TouchableOpacity
          className="flex-row items-center justify-between bg-surface border border-border rounded-xl px-4 py-3 mb-4"
          onPress={() => setShowCompleted(!showCompleted)}
        >
          <Text className="text-base text-foreground">Show completed tasks</Text>
          <View
            className="w-12 h-7 rounded-full p-1"
            style={{ backgroundColor: showCompleted ? colors.primary : colors.border }}
          >
            <View
              className="w-5 h-5 rounded-full bg-white"
              style={{ marginLeft: showCompleted ? 20 : 0 }}
            />
          </View>
        </TouchableOpacity>

        {/* Task List */}
        <FlatList
          data={displayTasks}
          renderItem={renderTask}
          keyExtractor={item => item.isCompletedTask ? `completed-${item.id}` : item.id}
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
              <Text className="text-6xl mb-4">📥</Text>
              <Text className="text-xl font-semibold text-foreground mb-2">Inbox is empty</Text>
              <Text className="text-base text-muted text-center">
                All your new tasks will appear here
              </Text>
            </View>
          }
        />

        {/* FAB */}
        <FloatingActionButton onPress={() => setIsTaskModalVisible(true)} />

        {/* Task Form Modal */}
        <TaskFormModal
          visible={isTaskModalVisible}
          onClose={() => {
            setIsTaskModalVisible(false);
            setSelectedTask(null);
          }}
          onSave={(movedFromProject?: string) => {
            // Always reload tasks when saved (covers move, edit, delete cases)
            loadTasks();
          }}
          task={selectedTask}
          defaultProjectId={inboxProjectId}
        />

        {/* Filter Modal */}
        <FilterModal
          visible={isFilterModalVisible}
          onClose={() => setIsFilterModalVisible(false)}
          filters={filters}
          onFiltersChange={setFilters}
          projects={projects}
        />
      </View>
    </ScreenContainer>
  );
}
