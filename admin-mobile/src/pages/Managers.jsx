import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase/client';
import { useLoading } from '../context/LoadingContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Plus, X, Edit, Trash2, ShieldCheck, Mail, Lock, User, ToggleLeft, ToggleRight } from 'lucide-react';
import Swal from 'sweetalert2';

const Managers = () => {
    const { startLoading, stopLoading } = useLoading();
    const [managers, setManagers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    
    // Form state
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: '', email: '', password: '',
        permissions: { products: false, orders: false, users: false, managers: false },
        is_active: true
    });

    const fetchManagers = async () => {
        startLoading();
        setLoading(true);
        try {
            const { data, error } = await supabase.from('managers').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            setManagers(data || []);
        } catch (err) {
            console.error('Managers fetch error:', err);
        } finally {
            setLoading(false);
            stopLoading();
        }
    };

    useEffect(() => { fetchManagers(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.name || !formData.email || (!editingId && !formData.password)) {
            Swal.fire({ title: 'خطأ', text: 'يرجى تعبئة الحقول المطلوبة', icon: 'error', background: '#141414', color: '#fff' });
            return;
        }

        try {
            startLoading();
            if (editingId) {
                // Update
                const { error } = await supabase.rpc('update_manager', {
                    p_id: editingId,
                    p_name: formData.name,
                    p_email: formData.email,
                    p_password: formData.password || null, // null means don't change
                    p_permissions: formData.permissions,
                    p_is_active: formData.is_active
                });
                if (error) throw error;
                Swal.fire({ title: 'تم', text: 'تم تحديث بيانات المدير', icon: 'success', timer: 1500, showConfirmButton: false, background: '#141414', color: '#fff' });
            } else {
                // Create
                const { error } = await supabase.rpc('create_manager', {
                    p_name: formData.name,
                    p_email: formData.email,
                    p_password: formData.password,
                    p_permissions: formData.permissions
                });
                if (error) throw error;
                Swal.fire({ title: 'تم', text: 'تمت إضافة المدير', icon: 'success', timer: 1500, showConfirmButton: false, background: '#141414', color: '#fff' });
            }
            
            setShowForm(false);
            fetchManagers();
        } catch (err) {
            Swal.fire({ title: 'خطأ', text: err.message, icon: 'error', background: '#141414', color: '#fff' });
        } finally {
            stopLoading();
        }
    };

    const handleDelete = (id, name) => {
        Swal.fire({
            title: 'حذف المدير',
            text: `هل تريد حذف ${name} بشكل نهائي؟`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: 'rgba(255,255,255,0.1)',
            confirmButtonText: 'حذف',
            cancelButtonText: 'إلغاء',
            background: '#141414',
            color: '#fff',
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    startLoading();
                    const { error } = await supabase.rpc('delete_manager', { p_id: id });
                    if (error) throw error;
                    Swal.fire({ title: 'تم الحذف', icon: 'success', timer: 1500, showConfirmButton: false, background: '#141414', color: '#fff' });
                    fetchManagers();
                } catch (err) {
                    Swal.fire({ title: 'خطأ', text: err.message, icon: 'error', background: '#141414', color: '#fff' });
                } finally {
                    stopLoading();
                }
            }
        });
    };

    const handleToggleActive = async (manager) => {
        try {
            startLoading();
            const { error } = await supabase.rpc('update_manager', {
                p_id: manager.id,
                p_name: manager.name,
                p_email: manager.email,
                p_password: null,
                p_permissions: manager.permissions,
                p_is_active: !manager.is_active
            });
            if (error) throw error;
            fetchManagers();
        } catch (err) {
            console.error('Toggle active error:', err);
            stopLoading();
        }
    };

    const openEditForm = (manager) => {
        setEditingId(manager.id);
        setFormData({
            name: manager.name,
            email: manager.email,
            password: '',
            permissions: manager.permissions || { products: false, orders: false, users: false, managers: false },
            is_active: manager.is_active
        });
        setShowForm(true);
    };

    const openAddForm = () => {
        setEditingId(null);
        setFormData({
            name: '', email: '', password: '',
            permissions: { products: false, orders: false, users: false, managers: false },
            is_active: true
        });
        setShowForm(true);
    };

    const togglePermission = (key) => {
        setFormData(prev => ({
            ...prev,
            permissions: { ...prev.permissions, [key]: !prev.permissions[key] }
        }));
    };

    return (
        <div>
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">إدارة المدراء</h1>
                    <p className="page-subtitle">{managers.length} مدير مسجل</p>
                </div>
                <button className="btn-primary" style={{ padding: '10px 14px' }} onClick={openAddForm}>
                    <Plus size={18} />
                    <span>إضافة</span>
                </button>
            </div>

            {/* Loading */}
            {loading && <div className="spinner-wrap"><div className="spinner" /></div>}

            {/* Empty */}
            {!loading && managers.length === 0 && (
                <div className="empty-state">
                    <Shield size={44} className="empty-state-icon" />
                    <p className="empty-state-text">لا يوجد مدراء</p>
                    <p className="empty-state-sub">قم بإضافة مدراء لمساعدتك في الإدارة</p>
                </div>
            )}

            {/* List */}
            {!loading && managers.map((manager, idx) => (
                <motion.div
                    key={manager.id}
                    className="list-item"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    style={{ cursor: 'default', opacity: manager.is_active ? 1 : 0.6 }}
                >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div className="avatar" style={{ width: '36px', height: '36px', fontSize: '14px' }}>
                                {manager.name[0]}
                            </div>
                            <div>
                                <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    {manager.name}
                                    {!manager.is_active && <span className="badge" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>معطل</span>}
                                </p>
                                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{manager.email}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => handleToggleActive(manager)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: manager.is_active ? '#10b981' : '#ef4444' }}
                        >
                            {manager.is_active ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                        </button>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '8px', padding: '10px', marginBottom: '12px' }}>
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>الصلاحيات:</p>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {manager.permissions?.products && <span className="badge" style={{ background: 'rgba(212,175,55,0.1)', color: '#d4af37' }}>المنتجات</span>}
                            {manager.permissions?.orders && <span className="badge" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>الطلبات</span>}
                            {manager.permissions?.users && <span className="badge" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>العملاء</span>}
                            {manager.permissions?.managers && <span className="badge" style={{ background: 'rgba(168,85,247,0.1)', color: '#a855f7' }}>المدراء</span>}
                            {!Object.values(manager.permissions || {}).some(v => v) && (
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>لا توجد صلاحيات</span>
                            )}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => openEditForm(manager)} className="btn-icon" style={{ flex: 1, height: '36px' }}>
                            <Edit size={16} />
                        </button>
                        <button onClick={() => handleDelete(manager.id, manager.name)} className="btn-icon" style={{ flex: 1, height: '36px', borderColor: 'rgba(239,68,68,0.2)' }}>
                            <Trash2 size={16} color="#ef4444" />
                        </button>
                    </div>
                </motion.div>
            ))}

            {/* Form Bottom Sheet */}
            <AnimatePresence>
                {showForm && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowForm(false)}
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
                                    {editingId ? 'تعديل بيانات المدير' : 'إضافة مدير جديد'}
                                </h2>
                                <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                    <X size={22} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <div className="field-group">
                                    <label className="field-label">اسم المدير</label>
                                    <div className="field-wrap">
                                        <User size={18} className="field-icon" />
                                        <input type="text" className="field-input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="الاسم الكامل" required />
                                    </div>
                                </div>

                                <div className="field-group">
                                    <label className="field-label">البريد الإلكتروني</label>
                                    <div className="field-wrap">
                                        <Mail size={18} className="field-icon" />
                                        <input type="email" className="field-input" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="email@example.com" required />
                                    </div>
                                </div>

                                <div className="field-group" style={{ marginBottom: '24px' }}>
                                    <label className="field-label">كلمة المرور {editingId && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>(اتركه فارغاً لعدم التغيير)</span>}</label>
                                    <div className="field-wrap">
                                        <Lock size={18} className="field-icon" />
                                        <input type="password" className="field-input" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} placeholder="••••••••" required={!editingId} />
                                    </div>
                                </div>

                                <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '12px' }}>
                                    الصلاحيات الممنوحة
                                </h3>
                                <div style={{ marginBottom: '24px' }}>
                                    {[
                                        { key: 'products', label: 'إدارة المنتجات' },
                                        { key: 'orders', label: 'إدارة الطلبات' },
                                        { key: 'users', label: 'إدارة العملاء' },
                                        { key: 'managers', label: 'إدارة المدراء' },
                                    ].map(({ key, label }) => (
                                        <div key={key} className="perm-item" onClick={() => togglePermission(key)}>
                                            <input type="checkbox" className="perm-checkbox" checked={formData.permissions[key]} readOnly />
                                            <span className="perm-label">{label}</span>
                                        </div>
                                    ))}
                                </div>

                                <button type="submit" className="btn-submit">
                                    حفظ البيانات
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div style={{ height: '8px' }} />
        </div>
    );
};

export default Managers;
