import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

const ProtectedModule = ({ permission, children }) => {
    const hasPermission = useAuthStore(state => state.hasPermission);
    const loading = useAuthStore(state => state.loading);
    const user = useAuthStore(state => state.user);

    if (loading) return null; // Let the main ProtectedRoute or App handle loading state

    // Guard: if the user is a manager but their permissions haven't been fetched yet
    // (empty permissions map), hold rendering instead of redirecting to /unauthorized.
    // Background validation will populate permissions and trigger a re-render.
    if (user && user.role !== 'super_admin' && user.permissions && Object.keys(user.permissions).length === 0) {
        return null;
    }

    if (hasPermission(permission)) {
        return children;
    }

    return <Navigate to="/unauthorized" replace />;
};

export default ProtectedModule;
