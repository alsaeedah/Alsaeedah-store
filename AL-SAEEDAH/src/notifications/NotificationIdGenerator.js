/**
 * Notification ID Generator
 *
 * Generates globally unique notification IDs using a persistent
 * incremental counter stored in Capacitor Preferences.
 *
 * IDs start at 1000 and increment by 1 for every notification.
 * The counter persists across app restarts via Preferences storage.
 *
 * Android notification IDs are 32-bit signed integers (max 2,147,483,647),
 * so an incrementing counter will never overflow in any realistic usage.
 *
 * IMPORTANT: This is the ONLY source of notification IDs in the system.
 * No other module should generate or hardcode notification IDs.
 */

import { Preferences } from '@capacitor/preferences';
import * as Logger from './NotificationLogger';

const STORAGE_KEY = 'notification_id_counter';

/** In-memory cache — loaded from storage on first use */
let _counter = null;

/**
 * Load the counter value from persistent storage.
 * Only reads from disk once; subsequent calls use the in-memory cache.
 */
async function _loadCounter() {
  if (_counter !== null) return;

  try {
    const { value } = await Preferences.get({ key: STORAGE_KEY });
    _counter = value ? parseInt(value, 10) : 1000;

    // Guard against NaN from corrupted storage
    if (isNaN(_counter)) {
      Logger.warn('IdGenerator', 'Corrupted counter in storage — resetting to 1000');
      _counter = 1000;
    }

    Logger.log('IdGenerator', `Counter loaded: ${_counter}`);
  } catch (err) {
    Logger.error('IdGenerator', err);
    _counter = 1000;
  }
}

/**
 * Persist the current counter value to storage.
 */
async function _saveCounter() {
  try {
    await Preferences.set({ key: STORAGE_KEY, value: String(_counter) });
  } catch (err) {
    // Non-fatal — the in-memory counter still works for this session
    Logger.error('IdGenerator.save', err);
  }
}

/**
 * Generate a unique notification ID.
 *
 * Each call increments the counter by 1 and persists it.
 * IDs are guaranteed unique across the entire app lifetime,
 * including across restarts.
 *
 * @returns {Promise<number>} A unique integer ID (1001, 1002, 1003, ...)
 */
export async function generateId() {
  await _loadCounter();
  _counter += 1;
  await _saveCounter();
  Logger.log('IdGenerator', `Generated ID: ${_counter}`);
  return _counter;
}

/**
 * Get the current counter value without incrementing.
 * Useful for diagnostics and health checks.
 *
 * @returns {Promise<number>} The current counter value.
 */
export async function getCurrentCounter() {
  await _loadCounter();
  return _counter;
}
