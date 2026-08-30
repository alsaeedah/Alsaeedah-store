import { StorageEngine } from '../storage/StorageEngine.js';

const SYNC_METADATA_PREFIX = 'sync_meta_';

/**
 * Service to manage sync checkpoints and boundary contracts per feature.
 */
export class SyncMetadata {
    /**
     * Gets the last known successful sync timestamp for a specific feature.
     * @param {string} featureName - e.g., 'products', 'orders'
     * @returns {Promise<string|null>} ISO string timestamp or null if never synced
     */
    static async getLastSyncAt(featureName) {
        try {
            const key = `${SYNC_METADATA_PREFIX}${featureName}`;
            const data = await StorageEngine.get(key);
            return data?.lastSyncAt || null;
        } catch (error) {
            console.error(`Failed to read sync metadata for ${featureName}:`, error);
            return null;
        }
    }

    /**
     * Advances the sync boundary to the specified timestamp.
     * Should only be called after a successful remote fetch AND local persist.
     * @param {string} featureName - e.g., 'products', 'orders'
     * @param {string} timestamp - ISO string timestamp
     * @returns {Promise<void>}
     */
    static async setLastSyncAt(featureName, timestamp) {
        try {
            const key = `${SYNC_METADATA_PREFIX}${featureName}`;
            await StorageEngine.set(key, { lastSyncAt: timestamp });
        } catch (error) {
            console.error(`Failed to write sync metadata for ${featureName}:`, error);
        }
    }

    /**
     * Clears sync metadata (useful on logout or forced full refresh)
     * @param {string} featureName 
     */
    static async clearLastSyncAt(featureName) {
        try {
            const key = `${SYNC_METADATA_PREFIX}${featureName}`;
            await StorageEngine.remove(key);
        } catch (error) {
            console.error(`Failed to clear sync metadata for ${featureName}:`, error);
        }
    }
}
