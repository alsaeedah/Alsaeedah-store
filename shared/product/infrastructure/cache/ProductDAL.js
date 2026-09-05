import { StorageEngine } from '../../../storage/StorageEngine.js';
import { EntityStore } from '../../../storage/EntityStore.js';
import { QueryIndexStore } from '../../../storage/QueryIndexStore.js';
import { ProductCacheRegistry } from './ProductCacheRegistry.js';
import { MutationQueue, MutationOperation } from '../../../sync/mutation/index.js';
import { syncCoordinator } from '../../../sync/index.js';
import { lifecycleCoordinator } from '../../../startup/LifecycleCoordinator.js';

const CACHE_VERSION = 'v1';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const STATS_TTL_MS = 30 * 1000; // 30 seconds for stats

function deterministicStringify(obj) {
    if (obj === null || typeof obj !== 'object') {
        return String(obj);
    }
    if (Array.isArray(obj)) {
        return '[' + obj.map(deterministicStringify).join(',') + ']';
    }
    const keys = Object.keys(obj).sort();
    let str = '{';
    for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
        if (obj[k] !== undefined) {
            str += `"${k}":${deterministicStringify(obj[k])},`;
        }
    }
    return str + '}';
}

function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
}

export class ProductDAL {
    constructor(repository, storageEngine = StorageEngine) {
        this.repository = repository;
        this.storage = storageEngine;
        this.registry = new ProductCacheRegistry(storageEngine);
        this.pendingRequests = new Map();
        this.revalidationRequests = new Map();
        this.cacheSubscribers = new Map();
        this.mutationEpoch = 0;

        // Initialize generic offline infrastructure
        this.queue = new MutationQueue('products');
        
        // Wait for initialize then attach to adapter
        this.queue.initialize().then(() => {
            const adapter = syncCoordinator.getAdapter('products');
            if (adapter) {
                adapter.setDal(this);
            }
        }).catch(console.error);

        // Listen to queue changes to re-emit cache so SWR updates optimistically
        this.queue.onQueueChanged(() => {
            this._notifyAllSubscribers();
        });

        // Listen to lifecycle events for automatic background revalidation
        lifecycleCoordinator.subscribe((reason) => {
            this._revalidateActiveSubscribers(reason);
        });
    }

    async _revalidateActiveSubscribers(reason) {
        // console.log(`[ProductDAL] Lifecycle event '${reason}' triggered revalidation for active subscribers.`);
        for (const [key, cacheEntry] of this.cacheSubscribers.entries()) {
            if (cacheEntry.fetcher && cacheEntry.type) {
                // Background revalidate skips TTL check
                this._revalidate(key, cacheEntry.fetcher, cacheEntry.type);
            }
        }
    }
    
    _notifyAllSubscribers() {
        for (const [key, cacheEntry] of this.cacheSubscribers.entries()) {
            QueryIndexStore.get('product_query', key).then(async cachedRaw => {
                const cached = await this._hydrateData(cachedRaw);
                if (cached && this._isValidCacheEntry(cached)) {
                    const typePart = cacheEntry.type || key.split('_')[2];
                    const optData = this._applyOptimisticState(cached.data, typePart);
                    cacheEntry.subs.forEach(sub => sub.callback(optData));
                }
            }).catch(() => {});
        }
    }

    _applyOptimisticState(data, type) {
        if (!this.queue || !this.queue.initialized) return data;
        
        if (type === 'detail' || type === 'details') {
            const documentId = data ? data.id : null;
            if (!documentId) return data;

            const mutations = this.queue.getPendingMutationsForDocument(documentId);
            if (mutations.length === 0) return data;

            let result = data ? { ...data } : null;
            let deleted = false;

            for (const mut of mutations) {
                if (mut.operation === MutationOperation.CREATE) {
                    result = { id: mut.documentId, ...mut.payload, _isOptimistic: true };
                    deleted = false;
                } else if (mut.operation === MutationOperation.UPDATE) {
                    if (!result) result = { id: mut.documentId };
                    result = { ...result, ...mut.payload, _isOptimistic: true };
                    deleted = false;
                } else if (mut.operation === MutationOperation.DELETE) {
                    deleted = true;
                    result = null;
                }
            }

            return deleted ? null : result;
        } 
        
        if (type === 'list' || type === 'lists' || type === 'ids' || type === 'latest' || type === 'bestsellers' || type === 'related') {
            if (data && typeof data === 'object' && !Array.isArray(data) && Array.isArray(data.products)) {
                return {
                    ...data,
                    products: this._applyOptimisticList(data.products)
                };
            }
            if (Array.isArray(data)) {
                return this._applyOptimisticList(data);
            }
            return data;
        }
        
        return data;
    }

