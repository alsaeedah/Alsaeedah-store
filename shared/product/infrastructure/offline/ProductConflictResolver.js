export const ProductConflictResolver = {
    /**
     * Determines if a local mutation conflicts with the current server state.
     * Uses a strict "Server Wins" strategy based on `updated_at` (or similar version field).
     * 
     * @param {Object} mutation The queued local mutation record.
     * @param {Object} serverData The currently fetched server product data.
     * @returns {boolean} True if the server data is strictly newer than the base version of the mutation.
     */
    detectConflict(mutation, serverData) {
        // Creates cannot conflict in a baseVersion sense, as the ID is new.
        if (mutation.operation === 'create') return false;

        if (!serverData) {
            // If it's an update, but the server data is gone, that's a DELETE conflict.
            return mutation.operation === 'update';
        }

        // If the mutation has no baseVersion recorded, we cannot safely assert a conflict.
        // It's safer to let it proceed or fail at the backend layer.
        if (!mutation.baseVersion) return false;

        const serverVersion = serverData.updated_at || serverData.created_at;
        if (!serverVersion) return false; // Server doesn't track versions, cannot detect conflict

        const serverTime = new Date(serverVersion).getTime();
        const baseTime = new Date(mutation.baseVersion).getTime();

        return serverTime > baseTime;
    }
};
