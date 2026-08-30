import { db } from '../firebase/config';
import { collection, query, where, getDocs, limit, startAfter, orderBy } from 'firebase/firestore';
import { StorageEngine } from '../../../shared/storage/StorageEngine';

class DashboardOrdersRepository {
    constructor() {
        this.activeRequests = new Map();
        this.cacheGenerations = new Map();
    }

    buildCacheKey(statusFilter, searchQuery, page) {
        return `dashboard_orders_${statusFilter}_q${searchQuery.trim().toLowerCase()}_p${page}`;
    }

    async getCachedOrders(cacheKey) {
        try {
            const cached = await StorageEngine.get(cacheKey);
            if (cached && typeof cached === 'object' && cached.status) {
                return cached;
            }
            if (cached && Array.isArray(cached)) {
                return { status: 'READY', data: cached, generation: 0, hasMore: false };
            }
            return { status: 'UNINITIALIZED', data: [], generation: 0, hasMore: false };
        } catch (e) {
            console.warn(`[DashboardOrdersRepository] Failed to read cache for ${cacheKey}`, e);
            return { status: 'UNINITIALIZED', data: [], generation: 0, hasMore: false };
        }
    }

    async revalidateOrders(cacheKey, statusFilter, searchQuery, page, lastDocRef, cachedOrders) {
        const currentGeneration = (this.cacheGenerations.get(cacheKey) || 0) + 1;
        this.cacheGenerations.set(cacheKey, currentGeneration);

        if (this.activeRequests.has(cacheKey)) {
            return this.activeRequests.get(cacheKey);
        }

        const requestPromise = this._executeRevalidation(cacheKey, statusFilter, searchQuery, page, lastDocRef, cachedOrders, currentGeneration);
        this.activeRequests.set(cacheKey, requestPromise);

        try {
            return await requestPromise;
        } finally {
            if (this.activeRequests.get(cacheKey) === requestPromise) {
                this.activeRequests.delete(cacheKey);
            }
        }
    }

    async _executeRevalidation(cacheKey, statusFilter, searchQuery, page, lastDocRef, cachedOrders, generation) {
        try {
            let q = collection(db, 'orders');
            let constraints = [];
            const rawQuery = searchQuery.trim().toLowerCase();
            const numericPart = rawQuery.replace(/^ord/, '').trim();

            if (rawQuery) {
                const isNumericSearch = /^\d+$/.test(numericPart);
                if (isNumericSearch) {
                    const orderNumInt = parseInt(numericPart, 10);
                    constraints.push(where('order_number', 'in', [numericPart, orderNumInt]));
                }
            }

            if (statusFilter !== 'all') {
                constraints.push(where('status', '==', statusFilter));
            }

            let fetchConstraints = [...constraints, orderBy('created_at', 'desc')];
            if (page > 0 && lastDocRef) {
                fetchConstraints.push(startAfter(lastDocRef));
            }
            fetchConstraints.push(limit(6));

            let finalQuery = query(q, ...fetchConstraints);
            let snapshot;
            let isFallback = false;
            let serverDocs = [];
            
            try {
                snapshot = await getDocs(finalQuery);
                serverDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            } catch (e) {
                console.error("[DashboardOrdersRepository] Full fetch failed, attempting fallback query without indexes:", e);
                const fallbackQuery = query(q, limit(50));
                snapshot = await getDocs(fallbackQuery);
                let fetchedOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                
                if (statusFilter !== 'all') {
                    fetchedOrders = fetchedOrders.filter(o => o.status === statusFilter);
                }
                if (rawQuery) {
                    fetchedOrders = fetchedOrders.filter(o => {
                        const oNum = o.order_number ? String(o.order_number).toLowerCase() : '';
                        const oName = o.customer_name ? String(o.customer_name).toLowerCase() : '';
                        const oPhone = o.customer_phone ? String(o.customer_phone).toLowerCase() : '';
                        return oNum.includes(numericPart) || `ord${oNum}`.includes(rawQuery) || oName.includes(rawQuery) || oPhone.includes(rawQuery);
                    });
                }
                fetchedOrders.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
                serverDocs = fetchedOrders.slice(page * 6, (page + 1) * 6);
                isFallback = true;
            }

            if (this.cacheGenerations.get(cacheKey) !== generation) {
                console.warn(`[DashboardOrdersRepository] Dropping stale response for ${cacheKey}`);
                return cachedOrders;
            }

            const reconciledData = this._reconcile(cachedOrders.data || [], serverDocs);
            
            const newCacheState = {
                status: 'READY',
                data: reconciledData,
                generation,
                lastValidatedAt: new Date().toISOString(),
                hasMore: isFallback ? (snapshot.docs.length > (page + 1) * 6) : (serverDocs.length === 6),
                lastDocRefObj: isFallback ? null : (serverDocs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null)
            };

            await StorageEngine.set(cacheKey, newCacheState);
            return newCacheState;

        } catch (e) {
            console.error(`[DashboardOrdersRepository] Validation failed for ${cacheKey}. Preserving LKG cache.`, e);
            return cachedOrders;
        }
    }

    _reconcile(localData, serverData) {
        if (!localData || localData.length === 0) {
            return serverData;
        }

        const reconciledMap = new Map(localData.map(item => [item.id, item]));
        
        serverData.forEach(serverItem => {
            if (reconciledMap.has(serverItem.id)) {
                const localItem = reconciledMap.get(serverItem.id);
                const localUpdate = new Date(localItem.updated_at || 0).getTime();
                const serverUpdate = new Date(serverItem.updated_at || 0).getTime();
                
                if (serverUpdate > localUpdate) {
                    reconciledMap.set(serverItem.id, serverItem);
                }
            } else {
                reconciledMap.set(serverItem.id, serverItem);
            }
        });

        const finalData = [];
        serverData.forEach(serverItem => {
            finalData.push(reconciledMap.get(serverItem.id));
        });

        localData.forEach(localItem => {
            const inServer = serverData.some(s => s.id === localItem.id);
            if (!inServer) {
                if (localItem.status === 'deleted') {
                    // It's explicitly deleted
                } else {
                    // Do not infer deletion just from absence in a bounded paginated response.
                    // However, for query-based caching, if it is absent from the page bounds, 
                    // it shouldn't be rendered on this specific page anymore.
                    // We will drop it from THIS page's cache so the UI stays consistent with the server sorting.
                }
            }
        });

        // The query bounds dictate the exact items that belong on this page.
        // We replace the page contents with the updated mapped items, preserving order.
        return finalData;
    }

    async updateOrderStatus(orderId, newStatus) {
        const { updateDoc, doc } = await import('firebase/firestore');
        await updateDoc(doc(db, 'orders', orderId), { 
            status: newStatus, 
            updated_at: new Date().toISOString() 
        });
    }

    async deleteOrder(orderId, orderTotal, orderStatus) {
        const { updateDoc, doc, setDoc, increment } = await import('firebase/firestore');
        
        // Soft delete
        await updateDoc(doc(db, 'orders', orderId), {
            status: 'deleted',
            updated_at: new Date().toISOString()
        });

        // Update stats
        const updates = { ordersCount: increment(-1) };
        if (orderStatus === 'completed') {
            updates.revenue = increment(-(Number(orderTotal) || 0));
        }
        await setDoc(doc(db, 'stats', 'store'), updates, { merge: true }).catch(e => console.warn(e));
    }
}

export const dashboardOrdersRepository = new DashboardOrdersRepository();
