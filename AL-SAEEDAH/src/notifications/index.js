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
export { CHANNELS, ID_RANGES, STORAGE_KEYS, TIMING } from './NotificationConstants';
export { REMINDERS } from './ReminderConstants';

// Phase 3 Modules
export * as ActivityTracker from './ActivityTracker';
export * as ReminderManager from './ReminderManager';
