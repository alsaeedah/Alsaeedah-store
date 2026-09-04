import { createContext, useState, useContext, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase/config';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile, updatePassword as updateFirebasePassword } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { useLoader } from './LoaderContext';
import { StartupProvider } from '@shared/startup/StartupProvider';
import { clearCachedSession } from '@shared/startup/cache';
import { PushNotificationService } from '../notifications';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children, openAuthOnMount = false, onAuthMountHandled }) => {
    const { showLoader, hideLoader } = useLoader();
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => setIsMenuOpen(prev => !prev);
    const closeMenu = () => setIsMenuOpen(false);

    const handledOnMount = useRef(false);
    useEffect(() => {
        if (openAuthOnMount && !handledOnMount.current) {
            handledOnMount.current = true;
            setIsAuthModalOpen(true);
            onAuthMountHandled?.();
        }
    }, [openAuthOnMount, onAuthMountHandled]);

    useEffect(() => {
        // Any auth context specific initialization if needed
        // (StartupProvider handles auth state resolution now)
    }, []);

    // Helper to extract phone from virtual email
    const getPhoneFromEmail = (email) => {
        if (email && email.startsWith('phone_')) {
            return email.split('@')[0].replace('phone_', '');
        }
        return '';
    };

    /**
     * login (using Firebase Auth)
     */
    const login = async (phone, password) => {
        const cleanPhone = phone.trim();
        const emailDashboardFormat = `${cleanPhone}@alsaeedah.store`;
        const emailLegacyFormat = `phone_${cleanPhone}@alsaeedah.store`;
        
        console.log('[AUTH] LOGIN_START - Login started...');
        let userCredential;

        try {
            // 1. Try logging in with the format created by the Dashboard
            userCredential = await signInWithEmailAndPassword(auth, emailDashboardFormat, password);
        } catch (error) {
            if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
                try {
                    // 2. Fallback: try logging in with the old auto-registration format
                    userCredential = await signInWithEmailAndPassword(auth, emailLegacyFormat, password);
                } catch (fallbackError) {
                    throw new Error('الحساب غير موجود أو كلمة المرور غير صحيحة');
                }
            } else {
                throw error;
            }
        }

        console.log('[AUTH] LOGIN_SUCCESS - Firebase authentication succeeded.');
        const firebaseUser = userCredential.user;

        // 3. Immediate State Update
        // Provide a base session to AuthGate so it instantly unmounts the LoginPage
        const baseSession = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName || 'مستخدم',
            image: firebaseUser.photoURL || '',
            role: 'user', // Default safe value
            permissions: {},
            phone: cleanPhone
        };

        setCurrentUser(baseSession);
        
        localStorage.setItem('time-tick-user', JSON.stringify(baseSession));

        // 4. Background Validation is now owned exclusively by StartupProvider's
        //    auth.onAuthStateChanged listener. No need to dispatch it here.
        //    StartupProvider will react to the auth state change and run validation once.

        return true;
    };

    const logout = async () => {
        showLoader('جاري تسجيل الخروج...');

        await PushNotificationService.handleLogout();

        await signOut(auth);
        await clearCachedSession();
        setCurrentUser(null);
        localStorage.removeItem('time-tick-user');
        setIsLogoutConfirmOpen(false);
        setIsProfileModalOpen(false);
        setTimeout(hideLoader, 800);
    };

    /**
     * updateUser
     */
    const updateUser = async (updatedData) => {
        if (!currentUser) return;

        // Update Auth Profile
        const authUpdates = {};
        if (updatedData.name) authUpdates.displayName = updatedData.name;
        if (updatedData.image) authUpdates.photoURL = updatedData.image;
        if (Object.keys(authUpdates).length > 0 && auth.currentUser) {
            await updateProfile(auth.currentUser, authUpdates);
        }

        // Update Firestore Document
        const dbPayload = {};
        if (updatedData.name) dbPayload.name = updatedData.name;
        if (updatedData.image) dbPayload.profile_image_url = updatedData.image;
        if (updatedData.whatsapp !== undefined) dbPayload.whatsapp = updatedData.whatsapp;
        if (updatedData.governorate !== undefined) dbPayload.governorate = updatedData.governorate;
        if (updatedData.district !== undefined) dbPayload.district = updatedData.district;
        if (updatedData.neighborhood !== undefined) dbPayload.neighborhood = updatedData.neighborhood;
        dbPayload.updated_at = new Date().toISOString();

        const { ConnectivityService } = await import('@shared/connectivity/ConnectivityService');
        await ConnectivityService.getInstance().requireOnline();

        try {
            await updateDoc(doc(db, 'users', currentUser.uid), dbPayload);
        } catch (err) {
            // Document might not exist if it's a very old migrated user that somehow missed creation
            await setDoc(doc(db, 'users', currentUser.uid), dbPayload, { merge: true });
        }

        const updatedUser = { ...currentUser, ...updatedData };
        localStorage.setItem('time-tick-user', JSON.stringify(updatedUser));
        setCurrentUser(updatedUser);
    };

    /**
     * updatePassword
     */
    const updatePassword = async (currentPassword, newPassword) => {
        if (!currentUser || !auth.currentUser) throw new Error('بيانات المستخدم غير متوفرة');

        const email = auth.currentUser.email;
        try {
            await signInWithEmailAndPassword(auth, email, currentPassword);
            await updateFirebasePassword(auth.currentUser, newPassword);
        } catch (error) {
            throw new Error('كلمة المرور الحالية غير صحيحة');
        }
    };



    const openAuthModal = () => setIsAuthModalOpen(true);
    const closeAuthModal = () => setIsAuthModalOpen(false);
    const openLogoutConfirm = () => setIsLogoutConfirmOpen(true);
    const closeLogoutConfirm = () => setIsLogoutConfirmOpen(false);
    const openProfileModal = () => setIsProfileModalOpen(true);
    const closeProfileModal = () => setIsProfileModalOpen(false);
    const openProfilePage = () => navigate('/profile');

    const handleSessionResolved = useCallback((session) => {
        console.log('[STARTUP] SESSION_RESOLVED');
        setCurrentUser(session);
        if (session) {
            localStorage.setItem('time-tick-user', JSON.stringify(session));
            setIsAuthModalOpen(false);
        }
        setLoading(false);
    }, []);

    const handleSessionUpdated = useCallback((session) => {
        setCurrentUser(session);
        if (session) {
            localStorage.setItem('time-tick-user', JSON.stringify(session));
        }
    }, []);

    const handleForceLogout = useCallback(() => {
        setCurrentUser(null);
        localStorage.removeItem('time-tick-user');
    }, []);

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
            closeProfileModal,
            openProfilePage
        }}>
            <StartupProvider
                auth={auth}
                db={db}
                appName="store"
                onSessionResolved={handleSessionResolved}
                onSessionUpdated={handleSessionUpdated}
                onForceLogout={handleForceLogout}
            >
                {!loading && children}
            </StartupProvider>
        </AuthContext.Provider>
    );
};
