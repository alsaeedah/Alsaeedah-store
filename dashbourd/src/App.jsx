import React, { useEffect, useCallback } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import DashboardLayout from './components/DashboardLayout';
import Products from './pages/Products';
import AddProduct from './pages/AddProduct';
import EditProduct from './pages/EditProduct';
import Inventory from './pages/Inventory';
import ProtectedRoute from './components/ProtectedRoute';
import ProtectedModule from './components/ProtectedModule';
import { LoadingProvider } from './context/LoadingContext';
import TopProgressBar from './components/TopProgressBar';
import Users from './pages/Users';
import Orders from './pages/Orders';
import Home from './pages/Home';
import Settings from './pages/Settings';
import Taxonomy from './pages/Taxonomy';
import Managers from './pages/Managers';
import Unauthorized from './pages/Unauthorized';

import { StartupProvider } from '@shared/startup/StartupProvider';
import { auth, db } from './firebase/config';
import useAuthStore from './store/useAuthStore';
import { clearCachedSession } from '@shared/startup/cache';
import { initTaxonomyStore } from './services/taxonomyService';

function App() {
  useEffect(() => {
    initTaxonomyStore().catch(err => console.error('[App] taxonomy init failed:', err));
  }, []);

  // Memoize callbacks so StartupProvider's auth listener never re-subscribes
  // unnecessarily due to inline function identity changes on re-renders.
  const handleSessionResolved = useCallback((session) => {
    if (!session) {
      useAuthStore.getState().setSession(null);
    }
    // For Dashboard, we do not call setSession(session) here if it exists.
    // This prevents a stale cached session from granting permissions before
    // the background validation (authSync) confirms them against Firestore.
    // ProtectedRoute will remain in the "loading" state until onSessionUpdated is called.
  }, []);

  const handleAuthSyncStart = useCallback(() => {
    useAuthStore.getState().setAuthState('RESOLVING_AUTHORIZATION');
  }, []);

  const handleSessionUpdated = useCallback((session) => {
    useAuthStore.getState().setSession(session);
  }, []);

  const handleAuthSyncError = useCallback((error) => {
    useAuthStore.getState().setAuthError(error);
  }, []);

  const handleForceLogout = useCallback(() => {
    useAuthStore.getState().setSession(null);
    clearCachedSession();
  }, []);

  return (
    <StartupProvider
        auth={auth}
        db={db}
        appName="dashboard"
        onSessionResolved={handleSessionResolved}
        onSessionUpdated={handleSessionUpdated}
        onForceLogout={handleForceLogout}
        onAuthSyncStart={handleAuthSyncStart}
        onAuthSyncError={handleAuthSyncError}
    >
      <LoadingProvider>
        <TopProgressBar />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    
                    <Route path="/products" element={<ProtectedModule permission="products"><Products /></ProtectedModule>} />
                    <Route path="/products/add" element={<ProtectedModule permission="products"><AddProduct /></ProtectedModule>} />
                    <Route path="/products/edit/:id" element={<ProtectedModule permission="products"><EditProduct /></ProtectedModule>} />
                    <Route path="/inventory" element={<ProtectedModule permission="products"><Inventory /></ProtectedModule>} />
                    
                    <Route path="/orders" element={<ProtectedModule permission="orders"><Orders /></ProtectedModule>} />
                    <Route path="/users" element={<ProtectedModule permission="users"><Users /></ProtectedModule>} />
                    
                    <Route path="/settings" element={<ProtectedModule permission="settings"><Settings /></ProtectedModule>} />
                    <Route path="/taxonomy" element={<ProtectedModule permission="settings"><Taxonomy /></ProtectedModule>} />
                    <Route path="/settings/taxonomy" element={<Navigate to="/taxonomy" replace />} />
                    <Route path="/managers" element={<ProtectedModule permission="managers"><Managers /></ProtectedModule>} />
                    
                    <Route path="/unauthorized" element={<Unauthorized />} />
                  </Routes>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </LoadingProvider>
    </StartupProvider>
  );
}

export default App;
