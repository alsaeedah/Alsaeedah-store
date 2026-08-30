import { collection, doc, query, where, getDocs, getDoc, addDoc, setDoc, updateDoc, deleteDoc, onSnapshot, orderBy, getCountFromServer, limit, documentId, startAfter, writeBatch } from 'firebase/firestore';
import { ProductRepository } from '../repository.js';

export class FirestoreProductRepository extends ProductRepository {
    constructor(db) {
        super();
        this.db = db;
    }

    _isValidFilterValue(value) {
        if (value === undefined || value === null || value === '') return false;
        if (typeof value === 'object') return false; 
        return true;
    }

    async _safeGetDocs(q) {
        const snapshot = await getDocs(q);
        if (snapshot.empty && snapshot.metadata && snapshot.metadata.fromCache) {
            throw new Error("Offline cache miss. Preserving LKG data.");
        }
        return snapshot;
    }

    _isValidFilterArray(val) {
        return Array.isArray(val) && val.length > 0;
    }

    _buildDecomposedQueries(filters, baseConstraints) {
        let catIds = this._isValidFilterArray(filters.categoryIds) ? filters.categoryIds : (this._isValidFilterValue(filters.categoryId) ? [filters.categoryId] : null);
        let brdIds = this._isValidFilterArray(filters.brandIds) ? filters.brandIds : (this._isValidFilterValue(filters.brandId) ? [filters.brandId] : null);
        
        if (!catIds && this._isValidFilterValue(filters.legacyCategory)) catIds = [filters.legacyCategory];
        if (!brdIds && this._isValidFilterValue(filters.legacyStyle)) brdIds = [filters.legacyStyle];

        const queriesParams = []; 

        if (!catIds && !brdIds) {
            queriesParams.push({ constraints: [...baseConstraints], key: 'unfiltered' });
            return queriesParams;
        }

        const chunkArray = (arr, size) => {
            const chunks = [];
            for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
            return chunks;
        };

        if (catIds && !brdIds) {
            chunkArray(catIds, 30).forEach((chunk, i) => {
                queriesParams.push({ constraints: [...baseConstraints, where('categoryId', 'in', chunk)], key: `cat_${i}` });
            });
        } else if (!catIds && brdIds) {
            chunkArray(brdIds, 30).forEach((chunk, i) => {
                queriesParams.push({ constraints: [...baseConstraints, where('brandId', 'in', chunk)], key: `brd_${i}` });
            });
        } else {
            if (catIds.length <= brdIds.length) {
                const chunks = chunkArray(brdIds, 30);
                catIds.forEach(cat => {
                    chunks.forEach((chunk, i) => {
                        queriesParams.push({ constraints: [...baseConstraints, where('categoryId', '==', cat), where('brandId', 'in', chunk)], key: `cat_${cat}_brd_${i}` });
                    });
                });
            } else {
                const chunks = chunkArray(catIds, 30);
                brdIds.forEach(brd => {
                    chunks.forEach((chunk, i) => {
                        queriesParams.push({ constraints: [...baseConstraints, where('brandId', '==', brd), where('categoryId', 'in', chunk)], key: `brd_${brd}_cat_${i}` });
                    });
                });
            }
        }
        return queriesParams;
    }

    async getById(id) {
        const docRef = doc(this.db, 'products', String(id));
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
    }

    async getByIds(ids) {
        if (!ids || ids.length === 0) return [];
        const productsRef = collection(this.db, 'products');
        const chunks = [];
        for (let i = 0; i < ids.length; i += 10) {
            chunks.push(ids.slice(i, i + 10));
        }

        let latestProducts = [];
        for (const chunk of chunks) {
            const q = query(productsRef, where(documentId(), 'in', chunk));
            const snapshot = await this._safeGetDocs(q);
            snapshot.forEach(docSnap => {
                latestProducts.push({ id: docSnap.id, ...docSnap.data() });
            });
        }
        return latestProducts;
    }

