import { UnifiedSyncEngine } from './engine/UnifiedSyncEngine.js';
import { ConnectivityService } from '../connectivity/ConnectivityService.js';
import { ProductSyncAdapter } from './adapters/ProductSyncAdapter.js';
import { TaxonomySyncAdapter } from './adapters/TaxonomySyncAdapter.js';
import { OrderSyncAdapter } from './adapters/OrderSyncAdapter.js';
import { ProfileSyncAdapter } from './adapters/ProfileSyncAdapter.js';
import { SettingsSyncAdapter } from './adapters/SettingsSyncAdapter.js';
import { InventorySyncAdapter } from './adapters/InventorySyncAdapter.js';
import { UsersSyncAdapter } from './adapters/UsersSyncAdapter.js';
import { ManagersSyncAdapter } from './adapters/ManagersSyncAdapter.js';

/**
 * SyncCoordinator
 * 
 * Central hub for triggering bidirectional synchronization across all registered adapters.
 * 
 * Key invariants:
 *  - One adapter per sync domain (Map-based idempotent registration).
 *  - Authenticated sync only allowed when `isReady === true`.
 *  - `isReady` is set only after Background Validation confirms a valid session.
 *  - Per-adapter error isolation: one adapter failure does not block others.
 *  - Connectivity events cannot trigger authenticated sync before `markReady()`.
 */
export class SyncCoordinator {
    constructor() {
        this.engine = new UnifiedSyncEngine();

        /**
         * Single source of truth for registered adapters.
         * Key: adapter.getDomain() (string)
         * Value: adapter instance
         * 
         * Guarantees exactly one adapter per domain regardless of how many
         * times registerAdapter() is called for the same domain.
         */
        this.adaptersMap = new Map();

        this.connectivity = ConnectivityService.getInstance();

        /**
         * isReady — Represents that an authenticated and valid application session
         * exists and synchronization is permitted.
         * 
         * Lifecycle:
         *   instantiated           → isReady = false
         *   initialize(db) called  → isReady still false (adapters registered, no auth yet)
         *   Background Validation succeeds → markReady(auth) → isReady = true
         *   user logs out          → markNotReady() → isReady = false
         *   connectivity event     → checked against isReady before syncAll()
         */
        this.isReady = false;

        // Connectivity listener: only triggers syncAll when authenticated session exists.
        this.connectivity.subscribe(({ connected }) => {
            if (connected && this.isReady) {
                console.log('[SyncCoordinator] Connectivity restored. Triggering sync.');
                this.syncAll().catch(err => {
                    console.error('[SyncCoordinator] Connectivity-triggered syncAll failed:', err);
                });
            }
        });
    }

    /**
     * markReady — Called by StartupProvider after Background Validation succeeds.
     * Sets isReady = true, permitting authenticated synchronization.
     * 
     * @param {object} auth - Firebase Auth instance (stored for future reference if needed).
     */
    markReady(auth) {
        this.auth = auth;
        this.isReady = true;
        console.log('[SyncCoordinator] Marked as ready. Authenticated sync now permitted.');
    }

    /**
     * markNotReady — Called when the user logs out or validation fails.
     * Prevents further authenticated synchronization until next markReady().
     */
    markNotReady() {
        this.isReady = false;
        this.auth = null;
        console.log('[SyncCoordinator] Marked as not ready. Authenticated sync blocked.');
    }

    /**
     * initialize — Registers all adapters for the application.
     * Called from main.jsx before React mounts.
     * 
     * Because isReady = false at this point, no sync will execute.
     * All registrations are idempotent — safe to call multiple times.
     * 
     * @param {object} db - Firestore DB instance.
     */
    initialize(db) {
        if (this._isInitialized) {
            console.log('[SyncCoordinator] Already initialized. Skipping duplicate initialization.');
            return;
        }
        this._isInitialized = true;
        console.log('[SYNC] INITIALIZED - Registering adapters (pre-auth).');
        this.registerAdapter(new ProductSyncAdapter(db));
        this.registerAdapter(new TaxonomySyncAdapter(db));
        this.registerAdapter(new OrderSyncAdapter(db));
        this.registerAdapter(new ProfileSyncAdapter(db));
        this.registerAdapter(new SettingsSyncAdapter(db));
        this.registerAdapter(new InventorySyncAdapter(db));
        this.registerAdapter(new UsersSyncAdapter(db));
        this.registerAdapter(new ManagersSyncAdapter(db));
        console.log(`[SyncCoordinator] ${this.adaptersMap.size} adapters registered (sync not yet permitted).`);
    }

