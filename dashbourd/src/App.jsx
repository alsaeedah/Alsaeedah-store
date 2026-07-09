import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import DashboardLayout from './components/DashboardLayout';
import Products from './pages/Products';
import AddProduct from './pages/AddProduct';
import EditProduct from './pages/EditProduct';
import ProtectedRoute from './components/ProtectedRoute';
import { LoadingProvider } from './context/LoadingContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import TopProgressBar from './components/TopProgressBar';
import Users from './pages/Users';
import Orders from './pages/Orders';
import Home from './pages/Home';
import Settings from './pages/Settings';
import Managers from './pages/Managers';
import Unauthorized from './pages/Unauthorized';

const ManagerRoute = ({ permission, children }) => {
  const { user } = useAuth();
  if (user?.role === 'super_admin') return children;
  if (user?.role === 'manager' && user?.permissions?.[permission]) return children;
  return <Navigate to="/unauthorized" replace />;
};

const SuperAdminRoute = ({ children }) => {
  const { user } = useAuth();
  if (user?.role === 'super_admin') return children;
  return <Navigate to="/unauthorized" replace />;
};

function App() {
  return (
    <AuthProvider>
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
                    
                    <Route path="/products" element={<ManagerRoute permission="products"><Products /></ManagerRoute>} />
                    <Route path="/products/add" element={<ManagerRoute permission="products"><AddProduct /></ManagerRoute>} />
                    <Route path="/products/edit/:id" element={<ManagerRoute permission="products"><EditProduct /></ManagerRoute>} />
                    
                    <Route path="/orders" element={<ManagerRoute permission="orders"><Orders /></ManagerRoute>} />
                    <Route path="/users" element={<ManagerRoute permission="users"><Users /></ManagerRoute>} />
                    
                    <Route path="/settings" element={<SuperAdminRoute><Settings /></SuperAdminRoute>} />
                    <Route path="/managers" element={<SuperAdminRoute><Managers /></SuperAdminRoute>} />
                    
                    <Route path="/unauthorized" element={<Unauthorized />} />
                  </Routes>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </LoadingProvider>
    </AuthProvider>
  );
}

export default App;
