/**
 * Base class for synchronization strategies.
 * Defines the contract that SyncEngine expects.
 */
export class BaseSyncStrategy {
    /**
     * @returns {string} The feature name used for checkpoints in SyncMetadata.
     */
    getFeatureName() {
        throw new Error('Must be implemented by subclass');
    }

    /**
     * Executes the incremental synchronization logic.
     * @param {string|null} lastSyncAt - The last known successful sync boundary (ISO string).
     * @param {string} syncBoundary - The new safe upper boundary for this sync cycle.
     * @returns {Promise<boolean>} True if successful, False if failed.
     */
    async execute(lastSyncAt, syncBoundary) {
        throw new Error('Must be implemented by subclass');
    }
}
