/**
 * Notification Service
 *
 * THE SINGLE ENTRY POINT for the entire notification system.
 *
 * No screen, component, or business logic should import anything
 * from the notifications module except through this service
 * (and the event/constant exports from index.js).
 *
 * Architecture:
 * ─────────────
 * • Persistent unique ID generation (NotificationIdGenerator)
 * • Sequential FIFO queue with configurable delay
 * • Retry mechanism (1 retry on failure)
 * • 500ms deduplication window
 * • Pre-send permission verification
 * • Self-healing health check (on resume + periodic)
 * • Merged notification-tap navigation callback
 * • Single listener registration with guard
 * • Structured lifecycle logging
 *
 * Every method is:
 * - A no-op on non-native platforms (web browser)
 * - Wrapped in try/catch — never throws to the caller
 * - Logged for debugging
 */

import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { LocalNotifications } from '@capacitor/local-notifications';
import * as Channels from './NotificationChannels';
import * as Permissions from './NotificationPermissions';
import * as Scheduler from './NotificationScheduler';
import * as Storage from './NotificationStorage';
import * as Logger from './NotificationLogger';
import * as LifecycleManager from './NotificationLifecycleManager';
import { STATUS, NOTIFICATION_CONFIG } from './NotificationConstants';

// ─── Module State ───────────────────────────────────────────────

let _initialized = false;
let _permissionRequested = false;
let _listenersRegistered = false;
let _healthCheckTimer = null;
let _appStateListener = null;
let _notificationReceivedListener = null;
let _notificationActionListener = null;
let _onNotificationTap = null;

// ─── Queue State ────────────────────────────────────────────────

let _queue = [];
let _processing = false;

// ─── Deduplication State ────────────────────────────────────────

/** Map of "eventKey:dataHash" → timestamp for dedup window */
const _recentEvents = new Map();

// ─── Platform Guard ─────────────────────────────────────────────

function isNative() {
  return Capacitor.isNativePlatform();
}

// ─── Lifecycle ──────────────────────────────────────────────────

/**
 * Initialize the notification infrastructure.
 * Called once during app startup (App.jsx useEffect).
 *
 * @param {Object} [options]
 * @param {Function} [options.onNotificationTap] - Callback when user taps a notification.
 *   Receives the notification's `extra` data object.
 */
export async function initialize(options = {}) {
  if (_initialized) {
    Logger.warn('INIT', 'Already initialized — skipping');
    return;
  }

  if (!isNative()) {
    Logger.log('INIT', 'Non-native platform — notification system disabled');
    _initialized = true;
    return;
  }

  // Store navigation callback
  if (options.onNotificationTap) {
    _onNotificationTap = options.onNotificationTap;
  }

  try {
    // 1. Register / verify all channels
    await Channels.registerAll();

    // 2. Check current permission status (read-only, no dialog)
    const permissionStatus = await Permissions.checkPermission();

    // 3. Register notification listeners (once)
    _registerListeners();

    // 4. Start app state listener for resume recovery
    _registerAppStateListener();

    // 5. Start periodic health check
    _startHealthCheckTimer();

    // 6. Run async cleanup without blocking
    LifecycleManager.cleanup().catch(err => Logger.error('INIT.cleanup', err));

    _initialized = true;
    Logger.log('INITIALIZED', `Permission: ${permissionStatus}`);
  } catch (err) {
    Logger.error('INIT', err);
    // Mark as initialized even on error to prevent retry loops
    _initialized = true;
  }
}

/**
 * Check if the notification system has been initialized.
 * @returns {boolean}
 */
export function isInitialized() {
  return _initialized;
}

// ─── Permission Helper ──────────────────────────────────────────

/**
 * Ensure notification permission is granted.
 * Always checks current status. Only prompts user once per session.
 *
 * @returns {Promise<boolean>} true if permission is granted.
 */
export async function ensurePermission() {
  if (!isNative()) return true;

  try {
    // Always check current status (user may have revoked in Settings)
    const currentStatus = await Permissions.checkPermission();
    if (currentStatus === 'granted') return true;

    // Only prompt user once per app session to avoid annoyance
    if (_permissionRequested) {
      Logger.warn('PERMISSION_DENIED', 'Already requested this session — skipping');
      return false;
    }

    _permissionRequested = true;
    const result = await Permissions.requestPermission();
    const granted = result === 'granted';

    if (granted) {
      Logger.log('PERMISSION_GRANTED', 'User accepted permission request');
    } else {
      Logger.warn('PERMISSION_DENIED', `User declined: ${result}`);
    }

    return granted;
  } catch (err) {
    Logger.error('EnsurePermission', err);
    return false;
  }
}

