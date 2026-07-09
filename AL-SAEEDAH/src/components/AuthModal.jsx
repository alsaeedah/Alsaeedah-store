import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Phone, Lock, Eye, EyeOff, LogIn } from 'lucide-react';

export default function AuthModal() {
    const { isAuthModalOpen, closeAuthModal, login } = useAuth();
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    if (!isAuthModalOpen) return null;

    const handlePhoneChange = (e) => {
        // Allow digits only
        setPhone(e.target.value.replace(/[^0-9]/g, ''));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!phone || phone.length < 7) {
            setError('يرجى إدخال رقم هاتف صحيح');
            return;
        }
        if (!password || password.length < 6) {
            setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
            return;
        }

        setIsSubmitting(true);
        try {
            await login(phone, password);
            // Auth state change will close the modal automatically
            setPhone('');
            setPassword('');
        } catch (err) {
            setError(err.message || 'حدث خطأ أثناء تسجيل الدخول');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setPhone('');
        setPassword('');
        setError('');
        setShowPassword(false);
        closeAuthModal();
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.88)',
            backdropFilter: 'blur(10px)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
        }}>
            <div className="glass-panel" style={{
                width: '100%',
                maxWidth: '420px',
                padding: '44px 40px',
                position: 'relative',
                animation: 'authModalIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
                borderRadius: '24px',
            }}>
                {/* Close Button */}
                <button
                    id="close-auth-modal-btn"
                    onClick={handleClose}
                    style={{
                        position: 'absolute',
                        top: '18px',
                        left: '18px',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'var(--text-main)',
                        cursor: 'pointer',
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                    }}
                >
                    <X size={18} />
                </button>

                {/* Logo / Icon */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    marginBottom: '32px',
                    gap: '12px',
                }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '18px',
                        background: 'linear-gradient(135deg, var(--primary) 0%, #b8860b 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 12px 32px rgba(212,175,55,0.35)',
                    }}>
                        <LogIn size={30} color="#000" strokeWidth={2.5} />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <h2 style={{
                            fontSize: '1.6rem',
                            fontWeight: '900',
                            color: '#fff',
                            margin: 0,
                            letterSpacing: '-0.5px',
                        }}>تسجيل الدخول</h2>
                        <p style={{
                            color: 'rgba(255,255,255,0.45)',
                            fontSize: '0.88rem',
                            marginTop: '6px',
                        }}>أدخل رقم هاتفك وكلمة المرور</p>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        color: '#f87171',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        marginBottom: '20px',
                        textAlign: 'center',
                        fontSize: '0.9rem',
                        lineHeight: '1.5',
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Phone Field */}
                    <div className="auth-input-group">
                        <Phone size={18} color="var(--primary)" />
                        <input
                            id="auth-phone-input"
                            type="tel"
                            inputMode="numeric"
                            placeholder="رقم الهاتف"
                            value={phone}
                            onChange={handlePhoneChange}
                            maxLength={15}
                            required
                            autoFocus
                            dir="ltr"
                            style={{ textAlign: 'right' }}
                        />
                    </div>

                    {/* Password Field */}
                    <div className="auth-input-group">
                        <Lock size={18} color="var(--primary)" />
                        <input
                            id="auth-password-input"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="كلمة المرور"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(p => !p)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'rgba(255,255,255,0.4)',
                                cursor: 'pointer',
                                padding: '0',
                                display: 'flex',
                                alignItems: 'center',
                                flexShrink: 0,
                            }}
                        >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>

                    {/* Submit Button */}
                    <button
                        id="auth-login-submit-btn"
                        type="submit"
                        disabled={isSubmitting}
                        style={{
                            width: '100%',
                            padding: '14px',
                            marginTop: '4px',
                            borderRadius: '14px',
                            border: 'none',
                            background: isSubmitting
                                ? 'rgba(212,175,55,0.4)'
                                : 'linear-gradient(135deg, var(--primary) 0%, #b8860b 100%)',
                            color: '#000',
                            fontWeight: '900',
                            fontSize: '1rem',
                            cursor: isSubmitting ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            transition: 'all 0.3s',
                            boxShadow: isSubmitting ? 'none' : '0 8px 24px rgba(212,175,55,0.3)',
                            fontFamily: 'var(--font-main)',
                        }}
                    >
                        {isSubmitting ? (
                            <>
                                <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span>
                                جاري الدخول...
                            </>
                        ) : (
                            <>
                                <LogIn size={18} />
                                دخول
                            </>
                        )}
                    </button>
                </form>

                {/* Info note */}
                <p style={{
                    textAlign: 'center',
                    marginTop: '24px',
                    color: 'rgba(255,255,255,0.25)',
                    fontSize: '0.78rem',
                    lineHeight: '1.6',
                }}>
                    لا تمتلك حساباً؟ تواصل مع الإدارة لإنشاء حساب جديد.
                </p>
            </div>

            <style>{`
                @keyframes authModalIn {
                    from { transform: translateY(-24px) scale(0.97); opacity: 0; }
                    to { transform: translateY(0) scale(1); opacity: 1; }
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .auth-input-group {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    background: rgba(255,255,255,0.04);
                    padding: 14px 16px;
                    border-radius: 14px;
                    border: 1px solid rgba(255,255,255,0.08);
                    transition: all 0.25s ease;
                }
                .auth-input-group:focus-within {
                    border-color: var(--primary);
                    background: rgba(212,175,55,0.06);
                    box-shadow: 0 0 0 3px rgba(212,175,55,0.08);
                }
                .auth-input-group input {
                    background: transparent;
                    border: none;
                    color: #fff;
                    width: 100%;
                    outline: none;
                    font-size: 1rem;
                    font-family: var(--font-main);
                }
                .auth-input-group input::placeholder {
                    color: rgba(255,255,255,0.3);
                }
            `}</style>
        </div>
    );
}
