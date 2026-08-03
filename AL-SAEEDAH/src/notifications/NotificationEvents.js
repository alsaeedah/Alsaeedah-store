/**
 * Notification Events
 *
 * Pre-defined event definitions for all planned notification phases.
 * Each event declares its metadata so future phases only need to call
 * NotificationService.show(event, data) without touching infrastructure.
 *
 * Events are NOT triggered in Phase 1 — they exist to stabilize
 * the API surface and keep it consistent across future phases.
 *
 * Template strings use {{placeholder}} syntax. The NotificationService
 * will replace these with actual values when the event is triggered.
 */

import { CHANNELS, ID_RANGES } from './NotificationConstants';

// ─── Phase 2: Instant Local Notifications ───────────────────────

export const FIRST_LAUNCH = {
  id: ID_RANGES.GENERAL.min,        // 1000
  channel: CHANNELS.GENERAL.id,
  title: 'مرحباً بك في السعيدة! 🎉',
  body: 'اكتشف أحدث الساعات والعروض الحصرية.',
  category: 'GENERAL',
};

export const LOGIN_SUCCESS = {
  id: ID_RANGES.ACCOUNT.min,        // 4000
  channel: CHANNELS.ACCOUNT.id,
  title: 'تم تسجيل الدخول بنجاح ✅',
  body: 'مرحباً {{name}}، أهلاً بعودتك!',
  category: 'ACCOUNT',
};

export const ORDER_SUBMITTED = {
  id: ID_RANGES.ORDERS.min,         // 2000
  channel: CHANNELS.ORDERS.id,
  title: 'تم تأكيد طلبك! 🛒',
  body: 'شكراً لطلبك. سنقوم بمعالجته في أقرب وقت.',
  category: 'ORDERS',
};

export const ORDER_NUMBER = {
  id: ID_RANGES.ORDERS.min + 1,     // 2001
  channel: CHANNELS.ORDERS.id,
  title: 'رقم طلبك: {{orderNumber}}',
  body: 'يمكنك متابعة حالة طلبك من صفحة الطلبات.',
  category: 'ORDERS',
};

// ─── Phase 3: Reminder Notifications ────────────────────────────

export const REMINDER_3_DAY = {
  id: ID_RANGES.REMINDERS.min,      // 3000
  channel: CHANNELS.REMINDERS.id,
  title: 'اشتقنا لك! 👋',
  body: 'تفضل بزيارة المتجر واكتشف الجديد.',
  category: 'REMINDERS',
};

export const REMINDER_7_DAY = {
  id: ID_RANGES.REMINDERS.min + 1,  // 3001
  channel: CHANNELS.REMINDERS.id,
  title: 'عروض جديدة بانتظارك! 🔥',
  body: 'لا تفوت أحدث العروض والتخفيضات.',
  category: 'REMINDERS',
};

export const REMINDER_14_DAY = {
  id: ID_RANGES.REMINDERS.min + 2,  // 3002
  channel: CHANNELS.REMINDERS.id,
  title: 'ساعات مميزة في انتظارك ⌚',
  body: 'تصفح أحدث المنتجات واختر ما يناسبك.',
  category: 'REMINDERS',
};

// ─── Future: System / Promotions ────────────────────────────────

export const WELCOME_BACK = {
  id: ID_RANGES.GENERAL.min + 1,    // 1001
  channel: CHANNELS.GENERAL.id,
  title: 'أهلاً بعودتك! 😊',
  body: 'تفضل بتصفح أحدث المنتجات.',
  category: 'GENERAL',
};

export const SYSTEM_UPDATE = {
  id: ID_RANGES.SYSTEM.min,         // 5000
  channel: CHANNELS.SYSTEM.id,
  title: 'تحديث النظام',
  body: '{{message}}',
  category: 'SYSTEM',
};

// ─── All Events (convenience export) ────────────────────────────

export const EVENTS = {
  FIRST_LAUNCH,
  LOGIN_SUCCESS,
  ORDER_SUBMITTED,
  ORDER_NUMBER,
  REMINDER_3_DAY,
  REMINDER_7_DAY,
  REMINDER_14_DAY,
  WELCOME_BACK,
  SYSTEM_UPDATE,
};
