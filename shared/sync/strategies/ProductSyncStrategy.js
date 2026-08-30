import { BaseSyncStrategy } from './BaseSyncStrategy.js';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { EntityStore } from '../../storage/EntityStore.js';
import { QueryIndexStore } from '../../storage/QueryIndexStore.js';

export class ProductSyncStrategy extends BaseSyncStrategy {
    constructor(db) {
        super();
        this.db = db;
        // Overlap window: 2 minutes to account for clock skew and delayed commits
        this.overlapMs = 120000; 
    }

    getFeatureName() {
        return 'products';
    }

    async execute(lastSyncAt, syncBoundary) {
        try {
            console.log(`[ProductSyncStrategy] Syncing from ${lastSyncAt} to ${syncBoundary}`);
            
            // 1. Fetch changed products
            let productsQuery;
            if (lastSyncAt) {
                const adjustedLastSyncAt = new Date(new Date(lastSyncAt).getTime() - this.overlapMs).toISOString();
                productsQuery = query(
                    collection(this.db, 'products'),
                    where('updated_at', '>', adjustedLastSyncAt),
                    where('updated_at', '<=', syncBoundary)
                );
            } else {
                // Initial sync: fetch everything up to syncBoundary
                productsQuery = query(
                    collection(this.db, 'products'),
                    where('updated_at', '<=', syncBoundary)
                );
            }

            const productsSnap = await getDocs(productsQuery);
            const productsToUpdate = [];
            productsSnap.forEach(doc => {
                productsToUpdate.push({ id: doc.id, ...doc.data() });
            });

            // 2. Fetch deleted products
            let deletedIds = [];
            if (lastSyncAt) {
                const adjustedLastSyncAt = new Date(new Date(lastSyncAt).getTime() - this.overlapMs).toISOString();
                const deletesQuery = query(
                    collection(this.db, 'product_changes'),
                    where('timestamp', '>', adjustedLastSyncAt),
                    where('timestamp', '<=', syncBoundary),
                    where('type', '==', 'DELETED')
                );
                const deletesSnap = await getDocs(deletesQuery);
                deletesSnap.forEach(doc => {
                    deletedIds.push(doc.data().productId);
                });
            }

            // 3. Apply changes (Atomic local commit phase)
            if (productsToUpdate.length > 0) {
                await EntityStore.setMany('product', productsToUpdate);
            }

            if (deletedIds.length > 0) {
                for (const id of deletedIds) {
                    await EntityStore.remove('product', id);
                    // Targeted QueryIndex invalidation is handled when lists are fetched or via a registry lookup.
                    // For now, removing from EntityStore ensures it won't be rendered.
                }
            }

            console.log(`[ProductSyncStrategy] Applied ${productsToUpdate.length} updates and ${deletedIds.length} deletions.`);
            return true;
        } catch (error) {
            console.error('[ProductSyncStrategy] Sync failed:', error);
            return false;
        }
    }
}
