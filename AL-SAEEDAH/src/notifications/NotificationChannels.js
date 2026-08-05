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

    for (const channel of channelList) {
      await LocalNotifications.createChannel({ ...channel });
    }

    Logger.log('CHANNELS_REGISTERED', `${channelList.length} channels`);
  } catch (err) {
    Logger.error('Channels.registerAll', err);
  }
}

/**
 * Verify that all required channels exist and create any missing ones.
 * Used by the self-healing health check on app resume.
 *
 * @returns {Promise<{verified: boolean, created: string[]}>}
 */
export async function verifyChannels() {
  try {
    const existing = await LocalNotifications.listChannels();
    const existingIds = new Set((existing.channels || []).map(c => c.id));
    const required = Object.values(CHANNELS);
    const created = [];

    for (const ch of required) {
      if (!existingIds.has(ch.id)) {
        await LocalNotifications.createChannel({
          id: ch.id,
          name: ch.name,
          description: ch.description,
          importance: ch.importance,
          visibility: 1,
          vibration: true,
        });
        created.push(ch.id);
        Logger.log('CHANNEL_CREATED', `Missing channel recreated: ${ch.id}`);
      }
    }

    if (created.length > 0) {
      Logger.log('CHANNELS_REPAIRED', `Created ${created.length} missing channels`, created);
    }

    return { verified: true, created };
  } catch (err) {
    Logger.error('Channels.verifyChannels', err);
    return { verified: false, created: [] };
  }
}
