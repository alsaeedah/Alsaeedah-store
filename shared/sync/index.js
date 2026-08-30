import { syncCoordinator } from './SyncCoordinator.js';
import { ProductSyncAdapter } from './adapters/ProductSyncAdapter.js';
import { TaxonomySyncStrategy } from './strategies/TaxonomySyncStrategy.js';
import { ProfileSyncStrategy } from './strategies/ProfileSyncStrategy.js';
import { OrderSyncStrategy } from './strategies/OrderSyncStrategy.js';
import { SettingsSyncStrategy } from './strategies/SettingsSyncStrategy.js';
import { InventorySyncStrategy } from './strategies/InventorySyncStrategy.js';

let initialized = false;

/**
 * Initializes the SyncCoordinator with all adapters.
 * To be called during application startup.
 */
export const bootstrapSync = (db, auth) => {
    if (initialized) return;

    syncCoordinator.registerAdapter(new ProductSyncAdapter(db));
    syncCoordinator.registerAdapter(new TaxonomySyncStrategy(db));
    syncCoordinator.registerAdapter(new ProfileSyncStrategy(db, auth));
    syncCoordinator.registerAdapter(new OrderSyncStrategy(db, auth));
    syncCoordinator.registerAdapter(new SettingsSyncStrategy(db));
    syncCoordinator.registerAdapter(new InventorySyncStrategy(db));

    // Trigger initial sync
    syncCoordinator.syncAll().catch(console.error);

    initialized = true;
};

export { syncCoordinator };