// ─── Deduplication ──────────────────────────────────────────────

/**
 * Check if an event+data combination was recently fired.
 * Returns true if this is a duplicate that should be skipped.
 *
 * @param {Object} event
 * @param {Object} data
 * @returns {boolean}
 */
function _isDuplicate(event, data) {
  const key = `${event.category}:${event.title}:${JSON.stringify(data)}`;
  const now = Date.now();
  const lastFired = _recentEvents.get(key);

  if (lastFired && (now - lastFired) < NOTIFICATION_CONFIG.DEDUP_WINDOW_MS) {
    Logger.warn('DEDUP_BLOCKED', `Duplicate suppressed for ${event.category}`, { key, elapsed: now - lastFired });
    return true;
  }

  // Record this event
  _recentEvents.set(key, now);

  // Cleanup old entries to prevent memory leak
  if (_recentEvents.size > 50) {
    for (const [k, ts] of _recentEvents) {
      if (now - ts > NOTIFICATION_CONFIG.DEDUP_WINDOW_MS * 2) {
        _recentEvents.delete(k);
      }
    }
  }

  return false;
}

// ─── Notification Queue ─────────────────────────────────────────

/**
 * Enqueue a notification for sequential delivery.
 * Returns a promise that resolves when the notification is delivered.
 *
 * @param {Object} event
 * @param {Object} data
 * @returns {Promise<boolean>}
 */
function _enqueue(event, data) {
  return new Promise((resolve) => {
    _queue.push({ event, data, resolve });
    Logger.log('QUEUED', `${event.category}`, { queueLength: _queue.length });
    _processNext();
  });
}

/**
 * Process the next notification in the queue.
 * Only one notification is processed at a time.
 * Implements retry on failure.
 */
async function _processNext() {
  if (_processing || _queue.length === 0) return;
  _processing = true;

  const { event, data, resolve } = _queue.shift();

  try {
    // Pre-send permission check
    const granted = await ensurePermission();
    if (!granted) {
      Logger.warn('SKIPPED', `Permission denied for ${event.category}`);
      resolve(false);
      _scheduleNext();
      return;
    }

    // Attempt delivery
    let success = await _deliverNotification(event, data);

    // Retry once on failure
    if (!success && NOTIFICATION_CONFIG.MAX_RETRIES > 0) {
      Logger.warn('RETRY', `Retrying ${event.category} after ${NOTIFICATION_CONFIG.RETRY_DELAY_MS}ms`);
      await _delay(NOTIFICATION_CONFIG.RETRY_DELAY_MS);
      success = await _deliverNotification(event, data);
    }

    if (success) {
      Logger.log('DELIVERED', `${event.category}`, { title: event.title });
    } else {
      Logger.error('FAILED', `${event.category} — all retries exhausted`);
    }

    resolve(success);
  } catch (err) {
    Logger.error('QUEUE_ERROR', err);
    resolve(false);
  }

  _scheduleNext();
}

/**
 * Schedule the next queue item with a configurable delay.
 */
function _scheduleNext() {
  if (_queue.length > 0) {
    setTimeout(() => {
      _processing = false;
      _processNext();
    }, NOTIFICATION_CONFIG.QUEUE_DELAY_MS);
  } else {
    _processing = false;
  }
}

/**
 * Deliver a single notification via the Scheduler.
 *
 * @param {Object} event
 * @param {Object} data
 * @returns {Promise<boolean>}
 */
async function _deliverNotification(event, data) {
  try {
    const { id, success } = await Scheduler.scheduleImmediate(event, data);

    if (success && id != null) {
      await LifecycleManager.register(id, event, data, STATUS.DELIVERED);
      await Storage.setLastNotificationTimestamp(Date.now());
    }

    return success;
  } catch (err) {
    Logger.error('Deliver', err);
    return false;
  }
}

/**
 * Utility: wait for N milliseconds.
 * @param {number} ms
 * @returns {Promise<void>}
 */
function _delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── Public API — Notifications ─────────────────────────────────

/**
 * Show a notification immediately (queued).
 * Automatically checks permission, deduplicates, and retries.
 *
 * @param {Object} event - An event definition from NotificationEvents.
 * @param {Object} [data] - Template replacement data (e.g. { name: 'أحمد' }).
 * @returns {Promise<boolean>} true if delivered successfully.
 *
 * @example
 * import { NotificationService, EVENTS } from './notifications';
 * NotificationService.show(EVENTS.LOGIN_SUCCESS, { name: phone });
 */
