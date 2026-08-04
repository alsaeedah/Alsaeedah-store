/**
 * Notification Scheduler
 *
 * Minimal scheduling infrastructure. Wraps @capacitor/local-notifications
 * scheduling API with a clean interface.
 *
 * Phase 1: API surface is defined but no schedules are created.
 * Phase 2: scheduleImmediate() will be used for instant notifications.
 * Phase 3: scheduleAt() will be used for reminder notifications.
 * Phase 4: cancel/update logic will be extended.
 */

import { LocalNotifications } from '@capacitor/local-notifications';
import { CHANNELS } from './NotificationConstants';
import * as Logger from './NotificationLogger';

/**
 * Replace {{placeholder}} tokens in a string with values from data.
 * @param {string} template
 * @param {Object} data
 * @returns {string}
 */
function applyTemplate(template, data) {
  if (!template || !data) return template || '';
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return data[key] !== undefined ? String(data[key]) : `{{${key}}}`;
  });
}

/**
 * Show a notification immediately.
 * @param {Object} event - An event definition from NotificationEvents.
 * @param {Object} [data] - Template replacement data (e.g. { name: 'أحمد' }).
 * @returns {Promise<boolean>} true if scheduled successfully.
 */
export async function scheduleImmediate(event, data = {}) {
  try {
    const notification = {
      id: event.id,
      title: applyTemplate(event.title, data),
      body: applyTemplate(event.body, data),
      channelId: event.channel || CHANNELS.GENERAL.id,
      extra: data,
    };

    await LocalNotifications.schedule({ notifications: [notification] });
    Logger.log('Scheduler.immediate', `ID: ${notification.id}`, notification.title);
    return true;
  } catch (err) {
    Logger.error('Scheduler.immediate', err);
    return false;
  }
}

/**
 * Schedule a notification for a specific date/time.
 * @param {Object} event - Event definition from NotificationEvents.
 * @param {Object} [data] - Template replacement data.
 * @param {Date}   date  - When to fire.
 * @returns {Promise<boolean>}
 */
export async function scheduleAt(event, data = {}, date) {
  try {
    const notification = {
      id: event.id,
      title: applyTemplate(event.title, data),
      body: applyTemplate(event.body, data),
      channelId: event.channel || CHANNELS.GENERAL.id,
      schedule: { at: date },
      extra: data,
    };

    await LocalNotifications.schedule({ notifications: [notification] });
    Logger.log('Scheduler.at', `ID: ${notification.id}, Date: ${date.toISOString()}`);
    return true;
  } catch (err) {
    Logger.error('Scheduler.at', err);
    return false;
  }
}

/**
 * Cancel a single pending notification by ID.
 * @param {number} notificationId
 * @returns {Promise<boolean>}
 */
export async function cancel(notificationId) {
  try {
    await LocalNotifications.cancel({ notifications: [{ id: notificationId }] });
    Logger.log('Scheduler.cancel', `ID: ${notificationId}`);
    return true;
  } catch (err) {
    Logger.error('Scheduler.cancel', err);
    return false;
  }
}

/**
 * Cancel all pending notifications.
 * @returns {Promise<boolean>}
 */
export async function cancelAll() {
  try {
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({ notifications: pending.notifications });
    }
    Logger.log('Scheduler.cancelAll', `Cancelled ${pending.notifications.length} notifications`);
    return true;
  } catch (err) {
    Logger.error('Scheduler.cancelAll', err);
    return false;
  }
}

/**
 * Get all pending (scheduled) notifications.
 * @returns {Promise<Array>}
 */
export async function getPending() {
  try {
    const result = await LocalNotifications.getPending();
    return result.notifications || [];
  } catch (err) {
    Logger.error('Scheduler.getPending', err);
    return [];
  }
}
