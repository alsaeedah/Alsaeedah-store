import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import { useEffect } from 'react';
import { setupFCMNotifications } from '../utils/pushManager';
import { db } from '../firebase/config';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

const ProtectedRoute = ({ children }) => {
    const user = useAuthStore(state => state.user);
    const loading = useAuthStore(state => state.loading);

    useEffect(() => {
        if (user) {
            const hasOrdersPermission = user.role === 'super_admin' || user.permissions?.orders;
            if (hasOrdersPermission) {
                setupFCMNotifications(user.id);
            }
        }
    }, [user]);

    // Periodically update manager presence
    useEffect(() => {
        if (user && user.role === 'manager') {
            const updatePresence = async () => {
                try {
                    await updateDoc(doc(db, 'managers', user.id), { last_seen: serverTimestamp() });
                } catch (err) {
                    console.error('Failed to update manager presence:', err);
                }
            };

            updatePresence();
            const interval = setInterval(updatePresence, 60000);
            return () => clearInterval(interval);
        }
    }, [user]);

    if (loading) return <div style={{ color: 'white', textAlign: 'center', marginTop: '20%' }}>جاري التحميل...</div>;

    if (!user) {
        return <Navigate to="/login" />;
    }

    return children;
};

export default ProtectedRoute;
