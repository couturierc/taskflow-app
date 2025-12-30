/**
 * Calendar View Screen
 * 
 * Displays tasks in a monthly calendar view
 */

import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useAuth } from '@/lib/auth-context';
import { TodoistTask, TodoistCompletedTask, TodoistProject } from '@/lib/todoist-api';
import { organizeTasksWithSubtasks, flattenTasksWithSubtasks, TaskWithChildren, calculateSubtaskProgress, hasSubtasks } from '@/lib/subtask-utils';
import { useColors } from '@/hooks/use-colors';
import { TaskFormModal } from '@/components/task-form-modal';
import * as Haptics from 'expo-haptics';

export default function CalendarScreen() {
  const { apiClient, isAuthenticated } = useAuth();
  const [tasks, setTasks] = useState<TodoistTask[]>([]);
  const [completedTasks, setCompletedTasks] = useState<TodoistCompletedTask[]>([]);
  const [projects, setProjects] = useState<TodoistProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<TodoistTask | null>(null);
  const [isTaskModalVisible, setIsTaskModalVisible] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [collapsedTasks, setCollapsedTasks] = useState<Set<string>>(new Set());
  const [allCollapsed, setAllCollapsed] = useState(false);
  const colors = useColors();

  useEffect(() => {
    if (isAuthenticated) {
      loadTasks();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (showCompleted && apiClient) {
      loadCompletedTasks();
    }
  }, [showCompleted]);

  async function loadCompletedTasks() {
    if (!apiClient) return;

    try {
      const completed = await apiClient.getCompletedTasks({ limit: 100 });
      setCompletedTasks(completed);
    } catch (error) {
      console.error('Failed to load completed tasks:', error);
    }
  }

  async function loadTasks() {
    if (!apiClient) return;

    try {
      const [allTasks, allProjects] = await Promise.all([
        apiClient.getTasks(),
        apiClient.getProjects(),
      ]);
      // Keep ALL tasks - we need subtasks even if they don't have due dates
      setTasks(allTasks);
      setProjects(allProjects);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  async function handleRefresh() {
    setIsRefreshing(true);
    await loadTasks();
  }

  function handleTaskPress(task: TodoistTask) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTask(task);
    setIsTaskModalVisible(true);
  }

  function handleTaskModalClose() {
    setIsTaskModalVisible(false);
    setSelectedTask(null);
  }

  async function handleTaskModalSave() {
    await loadTasks();
    handleTaskModalClose();
  }

  async function handleToggleComplete(task: TodoistTask) {
    if (!apiClient) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    try {
      if (task.is_completed) {
        await apiClient.reopenTask(task.id);
      } else {
        await apiClient.closeTask(task.id);
      }
      await loadTasks();
      if (showCompleted) {
        await loadCompletedTasks();
      }
    } catch (error) {
      console.error('Failed to toggle task:', error);
      Alert.alert('Error', 'Failed to update task. Please try again.');
    }
  }

  async function handleUncompleteTask(completedTask: TodoistCompletedTask) {
    if (!apiClient) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Optimistic update
    setCompletedTasks(prev => prev.filter(t => t.task_id !== completedTask.task_id));
    
    try {
      await apiClient.reopenTask(completedTask.task_id);
      await loadTasks();
      if (showCompleted) {
        await loadCompletedTasks();
      }
    } catch (error) {
      setCompletedTasks(prev => [...prev, completedTask]);
      console.error('Failed to reopen task:', error);
      Alert.alert('Error', 'Failed to reopen task. Please try again.');
    }
  }

  // Calendar calculations
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = firstDay.getDay();

  const days: (number | null)[] = [];
  for (let i = 0; i < startDayOfWeek; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  function formatDate(day: number): string {
    const date = new Date(year, month, day);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function getTasksForDate(dateStr: string): TodoistTask[] {
    // Get tasks due on this date
    const tasksOnDate = tasks.filter(task => task.due?.date === dateStr);
    
    // Recursively include subtasks of tasks due on this date
    const includeSubtasks = (parentId: string): TodoistTask[] => {
      const subtasks = tasks.filter(t => t.parent_id === parentId);
      const result: TodoistTask[] = [];
      for (const subtask of subtasks) {
        result.push(subtask);
        result.push(...includeSubtasks(subtask.id));
      }
      return result;
    };
    
    // Gather subtasks for all parent tasks on this date
    const allSubtasks: TodoistTask[] = [];
    for (const task of tasksOnDate) {
      allSubtasks.push(...includeSubtasks(task.id));
    }
    
    // Combine and deduplicate
    const combined = [...tasksOnDate, ...allSubtasks];
    const seen = new Set<string>();
    return combined.filter(t => {
      if (seen.has(t.id)) return false;
      seen.add(t.id);
      return true;
    });
  }

  function getCompletedTasksForDate(dateStr: string): TodoistCompletedTask[] {
    if (!showCompleted) return [];
    // Completed tasks have completed_at timestamp, extract date
    return completedTasks.filter(task => {
      if (!task.completed_at) return false;
      const completedDate = task.completed_at.split('T')[0];
      return completedDate === dateStr;
    });
  }

  function hasTasksOnDate(dateStr: string): boolean {
    // Only check for tasks directly due on this date (not subtasks)
    const hasDueTasks = tasks.some(task => task.due?.date === dateStr);
    return hasDueTasks || getCompletedTasksForDate(dateStr).length > 0;
  }

  function isToday(day: number): boolean {
    const today = new Date();
    const date = new Date(year, month, day);
    return date.toDateString() === today.toDateString();
  }

  function handlePrevMonth() {
    setCurrentMonth(new Date(year, month - 1, 1));
    setSelectedDate(null);
  }

  function handleNextMonth() {
    setCurrentMonth(new Date(year, month + 1, 1));
    setSelectedDate(null);
  }

  function handleDatePress(day: number) {
    const dateStr = formatDate(day);
    setSelectedDate(dateStr === selectedDate ? null : dateStr);
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Organize tasks with subtask hierarchy for selected date
  const selectedDateTasks = selectedDate ? getTasksForDate(selectedDate) : [];
  const organizedSelectedTasks = organizeTasksWithSubtasks(selectedDateTasks);
  const flatSelectedTasks = flattenTasksWithSubtasks(organizedSelectedTasks, collapsedTasks);

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

  if (isLoading) {
    return (
      <ScreenContainer className="justify-center items-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
      >
        <View className="p-4">
          {/* Header */}
          <View className="mb-6">
            <Text className="text-3xl font-bold text-foreground">Calendar</Text>
            <Text className="text-base text-muted mt-1">
              {tasks.filter(t => t.due).length} task{tasks.filter(t => t.due).length !== 1 ? 's' : ''} with due dates
            </Text>
          </View>

          {/* Toggle Row: Show Completed & Collapse Subtasks */}
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
                setAllCollapsed(!allCollapsed);
                if (!allCollapsed) {
                  // Collapse all - find all tasks with children
                  const allParentIds = new Set<string>();
                  tasks.forEach(t => {
                    if (tasks.some(child => child.parent_id === t.id)) {
                      allParentIds.add(t.id);
                    }
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
                style={{ backgroundColor: !allCollapsed ? colors.primary : colors.border }}
              >
                <View
                  className="w-5 h-5 rounded-full bg-white"
                  style={{ marginLeft: !allCollapsed ? 16 : 0 }}
                />
              </View>
            </TouchableOpacity>
          </View>

          {/* Month Navigation */}
          <View className="flex-row items-center justify-between mb-4">
            <TouchableOpacity
              onPress={handlePrevMonth}
              className="p-3 rounded-full active:opacity-60"
              style={{ backgroundColor: colors.surface }}
            >
              <Text className="text-2xl font-bold" style={{ color: colors.primary }}>‹</Text>
            </TouchableOpacity>
            
            <Text className="text-xl font-bold text-foreground">
              {monthNames[month]} {year}
            </Text>
            
            <TouchableOpacity
              onPress={handleNextMonth}
              className="p-3 rounded-full active:opacity-60"
              style={{ backgroundColor: colors.surface }}
            >
              <Text className="text-2xl font-bold" style={{ color: colors.primary }}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Day Names */}
          <View className="flex-row mb-2">
            {dayNames.map(name => (
              <View key={name} className="flex-1 items-center py-2">
                <Text className="text-xs font-bold text-muted">{name}</Text>
              </View>
            ))}
          </View>

          {/* Calendar Grid */}
          <View className="flex-row flex-wrap mb-6">
            {days.map((day, index) => {
              if (day === null) {
                return <View key={`empty-${index}`} className="w-[14.28%] aspect-square p-1" />;
              }

              const dateStr = formatDate(day);
              const dateTasks = getTasksForDate(dateStr);
              const hasTasksOnDateFlag = hasTasksOnDate(dateStr);
              const isTodayDate = isToday(day);
              const isSelected = dateStr === selectedDate;

              return (
                <View key={day} className="w-[14.28%] aspect-square p-1">
                  <TouchableOpacity
                    className="flex-1 items-center justify-center rounded-lg active:opacity-70"
                    style={{
                      backgroundColor: isSelected
                        ? colors.primary
                        : isTodayDate
                        ? colors.primary + '20'
                        : hasTasksOnDateFlag
                        ? colors.surface
                        : 'transparent',
                      borderWidth: hasTasksOnDateFlag && !isSelected ? 1 : 0,
                      borderColor: colors.border,
                    }}
                    onPress={() => handleDatePress(day)}
                  >
                    <Text
                      className="text-sm font-semibold"
                      style={{
                        color: isSelected
                          ? '#FFFFFF'
                          : isTodayDate
                          ? colors.primary
                          : colors.foreground,
                      }}
                    >
                      {day}
                    </Text>
                    {hasTasksOnDateFlag && !isSelected && (
                      <View
                        className="w-1 h-1 rounded-full mt-1"
                        style={{ backgroundColor: colors.primary }}
                      />
                    )}
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>

          {/* Selected Date Tasks */}
          {selectedDate && (
            <View className="mb-6">
              <Text className="text-lg font-bold text-foreground mb-3">
                Tasks for {selectedDate}
              </Text>
              
              {flatSelectedTasks.length === 0 && getCompletedTasksForDate(selectedDate).length === 0 ? (
                <View className="bg-surface rounded-xl p-6 items-center">
                  <Text className="text-base text-muted">No tasks for this date</Text>
                </View>
              ) : (
                <>
                {flatSelectedTasks.map(task => {
                  const project = projects.find(p => p.id === task.project_id);
                  const indentWidth = task.level * 20;
                  const isSubtask = task.level > 0;
                  const hasChildren = task.children.length > 0;
                  const isCollapsed = collapsedTasks.has(task.id);
                  const progress = hasSubtasks(task) ? calculateSubtaskProgress(task) : null;
                  
                  return (
                  <View key={task.id} className="flex-row">
                    {/* Indent spacer with vertical line for subtasks */}
                    {isSubtask && (
                      <View style={{ width: indentWidth }} className="flex-row">
                        {Array.from({ length: task.level }).map((_, i) => (
                          <View 
                            key={i} 
                            style={{ 
                              width: 20, 
                              borderLeftWidth: i === task.level - 1 ? 2 : 0,
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
                        onPress={() => handleTaskPress(task)}
                      >
                        <View className="flex-row items-start gap-3">
                          {/* Collapse/Expand button for tasks with children */}
                          {hasChildren && (
                            <TouchableOpacity
                              onPress={(e: any) => {
                                e.stopPropagation();
                                toggleCollapse(task.id);
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
                              handleToggleComplete(task);
                            }}
                            className="w-6 h-6 rounded-full border-2 items-center justify-center mt-0.5 active:opacity-60"
                            style={{
                              borderColor: task.priority === 4 ? colors.error : colors.primary,
                              backgroundColor: task.is_completed ? (task.priority === 4 ? colors.error : colors.primary) : 'transparent',
                            }}
                          >
                            {task.is_completed && (
                              <Text className="text-white text-xs">✓</Text>
                            )}
                          </TouchableOpacity>

                          {/* Task Content */}
                          <View className="flex-1">
                            <View className="flex-row items-center gap-2">
                              <Text className="text-base font-medium text-foreground flex-1">
                                {task.content}
                              </Text>
                              {/* Collapsed indicator showing hidden count */}
                              {hasChildren && isCollapsed && (
                                <View 
                                  className="px-2 py-0.5 rounded"
                                  style={{ backgroundColor: colors.primary + '20' }}
                                >
                                  <Text className="text-xs font-medium" style={{ color: colors.primary }}>
                                    +{task.children.length}
                                  </Text>
                                </View>
                              )}
                            </View>
                            {task.description && (
                              <Text className="text-sm text-muted mt-1" numberOfLines={2}>
                                {task.description}
                              </Text>
                            )}
                            <View className="flex-row items-center gap-2 mt-2 flex-wrap">
                              {/* Project Badge */}
                              {project && !project.is_inbox_project && (
                                <View 
                                  className="px-2 py-1 rounded flex-row items-center gap-1"
                                  style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}
                                >
                                  <View 
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: project.color || colors.primary }}
                                  />
                                  <Text className="text-xs font-medium" style={{ color: colors.foreground }}>
                                    {project.name}
                                  </Text>
                                </View>
                              )}
                              {task.priority > 1 && (
                                <View
                                  className="px-2 py-1 rounded"
                                  style={{ backgroundColor: task.priority === 4 ? colors.error + '20' : task.priority === 3 ? colors.warning + '20' : colors.primary + '20' }}
                                >
                                  <Text className="text-xs font-medium" style={{ color: task.priority === 4 ? colors.error : task.priority === 3 ? colors.warning : colors.primary }}>
                                    P{5 - task.priority}
                                  </Text>
                                </View>
                              )}
                              {task.due?.is_recurring && (
                                <View
                                  className="px-2 py-1 rounded"
                                  style={{ backgroundColor: colors.primary + '20' }}
                                >
                                  <Text className="text-xs font-medium" style={{ color: colors.primary }}>
                                    🔁 {task.due.string}
                                  </Text>
                                </View>
                              )}
                            </View>
                            
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
                })
                }
                
                {/* Completed Tasks for Selected Date */}
                {showCompleted && getCompletedTasksForDate(selectedDate).length > 0 && (
                  <>
                    <Text className="text-base font-semibold text-muted mt-4 mb-2">
                      Completed ({getCompletedTasksForDate(selectedDate).length})
                    </Text>
                    {getCompletedTasksForDate(selectedDate).map(task => (
                      <TouchableOpacity
                        key={task.task_id}
                        className="bg-surface border border-border rounded-xl p-4 mb-3 active:opacity-70 opacity-60"
                        onPress={() => handleUncompleteTask(task)}
                      >
                        <View className="flex-row items-center gap-3">
                          {/* Completed Checkbox */}
                          <View
                            className="w-6 h-6 rounded-full items-center justify-center"
                            style={{ backgroundColor: colors.primary }}
                          >
                            <Text className="text-white text-xs">✓</Text>
                          </View>

                          {/* Task Content */}
                          <View className="flex-1">
                            <Text className="text-base font-medium text-muted mb-1 line-through">
                              {task.content}
                            </Text>
                            <Text className="text-xs text-muted">
                              Completed {new Date(task.completed_at).toLocaleDateString()}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </>
                )}
                </>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Task Edit Modal */}
      <TaskFormModal
        visible={isTaskModalVisible}
        task={selectedTask}
        onClose={handleTaskModalClose}
        onSave={handleTaskModalSave}
      />
    </ScreenContainer>
  );
}
