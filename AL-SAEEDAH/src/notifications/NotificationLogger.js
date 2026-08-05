/**
 * Notification Logger
 *
 * Structured logging for the notification system.
 * Every message includes an ISO timestamp and is prefixed with
 * [NotificationService] for easy filtering via `adb logcat`.
 *
 * Supports both simple string args (backward compatible) and
 * structured data objects for richer diagnostics.
 */

const TAG = '[NotificationService]';

/**
 * Log an informational message with structured data.
 * @param {string} action - Short action label (e.g. 'INIT', 'DELIVERED', 'QUEUED').
 * @param  {...any} args  - Additional data to log (strings or objects).
 */
export function log(action, ...args) {
  console.log(`${TAG} ${action}`, _formatTimestamp(), ...args);
}

/**
 * Log a warning with structured data.
 * @param {string} action - Short action label.
 * @param  {...any} args  - Additional data to log.
 */
export function warn(action, ...args) {
  console.warn(`${TAG} ${action}`, _formatTimestamp(), ...args);
}

/**
 * Log an error with optional context.
 * @param {string} action  - Short action label.
 * @param {Error|string} error - The error or message.
 * @param  {...any} args   - Additional context.
 */
export function error(action, error, ...args) {
  console.error(`${TAG} ${action}`, _formatTimestamp(), error, ...args);
}

/**
 * Generate an ISO timestamp string for log correlation.
 * @returns {string}
 */
function _formatTimestamp() {
  return `[${new Date().toISOString()}]`;
}
