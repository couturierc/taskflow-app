/**
 * Offline Sync Manager
 * 
 * Handles syncing pending changes when connection is restored
 */

import NetInfo from '@react-native-community/netinfo';
import { TodoistAPI } from './todoist-api';
import {
  getSyncQueue,
  removePendingChange,
  updateLastSync,
  PendingChange,
} from './offline-storage';

export class OfflineSyncManager {
  private apiClient: TodoistAPI;
  private isSyncing: boolean = false;
  private listeners: Set<() => void> = new Set();

  constructor(apiClient: TodoistAPI) {
    this.apiClient = apiClient;
  }

  /**
   * Subscribe to sync events
   */
  onSyncComplete(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(): void {
    this.listeners.forEach(callback => callback());
  }

  /**
   * Check if device is online
   */
  async isOnline(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return state.isConnected === true;
  }

  /**
   * Sync all pending changes
   */
  async syncPendingChanges(): Promise<{ success: number; failed: number }> {
    if (this.isSyncing) {
      console.log('Sync already in progress');
      return { success: 0, failed: 0 };
    }

    const online = await this.isOnline();
    if (!online) {
      console.log('Device is offline, skipping sync');
      return { success: 0, failed: 0 };
    }

    this.isSyncing = true;
    let successCount = 0;
    let failedCount = 0;

    try {
      const queue = await getSyncQueue();
      console.log(`Syncing ${queue.length} pending changes`);

      // Sort by timestamp to maintain order
      const sortedQueue = queue.sort((a, b) => a.timestamp - b.timestamp);

      for (const change of sortedQueue) {
        try {
          await this.processChange(change);
          await removePendingChange(change.id);
          successCount++;
        } catch (error) {
          console.error(`Failed to sync change ${change.id}:`, error);
          failedCount++;
          
          // If it's a 404 error, the resource was likely deleted on server
          // Remove it from queue to avoid retrying forever
          if (error && typeof error === 'object' && 'status' in error && error.status === 404) {
            await removePendingChange(change.id);
          }
        }
      }

      if (successCount > 0) {
        await updateLastSync();
        this.notifyListeners();
      }

      console.log(`Sync complete: ${successCount} success, ${failedCount} failed`);
    } finally {
      this.isSyncing = false;
    }

    return { success: successCount, failed: failedCount };
  }

  /**
   * Process a single pending change
   */
  private async processChange(change: PendingChange): Promise<void> {
    switch (change.type) {
      case 'create_task':
        await this.apiClient.createTask(change.data);
        break;

      case 'update_task':
        await this.apiClient.updateTask(change.data.taskId, change.data.updates);
        break;

      case 'delete_task':
        await this.apiClient.deleteTask(change.data.taskId);
        break;

      case 'complete_task':
        await this.apiClient.closeTask(change.data.taskId);
        break;

      case 'reopen_task':
        await this.apiClient.reopenTask(change.data.taskId);
        break;

      default:
        console.warn(`Unknown change type: ${(change as any).type}`);
    }
  }

  /**
   * Start auto-sync on network changes
   */
  startAutoSync(): () => void {
    const unsubscribe = NetInfo.addEventListener((state: any) => {
      if (state.isConnected) {
        console.log('Network connected, starting sync...');
        this.syncPendingChanges();
      }
    });

    // Initial sync
    this.syncPendingChanges();

    return unsubscribe;
  }
}

/**
 * Create a singleton sync manager
 */
let syncManagerInstance: OfflineSyncManager | null = null;

export function createSyncManager(apiClient: TodoistAPI): OfflineSyncManager {
  if (!syncManagerInstance) {
    syncManagerInstance = new OfflineSyncManager(apiClient);
  }
  return syncManagerInstance;
}

export function getSyncManager(): OfflineSyncManager | null {
  return syncManagerInstance;
}
