import { StorageEngine } from '../../storage/StorageEngine.js';

export class MutationStore {
    constructor(domain) {
        this.domain = domain;
        this.storageKey = `mutation_queue_${domain}_v1`;
        this.legacyKey = domain === 'products' ? 'product_mutation_queue_v1' : null;
    }

    /**
     * @returns {Promise<Array>} The stored mutation queue array.
     */
    async loadQueue() {
        try {
            const queue = await StorageEngine.get(this.storageKey);
            let currentQueue = Array.isArray(queue) ? queue : [];

            // Automatic, idempotent, lossless migration for products
            if (this.legacyKey) {
                const legacyQueue = await StorageEngine.get(this.legacyKey);
                if (Array.isArray(legacyQueue) && legacyQueue.length > 0) {
                    console.log(`[MutationStore] Found legacy queue for ${this.domain}. Migrating...`);
                    
                    // Merge, avoiding duplicates by idempotencyKey or id
                    const existingIds = new Set(currentQueue.map(m => m.id));
                    let migratedCount = 0;
                    
                    for (const legacyMut of legacyQueue) {
                        if (!existingIds.has(legacyMut.id)) {
                            // Map productId to documentId and add domain/collection
                            const migratedMut = {
                                ...legacyMut,
                                domain: this.domain,
                                collection: this.domain,
                                documentId: legacyMut.productId || legacyMut.documentId
                            };
                            delete migratedMut.productId;
                            
                            currentQueue.push(migratedMut);
                            existingIds.add(migratedMut.id);
                            migratedCount++;
                        }
                    }

                    if (migratedCount > 0) {
                        // Persist the migrated queue first (safe if crashes here, legacy is untouched)
                        await this.saveQueue(currentQueue);
                        console.log(`[MutationStore] Safely migrated ${migratedCount} legacy mutations for ${this.domain}.`);
                    }
                    
                    // Once safe, remove legacy queue
                    await StorageEngine.remove(this.legacyKey);
                    console.log(`[MutationStore] Removed legacy queue for ${this.domain}.`);
                }
            }

            return currentQueue;
        } catch (error) {
            console.error(`[MutationStore] Failed to load queue for ${this.domain}:`, error);
            return [];
        }
    }

    /**
     * @param {Array} queue The complete mutation queue array to store atomically.
     * @returns {Promise<void>}
     */
    async saveQueue(queue) {
        try {
            await StorageEngine.set(this.storageKey, queue);
        } catch (error) {
            console.error(`[MutationStore] Failed to save queue for ${this.domain}:`, error);
            throw error;
        }
    }
}
