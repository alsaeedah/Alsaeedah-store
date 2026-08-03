/**
 * Notification Channels
 *
 * Registers Android notification channels. Channels are visible to the
 * user in Android Settings → App → Notifications and cannot be modified
 * after creation (only deleted and re-created).
 *
 * All channels are registered at startup even if unused — this is the
 * Android-recommended pattern.
 *
 * Channel creation is idempotent: calling registerAll() multiple times
 * is safe. On web/non-native platforms this is a no-op.
 */

import { LocalNotifications } from '@capacitor/local-notifications';
import { CHANNELS } from './NotificationConstants';
import * as Logger from './NotificationLogger';

/**
 * Register all notification channels defined in NotificationConstants.
 * Safe to call multiple times — Android ignores duplicate channel IDs.
 */
export async function registerAll() {
  try {
    const channelList = Object.values(CHANNELS).map((ch) => ({
      id: ch.id,
      name: ch.name,
      description: ch.description,
      importance: ch.importance,
      visibility: 1, // PUBLIC
      vibration: true,
    }));

    await LocalNotifications.createChannel({ ...channelList[0] });

    // Register remaining channels (Android handles duplicates gracefully)
    for (let i = 1; i < channelList.length; i++) {
      await LocalNotifications.createChannel({ ...channelList[i] });
    }

    Logger.log('Channels', `Registered ${channelList.length} channels`);
  } catch (err) {
    Logger.error('Channels', err);
  }
}
