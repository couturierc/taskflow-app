/**
 * Task Form Modal
 * 
 * Modal for creating and editing tasks
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/use-colors';
import { TodoistTask, TodoistProject, TodoistLabel, TodoistSection } from '@/lib/todoist-api';
import { useAuth } from '@/lib/auth-context';
import * as Haptics from 'expo-haptics';
import { CalendarPicker } from './calendar-picker';

interface TaskFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (movedFromProject?: string) => void;
  task?: TodoistTask | null;
  defaultProjectId?: string;
  defaultSectionId?: string | null;
  parentTaskId?: string | null;
}

export function TaskFormModal({
  visible,
  onClose,
  onSave,
  task,
  defaultProjectId,
  defaultSectionId,
  parentTaskId,
}: TaskFormModalProps) {
  const colors = useColors();
  const { apiClient } = useAuth();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState(defaultProjectId || '');
  const [sectionId, setSectionId] = useState<string | null>(defaultSectionId || null);
  const [priority, setPriority] = useState<1 | 2 | 3 | 4>(1);
  const [dueDate, setDueDate] = useState('');
  const [dueString, setDueString] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [projects, setProjects] = useState<TodoistProject[]>([]);
  const [sections, setSections] = useState<TodoistSection[]>([]);
  const [labels, setLabels] = useState<TodoistLabel[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load projects and labels when modal opens
  useEffect(() => {
    if (visible && apiClient) {
      loadProjects();
      loadLabels();
    }
  }, [visible, apiClient]);

  // Load sections when project changes
  useEffect(() => {
    if (visible && apiClient && projectId) {
      loadSections(projectId);
    }
  }, [visible, apiClient, projectId]);

  // Populate form when editing
  useEffect(() => {
    if (task) {
      setTitle(task.content);
      setDescription(task.description);
      setProjectId(task.project_id);
      setSectionId(task.section_id);
      setPriority(task.priority);
      setDueDate(task.due?.date || '');
      setDueString(task.due?.string || '');
      setIsRecurring(task.due?.is_recurring || false);
      setSelectedLabels(task.labels || []);
    } else {
      // Reset form for new task
      setTitle('');
      setDescription('');
      setProjectId(defaultProjectId || '');
      setSectionId(defaultSectionId || null);
      setPriority(1);
      setDueDate('');
      setDueString('');
      setIsRecurring(false);
      setSelectedLabels([]);
    }
  }, [task, defaultProjectId, defaultSectionId]);

  async function loadProjects() {
    if (!apiClient) return;
    try {
      const allProjects = await apiClient.getProjects();
      setProjects(allProjects);
      
      // Set default project if not set
      if (!projectId && allProjects.length > 0) {
        const inbox = allProjects.find(p => p.is_inbox_project);
        setProjectId(inbox?.id || allProjects[0].id);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  }

  async function loadSections(projId: string) {
    if (!apiClient) return;
    try {
      const projectSections = await apiClient.getSections(projId);
      setSections(projectSections);
      // Reset section if it's not in the new project
      if (sectionId && !projectSections.find(s => s.id === sectionId)) {
        setSectionId(null);
      }
    } catch (error) {
      console.error('Failed to load sections:', error);
      setSections([]);
    }
  }

  async function loadLabels() {
    if (!apiClient) return;
    try {
      const allLabels = await apiClient.getLabels();
      setLabels(allLabels);
    } catch (error) {
      console.error('Failed to load labels:', error);
    }
  }

  function toggleLabel(labelName: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (selectedLabels.includes(labelName)) {
      setSelectedLabels(selectedLabels.filter(l => l !== labelName));
    } else {
      setSelectedLabels([...selectedLabels, labelName]);
    }
  }

  const COLOR_HEX_MAP: Record<string, string> = {
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

  async function handleDelete() {
    if (!apiClient || !task) return;

    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              await apiClient.deleteTask(task.id);
              onSave();
              handleClose();
            } catch (error) {
              console.error('Failed to delete task:', error);
              Alert.alert('Error', 'Failed to delete task. Please try again.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  }

  async function handleSave() {
    if (!apiClient) return;
    
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }

    setIsLoading(true);
    try {
      if (task) {
        // Update existing task
        const oldProjectId = task.project_id;
        const oldSectionId = task.section_id;
        const isMovingProject = oldProjectId !== projectId;
        const isMovingSection = oldSectionId !== sectionId;
        
        // First update task properties (without project_id - it's read-only in REST API)
        await apiClient.updateTask(task.id, {
          content: title.trim(),
          description: description.trim(),
          priority,
          due_string: dueString || dueDate || undefined,
          labels: selectedLabels,
        });
        
        // If project changed, use Sync API to move the task
        if (isMovingProject) {
          await apiClient.moveTask(task.id, projectId);
          onSave(oldProjectId);
        } else if (isMovingSection) {
          // Move to different section within same project
          await apiClient.moveTaskToSection(task.id, sectionId);
          onSave();
        } else {
          onSave();
        }
      } else {
        // Create new task
        await apiClient.createTask({
          content: title.trim(),
          description: description.trim(),
          project_id: projectId,
          section_id: sectionId || undefined,
          priority,
          due_string: dueString || dueDate || undefined,
          labels: selectedLabels,
          parent_id: parentTaskId || undefined,
        });
        onSave();
      }
      handleClose();
    } catch (error) {
      console.error('Failed to save task:', error);
      Alert.alert('Error', 'Failed to save task. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleClose() {
    setTitle('');
    setDescription('');
    setProjectId(defaultProjectId || '');
    setSectionId(defaultSectionId || null);
    setPriority(1);
    setDueDate('');
    setDueString('');
    setIsRecurring(false);
    setSelectedLabels([]);
    setSections([]);
    onClose();
  }

  const priorityOptions = [
    { value: 4, label: 'P1 (Urgent)', color: colors.error },
    { value: 3, label: 'P2', color: colors.warning },
    { value: 2, label: 'P3', color: colors.primary },
    { value: 1, label: 'P4 (Low)', color: colors.muted },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View className="flex-1">
            {/* Header */}
            <View 
              className="flex-row items-center justify-between px-4 py-4 border-b"
              style={{ borderColor: colors.border }}
            >
            <TouchableOpacity onPress={handleClose} className="py-2 active:opacity-60">
              <Text className="text-base" style={{ color: colors.primary }}>Cancel</Text>
            </TouchableOpacity>
            <Text className="text-lg font-semibold text-foreground">
              {task ? 'Edit Task' : 'New Task'}
            </Text>
            <TouchableOpacity 
              onPress={handleSave} 
              disabled={isLoading}
              className="py-2 active:opacity-60"
              style={{ opacity: isLoading ? 0.5 : 1 }}
            >
              <Text className="text-base font-semibold" style={{ color: colors.primary }}>
                {isLoading ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
            </View>

            {/* Form */}
            <ScrollView className="flex-1 px-4 pt-6" keyboardShouldPersistTaps="handled">
            {/* Title */}
            <View className="mb-6">
              <Text className="text-sm font-semibold text-foreground mb-2">Title *</Text>
              <TextInput
                className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground text-base"
                placeholder="What needs to be done?"
                placeholderTextColor={colors.muted}
                value={title}
                onChangeText={setTitle}
                autoFocus
                returnKeyType="next"
              />
            </View>

            {/* Description */}
            <View className="mb-6">
              <Text className="text-sm font-semibold text-foreground mb-2">Description</Text>
              <TextInput
                className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground text-base"
                placeholder="Add details..."
                placeholderTextColor={colors.muted}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Project Selector */}
            {projects.length > 0 && (
              <View className="mb-6">
                <Text className="text-sm font-semibold text-foreground mb-2">Project</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-2">
                  {projects.map(project => (
                    <TouchableOpacity
                      key={project.id}
                      className="px-4 py-2 rounded-full border active:opacity-70"
                      style={{
                        backgroundColor: projectId === project.id ? colors.primary + '20' : colors.surface,
                        borderColor: projectId === project.id ? colors.primary : colors.border,
                      }}
                      onPress={() => {
                        setProjectId(project.id);
                        setSectionId(null); // Reset section when project changes
                      }}
                    >
                      <Text
                        className="text-sm font-medium"
                        style={{ color: projectId === project.id ? colors.primary : colors.foreground }}
                      >
                        {project.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Section Selector */}
            {sections.length > 0 && (
              <View className="mb-6">
                <Text className="text-sm font-semibold text-foreground mb-2">Section</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-2">
                  <TouchableOpacity
                    className="px-4 py-2 rounded-full border active:opacity-70"
                    style={{
                      backgroundColor: sectionId === null ? colors.primary + '20' : colors.surface,
                      borderColor: sectionId === null ? colors.primary : colors.border,
                    }}
                    onPress={() => setSectionId(null)}
                  >
                    <Text
                      className="text-sm font-medium"
                      style={{ color: sectionId === null ? colors.primary : colors.foreground }}
                    >
                      No Section
                    </Text>
                  </TouchableOpacity>
                  {sections.map(section => (
                    <TouchableOpacity
                      key={section.id}
                      className="px-4 py-2 rounded-full border active:opacity-70"
                      style={{
                        backgroundColor: sectionId === section.id ? colors.primary + '20' : colors.surface,
                        borderColor: sectionId === section.id ? colors.primary : colors.border,
                      }}
                      onPress={() => setSectionId(section.id)}
                    >
                      <Text
                        className="text-sm font-medium"
                        style={{ color: sectionId === section.id ? colors.primary : colors.foreground }}
                      >
                        {section.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Priority Selector */}
            <View className="mb-6">
              <Text className="text-sm font-semibold text-foreground mb-2">Priority</Text>
              <View className="flex-row flex-wrap gap-2">
                {priorityOptions.map(option => (
                  <TouchableOpacity
                    key={option.value}
                    className="px-4 py-2 rounded-full border active:opacity-70"
                    style={{
                      backgroundColor: priority === option.value ? option.color + '20' : colors.surface,
                      borderColor: priority === option.value ? option.color : colors.border,
                    }}
                    onPress={() => setPriority(option.value as 1 | 2 | 3 | 4)}
                  >
                    <Text
                      className="text-sm font-medium"
                      style={{ color: priority === option.value ? option.color : colors.foreground }}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Labels Selector */}
            {labels.length > 0 && (
              <View className="mb-6">
                <Text className="text-sm font-semibold text-foreground mb-2">Labels</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-2">
                  {labels.map(label => {
                    const isSelected = selectedLabels.includes(label.name);
                    const hexColor = COLOR_HEX_MAP[label.color || 'charcoal'] || '#808080';
                    
                    return (
                      <TouchableOpacity
                        key={label.id}
                        className="px-4 py-2 rounded-full border active:opacity-70 flex-row items-center gap-2"
                        style={{
                          backgroundColor: isSelected ? hexColor + '20' : colors.surface,
                          borderColor: isSelected ? hexColor : colors.border,
                        }}
                        onPress={() => toggleLabel(label.name)}
                      >
                        <View
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: hexColor }}
                        />
                        <Text
                          className="text-sm font-medium"
                          style={{ color: isSelected ? hexColor : colors.foreground }}
                        >
                          {label.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Due Date / Recurring */}
            <View className="mb-6">
              <Text className="text-sm font-semibold text-foreground mb-2">Due Date</Text>
              
              {/* Quick Recurring Options */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
                <View className="flex-row gap-2">
                  {[
                    { label: 'Today', value: 'today' },
                    { label: 'Tomorrow', value: 'tomorrow' },
                    { label: 'Next Week', value: 'next week' },
                    { label: 'Every Day', value: 'every day' },
                    { label: 'Every Week', value: 'every week' },
                    { label: 'Every Month', value: 'every month' },
                  ].map(option => (
                    <TouchableOpacity
                      key={option.value}
                      className="px-4 py-2 rounded-full border active:opacity-70"
                      style={{
                        backgroundColor: dueString === option.value ? colors.primary + '20' : colors.surface,
                        borderColor: dueString === option.value ? colors.primary : colors.border,
                      }}
                      onPress={() => {
                        setDueString(option.value);
                        setDueDate('');
                      }}
                    >
                      <Text
                        className="text-sm font-medium"
                        style={{ color: dueString === option.value ? colors.primary : colors.foreground }}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
              
              {/* Custom Due String */}
              <TextInput
                className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground text-base mb-2"
                placeholder="e.g., 'tomorrow', 'every Monday', 'every 2 weeks'"
                placeholderTextColor={colors.muted}
                value={dueString}
                onChangeText={(text) => {
                  setDueString(text);
                  setDueDate('');
                }}
              />
              
              {/* Or Specific Date */}
              <Text className="text-xs text-muted text-center my-2">OR</Text>
              
              {/* Toggle Calendar View */}
              <TouchableOpacity
                className="bg-surface border border-border rounded-xl p-4 mb-3 active:opacity-70"
                onPress={() => setShowCalendar(!showCalendar)}
              >
                <Text className="text-base text-foreground text-center">
                  {dueDate ? `Selected: ${dueDate}` : 'Pick a specific date from calendar'}
                </Text>
              </TouchableOpacity>
              
              {/* Calendar Picker */}
              {showCalendar && (
                <CalendarPicker
                  selectedDate={dueDate}
                  onSelectDate={(date) => {
                    setDueDate(date);
                    setDueString('');
                    setShowCalendar(false);
                  }}
                />
              )}
              
              <Text className="text-xs text-muted mt-1">
                Use natural language for recurring tasks or pick a specific date
              </Text>
            </View>

            {/* Delete Button (only when editing) */}
            {task && (
              <View className="mb-8">
                <TouchableOpacity
                  className="bg-surface border rounded-xl p-4 items-center active:opacity-70"
                  style={{ borderColor: colors.error }}
                  onPress={handleDelete}
                  disabled={isLoading}
                >
                  <Text className="text-base font-semibold" style={{ color: colors.error }}>
                    Delete Task
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
