export const MutationSerializer = {
    /**
     * Sanitizes data before saving to the mutation queue.
     * Removes non-serializable elements, UI specific transient state, and undefined values.
     */
    serializePayload(payload) {
        if (!payload) return {};
        
        const cleanPayload = {};
        for (const [key, value] of Object.entries(payload)) {
            // Drop functions and DOM nodes
            if (typeof value === 'function') continue;
            
            // Drop undefined
            if (value === undefined) continue;

            // Simple clone of objects/arrays to avoid reference issues
            if (value !== null && typeof value === 'object') {
                try {
                    cleanPayload[key] = JSON.parse(JSON.stringify(value));
                } catch (e) {
                    console.warn(`[MutationSerializer] Dropping non-serializable field: ${key}`);
                }
            } else {
                cleanPayload[key] = value;
            }
        }
        return cleanPayload;
    }
};
