/**
 * Notification Constants
 *
 * Centralized configuration for the entire notification system.
 * All notification-related magic values live here — never hardcode
 * channel IDs, notification IDs, storage keys, or timing values
 * inside business logic.
 */

// ─── Notification Channels ──────────────────────────────────────
// Visible in Android Settings → App → Notifications.
// All channels are registered at app startup even if unused.

export const CHANNELS = {
  GENERAL: {
    id: 'general',
    name: 'عام',
    description: 'إشعارات عامة',
    importance: 3, // DEFAULT
  },
  ORDERS: {
    id: 'orders',
    name: 'الطلبات',
    description: 'إشعارات الطلبات والمشتريات',
    importance: 4, // HIGH
  },
  REMINDERS: {
    id: 'reminders',
    name: 'التذكيرات',
    description: 'تذكيرات المتجر',
    importance: 4, // HIGH
  },
  PROMOTIONS: {
    id: 'promotions',
    name: 'العروض',
    description: 'العروض والتخفيضات',
    importance: 2, // LOW
  },
  ACCOUNT: {
    id: 'account',
    name: 'الحساب',
    description: 'إشعارات الحساب وتسجيل الدخول',
    importance: 4, // HIGH
  },
  SYSTEM: {
    id: 'system',
    name: 'النظام',
    description: 'إشعارات النظام',
    importance: 2, // LOW
  },
};

// ─── Notification ID Ranges ─────────────────────────────────────
// Each category gets a reserved 1000-ID block to prevent collisions.

export const ID_RANGES = {
  GENERAL:    { min: 1000, max: 1999 },
  ORDERS:     { min: 2000, max: 2999 },
  REMINDERS:  { min: 3000, max: 3999 },
  ACCOUNT:    { min: 4000, max: 4999 },
  SYSTEM:     { min: 5000, max: 5999 },
};

// ─── Storage Keys ───────────────────────────────────────────────
// All keys are prefixed with `notification_` to avoid collision
// with existing Preferences/localStorage data.

export const STORAGE_KEYS = {
  PERMISSION_STATUS: 'notification_permission_status',
  FIRST_LAUNCH_COMPLETED: 'notification_first_launch_completed',
  LAST_NOTIFICATION_TIMESTAMP: 'notification_last_timestamp',
  SCHEDULED_REMINDERS: 'notification_scheduled_reminders',
  INITIALIZED: 'notification_initialized',
  LAST_ACTIVITY: 'notification_last_activity',
  REMINDER_STATUS: 'notification_reminder_status',
  NOTIFICATIONS: 'notification_history',
};

// ─── Lifecycle States ───────────────────────────────────────────

export const STATUS = {
  PENDING: 'PENDING',
  SCHEDULED: 'SCHEDULED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
  FAILED: 'FAILED',
  EXPIRED: 'EXPIRED',
};

export const LIFECYCLE_CONFIG = {
  MAX_STORED_RECORDS: 100,
};

// ─── Default Timing (milliseconds) ─────────────────────────────

export const TIMING = {
  REMINDER_3_DAYS:  3 * 24 * 60 * 60 * 1000,
  REMINDER_7_DAYS:  7 * 24 * 60 * 60 * 1000,
  REMINDER_14_DAYS: 14 * 24 * 60 * 60 * 1000,
};
