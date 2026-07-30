import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { auth, db } from '../firebase/config';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    onIdTokenChanged,
    signOut
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { setupFCMNotifications } from '../utils/pushManager';

const useAuthStore = create(
    persist(
        (set, get) => ({
            user: null,
            loading: true,

            // Auth Actions
            login: async (email, password) => {
                const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
                const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD;
                const normalizedEmail = email.trim();

                try {
                    // Try Firebase Auth Login
                    let userCredential;
                    try {
                        userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
                    } catch (authError) {
                        // Auto-provision Super Admin if account doesn't exist and credentials match env vars
                        if (normalizedEmail === adminEmail && password === adminPassword && 
                            (authError.code === 'auth/user-not-found' || authError.code === 'auth/invalid-credential')) {
                            console.log('Auto-provisioning Super Admin account in Firebase...');
                            userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
                            
                            // Initialize Super Admin claims via API
                            try {
                                const token = await userCredential.user.getIdToken();
                                await fetch('/api/admin/init-super-admin', {
                                    method: 'POST',
                                    headers: {
                                        'Authorization': `Bearer ${token}`,
                                        'x-init-secret': import.meta.env.VITE_SUPER_ADMIN_INIT_SECRET || ''
                                    }
                                });
                            } catch (err) {
                                console.error('Failed to init super admin claims', err);
                            }

                            // Create role document in Firestore for UI metadata
                            const roleRef = doc(db, 'managers', userCredential.user.uid);
                            await setDoc(roleRef, {
                                email: normalizedEmail,
                                name: 'المدير العام',
                                role: 'super_admin',
                                permissions: { products: true, orders: true, users: true, managers: true },
                                is_active: true
                            });
                        } else {
                            throw new Error('بيانات الدخول غير صحيحة أو الحساب معطّل');
                        }
                    }

                    const uid = userCredential.user.uid;
                    
                    // Let the onIdTokenChanged listener handle setting the user state based on claims
                    // But we can eagerly check if they are active in firestore
                    const docSnap = await getDoc(doc(db, 'managers', uid));
                    if (!docSnap.exists() || !docSnap.data().is_active) {
                        await signOut(auth);
                        throw new Error('الحساب غير موجود أو معطل');
                    }

                    setupFCMNotifications(uid).catch(err => console.warn('[FCM] registration failed:', err));
                    return true;
                } catch (err) {
                    console.error('Login error:', err);
                    throw err;
                }
            },

            logout: async () => {
                await signOut(auth);
                set({ user: null });
            },

            refreshClaims: async () => {
                const currentUser = auth.currentUser;
                if (currentUser) {
                    const tokenResult = await currentUser.getIdTokenResult(true);
                    const role = tokenResult.claims.role || 'manager'; // default to manager
                    const permissions = tokenResult.claims.permissions || {};
                    
                    set((state) => ({
                        user: {
                            ...state.user,
                            role,
                            permissions
                        }
                    }));
                }
            },
            
            // Initialization for listeners
            init: () => {
                const unsubscribeAuth = onIdTokenChanged(auth, async (firebaseUser) => {
                    if (firebaseUser) {
                        try {
                            const tokenResult = await firebaseUser.getIdTokenResult();
                            const uid = firebaseUser.uid;
                            const role = tokenResult.claims.role;
                            const permissions = tokenResult.claims.permissions || {};
                            
                            // Listen to Firestore for metadata (name, active status)
                            const unsubFirestore = onSnapshot(doc(db, 'managers', uid), async (docSnap) => {
                                if (!docSnap.exists() || docSnap.data().is_active === false) {
                                    await get().logout();
                                    return;
                                }
                                
                                const data = docSnap.data();
                                set({
                                    user: {
                                        id: uid,
                                        uid: uid,
                                        email: data.email,
                                        name: data.name,
                                        role: role || data.role || 'manager',
                                        permissions: Object.keys(permissions).length > 0 ? permissions : (data.permissions || {}),
                                    },
                                    loading: false
                                });
                            });
                        } catch (err) {
                            console.error('Error fetching token claims:', err);
                            set({ loading: false });
                        }
                    } else {
                        set({ user: null, loading: false });
                    }
                });
                return unsubscribeAuth;
            }
        }),
        {
            name: 'dash-auth-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({ user: state.user }),
        }
    )
);

// Start listening immediately
useAuthStore.getState().init();

export default useAuthStore;