    /**
     * registerAdapter — Idempotent adapter registration.
     * 
     * If an adapter for the same domain is already registered, the duplicate
     * is rejected and the existing adapter is returned.
     * 
     * @param {object} adapter - Adapter instance implementing getDomain().
     * @returns {object} The registered adapter (existing or new).
     */
    registerAdapter(adapter) {
        const domain = adapter.getDomain();

        if (this.adaptersMap.has(domain)) {
            console.warn(`[SyncCoordinator] Adapter for domain '${domain}' already registered. Skipping duplicate.`);
            return this.adaptersMap.get(domain);
        }

        this.adaptersMap.set(domain, adapter);
        console.log(`[SyncCoordinator] Adapter registered for domain: '${domain}'.`);
        return adapter;
    }

    /**
     * getAdapter — Retrieve the registered adapter for a domain.
     * @param {string} domain
     * @returns {object|undefined}
     */
    getAdapter(domain) {
        return this.adaptersMap.get(domain);
    }

    /**
     * getRegisteredAdapterCount — Read-only helper for tests and diagnostics.
     * @returns {number}
     */
    getRegisteredAdapterCount() {
        return this.adaptersMap.size;
    }

    getEngine() {
        return this.engine;
    }

    /**
     * syncAll — Trigger synchronization for all registered adapters.
     * 
     * Guards:
     *  - isReady: blocks unauthenticated sync.
     *  - isOnline: skips when offline.
     * 
     * Error isolation: each adapter runs in its own try/catch.
     * A failure in one domain does not prevent others from syncing.
     */
    async syncAll() {
        if (!this.isReady) {
            console.log('[SyncCoordinator] Not ready (no authenticated session). Skipping syncAll.');
            return;
        }

        if (!(await this.connectivity.isOnline())) {
            console.log('[SyncCoordinator] Offline. Skipping syncAll.');
            return;
        }

        for (const adapter of this.adaptersMap.values()) {
            const domain = adapter.getDomain();
            const t0 = Date.now();
            try {
                await this.engine.syncAdapter(adapter);
                console.log(`[Sync][${domain}] Completed in ${Date.now() - t0}ms.`);
            } catch (error) {
                console.error(
                    `[Sync][${domain}] Failed after ${Date.now() - t0}ms:`,
                    error.message,
                    error.stack
                );
                // Continue with remaining adapters.
            }
        }
    }

    /**
     * syncDomain — Trigger synchronization for a specific domain.
     * 
     * @param {string} domain
     */
    async syncDomain(domain) {
        if (!this.isReady) {
            console.log(`[SyncCoordinator] Not ready. Skipping syncDomain('${domain}').`);
            return;
        }

        if (!(await this.connectivity.isOnline())) {
            console.log(`[SyncCoordinator] Offline. Skipping syncDomain('${domain}').`);
            return;
        }

        const adapter = this.adaptersMap.get(domain);
        if (!adapter) {
            console.warn(`[SyncCoordinator] No adapter registered for domain '${domain}'.`);
            return;
        }

        const t0 = Date.now();
        try {
            await this.engine.syncAdapter(adapter);
            console.log(`[Sync][${domain}] syncDomain completed in ${Date.now() - t0}ms.`);
        } catch (error) {
            console.error(
                `[Sync][${domain}] syncDomain failed after ${Date.now() - t0}ms:`,
                error.message,
                error.stack
            );
        }
    }
}

// Singleton instance — shared across the entire application.
export const syncCoordinator = new SyncCoordinator();
