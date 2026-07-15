import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Shield, Bell, Key, LogOut, ChevronLeft } from 'lucide-react';
import Swal from 'sweetalert2';

const Settings = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        Swal.fire({
            title: 'تسجيل الخروج',
            text: 'هل أنت متأكد من تسجيل الخروج؟',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#d4af37',
            cancelButtonColor: 'rgba(255,255,255,0.1)',
            confirmButtonText: 'نعم',
            cancelButtonText: 'إلغاء',
            background: '#141414',
            color: '#fff',
        }).then((result) => {
            if (result.isConfirmed) {
                logout();
                navigate('/login');
            }
        });
    };

    return (
        <div>
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">الإعدادات</h1>
                </div>
            </div>

            {/* Profile Info */}
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                <div style={{
                    width: '60px', height: '60px', borderRadius: '50%',
                    background: 'rgba(212,175,55,0.1)', border: '2px solid rgba(212,175,55,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <span style={{ fontSize: '24px', color: '#d4af37', fontWeight: '800' }}>
                        {user?.name ? user.name[0] : 'م'}
                    </span>
                </div>
                <div>
                    <p style={{ fontSize: '18px', fontWeight: '800', color: '#fff', marginBottom: '4px' }}>
                        {user?.role === 'super_admin' ? 'المدير العام' : user?.name}
                    </p>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{user?.email}</p>
                </div>
            </div>

            {/* Settings Sections */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Admin Management (Super Admin Only) */}
                {user?.role === 'super_admin' && (
                    <div className="card" style={{ padding: '0' }}>
                        <button
                            onClick={() => navigate('/managers')}
                            style={{
                                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '16px', background: 'none', border: 'none', cursor: 'pointer',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(212,175,55,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Shield size={18} color="#d4af37" />
                                </div>
                                <span style={{ fontSize: '15px', fontWeight: '600', color: '#fff' }}>إدارة المدراء</span>
                            </div>
                            <ChevronLeft size={18} color="var(--text-muted)" />
                        </button>
                    </div>
                )}

                {/* Notifications */}
                <div className="card" style={{ padding: '0' }}>
                    <button
                        style={{
                            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '16px', background: 'none', border: 'none', cursor: 'pointer',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Bell size={18} color="#3b82f6" />
                            </div>
                            <span style={{ fontSize: '15px', fontWeight: '600', color: '#fff' }}>إعدادات الإشعارات</span>
                        </div>
                        <ChevronLeft size={18} color="var(--text-muted)" />
                    </button>
                </div>

                {/* Security */}
                <div className="card" style={{ padding: '0' }}>
                    <button
                        style={{
                            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '16px', background: 'none', border: 'none', cursor: 'pointer',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Key size={18} color="#10b981" />
                            </div>
                            <span style={{ fontSize: '15px', fontWeight: '600', color: '#fff' }}>تغيير كلمة المرور</span>
                        </div>
                        <ChevronLeft size={18} color="var(--text-muted)" />
                    </button>
                </div>

                {/* Logout */}
                <div className="card" style={{ padding: '0', marginTop: '16px' }}>
                    <button
                        onClick={handleLogout}
                        style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                            padding: '16px', background: 'none', border: 'none', cursor: 'pointer',
                        }}
                    >
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <LogOut size={18} color="#ef4444" />
                        </div>
                        <span style={{ fontSize: '15px', fontWeight: '700', color: '#ef4444' }}>تسجيل الخروج</span>
                    </button>
                </div>
            </div>

            <div style={{ height: '8px' }} />
        </div>
    );
};

export default Settings;
