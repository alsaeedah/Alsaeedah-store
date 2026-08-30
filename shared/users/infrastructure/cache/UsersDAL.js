import { MutationQueue } from '../../../sync/mutation/MutationQueue.js';
import { MutationOperation } from '../../../sync/mutation/MutationTypes.js';

export class UsersDAL {
    constructor() {
        this.queue = new MutationQueue('users');
        this.initialized = false;
        this.listeners = new Set();
        this._storageEngine = null;
        this.cacheKey = 'users_dashboard_cache';
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
            const adapter = syncCoordinator.getAdapter('users');
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
        const effective = this.getEffectiveUsers();
        this.listeners.forEach(fn => fn(effective));
    }

    onChange(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    getEffectiveUsers() {
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

    async createUser(user, documentId) {
        if (!this.initialized) await this.initialize();
        const { ConnectivityService } = await import('../../../connectivity/ConnectivityService.js');
        await ConnectivityService.getInstance().requireOnline();

        const mutation = { operation: MutationOperation.CREATE, documentId, payload: user };
        const { syncCoordinator } = await import('../../../sync/SyncCoordinator.js');
        const adapter = syncCoordinator.getAdapter('users');
        if (adapter) {
            await adapter.executeMutation(mutation);
            await adapter.onMutationCompleted(mutation);
        }
    }

    async deleteUser(userId) {
        if (!this.initialized) await this.initialize();
        const { ConnectivityService } = await import('../../../connectivity/ConnectivityService.js');
        await ConnectivityService.getInstance().requireOnline();

        const mutation = { operation: MutationOperation.DELETE, documentId: userId, payload: {} };
        const { syncCoordinator } = await import('../../../sync/SyncCoordinator.js');
        const adapter = syncCoordinator.getAdapter('users');
        if (adapter) {
            await adapter.executeMutation(mutation);
            await adapter.onMutationCompleted(mutation);
        }
    }

    async reconcileCache(serverUsers) {
        if (!this.initialized) await this.initialize();
        this.cache = serverUsers;
        try {
            const storage = await this._getStorageEngine();
            await storage.set(this.cacheKey, this.cache);
        } catch(e) {}
        this._notify();
    }
}