    _applyOptimisticList(arr) {
        if (!arr) return arr;
        let result = [...arr];
        const pending = this.queue.getAllPendingMutations();
        
        pending.forEach(mut => {
            if (mut.operation === MutationOperation.DELETE) {
                result = result.filter(p => String(p.id) !== String(mut.documentId));
            } else if (mut.operation === MutationOperation.UPDATE) {
                const idx = result.findIndex(p => String(p.id) === String(mut.documentId));
                if (idx !== -1) {
                    result[idx] = { ...result[idx], ...mut.payload, _isOptimistic: true };
                }
            }
        });
        
        const creates = pending.filter(m => m.operation === MutationOperation.CREATE);
        creates.reverse().forEach(mut => {
            if (!result.find(p => String(p.id) === String(mut.documentId))) {
                result.unshift({ id: mut.documentId, ...mut.payload, _isOptimistic: true });
            }
        });
        
        return result;
    }

    _subscribeToCache(key, fetcher, type, callback, options = {}) {
        if (!this.cacheSubscribers.has(key)) {
            this.cacheSubscribers.set(key, { subs: new Set(), fetcher, type });
        }
        const cacheEntry = this.cacheSubscribers.get(key);
        const subObj = { callback };
        cacheEntry.subs.add(subObj);
        
        // Immediately fetch data and pass to callback
        const fetchPromise = this._fetchWithCache(key, fetcher, { type, ...options }).then(data => {
            if (cacheEntry.subs.has(subObj)) {
                callback(data);
            }
            return data;
        }).catch(err => {
            console.warn(`[ProductDAL] Initial SWR fetch failed for ${key}`, err);
            if (options.onError && cacheEntry.subs.has(subObj)) {
                options.onError(err);
            }
            throw err;
        });

        const unsubscribe = () => {
            cacheEntry.subs.delete(subObj);
            if (cacheEntry.subs.size === 0) {
                this.cacheSubscribers.delete(key);
            }
        };
        unsubscribe.fetchPromise = fetchPromise;
        return unsubscribe;
    }

    async _dedup(key, fetchPromiseFactory) {
        if (this.pendingRequests.has(key)) {
            return this.pendingRequests.get(key);
        }
        const promise = fetchPromiseFactory().finally(() => {
            this.pendingRequests.delete(key);
        });
        this.pendingRequests.set(key, promise);
        return promise;
    }

    _isValidCacheEntry(cached) {
        if (!cached || typeof cached !== 'object') return false;
        if (cached.version !== CACHE_VERSION) return false;
        if (typeof cached.timestamp !== 'number' || !Number.isFinite(cached.timestamp) || cached.timestamp <= 0) {
            return false;
        }
        if (cached.data === undefined) return false;
        return true;
    }

    async _hydrateData(cachedData) {
        if (!cachedData || !cachedData.data) return cachedData;
        const data = cachedData.data;

        if (data._isEntityRef) {
            const entity = await EntityStore.get('product', data.id);
            return { ...cachedData, data: entity };
        } else if (data._isEntityList) {
            const entities = await EntityStore.getMany('product', data.ids);
            return { ...cachedData, data: entities.filter(Boolean) };
        } else if (data._isEntityListWrapper) {
            const entities = await EntityStore.getMany('product', data.products);
            return { ...cachedData, data: { ...data, products: entities.filter(Boolean) } };
        }

        return cachedData;
    }

