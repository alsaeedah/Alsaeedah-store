import { db } from '../firebase/config';
import { FirestoreProductRepository } from '../../../shared/product/infrastructure/FirestoreProductRepository.js';
import { ProductDAL } from '../../../shared/product/infrastructure/cache/ProductDAL.js';

// Instantiate the repository with the injected db instance
const firestoreRepository = new FirestoreProductRepository(db);
export const productRepository = new ProductDAL(firestoreRepository);

export const fetchProductsFromFirestore = async () => {
    return await productRepository.getPaginated({}, 0, 100);
};

export const fetchStats = async () => {
    return await productRepository.getStats();
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
