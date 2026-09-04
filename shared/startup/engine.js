import { getCachedSession } from './cache';

export const AppStartupState = {
  Initializing: 'Initializing',
  ReadingCache: 'ReadingCache',
  Rendering: 'Rendering',
  Synchronizing: 'Synchronizing',
  Ready: 'Ready'
};

/**
 * bootApplication — Cache-read-only startup step.
 * 
 * Reads the local session cache and returns it immediately.
 * Does NOT trigger any Firebase validation or synchronization.
 * Background Validation is owned exclusively by StartupProvider's auth listener.
 */
export const bootApplication = async () => {
  try {
    const cached = await getCachedSession();

    if (cached && cached.data) {
      console.log('[Startup Engine] Local session found. Rendering from cache.');
      return {
        session: cached.data,
        isExpired: cached.isExpired
      };
    }
  } catch (error) {
    console.error('[Startup Engine] Boot error:', error);
  }

  console.log('[Startup Engine] No local session found. Rendering login.');
  return { session: null, isExpired: false };
};
