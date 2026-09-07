import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import { useEffect } from 'react';
import { setupFCMNotifications } from '../utils/pushManager';

const ProtectedRoute = ({ children }) => {
    const user = useAuthStore(state => state.user);
    const authState = useAuthStore(state => state.authState);
    const hasPermission = useAuthStore(state => state.hasPermission);

    useEffect(() => {
        if (authState === 'READY' && user) {
            const hasOrdersPermission = hasPermission('orders');
            if (hasOrdersPermission) {
                setupFCMNotifications(user.uid);
            }
        }
    }, [user, authState, hasPermission]);

    // Show loading state if still resolving
    if (authState === 'INITIALIZING' || authState === 'AUTHENTICATING' || authState === 'RESOLVING_AUTHORIZATION') {
        return <div style={{ color: 'white', textAlign: 'center', marginTop: '20%' }}>جاري التحميل...</div>;
    }

    // Show error state if authorization failed
    if (authState === 'ERROR') {
        return (
            <div style={{ color: 'red', textAlign: 'center', marginTop: '20%', direction: 'rtl' }}>
                <p>حدث خطأ أثناء التحقق من الصلاحيات.</p>
                <button 
                    onClick={() => window.location.reload()} 
                    style={{ marginTop: '10px', padding: '8px 16px', background: '#333', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                    إعادة المحاولة
                </button>
            </div>
        );
    }

    // Redirect to login if signed out
    if (authState === 'SIGNED_OUT' || !user) {
        return <Navigate to="/login" />;
    }

    // Show dashboard only if READY
    if (authState === 'READY') {
        return children;
    }

    return null;
};

export default ProtectedRoute;
