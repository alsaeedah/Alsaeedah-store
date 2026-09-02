import { db } from '../firebase/config';
import { FirestoreProductRepository } from '../../../shared/product/infrastructure/FirestoreProductRepository.js';
import { ProductDAL } from '../../../shared/product/infrastructure/cache/ProductDAL.js';
import { deleteFromCloudinary } from '../utils/cloudinary';

// Instantiate the repository with the injected db instance
const firestoreRepository = new FirestoreProductRepository(db);
export const productRepository = new ProductDAL(firestoreRepository);

export const fetchProductsFromFirestore = async () => {
    return await productRepository.getPaginated({}, 0, 100);
};

export const fetchStats = async () => {
    return await productRepository.getStats();
};

export const getAvailableBrandIds = async (categoryIds) => {
    return await productRepository.getAvailableBrandIds(categoryIds);
};

export const addProduct = async (productData) => {
    return await productRepository.create(productData);
};

export const updateProduct = async (id, updates) => {
    return await productRepository.update(id, updates);
};

export const deleteProduct = async (id) => {
    return await productRepository.delete(id);
};

// ==========================================
// SWR SUBSCRIPTIONS
// ==========================================

export const subscribeToStatsSWR = (callback) => {
    return productRepository.subscribeToStatsSWR(callback);
};

// ==========================================
// BULK SELECTION
// ==========================================

/**
 * Returns the IDs (and a capped flag) of all products matching the given filters.
 * Uses a bounded batch-scan — never issues an unbounded Firestore read.
 *
 * @param {Object} filters  - Same filter shape used by the Products page
 * @param {number} [cap=500]
 * @returns {Promise<{ ids: string[], capped: boolean }>}
 */
export const getFilteredIds = async (filters, cap = 500) => {
    return productRepository.getFilteredIds(filters, cap);
};

// ==========================================
// BULK DELETE
// ==========================================

/**
 * Deletes the products identified by the provided IDs.
 *
 * Steps:
 *  1. Validate input.
 *  2. Batch-fetch full product data via getByIds (single round-trip, cache-first).
 *  3. Clean up Cloudinary assets (images + video) for each product — non-fatal.
 *  4. Delegate Firestore deletion to the DAL (batched, partial-failure safe).
 *  5. Return a structured result.
 *
 * @param {string[]} ids
 * @returns {Promise<{
 *   success: boolean,
 *   deletedIds: string[],
 *   failedIds: string[],
 *   errors: Array<{ id: string, message: string }>,
 *   cloudinaryErrors: Array<{ id: string, message: string }>
 * }>}
 */
export const deleteProducts = async (ids) => {
    if (!ids || ids.length === 0) {
        throw new Error('لا يوجد منتجات محددة للحذف');
    }

    const cloudinaryErrors = [];

    // --- Step 1: Batch-fetch product data in one round-trip (cache-first via DAL) ---
    // getByIds already chunks into ≤10 IDs per Firestore 'in' query, so this is safe.
    let products = [];
    try {
        products = await productRepository.getByIds(ids);
    } catch (fetchErr) {
        // Non-fatal: if we can't fetch product data we still proceed with deletion.
        // Cloudinary cleanup will be skipped for products we couldn't fetch.
        console.warn('[deleteProducts] Could not batch-fetch products for asset cleanup:', fetchErr);
    }

    // Build a map for O(1) lookups
    const productMap = new Map(products.map(p => [String(p.id), p]));

    // --- Step 2: Clean up Cloudinary assets (non-fatal per product) ---
    for (const id of ids) {
        const product = productMap.get(String(id));
        if (!product) continue; // couldn't fetch — skip asset cleanup for this product

        try {
            if (product.video && product.video.includes('cloudinary')) {
                await deleteFromCloudinary(product.video, 'video');
            }

            const imagesToDelete = new Set(product.images || []);
            if (product.imageUrl) imagesToDelete.add(product.imageUrl);

            for (const img of imagesToDelete) {
                if (img && img.includes('cloudinary')) {
                    await deleteFromCloudinary(img, 'image');
                }
            }
        } catch (cdnErr) {
            cloudinaryErrors.push({ id, message: cdnErr?.message || 'Cloudinary error' });
            console.warn(`[deleteProducts] Cloudinary cleanup failed for product ${id}:`, cdnErr);
            // Continue — Cloudinary failure must not block Firestore deletion
        }
    }

    // --- Step 3: Delegate Firestore batch deletion to the DAL ---
    // The DAL handles: online check, batched writeBatch (249 products/batch),
    // EntityStore cleanup, cache invalidation, and sync — all in one call.
    const result = await productRepository.deleteMany(ids);

    return {
        success: result.failedIds.length === 0,
        deletedIds: result.deletedIds,
        failedIds: result.failedIds,
        errors: result.errors,
        cloudinaryErrors
    };
};

