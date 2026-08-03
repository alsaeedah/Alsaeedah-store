/**
 * Notification Permissions
 *
 * Manages the POST_NOTIFICATIONS runtime permission for Android 13+.
 *
 * Phase 1: Only checkPermission() is used during initialization.
 * Phase 2+: requestPermission() will be called before the first
 *           real notification is shown.
 */

import { LocalNotifications } from '@capacitor/local-notifications';
import * as Storage from './NotificationStorage';
import * as Logger from './NotificationLogger';

/**
 * Check current notification permission status without prompting the user.
 * @returns {Promise<string>} 'granted' | 'denied' | 'prompt'
 */
export async function checkPermission() {
  try {
    const result = await LocalNotifications.checkPermissions();
    const status = result?.display ?? 'prompt';
    await Storage.setPermissionStatus(status);
    Logger.log('Permission.check', `Status: ${status}`);
    return status;
  } catch (err) {
    Logger.error('Permission.check', err);
    return 'prompt';
  }
}

/**
 * Request notification permission from the user.
 * Returns the resulting status. Handles all three outcomes:
 * granted, denied, and permanently denied.
 *
 * NOTE: Not called in Phase 1. Will be used in Phase 2
 * before showing the first actual notification.
 *
 * @returns {Promise<string>} 'granted' | 'denied' | 'prompt'
 */
export async function requestPermission() {
  try {
    const result = await LocalNotifications.requestPermissions();
    const status = result?.display ?? 'denied';
    await Storage.setPermissionStatus(status);
    Logger.log('Permission.request', `Result: ${status}`);
    return status;
  } catch (err) {
    Logger.error('Permission.request', err);
    return 'denied';
  }
}

/**
 * Quick boolean check — is permission currently granted?
 * @returns {Promise<boolean>}
 */
export async function isPermissionGranted() {
  const status = await checkPermission();
  return status === 'granted';
}
