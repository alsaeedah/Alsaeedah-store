/**
 * Notification Logger
 *
 * Thin wrapper around console.* that prefixes every message with
 * [Notifications] and an action tag. Follows the same convention
 * as the rest of the project (e.g. [Startup] tags in main.jsx).
 */

const TAG = '[Notifications]';

/**
 * Log an informational message.
 * @param {string} action - Short action label (e.g. 'Init', 'Channel').
 * @param  {...any} args  - Additional data to log.
 */
export function log(action, ...args) {
  console.log(`${TAG} [${action}]`, ...args);
}

/**
 * Log a warning.
 * @param {string} action - Short action label.
 * @param  {...any} args  - Additional data to log.
 */
export function warn(action, ...args) {
  console.warn(`${TAG} [${action}]`, ...args);
}

/**
 * Log an error with optional context.
 * @param {string} action  - Short action label.
 * @param {Error|string} error - The error or message.
 * @param  {...any} args   - Additional context.
 */
export function error(action, error, ...args) {
  console.error(`${TAG} [${action}]`, error, ...args);
}
