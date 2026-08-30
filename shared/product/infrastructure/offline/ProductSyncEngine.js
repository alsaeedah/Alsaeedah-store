import { MutationState, MutationOperation } from './ProductMutationTypes.js';
import { ProductConflictResolver } from './ProductConflictResolver.js';

const SYNC_LOCK_KEY = 'AL_SAEEDAH_SYNC_LOCK_v1';
const LOCK_TTL = 30000; // 30 seconds
const MAX_RETRY_COUNT = 15;

export class ProductSyncEngine {
    /**
     * @param {import('./ProductMutationQueue.js').ProductMutationQueue} queue 
     * @param {import('./ProductConnectivityMonitor.js').ProductConnectivityMonitor} monitor 
     * @param {import('../cache/ProductDAL.js').ProductDAL} dal 
     */
    constructor(queue, monitor, dal) {
        this.queue = queue;
        this.monitor = monitor;
        this.dal = dal;
        
        this._isSyncing = false;
        this._lockInterval = null;
        this._ownerId = Math.random().toString(36).substring(2, 9);
        
        this.monitor.onConnectivityChanged((isOnline) => {
            if (isOnline) {
                this.syncNow();
            }
        });
    }

    async start() {
        if (!this.queue.initialized) {
            await this.queue.initialize();
        }
        
        // Attempt initial sync on startup if online
        if (this.monitor.isOnline()) {
            this.syncNow();
        }
    }

    stop() {
        this._releaseLock();
    }

    _acquireLock() {
        if (typeof localStorage === 'undefined') return true; // Server/Node fallback
        
        const now = Date.now();
        const lockRaw = localStorage.getItem(SYNC_LOCK_KEY);
        let lock = null;
        
        try {
            lock = lockRaw ? JSON.parse(lockRaw) : null;
        } catch (e) {}

        if (!lock || now > lock.expiresAt) {
            // Lock is free or expired, acquire it
            localStorage.setItem(SYNC_LOCK_KEY, JSON.stringify({
                ownerId: this._ownerId,
                acquiredAt: now,
                expiresAt: now + LOCK_TTL
            }));
            
            // Periodically renew lock
            if (this._lockInterval) clearInterval(this._lockInterval);
            this._lockInterval = setInterval(() => this._renewLock(), LOCK_TTL / 2);
            
            return true;
        }

        // Lock belongs to someone else
        return lock.ownerId === this._ownerId;
    }

    _renewLock() {
        if (typeof localStorage !== 'undefined') {
            const lockRaw = localStorage.getItem(SYNC_LOCK_KEY);
            try {
                const lock = lockRaw ? JSON.parse(lockRaw) : null;
                if (lock && lock.ownerId === this._ownerId) {
                    lock.expiresAt = Date.now() + LOCK_TTL;
                    localStorage.setItem(SYNC_LOCK_KEY, JSON.stringify(lock));
                }
            } catch (e) {}
        }
    }

    _releaseLock() {
        if (this._lockInterval) {
            clearInterval(this._lockInterval);
            this._lockInterval = null;
        }
        if (typeof localStorage !== 'undefined') {
            const lockRaw = localStorage.getItem(SYNC_LOCK_KEY);
            try {
                const lock = lockRaw ? JSON.parse(lockRaw) : null;
                if (lock && lock.ownerId === this._ownerId) {
                    localStorage.removeItem(SYNC_LOCK_KEY);
                }
            } catch (e) {}
        }
    }

    async syncNow() {
        if (this._isSyncing || !this.monitor.isOnline()) return;
        
        if (!this._acquireLock()) {
            // Another tab is currently handling sync
            return;
        }

        this._isSyncing = true;
        
        try {
            await this._processQueue();
        } finally {
            this._isSyncing = false;
            // We do not release lock here, we keep it while the tab is active 
            // so we don't have to renegotiate constantly. 
            // But if the queue is empty, another tab might want it later.
            // Let's release it when queue is completely empty to allow other tabs.
            if (!this.queue.hasPendingMutations()) {
                this._releaseLock();
            }
        }
    }

