import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Login = () => {
    const navigate = useNavigate();
    const { login, user } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Redirect if already logged in
    useEffect(() => {
        if (user) navigate('/', { replace: true });
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !password) {
            setError('يرجى إدخال البريد الإلكتروني وكلمة المرور');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await login(email.trim(), password);
            navigate('/', { replace: true });
        } catch (err) {
            setError(err.message || 'بيانات الدخول غير صحيحة');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-screen">
            <motion.div
                className="auth-card"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
            >
                {/* Brand */}
                <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                    <div style={{
                        width: '64px', height: '64px',
                        background: 'rgba(212,175,55,0.1)',
                        border: '1px solid rgba(212,175,55,0.25)',
                        borderRadius: '18px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 16px',
                    }}>
                        <ShieldCheck size={28} color="#d4af37" />
                    </div>
                    <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#fff', marginBottom: '6px' }}>
                        لوحة تحكم <span style={{ color: 'var(--primary)' }}>السعيدة</span>
                    </h1>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        تسجيل الدخول للمتابعة
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Email */}
                    <div className="field-group">
                        <label className="field-label">البريد الإلكتروني</label>
                        <div className="field-wrap">
                            <Mail size={18} className="field-icon" />
                            <input
                                type="email"
                                className="field-input"
                                placeholder="admin@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="email"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div className="field-group">
                        <label className="field-label">كلمة المرور</label>
                        <div className="field-wrap">
                            <Lock size={18} className="field-icon" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                className="field-input"
                                style={{ paddingLeft: '44px' }}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="current-password"
                                disabled={loading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute', left: '14px',
                                    background: 'none', border: 'none',
                                    color: 'var(--text-muted)', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center',
                                }}
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    {/* Error */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                style={{
                                    background: 'rgba(239,68,68,0.1)',
                                    border: '1px solid rgba(239,68,68,0.2)',
                                    borderRadius: '10px',
                                    padding: '10px 14px',
                                    marginBottom: '12px',
                                    fontSize: '13px',
                                    color: '#ef4444',
                                    textAlign: 'center',
                                }}
                            >
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Submit */}
                    <button type="submit" className="btn-submit" disabled={loading}>
                        {loading ? (
                            <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} />
                        ) : (
                            'تسجيل الدخول'
                        )}
                    </button>
                </form>

                {/* Footer */}
                <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '11px', color: 'rgba(255,255,255,0.2)' }}>
                    نظام إدارة متجر السعيدة
                </p>
            </motion.div>
        </div>
    );
};

export default Login;
