/**
 * @module entities
 * @description Core models and entities for the Taxonomy domain.
 * These types are entirely storage-agnostic.
 */

/**
 * Represents a Brand in the taxonomy domain.
 * @typedef {Object} BrandEntity
 * @property {string} id - The unique identifier of the brand.
 * @property {string} name - The human-readable name of the brand.
 * @property {number} order - The display order of the brand.
 * @property {boolean} active - Whether the brand is currently active and visible.
 * @property {*} createdAt - A generic storage-agnostic representation of creation time.
 * @property {*} updatedAt - A generic storage-agnostic representation of the last update time.
 */

/**
 * Represents a Category or Collection in the taxonomy domain.
 * @typedef {Object} TaxonomyEntity
 * @property {string} id - The unique identifier of the taxonomy entity.
 * @property {string} name - The human-readable name of the taxonomy entity.
 * @property {string} slug - The URL-friendly identifier for the taxonomy entity.
 * @property {number} order - The display order of the entity.
 * @property {boolean} active - Whether the entity is currently active and visible.
 * @property {*} createdAt - A generic storage-agnostic representation of creation time.
 * @property {*} updatedAt - A generic storage-agnostic representation of the last update time.
 */

/**
 * Represents a reference to a taxonomy entity from a product or other document.
 * @typedef {Object} ProductTaxonomyReference
 * @property {string} id - The unique identifier of the referenced taxonomy entity.
 */

export {};
