import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';
import { setupFCMNotifications } from '../utils/pushManager';
import { supabase } from '../supabase/client';

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();

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
                    await supabase.rpc('update_manager_last_seen', { p_manager_id: user.id });
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
