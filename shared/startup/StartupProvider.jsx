import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { bootApplication, runBackgroundValidation, AppStartupState } from './engine';
import { Capacitor } from '@capacitor/core';
import { bootstrapSync } from '../sync/index.js';

const StartupContext = createContext();

export const useStartup = () => useContext(StartupContext);

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
  const isBooting = useRef(false);

  useEffect(() => {
    if (isBooting.current) return;
    isBooting.current = true;

    const boot = async () => {
      setStartupState(AppStartupState.ReadingCache);
      const { session } = await bootApplication();
      
      // Notify app immediately (this resolves the initial AuthContext state instantly)
      if (onSessionResolved) {
        onSessionResolved(session);
      }
      
      setStartupState(AppStartupState.Rendering);
      
      // Hide Splash screen shortly after React has mounted the first frame.
      // Since we resolved session instantly from cache, React can render Home or Login immediately.
      if (Capacitor.isNativePlatform()) {
        setTimeout(async () => {
          try {
            const { SplashScreen } = await import('@capacitor/splash-screen');
            await SplashScreen.hide();
          } catch (error) {
            console.error('[Startup] Failed to hide splash screen:', error);
          }
        }, 50); // Tiny delay to ensure browser paint
      }

      setStartupState(AppStartupState.Synchronizing);
      
      // Run background Firebase check (silent)
      runBackgroundValidation(
        auth, 
        db, 
        appName, 
        (updatedSession) => {
          if (onSessionUpdated) onSessionUpdated(updatedSession);
          // Bootstrap data sync after auth is validated
          try {
            bootstrapSync(db, auth);
          } catch (err) {
            console.error('[Startup] Non-fatal background sync error:', err);
          }
          setStartupState(AppStartupState.Ready);
        },
        () => {
          if (onForceLogout) onForceLogout();
          // Still bootstrap data sync (some data might be public)
          try {
            bootstrapSync(db, auth);
          } catch (err) {
            console.error('[Startup] Non-fatal background sync error:', err);
          }
          setStartupState(AppStartupState.Ready);
        }
      );
    };

    boot();

    let unsubscribeLifecycle;
    import('./LifecycleCoordinator.js').then(({ lifecycleCoordinator }) => {
        unsubscribeLifecycle = lifecycleCoordinator.subscribe(() => {
           runBackgroundValidation(
             auth, 
             db, 
             appName, 
                 (updatedSession) => {
                   if (onSessionUpdated) onSessionUpdated(updatedSession);
                 },
                 () => {
                   if (onForceLogout) onForceLogout();
                 }
               );
        });
    });

    return () => {
        if (unsubscribeLifecycle) unsubscribeLifecycle();
    }
  }, [auth, db, appName, onSessionResolved, onSessionUpdated, onForceLogout]);

  return (
    <StartupContext.Provider value={{ startupState }}>
      {startupState === AppStartupState.Initializing || startupState === AppStartupState.ReadingCache 
        ? null 
        : children}
    </StartupContext.Provider>
  );
};
