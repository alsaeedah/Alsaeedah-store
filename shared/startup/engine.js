import { getCachedSession, clearCachedSession } from './cache';
import { startBackgroundValidation } from './authSync';

export const AppStartupState = {
  Initializing: 'Initializing',
  ReadingCache: 'ReadingCache',
  Rendering: 'Rendering',
  Synchronizing: 'Synchronizing',
  Ready: 'Ready'
};

/**
 * Boots the application using local cache first.
 * Does not block on Firebase.
 */
export const bootApplication = async () => {
  try {
    const cached = await getCachedSession();
    
    if (cached && cached.data) {
      return {
        session: cached.data,
        isExpired: cached.isExpired // indicates we MUST run background sync immediately
      };
    }
  } catch (error) {
    console.error('[Startup Engine] Boot error:', error);
  }
  
  return { session: null, isExpired: false };
};

/**
 * Triggers background Firebase validation
 */
export const runBackgroundValidation = (auth, db, appName, onUpdate, onLogout) => {
  // Fire and forget
  console.log('[Startup Engine] Starting silent background validation...');
  startBackgroundValidation(auth, db, appName, onUpdate, onLogout).catch(console.error);
};
