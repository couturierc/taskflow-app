/**
 * Batch Operations Context
 * 
 * Manages multi-select mode and batch operations on tasks
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { TodoistTask } from './todoist-api';

interface BatchContextType {
  isMultiSelectMode: boolean;
  selectedTasks: Set<string>;
  toggleMultiSelectMode: () => void;
  toggleTaskSelection: (taskId: string) => void;
  selectAll: (tasks: TodoistTask[]) => void;
  deselectAll: () => void;
  isTaskSelected: (taskId: string) => boolean;
  getSelectedCount: () => number;
}

const BatchContext = createContext<BatchContextType | undefined>(undefined);

export function BatchProvider({ children }: { children: ReactNode }) {
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());

  function toggleMultiSelectMode() {
    setIsMultiSelectMode(!isMultiSelectMode);
    if (isMultiSelectMode) {
      // Exit multi-select mode, clear selections
      setSelectedTasks(new Set());
    }
  }

  function toggleTaskSelection(taskId: string) {
    setSelectedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  }

  function selectAll(tasks: TodoistTask[]) {
    const allTaskIds = tasks.map(task => task.id);
    setSelectedTasks(new Set(allTaskIds));
  }

  function deselectAll() {
    setSelectedTasks(new Set());
  }

  function isTaskSelected(taskId: string): boolean {
    return selectedTasks.has(taskId);
  }

  function getSelectedCount(): number {
    return selectedTasks.size;
  }

  const value: BatchContextType = {
    isMultiSelectMode,
    selectedTasks,
    toggleMultiSelectMode,
    toggleTaskSelection,
    selectAll,
    deselectAll,
    isTaskSelected,
    getSelectedCount,
  };

  return <BatchContext.Provider value={value}>{children}</BatchContext.Provider>;
}

export function useBatch(): BatchContextType {
  const context = useContext(BatchContext);
  if (context === undefined) {
    throw new Error('useBatch must be used within a BatchProvider');
  }
  return context;
}
