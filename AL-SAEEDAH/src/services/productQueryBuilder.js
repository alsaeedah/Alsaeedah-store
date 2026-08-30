import { taxonomyStore } from '../../../shared/taxonomy/index.js';
import { mapLegacyCategoryToId, mapLegacyStyleToId } from '../../../shared/product/index.js';

/**
 * Normalizes a filter value: converts undefined, empty strings, and 'all' to null.
 * Preserves valid strings and other truthy values.
 */
const normalizeFilterValue = (value) => {
    if (value === undefined || value === null || value === '' || value === 'all' || value === 'All') {
        return null;
    }
    return value;
};

/**
 * Normalizes an array of filter IDs: removes empty/invalid values, deduplicates, and sorts.
 * Also gracefully coerces single values into arrays for backward compatibility.
 */
const normalizeIdArray = (value) => {
    let arr = Array.isArray(value) ? value : (value ? [value] : []);
    arr = arr.filter(v => v !== undefined && v !== null && v !== '' && v !== 'all' && v !== 'All');
    const unique = [...new Set(arr)].sort();
    return unique.length > 0 ? unique : null;
};

/**
 * Resolves taxonomy IDs from legacy string filters using the cached taxonomy store.
 * @param {Object} filters 
 * @returns {Object} { categoryIds, brandIds, collectionId, genderId, legacyCategory, legacyStyle }
 */
export const resolveFilters = (filters) => {
    let categoryIds = normalizeIdArray(filters.categoryIds || filters.categoryId);
    let brandIds = normalizeIdArray(filters.brandIds || filters.brandId);
    let collectionId = normalizeFilterValue(filters.collectionId);
    let genderId = normalizeFilterValue(filters.genderId);
    const category = normalizeFilterValue(filters.category);
    const style = normalizeFilterValue(filters.style);

    // Use vanilla store API to access cached taxonomies synchronously.
    // The store exposes categories/brands as top-level arrays, not under a 'taxonomies' key.
    const state = taxonomyStore.getState();

    // Map legacy category string to taxonomy ID if categoryIds is missing
    if (!categoryIds && category) {
        const id = mapLegacyCategoryToId(category, state.categories || []);
        if (id) categoryIds = [id];
    }

    // Map legacy style string to brand taxonomy ID if brandIds is missing
    if (!brandIds && style) {
        const id = mapLegacyStyleToId(style, state.brands || []);
        if (id) brandIds = [id];
    }

    return {
        categoryIds,
        brandIds,
        collectionId,
        genderId,
        legacyCategory: category || null,
        legacyStyle: style || null,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        search: filters.search,
        sortPrice: filters.sortPrice,
        seed: filters.seed
    };
};
