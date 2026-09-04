import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { bootApplication, AppStartupState } from './engine';
import { startBackgroundValidation } from './authSync';
import { Capacitor } from '@capacitor/core';
import { bootstrapSyncOnce } from '../sync/index.js';
import { syncCoordinator } from '../sync/SyncCoordinator.js';

const StartupContext = createContext();

export const useStartup = () => useContext(StartupContext);

/**
 * StartupProvider
 * 
 * THE single authoritative startup orchestrator for the application.
 * 
 * Responsibilities are separated into three clearly bounded areas:
 * 
 *  1. Cold Boot (cache-read only)
 *     Reads the local session cache immediately on mount and resolves the
 *     initial AuthContext state. Does NOT trigger Firebase validation.
 *     The UI can render from local cache without waiting for Firebase.
 * 
 *  2. Auth Listener (owns the full post-auth pipeline)
 *     Registers exactly ONE auth.onAuthStateChanged listener.
 *     - In React StrictMode, the useEffect cleanup unsubscribes the first
 *       listener before the second subscription is created, guaranteeing
 *       exactly one active listener at any time.
 *     - When a valid user is present:
 *         → startBackgroundValidation (single-flight)
 *         → on success: syncCoordinator.markReady() → bootstrapSyncOnce()
 *         → on failure/logout: syncCoordinator.markNotReady()
 *     - When the user is null (logged out):
 *         → syncCoordinator.markNotReady()
 * 
 *  3. Lifecycle/Resume Revalidation
 *     Uses the same startBackgroundValidation single-flight mechanism.
 *     Does NOT create a second startup pipeline.
 *     Does NOT call bootstrapSyncOnce again (protected by its own single-flight).
 */
export const StartupProvider = ({
  children,
  auth,
  db,
  appName,
  onSessionResolved,
  onSessionUpdated,
  onForceLogout
}) => {
  const [startupState, setStartupState] = useState(AppStartupState.Initializing);
  const hasColdBooted = useRef(false);

  // ─────────────────────────────────────────────────────────────────────────
  // Responsibility 1: Cold Boot — read local cache, render immediately
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (hasColdBooted.current) return;
    hasColdBooted.current = true;

    const coldBoot = async () => {
      setStartupState(AppStartupState.ReadingCache);
      const { session } = await bootApplication();

      // Notify AuthContext immediately — allows the app to render
      // from local cache without waiting for Firebase.
      if (onSessionResolved) {
        onSessionResolved(session);
      }

      setStartupState(AppStartupState.Rendering);

      // Hide the splash screen after React has painted the first frame.
      if (Capacitor.isNativePlatform()) {
        setTimeout(async () => {
          try {
            const { SplashScreen } = await import('@capacitor/splash-screen');
            await SplashScreen.hide();
          } catch (error) {
            console.error('[Startup] Failed to hide splash screen:', error);
          }
        }, 50);
      }
    };

    coldBoot().catch(err => {
      console.error('[Startup] Cold boot error:', err);
      // Even if cache read fails, resolve with null so the app renders the login screen.
      if (onSessionResolved) onSessionResolved(null);
      setStartupState(AppStartupState.Rendering);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─────────────────────────────────────────────────────────────────────────
  // Responsibility 2: Auth Listener — single authoritative post-auth pipeline
  //
  // React StrictMode Safety:
  //   StrictMode mounts → calls useEffect → returns cleanup (unsubscribe) →
  //   calls cleanup → calls useEffect again.
  //   Net result: exactly ONE active onAuthStateChanged subscription at any time.
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    console.log('[Startup] Registering auth state listener.');

    const unsubscribeAuth = auth.onAuthStateChanged(async (firebaseUser) => {
      console.log('[AUTH] STATE_CHANGED');
      if (!firebaseUser) {
        // User has logged out or is not authenticated.
        console.log('[Startup] Auth state: no user. Marking sync coordinator as not ready.');
        syncCoordinator.markNotReady();
        if (onForceLogout) onForceLogout();
        setStartupState(AppStartupState.Ready);
        console.log('[STARTUP] READY');
        return;
      }

      // A valid Firebase user exists — run the post-auth pipeline.
      console.log('[Startup] Auth state: user present. Starting background validation.');
      setStartupState(AppStartupState.Synchronizing);

      startBackgroundValidation(
        firebaseUser,
        db,
        appName,
        // onUpdate — Background Validation succeeded
        async (enrichedSession) => {
          console.log('[STARTUP] VALIDATION_COMPLETE');
          if (onSessionUpdated) onSessionUpdated(enrichedSession);

          // Mark coordinator as ready (authenticated session confirmed).
          syncCoordinator.markReady(auth);

          // Bootstrap sync exactly once.
          try {
            await bootstrapSyncOnce(db, auth);
          } catch (err) {
            console.error('[Startup] Bootstrap sync failed (non-fatal):', err.message);
            // Sync failure must never crash or log out the user.
          }

          setStartupState(AppStartupState.Ready);
          console.log('[STARTUP] READY');
        },
        // onLogout — Validation determined user should be logged out.
        () => {
          console.log('[Startup] Background validation forced logout.');
          syncCoordinator.markNotReady();
          if (onForceLogout) onForceLogout();
          setStartupState(AppStartupState.Ready);
          console.log('[STARTUP] READY');
        }
      );
    });

    // Cleanup: unsubscribes the listener when the component unmounts
    // or when this effect re-runs (React StrictMode double-invoke).
    return () => {
      console.log('[Startup] Unsubscribing auth state listener.');
      unsubscribeAuth();
    };
  }, [auth, db, appName, onSessionUpdated, onForceLogout]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─────────────────────────────────────────────────────────────────────────
  // Responsibility 3: Lifecycle/Resume Revalidation
  //
  // Reuses the same startBackgroundValidation single-flight mechanism.
  // If a validation is already in progress, it returns immediately (same Promise).
  // Does NOT call bootstrapSyncOnce again.
  // Does NOT create a second startup pipeline.
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    let unsubscribeLifecycle;

    import('./LifecycleCoordinator.js').then(({ lifecycleCoordinator }) => {
      unsubscribeLifecycle = lifecycleCoordinator.subscribe(async (reason) => {
        const firebaseUser = auth.currentUser;
        if (!firebaseUser) return; // Not authenticated — skip revalidation.

        console.log(`[Startup] Lifecycle event '${reason}' — triggering background revalidation.`);

        startBackgroundValidation(
          firebaseUser,
          db,
          appName,
          (updatedSession) => {
            if (onSessionUpdated) onSessionUpdated(updatedSession);
          },
          () => {
            // Lifecycle-triggered validation forced a logout.
            syncCoordinator.markNotReady();
            if (onForceLogout) onForceLogout();
          }
        );
      });
    }).catch(err => {
      console.error('[Startup] Failed to load LifecycleCoordinator:', err);
    });

    return () => {
      if (unsubscribeLifecycle) unsubscribeLifecycle();
    };
  }, [auth, db, appName, onSessionUpdated, onForceLogout]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <StartupContext.Provider value={{ startupState }}>
      {startupState === AppStartupState.Initializing || startupState === AppStartupState.ReadingCache
        ? null
        : children}
    </StartupContext.Provider>
  );
};
