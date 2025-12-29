/**
 * Utility functions for handling subtasks (parent-child task relationships)
 */

import { TodoistTask } from './todoist-api';

export interface TaskWithChildren extends TodoistTask {
  children: TaskWithChildren[];
  level: number;
}

/**
 * Organize flat task list into hierarchical structure with parent-child relationships
 */
export function organizeTasksWithSubtasks(tasks: TodoistTask[]): TaskWithChildren[] {
  // Create a map of task ID to task with children
  const taskMap = new Map<string, TaskWithChildren>();
  
  // Initialize all tasks with empty children array and level 0
  tasks.forEach(task => {
    taskMap.set(task.id, { ...task, children: [], level: 0 });
  });
  
  // Build the hierarchy
  const rootTasks: TaskWithChildren[] = [];
  
  tasks.forEach(task => {
    const taskWithChildren = taskMap.get(task.id)!;
    
    if (task.parent_id) {
      // This is a subtask - add to parent's children
      const parent = taskMap.get(task.parent_id);
      if (parent) {
        taskWithChildren.level = parent.level + 1;
        parent.children.push(taskWithChildren);
      } else {
        // Parent not found (maybe filtered out), treat as root
        rootTasks.push(taskWithChildren);
      }
    } else {
      // This is a root task
      rootTasks.push(taskWithChildren);
    }
  });
  
  return rootTasks;
}

/**
 * Flatten hierarchical tasks back to a flat list (for rendering)
 */
export function flattenTasksWithSubtasks(tasks: TaskWithChildren[]): TaskWithChildren[] {
  const result: TaskWithChildren[] = [];
  
  function flatten(task: TaskWithChildren) {
    result.push(task);
    task.children.forEach(child => flatten(child));
  }
  
  tasks.forEach(task => flatten(task));
  return result;
}

/**
 * Calculate completion progress for a parent task
 * Returns { completed: number, total: number, percentage: number }
 */
export function calculateSubtaskProgress(task: TaskWithChildren): {
  completed: number;
  total: number;
  percentage: number;
} {
  if (task.children.length === 0) {
    return { completed: 0, total: 0, percentage: 0 };
  }
  
  let completed = 0;
  let total = task.children.length;
  
  task.children.forEach(child => {
    if (child.is_completed) {
      completed++;
    }
  });
  
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  return { completed, total, percentage };
}

/**
 * Check if a task has subtasks
 */
export function hasSubtasks(task: TaskWithChildren): boolean {
  return task.children.length > 0;
}

/**
 * Get all subtask IDs recursively
 */
export function getAllSubtaskIds(task: TaskWithChildren): string[] {
  const ids: string[] = [];
  
  function collect(t: TaskWithChildren) {
    t.children.forEach(child => {
      ids.push(child.id);
      collect(child);
    });
  }
  
  collect(task);
  return ids;
}
