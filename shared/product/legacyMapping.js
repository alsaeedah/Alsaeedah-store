/**
 * @module product/legacyMapping
 * @description Provides reusable mapping functions to translate between legacy string 
 * fields and new Taxonomy reference IDs, and vice versa.
 */

import { PRODUCT_TAXONOMY_FIELDS, LEGACY_PRODUCT_FIELDS } from './constants.js';

// Predefined translation dictionary based on the legacy hardcoded strings
// and their corresponding expected Arabic names in the taxonomy system.
const CATEGORY_MAP = {
    'men': 'رجالي',
    'women': 'نسائي',
    'kids': 'أطفال'
};

const STYLE_MAP = {
    'classic': 'كلاسيكي',
    'formal': 'رسمي',
    'wedding': 'عرائسي',
    'smart': 'سمارت',
    'sport': 'سبورت'
};

/**
 * Attempts to map a legacy category string to a corresponding Taxonomy Category ID.
 * @param {string} legacyCategory - The legacy string (e.g. 'men').
 * @param {Array<Object>} availableCategories - List of active Category taxonomy entities from the store.
 * @returns {string|null} The matching category ID, or null if no match is found.
 */
export const mapLegacyCategoryToId = (legacyCategory, availableCategories) => {
    if (!legacyCategory || !availableCategories || availableCategories.length === 0) return null;
    
    // First try exact match on the key
    let match = availableCategories.find(c => c.name.toLowerCase() === legacyCategory.toLowerCase());
    if (match) return match.id;

    // Then try matching via the translation dictionary
    const translatedName = CATEGORY_MAP[legacyCategory.toLowerCase()];
    if (translatedName) {
        match = availableCategories.find(c => c.name === translatedName);
        if (match) return match.id;
    }

    return null;
};

/**
 * Attempts to map a legacy style string to a corresponding Taxonomy Brand/Collection ID.
 * Since style previously represented both Brand and Collection loosely, this maps it generally.
 * @param {string} legacyStyle - The legacy string (e.g. 'classic').
 * @param {Array<Object>} availableEntities - List of active Brand or Collection entities.
 * @returns {string|null} The matching entity ID, or null if no match is found.
 */
export const mapLegacyStyleToId = (legacyStyle, availableEntities) => {
    if (!legacyStyle || !availableEntities || availableEntities.length === 0) return null;
    
    // First try exact match on the key
    let match = availableEntities.find(e => e.name.toLowerCase() === legacyStyle.toLowerCase());
    if (match) return match.id;

    // Then try matching via the translation dictionary
    const translatedName = STYLE_MAP[legacyStyle.toLowerCase()];
    if (translatedName) {
        match = availableEntities.find(e => e.name === translatedName);
        if (match) return match.id;
    }

    return null;
};

/**
 * Maps a Taxonomy Category ID back to the closest legacy string to maintain compatibility 
 * with the Customer Store until Phase 4.5.
 * @param {string} categoryId - The Taxonomy Category ID.
 * @param {Array<Object>} availableCategories - List of active Category taxonomy entities.
 * @returns {string} The legacy string (e.g. 'men'), or the raw name as a fallback.
 */
export const mapIdToLegacyCategory = (categoryId, availableCategories) => {
    if (!categoryId || !availableCategories) return '';
    
    const category = availableCategories.find(c => c.id === categoryId);
    if (!category) return '';

    // Reverse lookup in translation map
    for (const [key, value] of Object.entries(CATEGORY_MAP)) {
        if (value === category.name) {
            return key;
        }
    }

    // Fallback: use the raw name or empty string if it doesn't match legacy format exactly
    return category.name;
};

/**
 * Maps a Taxonomy Brand ID back to the closest legacy style string.
 * @param {string} brandId - The Taxonomy Brand ID.
 * @param {Array<Object>} availableBrands - List of active Brand taxonomy entities.
 * @returns {string} The legacy string (e.g. 'classic'), or the raw name as a fallback.
 */
export const mapIdToLegacyStyle = (brandId, availableBrands) => {
    if (!brandId || !availableBrands) return '';
    
    const brand = availableBrands.find(b => b.id === brandId);
    if (!brand) return '';

    // Reverse lookup in translation map
    for (const [key, value] of Object.entries(STYLE_MAP)) {
        if (value === brand.name) {
            return key;
        }
    }

    return brand.name;
};
