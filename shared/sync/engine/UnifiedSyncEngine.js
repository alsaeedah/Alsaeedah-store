import { SyncMetadata } from '../SyncMetadata.js';
import { MutationQueue } from '../mutation/MutationQueue.js';
import { MutationState, MutationOperation } from '../mutation/MutationTypes.js';

const SYNC_LOCK_KEY = 'AL_SAEEDAH_SYNC_LOCK_v1';
const LOCK_TTL = 30000; // 30 seconds
const MAX_RETRY_COUNT = 15;

export class UnifiedSyncEngine {
    constructor() {
        this._isSyncing = false;
        this._lockInterval = null;
        this._ownerId = Math.random().toString(36).substring(2, 9);
        this.queues = new Map(); // domain -> MutationQueue
    }

    _getQueue(domain) {
        if (!this.queues.has(domain)) {
            this.queues.set(domain, new MutationQueue(domain));
        }
        return this.queues.get(domain);
    }

    _acquireLock() {
        if (typeof localStorage === 'undefined') return true; 
        
        const now = Date.now();
        const lockRaw = localStorage.getItem(SYNC_LOCK_KEY);
        let lock = null;
        
        try { lock = lockRaw ? JSON.parse(lockRaw) : null; } catch (e) {}

        if (!lock || now > lock.expiresAt) {
            localStorage.setItem(SYNC_LOCK_KEY, JSON.stringify({
                ownerId: this._ownerId,
                acquiredAt: now,
                expiresAt: now + LOCK_TTL
            }));
            
            if (this._lockInterval) clearInterval(this._lockInterval);
            this._lockInterval = setInterval(() => this._renewLock(), LOCK_TTL / 2);
            return true;
        }

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

    /**
     * Executes the full bidirectional sync flow for a given adapter.
     */
    async syncAdapter(adapter) {
        if (this._isSyncing) return;
        
        if (!this._acquireLock()) {
            return; // Another instance is syncing
        }

        this._isSyncing = true;
        const domain = adapter.getDomain();
        
        try {
            // 1. Process Outbound Mutations
            await this._processOutboundMutations(adapter);

            // 2. Process Inbound Synchronization (if implemented)
            await this._processInboundSynchronization(adapter);

        } catch (error) {
            console.error(`[UnifiedSyncEngine] Fatal error during sync for ${domain}:`, error);
        } finally {
            this._isSyncing = false;
            
            // Release lock if no pending mutations
            const queue = this._getQueue(domain);
            if (!queue.hasPendingMutations()) {
                this._releaseLock();
            }
        }
    }

    async _processOutboundMutations(adapter) {
        const domain = adapter.getDomain();
        const queue = this._getQueue(domain);
        
        if (!queue.initialized) await queue.initialize();

        let mutation = queue.getNextEligible();
        
        while (mutation) {
            await queue.updateStatus(mutation.id, MutationState.PROCESSING, {
                lastAttemptAt: Date.now()
            });

            const startTime = Date.now();
            const success = await this._executeSingleMutation(adapter, queue, mutation);
            const durationMs = Date.now() - startTime;

            if (success) {
                // Rule 8: Firestore write succeeds -> confirm state -> cache -> UI -> COMPLETED
                // The adapter's onMutationCompleted handles cache & UI
                await adapter.onMutationCompleted(mutation);
                await queue.updateStatus(mutation.id, MutationState.COMPLETED);
                
                import('../SyncDiagnostics.js').then(({ SyncDiagnostics }) => {
                    SyncDiagnostics.logEvent(`${domain}Mutation`, mutation.operation, durationMs, true);
                }).catch(() => {});
            }

            mutation = queue.getNextEligible();
        }
    }

    async _executeSingleMutation(adapter, queue, mutation) {
        try {
            // 1. Conflict Check (Server Wins policy via adapter)
            if (mutation.operation === MutationOperation.UPDATE || mutation.operation === MutationOperation.DELETE) {
                // Need to fetch latest server data to check conflict
                let serverData = null;
                try {
                    // Try to get from adapter if it supports direct fetch
                    if (adapter.dal && adapter.dal.repository) {
                        const entity = await adapter.dal.repository.getById(mutation.documentId);
                        serverData = entity && !entity._deleted ? entity : null;
                    }
                } catch(e) {}
                
                if (adapter.detectConflict(mutation, serverData)) {
                    console.warn(`[UnifiedSyncEngine] Conflict detected for mutation ${mutation.id} on ${mutation.domain}:${mutation.documentId}`);
                    await queue.updateStatus(mutation.id, MutationState.CONFLICT, {
                        lastError: 'Conflict detected: Server state is newer.'
                    });
                    
                    // Reconcile
                    await adapter.resolveConflict(mutation, serverData);
                    return false;
                }
            }

            // 2. Execute
            await adapter.executeMutation(mutation);
            return true;

        } catch (error) {
            // Permanent vs Transient Check
            if (this._isPermanentError(error)) {
                console.error(`[UnifiedSyncEngine] Permanent error for mutation ${mutation.id}:`, error);
                await queue.updateStatus(mutation.id, MutationState.FAILED, { lastError: error.message });
                return false;
            }

            const retryCount = (mutation.retryCount || 0) + 1;

            if (retryCount >= MAX_RETRY_COUNT) {
                console.error(`[UnifiedSyncEngine] Mutation ${mutation.id} exceeded max retries. Marking as FAILED.`);
                await queue.updateStatus(mutation.id, MutationState.FAILED, { lastError: 'Max retry attempts exceeded: ' + error.message });
                return false;
            }

            // Exponential backoff
            let backoffMs = Math.pow(2, retryCount) * 1000;
            if (backoffMs > 300000) backoffMs = 300000; // 5 mins
            const jitter = Math.random() * (backoffMs * 0.1);
            const nextRetryAt = Date.now() + backoffMs + jitter;

            await queue.updateStatus(mutation.id, MutationState.PENDING, {
                retryCount,
                nextRetryAt,
                lastError: error.message
            });

            return false;
        }
    }

    _isPermanentError(error) {
        const msg = error.message ? error.message.toLowerCase() : '';
        return msg.includes('permission-denied') || msg.includes('unauthenticated') || msg.includes('invalid-argument') || msg.includes('missing or insufficient permissions');
    }

    async _processInboundSynchronization(adapter) {
        const domain = adapter.getDomain();
        if (adapter.getChangeDetectionMechanism() === 'none') {
            return;
        }

        const lastSyncAt = await SyncMetadata.getLastSyncAt(domain);
        const syncBoundary = new Date().toISOString();
        
        try {
            const success = await adapter.syncInbound(lastSyncAt, syncBoundary);
            
            if (success) {
                await SyncMetadata.setLastSyncAt(domain, syncBoundary);
                console.log(`[UnifiedSyncEngine] Synced ${domain} successfully. Checkpoint advanced to ${syncBoundary}`);
            } else {
                console.warn(`[UnifiedSyncEngine] Sync for ${domain} failed. Checkpoint not advanced.`);
            }
        } catch(error) {
            console.error(`[UnifiedSyncEngine] Inbound sync error for ${domain}:`, error);
        }
    }
}
