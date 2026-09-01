import { db } from '../firebase/config';
import { FirestoreProductRepository } from '../../../shared/product/infrastructure/FirestoreProductRepository.js';
import { ProductDAL } from '../../../shared/product/infrastructure/cache/ProductDAL.js';
import { resolveFilters } from './productQueryBuilder';

const firestoreRepository = new FirestoreProductRepository(db);
export const productRepository = new ProductDAL(firestoreRepository);

export const fetchProductsFromFirestore = async () => {
    return await productRepository.getLatest(1000); // Or another appropriate fallback
};

export const fetchFreshProductsByIds = async (ids) => {
    return await firestoreRepository.getByIds(ids);
};

export const fetchLatestProducts = async () => {
    return await productRepository.getLatest();
};

export const fetchBestSellers = async () => {
    return await productRepository.getBestSellers();
};

export const fetchProductsPaginated = async (page = 0, pageSize = 6, filters = {}, cursor = null) => {
    const resolvedFilters = resolveFilters(filters);
    return await productRepository.getPaginated(resolvedFilters, page, pageSize, cursor);
};

export const fetchRelatedProducts = async (id, limitCount = 12) => {
    return await productRepository.getRelated(id, limitCount);
};

export const fetchProductsByIds = async (ids) => {
    return await productRepository.getByIds(ids);
};

export const fetchAvailableBrandIds = async (categoryIds) => {
    return await productRepository.getAvailableBrandIds(categoryIds);
};

export const subscribeToProducts = (callback) => {
    return productRepository.subscribeToList({ usePayloadFormat: true }, callback);
};

export const fetchProductById = async (id) => {
    return await productRepository.getById(id);
};

export const subscribeToHero = (callback) => {
    let isCancelled = false;

    const fetchHeroLocalFirst = async () => {
        try {
            const { StorageEngine } = await import('../../../shared/storage/StorageEngine');
            const { collection, getDocs } = await import('firebase/firestore');

            const localHero = await StorageEngine.get('hero_data');
            if (!isCancelled && localHero && Array.isArray(localHero) && localHero.length > 0) {
                callback(localHero);
            }

            const snap = await getDocs(collection(db, 'hero'));
            const serverHero = [];
            snap.forEach(doc => serverHero.push({ id: doc.id, ...doc.data() }));

            await StorageEngine.set('hero_data', serverHero);

            if (!isCancelled) {
                callback(serverHero);
            }
        } catch (error) {
            console.error('[subscribeToHero] Background refresh failed:', error);
            // DO NOT call callback([]) here, as it would erase the valid cache when offline.
        }
    };

    fetchHeroLocalFirst();

    let unsubscribeLifecycle;
    import('../../../shared/startup/LifecycleCoordinator.js').then(({ lifecycleCoordinator }) => {
        unsubscribeLifecycle = lifecycleCoordinator.subscribe(() => {
            if (!isCancelled) fetchHeroLocalFirst();
        });
    });

    return () => {
        isCancelled = true;
        if (unsubscribeLifecycle) unsubscribeLifecycle();
    };
};

// ==========================================
// SWR SUBSCRIPTIONS
// ==========================================

export const subscribeToLatestSWR = (callback) => {
    return productRepository.subscribeToLatestSWR(6, callback);
};

export const subscribeToBestSellersSWR = (callback) => {
    return productRepository.subscribeToBestSellersSWR(6, callback);
};

export const subscribeToRelatedSWR = (id, callback, limitCount = 12) => {
    return productRepository.subscribeToRelatedSWR(id, limitCount, callback);
};

export const subscribeToPaginatedSWR = (page = 0, pageSize = 6, filters = {}, cursor = null, callback) => {
    const resolvedFilters = resolveFilters(filters);
    return productRepository.subscribeToPaginatedSWR(resolvedFilters, page, pageSize, cursor, callback);
};
