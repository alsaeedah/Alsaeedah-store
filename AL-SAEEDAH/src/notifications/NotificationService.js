/**
 * Notification Service
 *
 * THE SINGLE ENTRY POINT for the entire notification system.
 *
 * No screen, component, or business logic should import anything
 * from the notifications module except through this service
 * (and the event/constant exports from index.js).
 *
 * Every method is:
 * - A no-op on non-native platforms (web browser)
 * - Wrapped in try/catch — never throws to the caller
 * - Logged for debugging
 *
 * Future phases plug into this same API:
 * - Phase 2: show(event, data) for instant notifications
 * - Phase 3: schedule(event, data, date) for reminders
 * - Phase 4: cancel/update lifecycle management
 * - Phase 5: channels, sounds, deep links
 * - Future:  push notifications route through show() as well
 */

import { Capacitor } from '@capacitor/core';
import * as Channels from './NotificationChannels';
import * as Permissions from './NotificationPermissions';
import * as Scheduler from './NotificationScheduler';
import * as Storage from './NotificationStorage';
import * as Logger from './NotificationLogger';

let _initialized = false;

// ─── Platform Guard ─────────────────────────────────────────────

/**
 * Check if we're running on a native platform (Android).
 * All notification operations are no-ops on web.
 */
function isNative() {
  return Capacitor.isNativePlatform();
}

// ─── Lifecycle ──────────────────────────────────────────────────

/**
 * Initialize the notification infrastructure.
 * Called once during app startup (App.jsx useEffect).
 *
 * This method:
 * 1. Registers all notification channels
 * 2. Checks (NOT requests) current permission status
 * 3. Marks the system as initialized
 *
 * Does NOT block rendering. Does NOT show any permission dialog.
 */
export async function initialize() {
  if (_initialized) {
    Logger.warn('Init', 'Already initialized — skipping');
    return;
  }

  if (!isNative()) {
    Logger.log('Init', 'Non-native platform — notification system disabled');
    _initialized = true;
    return;
  }

  try {
    // Register all channels (idempotent)
    await Channels.registerAll();

    // Check current permission status (read-only, no dialog)
    const permissionStatus = await Permissions.checkPermission();

    _initialized = true;
    Logger.log('Init', `Initialized successfully. Permission: ${permissionStatus}`);
  } catch (err) {
    Logger.error('Init', err);
    // Mark as initialized even on error to prevent retry loops
    _initialized = true;
  }
}

/**
 * Check if the notification system has been initialized.
 * @returns {boolean}
 */
export function isInitialized() {
  return _initialized;
}

// ─── Notifications ──────────────────────────────────────────────

/**
 * Show a notification immediately.
 *
 * @param {Object} event - An event definition from NotificationEvents.
 * @param {Object} [data] - Template replacement data (e.g. { name: 'أحمد' }).
 * @returns {Promise<boolean>} true if successful.
 *
 * @example
 * import { NotificationService } from './notifications';
 * import { LOGIN_SUCCESS } from './notifications/NotificationEvents';
 * await NotificationService.show(LOGIN_SUCCESS, { name: user.displayName });
 */
export async function show(event, data = {}) {
  if (!isNative()) return false;

  try {
    const granted = await Permissions.isPermissionGranted();
    if (!granted) {
      Logger.warn('Show', 'Permission not granted — notification skipped');
      return false;
    }

    return await Scheduler.scheduleImmediate(event, data);
  } catch (err) {
    Logger.error('Show', err);
    return false;
  }
}

/**
 * Schedule a notification for a specific date/time.
 *
 * @param {Object} event - Event definition from NotificationEvents.
 * @param {Object} [data] - Template replacement data.
 * @param {Date}   date  - When to fire the notification.
 * @returns {Promise<boolean>}
 */
export async function schedule(event, data = {}, date) {
  if (!isNative()) return false;

  try {
    const granted = await Permissions.isPermissionGranted();
    if (!granted) {
      Logger.warn('Schedule', 'Permission not granted — schedule skipped');
      return false;
    }

    return await Scheduler.scheduleAt(event, data, date);
  } catch (err) {
    Logger.error('Schedule', err);
    return false;
  }
}

/**
 * Cancel a pending notification by ID.
 * @param {number} notificationId
 * @returns {Promise<boolean>}
 */
export async function cancel(notificationId) {
  if (!isNative()) return false;

  try {
    return await Scheduler.cancel(notificationId);
  } catch (err) {
    Logger.error('Cancel', err);
    return false;
  }
}

/**
 * Cancel all pending notifications.
 * @returns {Promise<boolean>}
 */
export async function cancelAll() {
  if (!isNative()) return false;

  try {
    return await Scheduler.cancelAll();
  } catch (err) {
    Logger.error('CancelAll', err);
    return false;
  }
}

/**
 * Get all pending (scheduled) notifications.
 * @returns {Promise<Array>}
 */
export async function getPending() {
  if (!isNative()) return [];

  try {
    return await Scheduler.getPending();
  } catch (err) {
    Logger.error('GetPending', err);
    return [];
  }
}

// ─── Permissions ────────────────────────────────────────────────

/**
 * Check current permission status without prompting.
 * @returns {Promise<string>} 'granted' | 'denied' | 'prompt'
 */
export async function checkPermission() {
  if (!isNative()) return 'granted'; // No restriction on web

  try {
    return await Permissions.checkPermission();
  } catch (err) {
    Logger.error('CheckPermission', err);
    return 'prompt';
  }
}

/**
 * Request notification permission from the user.
 * Should only be called when the app actually needs to show a notification.
 *
 * NOTE: Not used in Phase 1. Will be called in Phase 2.
 *
 * @returns {Promise<string>} 'granted' | 'denied'
 */
export async function requestPermission() {
  if (!isNative()) return 'granted';

  try {
    return await Permissions.requestPermission();
  } catch (err) {
    Logger.error('RequestPermission', err);
    return 'denied';
  }
}

// ─── Storage ────────────────────────────────────────────────────

/**
 * Get a notification-related value from storage.
 * @param {string} key - One of STORAGE_KEYS from NotificationConstants.
 * @returns {Promise<any>}
 */
export async function getStorage(key) {
  try {
    return await Storage.get(key);
  } catch (err) {
    Logger.error('GetStorage', err, { key });
    return null;
  }
}

/**
 * Set a notification-related value in storage.
 * @param {string} key   - One of STORAGE_KEYS from NotificationConstants.
 * @param {any}    value - JSON-serializable value.
 */
export async function setStorage(key, value) {
  try {
    await Storage.set(key, value);
  } catch (err) {
    Logger.error('SetStorage', err, { key });
  }
}
