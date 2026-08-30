/**
 * Push Notification Service
 * 
 * Unified entry point for cross-platform (Web + Android) Push Notifications.
 * - Non-blocking initialization.
 * - Handles token retrieval and permission lifecycle.
 * - Delegates to PushTokenManager for offline-first token persistence.
 * - Strict isolation from SyncEngine and local caches.
 */

import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { app } from '../firebase/config';
import * as PushTokenManager from './PushTokenManager';
import * as Logger from './NotificationLogger';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

// Keep track of the current user to avoid duplicate processing
let _currentUserId = null;
let _initialized = false;
let _unsubscribeForeground = null;

/**
 * Initialize the Push Notification architecture.
 * This function is deliberately non-blocking. Any failure will be swallowed
 * to prevent crashing React or affecting Offline-First cache behavior.
 * 
 * @param {string} userId - The currently logged-in user's ID
 */
export async function initialize(userId) {
  if (!userId) return;
  
  _currentUserId = userId;

  try {
    // 1. Always attempt to retry pending offline token syncs first
    await PushTokenManager.retryPendingSync();

    // 2. Initialize platform-specific push architecture
    if (Capacitor.isNativePlatform()) {
      await _initializeAndroid(userId);
    } else {
      await _initializeWeb(userId);
    }
    
    _initialized = true;
    Logger.log('PUSH_INIT', 'PushNotificationService initialized successfully.');
  } catch (err) {
    // Strict isolation: Never crash or block execution on failure
    Logger.error('PushNotificationService.initialize', err);
  }
}

/**
 * Android Push Initialization (Capacitor)
 */
async function _initializeAndroid(userId) {
  try {
    // Request permission (silently checks first)
    const permStatus = await PushNotifications.checkPermissions();
    
    if (permStatus.receive === 'prompt') {
      const requestStatus = await PushNotifications.requestPermissions();
      if (requestStatus.receive !== 'granted') {
        Logger.warn('PUSH_PERMISSION_DENIED', 'Android permission denied.');
        return;
      }
    } else if (permStatus.receive !== 'granted') {
      return;
    }

    // Register listeners before calling register()
    await PushNotifications.removeAllListeners();

    PushNotifications.addListener('registration', async (token) => {
      Logger.log('PUSH_TOKEN_RECEIVED', 'Android Token received.');
      await PushTokenManager.saveToken(userId, token.value, 'android');
    });

    PushNotifications.addListener('registrationError', (error) => {
      Logger.error('PUSH_REGISTRATION_ERROR', error);
    });

    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      Logger.log('PUSH_RECEIVED_FOREGROUND', notification.title);
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      Logger.log('PUSH_ACTION_PERFORMED', notification.actionId);
    });

    // Register for push notifications
    await PushNotifications.register();
  } catch (err) {
    Logger.error('PushNotificationService._initializeAndroid', err);
  }
}

/**
 * Web Push Initialization (Firebase Messaging)
 */
async function _initializeWeb(userId) {
  try {
    if (!('serviceWorker' in navigator) || !('Notification' in window)) {
      Logger.warn('PUSH_NOT_SUPPORTED', 'Web Push not supported in this browser.');
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      Logger.warn('PUSH_PERMISSION_DENIED', 'Web permission denied.');
      return;
    }

    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
    Logger.log('PUSH_SW_REGISTERED', 'Service Worker registered.');

    const messaging = getMessaging(app);

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (token) {
      Logger.log('PUSH_TOKEN_RECEIVED', 'Web Token received.');
      await PushTokenManager.saveToken(userId, token, 'web');
    }

    // Handle foreground messages safely
    if (_unsubscribeForeground) _unsubscribeForeground();
    
    _unsubscribeForeground = onMessage(messaging, (payload) => {
      Logger.log('PUSH_RECEIVED_FOREGROUND', 'Foreground message received', payload);
      // Optional: Dispatch a custom event here if UI needs to react, 
      // but do NOT directly mutate Product caches or EntityStore.
    });

  } catch (err) {
    Logger.error('PushNotificationService._initializeWeb', err);
  }
}

/**
 * Handle user logout by removing the token securely.
 */
export async function handleLogout() {
  if (!_currentUserId) return;
  
  try {
    await PushTokenManager.removeToken(_currentUserId);
    _currentUserId = null;
    _initialized = false;
    
    if (_unsubscribeForeground) {
      _unsubscribeForeground();
      _unsubscribeForeground = null;
    }

    if (Capacitor.isNativePlatform()) {
      await PushNotifications.removeAllListeners();
    }
    
    Logger.log('PUSH_LOGOUT', 'Push notifications cleaned up for logout.');
  } catch (err) {
    Logger.error('PushNotificationService.handleLogout', err);
  }
}
