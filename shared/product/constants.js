/**
 * @module product/constants
 * @description Centralized constants for the product domain.
 * Defines the single source of truth for taxonomy-related fields.
 */

/**
 * Fields used in the new Taxonomy-enabled product model.
 * These store the ID references to Taxonomy entities.
 */
export const PRODUCT_TAXONOMY_FIELDS = {
    CATEGORY: 'categoryId',
    BRAND: 'brandId',
    COLLECTION: 'collectionId'
};

export const STATIC_PRODUCT_FIELDS = {
    GENDER: 'gender'
};

/**
 * Fields used in the legacy product model.
 * These store hardcoded string values instead of references.
 */
export const LEGACY_PRODUCT_FIELDS = {
    CATEGORY: 'category',
    STYLE: 'style'
};

/**
 * Product structure types used by the compatibility layer.
 */
export const PRODUCT_STRUCTURE_TYPES = {
    LEGACY: 'legacy',
    TAXONOMY: 'taxonomy',
    MIXED: 'mixed',
    UNKNOWN: 'unknown'
};
