/**
 * Notification Storage
 *
 * Abstraction over @capacitor/preferences for persisting notification
 * metadata. All keys are namespaced (see NotificationConstants.STORAGE_KEYS)
 * to avoid collisions with existing app data.
 *
 * Business logic should never import Preferences directly for
 * notification-related data — use this module instead.
 */

import { Preferences } from '@capacitor/preferences';
import { STORAGE_KEYS } from './NotificationConstants';
import * as Logger from './NotificationLogger';

// ─── Generic Accessors ──────────────────────────────────────────

/**
 * Get a stored value by key. Returns parsed JSON or null.
 * @param {string} key - One of STORAGE_KEYS.
 * @returns {Promise<any>}
 */
export async function get(key) {
  try {
    const { value } = await Preferences.get({ key });
    return value ? JSON.parse(value) : null;
  } catch (err) {
    Logger.error('Storage.get', err, { key });
    return null;
  }
}

/**
 * Set a value by key. Automatically stringifies.
 * @param {string} key   - One of STORAGE_KEYS.
 * @param {any}    value - Any JSON-serializable value.
 */
export async function set(key, value) {
  try {
    await Preferences.set({ key, value: JSON.stringify(value) });
  } catch (err) {
    Logger.error('Storage.set', err, { key });
  }
}

/**
 * Remove a stored value by key.
 * @param {string} key
 */
export async function remove(key) {
  try {
    await Preferences.remove({ key });
  } catch (err) {
    Logger.error('Storage.remove', err, { key });
  }
}

// ─── Convenience Accessors ──────────────────────────────────────

/** @returns {Promise<string|null>} 'granted' | 'denied' | 'prompt' | null */
export async function getPermissionStatus() {
  return get(STORAGE_KEYS.PERMISSION_STATUS);
}

/** @param {string} status */
export async function setPermissionStatus(status) {
  return set(STORAGE_KEYS.PERMISSION_STATUS, status);
}

/** @returns {Promise<boolean>} */
export async function isFirstLaunchCompleted() {
  const val = await get(STORAGE_KEYS.FIRST_LAUNCH_COMPLETED);
  return val === true;
}

export async function setFirstLaunchCompleted() {
  return set(STORAGE_KEYS.FIRST_LAUNCH_COMPLETED, true);
}

/** @returns {Promise<number|null>} Unix timestamp */
export async function getLastNotificationTimestamp() {
  return get(STORAGE_KEYS.LAST_NOTIFICATION_TIMESTAMP);
}

/** @param {number} timestamp */
export async function setLastNotificationTimestamp(timestamp) {
  return set(STORAGE_KEYS.LAST_NOTIFICATION_TIMESTAMP, timestamp);
}

/** @returns {Promise<Array|null>} */
export async function getScheduledReminders() {
  return get(STORAGE_KEYS.SCHEDULED_REMINDERS);
}

/** @param {Array} reminders */
export async function setScheduledReminders(reminders) {
  return set(STORAGE_KEYS.SCHEDULED_REMINDERS, reminders);
}
