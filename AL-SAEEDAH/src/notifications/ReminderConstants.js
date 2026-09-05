/**
 * Reminder Constants
 *
 * Configuration for the inactivity reminder system (Phase 3).
 * Values are calculated using mathematical operations for readability.
 */

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export const REMINDERS = {
  THREE_DAYS: { delay: 3 * ONE_DAY_MS },
  SEVEN_DAYS: { delay: 7 * ONE_DAY_MS },
  FOURTEEN_DAYS: { delay: 14 * ONE_DAY_MS }
};
