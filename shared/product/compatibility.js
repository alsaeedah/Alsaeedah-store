/**
 * @module product/compatibility
 * @description Provides helper methods to determine the schema structure of a product.
 * Useful for migration, offline synchronization, and backward compatibility.
 */

import { PRODUCT_TAXONOMY_FIELDS, LEGACY_PRODUCT_FIELDS, PRODUCT_STRUCTURE_TYPES } from './constants.js';

/**
 * Checks if the given product relies on the legacy string-based category fields.
 * @param {Object} product - The product document to check.
 * @returns {boolean} True if it relies on legacy fields.
 */
export const isLegacyProduct = (product) => {
    if (!product) return false;
    const hasLegacy = (product[LEGACY_PRODUCT_FIELDS.CATEGORY] !== undefined || product[LEGACY_PRODUCT_FIELDS.STYLE] !== undefined);
    const hasTaxonomy = (product[PRODUCT_TAXONOMY_FIELDS.CATEGORY] !== undefined || product[PRODUCT_TAXONOMY_FIELDS.BRAND] !== undefined || product[PRODUCT_TAXONOMY_FIELDS.COLLECTION] !== undefined || product[PRODUCT_TAXONOMY_FIELDS.GENDER] !== undefined);
    return hasLegacy && !hasTaxonomy;
};

/**
 * Checks if the given product strictly uses the new Taxonomy reference IDs.
 * @param {Object} product - The product document to check.
 * @returns {boolean} True if it exclusively uses taxonomy reference fields.
 */
export const isTaxonomyProduct = (product) => {
    if (!product) return false;
    const hasLegacy = (product[LEGACY_PRODUCT_FIELDS.CATEGORY] !== undefined || product[LEGACY_PRODUCT_FIELDS.STYLE] !== undefined);
    const hasTaxonomy = (product[PRODUCT_TAXONOMY_FIELDS.CATEGORY] !== undefined || product[PRODUCT_TAXONOMY_FIELDS.BRAND] !== undefined || product[PRODUCT_TAXONOMY_FIELDS.COLLECTION] !== undefined || product[PRODUCT_TAXONOMY_FIELDS.GENDER] !== undefined);
    return hasTaxonomy && !hasLegacy;
};

/**
 * Checks if the given product contains both legacy and taxonomy fields.
 * This state is expected during partial migrations or synchronization delays.
 * @param {Object} product - The product document to check.
 * @returns {boolean} True if both structures are present.
 */
export const isMixedProduct = (product) => {
    if (!product) return false;
    const hasLegacy = (product[LEGACY_PRODUCT_FIELDS.CATEGORY] !== undefined || product[LEGACY_PRODUCT_FIELDS.STYLE] !== undefined);
    const hasTaxonomy = (product[PRODUCT_TAXONOMY_FIELDS.CATEGORY] !== undefined || product[PRODUCT_TAXONOMY_FIELDS.BRAND] !== undefined || product[PRODUCT_TAXONOMY_FIELDS.COLLECTION] !== undefined || product[PRODUCT_TAXONOMY_FIELDS.GENDER] !== undefined);
    return hasLegacy && hasTaxonomy;
};

/**
 * Detects and returns the specific structure type of a product.
 * Recommended over multiple boolean checks.
 * @param {Object} product - The product document to analyze.
 * @returns {string} The detected product structure type from PRODUCT_STRUCTURE_TYPES.
 */
export const detectProductStructure = (product) => {
    if (!product || typeof product !== 'object') {
        return PRODUCT_STRUCTURE_TYPES.UNKNOWN;
    }

    if (isMixedProduct(product)) {
        return PRODUCT_STRUCTURE_TYPES.MIXED;
    }

    if (isTaxonomyProduct(product)) {
        return PRODUCT_STRUCTURE_TYPES.TAXONOMY;
    }

    if (isLegacyProduct(product)) {
        return PRODUCT_STRUCTURE_TYPES.LEGACY;
    }

    return PRODUCT_STRUCTURE_TYPES.UNKNOWN;
};
