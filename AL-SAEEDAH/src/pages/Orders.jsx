import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Calendar, CreditCard, ChevronDown, ChevronUp, ShoppingBag, Clock, CheckCircle2, XCircle, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLoader } from '../context/LoaderContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Orders() {
    const { currentUser, openAuthModal } = useAuth();
    const { showLoader, hideLoader } = useLoader();
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedOrder, setExpandedOrder] = useState(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (!currentUser) {
            setLoading(false);
            return;
        }

        const fetchOrders = async () => {
            showLoader('جاري جلب السجل...');
            try {
                const { supabase } = await import('../supabase/client');
                const { data, error } = await supabase
                    .from('orders')
                    .select('*')
                    .eq('user_id', currentUser.uid || currentUser.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setOrders(data || []);
            } catch (error) {
                console.error("Error fetching orders:", error);
            } finally {
                setLoading(false);
                hideLoader();
            }
        };

        fetchOrders();
    }, [currentUser, navigate]);

    const getStatusStyle = (status) => {
        switch (status?.toLowerCase()) {
            case 'completed': return { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)', icon: <CheckCircle2 size={16} /> };
            case 'pending': return { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', icon: <Clock size={16} /> };
            case 'cancelled': return { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', icon: <XCircle size={16} /> };
            default: return { color: 'var(--text-dim)', bg: 'rgba(255, 255, 255, 0.05)', icon: <Package size={16} /> };
        }
    };

    const toggleExpand = (orderId) => {
        setExpandedOrder(expandedOrder === orderId ? null : orderId);
    };

    if (loading) {
        return <div style={{ minHeight: '80vh' }}></div>;
    }

    return (
        <div style={{ maxWidth: '800px', margin: isMobile ? '90px auto 40px' : '100px auto 40px', padding: isMobile ? '0 12px' : '0 15px' }}>
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ textAlign: 'right', marginBottom: isMobile ? '20px' : '30px' }}
            >
                <h1 style={{ fontSize: isMobile ? '1.5rem' : '1.8rem', fontWeight: '800', marginBottom: '5px' }}>
                    <span style={{ color: 'var(--primary)' }}>سجل الطلبات</span>
                </h1>
                <p style={{ color: 'var(--text-dim)', fontSize: isMobile ? '0.8rem' : '0.9rem' }}>يمكنك متابعة حالة وتفاصيل مشترياتك السابقة</p>
            </motion.div>

            {!currentUser ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                        textAlign: 'center',
                        padding: isMobile ? '40px 15px' : '60px 20px',
                        background: 'var(--bg-card)',
                        borderRadius: '24px',
                        border: '1px solid var(--border-color)',
                        backdropFilter: 'blur(10px)'
                    }}
                >
                    <User size={isMobile ? 36 : 48} style={{ color: 'var(--primary)', marginBottom: '15px', opacity: 0.4 }} />
                    <h2 style={{ fontSize: isMobile ? '1.1rem' : '1.2rem', marginBottom: '10px' }}>تسجيل الدخول مطلوب</h2>
                    <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginBottom: '20px' }}>يجب عليك تسجيل الدخول لتتمكن من رؤية سجل طلباتك</p>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                        <button className="btn-primary" onClick={openAuthModal} style={{ padding: isMobile ? '8px 20px' : '8px 24px', fontSize: '0.9rem' }}>تسجيل الدخول</button>
                    </div>
                </motion.div>
            ) : orders.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                        textAlign: 'center',
                        padding: isMobile ? '40px 15px' : '60px 20px',
                        background: 'var(--bg-card)',
                        borderRadius: '24px',
                        border: '1px solid var(--border-color)',
                        backdropFilter: 'blur(10px)'
                    }}
                >
                    <ShoppingBag size={isMobile ? 36 : 48} style={{ color: 'var(--primary)', marginBottom: '15px', opacity: 0.4 }} />
                    <h2 style={{ fontSize: isMobile ? '1.1rem' : '1.2rem', marginBottom: '10px' }}>لا توجد طلبات حالياً</h2>
                    <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginBottom: '20px' }}>ابدأ رحلة تسوقك الآن واكتشف القطع الفريدة</p>
                    <Link to="/" className="btn-primary" style={{ padding: isMobile ? '8px 20px' : '8px 24px', fontSize: '0.9rem', textDecoration: 'none' }}>تصفح المتجر</Link>
                </motion.div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {orders.map((order) => {
                        const style = getStatusStyle(order.status);
                        const isExpanded = expandedOrder === order.id;

                        return (
                            <motion.div
                                key={order.id}
                                layout
                                style={{
                                    background: 'var(--bg-card)',
                                    borderRadius: '16px',
                                    border: '1px solid var(--border-color)',
                                    overflow: 'hidden',
                                    transition: 'all 0.3s ease',
                                    boxShadow: isExpanded ? '0 10px 30px rgba(0,0,0,0.15)' : 'none'
                                }}
                            >
                                {/* Compact Order Header */}
                                <div
                                    style={{
                                        padding: isMobile ? '12px 14px' : '16px 20px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        cursor: 'pointer',
                                    }}
                                    onClick={() => toggleExpand(order.id)}
                                >
                                    <div style={{ display: 'flex', gap: isMobile ? '10px' : '12px', alignItems: 'center' }}>
                                        <div style={{
                                            width: isMobile ? '36px' : '42px',
                                            height: isMobile ? '36px' : '42px',
                                            borderRadius: '10px',
                                            background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.1), rgba(212, 175, 55, 0.05))',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'var(--primary)',
                                            border: '1px solid rgba(212,175,55,0.2)',
                                            flexShrink: 0
                                        }}>
                                            <Package size={isMobile ? 18 : 20} />
                                        </div>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                                                <h3 style={{ fontSize: isMobile ? '0.85rem' : '0.95rem', fontWeight: 'bold', margin: 0 }}>ORD{order.order_number}</h3>
                                                <span style={{
                                                    fontSize: '0.65rem',
                                                    padding: '2px 6px',
                                                    borderRadius: '6px',
                                                    background: style.bg,
                                                    color: style.color,
                                                    fontWeight: '700',
                                                    whiteSpace: 'nowrap'
                                                }}>
                                                    {order.status === 'pending' ? 'قيد الانتظار' : order.status === 'completed' ? 'تم التوصيل' : order.status}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '10px', fontSize: isMobile ? '0.65rem' : '0.75rem', color: 'var(--text-dim)', fontWeight: '500' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Calendar size={12} />
                                                    {new Date(order.created_at).toLocaleDateString('ar-SA')}
                                                </span>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary)' }}>
                                                    <CreditCard size={12} />
                                                    {order.total_amount.toLocaleString()} ر.س
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {!isMobile && (
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{order.items?.length || 0} قطع</span>
                                            </div>
                                        )}
                                        {isExpanded ? <ChevronUp size={16} color="var(--text-dim)" /> : <ChevronDown size={16} color="var(--text-dim)" />}
                                    </div>
                                </div>

                                {/* Order Details Toggle */}
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            style={{ overflow: 'hidden' }}
                                        >
                                            <div style={{
                                                padding: isMobile ? '0 12px 15px' : '0 20px 20px',
                                                marginTop: '5px',
                                                borderTop: '1px dashed var(--border-color)'
                                            }}>
                                                <div style={{ padding: isMobile ? '12px 0' : '20px 0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                    {order.items?.map((item, idx) => (
                                                        <div key={idx} style={{
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                            gap: '10px',
                                                            background: 'rgba(255,255,255,0.02)',
                                                            padding: '8px',
                                                            borderRadius: '12px',
                                                            border: '1px solid rgba(255,255,255,0.03)'
                                                        }}>
                                                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                                <div style={{ position: 'relative' }}>
                                                                    <img 
                                                                        src={item.image || item.imageUrl || (item.images && item.images[0]) || (item.variants && item.variants[0]?.image)} 
                                                                        alt={item.name} 
                                                                        style={{ width: isMobile ? '40px' : '50px', height: isMobile ? '40px' : '50px', borderRadius: '10px', objectFit: 'cover' }} 
                                                                    />
                                                                    <span style={{
                                                                        position: 'absolute',
                                                                        top: '-5px',
                                                                        right: '-5px',
                                                                        background: 'var(--primary)',
                                                                        color: '#000',
                                                                        fontSize: '0.6rem',
                                                                        fontWeight: 'bold',
                                                                        width: '16px',
                                                                        height: '16px',
                                                                        borderRadius: '50%',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        border: '1.5px solid var(--bg-card)',
                                                                        pointerEvents: 'none'
                                                                    }}>{item.dp_qty}</span>
                                                                </div>
                                                                <div>
                                                                    <p style={{ fontSize: isMobile ? '0.75rem' : '0.85rem', fontWeight: '600', marginBottom: '2px' }}>{item.name}</p>
                                                                    <p style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>{item.displayId ? `#${item.displayId}` : 'ساعة راقية'}</p>
                                                                </div>
                                                            </div>
                                                            <p style={{ fontSize: isMobile ? '0.8rem' : '0.9rem', fontWeight: '700', color: 'var(--text-main)' }}>
                                                                {(item.price * item.dp_qty).toLocaleString()} ر.س
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div style={{
                                                    padding: isMobile ? '12px' : '15px',
                                                    background: 'linear-gradient(to left, rgba(212,175,55,0.05), transparent)',
                                                    borderRadius: '14px',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    border: '1px solid rgba(212,175,55,0.1)'
                                                }}>
                                                    <div>
                                                        <p style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginBottom: '3px' }}>طريقة الدفع</p>
                                                        <p style={{ fontSize: isMobile ? '0.75rem' : '0.85rem', fontWeight: 'bold' }}>{order.payment_method === 'cash_on_delivery' ? 'عند الاستلام' : (order.payment_method || 'غير محدد')}</p>
                                                    </div>
                                                    <div style={{ textAlign: 'left' }}>
                                                        <p style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginBottom: '3px' }}>الإجمالي النهائي</p>
                                                        <p style={{ fontSize: isMobile ? '1rem' : '1.1rem', fontWeight: '900', color: 'var(--primary)' }}>{order.total_amount.toLocaleString()} ر.س</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
