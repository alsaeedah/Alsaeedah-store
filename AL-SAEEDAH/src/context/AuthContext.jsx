import { createContext, useState, useContext, useEffect, useRef } from 'react';
import { supabase } from '../supabase/client';
import { useLoader } from './LoaderContext';
import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children, openAuthOnMount = false, onAuthMountHandled }) => {
    const { showLoader, hideLoader } = useLoader();
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const tokenRef = useRef(null);

    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => setIsMenuOpen(prev => !prev);
    const closeMenu = () => setIsMenuOpen(false);

    // Open AuthModal when triggered externally
    const handledOnMount = useRef(false);
    useEffect(() => {
        if (openAuthOnMount && !handledOnMount.current) {
            handledOnMount.current = true;
            setIsAuthModalOpen(true);
            onAuthMountHandled?.();
        }
    }, [openAuthOnMount, onAuthMountHandled]);

    useEffect(() => {
        // Check for local storage user first (immediate UI hydration)
        const savedUser = localStorage.getItem('time-tick-user');
        if (savedUser) {
            setCurrentUser(JSON.parse(savedUser));
        }

        // Listen for Supabase Auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if ((event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION') && session?.user) {
                tokenRef.current = session.access_token;
                const meta = session.user.user_metadata || {};

                const baseUser = {
                    uid: session.user.id,
                    name: meta.full_name || meta.name || 'مستخدم',
                    phone: meta.phone || '',
                    image: meta.profile_image_url || meta.image || meta.avatar_url || '',
                    createdAt: session.user.created_at,
                };

                // Set initial state immediately to avoid white screen
                setCurrentUser(baseUser);
                localStorage.setItem('time-tick-user', JSON.stringify(baseUser));

                // Hydrate with latest data from public.users table in background
                const hydrateProfile = async () => {
                    try {
                        const { data: userData, error: userError } = await supabase
                            .from('users')
                            .select('name, phone, profile_image_url, is_active, whatsapp, governorate, district, neighborhood')
                            .eq('id', session.user.id)
                            .maybeSingle();

                        if (!userError && userData) {
                            // Force logout if account was deactivated
                            if (userData.is_active === false) {
                                alert('تم تعطيل حسابك. تواصل مع الإدارة.');
                                await supabase.auth.signOut();
                                setCurrentUser(null);
                                localStorage.removeItem('time-tick-user');
                                return;
                            }
                        }

                        const hydratedUser = {
                            ...baseUser,
                            name: userData?.name || baseUser.name,
                            phone: userData?.phone || baseUser.phone,
                            image: userData?.profile_image_url || baseUser.image,
                            whatsapp: userData?.whatsapp || '',
                            governorate: userData?.governorate || '',
                            district: userData?.district || '',
                            neighborhood: userData?.neighborhood || '',
                        };
                        localStorage.setItem('time-tick-user', JSON.stringify(hydratedUser));
                        setCurrentUser(hydratedUser);
                    } catch (e) {
                        console.error('Profile sync error:', e);
                    }
                };
                hydrateProfile();

                setIsAuthModalOpen(false);

            } else if (event === 'SIGNED_OUT') {
                tokenRef.current = null;
                setCurrentUser(null);
                localStorage.removeItem('time-tick-user');
            }
            setLoading(false);
        });

        // REAL-TIME USER LISTENER: Sync changes (name, image, is_active) across devices
        const userChannel = supabase
            .channel('public:users_updates')
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'users' },
                async (payload) => {
                    const updatedUserId = payload.new.id;
                    const savedUser = localStorage.getItem('time-tick-user');
                    const parsedUser = savedUser ? JSON.parse(savedUser) : null;

                    if (parsedUser && parsedUser.uid === updatedUserId) {
                        // If admin deactivated this user — force logout
                        if (payload.new.is_active === false) {
                            alert('تم تعطيل حسابك بواسطة الإدارة.');
                            await supabase.auth.signOut();
                            setCurrentUser(null);
                            localStorage.removeItem('time-tick-user');
                            window.location.href = '/';
                            return;
                        }

                        console.log('Real-time user sync:', payload.new);
                        const updatedUser = {
                            ...parsedUser,
                            name: payload.new.name || parsedUser.name,
                            image: payload.new.profile_image_url || parsedUser.image,
                            phone: payload.new.phone || parsedUser.phone,
                            whatsapp: payload.new.whatsapp !== undefined ? payload.new.whatsapp : parsedUser.whatsapp,
                            governorate: payload.new.governorate !== undefined ? payload.new.governorate : parsedUser.governorate,
                            district: payload.new.district !== undefined ? payload.new.district : parsedUser.district,
                            neighborhood: payload.new.neighborhood !== undefined ? payload.new.neighborhood : parsedUser.neighborhood,
                        };
                        localStorage.setItem('time-tick-user', JSON.stringify(updatedUser));
                        setCurrentUser(updatedUser);
                    }
                }
            )
            .on(
                'postgres_changes',
                { event: 'DELETE', schema: 'public', table: 'users' },
                (payload) => {
                    const deletedUserId = payload.old.id;
                    const savedUser = localStorage.getItem('time-tick-user');
                    const parsedUser = savedUser ? JSON.parse(savedUser) : null;

                    if (parsedUser && parsedUser.uid === deletedUserId) {
                        alert('تم حذف حسابك بواسطة الإدارة.');
                        supabase.auth.signOut().then(() => {
                            setCurrentUser(null);
                            localStorage.removeItem('time-tick-user');
                            window.location.href = '/';
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
            supabase.removeChannel(userChannel);
        };
    }, []);

    /**
     * login
     * Accepts a phone number + password.
     * Maps phone to virtual email: phone_[phone]@alsaeedah.store
     */
    const login = async (phone, password) => {
        const email = `phone_${phone.trim()}@alsaeedah.store`;
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            // Provide a user-friendly error message
            if (error.message.includes('Invalid login credentials')) {
                throw new Error('رقم الهاتف أو كلمة المرور غير صحيحة');
            }
            throw error;
        }
        return true;
    };

    const logout = async () => {
        showLoader('جاري تسجيل الخروج...');
        if (currentUser?.uid) {
            try {
                await supabase
                    .from('users')
                    .update({ is_online: false, last_seen: new Date().toISOString() })
                    .eq('id', currentUser.uid);
            } catch (err) {
                console.error('Offline update on logout failed:', err);
            }
        }
        tokenRef.current = null;
        await supabase.auth.signOut();
        setCurrentUser(null);
        localStorage.removeItem('time-tick-user');
        setIsLogoutConfirmOpen(false);
        setIsProfileModalOpen(false);
        setTimeout(hideLoader, 800);
    };

    /**
     * updateUser
     * Updates name and/or profile image in both auth metadata and public.users table.
     */
    const updateUser = async (updatedData) => {
        if (!currentUser) return;

        const metaPayload = {};
        if (updatedData.name) metaPayload.full_name = updatedData.name;
        if (updatedData.image) metaPayload.profile_image_url = updatedData.image;

        // Update Supabase Auth Metadata
        const { error: authError } = await supabase.auth.updateUser({ data: metaPayload });
        if (authError) throw authError;

        // Update public.users table (all fields including address)
        const dbPayload = {};
        if (updatedData.name) dbPayload.name = updatedData.name;
        if (updatedData.image) dbPayload.profile_image_url = updatedData.image;
        if (updatedData.whatsapp !== undefined) dbPayload.whatsapp = updatedData.whatsapp;
        if (updatedData.governorate !== undefined) dbPayload.governorate = updatedData.governorate;
        if (updatedData.district !== undefined) dbPayload.district = updatedData.district;
        if (updatedData.neighborhood !== undefined) dbPayload.neighborhood = updatedData.neighborhood;
        dbPayload.updated_at = new Date().toISOString();

        const { error: dbError } = await supabase
            .from('users')
            .update(dbPayload)
            .eq('id', currentUser.uid);

        if (dbError) throw new Error(`فشل تحديث البيانات: ${dbError.message}`);

        const updatedUser = { ...currentUser, ...updatedData };
        localStorage.setItem('time-tick-user', JSON.stringify(updatedUser));
        setCurrentUser(updatedUser);
    };

    /**
     * updatePassword
     * Changes the currently logged-in user's password.
     * Re-authenticates first using the current password, then updates.
     */
    const updatePassword = async (currentPassword, newPassword) => {
        if (!currentUser?.phone) throw new Error('بيانات المستخدم غير متوفرة');

        // Re-authenticate to verify the current password
        const email = `phone_${currentUser.phone}@alsaeedah.store`;
        const { error: reAuthError } = await supabase.auth.signInWithPassword({ email, password: currentPassword });
        if (reAuthError) {
            throw new Error('كلمة المرور الحالية غير صحيحة');
        }

        // Now update the password
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
    };

    // ONLINE STATUS TRACKING
    useEffect(() => {
        if (!currentUser?.uid) return;

        const updateOnlineStatus = async (online) => {
            try {
                await supabase
                    .from('users')
                    .update({
                        is_online: online,
                        last_seen: new Date().toISOString()
                    })
                    .eq('id', currentUser.uid);
            } catch (err) {
                console.error('Failed to update online status:', err);
            }
        };

        const updateOnlineStatusSync = (online) => {
            if (!currentUser?.uid) return;
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://vyfdyzheokosikrxgepv.supabase.co';
            const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
            const url = `${supabaseUrl}/rest/v1/users?id=eq.${currentUser.uid}`;
            
            const headers = {
                'apikey': supabaseAnonKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            };
            if (tokenRef.current) {
                headers['Authorization'] = `Bearer ${tokenRef.current}`;
            }
            
            fetch(url, {
                method: 'PATCH',
                headers,
                body: JSON.stringify({
                    is_online: online,
                    last_seen: new Date().toISOString()
                }),
                keepalive: true
            }).catch(err => console.error('Sync online update error:', err));
        };

        // 1. Mark online immediately
        updateOnlineStatus(true);

        // 2. Set up heartbeat interval every 45 seconds
        const heartbeat = setInterval(() => {
            updateOnlineStatus(true);
        }, 45000);

        // 3. Document visibility change listener
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                updateOnlineStatus(true);
            } else {
                updateOnlineStatus(false);
            }
        };

        // 4. Window beforeunload listener
        const handleBeforeUnload = () => {
            updateOnlineStatusSync(false);
        };

        // 5. Capacitor App State Change listener for mobile apps
        let appStateListener;
        if (Capacitor.isNativePlatform()) {
            appStateListener = CapApp.addListener('appStateChange', (state) => {
                if (state.isActive) {
                    updateOnlineStatus(true);
                } else {
                    updateOnlineStatus(false);
                }
            });
        }

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            clearInterval(heartbeat);
            updateOnlineStatus(false);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('beforeunload', handleBeforeUnload);
            if (appStateListener) {
                appStateListener.then(l => l.remove());
            }
        };
    }, [currentUser?.uid]);

    const openAuthModal = () => setIsAuthModalOpen(true);
    const closeAuthModal = () => setIsAuthModalOpen(false);
    const openLogoutConfirm = () => setIsLogoutConfirmOpen(true);
    const closeLogoutConfirm = () => setIsLogoutConfirmOpen(false);
    const openProfileModal = () => setIsProfileModalOpen(true);
    const closeProfileModal = () => setIsProfileModalOpen(false);

    return (
        <AuthContext.Provider value={{
            currentUser,
            loading,
            isAuthModalOpen,
            isLogoutConfirmOpen,
            isProfileModalOpen,
            isMenuOpen,
            setIsMenuOpen,
            toggleMenu,
            closeMenu,
            login,
            logout,
            updateUser,
            updatePassword,
            openAuthModal,
            closeAuthModal,
            openLogoutConfirm,
            closeLogoutConfirm,
            openProfileModal,
            closeProfileModal
        }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