export async function show(event, data = {}) {
  if (!isNative()) return false;

  try {
    // Dedup check
    if (_isDuplicate(event, data)) return false;

    return await _enqueue(event, data);
  } catch (err) {
    Logger.error('Show', err);
    return false;
  }
}

/**
 * Schedule a notification for a specific date/time.
 * Reminders use fixed IDs by design (to replace previous reminders).
 *
 * @param {Object} event - Event definition from NotificationEvents.
 * @param {Object} [data] - Template replacement data.
 * @param {Date}   date  - When to fire the notification.
 * @returns {Promise<boolean>}
 */
export async function schedule(event, data = {}, date) {
  if (!isNative()) return false;

  try {
    const status = await checkPermission();
    if (status !== 'granted') {
      Logger.warn('Schedule', 'Permission not granted — schedule skipped silently');
      return false;
    }

    // Reminders use their own fixed IDs (intentional — singleton per type)
    const success = await Scheduler.scheduleAt(event, data, date);

    if (success) {
      await LifecycleManager.register(event.id, event, data, STATUS.SCHEDULED);
    }

    return success;
  } catch (err) {
    Logger.error('Schedule', err);
    return false;
  }
}

/**
 * Cancel a pending notification by ID.
 * @param {number} notificationId
 * @returns {Promise<boolean>}
 */
export async function cancel(notificationId) {
  if (!isNative()) return false;

  try {
    const success = await Scheduler.cancel(notificationId);
    if (success) {
      await LifecycleManager.cancel(notificationId);
    }
    return success;
  } catch (err) {
    Logger.error('Cancel', err);
    return false;
  }
}

/**
 * Cancel all pending notifications.
 * @returns {Promise<boolean>}
 */
export async function cancelAll() {
  if (!isNative()) return false;

  try {
    const success = await Scheduler.cancelAll();
    if (success) {
      await LifecycleManager.cancelAll();
    }
    return success;
  } catch (err) {
    Logger.error('CancelAll', err);
    return false;
  }
}

/**
 * Get all pending (scheduled) notifications.
 * @returns {Promise<Array>}
 */
export async function getPending() {
  if (!isNative()) return [];

  try {
    return await Scheduler.getPending();
  } catch (err) {
    Logger.error('GetPending', err);
    return [];
  }
}

// ─── Permissions ────────────────────────────────────────────────

/**
 * Check current permission status without prompting.
 * @returns {Promise<string>} 'granted' | 'denied' | 'prompt'
 */
export async function checkPermission() {
  if (!isNative()) return 'granted';

  try {
    return await Permissions.checkPermission();
  } catch (err) {
    Logger.error('CheckPermission', err);
    return 'prompt';
  }
}

/**
 * Request notification permission from the user.
 * @returns {Promise<string>} 'granted' | 'denied'
 */
export async function requestPermission() {
  if (!isNative()) return 'granted';

  try {
    return await Permissions.requestPermission();
  } catch (err) {
    Logger.error('RequestPermission', err);
    return 'denied';
  }
}

// ─── Storage ────────────────────────────────────────────────────

export async function getStorage(key) {
  try {
    return await Storage.get(key);
  } catch (err) {
    Logger.error('GetStorage', err, { key });
    return null;
  }
}

export async function setStorage(key, value) {
  try {
    await Storage.set(key, value);
  } catch (err) {
    Logger.error('SetStorage', err, { key });
  }
}

// ─── Listener Registration ──────────────────────────────────────

/**
 * Register notification event listeners ONCE.
 * Guard prevents duplicate listener registration.
 */
function _registerListeners() {
  if (_listenersRegistered) {
    Logger.warn('Listeners', 'Already registered — skipping');
    return;
  }

  try {
    // Notification received (while app is in foreground)
    _notificationReceivedListener = LocalNotifications.addListener(
      'localNotificationReceived',
      (notification) => {
        Logger.log('RECEIVED', `ID: ${notification.id}`, notification.title);
      }
    );

    // Notification tapped (user interacted)
    _notificationActionListener = LocalNotifications.addListener(
      'localNotificationActionPerformed',
      (payload) => {
        const notification = payload.notification;
        const data = notification.extra || notification.data || {};
        Logger.log('ACTION_PERFORMED', `ID: ${notification.id}`, data);

        // Invoke navigation callback if provided
        if (_onNotificationTap && data.target) {
          try {
            _onNotificationTap(data);
          } catch (err) {
            Logger.error('OnNotificationTap', err);
          }
        }
      }
    );

    _listenersRegistered = true;
    Logger.log('LISTENERS_REGISTERED', 'Notification listeners attached');
  } catch (err) {
    Logger.error('RegisterListeners', err);
  }
}

