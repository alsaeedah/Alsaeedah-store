import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Unauthorized = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const handleGoBack = () => {
        if (user?.role === 'super_admin') {
            navigate('/', { replace: true });
        } else if (user?.permissions?.products) {
            navigate('/products', { replace: true });
        } else if (user?.permissions?.orders) {
            navigate('/orders', { replace: true });
        } else if (user?.permissions?.users) {
            navigate('/users', { replace: true });
        } else {
            navigate('/login', { replace: true });
        }
    };

    return (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            height: '100%', padding: '24px', textAlign: 'center',
            background: 'var(--bg-dark)'
        }}>
            <div style={{
                width: '80px', height: '80px', borderRadius: '50%',
                background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '24px'
            }}>
                <ShieldAlert size={40} color="#ef4444" />
            </div>
            
            <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '8px' }}>
                غير مصرح لك بالوصول
            </h1>
            
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '32px', maxWidth: '300px' }}>
                ليس لديك الصلاحيات الكافية للوصول إلى هذه الصفحة. يرجى التواصل مع المدير العام إذا كنت تعتقد أن هذا خطأ.
            </p>

            <button onClick={handleGoBack} className="btn-primary" style={{ padding: '12px 24px' }}>
                <ArrowRight size={18} />
                <span>العودة للصفحة الرئيسية</span>
            </button>
        </div>
    );
};

export default Unauthorized;
