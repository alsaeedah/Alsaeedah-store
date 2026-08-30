import { MutationQueue } from '../../../sync/mutation/MutationQueue.js';
import { MutationOperation } from '../../../sync/mutation/MutationTypes.js';

export class OrderDAL {
    constructor() {
        this.queue = new MutationQueue('orders');
        this.cache = [];
        this.initialized = false;
        this.listeners = new Set();
        this._storageEngine = null;
        this.cacheKey = 'orders_dashboard_cache';
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
        
        try {
            const { syncCoordinator } = await import('../../../sync/SyncCoordinator.js');
            const adapter = syncCoordinator.getAdapter('orders');
            if (adapter && adapter.setDal) {
                adapter.setDal(this);
            }
        } catch(e) {}
        
        try {
            const storage = await this._getStorageEngine();
            const saved = await storage.get(this.cacheKey);
            if (saved && Array.isArray(saved)) {
                this.cache = saved;
            }
        } catch (e) {
            // Context might not be browser
        }

        this.queue.onQueueChanged(() => {
            this._notify();
        });
        
        this.initialized = true;
    }

    _notify() {
        const effective = this.getEffectiveOrders();
        this.listeners.forEach(fn => fn(effective));
    }

    onChange(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    getEffectiveOrders() {
        let effectiveMap = new Map();
        for (const item of this.cache) {
            effectiveMap.set(String(item.id), item);
        }

        const pending = this.queue.getAllPendingMutations();
        for (const mut of pending) {
            if (mut.operation === MutationOperation.UPDATE) {
                const existing = effectiveMap.get(String(mut.documentId)) || {};
                effectiveMap.set(String(mut.documentId), { ...existing, ...mut.payload });
            } else if (mut.operation === MutationOperation.BATCH) {
                const ops = mut.payload.operations || [];
                for (const op of ops) {
                    if (op.collection === 'orders' && op.operation === MutationOperation.CREATE) {
                        effectiveMap.set(String(op.documentId), { ...op.payload, id: op.documentId, isPendingNetwork: true });
                    }
                }
            }
        }

        const result = Array.from(effectiveMap.values());
        result.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        return result;
    }

    async createOrder(orderData, requestId) {
        if (!this.initialized) await this.initialize();
        
        const { ConnectivityService } = await import('../../../connectivity/ConnectivityService.js');
        await ConnectivityService.getInstance().requireOnline();
        
        // Batch creation: Order + Stats
        const operations = [
            {
                operation: MutationOperation.CREATE,
                collection: 'orders',
                documentId: orderData.id,
                payload: orderData
            },
            {
                operation: MutationOperation.UPDATE,
                collection: 'stats',
                documentId: 'store',
                payload: { ordersCount: { $increment: 1 } }
            }
        ];
        
        const mutation = {
            operation: MutationOperation.BATCH,
            payload: { operations }
        };

        const { syncCoordinator } = await import('../../../sync/SyncCoordinator.js');
        const adapter = syncCoordinator.getAdapter('orders');
        if (adapter) {
            await adapter.executeMutation(mutation);
            await adapter.onMutationCompleted(mutation);
        }
    }

    async updateOrderStatus(orderId, newStatus) {
        if (!this.initialized) await this.initialize();
        
        const { ConnectivityService } = await import('../../../connectivity/ConnectivityService.js');
        await ConnectivityService.getInstance().requireOnline();

        const payload = {
            status: newStatus,
            updated_at: new Date().toISOString()
        };

        const mutation = {
            operation: MutationOperation.UPDATE,
            documentId: orderId,
            payload
        };

        const { syncCoordinator } = await import('../../../sync/SyncCoordinator.js');
        const adapter = syncCoordinator.getAdapter('orders');
        if (adapter) {
            await adapter.executeMutation(mutation);
            await adapter.onMutationCompleted(mutation);
        }
    }

    async reconcileCache(serverOrders) {
        if (!this.initialized) await this.initialize();
        this.cache = serverOrders;
        try {
            const storage = await this._getStorageEngine();
            await storage.set(this.cacheKey, this.cache);
        } catch(e) {}
        this._notify();
    }
}
