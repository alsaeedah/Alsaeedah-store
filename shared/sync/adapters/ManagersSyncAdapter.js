import { BaseSyncAdapter } from './BaseSyncAdapter.js';
import { MutationOperation } from '../mutation/MutationTypes.js';
import { doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

export class ManagersSyncAdapter extends BaseSyncAdapter {
    constructor(db) { super(); this.db = db; }
    getDomain() { return 'managers'; }
    async executeMutation(m) {
        const docRef = doc(this.db, 'managers', m.documentId);
        if (m.operation === MutationOperation.CREATE) {
            await setDoc(docRef, m.payload);
        } else if (m.operation === MutationOperation.UPDATE) {
            await updateDoc(docRef, m.payload);
        } else if (m.operation === MutationOperation.DELETE) {
            await deleteDoc(docRef);
        } else {
            throw new Error(`Unsupported operation: ${m.operation}`);
        }
    }
    setDal(dal) {
        this.dal = dal;
    }

    async onMutationCompleted(mutation) {
        if (!this.dal || !this.dal.initialized) return;
        let cache = [...this.dal.cache];
        
        if (mutation.operation === MutationOperation.CREATE) {
            const exists = cache.find(m => String(m.id) === String(mutation.documentId));
            if (!exists) cache.push({ ...mutation.payload, id: mutation.documentId });
        } else if (mutation.operation === MutationOperation.UPDATE) {
            const index = cache.findIndex(m => String(m.id) === String(mutation.documentId));
            if (index !== -1) cache[index] = { ...cache[index], ...mutation.payload };
        } else if (mutation.operation === MutationOperation.DELETE) {
            cache = cache.filter(m => String(m.id) !== String(mutation.documentId));
        }
        await this.dal.reconcileCache(cache);
    }

    async syncInbound(lastSyncAt, syncBoundary) { 
        if (!this.dal || !this.dal.initialized) return true;
        try {
            const { collection, query, where, getDocs } = await import('firebase/firestore');
            
            let q;
            if (lastSyncAt) {
                q = query(collection(this.db, 'managers'), where('updated_at', '>', lastSyncAt), where('updated_at', '<=', syncBoundary));
            } else {
                q = query(collection(this.db, 'managers'), where('updated_at', '<=', syncBoundary));
            }
            
            const snapshot = await getDocs(q);
            if (snapshot.empty && snapshot.metadata && snapshot.metadata.fromCache) return false;
            
            let cache = [...this.dal.cache];
            let changed = false;
            
            snapshot.forEach(docSnap => {
                const data = { ...docSnap.data(), id: docSnap.id };
                const index = cache.findIndex(m => String(m.id) === String(docSnap.id));
                if (index !== -1) cache[index] = { ...cache[index], ...data };
                else cache.push(data);
                changed = true;
            });

            if (changed) {
                await this.dal.reconcileCache(cache);
            }
            return true; 
        } catch (e) {
            console.error('[ManagersSyncAdapter] syncInbound failed', e);
            return false;
        }
    }

    getChangeDetectionMechanism() {
        return 'updated_at';
    }
}
