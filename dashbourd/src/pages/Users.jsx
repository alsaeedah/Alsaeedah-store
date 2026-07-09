import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLoading } from '../context/LoadingContext';
import { supabase } from '../supabase/client';
import Swal from 'sweetalert2';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users as UsersIcon, Search, Phone,
    Calendar, Trash2, Loader2, UserCheck, Shield,
    Store, Clock, Plus, X, Eye, EyeOff, User, Lock
} from 'lucide-react';

// ── Add User Modal ────────────────────────────────────────────────────────────
const AddUserModal = ({ onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        password: '',
        store_owner_info: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'phone') {
            setFormData(prev => ({ ...prev, phone: value.replace(/[^0-9]/g, '') }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.name.trim()) { setError('الاسم الكامل مطلوب'); return; }
        if (!formData.phone || formData.phone.length < 7) { setError('رقم هاتف صحيح مطلوب'); return; }
        if (!formData.password || formData.password.length < 6) { setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل'); return; }

        setIsSubmitting(true);
        try {
            const { data, error: rpcError } = await supabase.rpc('create_user_by_admin', {
                p_name: formData.name.trim(),
                p_phone: formData.phone.trim(),
                p_password: formData.password,
                p_store_owner_info: formData.store_owner_info.trim() || null
            });

            if (rpcError) throw rpcError;

            onSuccess();
            onClose();
            Swal.fire({
                icon: 'success',
                title: 'تم إنشاء الحساب',
                text: `تم إنشاء حساب "${formData.name}" بنجاح.`,
                background: '#141414',
                color: '#fff',
                confirmButtonColor: '#d4af37'
            });
        } catch (err) {
            console.error('Create user error:', err);
            setError(err.message || 'حدث خطأ أثناء إنشاء الحساب');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modern-modal-overlay">
            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: -20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="modern-modal-card wide-modal"
            >
                {/* Close */}
                <button onClick={onClose} className="modern-modal-close">
                    <X size={16} />
                </button>

                {/* Header */}
                <div className="modern-modal-header">
                    <div className="modern-modal-icon-wrapper">
                        <UserCheck size={24} color="var(--primary)" />
                    </div>
                    <h2 className="modern-modal-title">إضافة مستخدم جديد</h2>
                    <p className="modern-modal-subtitle">سيتم إنشاء حساب جديد يمكن للمستخدم الدخول به فوراً</p>
                </div>

                {/* Error */}
                {error && (
                    <div style={{
                        background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                        color: '#f87171', padding: '12px 16px', borderRadius: '12px',
                        marginBottom: '20px', fontSize: '0.9rem', textAlign: 'center'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} dir="rtl" className="modern-form-section-card">
                    <div className="modern-modal-form-grid">
                        {/* Right column: Form Fields */}
                        <div className="modern-modal-form-column">
                            {/* Full Name */}
                            <div className="modern-field-group">
                                <label className="modern-field-label">الاسم الكامل *</label>
                                <div className="modern-input-container">
                                    <User size={16} className="modern-input-icon" color="rgba(212,175,55,0.4)" />
                                    <input
                                        id="add-user-name"
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="محمد أحمد"
                                        required
                                        className="modern-input-field"
                                        style={{ paddingRight: '44px' }}
                                    />
                                </div>
                            </div>

                            {/* Phone */}
                            <div className="modern-field-group">
                                <label className="modern-field-label">رقم الهاتف *</label>
                                <div className="modern-input-container">
                                    <Phone size={16} className="modern-input-icon" color="rgba(212,175,55,0.4)" />
                                    <input
                                        id="add-user-phone"
                                        type="tel"
                                        inputMode="numeric"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="07XXXXXXXX"
                                        maxLength={15}
                                        required
                                        dir="ltr"
                                        className="modern-input-field"
                                        style={{ paddingRight: '44px', textAlign: 'right' }}
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="modern-field-group">
                                <label className="modern-field-label">كلمة المرور *</label>
                                <div className="modern-input-container">
                                    <Lock size={16} className="modern-input-icon" color="rgba(212,175,55,0.4)" />
                                    <input
                                        id="add-user-password"
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="6 أحرف على الأقل"
                                        required
                                        className="modern-input-field"
                                        style={{ paddingRight: '44px', paddingLeft: '44px' }}
                                    />
                                    <button type="button" onClick={() => setShowPassword(p => !p)} className="modern-password-toggle">
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            {/* Store Owner Info — optional */}
                            <div className="modern-field-group">
                                <label className="modern-field-label">
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Store size={14} color="rgba(212,175,55,0.6)" /> اسم المتجر / صاحب المتجر
                                        <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.75rem', fontWeight: 'normal', marginRight: '4px' }}>(اختياري)</span>
                                    </span>
                                </label>
                                <div className="modern-input-container">
                                    <input
                                        id="add-user-store"
                                        type="text"
                                        name="store_owner_info"
                                        value={formData.store_owner_info}
                                        onChange={handleChange}
                                        placeholder="مثال: متجر الأمل - صنعاء"
                                        className="modern-input-field"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Left column: Account Tips Panel */}
                        <div className="modern-modal-form-column">
                            <div style={{
                                flex: 1,
                                background: 'rgba(212,175,55,0.04)',
                                border: '1px solid rgba(212,175,55,0.12)',
                                borderRadius: '16px',
                                padding: '20px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '14px'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: '800', fontSize: '0.88rem', marginBottom: '4px' }}>
                                    <Shield size={16} color="var(--primary)" />
                                    <span>تعليمات إنشاء الحساب</span>
                                </div>

                                {[
                                    { icon: <User size={14} />, text: 'أدخل الاسم الكامل للمستخدم كما هو في الهوية' },
                                    { icon: <Phone size={14} />, text: 'رقم الهاتف يُستخدم تسجيل الدخول — تأكد من صحته' },
                                    { icon: <Lock size={14} />, text: 'كلمة المرور لا تقل عن 6 أحرف' },
                                    { icon: <Store size={14} />, text: 'اسم المتجر اختياري ويساعد في تعريف العميل' },
                                ].map((item, i) => (
                                    <div key={i} style={{
                                        display: 'flex', alignItems: 'flex-start', gap: '10px',
                                        color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', lineHeight: 1.5
                                    }}>
                                        <span style={{ color: 'var(--primary)', marginTop: '1px', flexShrink: 0 }}>{item.icon}</span>
                                        <span>{item.text}</span>
                                    </div>
                                ))}

                                <div style={{
                                    marginTop: 'auto',
                                    padding: '12px',
                                    background: 'rgba(16,185,129,0.07)',
                                    border: '1px solid rgba(16,185,129,0.2)',
                                    borderRadius: '10px',
                                    fontSize: '0.78rem',
                                    color: '#10b981',
                                    fontWeight: '700',
                                    textAlign: 'center',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px'
                                }}>
                                    <UserCheck size={14} />
                                    سيتمكن المستخدم من الدخول فوراً بعد الإنشاء
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        id="add-user-submit-btn"
                        type="submit"
                        disabled={isSubmitting}
                        className="modern-btn-submit"
                        style={{ marginTop: '12px' }}
                    >
                        {isSubmitting ? <><Loader2 size={18} className="spin" /> جاري الإنشاء...</> : <><UserCheck size={18} /> إنشاء الحساب</>}
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

// ── User Card ─────────────────────────────────────────────────────────────────
const isUserOnline = (user) => {
    if (!user.is_online) return false;
    if (!user.last_seen) return false;
    
    // Active within 2 minutes
    const lastSeenTime = new Date(user.last_seen).getTime();
    const now = new Date().getTime();
    return (now - lastSeenTime) < 120000;
};

const getLastSeenText = (lastSeen) => {
    if (!lastSeen) return 'غير متصل';
    const date = new Date(lastSeen);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'نشط منذ ثوانٍ';
    if (diffMins < 60) return `نشط منذ ${diffMins} د`;
    if (diffHours < 24) return `نشط منذ ${diffHours} س`;
    if (diffDays === 1) return 'نشط أمس';
    if (diffDays < 7) return `نشط منذ ${diffDays} يوم`;
    return `آخر ظهور ${date.toLocaleDateString('ar-EG')}`;
};

// ── User Card ─────────────────────────────────────────────────────────────────
const UserCard = ({ user, index, onDelete, lastUserRef, isMobile }) => {
    const isOnline = isUserOnline(user);

    return (
        <motion.div
            ref={lastUserRef}
            layout
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.35, delay: (index % 6) * 0.05 }}
            style={{
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '22px', padding: isMobile ? '18px' : '26px',
                display: 'flex', flexDirection: 'column', gap: isMobile ? '14px' : '20px',
                backdropFilter: 'blur(10px)', position: 'relative'
            }}
        >
            {/* Active Badge */}
            <div style={{
                position: 'absolute', top: '16px', left: '16px',
                background: user.is_active !== false ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                border: `1px solid ${user.is_active !== false ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                color: user.is_active !== false ? '#10b981' : '#ef4444',
                padding: '3px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: '800'
            }}>
                {user.is_active !== false ? 'نشط' : 'معطّل'}
            </div>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : '16px' }}>
                <div style={{
                    width: isMobile ? '52px' : '64px', height: isMobile ? '52px' : '64px',
                    borderRadius: '14px', background: 'rgba(212,175,55,0.08)',
                    border: '1.5px solid rgba(212,175,55,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden', flexShrink: 0
                }}>
                    {user.profile_image_url ? (
                        <img src={user.profile_image_url} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        <UsersIcon size={isMobile ? 22 : 28} color="var(--primary)" />
                    )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                        <h3 style={{ fontSize: isMobile ? '0.95rem' : '1.15rem', fontWeight: '800', color: '#fff', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {user.name || 'مستخدم مجهول'}
                        </h3>
                        {/* Glowing Online/Offline Dot */}
                        <span style={{
                            width: '9px', height: '9px', borderRadius: '50%',
                            background: isOnline ? '#10b981' : '#6b7280',
                            boxShadow: isOnline ? '0 0 10px #10b981' : 'none',
                            display: 'inline-block',
                            flexShrink: 0
                        }} title={isOnline ? 'متصل الآن' : 'غير متصل'} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Shield size={10} color="var(--primary)" />
                        <span style={{ fontSize: '0.68rem', color: 'var(--primary)', fontWeight: '800' }}>
                            #{user.id.substring(0, 8).toUpperCase()}
                        </span>
                        <span style={{ fontSize: '0.68rem', color: isOnline ? '#10b981' : 'rgba(255,255,255,0.4)', fontWeight: isOnline ? '750' : 'normal' }}>
                            • {isOnline ? 'متصل الآن' : getLastSeenText(user.last_seen)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Info Grid */}
            <div style={{ display: 'grid', gap: '9px', background: 'rgba(0,0,0,0.15)', padding: isMobile ? '12px' : '16px', borderRadius: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '9px', color: '#fff', fontSize: isMobile ? '0.8rem' : '0.92rem' }}>
                    <Phone size={14} color="rgba(212,175,55,0.7)" />
                    <span dir="ltr" style={{ opacity: 0.85 }}>{user.phone || '---'}</span>
                </div>
                {user.store_owner_info && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '9px', color: '#fff', fontSize: isMobile ? '0.8rem' : '0.92rem' }}>
                        <Store size={14} color="rgba(212,175,55,0.7)" />
                        <span style={{ opacity: 0.85 }}>{user.store_owner_info}</span>
                    </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '9px', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>
                    <Clock size={13} />
                    <span>منذ: {user.created_at ? new Date(user.created_at).toLocaleDateString('ar-EG') : '---'}</span>
                </div>
            </div>

            {/* Action */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
                <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    onClick={onDelete}
                    style={{
                        width: '100%', height: isMobile ? '40px' : '46px', borderRadius: '10px',
                        border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.05)',
                        color: '#ef4444', fontWeight: '800', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                        fontSize: isMobile ? '0.8rem' : '0.88rem', fontFamily: "'Cairo', sans-serif"
                    }}
                >
                    <Trash2 size={isMobile ? 14 : 16} /> حذف المستخدم
                </motion.button>
            </div>
        </motion.div>
    );
};

// ── Main Users Page ───────────────────────────────────────────────────────────
const Users = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [totalCount, setTotalCount] = useState(0);
    const { startLoading, stopLoading } = useLoading();
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const observer = useRef();
    const lastUserRef = useCallback(node => {
        if (loading || loadingMore) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) setPage(prev => prev + 1);
        });
        if (node) observer.current.observe(node);
    }, [loading, loadingMore, hasMore]);

    const fetchUsers = async (pageNum, isInitial = false) => {
        if (isInitial) { startLoading(); setLoading(true); }
        else setLoadingMore(true);

        try {
            let query = supabase
                .from('users')
                .select('id, name, phone, profile_image_url, store_owner_info, is_active, created_at, is_online, last_seen', { count: 'exact' });

            if (searchQuery) {
                query = query.or(`name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%,store_owner_info.ilike.%${searchQuery}%`);
            }

            query = query.order('created_at', { ascending: false });

            const from = pageNum * 8;
            const to = from + 7;
            const { data, error, count } = await query.range(from, to);

            if (error) throw error;

            if (isInitial) { setUsers(data || []); setTotalCount(count || 0); }
            else setUsers(prev => [...prev, ...(data || [])]);

            setHasMore(count > to + 1);
        } catch (error) {
            console.error(error);
            Swal.fire({ icon: 'error', title: 'خطأ', text: 'فشل تحميل بيانات المستخدمين', background: '#141414', color: '#fff' });
        } finally {
            if (isInitial) { setLoading(false); stopLoading(); }
            else setLoadingMore(false);
        }
    };

    useEffect(() => { setPage(0); fetchUsers(0, true); }, [searchQuery]);
    useEffect(() => { if (page > 0) fetchUsers(page); }, [page]);

    // Realtime changes listener for online statuses, name/avatar/activation updates
    useEffect(() => {
        const usersChannel = supabase
            .channel('users-realtime-status')
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'users' },
                (payload) => {
                    setUsers(prev => 
                        prev.map(u => u.id === payload.new.id ? { ...u, ...payload.new } : u)
                    );
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(usersChannel);
        };
    }, []);

    const handleDeleteUser = async (userId, userName) => {
        const result = await Swal.fire({
            title: 'هل أنت متأكد؟',
            text: `سيتم حذف حساب "${userName}" نهائياً وتسجيل خروجه فوراً!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'نعم، احذف',
            cancelButtonText: 'إلغاء',
            background: '#141414', color: '#fff',
            confirmButtonColor: '#ef4444', cancelButtonColor: 'rgba(255,255,255,0.1)'
        });

        if (result.isConfirmed) {
            startLoading();
            try {
                const { error } = await supabase.rpc('delete_user_by_admin', { target_user_id: userId });
                if (error) throw error;
                setUsers(prev => prev.filter(u => u.id !== userId));
                setTotalCount(prev => prev - 1);
                Swal.fire({ icon: 'success', title: 'تم الحذف', text: 'تم حذف المستخدم بنجاح.', background: '#141414', color: '#fff' });
            } catch (error) {
                console.error('Delete Error:', error);
                Swal.fire({ icon: 'error', title: 'خطأ', text: 'فشل حذف المستخدم.', background: '#141414', color: '#fff' });
            } finally {
                stopLoading();
            }
        }
    };

    return (
        <div style={{ direction: 'rtl', padding: isMobile ? '5px' : '10px' }}>
            {/* Add Modal */}
            {showAddModal && (
                <AddUserModal
                    onClose={() => setShowAddModal(false)}
                    onSuccess={() => { setPage(0); fetchUsers(0, true); }}
                />
            )}

            {/* Header */}
            <div style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: isMobile ? 'flex-start' : 'flex-end',
                marginBottom: isMobile ? '1.5rem' : '2.5rem',
                flexDirection: isMobile ? 'column' : 'row', gap: '16px'
            }}>
                <div>
                    <h1 style={{
                        fontSize: isMobile ? '1.7rem' : '2.6rem', fontWeight: '900',
                        color: '#fff', marginBottom: '6px', letterSpacing: isMobile ? '-0.5px' : '-1px'
                    }}>
                        إدارة المستخدمين{' '}
                        <span style={{ color: 'var(--primary)', fontSize: isMobile ? '0.75rem' : '1.1rem', verticalAlign: 'middle', opacity: 0.75 }}>
                            | لوحة التحكم
                        </span>
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: isMobile ? '0.88rem' : '1rem' }}>
                        جميع الحسابات تُنشأ حصراً من هنا
                    </p>
                </div>

                {/* Summary + Add Button */}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', width: isMobile ? '100%' : 'auto' }}>
                    <motion.div
                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                        style={{
                            background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.15)',
                            padding: isMobile ? '10px 18px' : '14px 26px', borderRadius: '16px',
                            display: 'flex', alignItems: 'center', gap: '14px', backdropFilter: 'blur(10px)'
                        }}
                    >
                        <div style={{
                            width: isMobile ? '36px' : '46px', height: isMobile ? '36px' : '46px',
                            background: 'var(--primary)', borderRadius: '10px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000'
                        }}>
                            <UsersIcon size={isMobile ? 16 : 22} />
                        </div>
                        <div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '1px' }}>إجمالي المستخدمين</p>
                            <h4 style={{ fontSize: isMobile ? '1.3rem' : '1.7rem', fontWeight: '950', color: '#fff', lineHeight: 1 }}>{totalCount}</h4>
                        </div>
                    </motion.div>

                    <motion.button
                        id="open-add-user-modal-btn"
                        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        onClick={() => setShowAddModal(true)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            background: 'linear-gradient(135deg, #d4af37 0%, #b8860b 100%)',
                            border: 'none', color: '#000', fontWeight: '900',
                            fontSize: isMobile ? '0.85rem' : '0.95rem',
                            padding: isMobile ? '10px 16px' : '13px 22px', borderRadius: '14px',
                            cursor: 'pointer', fontFamily: "'Cairo', sans-serif",
                            boxShadow: '0 8px 24px rgba(212,175,55,0.3)',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        <Plus size={isMobile ? 16 : 18} />
                        إضافة مستخدم
                    </motion.button>
                </div>
            </div>

            {/* Search Bar */}
            <div style={{
                background: 'rgba(255,255,255,0.025)', padding: isMobile ? '14px' : '20px',
                borderRadius: '18px', marginBottom: isMobile ? '18px' : '32px',
                border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(10px)'
            }}>
                <div style={{ position: 'relative' }}>
                    <Search size={17} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.6 }} />
                    <input
                        id="users-search-input"
                        type="text"
                        placeholder="ابحث بالاسم، الهاتف، أو اسم المتجر..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        style={{
                            width: '100%', padding: '12px 44px 12px 16px',
                            background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.07)',
                            borderRadius: '12px', color: '#fff', fontSize: '0.92rem', outline: 'none',
                            fontFamily: "'Cairo', sans-serif"
                        }}
                    />
                </div>
            </div>

            {/* User Grid */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: isMobile ? '60px 0' : '100px 0', color: 'var(--primary)' }}>
                    <Loader2 className="spin" style={{ margin: '0 auto 20px', width: '50px', height: '50px' }} />
                    <p style={{ fontWeight: '800', fontSize: '1rem' }}>جاري استرجاع السجلات...</p>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(340px, 1fr))',
                    gap: isMobile ? '14px' : '24px', paddingBottom: '60px'
                }}>
                    <AnimatePresence mode="popLayout">
                        {users.length === 0 ? (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                style={{ gridColumn: '1/-1', textAlign: 'center', padding: '80px 0', opacity: 0.3 }}>
                                <Shield size={72} style={{ marginBottom: '20px' }} />
                                <p style={{ fontSize: '1.3rem', fontWeight: '700' }}>لا يوجد سجلات تطابق شروط البحث</p>
                            </motion.div>
                        ) : (
                            users.map((user, index) => (
                                <UserCard
                                    key={user.id}
                                    user={user}
                                    index={index}
                                    isMobile={isMobile}
                                    onDelete={() => handleDeleteUser(user.id, user.name)}
                                    lastUserRef={users.length === index + 1 ? lastUserRef : null}
                                />
                            ))
                        )}
                    </AnimatePresence>
                </div>
            )}

            {loadingMore && (
                <div style={{ textAlign: 'center', padding: '30px' }}>
                    <Loader2 className="spin" style={{ width: '36px', height: '36px', color: 'var(--primary)', margin: '0 auto' }} />
                </div>
            )}

            <style>{`
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default Users;
