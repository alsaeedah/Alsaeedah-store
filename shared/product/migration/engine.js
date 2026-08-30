/**
 * Pure mapping engine for migrating legacy products.
 * Does not access Firestore or execute any side effects.
 * 
 * @param {Object} productData - The legacy product document data
 * @param {Object} context - Taxonomy lookups injected into the engine
 * @param {Array} context.categories - Active taxonomy categories
 * @param {Array} context.brands - Active taxonomy brands
 * @returns {Object} Transformed object with categoryId and brandId
 */
export const runMappingEngine = (productData, context) => {
    const { category, style } = productData;
    const { categories = [], brands = [] } = context;

    let categoryId = productData.categoryId || null;
    let brandId = productData.brandId || null;
    const collectionId = productData.collectionId || null;
    const genderId = productData.genderId || null;

    if (!categoryId && category) {
        // Map category string to categoryId
        const match = categories.find(c => 
            c.name.toLowerCase() === category.toLowerCase() ||
            (c.slug && c.slug.toLowerCase() === category.toLowerCase())
        );
        if (match) {
            categoryId = match.id;
        } else {
            const fallback = categories.find(c => c.slug === 'general');
            if (fallback) categoryId = fallback.id;
        }
    }

    if (!brandId && style) {
        // Map style string to brandId
        const match = brands.find(b => 
            b.name.toLowerCase() === style.toLowerCase()
        );
        if (match) {
            brandId = match.id;
        } else {
            const fallback = brands.find(b => b.name === 'General');
            if (fallback) brandId = fallback.id;
        }
    }

    return {
        categoryId,
        brandId,
        collectionId,
        genderId
    };
};
