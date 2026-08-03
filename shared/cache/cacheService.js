import { browserStorage } from './browserStorage.js';
import { capacitorStorage } from './capacitorStorage.js';
import { Capacitor } from '@capacitor/core';

let activeStorage = null;

const detectStorageEngine = () => {
  if (activeStorage) return activeStorage;

  try {
    if (Capacitor.isNativePlatform()) {
      activeStorage = capacitorStorage;
      return activeStorage;
    }
  } catch (e) {
    console.warn('[CacheService] Failed to detect Capacitor platform, falling back to browser storage:', e);
  }

  activeStorage = browserStorage;
  return activeStorage;
};

export const cacheService = {
  get: async (key) => {
    const storage = detectStorageEngine();
    return await storage.get({ key });
  },
  
  set: async (key, value) => {
    const storage = detectStorageEngine();
    return await storage.set({ key, value });
  },
  
  remove: async (key) => {
    const storage = detectStorageEngine();
    return await storage.remove({ key });
  },
  
  clear: async () => {
    const storage = detectStorageEngine();
    return await storage.clear();
  }
};
