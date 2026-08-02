import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import DashboardLayout from './components/DashboardLayout';
import Products from './pages/Products';
import AddProduct from './pages/AddProduct';
import EditProduct from './pages/EditProduct';
import ProtectedRoute from './components/ProtectedRoute';
import ProtectedModule from './components/ProtectedModule';
import { LoadingProvider } from './context/LoadingContext';
import TopProgressBar from './components/TopProgressBar';
import Users from './pages/Users';
import Orders from './pages/Orders';
import Home from './pages/Home';
import Settings from './pages/Settings';
import Managers from './pages/Managers';
import Unauthorized from './pages/Unauthorized';

function App() {
  return (
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
                  
                  <Route path="/orders" element={<ProtectedModule permission="orders"><Orders /></ProtectedModule>} />
                  <Route path="/users" element={<ProtectedModule permission="users"><Users /></ProtectedModule>} />
                  
                  <Route path="/settings" element={<ProtectedModule permission="settings"><Settings /></ProtectedModule>} />
                  <Route path="/managers" element={<ProtectedModule permission="managers"><Managers /></ProtectedModule>} />
                  
                  <Route path="/unauthorized" element={<Unauthorized />} />
                </Routes>
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </LoadingProvider>
  );
}

export default App;
