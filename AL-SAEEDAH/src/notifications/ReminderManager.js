/**
 * Reminder Manager
 *
 * Responsible for managing the inactivity reminder lifecycle.
 * Schedules, cancels, and resets reminder cycles.
 *
 * ActivityTracker has been removed. Reminders are now based on
 * the current timestamp (Date.now()) when the user is active.
 */

import { REMINDERS } from './ReminderConstants';
import { EVENTS } from './NotificationEvents';
import * as NotificationService from './NotificationService';
import * as Storage from './NotificationStorage';
import * as Logger from './NotificationLogger';
import * as LifecycleManager from './NotificationLifecycleManager';

let _initialized = false;

/**
 * Initialize the reminder manager.
 */
export async function initialize() {
  if (_initialized) return;
  _initialized = true;
  Logger.log('ReminderManager', 'Initialized');
}

/**
 * Cancel all existing scheduled reminders.
 * Cleans up the storage state.
 *
 * @returns {Promise<boolean>}
 */
export async function cancelAllReminders() {
  try {
    const all = await LifecycleManager.getAll();
    const activeReminders = all.filter(n => 
      n.category === 'REMINDERS' && 
      (n.status === 'PENDING' || n.status === 'SCHEDULED')
    );
    
    for (const reminder of activeReminders) {
      await NotificationService.cancel(reminder.id);
    }
    
    await Storage.setScheduledReminders([]);
    await Storage.setReminderStatus('CLEARED');
    
    Logger.log('ReminderManager', 'All previous reminders canceled');
    return true;
  } catch (err) {
    Logger.error('ReminderManager', err);
    return false;
  }
}

/**
 * Schedule a new cycle of inactivity reminders.
 *
 * @param {number} baseTimestamp - The time from which delays are calculated
 * @returns {Promise<boolean>}
 */
export async function scheduleAllReminders(baseTimestamp) {
  try {
    const reminderConfig = [
      { type: '3_days', event: EVENTS.REMINDER_3_DAY, delay: REMINDERS.THREE_DAYS.delay },
      { type: '7_days', event: EVENTS.REMINDER_7_DAY, delay: REMINDERS.SEVEN_DAYS.delay },
      { type: '14_days', event: EVENTS.REMINDER_14_DAY, delay: REMINDERS.FOURTEEN_DAYS.delay },
    ];

    const scheduledList = [];

    for (const config of reminderConfig) {
      const scheduledAt = new Date(baseTimestamp + config.delay);
      
      const success = await NotificationService.schedule(config.event, {}, scheduledAt);
      if (success) {
        scheduledList.push({
          type: config.type,
          id: config.event.id,
          scheduledAt: scheduledAt.toISOString()
        });
      }
    }

    await Storage.setScheduledReminders(scheduledList);
    await Storage.setReminderStatus('SCHEDULED');
    
    Logger.log('ReminderManager', `Scheduled ${scheduledList.length} reminders`);
    return true;
  } catch (err) {
    Logger.error('ReminderManager', err);
    return false;
  }
}

/**
 * Reset the reminder schedule cycle.
 * Called whenever the application is opened by an authenticated user,
 * pushing the inactivity timers forward from the current time.
 *
 * @returns {Promise<boolean>}
 */
export async function resetReminderSchedule() {
  try {
    // Use current time as the base (ActivityTracker removed)
    const baseTimestamp = Date.now();
    
    // 1. Cancel existing reminders
    await cancelAllReminders();
    
    // 2. Schedule new reminders based on current time
    await scheduleAllReminders(baseTimestamp);
    
    return true;
  } catch (err) {
    Logger.error('ReminderManager', err);
    return false;
  }
}
