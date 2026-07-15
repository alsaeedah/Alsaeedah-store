import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase/client';
import { useLoading } from '../context/LoadingContext';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShoppingCart, Clock, CheckCircle, XCircle, Truck, X, ChevronDown } from 'lucide-react';
import Swal from 'sweetalert2';

const STATUS_CONFIG = {
    pending: { label: 'قيد الانتظار', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', Icon: Clock },
    completed: { label: 'مكتمل', color: '#10b981', bg: 'rgba(16,185,129,0.12)', Icon: CheckCircle },
    cancelled: { label: 'ملغي', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', Icon: XCircle },
    shipping: { label: 'في الشحن', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', Icon: Truck },
};

const STATUS_OPTIONS = [
    { value: 'pending', label: 'قيد الانتظار' },
    { value: 'shipping', label: 'في الشحن' },
    { value: 'completed', label: 'مكتمل' },
    { value: 'cancelled', label: 'ملغي' },
];

const FILTERS = ['الكل', 'قيد الانتظار', 'في الشحن', 'مكتمل', 'ملغي'];
const FILTER_MAP = { 'الكل': null, 'قيد الانتظار': 'pending', 'في الشحن': 'shipping', 'مكتمل': 'completed', 'ملغي': 'cancelled' };

const Orders = () => {
    const { startLoading, stopLoading } = useLoading();
    const location = useLocation();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('الكل');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const highlightId = new URLSearchParams(location.search).get('highlight');

    const fetchOrders = useCallback(async () => {
        startLoading();
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('*, users(name, phone, email)')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOrders(data || []);
        } catch (err) {
            console.error('Orders fetch error:', err);
        } finally {
            setLoading(false);
            stopLoading();
        }
    }, []);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    // Real-time subscription
    useEffect(() => {
        const channel = supabase
            .channel('mobile-orders-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchOrders)
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [fetchOrders]);

    const handleStatusChange = async (orderId, newStatus) => {
        const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
        if (!error) {
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
            if (selectedOrder?.id === orderId) setSelectedOrder(prev => ({ ...prev, status: newStatus }));
        }
    };

    const counts = orders.reduce((acc, o) => {
        acc[o.status] = (acc[o.status] || 0) + 1;
        return acc;
    }, {});

    const filtered = orders.filter((o) => {
        const statusMatch = FILTER_MAP[filter] === null || o.status === FILTER_MAP[filter];
        const customerName = o.users?.name || '';
        const searchMatch = !search || customerName.includes(search) || o.id?.toString().includes(search);
        return statusMatch && searchMatch;
    });

    return (
        <div>
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">الطلبات</h1>
                    <p className="page-subtitle">{orders.length} طلب إجمالاً</p>
                </div>
            </div>

            {/* Summary Counts */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '16px' }}>
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                    <div key={key} style={{
                        background: 'var(--bg-card)',
                        border: `1px solid ${cfg.color}30`,
                        borderTop: `3px solid ${cfg.color}`,
                        borderRadius: '10px',
                        padding: '10px 6px',
                        textAlign: 'center',
                    }}>
                        <p style={{ fontSize: '18px', fontWeight: '800', color: cfg.color }}>{counts[key] || 0}</p>
                        <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>{cfg.label.split(' ').slice(-1)[0]}</p>
                    </div>
                ))}
            </div>

            {/* Search */}
            <div className="search-wrap">
                <Search size={16} color="var(--text-muted)" />
                <input
                    className="search-input"
                    placeholder="بحث باسم العميل أو رقم الطلب..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                    <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                        <X size={16} />
                    </button>
                )}
            </div>

            {/* Filter Chips */}
            <div className="chips-row">
                {FILTERS.map((f) => (
                    <button key={f} className={`chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                        {f}
                    </button>
                ))}
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                {filtered.length} طلب
            </p>

            {/* Loading */}
            {loading && <div className="spinner-wrap"><div className="spinner" /></div>}

            {/* Empty */}
            {!loading && filtered.length === 0 && (
                <div className="empty-state">
                    <ShoppingCart size={44} className="empty-state-icon" />
                    <p className="empty-state-text">لا توجد طلبات</p>
                </div>
            )}

            {/* Orders List */}
            {!loading && filtered.map((order, idx) => {
                const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                const customerName = order.users?.name || 'عميل غير معروف';
                const date = new Date(order.created_at).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' });
                const isHighlighted = order.id?.toString() === highlightId;

                return (
                    <motion.div
                        key={order.id}
                        className="list-item"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.04 }}
                        style={isHighlighted ? { borderColor: 'var(--primary)', boxShadow: '0 0 0 2px rgba(212,175,55,0.2)' } : {}}
                        onClick={() => setSelectedOrder(order)}
                    >
                        <div className="list-item-row" style={{ marginBottom: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)' }}>
                                    #{typeof order.id === 'string' ? order.id.slice(0, 8) : order.id}
                                </span>
                                <span className="badge" style={{ background: cfg.bg, color: cfg.color }}>
                                    {cfg.label}
                                </span>
                            </div>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{date}</span>
                        </div>
                        <div className="list-item-row">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div className="avatar" style={{ width: '34px', height: '34px', fontSize: '13px' }}>
                                    {customerName[0]}
                                </div>
                                <div>
                                    <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)' }}>{customerName}</p>
                                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{order.users?.phone || ''}</p>
                                </div>
                            </div>
                            <p style={{ fontSize: '15px', fontWeight: '800', color: 'var(--primary)' }}>
                                {Number(order.total_amount || 0).toLocaleString()} ر.س
                            </p>
                        </div>
                    </motion.div>
                );
            })}

            {/* Order Detail Sheet */}
            <AnimatePresence>
                {selectedOrder && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedOrder(null)}
                    >
                        <motion.div
                            className="modal-sheet"
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="modal-handle" />

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)' }}>
                                    تفاصيل الطلب
                                </h2>
                                <button onClick={() => setSelectedOrder(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                    <X size={22} />
                                </button>
                            </div>

                            {/* Order Info */}
                            {[
                                { label: 'رقم الطلب', value: `#${typeof selectedOrder.id === 'string' ? selectedOrder.id.slice(0, 8) : selectedOrder.id}` },
                                { label: 'العميل', value: selectedOrder.users?.name || 'غير معروف' },
                                { label: 'الهاتف', value: selectedOrder.users?.phone || '-' },
                                { label: 'المبلغ', value: `${Number(selectedOrder.total_amount || 0).toLocaleString()} ر.س` },
                                { label: 'التاريخ', value: new Date(selectedOrder.created_at).toLocaleDateString('ar-SA') },
                            ].map(({ label, value }) => (
                                <div key={label} className="toggle-row">
                                    <span className="toggle-sub">{label}</span>
                                    <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-main)' }}>{value}</span>
                                </div>
                            ))}

                            {/* Address */}
                            {selectedOrder.address && (
                                <div className="toggle-row">
                                    <span className="toggle-sub">العنوان</span>
                                    <span style={{ fontSize: '13px', color: 'var(--text-main)', maxWidth: '60%', textAlign: 'left' }}>
                                        {typeof selectedOrder.address === 'object'
                                            ? Object.values(selectedOrder.address).filter(Boolean).join('، ')
                                            : selectedOrder.address}
                                    </span>
                                </div>
                            )}

                            <div className="divider" />

                            {/* Status Change */}
                            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '10px' }}>تغيير الحالة</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                {STATUS_OPTIONS.map(({ value, label }) => {
                                    const cfg = STATUS_CONFIG[value];
                                    const isActive = selectedOrder.status === value;
                                    return (
                                        <button
                                            key={value}
                                            onClick={() => handleStatusChange(selectedOrder.id, value)}
                                            style={{
                                                padding: '10px',
                                                borderRadius: '10px',
                                                border: `1px solid ${isActive ? cfg.color : 'var(--glass-border)'}`,
                                                background: isActive ? cfg.bg : 'transparent',
                                                color: isActive ? cfg.color : 'var(--text-muted)',
                                                fontWeight: isActive ? '700' : '500',
                                                fontSize: '13px',
                                                cursor: 'pointer',
                                                fontFamily: 'var(--font-main)',
                                                transition: 'all 0.2s',
                                            }}
                                        >
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div style={{ height: '8px' }} />
        </div>
    );
};

export default Orders;
