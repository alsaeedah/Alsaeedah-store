/**
 * Notification Module — Barrel Exports
 *
 * Clean import surface for the notification system.
 * Business logic should import from here:
 *
 *   import { NotificationService, EVENTS, CHANNELS } from './notifications';
 */

// The single entry point service
export * as NotificationService from './NotificationService';

// Push Notifications
export * as PushNotificationService from './PushNotificationService';
export * as PushTokenManager from './PushTokenManager';

// Event definitions (for use with NotificationService.show(event, data))
export { EVENTS } from './NotificationEvents';
export {
  FIRST_LAUNCH,
  LOGIN_SUCCESS,
  ORDER_SUBMITTED,
  ORDER_NUMBER,
  REMINDER_3_DAY,
  REMINDER_7_DAY,
  REMINDER_14_DAY,
  WELCOME_BACK,
  SYSTEM_UPDATE,
} from './NotificationEvents';

// Constants (for advanced usage)
export { CHANNELS, ID_RANGES, STORAGE_KEYS, TIMING, STATUS, NOTIFICATION_CONFIG } from './NotificationConstants';
export { REMINDERS } from './ReminderConstants';

// Reminder system
export * as ReminderManager from './ReminderManager';
export * as NotificationLifecycleManager from './NotificationLifecycleManager';

// ID Generator (for diagnostics)
export { generateId, getCurrentCounter } from './NotificationIdGenerator';
