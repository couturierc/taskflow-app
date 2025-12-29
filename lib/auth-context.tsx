/**
 * Authentication Context
 * 
 * Manages user authentication state and Todoist API token
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createTodoistClient, TodoistAPI } from './todoist-api';
import { createSyncManager, OfflineSyncManager } from './offline-sync';

const TOKEN_KEY = 'todoist_api_token';

interface AuthContextType {
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  apiClient: TodoistAPI | null;
  syncManager: OfflineSyncManager | null;
  signIn: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Store token securely
 */
async function storeToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } else {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  }
}

/**
 * Retrieve stored token
 */
async function getStoredToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } else {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  }
}

/**
 * Delete stored token
 */
async function deleteToken(): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } else {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [apiClient, setApiClient] = useState<TodoistAPI | null>(null);
  const [syncManager, setSyncManager] = useState<OfflineSyncManager | null>(null);

  // Load token on mount
  useEffect(() => {
    loadToken();
  }, []);

  // Create API client and sync manager when token changes
  useEffect(() => {
    if (token) {
      const client = createTodoistClient(token);
      setApiClient(client);
      
      const manager = createSyncManager(client);
      setSyncManager(manager);
      
      // Start auto-sync
      const unsubscribe = manager.startAutoSync();
      return () => unsubscribe();
    } else {
      setApiClient(null);
      setSyncManager(null);
    }
  }, [token]);

  async function loadToken() {
    try {
      const storedToken = await getStoredToken();
      if (storedToken) {
        setToken(storedToken);
      }
    } catch (error) {
      console.error('Failed to load token:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function signIn(newToken: string) {
    try {
      // Validate token by creating a client and testing it
      const client = createTodoistClient(newToken);
      const isValid = await client.validateToken();

      if (!isValid) {
        throw new Error('Invalid API token');
      }

      // Store token and update state
      await storeToken(newToken);
      setToken(newToken);
    } catch (error) {
      console.error('Sign in failed:', error);
      throw error;
    }
  }

  async function signOut() {
    try {
      await deleteToken();
      setToken(null);
    } catch (error) {
      console.error('Sign out failed:', error);
      throw error;
    }
  }

  const value: AuthContextType = {
    token,
    isLoading,
    isAuthenticated: !!token,
    apiClient,
    syncManager,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access authentication context
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
