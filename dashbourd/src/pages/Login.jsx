import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';
import { Lock, Mail, ArrowLeft } from 'lucide-react';

const logo = '/logo.png';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(email, password);

            Swal.fire({
                icon: 'success',
                title: 'مرحباً بعودتك!',
                text: 'جاري تحويلك للوحة التحكم...',
                background: '#141414',
                color: '#fff',
                showConfirmButton: false,
                timer: 1500
            });
            setTimeout(() => navigate('/'), 1500);
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'خطأ في الدخول',
                text: error.message || 'تأكد من البريد الإلكتروني وكلمة المرور',
                background: '#141414',
                color: '#fff',
                confirmButtonColor: 'var(--primary)'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            background: 'var(--bg-dark)',
            padding: '20px',
            direction: 'rtl'
        }}>
            <div className="glass-panel auth-card" style={{
                borderRadius: 'var(--radius-lg)',
                boxShadow: '0 0 60px rgba(212, 175, 55, 0.1)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Decoration */}
                <div style={{
                    position: 'absolute',
                    top: '-50px',
                    left: '-50px',
                    width: '100px',
                    height: '100px',
                    background: 'var(--primary)',
                    filter: 'blur(50px)',
                    opacity: '0.2'
                }} />

                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 20px',
                        border: '1px solid var(--primary)',
                        padding: '5px'
                    }}>
                        <img src={logo} alt="متجر السعيدة" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
                    </div>
                    <h2 style={{ fontSize: '2rem', fontWeight: '800', color: '#fff', marginBottom: '10px' }}>
                        <span style={{ color: 'var(--primary)' }}>متجر</span> السعيدة
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>سجل دخولك لإدارة متجرك الفاخر</p>
                </div>

                <form onSubmit={handleLogin}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '10px', fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-muted)' }}>البريد الإلكتروني</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                placeholder="اسم المستخدم أو البريد"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                style={{
                                    width: '100%',
                                    padding: '14px 45px 14px 16px',
                                    borderRadius: '14px',
                                    border: '1px solid var(--glass-border)',
                                    background: 'rgba(255,255,255,0.03)',
                                    color: 'white',
                                    outline: 'none',
                                    transition: '0.3s'
                                }}
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '2.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '10px', fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-muted)' }}>كلمة المرور</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                style={{
                                    width: '100%',
                                    padding: '14px 45px 14px 16px',
                                    borderRadius: '14px',
                                    border: '1px solid var(--glass-border)',
                                    background: 'rgba(255,255,255,0.03)',
                                    color: 'white',
                                    outline: 'none',
                                    transition: '0.3s'
                                }}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={loading}
                        style={{
                            width: '100%',
                            height: '56px',
                            justifyContent: 'center',
                            fontSize: '1.1rem',
                            borderRadius: '16px'
                        }}
                    >
                        {loading ? 'جاري التحقق...' : 'دخول للمنصة'}
                        {!loading && <ArrowLeft size={20} style={{ marginRight: '8px' }} />}
                    </button>

                </form>
            </div>
        </div>
    );
};

export default Login;
