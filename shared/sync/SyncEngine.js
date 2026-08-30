import { SyncMetadata } from './SyncMetadata.js';

const SYNC_LOCK_KEY = 'AL_SAEEDAH_GLOBAL_SYNC_LOCK_v1';
const LOCK_TTL = 30000;

/**
 * SyncEngine
 * Orchestrates the incremental synchronization for a single strategy.
 * Enforces sync boundaries and atomic checkpoint advancement.
 */
export class SyncEngine {
    constructor() {
        this._isSyncing = false;
        this._lockInterval = null;
        this._ownerId = Math.random().toString(36).substring(2, 9);
    }

    _acquireLock() {
        if (typeof localStorage === 'undefined') return true; 
        
        const now = Date.now();
        const lockRaw = localStorage.getItem(SYNC_LOCK_KEY);
        let lock = null;
        
        try {
            lock = lockRaw ? JSON.parse(lockRaw) : null;
        } catch (e) {}

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
     * Run synchronization for a given strategy safely.
     * @param {import('./strategies/BaseSyncStrategy.js').BaseSyncStrategy} strategy 
     */
    async sync(strategy) {
        if (this._isSyncing) return;
        
        if (!this._acquireLock()) {
            return; // Another tab is syncing
        }

        this._isSyncing = true;
        const featureName = strategy.getFeatureName();
        const startTime = Date.now();
        
        try {
            const lastSyncAt = await SyncMetadata.getLastSyncAt(featureName);
            
            // Capture a safe upper boundary based on local time.
            const syncBoundary = new Date().toISOString();
            
            // Execute the strategy
            const success = await strategy.execute(lastSyncAt, syncBoundary);
            const durationMs = Date.now() - startTime;
            
            if (success) {
                // Atomic local commit: advance only on full success
                await SyncMetadata.setLastSyncAt(featureName, syncBoundary);
                console.log(`[SyncEngine] Synced ${featureName} successfully. Checkpoint advanced to ${syncBoundary}`);
                import('./SyncDiagnostics.js').then(({ SyncDiagnostics }) => {
                    SyncDiagnostics.logEvent(featureName, 'sync', durationMs, true);
                }).catch(() => {}); // Optional import
            } else {
                console.warn(`[SyncEngine] Sync for ${featureName} failed partially or completely. Checkpoint not advanced.`);
                import('./SyncDiagnostics.js').then(({ SyncDiagnostics }) => {
                    SyncDiagnostics.logEvent(featureName, 'sync', durationMs, false, 'Partial or complete failure');
                }).catch(() => {});
            }
        } catch (error) {
            console.error(`[SyncEngine] Fatal error during sync for strategy:`, error);
            const durationMs = Date.now() - startTime;
            import('./SyncDiagnostics.js').then(({ SyncDiagnostics }) => {
                SyncDiagnostics.logEvent(featureName, 'sync', durationMs, false, error.message);
            }).catch(() => {});
        } finally {
            this._isSyncing = false;
            this._releaseLock();
        }
    }
}
