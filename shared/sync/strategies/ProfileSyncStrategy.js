import { BaseSyncAdapter } from '../adapters/BaseSyncAdapter.js';
import { doc, getDoc } from 'firebase/firestore';
import { EntityStore } from '../../storage/EntityStore.js';

export class ProfileSyncStrategy extends BaseSyncAdapter {
    constructor(db, auth) {
        super();
        this.db = db;
        this.auth = auth;
    }

    getDomain() {
        return 'profile';
    }

    getChangeDetectionMechanism() {
        return 'updated_at'; // Assuming it might have it, but doing targeted fetch
    }

    async executeMutation() {
        throw new Error('Offline mutations not yet supported for profile');
    }

    async syncInbound(lastSyncAt, syncBoundary) {
        try {
            const user = this.auth?.currentUser;
            if (!user) return true; 

            const uid = user.uid;
            
            const docRef = doc(this.db, 'users', uid);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.is_active === false) {
                    const { clearCachedSession } = await import('../../startup/cache.js');
                    await clearCachedSession();
                    await this.auth.signOut();
                    window.location.href = '/login';
                    return true;
                }
                
                const local = await EntityStore.get('profile', uid);
                
                const newData = { id: uid, ...data };
                if (!local || JSON.stringify(local) !== JSON.stringify(newData)) {
                    await EntityStore.set('profile', newData);
                    
                    // Also update the session cache so AuthContext gets it
                    const { getCachedSession, cacheSession } = await import('../../startup/cache.js');
                    const currentSession = await getCachedSession();
                    if (currentSession && currentSession.uid === uid) {
                        await cacheSession({
                            ...currentSession,
                            name: data.name || currentSession.name,
                            image: data.profile_image_url || currentSession.image,
                            phone: data.phone || currentSession.phone,
                            whatsapp: data.whatsapp || currentSession.whatsapp,
                            governorate: data.governorate || currentSession.governorate,
                            district: data.district || currentSession.district,
                            neighborhood: data.neighborhood || currentSession.neighborhood
                        });
                        // Dispatch custom event so AuthContext can pick it up
                        window.dispatchEvent(new Event('session-updated'));
                    }
                }
            }

            return true;
        } catch (error) {
            console.error('[ProfileSyncStrategy] Sync failed:', error);
            return false;
        }
    }
}
