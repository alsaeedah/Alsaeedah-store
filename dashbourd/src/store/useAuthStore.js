import { create } from 'zustand';
import { auth, db } from '../firebase/config';
import { clearCachedSession } from '@shared/startup/cache';

import { 
    signInWithEmailAndPassword, 
    signOut
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

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
        authState: 'INITIALIZING', // INITIALIZING, AUTHENTICATING, RESOLVING_AUTHORIZATION, READY, SIGNED_OUT, ERROR
        loading: true, // Legacy compatibility, but prefer authState
        isAuthenticated: false, // Legacy
        isAuthorized: false, // Legacy
        error: null,

        // Auth Actions
        login: async (email, password) => {
            const normalizedEmail = email.trim();
            set({ authState: 'AUTHENTICATING', loading: true, error: null });

            try {
                // 1. Authenticate with Firebase
                // This triggers onAuthStateChanged in StartupProvider -> authSync
                await signInWithEmailAndPassword(auth, normalizedEmail, password);

                // Check if the state has ALREADY transitioned before we subscribe.
                // This prevents a deadlock if authSync finishes exceptionally fast (e.g. from cache).
                const currentState = get();
                if (currentState.authState === 'READY' && currentState.user) {
                    return true;
                }
                if (currentState.authState === 'ERROR' || currentState.authState === 'SIGNED_OUT' || currentState.error) {
                    throw (currentState.error || new Error('Authentication failed'));
                }

                // Wait for the canonical session to be ready via the single authoritative pipeline
                return new Promise((resolve, reject) => {
                    const unsubscribe = useAuthStore.subscribe((state) => {
                        if (state.authState === 'READY' && state.user) {
                            unsubscribe();
                            resolve(true);
                        } else if (state.authState === 'ERROR' || state.authState === 'SIGNED_OUT' || state.error) {
                            unsubscribe();
                            reject(state.error || new Error('Authentication failed'));
                        }
                    });
                });

            } catch (err) {
                console.error('Login error:', err);
                const code = err.code || 'UNKNOWN_ERROR';
                set({ 
                    authState: 'ERROR',
                    isAuthenticated: false, 
                    isAuthorized: false, 
                    error: err,
                    loading: false 
                });
                throw err;
            }
        },

        logout: async () => {
            set({ authState: 'INITIALIZING' }); // Intermediate state to prevent rendering while signing out
            await signOut(auth);
            await clearCachedSession();
            set({ 
                user: null, 
                authState: 'SIGNED_OUT',
                isAuthenticated: false, 
                isAuthorized: false, 
                error: null,
                loading: false 
            });
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
                            email: data.email || state.user.email,
                            name: data.name || state.user.name,
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
            
            return user.permissions && user.permissions[permission] === true;
        },

        setSession: (session) => {
            if (session) {
                set({ 
                    user: session, 
                    authState: 'READY',
                    loading: false, 
                    isAuthenticated: true, 
                    isAuthorized: true,
                    error: null
                });
            } else {
                set({ 
                    user: null, 
                    authState: 'SIGNED_OUT',
                    loading: false, 
                    isAuthenticated: false, 
                    isAuthorized: false 
                });
            }
        },
        
        setAuthState: (newState) => {
            set({ authState: newState });
        },

        setAuthError: (error) => {
            set({ 
                authState: 'ERROR', 
                error, 
                loading: false,
                isAuthenticated: false,
                isAuthorized: false
            });
        },

        setLoading: (isLoading) => set({ loading: isLoading })
    })
);

export default useAuthStore;
