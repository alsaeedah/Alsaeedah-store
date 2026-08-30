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

        const mutation = {
            documentId,
            operation: isFav ? MutationOperation.DELETE : MutationOperation.CREATE,
            payload: isFav ? { 
                product_id: String(product.id),
                user_id: this.userId
            } : {
                user_id: this.userId,
                product_id: String(product.id),
                product_data: product,
                updated_at: new Date().toISOString()
            }
        };

        const { syncCoordinator } = await import('../../../sync/SyncCoordinator.js');
        const adapter = syncCoordinator.getAdapter('favorites');
        
        if (adapter) {
            await adapter.executeMutation(mutation);
            await adapter.onMutationCompleted(mutation);
        }
    }

    async reconcileCache(serverFavorites) {
        if (!this.initialized) await this.initialize();
        this.cache = serverFavorites;
        const storage = await this._getStorageEngine();
        await storage.set(this.cacheKey, this.cache);
        this._notify();
    }
}
