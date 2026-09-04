import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, initializeAuth, indexedDBLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Capacitor } from '@capacitor/core';

console.log('[AUTH] INIT - Evaluating Firebase configuration...');

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

let app, auth, db;

try {
  // Validate that critical env vars exist
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    throw new Error('Firebase configuration is missing. Check environment variables.');
  }

  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
    // Explicit Auth Initialization for Capacitor Android
    if (Capacitor.isNativePlatform()) {
      auth = initializeAuth(app, {
        persistence: indexedDBLocalPersistence
      });
    } else {
      auth = getAuth(app);
    }
  } else {
    app = getApp();
    auth = getAuth(app);
  }

  db = getFirestore(app);
  
  console.log('[STARTUP] BOOT_START - Firebase initialized successfully.');
} catch (error) {
  console.error('[Startup] FATAL: Firebase initialization failed:', error);
  // We don't throw here to allow main.jsx to catch the error via global handler,
  // or we could throw so it gets caught by the global error handler.
  // We will throw to ensure it is caught by main.jsx's onerror.
  throw error;
}

export { app, auth, db };
