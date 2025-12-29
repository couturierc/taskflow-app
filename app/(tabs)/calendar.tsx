/**
 * Calendar View Screen
 * 
 * Displays tasks in a monthly calendar view
 */

import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useAuth } from '@/lib/auth-context';
import { TodoistTask } from '@/lib/todoist-api';
import { useColors } from '@/hooks/use-colors';
import { TaskFormModal } from '@/components/task-form-modal';
import * as Haptics from 'expo-haptics';

export default function CalendarScreen() {
  const { apiClient, isAuthenticated } = useAuth();
  const [tasks, setTasks] = useState<TodoistTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<TodoistTask | null>(null);
  const [isTaskModalVisible, setIsTaskModalVisible] = useState(false);
  const colors = useColors();

  useEffect(() => {
    if (isAuthenticated) {
      loadTasks();
    }
  }, [isAuthenticated]);

  async function loadTasks() {
    if (!apiClient) return;

    try {
      const allTasks = await apiClient.getTasks();
      setTasks(allTasks.filter(task => task.due && !task.is_completed));
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
    } catch (error) {
      console.error('Failed to toggle task:', error);
      Alert.alert('Error', 'Failed to update task. Please try again.');
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
    return tasks.filter(task => task.due?.date === dateStr);
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

  const selectedDateTasks = selectedDate ? getTasksForDate(selectedDate) : [];

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
              {tasks.length} task{tasks.length !== 1 ? 's' : ''} with due dates
            </Text>
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
              const hasTasksOnDate = dateTasks.length > 0;
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
                        : hasTasksOnDate
                        ? colors.surface
                        : 'transparent',
                      borderWidth: hasTasksOnDate && !isSelected ? 1 : 0,
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
                    {hasTasksOnDate && !isSelected && (
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
              
              {selectedDateTasks.length === 0 ? (
                <View className="bg-surface rounded-xl p-6 items-center">
                  <Text className="text-base text-muted">No tasks for this date</Text>
                </View>
              ) : (
                selectedDateTasks.map(task => (
                  <TouchableOpacity
                    key={task.id}
                    className="bg-surface border border-border rounded-xl p-4 mb-3 active:opacity-70"
                    onPress={() => handleTaskPress(task)}
                  >
                    <View className="flex-row items-center gap-3">
                      {/* Checkbox */}
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          handleToggleComplete(task);
                        }}
                        className="w-6 h-6 rounded-full border-2 items-center justify-center active:opacity-60"
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
                        <Text className="text-base font-medium text-foreground mb-1">
                          {task.content}
                        </Text>
                        {task.description && (
                          <Text className="text-sm text-muted" numberOfLines={2}>
                            {task.description}
                          </Text>
                        )}
                        <View className="flex-row items-center gap-2 mt-2">
                          {task.priority > 1 && (
                            <View
                              className="px-2 py-1 rounded"
                              style={{ backgroundColor: colors.warning + '20' }}
                            >
                              <Text className="text-xs font-medium" style={{ color: colors.warning }}>
                                P{task.priority}
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
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
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
