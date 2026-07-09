import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, LogOut, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Unauthorized = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '70vh',
            direction: 'rtl',
            padding: '20px'
        }}>
            <div className="glass-panel" style={{
                borderRadius: '24px',
                padding: '40px',
                width: '100%',
                maxWidth: '460px',
                textAlign: 'center',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                boxShadow: '0 20px 50px rgba(239, 68, 68, 0.08)',
                background: 'rgba(26, 26, 26, 0.45)',
                backdropFilter: 'blur(20px)'
            }}>
                <div style={{
                    width: '68px',
                    height: '68px',
                    borderRadius: '16px',
                    background: 'rgba(239, 68, 68, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 24px',
                    border: '1px solid rgba(239, 68, 68, 0.2)'
                }}>
                    <ShieldAlert size={36} color="#ef4444" />
                </div>
                
                <h1 style={{ color: '#fff', fontSize: '1.6rem', fontWeight: '900', marginBottom: '12px', fontFamily: "'Cairo', sans-serif" }}>
                    وصول غير مصرح به
                </h1>
                
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.7', marginBottom: '30px', fontFamily: "'Cairo', sans-serif" }}>
                    عذراً، ليس لديك الصلاحيات اللازمة للوصول إلى هذه الصفحة. يرجى التواصل مع المدير العام إذا كنت تعتقد أن هذا خطأ.
                </p>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                    <button 
                        onClick={() => navigate('/')} 
                        className="btn-primary"
                        style={{
                            padding: '12px 20px',
                            borderRadius: '12px',
                            fontSize: '0.88rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                            fontWeight: '800',
                            fontFamily: "'Cairo', sans-serif",
                            border: 'none',
                            background: 'linear-gradient(135deg, #d4af37 0%, #b8860b 100%)',
                            color: '#000'
                        }}
                    >
                        <ArrowLeft size={16} /> لوحة التحكم
                    </button>
                    
                    <button 
                        onClick={handleLogout} 
                        style={{
                            padding: '12px 20px',
                            borderRadius: '12px',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            background: 'rgba(239, 68, 68, 0.04)',
                            color: '#ef4444',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '0.88rem',
                            fontFamily: "'Cairo', sans-serif",
                            transition: '0.25s'
                        }}
                    >
                        <LogOut size={16} /> تسجيل الخروج
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Unauthorized;
