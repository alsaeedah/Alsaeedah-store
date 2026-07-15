import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase/client';
import { useLoading } from '../context/LoadingContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ShoppingBag, ShoppingCart, Users, TrendingUp,
    Box, Clock, ChevronLeft, Plus, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';

const Home = () => {
    const { startLoading, stopLoading } = useLoading();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ products: 0, orders: 0, users: 0, revenue: 0 });
    const [recentOrders, setRecentOrders] = useState([]);

    // Redirect managers to their primary permission
    useEffect(() => {
        if (user && user.role !== 'super_admin') {
            if (user.permissions?.products) navigate('/products', { replace: true });
            else if (user.permissions?.orders) navigate('/orders', { replace: true });
            else if (user.permissions?.users) navigate('/users', { replace: true });
            else navigate('/unauthorized', { replace: true });
        }
    }, [user, navigate]);

    useEffect(() => {
        const fetchData = async () => {
            startLoading();
            setLoading(true);
            try {
                const [
                    { count: productCount },
                    { count: orderCount },
                    { count: userCount },
                    { data: ordersData },
                    { data: revenueData },
                ] = await Promise.all([
                    supabase.from('products').select('*', { count: 'exact', head: true }),
                    supabase.from('orders').select('*', { count: 'exact', head: true }),
                    supabase.from('users').select('*', { count: 'exact', head: true }),
                    supabase.from('orders').select('*, users(name, phone)').order('created_at', { ascending: false }).limit(5),
                    supabase.from('orders').select('total_amount').eq('status', 'completed'),
                ]);

                const totalRevenue = revenueData?.reduce((acc, o) => acc + (Number(o.total_amount) || 0), 0) || 0;

                setStats({
                    products: productCount || 0,
                    orders: orderCount || 0,
                    users: userCount || 0,
                    revenue: totalRevenue,
                });
                setRecentOrders(ordersData || []);
            } catch (err) {
                console.error('Dashboard fetch error:', err);
            } finally {
                setLoading(false);
                stopLoading();
            }
        };
        fetchData();
    }, []);

    const statCards = [
        {
            label: 'إجمالي المنتجات', value: stats.products, Icon: Box,
            color: '#d4af37', bg: 'rgba(212,175,55,0.12)', change: '+2', positive: true,
        },
        {
            label: 'إجمالي الطلبات', value: stats.orders, Icon: ShoppingBag,
            color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', change: '+12.5%', positive: true,
        },
        {
            label: 'إجمالي العملاء', value: stats.users, Icon: Users,
            color: '#10b981', bg: 'rgba(16,185,129,0.12)', change: '+3.1%', positive: true,
        },
        {
            label: 'الإيرادات', value: `${stats.revenue.toLocaleString()} ر.س`, Icon: TrendingUp,
            color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', change: '+8.2%', positive: true,
        },
    ];

    const today = new Date().toLocaleDateString('ar-SA', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    const statusConfig = {
        pending: { label: 'قيد الانتظار', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
        completed: { label: 'مكتمل', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
        cancelled: { label: 'ملغي', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
        shipping: { label: 'في الشحن', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
    };

    return (
        <div>
            {/* ── Page Header ── */}
            <div className="page-header">
                <div>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '2px' }}>مرحباً 👋</p>
                    <h1 className="page-title">متجر السعيدة</h1>
                    <p className="page-subtitle">{today}</p>
                </div>
                <div style={{
                    width: '44px', height: '44px',
                    background: 'rgba(212,175,55,0.1)',
                    border: '1px solid rgba(212,175,55,0.2)',
                    borderRadius: '12px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <span style={{ fontSize: '22px' }}>🏪</span>
                </div>
            </div>

            {/* ── Stats Grid ── */}
            {loading ? (
                <div className="stats-grid">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="stat-card" style={{ height: '110px', background: 'rgba(255,255,255,0.03)' }} />
                    ))}
                </div>
            ) : (
                <div className="stats-grid">
                    {statCards.map(({ label, value, Icon, color, bg, change, positive }, idx) => (
                        <motion.div
                            key={label}
                            className="stat-card"
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.07, duration: 0.35 }}
                        >
                            <div className="stat-icon-wrap" style={{ background: bg }}>
                                <Icon size={20} color={color} />
                            </div>
                            <p className="stat-label">{label}</p>
                            <p className="stat-value">{value}</p>
                            <div className="stat-change" style={{ color: positive ? '#10b981' : '#ef4444' }}>
                                {positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                <span>{change}</span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* ── Quick Actions ── */}
            <p className="section-title" style={{ marginBottom: '12px' }}>إجراءات سريعة</p>
            <div className="quick-actions" style={{ marginBottom: '20px' }}>
                {[
                    { icon: '📦', label: 'منتج جديد', color: '#d4af37', path: '/products' },
                    { icon: '🧾', label: 'الطلبات', color: '#3b82f6', path: '/orders' },
                    { icon: '👥', label: 'العملاء', color: '#10b981', path: '/users' },
                    { icon: '⚙️', label: 'الإعدادات', color: '#888', path: '/settings' },
                ].map(({ icon, label, color, path }) => (
                    <button
                        key={label}
                        className="action-chip"
                        onClick={() => navigate(path)}
                    >
                        <div
                            className="action-icon-wrap"
                            style={{ background: color + '18' }}
                        >
                            <span style={{ fontSize: '22px' }}>{icon}</span>
                        </div>
                        <span className="action-label">{label}</span>
                    </button>
                ))}
            </div>

            {/* ── Recent Orders ── */}
            <div className="section-header">
                <p className="section-title">آخر الطلبات</p>
                <button className="section-link" onClick={() => navigate('/orders')}>
                    عرض الكل
                </button>
            </div>

            {loading ? (
                <div className="spinner-wrap"><div className="spinner" /></div>
            ) : recentOrders.length === 0 ? (
                <div className="empty-state">
                    <ShoppingCart size={40} className="empty-state-icon" />
                    <p className="empty-state-text">لا توجد طلبات حتى الآن</p>
                </div>
            ) : (
                recentOrders.map((order, idx) => {
                    const cfg = statusConfig[order.status] || statusConfig.pending;
                    const customerName = order.users?.name || 'عميل';
                    const date = new Date(order.created_at).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' });
                    return (
                        <motion.div
                            key={order.id}
                            className="list-item"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 + idx * 0.06 }}
                            onClick={() => navigate('/orders')}
                        >
                            <div className="list-item-row">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div className="avatar">{customerName[0]}</div>
                                    <div>
                                        <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '2px' }}>
                                            {customerName}
                                        </p>
                                        <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                            {date}
                                        </p>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                                    <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--primary)' }}>
                                        {Number(order.total_amount || 0).toLocaleString()} ر.س
                                    </p>
                                    <span className="badge" style={{ background: cfg.bg, color: cfg.color }}>
                                        {cfg.label}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    );
                })
            )}

            {/* ── Revenue Banner ── */}
            {!loading && (
                <motion.div
                    className="revenue-banner"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    <div>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                            إجمالي الإيرادات
                        </p>
                        <p style={{ fontSize: '22px', fontWeight: '800', color: 'var(--primary)', marginBottom: '4px' }}>
                            {stats.revenue.toLocaleString()} ر.س
                        </p>
                        <p style={{ fontSize: '12px', color: '#10b981' }}>↑ من الطلبات المكتملة</p>
                    </div>
                    <TrendingUp size={36} color="rgba(212,175,55,0.4)" />
                </motion.div>
            )}

            <div style={{ height: '8px' }} />
        </div>
    );
};

export default Home;
