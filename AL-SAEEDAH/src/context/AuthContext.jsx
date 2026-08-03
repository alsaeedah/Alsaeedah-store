import { createContext, useState, useContext, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase/config';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile, updatePassword as updateFirebasePassword } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { useLoader } from './LoaderContext';
import { StartupProvider } from '@shared/startup/StartupProvider';
import { clearCachedSession } from '@shared/startup/cache';

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
        
        try {
            // 1. Try logging in with the format created by the Dashboard
            await signInWithEmailAndPassword(auth, emailDashboardFormat, password);
            return true;
        } catch (error) {
            if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
                try {
                    // 2. Fallback: try logging in with the old auto-registration format
                    await signInWithEmailAndPassword(auth, emailLegacyFormat, password);
                    return true;
                } catch (fallbackError) {
                    throw new Error('الحساب غير موجود أو كلمة المرور غير صحيحة');
                }
            }
            throw error;
        }
    };

    const logout = async () => {
        showLoader('جاري تسجيل الخروج...');

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
                onSessionResolved={(session) => {
                    setCurrentUser(session);
                    if (session) {
                        localStorage.setItem('time-tick-user', JSON.stringify(session));
                        setIsAuthModalOpen(false);
                    }
                    setLoading(false);
                }}
                onSessionUpdated={(session) => {
                    setCurrentUser(session);
                    if (session) {
                        localStorage.setItem('time-tick-user', JSON.stringify(session));
                    }
                }}
                onForceLogout={() => {
                    setCurrentUser(null);
                    localStorage.removeItem('time-tick-user');
                }}
            >
                {!loading && children}
            </StartupProvider>
        </AuthContext.Provider>
    );
};
