/**
 * @module repository
 * @description Architecture contract for Taxonomy data access.
 * This file serves only to define interfaces and responsibilities.
 */

/**
 * Interface representing the data access layer for Taxonomy entities.
 * Future phases must implement this contract to interact with Firestore or Local Storage.
 * @interface TaxonomyRepository
 */

/**
 * @function TaxonomyRepository#getById
 * @param {string} id - The taxonomy entity identifier.
 * @returns {Promise<import('./entities').TaxonomyEntity | null>} The entity if found.
 */

/**
 * @function TaxonomyRepository#getAll
 * @returns {Promise<Array<import('./entities').TaxonomyEntity>>} All taxonomy entities.
 */

/**
 * @function TaxonomyRepository#getActive
 * @returns {Promise<Array<import('./entities').TaxonomyEntity>>} All active taxonomy entities.
 */

/**
 * @function TaxonomyRepository#getBySlug
 * @param {string} slug - The taxonomy entity slug.
 * @returns {Promise<import('./entities').TaxonomyEntity | null>} The entity if found.
 */

/**
 * @function TaxonomyRepository#create
 * @param {Omit<import('./entities').TaxonomyEntity, 'id' | 'createdAt' | 'updatedAt'>} data - The data to create a new entity.
 * @returns {Promise<import('./entities').TaxonomyEntity>} The created entity.
 */

/**
 * @function TaxonomyRepository#update
 * @param {string} id - The identifier of the entity to update.
 * @param {Partial<Omit<import('./entities').TaxonomyEntity, 'id' | 'createdAt' | 'updatedAt'>>} data - The updates to apply.
 * @returns {Promise<import('./entities').TaxonomyEntity>} The updated entity.
 */

/**
 * @function TaxonomyRepository#deactivate
 * @param {string} type - The taxonomy type (e.g., TAXONOMY_TYPES.CATEGORY).
 * @param {string} id - The identifier of the entity to deactivate.
 * @returns {Promise<void>}
 */

export {};
