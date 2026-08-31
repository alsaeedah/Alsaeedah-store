/**
 * @module product/validators
 * @description Provides structural validation for product documents.
 * Note: These validators check data shape and types only. They do NOT verify 
 * if referenced entities actually exist in the database (which is a repository responsibility).
 */

import { PRODUCT_TAXONOMY_FIELDS } from './constants.js';

/**
 * Validates the taxonomy reference structure of a product.
 * @param {Object} product - The product document containing taxonomy references.
 * @throws {Error} Throws if a required taxonomy field is missing or incorrectly typed.
 * @returns {boolean} True if the structure is valid.
 */
export const validateProductTaxonomy = (product) => {
    if (!product) {
        throw new Error("Product data cannot be empty.");
    }

    const categoryId = product[PRODUCT_TAXONOMY_FIELDS.CATEGORY];
    if (!categoryId || typeof categoryId !== 'string' || categoryId.trim() === '') {
        throw new Error("A valid Category ID is required for a taxonomy-enabled product.");
    }

    const brandId = product[PRODUCT_TAXONOMY_FIELDS.BRAND];
    if (brandId !== undefined && brandId !== null && typeof brandId !== 'string') {
        throw new Error("Brand ID must be a string or null.");
    }

    const collectionId = product[PRODUCT_TAXONOMY_FIELDS.COLLECTION];
    if (collectionId !== undefined && collectionId !== null && typeof collectionId !== 'string') {
        throw new Error("Collection ID must be a string or null.");
    }

    const gender = product.gender;
    if (gender !== undefined && gender !== null) {
        if (typeof gender !== 'string' || !['men', 'women', 'kids'].includes(gender)) {
            throw new Error("Invalid gender value. Must be 'men', 'women', or 'kids'.");
        }
    }

    return true;
};
