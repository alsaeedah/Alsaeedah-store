import { create } from 'zustand';
import { auth, db } from '../firebase/config';
import { cacheSession, clearCachedSession } from '@shared/startup/cache';

import { 
    signInWithEmailAndPassword, 
    signOut
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { setupFCMNotifications } from '../utils/pushManager';

// Error mapping class
class AuthError extends Error {
    constructor(code, message) {
        super(message);
        this.code = code;
    }
}

const useAuthStore = create(
    (set, get) => ({
        user: null,
        loading: true,
        isAuthenticated: false,
        isAuthorized: false,
        error: null,

        // Auth Actions
        login: async (email, password) => {
            const normalizedEmail = email.trim();
            set({ loading: true, error: null });

            try {
                // 1. Authenticate (Stage 1)
                let userCredential;
                try {
                    userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
                } catch (authError) {
                    throw new AuthError('AUTH_FAILED', authError.message);
                }

                const firebaseUser = userCredential.user;

                // 2. Get ID Token and Claims (Stage 2)
                let tokenResult = await firebaseUser.getIdTokenResult();
                const claims = tokenResult.claims || {};
                const isSuperAdminClaim = claims.role === 'super_admin';

                const uid = firebaseUser.uid;

                // 3. Force-refresh token to guarantee Firestore client has auth state
                await firebaseUser.getIdToken(true);

                // 4. Load Manager Profile (Stage 4) - Safe to read Firestore now
                let managerData;
                try {
                    const docSnap = await getDoc(doc(db, 'managers', uid));
                    if (!docSnap.exists()) {
                        await signOut(auth);
                        throw new AuthError('PROFILE_MISSING', 'The authenticated administrator profile could not be found.');
                    }
                    managerData = docSnap.data();
                    if (managerData.is_active === false) {
                        await signOut(auth);
                        throw new AuthError('ACCOUNT_DISABLED', 'Account is disabled.');
                    }
                } catch (firestoreError) {
                    if (firestoreError instanceof AuthError) throw firestoreError;
                    
                    // Case G: Firestore Permission Failure
                    console.error('[DIAGNOSTIC] Firestore read failed during login:', {
                        operation: 'getDoc',
                        collection: 'managers',
                        documentPath: `managers/${uid}`,
                        firebaseUid: uid,
                        errorCode: firestoreError.code,
                        errorMessage: firestoreError.message,
                        fullError: firestoreError
                    });
                    
                    if (firestoreError.code === 'permission-denied') {
                        await signOut(auth);
                        throw new AuthError('FIRESTORE_DENIED', 'Access to requested data was denied.');
                    }
                    throw firestoreError;
                }

                // 5. Build Session and Initialize
                const finalRole = isSuperAdminClaim ? 'super_admin' : (managerData.role || 'manager');
                const finalPermissions = managerData.permissions || {};
                
                const sessionData = {
                    uid,
                    email: firebaseUser.email || managerData.email,
                    name: managerData.name || firebaseUser.displayName || 'مستخدم',
                    image: managerData.profile_image_url || firebaseUser.photoURL || '',
                    role: finalRole,
                    permissions: finalPermissions
                };

                await cacheSession(sessionData);
                get().setSession(sessionData);
                
                set({ isAuthenticated: true, isAuthorized: true, error: null });

                setupFCMNotifications(uid).catch(err => console.warn('[FCM] registration failed:', err));
                return true;

            } catch (err) {
                console.error('Login error:', err);
                const code = err.code || 'UNKNOWN_ERROR';
                set({ 
                    isAuthenticated: (code !== 'AUTH_FAILED'), 
                    isAuthorized: false, 
                    error: err,
                    loading: false 
                });
                throw err;
            }
        },

        logout: async () => {
            await signOut(auth);
            await clearCachedSession();
            set({ user: null, isAuthenticated: false, isAuthorized: false, error: null });
        },


        refreshPermissions: async () => {
            const uid = get().user?.uid;
            if (!uid) return;
            
            try {
                const docSnap = await getDoc(doc(db, 'managers', uid));
                if (!docSnap.exists() || docSnap.data().is_active === false) {
                    await get().logout();
                    return;
                }
                
                const data = docSnap.data();
                set((state) => {
                    if (!state.user) return state;
                    const refreshedRole = state.user.role === 'super_admin' ? 'super_admin' : (data.role || 'manager');
                    return {
                        user: {
                            ...state.user,
                            email: data.email,
                            name: data.name,
                            role: refreshedRole,
                            permissions: data.permissions || {},
                        }
                    };
                });
            } catch (err) {
                console.error('Error refreshing permissions:', err);
            }
        },
        
        hasPermission: (permission) => {
            const user = get().user;
            if (!user) return false;
            if (user.role === 'super_admin') return true;
            
            // Log for debugging if the user opens the console
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                // console.log(`[Auth] Checking permission '${permission}':`, user.permissions);
            }
            
            return user.permissions && user.permissions[permission] === true;
        },

        setSession: (session) => {
            set({ user: session, loading: false, isAuthenticated: true, isAuthorized: true });
        },
        
        setLoading: (isLoading) => set({ loading: isLoading })
    })
);

export default useAuthStore;
