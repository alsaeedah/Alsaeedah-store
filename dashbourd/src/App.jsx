import React, { useEffect } from 'react';
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

  return (
    <StartupProvider
        auth={auth}
        db={db}
        appName="dashboard"
        onSessionResolved={(session) => {
            useAuthStore.getState().setSession(session);
        }}
        onSessionUpdated={(session) => {
            useAuthStore.getState().setSession(session);
        }}
        onForceLogout={() => {
            useAuthStore.getState().setSession(null);
            clearCachedSession();
        }}
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
