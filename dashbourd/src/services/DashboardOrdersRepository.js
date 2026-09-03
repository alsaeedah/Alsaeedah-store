import { db } from '../firebase/config.js';
import { collection, query, where, getDocs, limit, startAfter, orderBy } from 'firebase/firestore';
import { StorageEngine } from '../../../shared/storage/StorageEngine.js';

class DashboardOrdersRepository {
    constructor() {
        this.activeRequests = new Map();
        this.cacheGenerations = new Map();
        this.deletedOrderIds = new Set();
    }

    buildCacheKey(statusFilter, searchQuery, page) {
        return `dashboard_orders_${statusFilter}_q${searchQuery.trim().toLowerCase()}_p${page}`;
    }

    async getCachedOrders(cacheKey) {
        try {
            const cached = await StorageEngine.get(cacheKey);
            if (!cached || typeof cached !== 'object') {
                return { status: 'UNINITIALIZED', data: [], hasMore: false, lastValidatedAt: null };
            }
            if (!Array.isArray(cached.data) && !Array.isArray(cached)) {
                return { status: 'UNINITIALIZED', data: [], hasMore: false, lastValidatedAt: null };
            }
            
            let dataToFilter = Array.isArray(cached.data) ? cached.data : cached;
            const filtered = dataToFilter.filter(o => !this.deletedOrderIds.has(o.id));
            
            return {
                status: cached.status || 'READY',
                data: filtered,
                hasMore: cached.hasMore || false,
                lastValidatedAt: cached.lastValidatedAt || null
            };
        } catch (e) {
            console.warn(`[DashboardOrdersRepository] Failed to read cache for ${cacheKey}`, e);
            return { status: 'UNINITIALIZED', data: [], hasMore: false, lastValidatedAt: null };
        }
    }

    async revalidateOrders(cacheKey, statusFilter, searchQuery, page, lastDocRef, cachedOrders) {
        if (this.activeRequests.has(cacheKey)) {
            return this.activeRequests.get(cacheKey);
        }

        const generation = (this.cacheGenerations.get(cacheKey) || 0) + 1;
        this.cacheGenerations.set(cacheKey, generation);

        const requestPromise = this._executeRevalidation(cacheKey, statusFilter, searchQuery, page, lastDocRef, cachedOrders, generation);
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
            } catch (err) {
                const isIndexError = err.code === 'failed-precondition' || (err.message && err.message.includes('index'));
                if (!isIndexError) {
                    throw err; // Network, permission, or other errors should not trigger fallback
                }
                
                console.warn("[DashboardOrdersRepository] Index missing, attempting fallback query:", err);
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
                return await this.getCachedOrders(cacheKey);
            }

            if (serverDocs.length === 0 && page === 0) {
                const emptyState = { status: 'EMPTY', data: [], hasMore: false, lastValidatedAt: new Date().toISOString() };
                await StorageEngine.set(cacheKey, emptyState);
                return { ...emptyState, lastDocRefObj: null, error: null };
            }

            const latestCache = await this.getCachedOrders(cacheKey);
            const reconciledData = this._reconcile(latestCache.data || [], serverDocs);
            const hasMore = isFallback ? (snapshot.docs.length > (page + 1) * 6) : (serverDocs.length === 6);
            
            const persistState = {
                status: 'READY',
                data: reconciledData,
                hasMore,
                lastValidatedAt: new Date().toISOString()
            };

            await StorageEngine.set(cacheKey, persistState);
            
