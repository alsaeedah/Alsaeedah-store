export const MutationOperation = {
    CREATE: 'create',
    UPDATE: 'update',
    DELETE: 'delete',
    BATCH: 'batch'
};

export const MutationState = {
    PENDING: 'pending',
    PROCESSING: 'processing',
    FAILED: 'failed',
    COMPLETED: 'completed',
    CONFLICT: 'conflict'
};

/**
 * Generates a random alphanumeric ID similar to Firestore's auto-id (20 characters).
 * Uses Math.random() as fallback if crypto is unavailable.
 */
export function generateClientId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let autoId = '';
    
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
        const randomValues = new Uint8Array(20);
        window.crypto.getRandomValues(randomValues);
        for (let i = 0; i < 20; i++) {
            autoId += chars[randomValues[i] % chars.length];
        }
    } else {
        for (let i = 0; i < 20; i++) {
            autoId += chars.charAt(Math.floor(Math.random() * chars.length));
        }
    }
    return autoId;
}

export function generateIdempotencyKey() {
    return `${Date.now()}_${generateClientId().substring(0, 8)}`;
}