    async _fetchWithCache(key, fetcher, options = {}) {
        const { type = 'lists', customTTL = CACHE_TTL_MS, forceRevalidate = false } = options;

        let cachedRaw;
        try {
            cachedRaw = await QueryIndexStore.get('product_query', key);
        } catch (err) {}

        const cached = await this._hydrateData(cachedRaw);

        const isValid = this._isValidCacheEntry(cached) && 
                        (cached.data !== null && cached.data !== undefined) &&
                        !(cachedRaw && cachedRaw.data._isEntityListWrapper && cached.data.products.length !== cachedRaw.data.products.length) &&
                        !(cachedRaw && cachedRaw.data._isEntityList && cached.data.length !== cachedRaw.data.ids.length);

        if (cachedRaw && !isValid) {
            QueryIndexStore.remove('product_query', key).catch(() => {});
            this.registry.remove(type, key).catch(() => {});
        }

        if (isValid) {
            this._registerCache(type, key);
            
            if (forceRevalidate) {
                return this._dedup(key, async () => {
                    try {
                        const freshData = await fetcher();
                        await this._setCacheSafe(key, freshData, type);
                        this._registerCache(type, key);
                        return this._applyOptimisticState(freshData, type.substring(0, type.length - 1));
                    } catch (err) {
                        const { ConnectivityService } = await import('../../../connectivity/ConnectivityService.js');
                        const isOnline = await ConnectivityService.getInstance().isOnline();

                        if (isOnline) {
                            console.error(`[ProductDAL] Force revalidation failed while online for ${key}. Throwing error:`, err);
                            throw err;
                        } else {
                            console.warn(`[ProductDAL] Force revalidation failed offline for ${key}, falling back to cache:`, err);
                            const staleData = this._applyOptimisticState(cached.data, type.substring(0, type.length - 1));
                            if (staleData && typeof staleData === 'object') {
                                staleData._isStaleCache = true;
                            }
                            return staleData;
                        }
                    }
                });
            }

            const now = Date.now();
            const isStale = (now - cached.timestamp > customTTL);

            if (!isStale) {
                return this._applyOptimisticState(cached.data, type.substring(0, type.length - 1));
            }
            this._revalidate(key, fetcher, type);
            const staleData = this._applyOptimisticState(cached.data, type.substring(0, type.length - 1));
            if (staleData && typeof staleData === 'object') {
                staleData._isStaleCache = true;
            }
            return staleData;
        }

        return this._dedup(key, async () => {
            const freshData = await fetcher();
            await this._setCacheSafe(key, freshData, type);
            this._registerCache(type, key);
            return this._applyOptimisticState(freshData, type.substring(0, type.length - 1));
        });
    }

    async _revalidate(key, fetcher, type) {
        if (this.revalidationRequests.has(key)) {
            return this.revalidationRequests.get(key);
        }

        const epochAtStart = this.mutationEpoch;

        const promise = (async () => {
            try {
                const freshData = await fetcher();
                
                if (epochAtStart !== this.mutationEpoch) {
                    return; 
                }

                let currentCachedRaw;
                try { currentCachedRaw = await QueryIndexStore.get('product_query', key); } catch (err) {}
                
                const currentCached = await this._hydrateData(currentCachedRaw);

                if (currentCached && deterministicStringify(currentCached.data) === deterministicStringify(freshData)) {
                    await this._setCacheSafe(key, freshData, type);
                    return; 
                }

                await this._setCacheSafe(key, freshData, type);
                this._registerCache(type, key);

                const cacheEntry = this.cacheSubscribers.get(key);
                if (cacheEntry && cacheEntry.subs) {
                    const optData = this._applyOptimisticState(freshData, type.substring(0, type.length - 1));
                    cacheEntry.subs.forEach(sub => sub.callback(optData));
                }
            } catch (err) {
                console.warn(`[ProductDAL] Background revalidation failed for ${key}:`, err);
            }
        })();

        this.revalidationRequests.set(key, promise);
        promise.finally(() => this.revalidationRequests.delete(key));

        return promise;
    }

