import { BaseSyncAdapter } from './BaseSyncAdapter.js';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { StorageEngine } from '../../storage/StorageEngine.js';
import { TAXONOMY_TYPES } from '../../taxonomy/constants.js';

export class TaxonomySyncAdapter extends BaseSyncAdapter {
    constructor(db) { super(); this.db = db; }
    getDomain() { return 'taxonomy'; }
    
    async executeMutation(m) { 
        // Dashboard bypasses mutation queue for Taxonomy. 
        // Storefront does not mutate Taxonomy.
        throw new Error('Offline mutations for Taxonomy are not supported via SyncEngine'); 
    }
    
    async syncInbound(lastSyncAt, syncBoundary) {
        if (!lastSyncAt) {
            // First sync, let SWR handle it
            return true;
        }

        try {
            let changed = false;
            const types = [TAXONOMY_TYPES.CATEGORY, TAXONOMY_TYPES.BRAND, TAXONOMY_TYPES.COLLECTION];
            const colNames = {
                [TAXONOMY_TYPES.CATEGORY]: 'categories',
                [TAXONOMY_TYPES.BRAND]: 'brands',
                [TAXONOMY_TYPES.COLLECTION]: 'collections'
            };

            for (const type of types) {
                const q = query(
                    collection(this.db, colNames[type]),
                    where('updatedAt', '>', lastSyncAt),
                    where('updatedAt', '<=', syncBoundary)
                );
                
                const snapshot = await getDocs(q);
                if (!snapshot.empty && !(snapshot.metadata && snapshot.metadata.fromCache)) {
                    changed = true;
                    // Invalidate SWR cache
                    const cacheKey = `taxonomy_cache_${type}`;
                    const cached = await StorageEngine.get(cacheKey);
                    if (cached) {
                        cached.timestamp = 0; // Mark stale
                        await StorageEngine.set(cacheKey, cached);
                    }
                }
            }
            
            return true;
        } catch (error) {
            console.error('[TaxonomySyncAdapter] syncInbound failed:', error);
            return false;
        }
    }
    
    getChangeDetectionMechanism() {
        return 'updated_at';
    }
}
