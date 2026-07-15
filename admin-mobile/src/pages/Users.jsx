import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase/client';
import { useLoading } from '../context/LoadingContext';
import { motion } from 'framer-motion';
import { Search, Users as UsersIcon, X, MapPin, Phone } from 'lucide-react';

const Users = () => {
    const { startLoading, stopLoading } = useLoading();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const fetchUsers = async () => {
            startLoading();
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('users')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setUsers(data || []);
            } catch (err) {
                console.error('Users fetch error:', err);
            } finally {
                setLoading(false);
                stopLoading();
            }
        };

        fetchUsers();
    }, []);

    const filtered = users.filter((u) => {
        const term = search.toLowerCase();
        return !search ||
            u.name?.toLowerCase().includes(term) ||
            u.phone?.includes(term) ||
            u.email?.toLowerCase().includes(term);
    });

    return (
        <div>
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">العملاء</h1>
                    <p className="page-subtitle">{users.length} عميل مسجل</p>
                </div>
            </div>

            {/* Search */}
            <div className="search-wrap">
                <Search size={16} color="var(--text-muted)" />
                <input
                    className="search-input"
                    placeholder="بحث بالاسم، الجوال، أو البريد..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                    <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                        <X size={16} />
                    </button>
                )}
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                {filtered.length} نتيجة
            </p>

            {/* Loading */}
            {loading && <div className="spinner-wrap"><div className="spinner" /></div>}

            {/* Empty */}
            {!loading && filtered.length === 0 && (
                <div className="empty-state">
                    <UsersIcon size={44} className="empty-state-icon" />
                    <p className="empty-state-text">لا يوجد عملاء</p>
                </div>
            )}

            {/* List */}
            {!loading && filtered.map((user, idx) => (
                <motion.div
                    key={user.id}
                    className="list-item"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    style={{ cursor: 'default' }}
                >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <div className="avatar" style={{ width: '42px', height: '42px', fontSize: '16px' }}>
                            {user.name ? user.name[0] : 'ع'}
                        </div>
                        <div style={{ flex: 1 }}>
                            <p style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '4px' }}>
                                {user.name || 'غير معروف'}
                            </p>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                <Phone size={12} color="var(--primary)" />
                                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{user.phone || 'لا يوجد رقم'}</span>
                            </div>

                            {user.address && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <MapPin size={12} color="var(--primary)" style={{ flexShrink: 0 }} />
                                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                        {typeof user.address === 'object'
                                            ? Object.values(user.address).filter(Boolean).join('، ')
                                            : user.address}
                                    </span>
                                </div>
                            )}

                            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '8px' }}>
                                انضم في {new Date(user.created_at).toLocaleDateString('ar-SA')}
                            </p>
                        </div>
                    </div>
                </motion.div>
            ))}

            <div style={{ height: '8px' }} />
        </div>
    );
};

export default Users;
