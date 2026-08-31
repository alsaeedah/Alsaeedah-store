import { MutationQueue } from '../../../sync/mutation/MutationQueue.js';
import { MutationOperation } from '../../../sync/mutation/MutationTypes.js';

export class FavoritesDAL {
    constructor(userId) {
        this.userId = userId;
        this.queue = new MutationQueue('favorites');
        this.cacheKey = `favorites_${userId}`;
        this.cache = [];
        this.initialized = false;
        this.listeners = new Set();
        this._storageEngine = null;
    }

    async _getStorageEngine() {
        if (!this._storageEngine) {
            const { StorageEngine } = await import('../../../storage/StorageEngine.js');
            this._storageEngine = StorageEngine;
        }
        return this._storageEngine;
    }

    async initialize() {
        if (this.initialized) return;
        await this.queue.initialize();
        const storage = await this._getStorageEngine();
        const cached = await storage.get(this.cacheKey);
        if (cached && Array.isArray(cached)) {
            this.cache = cached;
        }
        
        // Listen to queue changes to re-compute effective state
        this.queue.onQueueChanged(() => {
            this._notify();
        });
        
        this.initialized = true;
    }

    _notify() {
        const effective = this.getEffectiveFavorites();
        this.listeners.forEach(fn => fn(effective));
    }

    onChange(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    getEffectiveFavorites() {
        let effectiveMap = new Map();
        
        // Add cache items
        for (const item of this.cache) {
            effectiveMap.set(String(item.id), item);
        }

        const pending = this.queue.getAllPendingMutations();

        // Overlay pending mutations (assuming sequential execution)
        for (const mut of pending) {
            const { operation, payload } = mut;
            if (operation === MutationOperation.CREATE) {
                effectiveMap.set(String(payload.product_id), { ...payload.product_data, id: payload.product_id });
            } else if (operation === MutationOperation.DELETE) {
                effectiveMap.delete(String(payload.product_id));
            }
        }
        return Array.from(effectiveMap.values());
    }

    async toggleFavorite(product) {
        if (!this.initialized) await this.initialize();

        const { ConnectivityService } = await import('../../../connectivity/ConnectivityService.js');
        await ConnectivityService.getInstance().requireOnline();

        const effective = this.getEffectiveFavorites();
        const isFav = effective.some(f => String(f.id) === String(product.id));
        const documentId = `${this.userId}_${product.id}`;

        const operation = isFav ? MutationOperation.DELETE : MutationOperation.CREATE;
        const payload = isFav ? { 
            product_id: String(product.id),
            user_id: this.userId
        } : {
            user_id: this.userId,
            product_id: String(product.id),
            product_data: product,
            updated_at: new Date().toISOString()
        };

        // 1. Durably queue the mutation to IndexedDB
        const mutation = await this.queue.enqueue(operation, documentId, payload);
        console.log(`[FavoritesDAL] mutation enqueued { id: '${mutation.id}', op: '${operation}', doc: '${documentId}' }`);

        // 2. Notify listeners for optimistic UI update immediately
        this._notify();

        // 3. Trigger immediate best-effort outbound sync
        console.log(`[FavoritesDAL] triggering favorites sync (best-effort)`);
        const { syncCoordinator } = await import('../../../sync/SyncCoordinator.js');
        syncCoordinator.syncDomain('favorites').catch(err => {
            console.error('[FavoritesDAL] Background sync domain failed:', err);
        });
    }

    async safeReconcileCache(serverFavorites) {
        if (!this.initialized) await this.initialize();
        
        const pendingMutations = this.queue.getAllPendingMutations();
        
        const pendingCreates = pendingMutations
            .filter(m => m.operation === MutationOperation.CREATE)
            .map(m => ({ ...m.payload.product_data, id: m.payload.product_id }));
            
        const pendingDeleteIds = pendingMutations
            .filter(m => m.operation === MutationOperation.DELETE)
            .map(m => String(m.payload.product_id));

        // Start from server state, remove items with pending DELETEs
        const merged = serverFavorites.filter(item => !pendingDeleteIds.includes(String(item.id)));
        
        // Add pending CREATEs not yet confirmed by server
        for (const pc of pendingCreates) {
            if (!merged.find(s => String(s.id) === String(pc.id))) {
                merged.push(pc);
            }
        }
        
        this.cache = merged;
        const storage = await this._getStorageEngine();
        await storage.set(this.cacheKey, this.cache);
        this._notify();
    }
}
