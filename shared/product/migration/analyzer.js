import { db } from './config.js';
import { runMappingEngine } from './engine.js';

export const analyzeProducts = async () => {
    console.log('Fetching taxonomy entities for analysis...');
    const categoriesSnap = await db.collection('taxonomy_categories').get();
    const categories = categoriesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const brandsSnap = await db.collection('taxonomy_brands').get();
    const brands = brandsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const context = { categories, brands };

    console.log('Fetching all products for analysis...');
    const productsSnap = await db.collection('products').get();

    const report = {
        total: productsSnap.size,
        legacy: 0,
        taxonomy: 0,
        mixed: 0,
        invalid: 0,
        unmappedCategories: new Set(),
        unmappedStyles: new Set()
    };

    productsSnap.forEach(doc => {
        const data = doc.data();
        
        const hasLegacy = !!(data.category || data.style);
        const hasTaxonomy = !!(data.categoryId || data.brandId || data.collectionId || data.gender);
        
        if (hasLegacy && hasTaxonomy) {
            report.mixed++;
        } else if (hasLegacy && !hasTaxonomy) {
            report.legacy++;
        } else if (!hasLegacy && hasTaxonomy) {
            report.taxonomy++;
        } else {
            report.invalid++;
            return;
        }

        // Check for missing mappings on legacy/mixed products
        if (hasLegacy) {
            const mapped = runMappingEngine(data, context);
            
            if (data.category && data.category !== 'all' && !mapped.categoryId) {
                report.unmappedCategories.add(data.category);
            }
            if (data.style && data.style !== 'all' && !mapped.brandId) {
                report.unmappedStyles.add(data.style);
            }
        }
    });

    report.unmappedCategories = Array.from(report.unmappedCategories);
    report.unmappedStyles = Array.from(report.unmappedStyles);

    return report;
};
