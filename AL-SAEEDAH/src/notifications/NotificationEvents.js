/**
 * Notification Events
 *
 * Pre-defined event definitions for all notification types.
 * Each event declares its metadata so callers only need:
 *   NotificationService.show(event, data)
 *
 * IMPORTANT — ID Strategy:
 * ─────────────────────────
 * • Immediate notifications (FIRST_LAUNCH, LOGIN_SUCCESS, ORDER_*)
 *   do NOT have static IDs. The NotificationIdGenerator creates a
 *   unique ID for every individual notification.
 *
 * • Scheduled reminders (REMINDER_*) keep fixed IDs because they
 *   are singleton-per-type — Android should replace the old reminder
 *   when rescheduling.
 *
 * Template strings use {{placeholder}} syntax. The NotificationScheduler
 * replaces these with actual values when the event is triggered.
 */

import { CHANNELS, ID_RANGES } from './NotificationConstants';

// ─── Immediate Notifications (unique IDs generated at send time) ─

export const FIRST_LAUNCH = {
  channel: CHANNELS.GENERAL.id,
  title: 'مرحباً بك في السعيدة! 🎉',
  body: 'اكتشف أحدث الساعات والعروض الحصرية.',
  category: 'GENERAL',
};

export const LOGIN_SUCCESS = {
  channel: CHANNELS.ACCOUNT.id,
  title: 'تم تسجيل الدخول بنجاح ✅',
  body: 'مرحباً {{name}}، أهلاً بعودتك!',
  category: 'ACCOUNT',
};

export const ORDER_SUBMITTED = {
  channel: CHANNELS.ORDERS.id,
  title: 'تم تأكيد طلبك! 🛒',
  body: 'شكراً لطلبك. سنقوم بمعالجته في أقرب وقت.',
  category: 'ORDERS',
};

export const ORDER_NUMBER = {
  channel: CHANNELS.ORDERS.id,
  title: 'رقم طلبك: {{orderNumber}}',
  body: 'يمكنك متابعة حالة طلبك من صفحة الطلبات.',
  category: 'ORDERS',
};

// ─── Scheduled Reminders (fixed IDs — singleton per type) ───────

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
  channel: CHANNELS.GENERAL.id,
  title: 'أهلاً بعودتك! 😊',
  body: 'تفضل بتصفح أحدث المنتجات.',
  category: 'GENERAL',
};

export const SYSTEM_UPDATE = {
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
