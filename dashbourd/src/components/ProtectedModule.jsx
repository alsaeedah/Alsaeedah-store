import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

const ProtectedModule = ({ permission, children }) => {
    const hasPermission = useAuthStore(state => state.hasPermission);
    const loading = useAuthStore(state => state.loading);

    if (loading) return null; // Let the main ProtectedRoute or App handle loading state

    if (hasPermission(permission)) {
        return children;
    }

    return <Navigate to="/unauthorized" replace />;
};

export default ProtectedModule;
