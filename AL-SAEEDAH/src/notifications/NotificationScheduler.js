/**
 * Notification Scheduler
 *
 * Wraps @capacitor/local-notifications scheduling API.
 *
 * For immediate notifications (show):
 *   Uses NotificationIdGenerator to produce unique IDs.
 *   Returns { id, success } so the caller can track the generated ID.
 *
 * For scheduled notifications (reminders):
 *   Uses the event's fixed ID (intentional — reminders are singleton-per-type).
 */

import { LocalNotifications } from '@capacitor/local-notifications';
import { CHANNELS } from './NotificationConstants';
import { generateId } from './NotificationIdGenerator';
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
 * Show a notification immediately with a unique generated ID.
 *
 * @param {Object} event - An event definition from NotificationEvents.
 * @param {Object} [data] - Template replacement data.
 * @returns {Promise<{id: number, success: boolean}>}
 */
export async function scheduleImmediate(event, data = {}) {
  try {
    const id = await generateId();

    const notification = {
      id,
      title: applyTemplate(event.title, data),
      body: applyTemplate(event.body, data),
      channelId: event.channel || CHANNELS.GENERAL.id,
      extra: data,
    };

    await LocalNotifications.schedule({ notifications: [notification] });
    Logger.log('Scheduler.IMMEDIATE', `ID: ${id}`, notification.title);
    return { id, success: true };
  } catch (err) {
    Logger.error('Scheduler.immediate', err);
    return { id: null, success: false };
  }
}

/**
 * Schedule a notification for a specific date/time.
 * Uses the event's fixed ID (reminders are singleton-per-type).
 *
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
    Logger.log('Scheduler.AT', `ID: ${notification.id}, Date: ${date.toISOString()}`);
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
    Logger.log('Scheduler.CANCEL', `ID: ${notificationId}`);
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
    Logger.log('Scheduler.CANCEL_ALL', `Cancelled ${pending.notifications.length} notifications`);
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
