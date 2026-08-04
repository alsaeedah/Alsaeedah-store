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

/** @returns {Promise<number|null>} Unix timestamp */
export async function getLastActivity() {
  return get(STORAGE_KEYS.LAST_ACTIVITY);
}

/** @param {number} timestamp */
export async function setLastActivity(timestamp) {
  return set(STORAGE_KEYS.LAST_ACTIVITY, timestamp);
}

/** @returns {Promise<string|null>} */
export async function getReminderStatus() {
  return get(STORAGE_KEYS.REMINDER_STATUS);
}

/** @param {string} status */
export async function setReminderStatus(status) {
  return set(STORAGE_KEYS.REMINDER_STATUS, status);
}

// ─── Notification Lifecycle Storage ─────────────────────────────

/** @returns {Promise<Array>} */
export async function getNotifications() {
  const data = await get(STORAGE_KEYS.NOTIFICATIONS);
  return Array.isArray(data) ? data : [];
}

/** @param {Array} notifications */
async function _setNotifications(notifications) {
  return set(STORAGE_KEYS.NOTIFICATIONS, notifications);
}

/** 
 * Save a new notification record.
 * Enforces LIFECYCLE_CONFIG.MAX_STORED_RECORDS by shifting old records.
 * @param {Object} notification 
 */
export async function saveNotification(notification) {
  try {
    const list = await getNotifications();
    list.push(notification);
    
    // Enforce max records
    const { LIFECYCLE_CONFIG } = await import('./NotificationConstants');
    if (list.length > LIFECYCLE_CONFIG.MAX_STORED_RECORDS) {
      list.splice(0, list.length - LIFECYCLE_CONFIG.MAX_STORED_RECORDS);
    }
    
    await _setNotifications(list);
  } catch (err) {
    Logger.error('Storage.saveNotification', err);
  }
}

/** 
 * Get a specific notification record by ID.
 * @param {number|string} id 
 * @returns {Promise<Object|null>}
 */
export async function getNotification(id) {
  try {
    const list = await getNotifications();
    return list.find(n => String(n.id) === String(id)) || null;
  } catch (err) {
    Logger.error('Storage.getNotification', err);
    return null;
  }
}

/**
 * Update an existing notification record.
 * @param {number|string} id 
 * @param {Object} data - Partial data to merge
 */
export async function updateNotification(id, data) {
  try {
    const list = await getNotifications();
    const index = list.findIndex(n => String(n.id) === String(id));
    if (index !== -1) {
      list[index] = { ...list[index], ...data };
      await _setNotifications(list);
    }
  } catch (err) {
    Logger.error('Storage.updateNotification', err);
  }
}

/**
 * Remove a specific notification record.
 * @param {number|string} id 
 */
export async function removeNotification(id) {
  try {
    const list = await getNotifications();
    const filtered = list.filter(n => String(n.id) !== String(id));
    await _setNotifications(filtered);
  } catch (err) {
    Logger.error('Storage.removeNotification', err);
  }
}
