import { EntityStore } from '../../../shared/storage/EntityStore';
import { syncCoordinator } from '../../../shared/sync/index';

export const getStoreConfig = async () => {
    try {
        // Try to get from local cache first
        let config = await EntityStore.get('settings', 'store_config');
        
        if (!config) {
            // Force a sync if missing (first load)
            await syncCoordinator.syncFeature('settings');
            config = await EntityStore.get('settings', 'store_config');
        } else {
            // Trigger background incremental verification
            syncCoordinator.syncFeature('settings').catch(console.error);
        }
        
        return config || {};
    } catch (error) {
        console.error('[settingsService] Failed to load store config:', error);
        return {};
    }
};
