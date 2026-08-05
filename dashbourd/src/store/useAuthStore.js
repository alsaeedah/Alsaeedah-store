import { create } from 'zustand';
import { auth, db } from '../firebase/config';
import { cacheSession, clearCachedSession } from '@shared/startup/cache';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    onIdTokenChanged,
    signOut
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { setupFCMNotifications } from '../utils/pushManager';

const useAuthStore = create(
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
                    
                    // Fetch profile to resolve role and permissions immediately
                    const docSnap = await getDoc(doc(db, 'managers', uid));
                    if (!docSnap.exists()) {
                        await signOut(auth);
                        throw new Error('هذا الحساب غير موجود');
                    }
                    const data = docSnap.data();
                    if (!data.is_active) {
                        await signOut(auth);
                        throw new Error('هذا الحساب معطل');
                    }

                    const tokenResult = await userCredential.user.getIdTokenResult(true);

                    const sessionData = {
                        uid: userCredential.user.uid,
                        email: userCredential.user.email || data.email,
                        name: data.name || userCredential.user.displayName || 'مستخدم',
                        image: data.profile_image_url || userCredential.user.photoURL || '',
                        role: tokenResult.claims.role || data.role || 'manager',
                        permissions: Object.keys(tokenResult.claims.permissions || {}).length > 0 
                                       ? tokenResult.claims.permissions 
                                       : (data.permissions || {})
                    };

                    // Unified cache update and UI sync
                    await cacheSession(sessionData);
                    get().setSession(sessionData);

                    setupFCMNotifications(uid).catch(err => console.warn('[FCM] registration failed:', err));
                    return true;
                } catch (err) {
                    console.error('Login error:', err);
                    throw err;
                }
            },

            logout: async () => {
                await signOut(auth);
                await clearCachedSession();
                set({ user: null });
            },

            refreshClaims: async () => {
                const currentUser = auth.currentUser;
                if (currentUser) {
                    const tokenResult = await currentUser.getIdTokenResult(true);
                    const role = tokenResult.claims.role || 'manager'; // default to manager
                    const permissions = tokenResult.claims.permissions || {};
                    
                    set((state) => {
                        if (!state.user) return state; // Ensure we don't create a partial user object
                        return {
                            user: {
                                ...state.user,
                                role,
                                permissions
                            }
                        };
                    });
                }
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
                        if (!state.user) return state; // Ensure we don't create a partial user object
                        return {
                            user: {
                                ...state.user,
                                email: data.email,
                                name: data.name,
                                role: data.role || 'manager',
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
                return !!user.permissions?.[permission];
            },

            // State updates are handled by StartupEngine now
            setSession: (session) => {
                set({ user: session, loading: false });
            },
            setLoading: (isLoading) => set({ loading: isLoading })
    })
);

export default useAuthStore;
