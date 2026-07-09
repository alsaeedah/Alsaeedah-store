import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase/client';
import Swal from 'sweetalert2';
import { listenForForegroundMessages } from '../utils/pushManager';
import {
    LayoutDashboard,
    LogOut,
    User,
    Menu,
    X,
    ShoppingBag,
    ShoppingCart,
    Users,
    Bell,
    Plus,
    Shield,
    Settings as SettingsIcon
} from 'lucide-react';

const logo = '/logo.png';

const playNotificationSound = () => {
    try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play().catch(e => console.log("Audio play failed (interaction needed first):", e));
    } catch (e) {
        console.error("Audio error", e);
    }
};

const DashboardLayout = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { logout, user } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // FCM foreground notification listener
    useEffect(() => {
        const hasOrdersPermission = user?.role === 'super_admin' || user?.permissions?.orders;
        if (!hasOrdersPermission) return;

        const unsubscribe = listenForForegroundMessages(({ orderId, orderNumber, title, body }) => {
            playNotificationSound();
            Swal.fire({
                title: title || 'طلب جديد!',
                text: body || `تم استلام طلب جديد`,
                icon: 'success',
                toast: true,
                position: 'top-end',
                showConfirmButton: true,
                confirmButtonText: 'عرض الطلب',
                confirmButtonColor: 'var(--primary)',
                showCloseButton: true,
                timer: 8000,
                timerProgressBar: true,
                background: '#141414',
                color: '#fff'
            }).then((result) => {
                if (result.isConfirmed && orderId) {
                    navigate(`/orders?highlight=${orderId}`);
                }
            });
        });

        return () => unsubscribe();
    }, [user, navigate]);

    const fetchPendingCount = async () => {
        const { count, error } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending');

        if (!error) {
            setPendingCount(count || 0);
        }
    };

    useEffect(() => {
        const hasOrdersPermission = user?.role === 'super_admin' || user?.permissions?.orders;
        if (!hasOrdersPermission) return;

        fetchPendingCount();

        const channel = supabase
            .channel('global-orders')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'orders' },
                (payload) => {
                    fetchPendingCount();
                    if (payload.eventType === 'INSERT') {
                        // Silently update the pending count, notification is handled by FCM
                        // (See listenForForegroundMessages above)
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    const toggleMobileSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    const menuItems = [];

    if (user?.role === 'super_admin') {
        menuItems.push({ path: '/', label: 'الرئيسية', icon: LayoutDashboard });
    }

    if (user?.role === 'super_admin' || user?.permissions?.products) {
        menuItems.push({ path: '/products', label: 'المنتجات', icon: ShoppingBag });
    }

    if (user?.role === 'super_admin' || user?.permissions?.orders) {
        menuItems.push({ path: '/orders', label: 'الطلبات', icon: ShoppingCart, badge: pendingCount > 0 ? pendingCount : null });
    }

    if (user?.role === 'super_admin' || user?.permissions?.users) {
        menuItems.push({ path: '/users', label: 'المستخدمين', icon: Users });
    }

    if (user?.role === 'super_admin') {
        menuItems.push({ path: '/managers', label: 'المدراء', icon: Shield });
        menuItems.push({ path: '/settings', label: 'الإعدادات', icon: SettingsIcon });
    }

    return (
        <div className="dashboard-container">
            {/* Mobile Menu Button */}
            <button className="mobile-menu-btn" onClick={toggleMobileSidebar}>
                {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Overlay */}
            {isSidebarOpen && (
                <div
                    className="sidebar-overlay open"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`glass-panel sidebar ${isSidebarOpen ? 'open' : ''}`}>
                {/* Brand Layer */}
                <div style={{ paddingBottom: '2rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1rem', position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ position: 'relative' }}>
                            <img
                                src={logo} alt="متجر السعيدة" style={{
                                    width: '60px',
                                    height: '60px',
                                    borderRadius: '12px',
                                    boxShadow: '0 0 15px rgba(212, 175, 55, 0.2)',
                                    border: '1px solid var(--primary)',
                                    transition: '0.3s'
                                }}
                            />
                        </div>
                        <div className="brand-name" style={{ transition: '0.3s' }}>
                            <h2 style={{ fontSize: '1.2rem', color: '#fff', fontWeight: '800', letterSpacing: '0.5px' }}>
                                <span style={{ color: 'var(--primary)' }}>متجر</span> السعيدة
                            </h2>
                            <p className="brand-desc" style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '500' }}>
                                نظام إدارة المتجر
                            </p>
                        </div>
                    </div>
                </div>

                {/* Navigation Layer */}
                <nav className="sidebar-nav">
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsSidebarOpen(false)}
                                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                            >
                                <item.icon size={22} className="nav-icon" />
                                <span className="nav-text" style={{ transition: '0.3s' }}>{item.label}</span>
                                {item.badge && (
                                    <span style={{
                                        background: '#ef4444',
                                        color: '#fff',
                                        fontSize: '0.65rem',
                                        fontWeight: 'bold',
                                        padding: '2px 6px',
                                        borderRadius: '10px',
                                        marginRight: 'auto',
                                        transition: '0.2s'
                                    }}>
                                        {item.badge}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* User Section */}
                <div style={{
                    marginTop: 'auto',
                    paddingTop: '1rem',
                    borderTop: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 8px'
                    }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            minWidth: '40px',
                            borderRadius: '12px',
                            background: 'rgba(212, 175, 55, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid rgba(212, 175, 55, 0.2)'
                        }}>
                            <User size={18} color="var(--primary)" />
                        </div>
                        <div className="user-details" style={{ transition: '0.3s', overflow: 'hidden' }}>
                            <p style={{ fontSize: '0.85rem', fontWeight: '700', color: '#fff', whiteSpace: 'nowrap' }}>
                                {user?.role === 'super_admin' ? 'المدير العام' : (user?.name || 'مدير قسم')}
                            </p>
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>{user?.email}</p>
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--nav-item-gap)',
                            padding: 'var(--nav-item-padding)',
                            color: '#ef4444',
                            background: 'rgba(239, 68, 68, 0.05)',
                            border: 'none',
                            cursor: 'pointer',
                            borderRadius: 'var(--radius-md)',
                            width: '100%',
                            fontWeight: '600',
                            transition: '0.3s',
                            justifyContent: 'flex-start',
                            marginBottom: '0.5rem'
                        }}
                    >
                        <LogOut size={20} />
                        <span style={{ fontSize: '0.9rem' }}>تسجيل الخروج</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                <div className="glass-panel main-panel">
                    {/* Decorative Background for Main Content */}
                    <div style={{
                        position: 'absolute',
                        top: '-150px',
                        right: '-150px',
                        width: '300px',
                        height: '300px',
                        background: 'var(--primary)',
                        filter: 'blur(150px)',
                        opacity: '0.04',
                        zIndex: 0
                    }} />

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;
