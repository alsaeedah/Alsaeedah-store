/**
 * Notification Lifecycle Manager
 *
 * Central controller for notification state. Manages the lifecycle of
 * notifications, tracks delivery status, and manages cleanup.
 *
 * It does NOT communicate directly with Android APIs, but orchestrates
 * the local state records.
 *
 * ID Strategy:
 * ────────────
 * • Immediate notifications receive a unique generated ID from the caller.
 * • Scheduled reminders use their event's fixed ID (singleton per type).
 * • The duplicate-check race condition is eliminated by the sequential
 *   queue in NotificationService — only one register() call executes at a time.
 */

import * as Storage from './NotificationStorage';
import { STATUS } from './NotificationConstants';
import * as Logger from './NotificationLogger';

/**
 * Register a new notification record.
 *
 * @param {number} id - The notification ID (generated or fixed).
 * @param {Object} event - Notification event definition.
 * @param {Object} [data={}] - Template replacement data.
 * @param {string} status - The notification status (DELIVERED, SCHEDULED, etc.).
 * @param {Date} [scheduledDate] - Date if scheduled.
 * @returns {Promise<boolean>} true if registered successfully.
 */
export async function register(id, event, data = {}, status = STATUS.DELIVERED, scheduledDate = null) {
  try {
    const record = {
      id,
      type: event.category,
      category: event.category || 'GENERAL',
      title: event.title,
      body: event.body,
      status,
      createdAt: new Date().toISOString(),
      scheduledAt: scheduledDate ? scheduledDate.toISOString() : null,
      deliveredAt: status === STATUS.DELIVERED ? new Date().toISOString() : null,
      cancelledAt: null,
      data,
    };

    await Storage.saveNotification(record);
    Logger.log('LIFECYCLE_REGISTERED', `ID: ${id}, Status: ${status}, Category: ${event.category}`);
    return true;
  } catch (err) {
    Logger.error('LifecycleManager.register', err);
    return false;
  }
}

/**
 * Update the status of a specific notification.
 *
 * @param {string|number} id
 * @param {string} status - One of STATUS values.
 */
export async function updateStatus(id, status) {
  try {
    const updateData = { status };
    if (status === STATUS.DELIVERED) updateData.deliveredAt = new Date().toISOString();
    if (status === STATUS.CANCELLED) updateData.cancelledAt = new Date().toISOString();

    await Storage.updateNotification(id, updateData);
    Logger.log('LIFECYCLE_STATUS', `ID: ${id} → ${status}`);
  } catch (err) {
    Logger.error('LifecycleManager.updateStatus', err);
  }
}

/**
 * Convenience method to mark a notification as delivered.
 * @param {string|number} id
 */
export async function markDelivered(id) {
  return updateStatus(id, STATUS.DELIVERED);
}

/**
 * Marks a notification as cancelled in storage.
 * @param {string|number} id
 */
export async function cancel(id) {
  return updateStatus(id, STATUS.CANCELLED);
}

/**
 * Cancel notifications by category (updates state only).
 * @param {string} category
 * @returns {Promise<Array<string|number>>} Array of cancelled IDs.
 */
export async function cancelCategory(category) {
  try {
    const all = await Storage.getNotifications();
    const toCancel = all.filter(n =>
      n.category === category &&
      (n.status === STATUS.PENDING || n.status === STATUS.SCHEDULED)
    );

    for (const n of toCancel) {
      await updateStatus(n.id, STATUS.CANCELLED);
    }
    return toCancel.map(n => n.id);
  } catch (err) {
    Logger.error('LifecycleManager.cancelCategory', err);
    return [];
  }
}

/**
 * Cancel notifications by type (updates state only).
 * @param {string|number} type
 * @returns {Promise<Array<string|number>>} Array of cancelled IDs.
 */
export async function cancelByType(type) {
  try {
    const all = await Storage.getNotifications();
    const toCancel = all.filter(n =>
      n.type === type &&
      (n.status === STATUS.PENDING || n.status === STATUS.SCHEDULED)
    );

    for (const n of toCancel) {
      await updateStatus(n.id, STATUS.CANCELLED);
    }
    return toCancel.map(n => n.id);
  } catch (err) {
    Logger.error('LifecycleManager.cancelByType', err);
    return [];
  }
}

/**
 * Cancel all active notifications (updates state only).
 * @returns {Promise<Array<string|number>>} Array of cancelled IDs.
 */
export async function cancelAll() {
  try {
    const all = await Storage.getNotifications();
    const toCancel = all.filter(n =>
      n.status === STATUS.PENDING || n.status === STATUS.SCHEDULED
    );

    for (const n of toCancel) {
      await updateStatus(n.id, STATUS.CANCELLED);
    }
    return toCancel.map(n => n.id);
  } catch (err) {
    Logger.error('LifecycleManager.cancelAll', err);
    return [];
  }
}

/**
 * Clean up old, expired, or failed notifications.
 * Runs asynchronously without blocking.
 */
export async function cleanup() {
  try {
    const all = await Storage.getNotifications();
    const now = new Date().getTime();
    const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

    const toRemove = all.filter(n => {
      const createdTime = new Date(n.createdAt).getTime();
      const isOld = (now - createdTime) > THIRTY_DAYS;
      return isOld && (n.status === STATUS.CANCELLED || n.status === STATUS.FAILED || n.status === STATUS.EXPIRED);
    });

    for (const n of toRemove) {
      await Storage.removeNotification(n.id);
    }

    if (toRemove.length > 0) {
      Logger.log('LIFECYCLE_CLEANUP', `Removed ${toRemove.length} old notifications`);
    }
  } catch (err) {
    Logger.error('LifecycleManager.cleanup', err);
  }
}

/**
 * Retrieve a specific notification by ID.
 * @param {string|number} id
 * @returns {Promise<Object|null>}
 */
export async function getNotification(id) {
  return Storage.getNotification(id);
}

/**
 * Retrieve all notifications.
 * @returns {Promise<Array>}
 */
export async function getAll() {
  return Storage.getNotifications();
}
