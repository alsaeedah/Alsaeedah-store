import { StorageEngine } from './StorageEngine.js';

const ENTITY_PREFIX = 'entity_v2_';

/**
 * EntityStore
 * Provides a canonical local cache for individual entities.
 * Ensures an entity exists exactly once locally.
 */
export class EntityStore {
    static _getKey(entityType, id) {
        return `${ENTITY_PREFIX}${entityType}_${id}`;
    }

    /**
     * Get a single entity by ID.
     */
    static async get(entityType, id) {
        if (!id) return null;
        try {
            return await StorageEngine.get(this._getKey(entityType, id));
        } catch (err) {
            console.error(`[EntityStore] Failed to get ${entityType}/${id}:`, err);
            return null;
        }
    }

    /**
     * Get multiple entities by their IDs.
     * Missing entities will simply be omitted from the resulting array instead of returning nulls.
     */
    static async getMany(entityType, ids) {
        if (!Array.isArray(ids)) return [];
        const promises = ids.map(id => this.get(entityType, id));
        const results = await Promise.all(promises);
        return results.filter(entity => entity !== null && entity !== undefined);
    }

    /**
     * Save a single entity.
     */
    static async set(entityType, entity) {
        if (!entity || typeof entity !== 'object' || !entity.id) {
            console.warn(`[EntityStore] Attempted to set invalid entity for type ${entityType}. Rejected.`);
            return;
        }
        try {
            await StorageEngine.set(this._getKey(entityType, entity.id), entity);
        } catch (err) {
            console.error(`[EntityStore] Failed to set ${entityType}/${entity.id}:`, err);
        }
    }

    /**
     * Save multiple entities.
     */
    static async setMany(entityType, entities) {
        if (!Array.isArray(entities)) return;
        const promises = entities.map(entity => this.set(entityType, entity));
        await Promise.all(promises);
    }

    /**
     * Remove a single entity.
     */
    static async remove(entityType, id) {
        if (!id) return;
        try {
            await StorageEngine.remove(this._getKey(entityType, id));
        } catch (err) {
            console.error(`[EntityStore] Failed to remove ${entityType}/${id}:`, err);
        }
    }
}