    async _setCacheSafe(key, data, type) {
        try {
            let dehydratedData = data;
            
            if (type === 'details' && data && data.id) {
                await EntityStore.set('product', data);
                dehydratedData = { _isEntityRef: true, id: data.id };
            } 
            else if (['lists', 'latest', 'bestsellers', 'related'].includes(type)) {
                let productsToExtract = [];
                if (Array.isArray(data)) {
                    productsToExtract = data;
                    dehydratedData = { _isEntityList: true, ids: data.map(p => p.id) };
                } else if (data && Array.isArray(data.products)) {
                    productsToExtract = data.products;
                    dehydratedData = { 
                        ...data, 
                        products: data.products.map(p => p.id),
                        _isEntityListWrapper: true 
                    };
                }
                
                if (productsToExtract.length > 0) {
                    await EntityStore.setMany('product', productsToExtract);
                }
            }

            await QueryIndexStore.set('product_query', key, {
                version: CACHE_VERSION,
                timestamp: Date.now(),
                data: dehydratedData
            });
        } catch (err) {}
    }

    async _registerCache(type, key) {
        try {
            const evictedKeys = await this.registry.access(type, key);
            if (evictedKeys && evictedKeys.length > 0) {
                await Promise.all(evictedKeys.map(k => QueryIndexStore.remove('product_query', k).catch(() => {})));
            }
        } catch (e) {}
    }

    async _invalidateGroups(types) {
        for (const type of types) {
            try {
                const keys = await this.registry.getAllKeys(type);
                if (keys.length > 0) {
                    await Promise.all(keys.map(k => this.storage.remove(k).catch(() => {})));
                    await this.registry.clearType(type);
                }
            } catch (e) {}
        }
    }

    async getById(id) {
        const mutations = this.queue.getPendingMutationsForDocument(id);
        const creates = mutations.filter(m => m.operation === MutationOperation.CREATE);
        
        if (creates.length > 0) {
            const opt = this._applyOptimisticState({ id }, 'detail');
            if (opt && opt._isOptimistic && !opt._deleted) {
                return opt;
            }
        }

        const key = `product_cache_detail_${CACHE_VERSION}_${id}`;
        return this._fetchWithCache(key, () => this.repository.getById(id), { type: 'details' });
    }

    async getByIds(ids) {
        if (!ids || ids.length === 0) return [];
        const sortedIds = [...ids].sort();
        const key = `product_cache_ids_${CACHE_VERSION}_${hashString(sortedIds.join(','))}`;
        return this._fetchWithCache(key, () => this.repository.getByIds(ids), { type: 'lists' });
    }

    async getPaginated(filters, page, limit, cursor = null) {
        const serialized = deterministicStringify({ filters, page, limit, cursor });
        const key = `product_cache_list_${CACHE_VERSION}_${hashString(serialized)}`;
        return this._fetchWithCache(key, () => this.repository.getPaginated(filters, limit, cursor), { type: 'lists' });
    }

    async getLatest(limitCount = 6) {
        const key = `product_cache_latest_${CACHE_VERSION}_${limitCount}`;
        return this._fetchWithCache(key, () => this.repository.getLatest(limitCount), { type: 'latest' });
    }

    async getBestSellers(limitCount = 6) {
        const key = `product_cache_bestsellers_${CACHE_VERSION}_${limitCount}`;
        return this._fetchWithCache(key, () => this.repository.getBestSellers(limitCount), { type: 'bestsellers' });
    }

    async getRelated(id, limitCount = 12) {
        const key = `product_cache_related_${CACHE_VERSION}_${id}_${limitCount}`;
        return this._fetchWithCache(key, () => this.repository.getRelated(id, limitCount), { type: 'related' });
    }

    async getStats() {
        const key = `product_cache_stats_${CACHE_VERSION}`;
        return this._fetchWithCache(key, () => this.repository.getStats(), { customTTL: STATS_TTL_MS, type: 'stats' });
    }

    async getAvailableBrandIds(categoryIds) {
        if (!categoryIds || categoryIds === 'all') return null;
        if (Array.isArray(categoryIds) && categoryIds.length === 0) return null;
        
        const serialized = deterministicStringify(categoryIds);
        const key = `product_cache_brands_${CACHE_VERSION}_${hashString(serialized)}`;
        return this._fetchWithCache(key, () => this.repository.getAvailableBrandIds(categoryIds), { type: 'lists' });
    }

    subscribeToList(filters, callback) {
        return this.repository.subscribeToList(filters, (data) => {
            if (filters?.usePayloadFormat || filters?.useDocChanges) {
                callback(data); 
            } else {
                callback(this._applyOptimisticList(data));
            }
        });
    }

