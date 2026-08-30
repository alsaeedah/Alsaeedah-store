/**
 * CachedTaxonomyRepository
 * 
 * Implements the TaxonomyRepository interface.
 * Routes read queries to the TaxonomyDAL for offline support / caching.
 * Routes mutations directly to the underlying Firestore repository (since offline mutations are out of scope).
 */
export class CachedTaxonomyRepository {
    /**
     * @param {import('./cache/TaxonomyDAL.js').TaxonomyDAL} dal 
     * @param {import('../../repository.js').TaxonomyRepository} firestoreRepository 
     */
    constructor(dal, firestoreRepository) {
        this.dal = dal;
        this.firestore = firestoreRepository;
    }

    /**
     * @param {string} type 
     * @param {Object} options 
     */
    async getAll(type, options = {}) {
        return this.dal.getAll(type, options);
    }

    /**
     * Filters active entities manually since we pull from the unified cache.
     * @param {string} type 
     * @param {Object} options 
     */
    async getActive(type, options = {}) {
        const all = await this.getAll(type, options);
        return all.filter(entity => entity.active !== false);
    }

    /**
     * Filters by slug manually since we pull from the unified cache.
     * @param {string} type 
     * @param {string} slug 
     * @param {Object} options 
     */
    async getBySlug(type, slug, options = {}) {
        const all = await this.getAll(type, options);
        return all.find(entity => entity.slug === slug) || null;
    }

    // Mutations pass straight through to Firestore
    
    async create(type, data) {
        // Option to invalidate cache here if needed, but the DAL handles SWR on next read
        return this.firestore.create(type, data);
    }

    async update(type, id, updates) {
        return this.firestore.update(type, id, updates);
    }

    async deactivate(type, id) {
        return this.firestore.deactivate(type, id);
    }
}
