import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase/client';
import { useLoading } from '../context/LoadingContext';
import {
    ShoppingBag,
    ShoppingCart,
    Users as UsersIcon,
    TrendingUp,
    Clock,
    ChevronLeft,
    Box,
    Plus
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const Home = () => {
    const { startLoading, stopLoading } = useLoading();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        products: 0,
        orders: 0,
        users: 0,
        revenue: 0
    });
    const [recentOrders, setRecentOrders] = useState([]);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        if (user && user.role !== 'super_admin') {
            if (user.permissions?.products) {
                navigate('/products', { replace: true });
            } else if (user.permissions?.orders) {
                navigate('/orders', { replace: true });
            } else if (user.permissions?.users) {
                navigate('/users', { replace: true });
            } else {
                navigate('/unauthorized', { replace: true });
            }
        }
    }, [user, navigate]);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        
        const fetchDashboardData = async () => {
            startLoading();
            setLoading(true);
            try {
                // 1. Fetch Counts
                const { count: productCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
                const { count: orderCount } = await supabase.from('orders').select('*', { count: 'exact', head: true });
                const { count: userCount } = await supabase.from('users').select('*', { count: 'exact', head: true });

                // 2. Fetch Recent Orders
                const { data: ordersData } = await supabase
                    .from('orders')
                    .select('*, users(name, phone)')
                    .order('created_at', { ascending: false })
                    .limit(5);

                // 3. Calculate Total Revenue (completed orders)
                const { data: revenueData } = await supabase
                    .from('orders')
                    .select('total_amount')
                    .eq('status', 'completed');

                const totalRevenue = revenueData?.reduce((acc, curr) => acc + (Number(curr.total_amount) || 0), 0) || 0;

                setStats({
                    products: productCount || 0,
                    orders: orderCount || 0,
                    users: userCount || 0,
                    revenue: totalRevenue
                });
                setRecentOrders(ordersData || []);
            } catch (error) {
                console.error("Dashboard fetch error:", error);
            } finally {
                setLoading(false);
                stopLoading();
            }
        };

        fetchDashboardData();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const statCards = [
        { label: 'إجمالي المنتجات', value: stats.products, icon: Box, color: '#d4af37', bg: 'rgba(212, 175, 55, 0.15)', glow: 'rgba(212, 175, 55, 0.3)' },
        { label: 'إجمالي الطلبات', value: stats.orders, icon: ShoppingBag, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', glow: 'rgba(59, 130, 246, 0.3)' },
        { label: 'إجمالي المستخدمين', value: stats.users, icon: UsersIcon, color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', glow: 'rgba(16, 185, 129, 0.3)' },
        { label: 'إجمالي الأرباح', value: `${stats.revenue.toLocaleString()} ر.س`, icon: TrendingUp, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', glow: 'rgba(245, 158, 11, 0.3)' },
    ];

    return (
        <div style={{ direction: 'rtl', padding: isMobile ? '10px' : '20px' }}>
            {/* Standard Header with Welcome Message */}
            <div style={{ 
                marginBottom: isMobile ? '2rem' : '3.5rem', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: isMobile ? 'flex-start' : 'flex-end', 
                flexDirection: isMobile ? 'column' : 'row',
                gap: '20px' 
            }}>
                <div>
                    <h1 style={{ 
                        fontSize: isMobile ? '1.8rem' : '2.8rem', 
                        fontWeight: '900', 
                        color: '#fff', 
                        marginBottom: '8px', 
                        letterSpacing: '-1px' 
                    }}>
                        نظرة عامة <span style={{ color: 'var(--primary)', fontSize: isMobile ? '0.9rem' : '1.2rem', verticalAlign: 'middle', opacity: 0.8 }}>| لوحة التحكم</span>
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: isMobile ? '0.95rem' : '1.1rem', maxWidth: '600px' }}>
                        مرحباً بك مجدداً! إليك ملخص سريع لأداء متجر "السعيدة" لهذا اليوم.
                    </p>
                </div>
                <div style={{ 
                    padding: '8px 16px', 
                    background: 'rgba(255,255,255,0.05)', 
                    borderRadius: '12px', 
                    border: '1px solid var(--border-color)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '10px',
                    alignSelf: isMobile ? 'flex-start' : 'auto'
                }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }} />
                    <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#fff' }}>النظام متصل</span>
                </div>
            </div>

            {/* Stats Grid - Ultra Responsive */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: isMobile ? '16px' : '24px',
                marginBottom: isMobile ? '2.5rem' : '4rem'
            }}>
                {statCards.map((card, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.5 }}
                        whileHover={isMobile ? {} : { y: -8, boxShadow: `0 15px 35px ${card.glow}` }}
                        style={{
                            padding: isMobile ? '20px' : '30px 24px',
                            borderRadius: '24px',
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid var(--border-color)',
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: '20px',
                            cursor: 'default',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        <div style={{
                            width: isMobile ? '48px' : '56px',
                            height: isMobile ? '48px' : '56px',
                            borderRadius: '16px',
                            background: card.bg,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: card.color,
                            boxShadow: `inset 0 0 15px ${card.glow}`,
                            flexShrink: 0
                        }}>
                            <card.icon size={isMobile ? 22 : 26} strokeWidth={2.5} />
                        </div>
                        <div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '600', marginBottom: '4px' }}>{card.label}</p>
                            <h3 style={{ fontSize: isMobile ? '1.4rem' : '1.8rem', fontWeight: '900', color: '#fff', letterSpacing: '-0.5px' }}>{card.value}</h3>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Content Body Section */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(400px, 1fr))',
                gap: '30px',
            }}>
                {/* Recent Orders - Modern Feed Style */}
                <div style={{
                    padding: isMobile ? '20px' : '30px',
                    borderRadius: '30px',
                    background: 'rgba(255,255,255,0.02)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid var(--border-color)',
                }}>
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: isMobile ? 'flex-start' : 'center', 
                        marginBottom: '30px',
                        flexDirection: isMobile ? 'column' : 'row',
                        gap: '15px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <div style={{ 
                                width: '40px', height: '40px', borderRadius: '12px', 
                                background: 'rgba(212, 175, 55, 0.1)', color: 'var(--primary)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <Clock size={20} />
                            </div>
                            <h2 style={{ fontSize: isMobile ? '1.2rem' : '1.5rem', fontWeight: '800', color: '#fff' }}>آخر التحديثات</h2>
                        </div>
                        <Link to="/orders" style={{
                            color: 'var(--primary)',
                            fontSize: '0.85rem',
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontWeight: '700',
                            padding: '8px 16px',
                            borderRadius: '10px',
                            background: 'rgba(212, 175, 55, 0.05)',
                            transition: '0.3s',
                            width: isMobile ? '100%' : 'auto',
                            justifyContent: 'center'
                        }}>
                            عرض الكل <ChevronLeft size={18} />
                        </Link>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {recentOrders.length > 0 ? recentOrders.map((order, idx) => (
                            <motion.div 
                                key={order.id} 
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 + (idx * 0.1) }}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: isMobile ? '12px 15px' : '18px 20px',
                                    background: 'rgba(255,255,255,0.01)',
                                    borderRadius: '18px',
                                    border: '1px solid rgba(255,255,255,0.04)',
                                    transition: '0.3s'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                                    <div style={{
                                        width: '40px', height: '40px', borderRadius: '10px',
                                        background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.65rem',
                                        flexShrink: 0
                                    }}>
                                        INV
                                    </div>
                                    <div style={{ overflow: 'hidden' }}>
                                        <p style={{ 
                                            color: '#fff', fontSize: '0.95rem', fontWeight: '700', marginBottom: '2px',
                                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                                        }}>
                                            {order.customer_name || order.users?.name || order.profiles?.full_name || 'زائر المتجر'}
                                        </p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                            <span style={{ 
                                                fontSize: '0.65rem', fontWeight: '800',
                                                color: order.status === 'completed' ? '#10b981' : order.status === 'cancelled' ? '#ef4444' : '#f59e0b',
                                                background: order.status === 'completed' ? 'rgba(16, 185, 129, 0.1)' : order.status === 'cancelled' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                                padding: '1px 6px', borderRadius: '4px'
                                            }}>
                                                {order.status === 'completed' ? 'مكتمل' : order.status === 'cancelled' ? 'ملغي' : 'قيد المتابعة'}
                                            </span>
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{new Date(order.created_at).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })}</span>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'left', marginLeft: '10px' }}>
                                    <p style={{ color: 'var(--primary)', fontWeight: '900', fontSize: isMobile ? '1rem' : '1.2rem' }}>
                                        {Number(order.total_amount).toLocaleString()}
                                    </p>
                                </div>
                            </motion.div>
                        )) : (
                            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                <ShoppingBag size={40} style={{ opacity: 0.2, marginBottom: '15px' }} />
                                <p>لا توجد طلبات</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Quick Actions & Trends */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                    {/* Quick Management Panel */}
                    <div style={{
                        padding: isMobile ? '20px' : '30px',
                        borderRadius: '30px',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid var(--border-color)',
                    }}>
                        <h2 style={{ fontSize: isMobile ? '1.2rem' : '1.4rem', fontWeight: '800', color: '#fff', marginBottom: '25px' }}>إدارة سريعة</h2>
                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', 
                            gap: '15px' 
                        }}>
                            <Link to="/products/add" style={{
                                background: 'linear-gradient(135deg, var(--primary) 0%, #b4932a 100%)',
                                color: '#000',
                                padding: isMobile ? '15px' : '24px 15px',
                                borderRadius: '20px',
                                textDecoration: 'none',
                                textAlign: 'center',
                                display: 'flex',
                                flexDirection: isMobile ? 'row' : 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '12px',
                                transition: '0.3s',
                                boxShadow: '0 10px 20px rgba(212, 175, 55, 0.2)'
                            }}>
                                <Plus size={isMobile ? 22 : 28} strokeWidth={3} />
                                <span style={{ fontSize: isMobile ? '0.9rem' : '1rem', fontWeight: '900' }}>إضافة منتج</span>
                            </Link>
                            <Link to="/orders" style={{
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid var(--border-color)',
                                color: '#fff',
                                padding: isMobile ? '15px' : '24px 15px',
                                borderRadius: '20px',
                                textDecoration: 'none',
                                textAlign: 'center',
                                display: 'flex',
                                flexDirection: isMobile ? 'row' : 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '12px',
                                transition: '0.3s'
                            }}>
                                <ShoppingCart size={isMobile ? 22 : 28} />
                                <span style={{ fontSize: isMobile ? '0.9rem' : '1rem', fontWeight: '800' }}>إدارة الطلبات</span>
                            </Link>
                        </div>
                    </div>

                    {/* Announcement or Help Panel */}
                    <div style={{
                        padding: isMobile ? '20px' : '30px',
                        borderRadius: '30px',
                        background: 'rgba(212, 175, 55, 0.05)',
                        border: '1px solid rgba(212, 175, 55, 0.1)',
                        flex: 1,
                        display: 'flex',
                        flexDirection: isMobile ? 'row' : 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        textAlign: isMobile ? 'right' : 'center',
                        gap: '15px'
                    }}>
                        <div style={{ 
                            width: '50px', height: '50px', borderRadius: '50%', 
                            background: 'var(--primary)', color: '#000', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0
                        }}>
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <h3 style={{ color: 'var(--primary)', fontWeight: '800', fontSize: isMobile ? '1rem' : '1.1rem', marginBottom: '4px' }}>جاهز للتوسع؟</h3>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                                نظام متجر السعيدة يوفر لك تقارير مفصلة لمساعدتك في اتخاذ قرارات دقيقة لنمو متجرك.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;
