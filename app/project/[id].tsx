import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useAuth } from '@/lib/auth-context';
import { TodoistTask, TodoistProject, TodoistSection, TodoistLabel, TodoistCompletedTask } from '@/lib/todoist-api';
import { LabelBadges } from '@/components/label-badges';
import { useColors } from '@/hooks/use-colors';
import * as Haptics from 'expo-haptics';
import { FloatingActionButton } from '@/components/floating-action-button';
import { TaskFormModal } from '@/components/task-form-modal';
import { SearchBar } from '@/components/search-bar';
import { FilterModal, FilterOptions } from '@/components/filter-modal';

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { apiClient, isAuthenticated } = useAuth();
  const [project, setProject] = useState<TodoistProject | null>(null);
  const [tasks, setTasks] = useState<TodoistTask[]>([]);
  const [completedTasks, setCompletedTasks] = useState<TodoistCompletedTask[]>([]);
  const [sections, setSections] = useState<TodoistSection[]>([]);
  const [labels, setLabels] = useState<TodoistLabel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isTaskModalVisible, setIsTaskModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TodoistTask | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({ priority: null, projectId: null });
  const [isSectionModalVisible, setIsSectionModalVisible] = useState(false);
  const [sectionName, setSectionName] = useState('');
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [showCompleted, setShowCompleted] = useState(false);
  const colors = useColors();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    loadProjectData();
  }, [isAuthenticated, id]);

  useEffect(() => {
    if (showCompleted && id && apiClient) {
      loadCompletedTasks();
    }
  }, [showCompleted, id]);

  async function loadCompletedTasks() {
    if (!apiClient || !id) return;

    try {
      const completed = await apiClient.getCompletedTasks({ 
        project_id: id,
        limit: 50 
      });
      setCompletedTasks(completed);
    } catch (error) {
      console.error('Failed to load completed tasks:', error);
    }
  }

  async function loadProjectData() {
    if (!apiClient || !id) return;

    try {
      const [projectData, projectTasks, projectSections, allLabels] = await Promise.all([
        apiClient.getProject(id),
        apiClient.getTasks({ project_id: id }),
        apiClient.getSections(id),
        apiClient.getLabels(),
      ]);

      setProject(projectData);
      setTasks(projectTasks);
      setSections(projectSections);
      setLabels(allLabels);
    } catch (error) {
      console.error('Failed to load project data:', error);
      Alert.alert('Error', 'Failed to load project. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  function handleRefresh() {
    setIsRefreshing(true);
    loadProjectData();
  }

  function handleTaskPress(task: TodoistTask) {
    setSelectedTask(task);
    setIsTaskModalVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  async function handleToggleComplete(task: TodoistTask) {
    if (!apiClient) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Optimistic update
      setTasks(tasks.map(t =>
        t.id === task.id ? { ...t, is_completed: !t.is_completed } : t
      ));

      if (task.is_completed) {
        await apiClient.reopenTask(task.id);
      } else {
        await apiClient.closeTask(task.id);
      }

      // Reload to get accurate state
      await loadProjectData();
    } catch (error) {
      console.error('Failed to toggle task:', error);
      // Revert optimistic update
      setTasks(tasks);
      Alert.alert('Error', 'Failed to update task. Please try again.');
    }
  }

  async function handleUncompleteTask(completedTask: TodoistCompletedTask) {
    if (!apiClient) return;

    // Optimistic update - remove from completed list
    setCompletedTasks(prev => prev.filter(t => t.task_id !== completedTask.task_id));

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await apiClient.reopenTask(completedTask.task_id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Reload to get fresh data
      await loadProjectData();
      if (showCompleted && id) {
        await loadCompletedTasks();
      }
    } catch (error) {
      console.error('Failed to uncomplete task:', error);
      // Revert optimistic update on error
      setCompletedTasks(prev => [...prev, completedTask]);
      Alert.alert('Error', 'Failed to reopen task. Please try again.');
    }
  }

  async function handleCreateSection() {
    if (!apiClient || !id || !sectionName.trim()) {
      Alert.alert('Error', 'Please enter a section name');
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const newSection = await apiClient.createSection({
        name: sectionName.trim(),
        project_id: id,
      });
      setSections([...sections, newSection]);
      setIsSectionModalVisible(false);
      setSectionName('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Failed to create section:', error);
      Alert.alert('Error', 'Failed to create section. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }

  function toggleSection(sectionId: string) {
    const newCollapsed = new Set(collapsedSections);
    if (newCollapsed.has(sectionId)) {
      newCollapsed.delete(sectionId);
    } else {
      newCollapsed.add(sectionId);
    }
    setCollapsedSections(newCollapsed);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  // Filter and search tasks
  const filteredTasks = tasks.filter(task => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesContent = task.content.toLowerCase().includes(query);
      const matchesDescription = task.description?.toLowerCase().includes(query);
      if (!matchesContent && !matchesDescription) return false;
    }

    if (filters.priority !== null && task.priority !== filters.priority) {
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

  // Group tasks by section
  const tasksWithoutSection = filteredTasks.filter(t => !t.section_id);
  const sectionGroups = sections.map(section => ({
    section,
    tasks: filteredTasks.filter(t => t.section_id === section.id),
  }));

  function renderCompletedTask(item: TodoistCompletedTask) {
    return (
      <TouchableOpacity
        key={`completed-${item.id}`}
        className="bg-surface border border-border rounded-xl p-4 mb-3 active:opacity-70"
        style={{ opacity: 0.6 }}
        onPress={() => handleUncompleteTask(item)}
      >
        <View className="flex-row items-start">
          {/* Checkbox */}
          <TouchableOpacity
            className="mr-3 mt-0.5"
            onPress={(e: any) => {
              e.stopPropagation();
              handleUncompleteTask(item);
            }}
          >
            <View
              className="w-6 h-6 rounded-full border-2 items-center justify-center"
              style={{
                borderColor: colors.success,
                backgroundColor: colors.success,
              }}
            >
              <Text className="text-background text-xs font-bold">✓</Text>
            </View>
          </TouchableOpacity>

          {/* Task Content */}
          <View className="flex-1">
            <Text
              className="text-base line-through text-muted"
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

  function getPriorityColor(priority: number): string {
    switch (priority) {
      case 4: return colors.error; // P1
      case 3: return '#FF9933'; // P2
      case 2: return '#4073FF'; // P3
      default: return colors.muted; // P4
    }
  }

  function renderTask({ item }: { item: TodoistTask }) {
    return (
      <TouchableOpacity
        className="bg-surface border border-border rounded-xl p-4 mb-3 active:opacity-70"
        onPress={() => handleTaskPress(item)}
      >
        <View className="flex-row items-start">
          {/* Checkbox */}
          <TouchableOpacity
            className="mr-3 mt-0.5"
            onPress={() => handleToggleComplete(item)}
          >
            <View
              className="w-6 h-6 rounded-full border-2 items-center justify-center"
              style={{
                borderColor: getPriorityColor(item.priority),
                backgroundColor: item.is_completed ? getPriorityColor(item.priority) : 'transparent',
              }}
            >
              {item.is_completed && (
                <Text className="text-background text-xs font-bold">✓</Text>
              )}
            </View>
          </TouchableOpacity>

          {/* Task Content */}
          <View className="flex-1">
            <Text
              className={`text-base ${item.is_completed ? 'line-through text-muted' : 'text-foreground'}`}
            >
              {item.content}
            </Text>
            {item.description && (
              <Text className="text-sm text-muted mt-1" numberOfLines={2}>
                {item.description}
              </Text>
            )}
            {item.due && (
              <Text className="text-xs text-muted mt-2">
                📅 {new Date(item.due.date).toLocaleDateString()}
              </Text>
            )}
            <LabelBadges labelNames={item.labels || []} labels={labels} />
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  function renderSection({ section, tasks: sectionTasks }: { section: TodoistSection; tasks: TodoistTask[] }) {
    const isCollapsed = collapsedSections.has(section.id);

    return (
      <View key={section.id} className="mb-4">
        {/* Section Header */}
        <TouchableOpacity
          className="flex-row items-center justify-between py-2 mb-2"
          onPress={() => toggleSection(section.id)}
        >
          <Text className="text-lg font-semibold text-foreground">
            {section.name} ({sectionTasks.length})
          </Text>
          <Text className="text-muted">{isCollapsed ? '▶' : '▼'}</Text>
        </TouchableOpacity>

        {/* Section Tasks */}
        {!isCollapsed && sectionTasks.map(task => (
          <View key={task.id}>
            {renderTask({ item: task })}
          </View>
        ))}
      </View>
    );
  }

  if (isLoading) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  if (!project) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-lg text-muted text-center">Project not found</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View className="flex-1 px-4 pt-6">
        {/* Header */}
        <View className="mb-4">
          <TouchableOpacity onPress={() => router.back()} className="mb-2">
            <Text className="text-primary">← Back</Text>
          </TouchableOpacity>
          <View className="flex-row items-center">
            <View
              className="w-4 h-4 rounded mr-2"
              style={{ backgroundColor: project.color || colors.primary }}
            />
            <Text className="text-3xl font-bold text-foreground flex-1">{project.name}</Text>
          </View>
          {tasks.length > 0 && (
            <Text className="text-sm text-muted mt-2">
              {tasks.filter(t => !t.is_completed).length} active • {tasks.length} total
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

        {/* Add Section Button */}
        <TouchableOpacity
          className="bg-surface border border-border rounded-xl p-3 mb-4 flex-row items-center justify-center active:opacity-70"
          onPress={() => setIsSectionModalVisible(true)}
        >
          <Text className="text-primary font-medium">+ Add Section</Text>
        </TouchableOpacity>

        {/* Task List */}
        <FlatList
          data={[]}
          renderItem={() => null}
          ListHeaderComponent={
            <>
              {/* Sections with tasks */}
              {sectionGroups.map(group => renderSection(group))}

              {/* Tasks without section */}
              {tasksWithoutSection.length > 0 && (
                <View className="mb-4">
                  {sections.length > 0 && (
                    <Text className="text-lg font-semibold text-foreground py-2 mb-2">
                      No Section ({tasksWithoutSection.length})
                    </Text>
                  )}
                  {tasksWithoutSection.map(task => (
                    <View key={task.id}>
                      {renderTask({ item: task })}
                    </View>
                  ))}
                </View>
              )}

              {/* Completed tasks section */}
              {filteredCompletedTasks.length > 0 && (
                <View className="mb-4">
                  <Text className="text-lg font-semibold text-muted py-2 mb-2">
                    Completed ({filteredCompletedTasks.length})
                  </Text>
                  {filteredCompletedTasks.map(task => renderCompletedTask(task))}
                </View>
              )}
            </>
          }
          contentContainerStyle={{ paddingBottom: 80 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            filteredTasks.length === 0 ? (
              <View className="items-center justify-center py-12">
                <Text className="text-lg text-muted text-center">
                  {searchQuery || filters.priority !== null
                    ? 'No tasks match your filters'
                    : 'No tasks in this project.\nTap + to create your first task.'}
                </Text>
              </View>
            ) : null
          }
        />

        {/* FAB */}
        <FloatingActionButton
          onPress={() => {
            setSelectedTask(null);
            setIsTaskModalVisible(true);
          }}
        />

        {/* Task Form Modal */}
        <TaskFormModal
          visible={isTaskModalVisible}
          onClose={() => {
            setIsTaskModalVisible(false);
            setSelectedTask(null);
          }}
          onSave={(movedFromProject?: string) => {
            // Always reload project data when saved (covers move, edit, delete cases)
            loadProjectData();
          }}
          task={selectedTask}
          defaultProjectId={id}
        />

        {/* Filter Modal */}
        <FilterModal
          visible={isFilterModalVisible}
          onClose={() => setIsFilterModalVisible(false)}
          filters={filters}
          onFiltersChange={setFilters}
          projects={project ? [project] : []}
        />

        {/* Create Section Modal */}
        <Modal
          visible={isSectionModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsSectionModalVisible(false)}
        >
          <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <View className="bg-background rounded-t-3xl p-6">
              <Text className="text-2xl font-bold text-foreground mb-4">New Section</Text>

              <Text className="text-sm font-medium text-foreground mb-2">Section Name</Text>
              <TextInput
                className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground mb-4"
                placeholder="Enter section name"
                placeholderTextColor={colors.muted}
                value={sectionName}
                onChangeText={setSectionName}
                autoFocus
              />

              <View className="flex-row gap-3">
                <TouchableOpacity
                  className="flex-1 bg-surface border border-border rounded-xl py-3 items-center active:opacity-70"
                  onPress={() => {
                    setIsSectionModalVisible(false);
                    setSectionName('');
                  }}
                >
                  <Text className="text-base font-semibold text-foreground">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 bg-primary rounded-xl py-3 items-center active:opacity-80"
                  onPress={handleCreateSection}
                >
                  <Text className="text-base font-semibold text-background">Create</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </ScreenContainer>
  );
}