    async executeDualQuery(filters) {
        const { categoryId, brandId, collectionId, genderId, legacyCategory, legacyStyle } = filters;
        const productsMap = new Map();

        const fetchQuery = async (constraints) => {
            if (constraints.length === 0) return;
            const q = query(collection(this.db, 'products'), ...constraints);
            const snapshot = await this._safeGetDocs(q);
            snapshot.docs.forEach(d => {
                if (!productsMap.has(d.id)) {
                    productsMap.set(d.id, { id: d.id, ...d.data() });
                }
            });
        };

        const taxonomyConstraints = [];
        if (this._isValidFilterValue(categoryId)) taxonomyConstraints.push(where('categoryId', '==', categoryId));
        if (this._isValidFilterValue(brandId)) taxonomyConstraints.push(where('brandId', '==', brandId));
        if (this._isValidFilterValue(collectionId)) taxonomyConstraints.push(where('collectionId', '==', collectionId));
        if (this._isValidFilterValue(genderId)) taxonomyConstraints.push(where('genderId', '==', genderId));

        if (taxonomyConstraints.length > 0) {
            await fetchQuery(taxonomyConstraints);
        }

        if (this._isValidFilterValue(legacyCategory) || this._isValidFilterValue(legacyStyle)) {
            const legacyConstraints = [];
            if (this._isValidFilterValue(legacyCategory)) legacyConstraints.push(where('category', '==', legacyCategory));
            if (this._isValidFilterValue(legacyStyle)) legacyConstraints.push(where('style', '==', legacyStyle));
            
            if (legacyConstraints.length > 0) {
                await fetchQuery(legacyConstraints);
            }
        }

        if (taxonomyConstraints.length === 0 && !this._isValidFilterValue(legacyCategory) && !this._isValidFilterValue(legacyStyle)) {
            const q = query(collection(this.db, 'products'));
            const snapshot = await this._safeGetDocs(q);
            snapshot.docs.forEach(d => {
                productsMap.set(d.id, { id: d.id, ...d.data() });
            });
        }

        return Array.from(productsMap.values());
    }

