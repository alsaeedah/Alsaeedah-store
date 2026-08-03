import { cacheService } from '../cache/index.js';

const CACHE_KEY = 'app_session_cache';
const CACHE_VERSION = 1;
// 7 days in milliseconds
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; 

export const cacheSession = async (sessionData) => {
  try {
    const payload = {
      version: CACHE_VERSION,
      lastSync: Date.now(),
      data: sessionData
    };
    await cacheService.set(
      CACHE_KEY,
      JSON.stringify(payload)
    );
  } catch (error) {
    console.error('[Cache] Failed to save session:', error);
  }
};

export const getCachedSession = async () => {
  try {
    const { value } = await cacheService.get(CACHE_KEY);
    if (!value) return null;
    
    const payload = JSON.parse(value);
    
    // Invalidate if version mismatch
    if (payload.version !== CACHE_VERSION) {
      console.warn('[Cache] Version mismatch. Invalidating cache.');
      await clearCachedSession();
      return null;
    }
    
    const age = Date.now() - (payload.lastSync || 0);
    const isExpired = age > CACHE_TTL_MS;
    
    return {
      data: payload.data,
      isExpired
    };
  } catch (error) {
    console.error('[Cache] Failed to get session:', error);
    return null;
  }
};

export const clearCachedSession = async () => {
  try {
    await cacheService.remove(CACHE_KEY);
  } catch (error) {
    console.error('[Cache] Failed to clear session:', error);
  }
};
