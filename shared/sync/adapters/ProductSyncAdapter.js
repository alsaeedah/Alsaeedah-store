import { BaseSyncAdapter } from './BaseSyncAdapter.js';
import { MutationOperation } from '../mutation/MutationTypes.js';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { EntityStore } from '../../storage/EntityStore.js';

/**
 * Number of products to write to EntityStore per batch during initial sync.
 * 
 * Keeping this small prevents holding the entire product catalog in memory at once.
 * After each chunk, we yield to the event loop so the Android WebView UI thread
 * remains responsive.
 */
const ENTITY_CHUNK_SIZE = 50;

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

    /**
     * syncInbound — Memory-safe, bounded initial product synchronization.
     * 
     * Architecture:
     *   Firestore snapshot
     *     ↓ (chunk by ENTITY_CHUNK_SIZE, yield between chunks)
     *   EntityStore.setMany (per chunk)
     *     ↓ (all IDs collected, ONE batched call)
     *   ProductDAL._addIdsToLists(allUpdatedIds)
     *     ↓
     *   ONE subscriber notification
     * 
     * This replaces the previous O(N) pattern of:
     *   EntityStore.setMany(all products at once) → _addIdToLists(id) × N
     * 
     * No Base64/image loading occurs here. Only product metadata is processed.
     */
    async syncInbound(lastSyncAt, syncBoundary) {
        try {
            console.log(`[Sync][products] Inbound syncing from ${lastSyncAt ?? 'beginning'} to ${syncBoundary}`);

            // ── 1. Build Firestore query ──────────────────────────────────────
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

            // ── 2. Fetch snapshot ─────────────────────────────────────────────
            const productsSnap = await getDocs(productsQuery);
            const totalCount = productsSnap.docs.length;
            console.log(`[Sync][products] Fetched ${totalCount} documents from Firestore.`);

            // ── 3. Process in bounded chunks — avoids holding entire catalog
            //        in memory and prevents WebView UI blocking ──────────────
            const allUpdatedIds = [];
            let chunk = [];

            for (const docSnap of productsSnap.docs) {
                chunk.push({ id: docSnap.id, ...docSnap.data() });

                if (chunk.length >= ENTITY_CHUNK_SIZE) {
                    await EntityStore.setMany('product', chunk);
                    chunk.forEach(p => allUpdatedIds.push(p.id));
                    chunk = []; // Release chunk reference

                    // Yield to event loop — keeps Android WebView UI thread responsive
                    await new Promise(r => setTimeout(r, 0));
                }
            }

            // Write any remaining products in the final partial chunk
            if (chunk.length > 0) {
                await EntityStore.setMany('product', chunk);
                chunk.forEach(p => allUpdatedIds.push(p.id));
                chunk = null; // Release reference explicitly
            }

            // ── 4. Update ID lists in one batched call ─────────────────────────
            if (allUpdatedIds.length > 0 && this.dal) {
                await this.dal._addIdsToLists(allUpdatedIds);
            }

            // ── 5. Fetch and process deletions ─────────────────────────────────
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

            if (deletedIds.length > 0) {
                // Remove deleted product entities in chunks
                for (let i = 0; i < deletedIds.length; i += ENTITY_CHUNK_SIZE) {
                    const deleteChunk = deletedIds.slice(i, i + ENTITY_CHUNK_SIZE);
                    await Promise.all(deleteChunk.map(id => EntityStore.remove('product', id)));

                    if (i + ENTITY_CHUNK_SIZE < deletedIds.length) {
                        await new Promise(r => setTimeout(r, 0));
                    }
                }

                // Remove deleted IDs from cached lists in one batched call
                if (this.dal) {
                    await this.dal._removeIdsFromLists(deletedIds);
                }
            }

            // ── 6. Single subscriber notification after all changes are applied ─
            if ((allUpdatedIds.length > 0 || deletedIds.length > 0) && this.dal) {
                this.dal._notifyAllSubscribers();
            }

            console.log(`[Sync][products] Applied ${allUpdatedIds.length} updates and ${deletedIds.length} deletions.`);
            return true;
        } catch (error) {
            console.error('[Sync][products] Sync failed:', error.message, error.stack);
            return false;
        }
    }
}
