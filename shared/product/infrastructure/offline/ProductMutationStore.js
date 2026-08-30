import { StorageEngine } from '../../../storage/StorageEngine.js';

const QUEUE_STORAGE_KEY = 'product_mutation_queue_v1';

export const ProductMutationStore = {
    /**
     * @returns {Promise<Array>} The stored mutation queue array.
     */
    async loadQueue() {
        try {
            const queue = await StorageEngine.get(QUEUE_STORAGE_KEY);
            return Array.isArray(queue) ? queue : [];
        } catch (error) {
            console.error('[ProductMutationStore] Failed to load queue:', error);
            return [];
        }
    },

    /**
     * @param {Array} queue The complete mutation queue array to store atomically.
     * @returns {Promise<void>}
     */
    async saveQueue(queue) {
        try {
            await StorageEngine.set(QUEUE_STORAGE_KEY, queue);
        } catch (error) {
            console.error('[ProductMutationStore] Failed to save queue:', error);
            throw error; // Throw so the queue manager knows persistence failed
        }
    }
};