    async _processQueue() {
        let mutation = this.queue.getNextEligible();
        
        while (mutation && this.monitor.isOnline()) {
            await this.queue.updateStatus(mutation.id, MutationState.PROCESSING, {
                lastAttemptAt: Date.now()
            });

            const startTime = Date.now();
            const success = await this._executeMutation(mutation);
            const durationMs = Date.now() - startTime;

            if (success) {
                await this.queue.updateStatus(mutation.id, MutationState.COMPLETED);
                // Call post-sync cache invalidation in DAL
                await this.dal._onMutationCompleted(mutation);
                import('../../../sync/SyncDiagnostics.js').then(({ SyncDiagnostics }) => {
                    SyncDiagnostics.logEvent('ProductMutation', mutation.operation, durationMs, true);
                }).catch(() => {});
            } else {
                import('../../../sync/SyncDiagnostics.js').then(({ SyncDiagnostics }) => {
                    SyncDiagnostics.logEvent('ProductMutation', mutation.operation, durationMs, false, 'Mutation execution failed');
                }).catch(() => {});
            }

            mutation = this.queue.getNextEligible();
        }
    }

    async _executeMutation(mutation) {
        try {
            // 1. Check for Conflicts (for UPDATE/DELETE)
            if (mutation.operation === MutationOperation.UPDATE || mutation.operation === MutationOperation.DELETE) {
                const serverData = await this.dal.repository.getById(mutation.productId);
                
                if (ProductConflictResolver.detectConflict(mutation, serverData)) {
                    console.warn(`[SyncEngine] Conflict detected for mutation ${mutation.id} on product ${mutation.productId}`);
                    await this.queue.updateStatus(mutation.id, MutationState.CONFLICT, {
                        lastError: 'Conflict detected: Server state is newer.'
                    });
                    
                    // Call DAL to reconcile (re-fetch to overwrite local optimistic state)
                    await this.dal._onMutationConflict(mutation.productId);
                    return false; // Skip execution, mark handled
                }
            }

            // 2. Execute via DAL internal method (direct to repository)
            await this.dal._executeMutationDirectly(mutation);
            return true;

        } catch (error) {
            // Classify error
            if (this._isPermanentError(error)) {
                console.error(`[SyncEngine] Permanent error for mutation ${mutation.id}:`, error);
                await this.queue.updateStatus(mutation.id, MutationState.FAILED, {
                    lastError: error.message
                });
                return false;
            }

            const retryCount = (mutation.retryCount || 0) + 1;

            if (retryCount >= MAX_RETRY_COUNT) {
                console.error(`[SyncEngine] Mutation ${mutation.id} exceeded max retries. Marking as FAILED.`);
                await this.queue.updateStatus(mutation.id, MutationState.FAILED, {
                    lastError: 'Max retry attempts exceeded: ' + error.message
                });
                return false;
            }

            // Transient error -> retry
            console.warn(`[SyncEngine] Transient error for mutation ${mutation.id}, scheduling retry (${retryCount}/${MAX_RETRY_COUNT}):`, error);
            
            // Exponential backoff: capped at 5 minutes, small jitter
            let backoffMs = Math.pow(2, retryCount) * 1000;
            if (backoffMs > 300000) backoffMs = 300000; // 5 mins
            const jitter = Math.random() * (backoffMs * 0.1);
            
            const nextRetryAt = Date.now() + backoffMs + jitter;

            await this.queue.updateStatus(mutation.id, MutationState.PENDING, {
                retryCount,
                nextRetryAt,
                lastError: error.message
            });

            return false;
        }
    }

    _isPermanentError(error) {
        const msg = error.message ? error.message.toLowerCase() : '';
        // Firestore errors: permission-denied, unauthenticated, invalid-argument
        if (msg.includes('permission-denied') || msg.includes('unauthenticated') || msg.includes('invalid-argument') || msg.includes('missing or insufficient permissions')) {
            return true;
        }
        return false;
    }
}
