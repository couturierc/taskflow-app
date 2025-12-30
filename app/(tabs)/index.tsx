/**
 * Today Screen
 * 
 * Displays tasks due today and overdue tasks
 */

import { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useAuth } from '@/lib/auth-context';
import { TodoistTask, TodoistCompletedTask } from '@/lib/todoist-api';
import { organizeTasksWithSubtasks, flattenTasksWithSubtasks, calculateSubtaskProgress, hasSubtasks, TaskWithChildren } from '@/lib/subtask-utils';
import { useColors } from '@/hooks/use-colors';
import * as Haptics from 'expo-haptics';
import { FloatingActionButton } from '@/components/floating-action-button';
import { TaskFormModal } from '@/components/task-form-modal';
import { SearchBar } from '@/components/search-bar';
import { FilterModal, FilterOptions } from '@/components/filter-modal';
import { TodoistProject, TodoistLabel } from '@/lib/todoist-api';
import { LabelBadges } from '@/components/label-badges';
import { useBatch } from '@/lib/batch-context';
import { BatchActionBar } from '@/components/batch-action-bar';
import { MarkdownText } from '@/components/markdown-text';

export default function TodayScreen() {
  const { apiClient, isAuthenticated } = useAuth();
  const { isMultiSelectMode, toggleMultiSelectMode, isTaskSelected, toggleTaskSelection, selectedTasks, deselectAll } = useBatch();
  const [tasks, setTasks] = useState<TodoistTask[]>([]);
  const [completedTasks, setCompletedTasks] = useState<TodoistCompletedTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isTaskModalVisible, setIsTaskModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TodoistTask | null>(null);
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
    if (showCompleted && apiClient) {
      loadCompletedTasks();
    }
  }, [showCompleted]);

  async function loadCompletedTasks() {
    if (!apiClient) return;

    try {
      // Get completed tasks from today (last 24h)
      const completed = await apiClient.getCompletedTasks({ limit: 50 });
      setCompletedTasks(completed);
    } catch (error) {
      console.error('Failed to load completed tasks:', error);
    }
  }

  async function loadTasks() {
    if (!apiClient) return;

    try {
      const [todayTasks, allProjects, allLabels] = await Promise.all([
        apiClient.getTodayTasks(),
        apiClient.getProjects(),
        apiClient.getLabels(),
      ]);
      setTasks(todayTasks);
      setProjects(allProjects);
      setLabels(allLabels);
    } catch (error) {
      console.error('Failed to load tasks:', error);
      Alert.alert('Error', 'Failed to load tasks. Please try again.');
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

  async function handleToggleComplete(task: TodoistTask, event?: any) {
    // Prevent opening edit modal when toggling checkbox
    if (event) {
      event.stopPropagation();
    }
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
      // Also refresh completed tasks if showing them
      if (showCompleted) {
        await loadCompletedTasks();
      }
    } catch (error) {
      // Revert optimistic update on error
      setTasks(prev => prev.map(t => 
        t.id === task.id ? { ...t, is_completed: task.is_completed } : t
      ));
      Alert.alert('Error', 'Failed to update task. Please try again.');
    }
  }

  // Handler for uncompleting tasks from the completed list
  async function handleUncompleteTask(completedTask: TodoistCompletedTask) {
    if (!apiClient) return;

    // Optimistic update - remove from completed list
    setCompletedTasks(prev => prev.filter(t => t.task_id !== completedTask.task_id));

    try {
      await apiClient.reopenTask(completedTask.task_id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Reload to get fresh data
      await loadTasks();
      if (showCompleted) {
        await loadCompletedTasks();
      }
    } catch (error) {
      // Revert optimistic update on error
      setCompletedTasks(prev => [...prev, completedTask]);
      Alert.alert('Error', 'Failed to reopen task. Please try again.');
    }
  }

  // Filter and search tasks
  // Organize tasks with subtasks
  const organizedTasks = organizeTasksWithSubtasks(tasks);
  const flatTasks = flattenTasksWithSubtasks(organizedTasks);
  
  const filteredTasks = flatTasks.filter(task => {
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

    // Project filter
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

  function renderCompletedTask(item: TodoistCompletedTask) {
    return (
      <TouchableOpacity
        key={`completed-${item.id}`}
        className="bg-surface border border-border rounded-xl p-4 mb-3 active:opacity-70"
        onPress={() => handleUncompleteTask(item)}
        style={{ opacity: 0.6 }}
      >
        <View className="flex-row items-start gap-3">
          <TouchableOpacity
            onPress={(e: any) => {
              e.stopPropagation();
              handleUncompleteTask(item);
            }}
          >
            <View 
              className="w-6 h-6 rounded-full border-2 items-center justify-center mt-0.5"
              style={{ 
                borderColor: colors.success,
                backgroundColor: colors.success
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' }}>✓</Text>
            </View>
          </TouchableOpacity>
          <View className="flex-1">
            <Text 
              className="text-base text-foreground"
              style={{ textDecorationLine: 'line-through', opacity: 0.6 }}
            >
              {item.content}
            </Text>
            <View 
              className="px-2 py-1 rounded self-start mt-2"
              style={{ backgroundColor: colors.success + '20' }}
            >
              <Text className="text-xs font-medium" style={{ color: colors.success }}>
                Tap to reopen
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  function renderTask({ item }: { item: TaskWithChildren }) {
    const isOverdue = item.due && new Date(item.due.date) < new Date(new Date().setHours(0, 0, 0, 0));
    
    const progress = hasSubtasks(item) ? calculateSubtaskProgress(item) : null;
    const indentWidth = item.level * 24; // 24px per level
    
    return (
      <View style={{ marginLeft: indentWidth }}>
        <TouchableOpacity
          className="bg-surface border border-border rounded-xl p-4 mb-3 active:opacity-70"
          onPress={() => handleTaskPress(item)}
        >
          <View className="flex-row items-start gap-3">
          {/* Checkbox */}
          <TouchableOpacity
            onPress={(e: any) => {
              e.stopPropagation();
              handleToggleComplete(item);
            }}
          >
            <View 
            className="w-6 h-6 rounded-full border-2 items-center justify-center mt-0.5"
            style={{ 
              borderColor: item.is_completed ? colors.success : colors.primary,
              backgroundColor: item.is_completed ? colors.success : 'transparent'
            }}
          >
              {item.is_completed && (
                <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' }}>✓</Text>
              )}
            </View>
          </TouchableOpacity>

          {/* Task Content */}
          <View className="flex-1">
            <View
              style={{ 
                opacity: item.is_completed ? 0.5 : 1
              }}
            >
              <MarkdownText content={item.content} variant="title" />
            </View>
            
            {item.description && (
              <View className="mt-1">
                <MarkdownText content={item.description} variant="description" numberOfLines={2} />
              </View>
            )}

            {/* Metadata */}
            <View className="flex-row items-center gap-2 mt-2 flex-wrap">
              {item.due && (
                <View 
                  className="px-2 py-1 rounded flex-row items-center gap-1"
                  style={{ backgroundColor: isOverdue ? colors.error + '20' : colors.muted + '20' }}
                >
                  {item.due.is_recurring && (
                    <Text style={{ color: isOverdue ? colors.error : colors.muted }}>🔁</Text>
                  )}
                  <Text 
                    className="text-xs font-medium"
                    style={{ color: isOverdue ? colors.error : colors.muted }}
                  >
                    {item.due.string}
                  </Text>
                </View>
              )}
              
              {item.priority > 1 && (
                <View 
                  className="px-2 py-1 rounded"
                  style={{ backgroundColor: item.priority === 4 ? colors.error + '20' : item.priority === 3 ? colors.warning + '20' : colors.primary + '20' }}
                >
                  <Text className="text-xs font-medium" style={{ color: item.priority === 4 ? colors.error : item.priority === 3 ? colors.warning : colors.primary }}>
                    P{5 - item.priority}
                  </Text>
                </View>
              )}
            </View>
            <LabelBadges labelNames={item.labels || []} labels={labels} />
            
            {/* Subtask Progress */}
            {progress && progress.total > 0 && (
              <View className="flex-row items-center gap-2 mt-2">
                <View className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                  <View 
                    className="h-full rounded-full"
                    style={{ 
                      width: `${progress.percentage}%`,
                      backgroundColor: progress.percentage === 100 ? colors.success : colors.primary
                    }}
                  />
                </View>
                <Text className="text-xs text-muted">
                  {progress.completed}/{progress.total}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
      </View>
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
          <Text className="text-3xl font-bold text-foreground">Today</Text>
          <Text className="text-base text-muted mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
          {tasks.length > 0 && (
            <Text className="text-sm text-muted mt-2">
              {tasks.filter(t => !t.is_completed).length} tasks remaining
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
          data={filteredTasks}
          renderItem={renderTask}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
          ListFooterComponent={
            filteredCompletedTasks.length > 0 ? (
              <View className="mt-4">
                <Text className="text-lg font-semibold text-muted mb-3">
                  Completed ({filteredCompletedTasks.length})
                </Text>
                {filteredCompletedTasks.map(task => renderCompletedTask(task))}
              </View>
            ) : null
          }
          ListEmptyComponent={
            filteredCompletedTasks.length === 0 ? (
              <View className="items-center justify-center py-12">
                <Text className="text-6xl mb-4">✨</Text>
                <Text className="text-xl font-semibold text-foreground mb-2">All clear!</Text>
                <Text className="text-base text-muted text-center">
                  No tasks due today. Enjoy your day!
                </Text>
              </View>
            ) : null
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
            // If task was moved from another project, remove it from this list
            if (movedFromProject && selectedTask) {
              setTasks(prev => prev.filter(t => t.id !== selectedTask.id));
            }
            loadTasks();
          }}
          task={selectedTask}
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
