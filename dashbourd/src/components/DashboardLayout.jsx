import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import { db } from '../firebase/config';
import { collection, query, where, getCountFromServer, onSnapshot, limit, orderBy } from 'firebase/firestore';
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
    Tag,
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
    const user = useAuthStore(state => state.user);
    const logout = useAuthStore(state => state.logout);
    const hasPermission = useAuthStore(state => state.hasPermission);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);
    const notifiedOrdersRef = useRef(new Set());

    const handleNewOrderNotification = (orderId, orderNumber, title, body) => {
        if (orderId && notifiedOrdersRef.current.has(orderId)) return;
        if (orderId) notifiedOrdersRef.current.add(orderId);
        
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
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // FCM foreground notification listener
    useEffect(() => {
        const hasOrdersPermission = hasPermission('orders');
        if (!hasOrdersPermission) return;

        const unsubscribe = listenForForegroundMessages(({ orderId, orderNumber, title, body }) => {
            handleNewOrderNotification(orderId, orderNumber, title, body);
        });

        return () => unsubscribe();
    }, [user, navigate]);

    const fetchPendingCount = async () => {
        try {
            const q = query(collection(db, 'orders'), where('status', '==', 'pending'));
            const snapshot = await getCountFromServer(q);
            setPendingCount(snapshot.data().count);
        } catch (error) {
            console.error('Error fetching pending count:', error);
        }
    };

    useEffect(() => {
        const hasOrdersPermission = hasPermission('orders');
        if (!hasOrdersPermission) return;

        fetchPendingCount();

        const q = query(collection(db, 'orders'), orderBy('created_at', 'desc'), limit(10));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            fetchPendingCount();
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const newOrder = { id: change.doc.id, ...change.doc.data() };
                    // Handle new order notification (only if it's recently created, though full real-time syncing might re-trigger. 
                    // In a production app you might check if created_at is recent)
                    if (newOrder.status === 'pending') {
                        handleNewOrderNotification(newOrder.id, newOrder.order_number, 'طلب جديد!', 'تم استلام طلب جديد');
                    }
                }
            });
        });

        return () => {
            unsubscribe();
        };
    }, [user]);

    const toggleMobileSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    const menuItems = [];

    // Home is typically accessible by everyone who can log in, or we can check a base permission.
    // However, if we want only super_admin to see the home dashboard (stats), we keep it as super_admin, 
    // or maybe everyone can see it? The PRD doesn't specify Home restrictions. I'll leave home as is or change to user
    // Since previous logic was `if (user?.role === 'super_admin')`, I'll keep it as super_admin for home.
    if (user?.role === 'super_admin') {
        menuItems.push({ path: '/', label: 'الرئيسية', icon: LayoutDashboard });
    }

    if (hasPermission('products')) {
        menuItems.push({ path: '/products', label: 'المنتجات', icon: ShoppingBag });
    }

    if (hasPermission('settings')) {
        menuItems.push({ path: '/taxonomy', label: 'إدارة التصنيفات', icon: Tag });
    }

    if (hasPermission('orders')) {
        menuItems.push({ path: '/orders', label: 'الطلبات', icon: ShoppingCart, badge: pendingCount > 0 ? pendingCount : null });
    }

    if (hasPermission('users')) {
        menuItems.push({ path: '/users', label: 'المستخدمين', icon: Users });
    }

    if (hasPermission('managers')) {
        menuItems.push({ path: '/managers', label: 'المدراء', icon: Shield });
    }
    
    if (hasPermission('settings')) {
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
                <div style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '0.5rem', position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                            <img
                                src={logo} alt="متجر السعيدة" style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '12px',
                                    boxShadow: '0 0 12px rgba(212, 175, 55, 0.15)',
                                    border: '1px solid rgba(212, 175, 55, 0.25)',
                                    transition: '0.3s',
                                    objectFit: 'cover'
                                }}
                            />
                        </div>
                        <div className="brand-name" style={{ transition: '0.3s', minWidth: 0 }}>
                            <h2 style={{ fontSize: '1.05rem', color: '#fff', fontWeight: '700', letterSpacing: '0.3px', lineHeight: 1.2 }}>
                                <span style={{ color: 'var(--primary)' }}>متجر</span> السعيدة
                            </h2>
                            <p className="brand-desc" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '400', marginTop: '2px' }}>
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
                                <item.icon size={20} className="nav-icon" />
                                <span className="nav-text" style={{ fontSize: 'var(--nav-font-size)', flex: 1 }}>{item.label}</span>
                                {item.badge && (
                                    <span style={{
                                        background: '#ef4444',
                                        color: '#fff',
                                        fontSize: '0.6rem',
                                        fontWeight: '700',
                                        padding: '2px 5px',
                                        borderRadius: '8px',
                                        lineHeight: 1.4,
                                        letterSpacing: '0.02em'
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
                    paddingTop: '0.875rem',
                    borderTop: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px 6px'
                    }}>
                        <div style={{
                            width: '36px',
                            height: '36px',
                            minWidth: '36px',
                            borderRadius: '10px',
                            background: 'rgba(212, 175, 55, 0.08)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid rgba(212, 175, 55, 0.15)'
                        }}>
                            <User size={16} color="var(--primary)" />
                        </div>
                        <div className="user-details" style={{ overflow: 'hidden' }}>
                            <p style={{ fontSize: '0.8rem', fontWeight: '600', color: '#fff', whiteSpace: 'nowrap' }}>
                                {user?.role === 'super_admin' ? 'المدير العام' : (user?.name || 'مدير قسم')}
                            </p>
                            <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '130px' }}>{user?.email}</p>
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '9px 12px',
                            color: '#ef4444',
                            background: 'rgba(239, 68, 68, 0.04)',
                            border: '1px solid rgba(239, 68, 68, 0.08)',
                            cursor: 'pointer',
                            borderRadius: '10px',
                            width: '100%',
                            fontWeight: '600',
                            transition: 'all 0.2s ease',
                            justifyContent: 'flex-start',
                            marginBottom: '0.25rem',
                            fontSize: '0.85rem'
                        }}
                    >
                        <LogOut size={18} />
                        <span>تسجيل الخروج</span>
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
