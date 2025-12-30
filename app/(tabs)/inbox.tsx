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
import { organizeTasksWithSubtasks, flattenTasksWithSubtasks, TaskWithChildren, calculateSubtaskProgress, hasSubtasks } from '@/lib/subtask-utils';
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
  const [collapsedTasks, setCollapsedTasks] = useState<Set<string>>(new Set());
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

  // Organize tasks with subtask hierarchy
  const organizedTasks = organizeTasksWithSubtasks(filteredTasks);
  const flatTasks = flattenTasksWithSubtasks(organizedTasks, collapsedTasks);

  // Filter completed tasks for display
  const filteredCompletedTasks = showCompleted ? completedTasks.filter(task => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!task.content.toLowerCase().includes(query)) return false;
    }
    return true;
  }) : [];

  function toggleCollapse(taskId: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCollapsedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  }

  function renderTask({ item }: { item: TaskWithChildren }) {
    const indentWidth = item.level * 20; // 20px per level
    const isSubtask = item.level > 0;
    const hasChildren = item.children.length > 0;
    const isCollapsed = collapsedTasks.has(item.id);
    const progress = hasSubtasks(item) ? calculateSubtaskProgress(item) : null;
    
    return (
      <View className="flex-row">
        {/* Indent spacer with vertical line for subtasks */}
        {isSubtask && (
          <View style={{ width: indentWidth }} className="flex-row">
            {Array.from({ length: item.level }).map((_, i) => (
              <View 
                key={i} 
                style={{ 
                  width: 20, 
                  borderLeftWidth: i === item.level - 1 ? 2 : 0,
                  borderLeftColor: colors.border,
                  marginLeft: 8,
                }}
              />
            ))}
          </View>
        )}
        <View className="flex-1">
          <TouchableOpacity
            className="bg-surface border border-border rounded-xl p-4 mb-3 active:opacity-70"
            style={{
              borderLeftWidth: isSubtask ? 3 : 1,
              borderLeftColor: isSubtask ? colors.primary + '60' : colors.border,
            }}
            onPress={() => handleTaskPress(item)}
          >
            <View className="flex-row items-start gap-3">
              {/* Collapse/Expand button for tasks with children */}
              {hasChildren && (
                <TouchableOpacity
                  onPress={(e: any) => {
                    e.stopPropagation();
                    toggleCollapse(item.id);
                  }}
                  className="w-6 h-6 items-center justify-center mt-0.5"
                >
                  <Text style={{ color: colors.muted, fontSize: 12 }}>
                    {isCollapsed ? '▶' : '▼'}
                  </Text>
                </TouchableOpacity>
              )}
              
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
                <View className="flex-row items-center gap-2">
                  <Text 
                    className="text-base text-foreground flex-1"
                    style={{ 
                      textDecorationLine: item.is_completed ? 'line-through' : 'none',
                      opacity: item.is_completed ? 0.6 : 1
                    }}
                  >
                    {item.content}
                  </Text>
                  {/* Collapsed indicator showing hidden count */}
                  {hasChildren && isCollapsed && (
                    <View 
                      className="px-2 py-0.5 rounded"
                      style={{ backgroundColor: colors.primary + '20' }}
                    >
                      <Text className="text-xs font-medium" style={{ color: colors.primary }}>
                        +{item.children.length}
                      </Text>
                    </View>
                  )}
                </View>
                
                {item.description && (
                  <Text className="text-sm text-muted mt-1" numberOfLines={2}>
                    {item.description}
                  </Text>
                )}

                {/* Metadata */}
                <View className="flex-row items-center gap-2 mt-2 flex-wrap">
                  {item.due && (
                    <View 
                      className="px-2 py-1 rounded"
                      style={{ backgroundColor: colors.muted + '20' }}
                    >
                      <Text className="text-xs font-medium" style={{ color: colors.muted }}>
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
      </View>
    );
  }

  function renderCompletedTask(item: TodoistCompletedTask) {
    return (
      <TouchableOpacity
        key={`completed-${item.id}`}
        className="bg-surface border border-border rounded-xl p-4 mb-3 active:opacity-70"
        style={{ opacity: 0.6 }}
        onPress={() => handleUncompleteTask(item)}
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

        {/* Toggle Row: Show Completed & Show Subtasks */}
        <View className="flex-row gap-2 mb-4">
          {/* Show/Hide Completed Toggle */}
          <TouchableOpacity
            className="flex-1 flex-row items-center justify-between bg-surface border border-border rounded-xl px-3 py-3"
            onPress={() => setShowCompleted(!showCompleted)}
          >
            <Text className="text-sm text-foreground">Show completed</Text>
            <View
              className="w-10 h-6 rounded-full p-0.5"
              style={{ backgroundColor: showCompleted ? colors.primary : colors.border }}
            >
              <View
                className="w-5 h-5 rounded-full bg-white"
                style={{ marginLeft: showCompleted ? 16 : 0 }}
              />
            </View>
          </TouchableOpacity>

          {/* Show/Hide Subtasks Toggle */}
          <TouchableOpacity
            className="flex-1 flex-row items-center justify-between bg-surface border border-border rounded-xl px-3 py-3"
            onPress={() => {
              if (collapsedTasks.size === 0) {
                // Collapse all - find all tasks with children
                const allParentIds = new Set<string>();
                flattenTasksWithSubtasks(organizedTasks).forEach(t => {
                  if (t.children.length > 0) allParentIds.add(t.id);
                });
                setCollapsedTasks(allParentIds);
              } else {
                // Expand all
                setCollapsedTasks(new Set());
              }
            }}
          >
            <Text className="text-sm text-foreground">Show subtasks</Text>
            <View
              className="w-10 h-6 rounded-full p-0.5"
              style={{ backgroundColor: collapsedTasks.size === 0 ? colors.primary : colors.border }}
            >
              <View
                className="w-5 h-5 rounded-full bg-white"
                style={{ marginLeft: collapsedTasks.size === 0 ? 16 : 0 }}
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* Task List */}
        <FlatList
          data={flatTasks}
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
                <Text className="text-6xl mb-4">📥</Text>
                <Text className="text-xl font-semibold text-foreground mb-2">Inbox is empty</Text>
                <Text className="text-base text-muted text-center">
                  All your new tasks will appear here
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
