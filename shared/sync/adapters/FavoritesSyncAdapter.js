import { BaseSyncAdapter } from './BaseSyncAdapter.js';
import { MutationOperation } from '../mutation/MutationTypes.js';
import { doc, setDoc, deleteDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

export class FavoritesSyncAdapter extends BaseSyncAdapter {
    constructor(db, dal) {
        super();
        this.db = db;
        this.dal = dal; // The FavoritesDAL instance
    }

    getDomain() {
        return 'favorites';
    }

    getQueue() {
        return this.dal ? this.dal.queue : null;
    }

    async executeMutation(mutation) {
        const docRef = doc(this.db, 'favorites', mutation.documentId);
        
        console.log(`[FavoritesSyncAdapter] executeMutation ${mutation.operation} → doc ${mutation.documentId}`);
        if (mutation.operation === MutationOperation.CREATE) {
            await setDoc(docRef, mutation.payload);
        } else if (mutation.operation === MutationOperation.DELETE) {
            await deleteDoc(docRef);
            const tombstoneRef = doc(this.db, 'favorite_changes', mutation.documentId);
            await setDoc(tombstoneRef, {
                favoriteId: mutation.documentId,
                userId: mutation.payload.user_id,
                productId: mutation.payload.product_id,
                type: 'DELETED',
                updated_at: new Date().toISOString()
            });
        } else {
            throw new Error(`Unsupported operation: ${mutation.operation}`);
        }
    }

    detectConflict(mutation, serverData) {
        // Last Write Wins. No conflict thrown.
        return false;
    }

    async resolveConflict(mutation, serverData) {
        // LWW resolves natively.
    }

    async onMutationCompleted(mutation) {
        if (!this.dal.initialized) await this.dal.initialize();
        let cache = [...this.dal.cache];
        
        if (mutation.operation === MutationOperation.CREATE) {
            const exists = cache.find(f => String(f.id) === String(mutation.payload.product_id));
            if (!exists) {
                cache.push({
                    ...mutation.payload.product_data,
                    id: mutation.payload.product_id,
                    updated_at: mutation.payload.updated_at
                });
            }
        } else if (mutation.operation === MutationOperation.DELETE) {
            cache = cache.filter(f => String(f.id) !== String(mutation.payload.product_id));
        }
        
        console.log(`[FavoritesSyncAdapter] onMutationCompleted → safeReconcileCache`);
        await this.dal.safeReconcileCache(cache);
    }

    async syncInbound(lastSyncAt, syncBoundary) {
        if (!this.dal.initialized) await this.dal.initialize();
        if (!this.dal.userId) return true; // Nothing to sync if guest

        console.log(`[FavoritesSyncAdapter] syncInbound lastSyncAt=${lastSyncAt} boundary=${syncBoundary}`);
        try {
            let q;
            if (lastSyncAt) {
                q = query(
                    collection(this.db, 'favorites'),
                    where('user_id', '==', this.dal.userId),
                    where('updated_at', '>', lastSyncAt),
                    where('updated_at', '<=', syncBoundary)
                );
            } else {
                q = query(
                    collection(this.db, 'favorites'),
                    where('user_id', '==', this.dal.userId),
                    where('updated_at', '<=', syncBoundary)
                );
            }

            const snapshot = await getDocs(q);
            
            if (snapshot.empty && snapshot.metadata && snapshot.metadata.fromCache) {
                return false;
            }

            let cache = [...this.dal.cache];
            let changed = false;
            let newItemsCount = 0;

            snapshot.forEach((docSnap) => {
                const item = docSnap.data();
                const fav = {
                    ...item.product_data,
                    id: item.product_id,
                    updated_at: item.updated_at
                };
                const index = cache.findIndex(f => String(f.id) === String(fav.id));
                if (index !== -1) {
                    cache[index] = { ...cache[index], ...fav };
                } else {
                    cache.push(fav);
                }
                changed = true;
                newItemsCount++;
            });

            if (lastSyncAt) {
                const deletesQ = query(
                    collection(this.db, 'favorite_changes'),
                    where('userId', '==', this.dal.userId),
                    where('updated_at', '>', lastSyncAt),
                    where('updated_at', '<=', syncBoundary),
                    where('type', '==', 'DELETED')
                );
                const deletesSnap = await getDocs(deletesQ);
                deletesSnap.forEach(docSnap => {
                    const data = docSnap.data();
                    cache = cache.filter(f => String(f.id) !== String(data.productId));
                    changed = true;
                    newItemsCount++;
                });
            }

            console.log(`[FavoritesSyncAdapter] syncInbound complete, ${newItemsCount} changed/deleted server items`);
            if (changed || !lastSyncAt) {
                await this.dal.safeReconcileCache(cache);
            }
            return true;
        } catch (error) {
            console.error('[FavoritesSyncAdapter] syncInbound failed:', error);
            return false;
        }
    }

    getChangeDetectionMechanism() {
        return 'updated_at';
    }
}
