import { BaseSyncAdapter } from './BaseSyncAdapter.js';
import { MutationOperation } from '../mutation/MutationTypes.js';
import { doc, setDoc, updateDoc, increment } from 'firebase/firestore';

export class OrderSyncAdapter extends BaseSyncAdapter {
    constructor(db) {
        super();
        this.db = db;
    }

    getDomain() {
        return 'orders';
    }

    async executeMutation(mutation) {
        if (mutation.operation === MutationOperation.BATCH) {
            // Process batched ops
            const ops = mutation.payload.operations || [];
            for (const op of ops) {
                if (op.collection === 'orders') {
                    const docRef = doc(this.db, 'orders', op.documentId);
                    if (op.operation === MutationOperation.CREATE) {
                        await setDoc(docRef, op.payload);
                    } else if (op.operation === MutationOperation.UPDATE) {
                        await updateDoc(docRef, op.payload);
                    }
                } else if (op.collection === 'stats' || op.collection === 'store') {
                    const docRef = doc(this.db, 'stats', 'store');
                    // Interpret $increment offline token
                    let finalPayload = { ...op.payload };
                    for (const [key, val] of Object.entries(finalPayload)) {
                        if (val && typeof val === 'object' && val.$increment) {
                            finalPayload[key] = increment(val.$increment);
                        }
                    }
                    await setDoc(docRef, finalPayload, { merge: true });
                }
            }
        } else if (mutation.operation === MutationOperation.UPDATE) {
            const docRef = doc(this.db, 'orders', mutation.documentId);
            await updateDoc(docRef, mutation.payload);
        } else {
            throw new Error(`Unsupported operation: ${mutation.operation}`);
        }
    }

    detectConflict(mutation, serverData) {
        return false;
    }

    setDal(dal) {
        this.dal = dal;
    }

    async onMutationCompleted(mutation) {
        if (!this.dal || !this.dal.initialized) return;
        
        let cache = [...this.dal.cache];
        
        if (mutation.operation === MutationOperation.UPDATE) {
            const index = cache.findIndex(o => String(o.id) === String(mutation.documentId));
            if (index !== -1) {
                cache[index] = { ...cache[index], ...mutation.payload };
                await this.dal.reconcileCache(cache);
            }
        } else if (mutation.operation === MutationOperation.BATCH) {
            const ops = mutation.payload.operations || [];
            let changed = false;
            for (const op of ops) {
                if (op.collection === 'orders' && op.operation === MutationOperation.CREATE) {
                    const exists = cache.find(o => String(o.id) === String(op.documentId));
                    if (!exists) {
                        cache.push({ ...op.payload, id: op.documentId });
                        changed = true;
                    }
                }
            }
            if (changed) {
                // sort descending by created_at
                cache.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
                await this.dal.reconcileCache(cache);
            }
        }
    }
    
    async syncInbound(lastSyncAt, syncBoundary) {
        if (!this.dal || !this.dal.initialized) return true;
        
        try {
            const { collection, query, where, getDocs } = await import('firebase/firestore');
            
            let q;
            if (lastSyncAt) {
                q = query(
                    collection(this.db, 'orders'),
                    where('updated_at', '>', lastSyncAt),
                    where('updated_at', '<=', syncBoundary)
                );
            } else {
                q = query(collection(this.db, 'orders'), where('updated_at', '<=', syncBoundary));
            }
            
            const snapshot = await getDocs(q);
            if (snapshot.empty && snapshot.metadata && snapshot.metadata.fromCache) {
                return false;
            }
            
            if (!snapshot.empty) {
                let cache = [...this.dal.cache];
                let changed = false;
                
                snapshot.forEach(docSnap => {
                    const data = { ...docSnap.data(), id: docSnap.id };
                    const index = cache.findIndex(o => String(o.id) === String(docSnap.id));
                    if (index !== -1) {
                        cache[index] = { ...cache[index], ...data };
                    } else {
                        cache.push(data);
                    }
                    changed = true;
                });
                
                if (changed) {
                    cache.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
                    await this.dal.reconcileCache(cache);
                }
            }
            return true;
        } catch (e) {
            console.error('[OrderSyncAdapter] syncInbound failed', e);
            return false;
        }
    }

    getChangeDetectionMechanism() {
        return 'updated_at';
    }
}
