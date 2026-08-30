import { MutationQueue } from '../../../sync/mutation/MutationQueue.js';
import { MutationOperation } from '../../../sync/mutation/MutationTypes.js';

export class ManagersDAL {
    constructor() {
        this.queue = new MutationQueue('managers');
        this.initialized = false;
        this.listeners = new Set();
        this._storageEngine = null;
        this.cacheKey = 'managers_dashboard_cache';
        this.cache = [];
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
            const adapter = syncCoordinator.getAdapter('managers');
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
        } catch (e) {}

        this.queue.onQueueChanged(() => {
            this._notify();
        });
        
        this.initialized = true;
    }

    _notify() {
        const effective = this.getEffectiveManagers();
        this.listeners.forEach(fn => fn(effective));
    }

    onChange(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    getEffectiveManagers() {
        let effectiveMap = new Map();
        for (const item of this.cache) {
            effectiveMap.set(String(item.id), item);
        }

        const pending = this.queue.getAllPendingMutations();
        for (const mut of pending) {
            if (mut.operation === MutationOperation.CREATE) {
                effectiveMap.set(String(mut.documentId), { ...mut.payload, id: mut.documentId });
            } else if (mut.operation === MutationOperation.UPDATE) {
                const existing = effectiveMap.get(String(mut.documentId)) || {};
                effectiveMap.set(String(mut.documentId), { ...existing, ...mut.payload });
            } else if (mut.operation === MutationOperation.DELETE) {
                effectiveMap.delete(String(mut.documentId));
            }
        }

        return Array.from(effectiveMap.values());
    }

    async createManager(manager, documentId) {
        if (!this.initialized) await this.initialize();
        const { ConnectivityService } = await import('../../../connectivity/ConnectivityService.js');
        await ConnectivityService.getInstance().requireOnline();
        
        const mutation = { operation: MutationOperation.CREATE, documentId, payload: manager };
        const { syncCoordinator } = await import('../../../sync/SyncCoordinator.js');
        const adapter = syncCoordinator.getAdapter('managers');
        if (adapter) {
            await adapter.executeMutation(mutation);
            await adapter.onMutationCompleted(mutation);
        }
    }

    async updateManager(managerId, updates) {
        if (!this.initialized) await this.initialize();
        const { ConnectivityService } = await import('../../../connectivity/ConnectivityService.js');
        await ConnectivityService.getInstance().requireOnline();
        
        const mutation = { operation: MutationOperation.UPDATE, documentId: managerId, payload: updates };
        const { syncCoordinator } = await import('../../../sync/SyncCoordinator.js');
        const adapter = syncCoordinator.getAdapter('managers');
        if (adapter) {
            await adapter.executeMutation(mutation);
            await adapter.onMutationCompleted(mutation);
        }
    }

    async deleteManager(managerId) {
        if (!this.initialized) await this.initialize();
        const { ConnectivityService } = await import('../../../connectivity/ConnectivityService.js');
        await ConnectivityService.getInstance().requireOnline();
        
        const mutation = { operation: MutationOperation.DELETE, documentId: managerId, payload: {} };
        const { syncCoordinator } = await import('../../../sync/SyncCoordinator.js');
        const adapter = syncCoordinator.getAdapter('managers');
        if (adapter) {
            await adapter.executeMutation(mutation);
            await adapter.onMutationCompleted(mutation);
        }
    }

    async reconcileCache(serverManagers) {
        if (!this.initialized) await this.initialize();
        this.cache = serverManagers;
        try {
            const storage = await this._getStorageEngine();
            await storage.set(this.cacheKey, this.cache);
        } catch(e) {}
        this._notify();
    }
}
