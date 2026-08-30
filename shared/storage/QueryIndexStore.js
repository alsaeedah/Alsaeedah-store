import { StorageEngine } from './StorageEngine.js';

const QUERY_PREFIX = 'query_v2_';

/**
 * QueryIndexStore
 * Stores the results of queries as lists of entity IDs.
 * Allows decoupling query results from actual entity data.
 */
export class QueryIndexStore {
    static _getKey(entityType, queryHash) {
        return `${QUERY_PREFIX}${entityType}_${queryHash}`;
    }

    /**
     * Get a query result (which includes the array of IDs and potentially metadata like pagination cursors).
     * Expected return structure: { ids: string[], ...metadata, timestamp: number }
     */
    static async get(entityType, queryHash) {
        try {
            return await StorageEngine.get(this._getKey(entityType, queryHash));
        } catch (err) {
            console.error(`[QueryIndexStore] Failed to get query ${entityType}/${queryHash}:`, err);
            return null;
        }
    }

    /**
     * Save a query result.
     * @param {string} entityType 
     * @param {string} queryHash 
     * @param {object} data - Object containing at least an `ids` array.
     */
    static async set(entityType, queryHash, data) {
        try {
            const payload = {
                ...data,
                timestamp: Date.now()
            };
            await StorageEngine.set(this._getKey(entityType, queryHash), payload);
        } catch (err) {
            console.error(`[QueryIndexStore] Failed to set query ${entityType}/${queryHash}:`, err);
        }
    }

    /**
     * Remove a specific query index.
     */
    static async remove(entityType, queryHash) {
        try {
            await StorageEngine.remove(this._getKey(entityType, queryHash));
        } catch (err) {
            console.error(`[QueryIndexStore] Failed to remove query ${entityType}/${queryHash}:`, err);
        }
    }
    
    /**
     * Lists all keys for a specific entity type (requires direct access to storage engine underlying keys if supported, 
     * or we can just maintain a registry if we need to iterate).
     * Given StorageEngine is simple KV, we might need a registry if we want to iterate indexes.
     */
}