// ─── App State Listener ─────────────────────────────────────────

/**
 * Register a single appStateChange listener for resume recovery.
 */
function _registerAppStateListener() {
  if (_appStateListener) return;

  try {
    _appStateListener = CapApp.addListener('appStateChange', async ({ isActive }) => {
      if (isActive) {
        Logger.log('APP_RESUMED', `Initialized: ${_initialized}`);
        // Reset permission prompt flag so we can re-ask if revoked
        _permissionRequested = false;
        await healthCheck();
      }
    });

    Logger.log('APP_STATE_LISTENER', 'Registered');
  } catch (err) {
    Logger.error('AppStateListener', err);
  }
}

// ─── Self-Healing Health Check ──────────────────────────────────

/**
 * Start the periodic health check timer.
 */
function _startHealthCheckTimer() {
  if (_healthCheckTimer) return;

  _healthCheckTimer = setInterval(async () => {
    try {
      await healthCheck();
    } catch (err) {
      Logger.error('HealthCheck.periodic', err);
    }
  }, NOTIFICATION_CONFIG.HEALTH_CHECK_INTERVAL_MS);

  Logger.log('HEALTH_CHECK_TIMER', `Started — interval: ${NOTIFICATION_CONFIG.HEALTH_CHECK_INTERVAL_MS}ms`);
}

/**
 * Self-healing health check.
 * Verifies and auto-repairs: permissions, channels, listeners, queue state.
 *
 * Runs on:
 * - App resume (appStateChange → isActive)
 * - Periodic timer (every HEALTH_CHECK_INTERVAL_MS)
 *
 * @returns {Promise<Object>} Health check results.
 */
export async function healthCheck() {
  if (!isNative()) return { status: 'skipped', reason: 'non-native' };

  const results = {
    timestamp: new Date().toISOString(),
    initialized: _initialized,
    listenersRegistered: _listenersRegistered,
    permissionStatus: null,
    channelsVerified: false,
    queueLength: _queue.length,
    processing: _processing,
    repairsPerformed: [],
  };

  try {
    // 1. Check initialization
    if (!_initialized) {
      Logger.warn('HEALTH_CHECK', 'Service not initialized — reinitializing');
      await initialize({ onNotificationTap: _onNotificationTap });
      results.repairsPerformed.push('reinitialized');
    }

    // 2. Check permissions
    results.permissionStatus = await Permissions.checkPermission();

    // 3. Verify channels (idempotent — creates missing ones)
    await Channels.verifyChannels();
    results.channelsVerified = true;

    // 4. Check listeners
    if (!_listenersRegistered) {
      _registerListeners();
      results.repairsPerformed.push('listeners_reregistered');
    }

    // 5. Check queue health — unstick if stuck
    if (_processing && _queue.length === 0) {
      _processing = false;
      results.repairsPerformed.push('queue_unstuck');
    }

    Logger.log('HEALTH_CHECK', results.repairsPerformed.length > 0 ? 'Repairs performed' : 'All healthy', results);
  } catch (err) {
    Logger.error('HEALTH_CHECK', err);
    results.error = err.message;
  }

  return results;
}

// ─── Destroy (Cleanup) ─────────────────────────────────────────

/**
 * Destroy the notification service.
 * Removes all listeners and timers. Called in useEffect cleanup.
 */
export function destroy() {
  // Stop health check timer
  if (_healthCheckTimer) {
    clearInterval(_healthCheckTimer);
    _healthCheckTimer = null;
  }

  // Remove app state listener
  if (_appStateListener) {
    _appStateListener.then?.(l => l?.remove?.());
    _appStateListener = null;
  }

  // Remove notification listeners
  if (_notificationReceivedListener) {
    _notificationReceivedListener.then?.(l => l?.remove?.());
    _notificationReceivedListener = null;
  }
  if (_notificationActionListener) {
    _notificationActionListener.then?.(l => l?.remove?.());
    _notificationActionListener = null;
  }

  // Reset state
  _initialized = false;
  _listenersRegistered = false;
  _permissionRequested = false;
  _processing = false;
  _queue = [];
  _recentEvents.clear();
  _onNotificationTap = null;

  Logger.log('DESTROYED', 'Service fully cleaned up');
}