    async getPaginated(filters, limitCount, cursor = null) {
        const baseConstraints = [];
        if (this._isValidFilterValue(filters.collectionId)) baseConstraints.push(where('collectionId', '==', filters.collectionId));
        if (this._isValidFilterValue(filters.genderId)) baseConstraints.push(where('genderId', '==', filters.genderId));

        const searchStr = filters.search ? String(filters.search).trim() : '';
        const isNumericSearch = searchStr && /^\d+$/.test(searchStr);

        let sortField = 'created_at';
        let sortDirection = 'desc';
        if (filters.sortPrice === 'asc') { sortField = 'price'; sortDirection = 'asc'; }
        else if (filters.sortPrice === 'desc') { sortField = 'price'; sortDirection = 'desc'; }

        if (isNumericSearch) {
            const numericConstraints = [...baseConstraints];
            let catIds = this._isValidFilterArray(filters.categoryIds) ? filters.categoryIds : (this._isValidFilterValue(filters.categoryId) ? [filters.categoryId] : null);
            let brdIds = this._isValidFilterArray(filters.brandIds) ? filters.brandIds : (this._isValidFilterValue(filters.brandId) ? [filters.brandId] : null);
            
            if (catIds && catIds.length > 0) numericConstraints.push(where('categoryId', 'in', catIds.slice(0, 30)));
            if (brdIds && brdIds.length === 1) numericConstraints.push(where('brandId', '==', brdIds[0]));
            
            numericConstraints.push(where('displayId', '==', Number(searchStr)));
            numericConstraints.push(limit(limitCount + 1));
            
            const exactQ = query(collection(this.db, 'products'), ...numericConstraints);
            let snapshot = await this._safeGetDocs(exactQ);
            let allProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            if (filters.minPrice !== undefined && filters.minPrice !== null) allProducts = allProducts.filter(p => Number(p.price) >= filters.minPrice);
            if (filters.maxPrice !== undefined && filters.maxPrice !== null) allProducts = allProducts.filter(p => Number(p.price) <= filters.maxPrice);
            
            return { products: allProducts.slice(0, limitCount), hasMore: allProducts.length > limitCount, total: 0, nextCursor: null };
        }

        const queriesParams = this._buildDecomposedQueries(filters, baseConstraints);
        queriesParams.forEach(qp => {
            qp.constraints.push(orderBy(sortField, sortDirection));
            qp.constraints.push(orderBy(documentId(), sortDirection));
        });

        let keepFetching = true;
        let perQueryState = {}; 
        
        if (cursor && cursor.isMulti) {
            cursor.perQuery.forEach(c => { perQueryState[c.key] = c; });
        } else if (cursor && !cursor.isMulti && queriesParams.length === 1) {
            perQueryState[queriesParams[0].key] = cursor;
        }

        const needsBatchScanning = !!(searchStr || (filters.minPrice !== undefined && filters.minPrice !== null) || (filters.maxPrice !== undefined && filters.maxPrice !== null));
        const MAX_LIMIT = 10000;
        const BATCH_SIZE = needsBatchScanning ? 30 : Math.min(limitCount + 1, MAX_LIMIT);
        
        let matchedProducts = [];
        let hasMore = false;

        while (keepFetching) {
            const queryPromises = queriesParams.map(async (qp) => {
                const batchConstraints = [...qp.constraints];
                const qCursor = perQueryState[qp.key];
                if (qCursor && qCursor.value !== undefined && qCursor.id !== undefined) {
                    batchConstraints.push(startAfter(qCursor.value, qCursor.id));
                }
                batchConstraints.push(limit(BATCH_SIZE));
                const q = query(collection(this.db, 'products'), ...batchConstraints);
                let snap = await this._safeGetDocs(q);
                return { key: qp.key, docs: snap.docs.map(d => ({ id: d.id, ...d.data(), __queryKey: qp.key })) };
            });

            const results = await Promise.all(queryPromises);
            
            let batchProducts = [];
            const seenIds = new Set(matchedProducts.map(p => p.id));
            
            results.forEach(res => {
                res.docs.forEach(doc => {
                    if (!seenIds.has(doc.id)) {
                        seenIds.add(doc.id);
                        batchProducts.push(doc);
                    }
                });
            });

            if (batchProducts.length === 0) {
                keepFetching = false;
                break;
            }

            if (filters.minPrice !== undefined && filters.minPrice !== null) batchProducts = batchProducts.filter(p => Number(p.price) >= filters.minPrice);
            if (filters.maxPrice !== undefined && filters.maxPrice !== null) batchProducts = batchProducts.filter(p => Number(p.price) <= filters.maxPrice);
            if (searchStr) {
                const term = searchStr.toLowerCase();
                batchProducts = batchProducts.filter(p => (p.name && p.name.toLowerCase().includes(term)) || (p.displayId && String(p.displayId).toLowerCase().includes(term)));
            }

            matchedProducts = [...matchedProducts, ...batchProducts];

            matchedProducts.sort((a, b) => {
                const aVal = a[sortField] ?? '';
                const bVal = b[sortField] ?? '';
                const primary = sortDirection === 'asc' ? (aVal < bVal ? -1 : aVal > bVal ? 1 : 0) : (aVal > bVal ? -1 : aVal < bVal ? 1 : 0);
                if (primary !== 0) return primary;
                return sortDirection === 'asc' ? a.id.localeCompare(b.id) : b.id.localeCompare(a.id);
            });

            let anyQueryHasMore = results.some(res => res.docs.length >= BATCH_SIZE);

            if (matchedProducts.length >= limitCount) {
                hasMore = matchedProducts.length > limitCount || anyQueryHasMore;
                keepFetching = false;
            } else if (!anyQueryHasMore) {
                hasMore = false;
                keepFetching = false;
            } else if (!needsBatchScanning && limitCount >= MAX_LIMIT) {
                hasMore = false;
                keepFetching = false;
            } else {
                results.forEach(res => {
                    if (res.docs.length > 0) {
                        const lastDoc = res.docs[res.docs.length - 1];
                        perQueryState[res.key] = { key: res.key, value: lastDoc[sortField] !== undefined ? lastDoc[sortField] : '', id: lastDoc.id };
                    }
                });
            }
        }

        const paginatedProducts = matchedProducts.slice(0, limitCount);
        
        let nextCursor = null;
        if (hasMore) {
            const nextPerQuery = queriesParams.map(qp => {
                const includedItems = paginatedProducts.filter(p => p.__queryKey === qp.key);
                if (includedItems.length > 0) {
                    const lastIncluded = includedItems[includedItems.length - 1];
                    return { key: qp.key, value: lastIncluded[sortField] !== undefined ? lastIncluded[sortField] : '', id: lastIncluded.id };
                } else {
                    return perQueryState[qp.key] || null;
                }
            }).filter(Boolean);

            if (nextPerQuery.length === 1) {
                nextCursor = { value: nextPerQuery[0].value, id: nextPerQuery[0].id };
            } else {
                nextCursor = { isMulti: true, perQuery: nextPerQuery };
            }
        }
        
        paginatedProducts.forEach(p => delete p.__queryKey);

        return { products: paginatedProducts, hasMore, total: 0, nextCursor };
    }

