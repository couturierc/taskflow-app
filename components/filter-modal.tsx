/**
 * Filter Modal
 * 
 * Modal for filtering tasks by priority, project, etc.
 */

import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { useColors } from '@/hooks/use-colors';
import { TodoistProject } from '@/lib/todoist-api';

export interface FilterOptions {
  priority: number | null;
  projectId: string | null;
}

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  projects: TodoistProject[];
}

export function FilterModal({
  visible,
  onClose,
  filters,
  onFiltersChange,
  projects,
}: FilterModalProps) {
  const colors = useColors();

  function handlePriorityChange(priority: number | null) {
    onFiltersChange({ ...filters, priority });
  }

  function handleProjectChange(projectId: string | null) {
    onFiltersChange({ ...filters, projectId });
  }

  function handleClearFilters() {
    onFiltersChange({ priority: null, projectId: null });
  }

  const hasActiveFilters = filters.priority !== null || filters.projectId !== null;

  const priorityOptions = [
    { value: null, label: 'All Priorities', color: colors.muted },
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
      onRequestClose={onClose}
    >
      <View className="flex-1" style={{ backgroundColor: colors.background }}>
        {/* Header */}
        <View 
          className="flex-row items-center justify-between px-4 py-4 border-b"
          style={{ borderColor: colors.border }}
        >
          <TouchableOpacity onPress={onClose} className="py-2 active:opacity-60">
            <Text className="text-base" style={{ color: colors.primary }}>Done</Text>
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-foreground">Filters</Text>
          <TouchableOpacity 
            onPress={handleClearFilters}
            disabled={!hasActiveFilters}
            className="py-2 active:opacity-60"
            style={{ opacity: hasActiveFilters ? 1 : 0.3 }}
          >
            <Text className="text-base" style={{ color: colors.primary }}>Clear</Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-4 pt-6">
          {/* Priority Filter */}
          <View className="mb-8">
            <Text className="text-sm font-semibold text-foreground mb-3">Priority</Text>
            <View className="gap-2">
              {priorityOptions.map(option => (
                <TouchableOpacity
                  key={option.value ?? 'all'}
                  className="flex-row items-center justify-between bg-surface border rounded-xl p-4 active:opacity-70"
                  style={{
                    borderColor: filters.priority === option.value ? option.color : colors.border,
                    backgroundColor: filters.priority === option.value ? option.color + '10' : colors.surface,
                  }}
                  onPress={() => handlePriorityChange(option.value)}
                >
                  <Text
                    className="text-base font-medium"
                    style={{ color: filters.priority === option.value ? option.color : colors.foreground }}
                  >
                    {option.label}
                  </Text>
                  {filters.priority === option.value && (
                    <Text style={{ color: option.color }}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Project Filter */}
          {projects.length > 0 && (
            <View className="mb-8">
              <Text className="text-sm font-semibold text-foreground mb-3">Project</Text>
              <View className="gap-2">
                <TouchableOpacity
                  className="flex-row items-center justify-between bg-surface border rounded-xl p-4 active:opacity-70"
                  style={{
                    borderColor: filters.projectId === null ? colors.primary : colors.border,
                    backgroundColor: filters.projectId === null ? colors.primary + '10' : colors.surface,
                  }}
                  onPress={() => handleProjectChange(null)}
                >
                  <Text
                    className="text-base font-medium"
                    style={{ color: filters.projectId === null ? colors.primary : colors.foreground }}
                  >
                    All Projects
                  </Text>
                  {filters.projectId === null && (
                    <Text style={{ color: colors.primary }}>✓</Text>
                  )}
                </TouchableOpacity>

                {projects.map(project => (
                  <TouchableOpacity
                    key={project.id}
                    className="flex-row items-center justify-between bg-surface border rounded-xl p-4 active:opacity-70"
                    style={{
                      borderColor: filters.projectId === project.id ? colors.primary : colors.border,
                      backgroundColor: filters.projectId === project.id ? colors.primary + '10' : colors.surface,
                    }}
                    onPress={() => handleProjectChange(project.id)}
                  >
                    <Text
                      className="text-base font-medium"
                      style={{ color: filters.projectId === project.id ? colors.primary : colors.foreground }}
                    >
                      {project.name}
                    </Text>
                    {filters.projectId === project.id && (
                      <Text style={{ color: colors.primary }}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}
