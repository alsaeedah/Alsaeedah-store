import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoadingProvider } from './context/LoadingContext';
import ProtectedRoute from './components/ProtectedRoute';
import MobileLayout from './components/MobileLayout';
import TopProgressBar from './components/TopProgressBar';

// Pages
import Login from './pages/Login';
import Home from './pages/Home';
import Products from './pages/Products';
import Orders from './pages/Orders';
import Users from './pages/Users';
import Settings from './pages/Settings';
import Managers from './pages/Managers';
import Unauthorized from './pages/Unauthorized';

// ─── Permission Guards ────────────────────────────────────────────────────────
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

// ─── App ─────────────────────────────────────────────────────────────────────
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
                                <MobileLayout>
                                    <Routes>
                                        <Route path="/" element={<Home />} />

                                        <Route
                                            path="/products"
                                            element={
                                                <ManagerRoute permission="products">
                                                    <Products />
                                                </ManagerRoute>
                                            }
                                        />

                                        <Route
                                            path="/orders"
                                            element={
                                                <ManagerRoute permission="orders">
                                                    <Orders />
                                                </ManagerRoute>
                                            }
                                        />

                                        <Route
                                            path="/users"
                                            element={
                                                <ManagerRoute permission="users">
                                                    <Users />
                                                </ManagerRoute>
                                            }
                                        />

                                        <Route
                                            path="/settings"
                                            element={
                                                <SuperAdminRoute>
                                                    <Settings />
                                                </SuperAdminRoute>
                                            }
                                        />

                                        <Route
                                            path="/managers"
                                            element={
                                                <SuperAdminRoute>
                                                    <Managers />
                                                </SuperAdminRoute>
                                            }
                                        />

                                        <Route path="/unauthorized" element={<Unauthorized />} />
                                    </Routes>
                                </MobileLayout>
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </LoadingProvider>
        </AuthProvider>
    );
}

export default App;