    async getLatest(limitCount = 6) {
        const q = query(collection(this.db, 'products'), where('is_latest', '==', true));
        const snapshot = await this._safeGetDocs(q);
        const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return products.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    async getAvailableBrandIds(categoryIds) {
        if (!this._isValidFilterArray(categoryIds)) {
            if (this._isValidFilterValue(categoryIds) && categoryIds !== 'all') {
                categoryIds = [categoryIds];
            } else {
                return null;
            }
        }

        const chunks = [];
        for (let i = 0; i < categoryIds.length; i += 30) chunks.push(categoryIds.slice(i, i + 30));

        const brandIds = new Set();
        
        const promises = chunks.map(async chunk => {
            const q = query(collection(this.db, 'products'), where('categoryId', 'in', chunk));
            const snapshot = await this._safeGetDocs(q);
            snapshot.docs.forEach(doc => {
                const data = doc.data();
                if (data.brandId) brandIds.add(data.brandId);
            });
        });

        await Promise.all(promises);
        return Array.from(brandIds);
    }

    async getBestSellers(limitCount = 6) {
        const q = query(collection(this.db, 'products'), where('is_best_seller', '==', true));
        const snapshot = await this._safeGetDocs(q);
        const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return products.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    subscribeToList(filters, callback) {
        let constraints = [];
        
        if (filters && Object.keys(filters).length > 0) {
            if (filters.category && filters.category !== 'all') constraints.push(where('category', '==', filters.category));
            if (filters.style && filters.style !== 'all') constraints.push(where('style', '==', filters.style));
            if (filters.is_hero) {
                constraints.push(orderBy('sort_order', 'asc'));
            }
        }

        const collectionName = filters?.collectionName || 'products';
        const q = query(collection(this.db, collectionName), ...constraints);
        
        if (filters?.initialFetch) {
             getDocs(q).then(snapshot => {
                 callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
             }).catch(err => console.error('Error in initial fetch:', err));
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (filters?.usePayloadFormat) {
                snapshot.docChanges().forEach(change => {
                    const payload = {
                        eventType: change.type === 'added' ? 'INSERT' : change.type === 'modified' ? 'UPDATE' : 'DELETE',
                        new: change.type !== 'removed' ? { id: change.doc.id, ...change.doc.data() } : null,
                        old: change.type === 'removed' ? { id: change.doc.id } : null
                    };
                    callback(payload);
                });
            } else if (filters?.useDocChanges) {
                callback(snapshot); 
            } else {
                callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
            }
        });

        return unsubscribe;
    }

    subscribeToDetail(id, callback) {
        const docRef = doc(this.db, 'products', String(id));
        
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
    }

    async getRelated(id, limitCount = 12) {
        const q = query(collection(this.db, 'products'), limit(limitCount + 1));
        const snapshot = await this._safeGetDocs(q);
        let products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        products = products.filter(p => String(p.id) !== String(id));
        return products.slice(0, limitCount);
    }

    async getStats() {
        const productsRef = collection(this.db, 'products');
        const totalSnap = await getCountFromServer(productsRef);
        
        const menQ = query(productsRef, where('category', '==', 'men'));
        const menSnap = await getCountFromServer(menQ);
        
        const womenQ = query(productsRef, where('category', '==', 'women'));
        const womenSnap = await getCountFromServer(womenQ);
        
        const kidsQ = query(productsRef, where('category', '==', 'kids'));
        const kidsSnap = await getCountFromServer(kidsQ);

        return {
            total: totalSnap.data().count || 0,
            men: menSnap.data().count || 0,
            women: womenSnap.data().count || 0,
            kids: kidsSnap.data().count || 0
        };
    }

    async create(productData) {
        const timestamp = new Date().toISOString();
        const data = { ...productData, created_at: productData.created_at || timestamp, updated_at: timestamp };
        const docRef = await addDoc(collection(this.db, 'products'), data);
        return docRef.id;
    }

    async createWithId(id, productData) {
        const timestamp = new Date().toISOString();
        const data = { ...productData, created_at: productData.created_at || timestamp, updated_at: timestamp };
        const docRef = doc(this.db, 'products', String(id));
        await setDoc(docRef, data);
        return id;
    }

    async update(id, productData) {
        const data = { ...productData, updated_at: new Date().toISOString() };
        const docRef = doc(this.db, 'products', String(id));
        await updateDoc(docRef, data);
    }

    async delete(id) {
        const batch = writeBatch(this.db);
        
        // Delete the product
        const docRef = doc(this.db, 'products', String(id));
        batch.delete(docRef);
        
        // Log the deletion for offline sync
        const changeLogRef = doc(collection(this.db, 'product_changes'));
        batch.set(changeLogRef, {
            productId: String(id),
            type: 'DELETED',
            timestamp: new Date().toISOString()
        });

        await batch.commit();
    }
}
