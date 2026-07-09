import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLoading } from '../context/LoadingContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase/client';
import Swal from 'sweetalert2';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Shield, Mail, Lock, UserCheck, X, Plus, Trash2, Edit3, Loader2,
    Calendar, Key, Power, ShieldAlert, CheckSquare, Square, Check, User
} from 'lucide-react';

// ── Password Strength Validator ────────────────────────────────────────────────
const validatePassword = (pwd) => {
    if (pwd.length < 6) return 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
    return null;
};

// ── Connection Status Helpers ──────────────────────────────────────────────────
const isManagerOnline = (manager) => {
    if (manager.role === 'super_admin') return true; // Super admin currently viewing is always online
    if (!manager.last_seen) return false;
    
    // Active within 2 minutes
    const lastSeenTime = new Date(manager.last_seen).getTime();
    const now = new Date().getTime();
    return (now - lastSeenTime) < 120000;
};

const getLastActiveText = (lastSeen) => {
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

// ── Add Manager Modal ─────────────────────────────────────────────────────────
const AddManagerModal = ({ onClose, onSuccess }) => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        permissions: {
            products: false,
            orders: false,
            users: false
        }
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePermissionChange = (key) => {
        setFormData(prev => ({
            ...prev,
            permissions: {
                ...prev.permissions,
                [key]: !prev.permissions[key]
            }
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.name.trim()) { setError('الاسم الكامل مطلوب'); return; }
        if (!formData.email.trim()) { setError('البريد الإلكتروني مطلوب'); return; }
        
        // Password strength validation
        const pwdError = validatePassword(formData.password);
        if (pwdError) { setError(pwdError); return; }

        if (formData.password !== formData.confirmPassword) {
            setError('كلمتا المرور غير متطابقتين');
            return;
        }

        // Must select at least one permission
        const { products, orders, users: uPerm } = formData.permissions;
        if (!products && !orders && !uPerm) {
            setError('يجب اختيار صلاحية واحدة على الأقل');
            return;
        }

        setIsSubmitting(true);
        try {
            const { data, error: rpcError } = await supabase.rpc('create_manager', {
                p_name: formData.name.trim(),
                p_email: formData.email.trim(),
                p_password: formData.password,
                p_permissions: formData.permissions,
                p_created_by: user.email
            });

            if (rpcError) throw rpcError;

            Swal.fire({
                icon: 'success',
                title: 'تم إنشاء حساب المدير',
                text: `تم إنشاء حساب "${formData.name}" بنجاح.`,
                background: '#141414',
                color: '#fff',
                confirmButtonColor: '#d4af37'
            });
            onSuccess();
            onClose();
        } catch (err) {
            console.error('Create manager error:', err);
            setError(err.message || 'حدث خطأ أثناء إنشاء حساب المدير');
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
                <button onClick={onClose} className="modern-modal-close">
                    <X size={16} />
                </button>

                <div className="modern-modal-header">
                    <div className="modern-modal-icon-wrapper">
                        <Shield size={24} color="var(--primary)" />
                    </div>
                    <h2 className="modern-modal-title">إضافة مدير جديد</h2>
                    <p className="modern-modal-subtitle">صلاحيات محددة لإدارة أقسام المتجر المختلفة</p>
                </div>

                {error && (
                    <div style={{
                        background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                        color: '#f87171', padding: '12px 16px', borderRadius: '12px',
                        marginBottom: '20px', fontSize: '0.85rem', textAlign: 'center'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} dir="rtl" className="modern-form-section-card">
                    <div className="modern-modal-form-grid">
                        {/* Right column: Personal Details */}
                        <div className="modern-modal-form-column">
                            {/* Full Name */}
                            <div className="modern-field-group">
                                <label className="modern-field-label">الاسم الكامل *</label>
                                <div className="modern-input-container">
                                    <User size={16} className="modern-input-icon" color="rgba(212,175,55,0.4)" />
                                    <input
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

                            {/* Email */}
                            <div className="modern-field-group">
                                <label className="modern-field-label">البريد الإلكتروني *</label>
                                <div className="modern-input-container">
                                    <Mail size={16} className="modern-input-icon" color="rgba(212,175,55,0.4)" />
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="manager@alsaeedah.store"
                                        required
                                        className="modern-input-field"
                                        style={{ paddingRight: '44px' }}
                                    />
                                </div>
                            </div>

                            {/* Passwords */}
                            <div className="modern-passwords-grid">
                                <div className="modern-field-group">
                                    <label className="modern-field-label">كلمة المرور *</label>
                                    <div className="modern-input-container">
                                        <Lock size={16} className="modern-input-icon" color="rgba(212,175,55,0.4)" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            placeholder="••••••••"
                                            required
                                            className="modern-input-field"
                                            style={{ paddingRight: '44px' }}
                                        />
                                    </div>
                                </div>
                                <div className="modern-field-group">
                                    <label className="modern-field-label">تأكيد كلمة المرور *</label>
                                    <div className="modern-input-container">
                                        <Lock size={16} className="modern-input-icon" color="rgba(212,175,55,0.4)" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            placeholder="••••••••"
                                            required
                                            className="modern-input-field"
                                            style={{ paddingRight: '44px' }}
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-4px' }}>
                                <button type="button" onClick={() => setShowPassword(p => !p)} style={{
                                    background: 'none', border: 'none', color: 'var(--primary)',
                                    fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold', fontFamily: "'Cairo', sans-serif"
                                }}>
                                    {showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                                </button>
                            </div>
                        </div>

                        {/* Left column: Permissions */}
                        <div className="modern-modal-form-column">
                            {/* Permissions */}
                            <div className="modern-field-group" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                <label className="modern-field-label">تحديد الصلاحيات والوصول *</label>
                                <div className="modern-permissions-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                    <label className="modern-permission-item">
                                        <input
                                            type="checkbox"
                                            checked={formData.permissions.products}
                                            onChange={() => handlePermissionChange('products')}
                                            className="modern-permission-checkbox"
                                        />
                                        <span>إدارة المنتجات</span>
                                    </label>
                                    <label className="modern-permission-item">
                                        <input
                                            type="checkbox"
                                            checked={formData.permissions.orders}
                                            onChange={() => handlePermissionChange('orders')}
                                            className="modern-permission-checkbox"
                                        />
                                        <span>إدارة الطلبات</span>
                                    </label>
                                    <label className="modern-permission-item">
                                        <input
                                            type="checkbox"
                                            checked={formData.permissions.users}
                                            onChange={() => handlePermissionChange('users')}
                                            className="modern-permission-checkbox"
                                        />
                                        <span>إدارة المستخدمين</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
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

// ── Edit Manager Modal ────────────────────────────────────────────────────────
const EditManagerModal = ({ manager, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: manager.name || '',
        email: manager.email || '',
        password: '',
        confirmPassword: '',
        is_active: manager.is_active !== false,
        permissions: {
            products: manager.permissions?.products || false,
            orders: manager.permissions?.orders || false,
            users: manager.permissions?.users || false
        }
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePermissionChange = (key) => {
        setFormData(prev => ({
            ...prev,
            permissions: {
                ...prev.permissions,
                [key]: !prev.permissions[key]
            }
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.name.trim()) { setError('الاسم الكامل مطلوب'); return; }
        if (!formData.email.trim()) { setError('البريد الإلكتروني مطلوب'); return; }
        
        // Password strength validation (only if provided)
        if (formData.password) {
            const pwdError = validatePassword(formData.password);
            if (pwdError) { setError(pwdError); return; }

            if (formData.password !== formData.confirmPassword) {
                setError('كلمتا المرور غير متطابقتين');
                return;
            }
        }

        // Must select at least one permission
        const { products, orders, users: uPerm } = formData.permissions;
        if (!products && !orders && !uPerm) {
            setError('يجب اختيار صلاحية واحدة على الأقل');
            return;
        }

        setIsSubmitting(true);
        try {
            const { error: rpcError } = await supabase.rpc('update_manager', {
                p_id: manager.id,
                p_name: formData.name.trim(),
                p_email: formData.email.trim(),
                p_password: formData.password || null,
                p_permissions: formData.permissions,
                p_is_active: formData.is_active
            });

            if (rpcError) throw rpcError;

            supabase.channel('global-manager-updates').send({
                type: 'broadcast',
                event: 'manager_updated',
                payload: {
                    id: manager.id,
                    name: formData.name.trim(),
                    email: formData.email.trim(),
                    permissions: formData.permissions,
                    is_active: formData.is_active
                }
            });

            Swal.fire({
                icon: 'success',
                title: 'تم تحديث البيانات',
                text: 'تم تحديث بيانات المدير بنجاح.',
                background: '#141414',
                color: '#fff',
                confirmButtonColor: '#d4af37'
            });
            onSuccess();
            onClose();
        } catch (err) {
            console.error('Update manager error:', err);
            setError(err.message || 'حدث خطأ أثناء تعديل حساب المدير');
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
                <button onClick={onClose} className="modern-modal-close">
                    <X size={16} />
                </button>

                <div className="modern-modal-header">
                    <div className="modern-modal-icon-wrapper">
                        <Edit3 size={24} color="var(--primary)" />
                    </div>
                    <h2 className="modern-modal-title">تعديل حساب المدير</h2>
                    <p className="modern-modal-subtitle">تحديث الصلاحيات أو تغيير كلمة المرور والبيانات الأساسية</p>
                </div>

                {error && (
                    <div style={{
                        background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                        color: '#f87171', padding: '12px 16px', borderRadius: '12px',
                        marginBottom: '20px', fontSize: '0.85rem', textAlign: 'center'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} dir="rtl" className="modern-form-section-card">
                    <div className="modern-modal-form-grid">
                        {/* Right column: Basic Info + Password */}
                        <div className="modern-modal-form-column">
                            {/* Full Name */}
                            <div className="modern-field-group">
                                <label className="modern-field-label">الاسم الكامل *</label>
                                <div className="modern-input-container">
                                    <User size={16} className="modern-input-icon" color="rgba(212,175,55,0.4)" />
                                    <input
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

                            {/* Email */}
                            <div className="modern-field-group">
                                <label className="modern-field-label">البريد الإلكتروني *</label>
                                <div className="modern-input-container">
                                    <Mail size={16} className="modern-input-icon" color="rgba(212,175,55,0.4)" />
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="manager@alsaeedah.store"
                                        required
                                        className="modern-input-field"
                                        style={{ paddingRight: '44px' }}
                                    />
                                </div>
                            </div>

                            {/* Password Section */}
                            <div style={{
                                padding: '14px', borderRadius: '14px',
                                background: 'rgba(212,175,55,0.03)',
                                border: '1px solid rgba(212,175,55,0.1)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: '800', marginBottom: '10px' }}>
                                    <Key size={12} />
                                    <span>تغيير كلمة المرور (اختياري)</span>
                                </div>
                                <div className="modern-passwords-grid">
                                    <div className="modern-field-group">
                                        <label className="modern-field-label" style={{ fontSize: '0.75rem' }}>كلمة المرور الجديدة</label>
                                        <div className="modern-input-container">
                                            <Lock size={15} className="modern-input-icon" color="rgba(212,175,55,0.4)" />
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                name="password"
                                                value={formData.password}
                                                onChange={handleChange}
                                                placeholder="اتركها فارغة"
                                                className="modern-input-field"
                                                style={{ paddingRight: '40px', fontSize: '0.85rem' }}
                                            />
                                        </div>
                                    </div>
                                    <div className="modern-field-group">
                                        <label className="modern-field-label" style={{ fontSize: '0.75rem' }}>تأكيد كلمة المرور</label>
                                        <div className="modern-input-container">
                                            <Lock size={15} className="modern-input-icon" color="rgba(212,175,55,0.4)" />
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                name="confirmPassword"
                                                value={formData.confirmPassword}
                                                onChange={handleChange}
                                                placeholder="اتركها فارغة"
                                                className="modern-input-field"
                                                style={{ paddingRight: '40px', fontSize: '0.85rem' }}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                                    <button type="button" onClick={() => setShowPassword(p => !p)} style={{
                                        background: 'none', border: 'none', color: 'var(--primary)',
                                        fontSize: '0.72rem', cursor: 'pointer', fontWeight: '700',
                                        fontFamily: "'Cairo', sans-serif"
                                    }}>
                                        {showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Left column: Status + Permissions */}
                        <div className="modern-modal-form-column">
                            {/* Account Status Toggle */}
                            <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '14px 16px', background: 'rgba(255,255,255,0.02)',
                                borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)',
                                flexShrink: 0
                            }}>
                                <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: '700' }}>حالة الحساب</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{
                                        fontSize: '0.72rem', fontWeight: '800',
                                        color: formData.is_active ? '#10b981' : '#ef4444'
                                    }}>
                                        {formData.is_active ? 'نشط' : 'معطّل'}
                                    </span>
                                    <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '24px', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={formData.is_active}
                                            onChange={() => setFormData(prev => ({ ...prev, is_active: !prev.is_active }))}
                                            style={{ opacity: 0, width: 0, height: 0 }}
                                        />
                                        <span style={{
                                            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                            background: formData.is_active ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                                            transition: '0.3s', borderRadius: '24px'
                                        }}>
                                            <span style={{
                                                position: 'absolute', left: formData.is_active ? '26px' : '4px', bottom: '3px',
                                                width: '18px', height: '18px', background: '#000', borderRadius: '50%', transition: '0.3s'
                                            }} />
                                        </span>
                                    </label>
                                </div>
                            </div>

                            {/* Permissions */}
                            <div className="modern-field-group" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <label className="modern-field-label">تعديل الصلاحيات *</label>
                                <div className="modern-permissions-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                    <label className="modern-permission-item">
                                        <input
                                            type="checkbox"
                                            checked={formData.permissions.products}
                                            onChange={() => handlePermissionChange('products')}
                                            className="modern-permission-checkbox"
                                        />
                                        <span>إدارة المنتجات</span>
                                    </label>
                                    <label className="modern-permission-item">
                                        <input
                                            type="checkbox"
                                            checked={formData.permissions.orders}
                                            onChange={() => handlePermissionChange('orders')}
                                            className="modern-permission-checkbox"
                                        />
                                        <span>إدارة الطلبات</span>
                                    </label>
                                    <label className="modern-permission-item">
                                        <input
                                            type="checkbox"
                                            checked={formData.permissions.users}
                                            onChange={() => handlePermissionChange('users')}
                                            className="modern-permission-checkbox"
                                        />
                                        <span>إدارة المستخدمين</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="modern-btn-submit"
                        style={{ marginTop: '12px' }}
                    >
                        {isSubmitting ? <><Loader2 size={18} className="spin" /> جاري التحديث...</> : <><Check size={18} /> حفظ التعديلات</>}
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

// ── Manager Card Component ──────────────────────────────────────────────────
const ManagerCard = ({ manager, index, isMobile, onEdit, onDelete, onToggleActive }) => {
    const isOnline = isManagerOnline(manager);
    const isSuper = manager.role === 'super_admin';

    // Build perm list
    const permList = [];
    if (isSuper) {
        permList.push({ name: 'المدير العام', color: '#d4af37', bg: 'rgba(212,175,55,0.12)', border: 'rgba(212,175,55,0.3)' });
    } else {
        if (manager.permissions?.products) permList.push({ name: 'المنتجات', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.2)' });
        if (manager.permissions?.orders) permList.push({ name: 'الطلبات', color: '#a855f7', bg: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.2)' });
        if (manager.permissions?.users) permList.push({ name: 'المستخدمين', color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.2)' });
    }

    // Colors: Gold/Blue for Super Admin, Dark/Translucent for managers
    const cardBg = isSuper 
        ? 'linear-gradient(135deg, rgba(212,175,55,0.06) 0%, rgba(20,20,20,0.8) 100%)'
        : 'rgba(255,255,255,0.02)';
    
    const cardBorder = isSuper
        ? '1px solid rgba(212,175,55,0.3)'
        : '1px solid rgba(255,255,255,0.07)';

    const activeLabelColor = manager.is_active !== false ? '#10b981' : '#ef4444';
    const activeLabelBg = manager.is_active !== false ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)';
    const activeLabelBorder = manager.is_active !== false ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)';

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.35, delay: (index % 6) * 0.05 }}
            style={{
                background: cardBg,
                border: cardBorder,
                borderRadius: '22px', padding: isMobile ? '18px' : '26px',
                display: 'flex', flexDirection: 'column', gap: isMobile ? '14px' : '20px',
                backdropFilter: 'blur(10px)', position: 'relative',
                boxShadow: isSuper ? '0 10px 30px rgba(212,175,55,0.05)' : 'none'
            }}
        >
            {/* Active / Super Admin Badge */}
            <div style={{
                position: 'absolute', top: '16px', left: '16px',
                background: isSuper ? 'rgba(212,175,55,0.15)' : activeLabelBg,
                border: `1px solid ${isSuper ? 'rgba(212,175,55,0.4)' : activeLabelBorder}`,
                color: isSuper ? '#d4af37' : activeLabelColor,
                padding: '3px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: '800'
            }}>
                {isSuper ? 'صلاحيات كاملة' : (manager.is_active !== false ? 'نشط' : 'معطّل')}
            </div>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : '16px' }}>
                <div style={{
                    width: isMobile ? '52px' : '64px', height: isMobile ? '52px' : '64px',
                    borderRadius: '14px', 
                    background: isSuper ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.04)',
                    border: `1.5px solid ${isSuper ? '#d4af37' : 'rgba(255,255,255,0.1)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0
                }}>
                    <Shield size={isMobile ? 22 : 28} color={isSuper ? '#d4af37' : 'var(--primary)'} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                        <h3 style={{ fontSize: isMobile ? '0.95rem' : '1.15rem', fontWeight: '800', color: '#fff', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {manager.name}
                        </h3>
                        {/* Glowing Connection Dot */}
                        <span style={{
                            width: '9px', height: '9px', borderRadius: '50%',
                            background: isOnline ? '#10b981' : '#6b7280',
                            boxShadow: isOnline ? '0 0 10px #10b981' : 'none',
                            display: 'inline-block',
                            flexShrink: 0
                        }} title={isOnline ? 'متصل الآن' : 'غير متصل'} />
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ fontSize: '0.68rem', color: isSuper ? '#d4af37' : 'var(--primary)', fontWeight: '800' }}>
                            {isSuper ? 'المالك الأساسي' : `#MNG-${manager.id.substring(0, 5).toUpperCase()}`}
                        </span>
                        <span style={{ fontSize: '0.68rem', color: isOnline ? '#10b981' : 'rgba(255,255,255,0.4)', fontWeight: isOnline ? '750' : 'normal' }}>
                            • {isOnline ? 'متصل الآن' : getLastActiveText(manager.last_seen)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Info Grid */}
            <div style={{ display: 'grid', gap: '10px', background: 'rgba(0,0,0,0.15)', padding: isMobile ? '12px' : '16px', borderRadius: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '9px', color: '#fff', fontSize: isMobile ? '0.8rem' : '0.92rem' }}>
                    <Mail size={14} color="rgba(212,175,55,0.7)" />
                    <span style={{ opacity: 0.85, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{manager.email}</span>
                </div>
                
                {/* Permission Badges Container */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', marginTop: '4px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginRight: '2px' }}>الأقسام:</span>
                    {permList.map((perm, pidx) => (
                        <span 
                            key={pidx} 
                            style={{
                                fontSize: '0.7rem', fontWeight: '800', color: perm.color,
                                background: perm.bg, border: `1px solid ${perm.border}`,
                                padding: '2px 8px', borderRadius: '6px'
                            }}
                        >
                            {perm.name}
                        </span>
                    ))}
                </div>

                {!isSuper && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '9px', color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem' }}>
                        <Calendar size={13} />
                        <span>أنشئ بواسطة: {manager.created_by || 'المدير العام'}</span>
                    </div>
                )}
            </div>

            {/* Action buttons (only for database managers) */}
            {!isSuper && (
                <div style={{ 
                    borderTop: '1px solid rgba(255,255,255,0.05)', 
                    paddingTop: '12px',
                    display: 'grid',
                    gridTemplateColumns: '1fr auto auto',
                    gap: '8px'
                }}>
                    <motion.button
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                        onClick={onEdit}
                        style={{
                            height: '38px', borderRadius: '8px',
                            border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)',
                            color: '#fff', fontWeight: '800', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                            fontSize: '0.8rem', fontFamily: "'Cairo', sans-serif"
                        }}
                    >
                        <Edit3 size={14} /> تعديل
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                        onClick={onToggleActive}
                        title={manager.is_active !== false ? 'تعطيل الحساب' : 'تنشيط الحساب'}
                        style={{
                            width: '38px', height: '38px', borderRadius: '8px',
                            border: manager.is_active !== false ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(16,185,129,0.2)',
                            background: manager.is_active !== false ? 'rgba(239,68,68,0.05)' : 'rgba(16,185,129,0.05)',
                            color: manager.is_active !== false ? '#ef4444' : '#10b981',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                    >
                        <Power size={15} />
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                        onClick={onDelete}
                        title="حذف نهائي"
                        style={{
                            width: '38px', height: '38px', borderRadius: '8px',
                            border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.05)',
                            color: '#ef4444', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                    >
                        <Trash2 size={15} />
                    </motion.button>
                </div>
            )}
        </motion.div>
    );
};

// ── Main Managers Component ─────────────────────────────────────────────────
const Managers = () => {
    const { startLoading, stopLoading } = useLoading();
    const { user } = useAuth();
    const [managersList, setManagersList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedManager, setSelectedManager] = useState(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchManagers = async (isInitial = false) => {
        if (isInitial) { startLoading(); setLoading(true); }
        try {
            const { data, error } = await supabase.rpc('get_managers');
            if (error) throw error;
            setManagersList(data || []);
        } catch (error) {
            console.error('Failed to load managers:', error);
            Swal.fire({
                icon: 'error',
                title: 'خطأ',
                text: 'فشل تحميل بيانات المدراء من قاعدة البيانات',
                background: '#141414',
                color: '#fff'
            });
        } finally {
            if (isInitial) { setLoading(false); stopLoading(); }
        }
    };

    useEffect(() => {
        fetchManagers(true);
    }, []);

    // Subscribe to database changes for managers table
    useEffect(() => {
        const managersChannel = supabase
            .channel('managers-db-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'managers' },
                () => {
                    fetchManagers(false); // Update list silently
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(managersChannel);
        };
    }, []);

    const handleDeleteManager = async (managerId, managerName) => {
        const result = await Swal.fire({
            title: 'هل أنت متأكد؟',
            text: `سيتم حذف حساب المدير "${managerName}" نهائياً ويسحب وصوله للمتجر فوراً!`,
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
                const { error } = await supabase.rpc('delete_manager', { p_id: managerId });
                if (error) throw error;
                setManagersList(prev => prev.filter(m => m.id !== managerId));
                
                supabase.channel('global-manager-updates').send({
                    type: 'broadcast',
                    event: 'manager_deleted',
                    payload: { id: managerId }
                });
                
                Swal.fire({ icon: 'success', title: 'تم الحذف', text: 'تم حذف حساب المدير بنجاح.', background: '#141414', color: '#fff' });
            } catch (err) {
                console.error('Delete Manager Error:', err);
                Swal.fire({ icon: 'error', title: 'خطأ', text: 'فشل حذف حساب المدير.', background: '#141414', color: '#fff' });
            } finally {
                stopLoading();
            }
        }
    };

    const handleToggleManagerActive = async (mng) => {
        const nextStatus = mng.is_active === false;
        startLoading();
        try {
            const { error } = await supabase.rpc('update_manager', {
                p_id: mng.id,
                p_name: mng.name,
                p_email: mng.email,
                p_password: null,
                p_permissions: mng.permissions,
                p_is_active: nextStatus
            });

            if (error) throw error;

            setManagersList(prev => 
                prev.map(m => m.id === mng.id ? { ...m, is_active: nextStatus } : m)
            );

            supabase.channel('global-manager-updates').send({
                type: 'broadcast',
                event: 'manager_updated',
                payload: {
                    id: mng.id,
                    name: mng.name,
                    email: mng.email,
                    permissions: mng.permissions,
                    is_active: nextStatus
                }
            });

            Swal.fire({
                icon: 'success',
                title: nextStatus ? 'تم التنشيط' : 'تم التعطيل',
                text: nextStatus ? `تم تفعيل حساب المدير "${mng.name}"` : `تم إيقاف حساب المدير "${mng.name}" مؤقتاً`,
                background: '#141414', color: '#fff',
                timer: 2000, showConfirmButton: false
            });
        } catch (err) {
            console.error('Toggle Active Error:', err);
            Swal.fire({ icon: 'error', title: 'خطأ', text: 'فشل تغيير حالة تنشيط المدير.', background: '#141414', color: '#fff' });
        } finally {
            stopLoading();
        }
    };

    // Prepend the static Super Admin details (from VITE_ADMIN_EMAIL or default)
    const superAdminAccount = {
        id: 'super-admin',
        name: 'المدير العام (المالك)',
        email: import.meta.env.VITE_ADMIN_EMAIL || 'alsaeedah8@gmail.com',
        role: 'super_admin',
        is_active: true,
        last_seen: new Date().toISOString()
    };

    const allManagers = [superAdminAccount, ...managersList];

    return (
        <div style={{ direction: 'rtl', padding: isMobile ? '5px' : '10px' }}>
            {/* Modals */}
            {showAddModal && (
                <AddManagerModal
                    onClose={() => setShowAddModal(false)}
                    onSuccess={() => fetchManagers(false)}
                />
            )}

            {showEditModal && selectedManager && (
                <EditManagerModal
                    manager={selectedManager}
                    onClose={() => { setShowEditModal(false); setSelectedManager(null); }}
                    onSuccess={() => fetchManagers(false)}
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
                        إدارة المدراء{' '}
                        <span style={{ color: 'var(--primary)', fontSize: isMobile ? '0.75rem' : '1.1rem', verticalAlign: 'middle', opacity: 0.75 }}>
                            | لوحة التحكم
                        </span>
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: isMobile ? '0.88rem' : '1rem' }}>
                        إسناد وتوزيع الصلاحيات وتتبع نشاط حسابات المدراء الفرعيين
                    </p>
                </div>

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
                            <Shield size={isMobile ? 16 : 22} />
                        </div>
                        <div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '1px' }}>إجمالي الحسابات</p>
                            <h4 style={{ fontSize: isMobile ? '1.3rem' : '1.7rem', fontWeight: '950', color: '#fff', lineHeight: 1 }}>{allManagers.length}</h4>
                        </div>
                    </motion.div>

                    <motion.button
                        id="open-add-manager-modal-btn"
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
                        إضافة مدير
                    </motion.button>
                </div>
            </div>

            {/* Manager Grid */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: isMobile ? '60px 0' : '100px 0', color: 'var(--primary)' }}>
                    <Loader2 className="spin" style={{ margin: '0 auto 20px', width: '50px', height: '50px' }} />
                    <p style={{ fontWeight: '800', fontSize: '1rem' }}>جاري تحميل حسابات المدراء...</p>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(340px, 1fr))',
                    gap: isMobile ? '14px' : '24px', paddingBottom: '60px'
                }}>
                    <AnimatePresence mode="popLayout">
                        {allManagers.map((manager, idx) => (
                            <ManagerCard
                                key={manager.id}
                                manager={manager}
                                index={idx}
                                isMobile={isMobile}
                                onEdit={() => { setSelectedManager(manager); setShowEditModal(true); }}
                                onDelete={() => handleDeleteManager(manager.id, manager.name)}
                                onToggleActive={() => handleToggleManagerActive(manager)}
                            />
                        ))}
                    </AnimatePresence>
                </div>
            )}

            <style>{`
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default Managers;
