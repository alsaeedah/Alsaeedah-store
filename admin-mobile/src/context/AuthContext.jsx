import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabase/client';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Restore session from localStorage on mount
    useEffect(() => {
        const storedUser = localStorage.getItem('admin_mobile_user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (_) {
                localStorage.removeItem('admin_mobile_user');
            }
        }
        setLoading(false);
    }, []);

    // Real-time manager updates (deactivation / permission changes)
    useEffect(() => {
        if (!user || user.role !== 'manager' || !user.id) return;

        const authChannel = supabase.channel('mobile-manager-updates')
            .on('broadcast', { event: 'manager_updated' }, (payload) => {
                const data = payload.payload;
                if (data.id === user.id) {
                    if (data.is_active === false) {
                        logout();
                        return;
                    }
                    const updated = { ...user, name: data.name, email: data.email, permissions: data.permissions };
                    setUser(updated);
                    localStorage.setItem('admin_mobile_user', JSON.stringify(updated));
                }
            })
            .on('broadcast', { event: 'manager_deleted' }, (payload) => {
                const data = payload.payload;
                if (data.id === user.id) logout();
            })
            .subscribe();

        return () => { supabase.removeChannel(authChannel); };
    }, [user?.id, user?.role]);

    const login = async (email, password) => {
        const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
        const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD;

        // Super admin login
        if (email === adminEmail && password === adminPassword) {
            const mockUser = {
                id: 'admin-user',
                uid: 'admin-user',
                email,
                name: 'المدير العام',
                role: 'super_admin',
                permissions: { products: true, orders: true, users: true, managers: true },
            };
            localStorage.setItem('admin_mobile_user', JSON.stringify(mockUser));
            setUser(mockUser);
            return true;
        }

        // Manager login via Supabase RPC
        try {
            const { data, error } = await supabase.rpc('verify_manager_login', {
                p_email: email.trim(),
                p_password: password,
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
                    permissions: manager.permissions,
                };
                localStorage.setItem('admin_mobile_user', JSON.stringify(mockUser));
                setUser(mockUser);
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
        localStorage.removeItem('admin_mobile_user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
