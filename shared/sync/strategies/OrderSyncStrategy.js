import { BaseSyncAdapter } from '../adapters/BaseSyncAdapter.js';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { EntityStore } from '../../storage/EntityStore.js';

export class OrderSyncStrategy extends BaseSyncAdapter {
    constructor(db, auth) {
        super();
        this.db = db;
        this.auth = auth;
        this.overlapMs = 120000;
    }

    getDomain() {
        return 'orders';
    }

    getChangeDetectionMechanism() {
        return 'updated_at';
    }

    async executeMutation() {
        throw new Error('Offline mutations not yet supported for orders');
    }

    async syncInbound(lastSyncAt, syncBoundary) {
        try {
            const user = this.auth?.currentUser;
            if (!user) return true; // No orders for unauthenticated

            const uid = user.uid;

            let q;
            if (lastSyncAt) {
                const adjustedLastSyncAt = new Date(new Date(lastSyncAt).getTime() - this.overlapMs).toISOString();
                q = query(
                    collection(this.db, 'orders'),
                    where('user_id', '==', uid),
                    where('updated_at', '>', adjustedLastSyncAt),
                    where('updated_at', '<=', syncBoundary)
                );
            } else {
                q = query(
                    collection(this.db, 'orders'),
                    where('user_id', '==', uid)
                );
            }

            const snap = await getDocs(q);
            const updates = [];
            const deletes = [];

            snap.forEach(doc => {
                const data = doc.data();
                if (data.status === 'deleted') {
                    deletes.push(doc.id);
                } else {
                    updates.push({ id: doc.id, ...data });
                }
            });

            if (updates.length > 0) {
                await EntityStore.setMany('order', updates);
            }

            if (deletes.length > 0) {
                for (const id of deletes) {
                    await EntityStore.remove('order', id);
                }
            }

            return true;
        } catch (error) {
            console.error('[OrderSyncStrategy] Sync failed:', error);
            return false;
        }
    }
}
