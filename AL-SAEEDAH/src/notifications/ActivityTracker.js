/**
 * Activity Tracker
 *
 * Responsible for recording application usage and saving timestamps.
 * Phase 3 uses this to detect inactivity and schedule reminders.
 */

import * as Storage from './NotificationStorage';
import * as Logger from './NotificationLogger';

/**
 * Record the current application usage timestamp.
 * This should be called once per application session/resume.
 *
 * @returns {Promise<boolean>} true if successfully recorded.
 */
export async function recordActivity() {
  try {
    const now = Date.now();
    await Storage.setLastActivity(now);
    Logger.log('ActivityTracker', `Activity recorded at ${new Date(now).toISOString()}`);
    return true;
  } catch (err) {
    Logger.error('ActivityTracker', err);
    return false;
  }
}

/**
 * Get the last recorded application usage timestamp.
 *
 * @returns {Promise<number|null>} Unix timestamp
 */
export async function getLastActivity() {
  try {
    return await Storage.getLastActivity();
  } catch (err) {
    Logger.error('ActivityTracker', err);
    return null;
  }
}
