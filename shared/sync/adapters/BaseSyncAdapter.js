/**
 * BaseSyncAdapter
 * Defines the contract for Bidirectional Sync.
 */
export class BaseSyncAdapter {
    /**
     * @returns {string} The domain/feature name used for queues and checkpoints.
     */
    getDomain() {
        throw new Error('Must be implemented by subclass');
    }

    /**
     * Executes a single mutation against Firestore.
     * @param {Object} mutation The mutation record.
     * @returns {Promise<void>} Throws if execution fails.
     */
    async executeMutation(mutation) {
        throw new Error('Must be implemented by subclass');
    }

    /**
     * Detects if there is a conflict between local mutation and server data.
     * @param {Object} mutation The pending mutation.
     * @param {Object|null} serverData The latest data from server.
     * @returns {boolean} True if conflict detected.
     */
    detectConflict(mutation, serverData) {
        return false;
    }

    /**
     * Reconciles a detected conflict.
     * @param {Object} mutation The conflicting mutation.
     * @param {Object|null} serverData The authoritative server data.
     * @returns {Promise<void>}
     */
    async resolveConflict(mutation, serverData) {
        // Default does nothing, adapter should implement
    }

    /**
     * Called when a mutation successfully completes on the server.
     * Ideal place to update local cache.
     * @param {Object} mutation The completed mutation.
     * @returns {Promise<void>}
     */
    async onMutationCompleted(mutation) {
        // Default does nothing, adapter should implement
    }

    /**
     * Executes the incremental inbound synchronization logic.
     * @param {string|null} lastSyncAt - The last known successful sync boundary.
     * @param {string} syncBoundary - The new safe upper boundary for this sync cycle.
     * @returns {Promise<boolean>} True if successful, False if failed.
     */
    async syncInbound(lastSyncAt, syncBoundary) {
        throw new Error('Must be implemented by subclass');
    }

    /**
     * Declares the change detection mechanism used by this adapter.
     * E.g., 'updated_at', 'version', 'none'
     * @returns {string}
     */
    getChangeDetectionMechanism() {
        return 'none';
    }
}
