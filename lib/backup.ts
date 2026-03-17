/**
 * Backup & Restore Service
 *
 * Exports all local data (tasks, projects, labels, sync queue) as a JSON file.
 * Supports manual backup/restore and first-login backup prompt.
 */

import { File, Paths } from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { TodoistTask, TodoistProject, TodoistLabel } from './todoist-api';
import {
  getCachedTasks,
  getCachedProjects,
  getCachedLabels,
  getSyncQueue,
  cacheTasks,
  cacheProjects,
  cacheLabels,
  PendingChange,
} from './offline-storage';

const BACKUP_VERSION = 1;
const FIRST_BACKUP_KEY = '@taskflow_has_backed_up';
const LAST_BACKUP_KEY = '@taskflow_last_backup';

export interface BackupData {
  version: number;
  createdAt: string;
  appVersion: string;
  tasks: TodoistTask[];
  projects: TodoistProject[];
  labels: TodoistLabel[];
  syncQueue: PendingChange[];
}

export interface BackupResult {
  success: boolean;
  message: string;
  path?: string;
}

/**
 * Collect all local data into a backup object
 */
async function collectBackupData(appVersion: string): Promise<BackupData> {
  const [tasks, projects, labels, syncQueue] = await Promise.all([
    getCachedTasks(),
    getCachedProjects(),
    getCachedLabels(),
    getSyncQueue(),
  ]);

  return {
    version: BACKUP_VERSION,
    createdAt: new Date().toISOString(),
    appVersion,
    tasks,
    projects,
    labels,
    syncQueue,
  };
}

/**
 * Create a backup and share it (native) or download it (web)
 */
export async function createBackup(appVersion: string): Promise<BackupResult> {
  try {
    const data = await collectBackupData(appVersion);
    const json = JSON.stringify(data, null, 2);
    const filename = `taskflow-backup-${new Date().toISOString().slice(0, 10)}.json`;

    if (Platform.OS === 'web') {
      // Web: trigger a download via blob
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      await markBackupDone();
      return { success: true, message: 'Backup downloaded.' };
    }

    // Native: write to cache dir then share
    const file = new File(Paths.cache, filename);
    file.write(json);

    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(file.uri, {
        mimeType: 'application/json',
        dialogTitle: 'Save TaskFlow backup',
        UTI: 'public.json',
      });
    }

    await markBackupDone();
    return { success: true, message: 'Backup created.', path: file.uri };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, message: `Backup failed: ${msg}` };
  }
}

/**
 * Pick a backup file and restore from it
 */
export async function restoreFromBackup(): Promise<BackupResult> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets?.length) {
      return { success: false, message: 'No file selected.' };
    }

    const asset = result.assets[0];
    let json: string;

    if (Platform.OS === 'web') {
      const response = await fetch(asset.uri);
      json = await response.text();
    } else {
      const picked = new File(asset.uri);
      json = await picked.text();
    }

    const data = JSON.parse(json) as BackupData;

    // Validate the backup structure
    if (!data.version || !data.tasks || !data.projects || !data.labels) {
      return { success: false, message: 'Invalid backup file — missing required fields.' };
    }

    if (data.version > BACKUP_VERSION) {
      return {
        success: false,
        message: `Backup version ${data.version} is newer than supported (${BACKUP_VERSION}). Please update the app.`,
      };
    }

    // Restore data
    await Promise.all([
      cacheTasks(data.tasks),
      cacheProjects(data.projects),
      cacheLabels(data.labels),
    ]);

    // Restore sync queue if present
    if (data.syncQueue?.length) {
      await AsyncStorage.setItem('@taskflow_sync_queue', JSON.stringify(data.syncQueue));
    }

    const taskCount = data.tasks.length;
    const projectCount = data.projects.length;
    return {
      success: true,
      message: `Restored ${taskCount} tasks and ${projectCount} projects from ${data.createdAt.slice(0, 10)} backup.`,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, message: `Restore failed: ${msg}` };
  }
}

/**
 * Mark that the user has created at least one backup
 */
async function markBackupDone(): Promise<void> {
  const now = new Date().toISOString();
  await AsyncStorage.setItem(FIRST_BACKUP_KEY, 'true');
  await AsyncStorage.setItem(LAST_BACKUP_KEY, now);
}

/**
 * Check if user has ever backed up
 */
export async function hasEverBackedUp(): Promise<boolean> {
  const val = await AsyncStorage.getItem(FIRST_BACKUP_KEY);
  return val === 'true';
}

/**
 * Get the last backup timestamp (ISO string), or null
 */
export async function getLastBackupDate(): Promise<string | null> {
  return AsyncStorage.getItem(LAST_BACKUP_KEY);
}

/**
 * Check if we should prompt for backup (first login with data, never backed up)
 */
export async function shouldPromptBackup(): Promise<boolean> {
  const backedUp = await hasEverBackedUp();
  if (backedUp) return false;

  const tasks = await getCachedTasks();
  return tasks.length > 0;
}