            return {
                ...persistState,
                lastDocRefObj: isFallback ? null : (serverDocs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null),
                error: null
            };

        } catch (err) {
            console.error(`[DashboardOrdersRepository] Validation failed for ${cacheKey}.`, err);
            
            const latestCache = await this.getCachedOrders(cacheKey);
            const hasCachedData = latestCache.status !== 'UNINITIALIZED';
            
            if (hasCachedData) {
                return {
                    status: 'STALE',
                    data: latestCache.data,
                    hasMore: latestCache.hasMore,
                    lastValidatedAt: latestCache.lastValidatedAt,
                    error: err,
                    lastDocRefObj: null
                };
            }
            
            return {
                status: 'ERROR',
                data: [],
                hasMore: false,
                lastValidatedAt: null,
                error: err,
                lastDocRefObj: null
            };
        }
    }

    _reconcile(localData, serverData) {
        if (!localData || localData.length === 0) {
            return serverData.filter(s => !this.deletedOrderIds.has(s.id));
        }

        const reconciledMap = new Map(localData.map(item => [item.id, item]));
        
        serverData.forEach(serverItem => {
            if (this.deletedOrderIds.has(serverItem.id)) return;

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
            if (!this.deletedOrderIds.has(serverItem.id)) {
                finalData.push(reconciledMap.get(serverItem.id));
            }
        });

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
        try {
            const { writeBatch, doc, increment, getDoc } = await import('firebase/firestore');
            
            const orderRef = doc(db, 'orders', orderId);
            const orderSnap = await getDoc(orderRef);
            
            if (!orderSnap.exists()) {
                this.deletedOrderIds.add(orderId);
                return { success: true, orderId };
            }

            const batch = writeBatch(db);
            batch.delete(orderRef);

            const statsRef = doc(db, 'stats', 'store');
            const updates = { ordersCount: increment(-1) };
            if (orderStatus === 'completed') {
                updates.revenue = increment(-(Number(orderTotal) || 0));
            }
            batch.set(statsRef, updates, { merge: true });

            await batch.commit();

            this.deletedOrderIds.add(orderId);

            try {
                const { EntityStore } = await import('../../../shared/storage/EntityStore.js');
                await EntityStore.remove('order', orderId);
            } catch (e) {
                console.warn("[DashboardOrdersRepository] Failed to clear EntityStore:", e);
            }

            return { success: true, orderId };
        } catch (error) {
            console.error("[DashboardOrdersRepository] deleteOrder error:", error);
            return { success: false, error };
        }
    }

    // Lifecycle subscription management
    subscribe(cacheKey, statusFilter, searchQuery, page, lastDocRef, cachedOrders, callback) {
        if (!this.subscribers) this.subscribers = new Map();
        if (!this.subscribers.has(cacheKey)) {
            this.subscribers.set(cacheKey, new Set());
        }
        
        const subParams = { statusFilter, searchQuery, page, lastDocRef, cachedOrders, callback };
        this.subscribers.get(cacheKey).add(subParams);
        
        return () => {
            const subs = this.subscribers.get(cacheKey);
            if (subs) {
                subs.delete(subParams);
                if (subs.size === 0) this.subscribers.delete(cacheKey);
            }
        };
    }

    async _revalidateActiveSubscribers() {
        if (!this.subscribers) return;
        
        for (const [cacheKey, subs] of this.subscribers.entries()) {
            if (subs.size === 0) continue;
            
            // Just take the first sub's params as they share the cacheKey logic
            const subParams = Array.from(subs)[0];
            try {
                const validated = await this.revalidateOrders(
                    cacheKey, 
                    subParams.statusFilter, 
                    subParams.searchQuery, 
                    subParams.page, 
                    subParams.lastDocRef, 
                    subParams.cachedOrders
                );
                
                if (validated) {
                    for (const s of subs) {
                        try { s.callback(validated); } catch { /* ignore */ }
                    }
                }
            } catch (e) {
                console.warn(`[DashboardOrdersRepository] Background revalidation failed for ${cacheKey}`, e);
            }
        }
    }
}

export const dashboardOrdersRepository = new DashboardOrdersRepository();

// Integrate with lifecycle events for active queries
import { lifecycleCoordinator } from '../../../shared/startup/LifecycleCoordinator.js';
lifecycleCoordinator.subscribe(() => {
    dashboardOrdersRepository._revalidateActiveSubscribers();
});

