import { taxonomyStore, TAXONOMY_TYPES } from '../taxonomy/index.js';
import { GENDERS } from '../taxonomy/gender.js';

/**
 * Shared resolver to safely map taxonomy IDs to display names for products.
 * Handles missing references and legacy fallback without touching UI logic.
 * 
 * @param {Object} product - The product data object
 * @param {string} field - The taxonomy field to resolve ('categoryId', 'brandId', etc.)
 * @returns {string} The resolved display name or a fallback label
 */
export const resolveTaxonomyLabel = (product, field) => {
    // 1. If taxonomy store is not initialized, we cannot resolve reliably yet
    const state = taxonomyStore.getState();
    
    let resolvedName = null;

    if (field === 'categoryId' && product.categoryId) {
        const match = state.categories?.find(c => c.id === product.categoryId);
        if (match) resolvedName = match.name;
    } else if (field === 'brandId' && product.brandId) {
        const match = state.brands?.find(b => b.id === product.brandId);
        if (match) resolvedName = match.name;
    } else if (field === 'collectionId' && product.collectionId) {
        const match = state.collections?.find(c => c.id === product.collectionId);
        if (match) resolvedName = match.name;
    } else if (field === 'gender' && product.gender) {
        const match = GENDERS.find(g => g.id === product.gender);
        if (match) resolvedName = match.name;
    }

    // Return the resolved taxonomy name if found
    if (resolvedName) return resolvedName;

    // 2. Safely fallback to legacy fields if taxonomy ID is unmapped, missing, or inactive
    if (field === 'categoryId' && product.category) {
        return getLegacyCategoryFallback(product.category);
    }
    
    if (field === 'brandId' && product.style) {
        // Return raw style string as fallback for brand/style
        return product.style === 'classic' ? 'كلاسيك' : 
               product.style === 'sport' ? 'رياضي' : product.style;
    }

    // Default empty state
    return '---';
};

/**
 * Preserved legacy fallback mapper.
 * @param {string} cat - The legacy category string
 * @returns {string}
 */
const getLegacyCategoryFallback = (cat) => {
    if (cat === 'men') return 'ساعات رجالية';
    if (cat === 'women') return 'ساعات نسائية';
    if (cat === 'children' || cat === 'kids') return 'ساعات أطفال';
    return 'ساعات فاخرة';
};
