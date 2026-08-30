import { MutationQueue } from '../../../sync/mutation/MutationQueue.js';
import { MutationOperation } from '../../../sync/mutation/MutationTypes.js';

export class ProfileDAL {
    constructor() {
        this.queue = new MutationQueue('profile');
        this.initialized = false;
        this.listeners = new Set();
        this.cache = null;
    }

    async initialize() {
        if (this.initialized) return;
        await this.queue.initialize();
        const saved = localStorage.getItem('time-tick-user');
        if (saved) {
            this.cache = JSON.parse(saved);
        }
        
        this.queue.onQueueChanged(() => {
            this._notify();
        });
        
        this.initialized = true;
    }

    _notify() {
        const effective = this.getEffectiveProfile();
        this.listeners.forEach(fn => fn(effective));
    }

    onChange(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    getEffectiveProfile() {
        if (!this.cache) return null;
        let effective = { ...this.cache };
        
        const pending = this.queue.getAllPendingMutations();
        for (const mut of pending) {
            if (mut.operation === MutationOperation.UPDATE) {
                effective = { ...effective, ...mut.payload };
            }
        }
        return effective;
    }

    async updateProfile(userId, updates) {
        if (!this.initialized) await this.initialize();

        const { ConnectivityService } = await import('../../../connectivity/ConnectivityService.js');
        await ConnectivityService.getInstance().requireOnline();

        const mutation = {
            operation: MutationOperation.UPDATE,
            documentId: userId,
            payload: updates
        };

        const { syncCoordinator } = await import('../../../sync/SyncCoordinator.js');
        const adapter = syncCoordinator.getAdapter('profile');
        if (adapter) {
            await adapter.executeMutation(mutation);
            // On success, update local cache directly
            if (this.cache) {
                this.cache = { ...this.cache, ...updates };
                localStorage.setItem('time-tick-user', JSON.stringify(this.cache));
            } else {
                this.cache = { ...updates };
            }
            this._notify();
        }
    }

    async reconcileCache(serverProfile) {
        if (!this.initialized) await this.initialize();
        this.cache = { ...this.cache, ...serverProfile };
        localStorage.setItem('time-tick-user', JSON.stringify(this.cache));
        this._notify();
    }
}
