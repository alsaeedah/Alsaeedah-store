import { BaseSyncAdapter } from '../adapters/BaseSyncAdapter.js';
import { doc, getDoc } from 'firebase/firestore';
import { EntityStore } from '../../storage/EntityStore.js';

export class SettingsSyncStrategy extends BaseSyncAdapter {
    constructor(db) {
        super();
        this.db = db;
    }

    getDomain() {
        return 'settings';
    }

    getChangeDetectionMechanism() {
        return 'updated_at'; // Document version
    }

    async executeMutation() {
        throw new Error('Offline mutations not yet supported for settings');
    }

    async syncInbound(lastSyncAt, syncBoundary) {
        try {
            const docRef = doc(this.db, 'settings', 'store_config');
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                const data = docSnap.data();
                const newData = { id: 'store_config', ...data };
                
                const local = await EntityStore.get('settings', 'store_config');
                if (!local || JSON.stringify(local) !== JSON.stringify(newData)) {
                    await EntityStore.set('settings', newData);
                }
            }

            return true;
        } catch (error) {
            console.error('[SettingsSyncStrategy] Sync failed:', error);
            return false;
        }
    }
}
