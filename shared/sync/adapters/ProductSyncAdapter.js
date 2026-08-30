import { BaseSyncAdapter } from './BaseSyncAdapter.js';
import { MutationOperation } from '../mutation/MutationTypes.js';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { EntityStore } from '../../storage/EntityStore.js';

export class ProductSyncAdapter extends BaseSyncAdapter {
    constructor(db) {
        super();
        this.db = db;
        this.dal = null; // Will be injected by ProductDAL
        this.overlapMs = 120000; // 2 minutes
    }

    setDal(dal) {
        this.dal = dal;
    }

    getDomain() {
        return 'products';
    }

    getChangeDetectionMechanism() {
        return 'updated_at';
    }

    async executeMutation(mutation) {
        if (!this.dal) throw new Error('ProductDAL not injected into adapter');
        
        if (mutation.operation === MutationOperation.CREATE) {
            await this.dal.repository.createWithId(mutation.documentId, mutation.payload);
        } else if (mutation.operation === MutationOperation.UPDATE) {
            await this.dal.repository.update(mutation.documentId, mutation.payload);
        } else if (mutation.operation === MutationOperation.DELETE) {
            await this.dal.repository.delete(mutation.documentId);
        }
    }

    detectConflict(mutation, serverData) {
        if (!serverData) return false;
        if (mutation.operation === MutationOperation.CREATE) return false;

        const serverUpdatedAt = serverData.updated_at || serverData.created_at;
        const baseVersion = mutation.baseVersion;

        if (!baseVersion) return false;
        if (!serverUpdatedAt) return false;

        const serverTime = new Date(serverUpdatedAt).getTime();
        const localTime = new Date(baseVersion).getTime();

        return serverTime > localTime;
    }

    async resolveConflict(mutation, serverData) {
        if (!this.dal) return;
        console.warn(`[ProductSyncAdapter] Resolving conflict for product ${mutation.documentId}`);
        await this.dal._onMutationConflict(mutation.documentId);
    }

    async onMutationCompleted(mutation) {
        if (!this.dal) return;
        await this.dal._onMutationCompleted(mutation);
    }

    async syncInbound(lastSyncAt, syncBoundary) {
        try {
            console.log(`[ProductSyncAdapter] Inbound syncing from ${lastSyncAt} to ${syncBoundary}`);
            
            let productsQuery;
            if (lastSyncAt) {
                const adjustedLastSyncAt = new Date(new Date(lastSyncAt).getTime() - this.overlapMs).toISOString();
                productsQuery = query(
                    collection(this.db, 'products'),
                    where('updated_at', '>', adjustedLastSyncAt),
                    where('updated_at', '<=', syncBoundary)
                );
            } else {
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

            if (productsToUpdate.length > 0) {
                await EntityStore.setMany('product', productsToUpdate);
                if (this.dal) {
                    for (const prod of productsToUpdate) {
                        await this.dal._addIdToLists(prod.id);
                    }
                }
            }

            if (deletedIds.length > 0) {
                for (const id of deletedIds) {
                    await EntityStore.remove('product', id);
                    if (this.dal) {
                        await this.dal._removeIdFromLists(id);
                    }
                }
            }

            if ((productsToUpdate.length > 0 || deletedIds.length > 0) && this.dal) {
                this.dal._notifyAllSubscribers();
            }

            console.log(`[ProductSyncAdapter] Applied ${productsToUpdate.length} updates and ${deletedIds.length} deletions.`);
            return true;
        } catch (error) {
            console.error('[ProductSyncAdapter] Sync failed:', error);
            return false;
        }
    }
}
