import { StorageEngine } from '../../../storage/StorageEngine.js';
import { TAXONOMY_TYPES } from '../../constants.js';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Data Access Layer for Taxonomy.
 * Implements the Stale-While-Revalidate pattern.
 */
export class TaxonomyDAL {
    /**
     * @param {import('../../repository.js').TaxonomyRepository} firestoreRepository 
     */
    constructor(firestoreRepository) {
        this.firestore = firestoreRepository;
    }

    /**
     * Helper to get a cache key for a type.
     */
    _getCacheKey(type) {
        return `taxonomy_cache_${type}`;
    }

    /**
     * Retrieves all items of a given type.
     * Instantly returns local cache if available.
     * Triggers a background fetch if cache is stale, empty, or if options.force is true.
     * @param {string} type 
     * @param {Object} options 
     * @param {boolean} [options.force=false]
     * @param {Function} [options.onRevalidated]
     */
    async getAll(type, options = { force: false }) {
        const cacheKey = this._getCacheKey(type);
        const cached = await StorageEngine.get(cacheKey);
        
        const now = Date.now();
        const isStale = !cached || !cached.timestamp || (now - cached.timestamp > CACHE_TTL_MS) || options.force;

        if (!cached) {
            // Initial cache miss - await the fetch to show a loading state
            // Let the error propagate up so the store correctly enters an error state
            // rather than a fake success with zero records.
            await this._fetchAndCache(type, cacheKey, options.onRevalidated);
            
            const freshCache = await StorageEngine.get(cacheKey);
            return freshCache ? freshCache.data : [];
        }

        if (isStale) {
            // Background fetch, do not await it so we don't block the UI
            this._fetchAndCache(type, cacheKey, options.onRevalidated).catch(err => {
                console.error(`[TaxonomyDAL] Failed background sync for ${type}:`, err);
            });
        }

        return cached.data;
    }

    /**
     * Fetches from Firestore and updates the cache.
     * @private
     */
    async _fetchAndCache(type, cacheKey, onRevalidated) {
        const freshData = await this.firestore.getAll(type);
        
        await StorageEngine.set(cacheKey, {
            timestamp: Date.now(),
            data: freshData
        });

        if (typeof onRevalidated === 'function') {
            onRevalidated(freshData);
        }
    }
}