    subscribeToDetail(id, callback) {
        return this.repository.subscribeToDetail(id, (data) => {
            const opt = this._applyOptimisticState(data || { id }, 'detail');
            callback(opt);
        });
    }

    async create(productData) {
        const { ConnectivityService } = await import('../../../connectivity/ConnectivityService.js');
        await ConnectivityService.getInstance().requireOnline();
        
        // Normalize gender before sending to repository and cache
        const { normalizeGender } = await import('../FirestoreProductRepository.js');
        const gender = normalizeGender(productData.genderId || productData.gender);
        const normalizedPayload = { ...productData, gender, genderId: gender };

        this.mutationEpoch++;
        const documentId = await this.repository.create(normalizedPayload);
        
        await this._onMutationCompleted({
            operation: MutationOperation.CREATE,
            documentId,
            payload: normalizedPayload
        });
        
        syncCoordinator.syncDomain('products');
        return documentId;
    }

    async update(id, productData) {
        const { ConnectivityService } = await import('../../../connectivity/ConnectivityService.js');
        await ConnectivityService.getInstance().requireOnline();

        // Normalize gender before sending to repository and cache
        const { normalizeGender } = await import('../FirestoreProductRepository.js');
        const gender = normalizeGender(productData.genderId || productData.gender);
        const normalizedPayload = { ...productData, gender, genderId: gender };

        this.mutationEpoch++;
        await this.repository.update(id, normalizedPayload);
        
        await this._onMutationCompleted({
            operation: MutationOperation.UPDATE,
            documentId: id,
            payload: normalizedPayload
        });
        
        syncCoordinator.syncDomain('products');
    }

    async delete(id) {
        const { ConnectivityService } = await import('../../../connectivity/ConnectivityService.js');
        await ConnectivityService.getInstance().requireOnline();

        this.mutationEpoch++;
        await this.repository.delete(id);
        
        await this._onMutationCompleted({
            operation: MutationOperation.DELETE,
            documentId: id,
            payload: null
        });
        
        syncCoordinator.syncDomain('products');
    }

    async getFilteredIds(filters, cap = 500) {
        return this.repository.getFilteredIds(filters, cap);
    }

    async deleteMany(ids) {
        const { ConnectivityService } = await import('../../../connectivity/ConnectivityService.js');
        await ConnectivityService.getInstance().requireOnline();

        const result = await this.repository.deleteMany(ids);
        const { deletedIds } = result;

        if (deletedIds.length > 0) {
            this.mutationEpoch++;

            for (const id of deletedIds) {
                const detailKey = `product_cache_detail_v1_${id}`;
                try { await QueryIndexStore.remove('product_query', detailKey); } catch (_) {}
                try { await EntityStore.remove('product', id); } catch (_) {}
                try { await this.registry.remove('details', detailKey); } catch (_) {}
                await this._removeIdFromLists(id);
            }

            await this._staleGroups(['lists', 'latest', 'bestsellers', 'related', 'stats']);

            this._notifyAllSubscribers();
            syncCoordinator.syncDomain('products');
        }

        return result;
    }

    async _executeMutationDirectly(mutation) {
    }

    async _addIdToLists(id) {
        try {
            const types = ['lists', 'latest', 'bestsellers', 'related'];
            for (const type of types) {
                const keys = await this.registry.getAllKeys(type);
                for (const key of keys) {
                    const cached = await QueryIndexStore.get('product_query', key);
                    if (cached && cached.data) {
                        let changed = false;
                        if (cached.data._isEntityList && !cached.data.ids.includes(id)) {
                            cached.data.ids.unshift(id);
                            changed = true;
                        } else if (cached.data._isEntityListWrapper && !cached.data.products.includes(id)) {
                            cached.data.products.unshift(id);
                            changed = true;
                        }
                        if (changed) {
                            await QueryIndexStore.set('product_query', key, cached);
                        }
                    }
                }
            }
        } catch(e) {}
    }

