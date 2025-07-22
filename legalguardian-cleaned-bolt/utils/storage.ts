// utils/storage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

// Safe storage utilities that work in both web and native environments
export const safeStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (typeof window === 'undefined') {
        // SSR environment - return null
        return null;
      }
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error('Storage getItem error:', error);
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<boolean> {
    try {
      if (typeof window === 'undefined') {
        // SSR environment - return false
        return false;
      }
      await AsyncStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error('Storage setItem error:', error);
      return false;
    }
  },

  async removeItem(key: string): Promise<boolean> {
    try {
      if (typeof window === 'undefined') {
        // SSR environment - return false
        return false;
      }
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Storage removeItem error:', error);
      return false;
    }
  }
};

// Storage utilities for JSON data
export const storageUtils = {
  async getJSON<T>(key: string, defaultValue: T): Promise<T> {
    try {
      const item = await safeStorage.getItem(key);
      if (!item) return defaultValue;
      return JSON.parse(item) as T;
    } catch (error) {
      console.error('Storage getJSON error:', error);
      return defaultValue;
    }
  },

  async setJSON<T>(key: string, value: T): Promise<boolean> {
    try {
      const jsonString = JSON.stringify(value);
      return await safeStorage.setItem(key, jsonString);
    } catch (error) {
      console.error('Storage setJSON error:', error);
      return false;
    }
  }
};

// Recording utilities
export async function getRecordings() {
  return [
    {
      id: "1",
      uri: "file:///recording1.mp4",
      date: "July 21, 2025",
      duration: "2:15",
    },
    {
      id: "2",
      uri: "file:///recording2.mp4",
      date: "July 20, 2025",
      duration: "0:47",
    },
  ];
}

export default {
  safeStorage,
  storageUtils,
  getRecordings
};