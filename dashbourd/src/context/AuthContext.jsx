import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabase/client';
import { setupFCMNotifications, refreshFCMToken } from '../utils/pushManager';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('dash_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        if (!user || user.role !== 'manager' || !user.id) return;

        const authChannel = supabase.channel('global-manager-updates')
            .on('broadcast', { event: 'manager_updated' }, (payload) => {
                const data = payload.payload;
                if (data.id === user.id) {
                    if (data.is_active === false) {
                        logout();
                        window.location.href = '/login';
                        return;
                    }
                    const newUserData = {
                        ...user,
                        name: data.name,
                        email: data.email,
                        permissions: data.permissions
                    };
                    setUser(newUserData);
                    localStorage.setItem('dash_user', JSON.stringify(newUserData));
                }
            })
            .on('broadcast', { event: 'manager_deleted' }, (payload) => {
                const data = payload.payload;
                if (data.id === user.id) {
                    logout();
                    window.location.href = '/login';
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(authChannel);
        };
    }, [user?.id, user?.role]);

    const login = async (email, password) => {
        const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
        const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD;

        if (email === adminEmail && password === adminPassword) {
            const mockUser = {
                id: 'admin-user',
                uid: 'admin-user',
                email: email,
                name: 'المدير العام',
                role: 'super_admin',
                permissions: { products: true, orders: true, users: true, managers: true }
            };
            localStorage.setItem('dash_user', JSON.stringify(mockUser));
            setUser(mockUser);
            // Register FCM token asynchronously — must not block login
            setupFCMNotifications('admin-user').catch(err =>
                console.warn('[FCM] Admin token registration failed:', err)
            );
            return true;
        }

        try {
            const { data, error } = await supabase.rpc('verify_manager_login', {
                p_email: email.trim(),
                p_password: password
            });

            if (error) throw error;

            if (data && data.length > 0) {
                const manager = data[0];
                const mockUser = {
                    id: manager.id,
                    uid: manager.id,
                    email: manager.email,
                    name: manager.name,
                    role: 'manager',
                    permissions: manager.permissions
                };
                localStorage.setItem('dash_user', JSON.stringify(mockUser));
                setUser(mockUser);
                // Register FCM token asynchronously — must not block login
                setupFCMNotifications(manager.id).catch(err =>
                    console.warn('[FCM] Manager token registration failed:', err)
                );
                return true;
            } else {
                throw new Error('بيانات الدخول غير صحيحة أو الحساب معطّل');
            }
        } catch (err) {
            console.error('Login error:', err);
            throw new Error(err.message || 'بيانات الدخول غير صحيحة');
        }
    };

    const logout = () => {
        localStorage.removeItem('dash_user');
        setUser(null);
    };

    const value = {
        user,
        loading,
        login,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
