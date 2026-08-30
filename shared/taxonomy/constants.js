/**
 * @module constants
 * @description Taxonomy domain constants, independent of any storage implementation.
 */

/**
 * @typedef {string} TaxonomyType
 */

/**
 * Centralized taxonomy identifiers.
 * These identifiers do not dictate Firestore collection names; they represent the domain types.
 * @type {Record<string, TaxonomyType>}
 */
export const TAXONOMY_TYPES = {
  CATEGORY: 'category',
  BRAND: 'brand',
  COLLECTION: 'collection',
};
