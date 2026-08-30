import { BaseSyncAdapter } from './BaseSyncAdapter.js';
import { MutationOperation } from '../mutation/MutationTypes.js';
import { doc, updateDoc, setDoc } from 'firebase/firestore';

export class ProfileSyncAdapter extends BaseSyncAdapter {
    constructor(db) {
        super();
        this.db = db;
    }

    getDomain() {
        return 'profile';
    }

    async executeMutation(mutation) {
        const docRef = doc(this.db, 'users', mutation.documentId);
        if (mutation.operation === MutationOperation.UPDATE) {
            try {
                const payload = { ...mutation.payload, updated_at: new Date().toISOString() };
                await updateDoc(docRef, payload);
            } catch (err) {
                // If document does not exist, use setDoc (from AuthContext migration)
                const payload = { ...mutation.payload, updated_at: new Date().toISOString() };
                await setDoc(docRef, payload, { merge: true });
            }
        } else {
            throw new Error(`Unsupported operation: ${mutation.operation}`);
        }
    }

    detectConflict(mutation, serverData) {
        // Client Wins for Profile
        return false;
    }

    async resolveConflict(mutation, serverData) {
        // No op, client wins natively.
    }

    async onMutationCompleted(mutation) {
        if (window.__profileDAL) {
            // ProfileDAL already updated optimistic state to cache on enqueue
        }
    }

    async syncInbound(lastSyncAt, syncBoundary) {
        // We do not delta fetch all users for the storefront profile.
        // It relies on AuthGate and StartupProvider for session hydration.
        // Dashboard uses UsersDAL for the full list.
        return true; 
    }

    getChangeDetectionMechanism() {
        return 'none';
    }
}
