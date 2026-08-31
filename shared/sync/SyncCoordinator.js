import { UnifiedSyncEngine } from './engine/UnifiedSyncEngine.js';
import { ConnectivityService } from '../connectivity/ConnectivityService.js';
import { ProductSyncAdapter } from './adapters/ProductSyncAdapter.js';
import { TaxonomySyncAdapter } from './adapters/TaxonomySyncAdapter.js';
import { OrderSyncAdapter } from './adapters/OrderSyncAdapter.js';
import { ProfileSyncAdapter } from './adapters/ProfileSyncAdapter.js';
import { FavoritesSyncAdapter } from './adapters/FavoritesSyncAdapter.js';
import { SettingsSyncAdapter } from './adapters/SettingsSyncAdapter.js';
import { InventorySyncAdapter } from './adapters/InventorySyncAdapter.js';
import { UsersSyncAdapter } from './adapters/UsersSyncAdapter.js';
import { ManagersSyncAdapter } from './adapters/ManagersSyncAdapter.js';

/**
 * SyncCoordinator
 * Central hub for triggering bidirectional synchronization across all active adapters.
 */
export class SyncCoordinator {
    constructor() {
        this.engine = new UnifiedSyncEngine();
        this.adapters = [];
        this.connectivity = ConnectivityService.getInstance();
        
        this.connectivity.subscribe(({ connected }) => {
            if (connected) {
                this.syncAll();
            }
        });
    }

    initialize(db) {
        // Register adapters
        const productAdapter = new ProductSyncAdapter(db);
        this.registerAdapter(productAdapter);

        const favoritesDALWrapper = {
            get initialized() { return window.__favoritesDAL?.initialized || false; },
            get userId() { return window.__favoritesDAL?.userId; },
            get queue() { return window.__favoritesDAL?.queue; },
            initialize: async () => { if (window.__favoritesDAL) await window.__favoritesDAL.initialize(); },
            safeReconcileCache: async (data) => { if (window.__favoritesDAL) await window.__favoritesDAL.safeReconcileCache(data); }
        };
        const favoritesAdapter = new FavoritesSyncAdapter(db, favoritesDALWrapper);
        this.registerAdapter(favoritesAdapter);
        
        const taxonomyAdapter = new TaxonomySyncAdapter(db);
        this.registerAdapter(taxonomyAdapter);
        
        const orderAdapter = new OrderSyncAdapter(db);
        this.registerAdapter(orderAdapter);
        
        const profileAdapter = new ProfileSyncAdapter(db);
        this.registerAdapter(profileAdapter);
        
        const settingsAdapter = new SettingsSyncAdapter(db);
        this.registerAdapter(settingsAdapter);
        
        const inventoryAdapter = new InventorySyncAdapter(db);
        this.registerAdapter(inventoryAdapter);

        const usersAdapter = new UsersSyncAdapter(db);
        this.registerAdapter(usersAdapter);

        const managersAdapter = new ManagersSyncAdapter(db);
        this.registerAdapter(managersAdapter);
    }

    registerAdapter(adapter) {
        this.adapters.push(adapter);
    }

    setFavoritesDAL(dal) {
        const adapter = this.getAdapter('favorites');
        if (adapter) {
            adapter.dal = dal;
        }
    }

    getAdapter(domain) {
        return this.adapters.find(a => a.getDomain() === domain);
    }

    getEngine() {
        return this.engine;
    }

    /**
     * Trigger synchronization for all registered adapters.
     */
    async syncAll() {
        if (!(await this.connectivity.isOnline())) {
            console.log('[SyncCoordinator] Offline. Skipping sync.');
            return;
        }

        for (const adapter of this.adapters) {
            await this.engine.syncAdapter(adapter);
        }
    }

    /**
     * Trigger synchronization for a specific domain.
     */
    async syncDomain(domain) {
        if (!(await this.connectivity.isOnline())) {
            console.log(`[SyncCoordinator] Offline. Skipping sync for ${domain}.`);
            return;
        }

        const adapter = this.getAdapter(domain);
        if (adapter) {
            await this.engine.syncAdapter(adapter);
        }
    }
}

// Singleton instance
export const syncCoordinator = new SyncCoordinator();
