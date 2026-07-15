import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase/client';
import {
    LayoutDashboard,
    ShoppingBag,
    ShoppingCart,
    Users,
    Settings,
    Shield,
    LogOut,
    Bell,
    ChevronLeft,
} from 'lucide-react';
import Swal from 'sweetalert2';

// ─── Notification Sound ───────────────────────────────────────────────────────
const playNotificationSound = () => {
    try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play().catch(() => {});
    } catch (_) {}
};

// ─── Mobile Layout ─────────────────────────────────────────────────────────────
const MobileLayout = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();
    const [pendingCount, setPendingCount] = useState(0);
    const notifiedOrdersRef = useRef(new Set());

    // ── Build nav items based on role/permissions ─────────────────────────────
    const navItems = [];

    if (user?.role === 'super_admin') {
        navItems.push({ path: '/', label: 'الرئيسية', Icon: LayoutDashboard });
    }

    if (user?.role === 'super_admin' || user?.permissions?.products) {
        navItems.push({ path: '/products', label: 'المنتجات', Icon: ShoppingBag });
    }

    if (user?.role === 'super_admin' || user?.permissions?.orders) {
        navItems.push({
            path: '/orders',
            label: 'الطلبات',
            Icon: ShoppingCart,
            badge: pendingCount > 0 ? pendingCount : null,
        });
    }

    if (user?.role === 'super_admin' || user?.permissions?.users) {
        navItems.push({ path: '/users', label: 'العملاء', Icon: Users });
    }

    if (user?.role === 'super_admin') {
        navItems.push({ path: '/settings', label: 'الإعدادات', Icon: Settings });
    } else {
        // Managers always get a logout/settings placeholder
        navItems.push({ path: '/settings', label: 'الإعدادات', Icon: Settings });
    }

    // ── New order notification handler ────────────────────────────────────────
    const handleNewOrderNotification = (orderId, title, body) => {
        if (orderId && notifiedOrdersRef.current.has(orderId)) return;
        if (orderId) notifiedOrdersRef.current.add(orderId);

        playNotificationSound();
        Swal.fire({
            title: title || 'طلب جديد!',
            text: body || 'تم استلام طلب جديد',
            icon: 'success',
            toast: true,
            position: 'top-end',
            showConfirmButton: true,
            confirmButtonText: 'عرض الطلب',
            confirmButtonColor: '#d4af37',
            showCloseButton: true,
            timer: 8000,
            timerProgressBar: true,
            background: '#141414',
            color: '#fff',
        }).then((result) => {
            if (result.isConfirmed && orderId) {
                navigate(`/orders?highlight=${orderId}`);
            }
        });
    };

    // ── Pending orders count & realtime subscription ──────────────────────────
    useEffect(() => {
        const hasOrdersAccess = user?.role === 'super_admin' || user?.permissions?.orders;
        if (!hasOrdersAccess) return;

        const fetchPendingCount = async () => {
            const { count, error } = await supabase
                .from('orders')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'pending');
            if (!error) setPendingCount(count || 0);
        };

        fetchPendingCount();

        const channel = supabase
            .channel('mobile-orders-channel')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
                fetchPendingCount();
                if (payload.eventType === 'INSERT' && payload.new?.id) {
                    handleNewOrderNotification(payload.new.id, 'طلب جديد!', 'تم استلام طلب جديد');
                }
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [user]);

    const handleLogout = () => {
        Swal.fire({
            title: 'تسجيل الخروج',
            text: 'هل أنت متأكد من تسجيل الخروج؟',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#d4af37',
            cancelButtonColor: 'rgba(255,255,255,0.1)',
            confirmButtonText: 'نعم',
            cancelButtonText: 'إلغاء',
            background: '#141414',
            color: '#fff',
        }).then((result) => {
            if (result.isConfirmed) {
                logout();
                navigate('/login');
            }
        });
    };

    const isActive = (path) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
    };

    return (
        <div className="mobile-app">
            {/* Top progress bar slot */}
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999 }}>
                {/* TopProgressBar is rendered at App level */}
            </div>

            {/* Page content */}
            <div className="mobile-page fade-in">
                {children}
            </div>

            {/* ── Bottom Navigation ── */}
            <nav className="bottom-nav">
                {navItems.map(({ path, label, Icon, badge }) => (
                    <button
                        key={path}
                        className={`nav-item ${isActive(path) ? 'active' : ''}`}
                        onClick={() => navigate(path)}
                        aria-label={label}
                    >
                        <div className="nav-icon-wrap">
                            <Icon
                                size={22}
                                strokeWidth={isActive(path) ? 2.5 : 1.8}
                            />
                            {badge && (
                                <span className="nav-badge">
                                    {badge > 99 ? '99+' : badge}
                                </span>
                            )}
                        </div>
                        <span className="nav-label">{label}</span>
                    </button>
                ))}

                {/* Logout button */}
                <button
                    className="nav-item"
                    onClick={handleLogout}
                    aria-label="تسجيل الخروج"
                    style={{ color: '#ef4444' }}
                >
                    <div className="nav-icon-wrap">
                        <LogOut size={22} strokeWidth={1.8} />
                    </div>
                    <span className="nav-label">خروج</span>
                </button>
            </nav>
        </div>
    );
};

export default MobileLayout;
