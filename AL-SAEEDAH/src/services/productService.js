import { db } from '../firebase/config';
import { collection, query, orderBy, getDocs, where, onSnapshot, doc, getDoc } from 'firebase/firestore';

export const fetchProductsFromFirestore = async () => {
    try {
        const q = query(collection(db, 'products'), orderBy('created_at', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Unexpected error fetching products:', error);
        return [];
    }
};

export const fetchLatestProducts = async () => {
    try {
        const q = query(collection(db, 'products'), where('is_latest', '==', true));
        const snapshot = await getDocs(q);
        const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return products.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } catch (error) {
        console.error('Error in fetchLatestProducts:', error);
        return [];
    }
};

export const fetchBestSellers = async () => {
    try {
        const q = query(collection(db, 'products'), where('is_best_seller', '==', true));
        const snapshot = await getDocs(q);
        const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return products.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } catch (error) {
        console.error('Error fetching best sellers:', error);
        return [];
    }
};

export const fetchProductsPaginated = async (page = 0, pageSize = 6, filters = {}) => {
    try {
        const from = page * pageSize;
        const to = from + pageSize;

        // Note: Firestore doesn't support offset pagination or random sorting easily.
        // For a typical e-commerce store with < 10,000 items, fetching the filtered set
        // and slicing in memory is practical and guarantees UI compatibility.

        let q = collection(db, 'products');
        const queryConstraints = [];

        if (filters.category && filters.category !== 'all') {
            queryConstraints.push(where('category', '==', filters.category));
        }
        if (filters.style && filters.style !== 'all') {
            queryConstraints.push(where('style', '==', filters.style));
        }
        
        // Firestore only allows inequality filters (>=, <=) on a single field.
        // We will apply price filters in memory to allow combining with sorting.
        
        const finalQuery = query(q, ...queryConstraints);
        const snapshot = await getDocs(finalQuery);
        
        let allProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Apply price filters in memory (Firestore limitation workaround)
        if (filters.minPrice) {
            allProducts = allProducts.filter(p => p.price >= filters.minPrice);
        }
        if (filters.maxPrice) {
            allProducts = allProducts.filter(p => p.price <= filters.maxPrice);
        }

        // Apply search filter in memory
        if (filters.search) {
            const term = filters.search.toLowerCase();
            allProducts = allProducts.filter(p => 
                (p.name && p.name.toLowerCase().includes(term)) || 
                (p.displayId && p.displayId.toLowerCase().includes(term))
            );
        }

        // Random sort fallback logic
        if (filters.sortPrice === 'none' && filters.seed) {
            // Simple deterministic shuffle based on seed
            const seededRandom = (seed) => {
                const x = Math.sin(seed++) * 10000;
                return x - Math.floor(x);
            };
            allProducts.sort((a, b) => seededRandom(a.created_at?.length || 1) - 0.5);
        } else if (filters.sortPrice === 'asc') {
            allProducts.sort((a, b) => Number(a.price) - Number(b.price));
        } else if (filters.sortPrice === 'desc') {
            allProducts.sort((a, b) => Number(b.price) - Number(a.price));
        } else {
            // Default sort: newest first
            allProducts.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        }

        const paginatedProducts = allProducts.slice(from, to);

        return {
            products: paginatedProducts,
            hasMore: allProducts.length > to,
            total: allProducts.length
        };
    } catch (error) {
        console.error('Error in fetchProductsPaginated:', error);
        return { products: [], hasMore: false, total: 0 };
    }
};

export const subscribeToProducts = (callback) => {
    const q = query(collection(db, 'products'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        // Mock payload structure to match Supabase's expected format in some UI components
        snapshot.docChanges().forEach(change => {
            const payload = {
                eventType: change.type === 'added' ? 'INSERT' : change.type === 'modified' ? 'UPDATE' : 'DELETE',
                new: change.type !== 'removed' ? { id: change.doc.id, ...change.doc.data() } : null,
                old: change.type === 'removed' ? { id: change.doc.id } : null
            };
            callback(payload);
        });
    });

    return unsubscribe;
};

export const subscribeToProduct = (id, callback) => {
    const docRef = doc(db, 'products', String(id));
    
    // Initial fetch
    getDoc(docRef).then(docSnap => {
        if (docSnap.exists()) {
            callback({ id: docSnap.id, ...docSnap.data() });
        } else {
            callback(null);
        }
    }).catch(err => {
        console.error('Error fetching product:', err);
        callback(null);
    });

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            callback({ id: docSnap.id, ...docSnap.data() });
        } else {
            callback(null);
        }
    });

    return unsubscribe;
};

export const subscribeToHero = (callback) => {
    const q = query(collection(db, 'hero'), orderBy('sort_order', 'asc'));
    
    // Initial fetch
    getDocs(q).then(snapshot => {
        callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }).catch(err => console.error('Error fetching hero:', err));

    const unsubscribe = onSnapshot(q, (snapshot) => {
        callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return unsubscribe;
};
