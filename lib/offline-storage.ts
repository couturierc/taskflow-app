/**
 * Offline Storage Utility
 * 
 * Handles caching tasks, projects, and labels locally with AsyncStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { TodoistTask, TodoistProject, TodoistLabel } from './todoist-api';

const STORAGE_KEYS = {
  TASKS: '@taskflow_tasks',
  PROJECTS: '@taskflow_projects',
  LABELS: '@taskflow_labels',
  SYNC_QUEUE: '@taskflow_sync_queue',
  LAST_SYNC: '@taskflow_last_sync',
};

export interface PendingChange {
  id: string;
  type: 'create_task' | 'update_task' | 'delete_task' | 'complete_task' | 'reopen_task';
  data: any;
  timestamp: number;
}

/**
 * Cache tasks locally
 */
export async function cacheTasks(tasks: TodoistTask[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  } catch (error) {
    console.error('Failed to cache tasks:', error);
  }
}

/**
 * Get cached tasks
 */
export async function getCachedTasks(): Promise<TodoistTask[]> {
  try {
    const cached = await AsyncStorage.getItem(STORAGE_KEYS.TASKS);
    return cached ? JSON.parse(cached) : [];
  } catch (error) {
    console.error('Failed to get cached tasks:', error);
    return [];
  }
}

/**
 * Cache projects locally
 */
export async function cacheProjects(projects: TodoistProject[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  } catch (error) {
    console.error('Failed to cache projects:', error);
  }
}

/**
 * Get cached projects
 */
export async function getCachedProjects(): Promise<TodoistProject[]> {
  try {
    const cached = await AsyncStorage.getItem(STORAGE_KEYS.PROJECTS);
    return cached ? JSON.parse(cached) : [];
  } catch (error) {
    console.error('Failed to get cached projects:', error);
    return [];
  }
}

/**
 * Cache labels locally
 */
export async function cacheLabels(labels: TodoistLabel[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.LABELS, JSON.stringify(labels));
  } catch (error) {
    console.error('Failed to cache labels:', error);
  }
}

/**
 * Get cached labels
 */
export async function getCachedLabels(): Promise<TodoistLabel[]> {
  try {
    const cached = await AsyncStorage.getItem(STORAGE_KEYS.LABELS);
    return cached ? JSON.parse(cached) : [];
  } catch (error) {
    console.error('Failed to get cached labels:', error);
    return [];
  }
}

/**
 * Add a pending change to the sync queue
 */
export async function addPendingChange(change: Omit<PendingChange, 'id' | 'timestamp'>): Promise<void> {
  try {
    const queue = await getSyncQueue();
    const newChange: PendingChange = {
      ...change,
      id: `${Date.now()}_${Math.random()}`,
      timestamp: Date.now(),
    };
    queue.push(newChange);
    await AsyncStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
  } catch (error) {
    console.error('Failed to add pending change:', error);
  }
}

/**
 * Get all pending changes
 */
export async function getSyncQueue(): Promise<PendingChange[]> {
  try {
    const cached = await AsyncStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
    return cached ? JSON.parse(cached) : [];
  } catch (error) {
    console.error('Failed to get sync queue:', error);
    return [];
  }
}

/**
 * Remove a change from the sync queue
 */
export async function removePendingChange(changeId: string): Promise<void> {
  try {
    const queue = await getSyncQueue();
    const filtered = queue.filter(change => change.id !== changeId);
    await AsyncStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to remove pending change:', error);
  }
}

/**
 * Clear the sync queue
 */
export async function clearSyncQueue(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify([]));
  } catch (error) {
    console.error('Failed to clear sync queue:', error);
  }
}

/**
 * Update last sync timestamp
 */
export async function updateLastSync(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, Date.now().toString());
  } catch (error) {
    console.error('Failed to update last sync:', error);
  }
}

/**
 * Get last sync timestamp
 */
export async function getLastSync(): Promise<number | null> {
  try {
    const cached = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    return cached ? parseInt(cached, 10) : null;
  } catch (error) {
    console.error('Failed to get last sync:', error);
    return null;
  }
}

/**
 * Clear all cached data
 */
export async function clearAllCache(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.TASKS,
      STORAGE_KEYS.PROJECTS,
      STORAGE_KEYS.LABELS,
      STORAGE_KEYS.SYNC_QUEUE,
      STORAGE_KEYS.LAST_SYNC,
    ]);
  } catch (error) {
    console.error('Failed to clear cache:', error);
  }
}