    async _removeIdFromLists(id) {
        try {
            const types = ['lists', 'latest', 'bestsellers', 'related'];
            for (const type of types) {
                const keys = await this.registry.getAllKeys(type);
                for (const key of keys) {
                    const cached = await QueryIndexStore.get('product_query', key);
                    if (cached && cached.data) {
                        let changed = false;
                        if (cached.data._isEntityList && cached.data.ids.includes(id)) {
                            cached.data.ids = cached.data.ids.filter(i => i !== id);
                            changed = true;
                        } else if (cached.data._isEntityListWrapper && cached.data.products.includes(id)) {
                            cached.data.products = cached.data.products.filter(i => i !== id);
                            changed = true;
                        }
                        if (changed) {
                            await QueryIndexStore.set('product_query', key, cached);
                        }
                    }
                }
            }
        } catch(e) {}
    }

    /**
     * _addIdsToLists — Batch version of _addIdToLists for use during initial sync.
     * 
     * Reads each cached list ONCE, applies all IDs in the chunk as a Set-merge,
     * then writes back ONCE per list — replacing O(N × lists) with O(chunks × lists).
     * 
     * Processes ids in bounded chunks and yields to the event loop between chunks
     * to prevent blocking the Android WebView during large initial product syncs.
     * 
     * @param {string[]} ids - Array of product IDs to add to all cached lists.
     */
    async _addIdsToLists(ids) {
        if (!ids || ids.length === 0) return;

        const LIST_CHUNK_SIZE = 100;
        const types = ['lists', 'latest', 'bestsellers', 'related'];

        try {
            for (let i = 0; i < ids.length; i += LIST_CHUNK_SIZE) {
                const chunk = ids.slice(i, i + LIST_CHUNK_SIZE);
                const chunkSet = new Set(chunk);

                for (const type of types) {
                    const keys = await this.registry.getAllKeys(type);
                    for (const key of keys) {
                        const cached = await QueryIndexStore.get('product_query', key);
                        if (cached && cached.data) {
                            let changed = false;

                            if (cached.data._isEntityList) {
                                const existingSet = new Set(cached.data.ids);
                                const newIds = chunk.filter(id => !existingSet.has(id));
                                if (newIds.length > 0) {
                                    cached.data.ids = [...newIds, ...cached.data.ids];
                                    changed = true;
                                }
                            } else if (cached.data._isEntityListWrapper) {
                                const existingSet = new Set(cached.data.products);
                                const newIds = chunk.filter(id => !existingSet.has(id));
                                if (newIds.length > 0) {
                                    cached.data.products = [...newIds, ...cached.data.products];
                                    changed = true;
                                }
                            }

                            if (changed) {
                                await QueryIndexStore.set('product_query', key, cached);
                            }
                        }
                    }
                }

                // Yield to event loop between chunks to keep WebView responsive.
                if (i + LIST_CHUNK_SIZE < ids.length) {
                    await new Promise(r => setTimeout(r, 0));
                }
            }
        } catch (e) {
            console.warn('[ProductDAL] _addIdsToLists failed (non-fatal):', e);
        }
    }

    /**
     * _removeIdsFromLists — Batch version of _removeIdFromLists for use during initial sync.
     * 
     * Reads each cached list ONCE, removes all IDs in the chunk in a single filter pass,
     * then writes back ONCE per list.
     * 
     * @param {string[]} ids - Array of product IDs to remove from all cached lists.
     */
    async _removeIdsFromLists(ids) {
        if (!ids || ids.length === 0) return;

        const LIST_CHUNK_SIZE = 100;
        const types = ['lists', 'latest', 'bestsellers', 'related'];

        try {
            for (let i = 0; i < ids.length; i += LIST_CHUNK_SIZE) {
                const chunk = ids.slice(i, i + LIST_CHUNK_SIZE);
                const chunkSet = new Set(chunk);

                for (const type of types) {
                    const keys = await this.registry.getAllKeys(type);
                    for (const key of keys) {
                        const cached = await QueryIndexStore.get('product_query', key);
                        if (cached && cached.data) {
                            let changed = false;

                            if (cached.data._isEntityList) {
                                const before = cached.data.ids.length;
                                cached.data.ids = cached.data.ids.filter(id => !chunkSet.has(id));
                                changed = cached.data.ids.length !== before;
                            } else if (cached.data._isEntityListWrapper) {
                                const before = cached.data.products.length;
                                cached.data.products = cached.data.products.filter(id => !chunkSet.has(id));
                                changed = cached.data.products.length !== before;
                            }

                            if (changed) {
                                await QueryIndexStore.set('product_query', key, cached);
                            }
                        }
                    }
                }

                // Yield to event loop between chunks.
                if (i + LIST_CHUNK_SIZE < ids.length) {
                    await new Promise(r => setTimeout(r, 0));
                }
            }
        } catch (e) {
            console.warn('[ProductDAL] _removeIdsFromLists failed (non-fatal):', e);
        }
    }


