import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import { useEffect } from 'react';
import { setupFCMNotifications } from '../utils/pushManager';

const ProtectedRoute = ({ children }) => {
    const user = useAuthStore(state => state.user);
    const loading = useAuthStore(state => state.loading);
    const hasPermission = useAuthStore(state => state.hasPermission);

    useEffect(() => {
        if (user) {
            const hasOrdersPermission = hasPermission('orders');
            if (hasOrdersPermission) {
                setupFCMNotifications(user.uid);
            }
        }
    }, [user]);


    if (loading) return <div style={{ color: 'white', textAlign: 'center', marginTop: '20%' }}>جاري التحميل...</div>;

    if (!user) {
        return <Navigate to="/login" />;
    }

    return children;
};

export default ProtectedRoute;
