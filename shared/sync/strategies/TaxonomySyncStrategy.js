import { BaseSyncAdapter } from '../adapters/BaseSyncAdapter.js';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { EntityStore } from '../../storage/EntityStore.js';

export class TaxonomySyncStrategy extends BaseSyncAdapter {
    constructor(db) {
        super();
        this.db = db;
        this.overlapMs = 120000;
    }

    getDomain() {
        return 'taxonomy';
    }

    getChangeDetectionMechanism() {
        return 'updated_at';
    }

    async executeMutation() {
        throw new Error('Offline mutations not yet supported for taxonomy');
    }

    async syncInbound(lastSyncAt, syncBoundary) {
        try {
            // Sync Categories
            const catSuccess = await this._syncCollection('categories', 'category', lastSyncAt, syncBoundary);
            // Sync Brands
            const brandSuccess = await this._syncCollection('brands', 'brand', lastSyncAt, syncBoundary);

            return catSuccess && brandSuccess;
        } catch (error) {
            console.error('[TaxonomySyncStrategy] Sync failed:', error);
            return false;
        }
    }

    async _syncCollection(collectionName, entityType, lastSyncAt, syncBoundary) {
        let q;
        if (lastSyncAt) {
            const adjustedLastSyncAt = new Date(new Date(lastSyncAt).getTime() - this.overlapMs).toISOString();
            q = query(
                collection(this.db, collectionName),
                where('updatedAt', '>', adjustedLastSyncAt),
                where('updatedAt', '<=', syncBoundary)
            );
        } else {
            q = query(
                collection(this.db, collectionName),
                where('updatedAt', '<=', syncBoundary)
            );
        }

        const snap = await getDocs(q);
        const updates = [];
        const deletes = [];
        snap.forEach(doc => {
            const data = { id: doc.id, ...doc.data() };
            if (data.active === false) {
                deletes.push(doc.id);
            } else {
                updates.push(data);
            }
        });

        if (updates.length > 0) {
            await EntityStore.setMany(entityType, updates);
        }
        
        for (const id of deletes) {
            await EntityStore.remove(entityType, id);
        }
        
        return true;
    }
}