    async _staleGroups(types) {
        for (const type of types) {
            try {
                const keys = await this.registry.getAllKeys(type);
                for (const key of keys) {
                    const cached = await QueryIndexStore.get('product_query', key);
                    if (cached) {
                        cached.timestamp = 0; 
                        await QueryIndexStore.set('product_query', key, cached);
                    }
                }
            } catch (e) {}
        }
    }

    async _onMutationCompleted(mutation) {
        this.mutationEpoch++;
        const id = mutation.documentId;
        
        if (mutation.operation === MutationOperation.UPDATE) {
            try {
                const existing = await EntityStore.get('product', id);
                if (existing) {
                    await EntityStore.set('product', { ...existing, ...mutation.payload });
                } else {
                    await EntityStore.set('product', { id, ...mutation.payload });
                }
            } catch(e) {}
        } else if (mutation.operation === MutationOperation.CREATE) {
            try {
                await EntityStore.set('product', { id, ...mutation.payload });
                await this._addIdToLists(id);
            } catch(e) {}
        } else if (mutation.operation === MutationOperation.DELETE) {
            const detailKey = `product_cache_detail_${CACHE_VERSION}_${id}`;
            await QueryIndexStore.remove('product_query', detailKey).catch(() => {});
            await EntityStore.remove('product', id).catch(() => {});
            await this.registry.remove('details', detailKey).catch(() => {});
            await this._removeIdFromLists(id);
        }
        
        await this._staleGroups(['lists', 'latest', 'bestsellers', 'related', 'stats']);
        
        this._notifyAllSubscribers();
    }

    async _onMutationConflict(documentId) {
        this.mutationEpoch++;
        try {
            const fresh = await this.repository.getById(documentId);
            if (fresh) {
                await EntityStore.set('product', fresh);
            } else {
                await EntityStore.remove('product', documentId);
                await this._removeIdFromLists(documentId);
            }
        } catch(e) {}
        
        await this._staleGroups(['lists', 'latest', 'bestsellers', 'related', 'stats']);
        this._notifyAllSubscribers();
    }

    subscribeToLatestSWR(limitCount, callback) {
        const key = `product_cache_latest_${CACHE_VERSION}_${limitCount}`;
        return this._subscribeToCache(key, () => this.repository.getLatest(limitCount), 'latest', callback);
    }

    subscribeToBestSellersSWR(limitCount, callback) {
        const key = `product_cache_bestsellers_${CACHE_VERSION}_${limitCount}`;
        return this._subscribeToCache(key, () => this.repository.getBestSellers(limitCount), 'bestsellers', callback);
    }

    subscribeToRelatedSWR(id, limitCount, callback) {
        const key = `product_cache_related_${CACHE_VERSION}_${id}_${limitCount}`;
        return this._subscribeToCache(key, () => this.repository.getRelated(id, limitCount), 'related', callback);
    }

    subscribeToStatsSWR(callback) {
        const key = `product_cache_stats_${CACHE_VERSION}`;
        return this._subscribeToCache(key, () => this.repository.getStats(), 'stats', callback);
    }

    subscribeToPaginatedSWR(filters, page, limit, cursor, callback, options = {}) {
        const serialized = deterministicStringify({ filters, page, limit, cursor });
        const key = `product_cache_list_${CACHE_VERSION}_${hashString(serialized)}`;
        return this._subscribeToCache(key, () => this.repository.getPaginated(filters, limit, cursor), 'lists', callback, options);
    }

    subscribeToDetailSWR(id, callback) {
        const key = `product_cache_detail_${CACHE_VERSION}_${id}`;
        return this._subscribeToCache(key, () => this.repository.getById(id), 'details', callback);
    }
}
