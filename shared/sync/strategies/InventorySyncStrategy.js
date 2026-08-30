import { BaseSyncAdapter } from '../adapters/BaseSyncAdapter.js';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { EntityStore } from '../../storage/EntityStore.js';

export class InventorySyncStrategy extends BaseSyncAdapter {
    constructor(db) {
        super();
        this.db = db;
        // Overlap window: 2 minutes to account for clock skew and delayed commits
        this.overlapMs = 120000; 
    }

    getDomain() {
        return 'inventory';
    }

    getChangeDetectionMechanism() {
        return 'updated_at';
    }

    async executeMutation() {
        throw new Error('Offline mutations not yet supported for inventory');
    }

    async syncInbound(lastSyncAt, syncBoundary) {
        try {
            console.log(`[InventorySyncStrategy] Syncing from ${lastSyncAt} to ${syncBoundary}`);
            
            // 1. Fetch changed inventory records
            let inventoryQuery;
            if (lastSyncAt) {
                const adjustedLastSyncAt = new Date(new Date(lastSyncAt).getTime() - this.overlapMs).toISOString();
                inventoryQuery = query(
                    collection(this.db, 'inventory'),
                    where('updated_at', '>', adjustedLastSyncAt),
                    where('updated_at', '<=', syncBoundary)
                );
            } else {
                // Initial sync: fetch everything up to syncBoundary
                inventoryQuery = query(
                    collection(this.db, 'inventory'),
                    where('updated_at', '<=', syncBoundary)
                );
            }

            const inventorySnap = await getDocs(inventoryQuery);
            const inventoryToUpdate = [];
            inventorySnap.forEach(doc => {
                inventoryToUpdate.push({ id: doc.id, ...doc.data() });
            });

            // Note: If an inventory doc is deleted, it means tracking is disabled.
            // A comprehensive delete tracking like product_changes would be needed, 
            // but since inventory is optional, we just sync what exists.
            
            // 2. Apply changes (Atomic local commit phase)
            if (inventoryToUpdate.length > 0) {
                await EntityStore.setMany('inventory', inventoryToUpdate);
            }

            console.log(`[InventorySyncStrategy] Applied ${inventoryToUpdate.length} updates.`);
            return true;
        } catch (error) {
            console.error('[InventorySyncStrategy] Sync failed:', error);
            return false;
        }
    }
}
