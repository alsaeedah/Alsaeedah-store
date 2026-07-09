import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../supabase/client';
import { logAuthEvent, AUTH_EVENTS } from '../services/authLogger';

/**
 * ResetPasswordPage
 * 
 * Handles the password reset redirect from Supabase.
 * When a user clicks the reset link in their email, Supabase redirects them
 * to /reset-password with the session tokens in the URL hash fragment.
 * This page extracts those tokens, establishes the session, and lets the
 * user set a new password.
 * 
 * Route: /reset-password
 */
export default function ResetPasswordPage() {
    const navigate = useNavigate();

    const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'success' | 'error'
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [userId, setUserId] = useState(null);

    // ── On mount: parse Supabase tokens from URL hash and establish session ──
    useEffect(() => {
        const handlePasswordReset = async () => {
            const hash = window.location.hash.substring(1);
            const params = new URLSearchParams(hash);

            const accessToken  = params.get('access_token');
            const refreshToken = params.get('refresh_token');
            const type         = params.get('type'); // 'recovery' for password reset

            // Validate this is a password-reset link
            if (!accessToken || type !== 'recovery') {
                setStatus('error');
                setError('رابط إعادة تعيين كلمة المرور غير صالح أو منتهي الصلاحية. يرجى طلب رابط جديد.');
                return;
            }

            // Set the session so the user is authenticated enough to change password
            const { data, error: sessionError } = await supabase.auth.setSession({
                access_token:  accessToken,
                refresh_token: refreshToken,
            });

            if (sessionError || !data?.user) {
                setStatus('error');
                setError('انتهت صلاحية الرابط. يرجى طلب رابط جديد من صفحة تسجيل الدخول.');
                return;
            }

            setUserId(data.user.id);
            setStatus('ready');
        };

        handlePasswordReset();
    }, []);

    // ── Submit new password ──────────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Client-side validation
        if (password.length < 8) {
            setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
            return;
        }
        if (password !== confirmPassword) {
            setError('كلمة المرور وتأكيدها غير متطابقتين');
            return;
        }

        setIsSubmitting(true);
        try {
            const { error: updateError } = await supabase.auth.updateUser({ password });
            if (updateError) throw updateError;

            // Log the successful reset
            await logAuthEvent(userId, AUTH_EVENTS.PASSWORD_RESET_COMPLETE, 'email', {});

            setStatus('success');

            // Redirect to home after 3 seconds
            setTimeout(() => navigate('/'), 3000);

        } catch (err) {
            console.error('[ResetPassword] Error:', err);
            await logAuthEvent(userId, AUTH_EVENTS.AUTH_ERROR, 'email', {
                error: err.message,
                action: 'password_reset_complete'
            });
            setError(err.message || 'حدث خطأ أثناء تحديث كلمة المرور. يرجى المحاولة مرة أخرى.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // Render helpers
    // ─────────────────────────────────────────────────────────────────────────

    const containerStyle = {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        background: 'var(--bg-main, #0a0a0a)',
        direction: 'rtl',
    };

    const cardStyle = {
        width: '100%',
        maxWidth: '460px',
        padding: '40px',
        borderRadius: '20px',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 25px 50px rgba(0,0,0,0.4)',
        animation: 'rpSlideIn 0.4s ease-out',
    };

    const titleStyle = {
        textAlign: 'center',
        marginBottom: '30px',
        fontSize: '1.8rem',
        color: 'var(--primary, #d4af37)',
        fontFamily: 'var(--font-main, Cairo, sans-serif)',
        fontWeight: '700',
    };

    const inputGroupStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        background: 'rgba(255,255,255,0.05)',
        padding: '12px 15px',
        borderRadius: '10px',
        border: '1px solid rgba(255,255,255,0.1)',
        transition: 'border-color 0.3s ease, background 0.3s ease',
        marginBottom: '15px',
    };

    const inputStyle = {
        background: 'transparent',
        border: 'none',
        color: 'var(--text-main, #ffffff)',
        width: '100%',
        outline: 'none',
        fontFamily: 'var(--font-main, Cairo, sans-serif)',
        fontSize: '1rem',
    };

    const errorBoxStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'rgba(255, 107, 107, 0.1)',
        color: '#ff6b6b',
        padding: '12px',
        borderRadius: '8px',
        marginBottom: '20px',
        fontSize: '0.9rem',
        textAlign: 'center',
    };

    const successStyle = {
        textAlign: 'center',
    };

    // ── Loading state ──
    if (status === 'loading') {
        return (
            <div style={containerStyle}>
                <div style={cardStyle}>
                    <h2 style={titleStyle}>جاري التحقق من الرابط...</h2>
                    <div style={{ textAlign: 'center', color: 'var(--text-dim, #888)', fontSize: '0.95rem' }}>
                        يرجى الانتظار لحظة...
                    </div>
                </div>
                <style>{styles}</style>
            </div>
        );
    }

    // ── Error state (invalid/expired link) ──
    if (status === 'error') {
        return (
            <div style={containerStyle}>
                <div style={cardStyle}>
                    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                        <AlertCircle size={48} color="#ff6b6b" />
                    </div>
                    <h2 style={{ ...titleStyle, color: '#ff6b6b' }}>رابط غير صالح</h2>
                    <p style={{ textAlign: 'center', color: 'var(--text-dim, #888)', marginBottom: '30px', fontSize: '0.95rem', lineHeight: '1.6' }}>
                        {error}
                    </p>
                    <button
                        onClick={() => navigate('/')}
                        className="btn-primary"
                        style={{ width: '100%' }}
                    >
                        العودة إلى الصفحة الرئيسية
                    </button>
                </div>
                <style>{styles}</style>
            </div>
        );
    }

    // ── Success state ──
    if (status === 'success') {
        return (
            <div style={containerStyle}>
                <div style={cardStyle}>
                    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                        <CheckCircle size={56} color="var(--primary, #d4af37)" />
                    </div>
                    <h2 style={titleStyle}>تم تحديث كلمة المرور!</h2>
                    <div style={successStyle}>
                        <p style={{ color: 'var(--text-dim, #888)', marginBottom: '20px', fontSize: '0.95rem', lineHeight: '1.7' }}>
                            تم تعيين كلمة مرورك الجديدة بنجاح. سيتم توجيهك إلى الصفحة الرئيسية خلال ثوانٍ...
                        </p>
                        <button
                            onClick={() => navigate('/')}
                            className="btn-primary"
                            style={{ width: '100%' }}
                        >
                            الانتقال إلى الصفحة الرئيسية الآن
                        </button>
                    </div>
                </div>
                <style>{styles}</style>
            </div>
        );
    }

    // ── Ready state: show the new password form ──
    return (
        <div style={containerStyle}>
            <div style={cardStyle}>
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <Lock size={40} color="var(--primary, #d4af37)" />
                </div>

                <h2 style={titleStyle}>تعيين كلمة مرور جديدة</h2>
                <p style={{ textAlign: 'center', color: 'var(--text-dim, #888)', marginBottom: '25px', fontSize: '0.9rem' }}>
                    أدخل كلمة مرورك الجديدة. يجب أن تكون 8 أحرف على الأقل.
                </p>

                {error && (
                    <div style={errorBoxStyle}>
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {/* New password */}
                    <div
                        style={inputGroupStyle}
                        onFocus={(e) => {
                            e.currentTarget.style.borderColor = 'var(--primary, #d4af37)';
                            e.currentTarget.style.background = 'rgba(212,175,55,0.05)';
                        }}
                        onBlur={(e) => {
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                            e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                        }}
                    >
                        <Lock size={18} color="var(--primary, #d4af37)" />
                        <input
                            id="rp-new-password"
                            type="password"
                            placeholder="كلمة المرور الجديدة"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={8}
                            style={inputStyle}
                        />
                    </div>

                    {/* Confirm new password */}
                    <div
                        style={inputGroupStyle}
                        onFocus={(e) => {
                            e.currentTarget.style.borderColor = 'var(--primary, #d4af37)';
                            e.currentTarget.style.background = 'rgba(212,175,55,0.05)';
                        }}
                        onBlur={(e) => {
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                            e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                        }}
                    >
                        <Lock size={18} color="var(--primary, #d4af37)" />
                        <input
                            id="rp-confirm-password"
                            type="password"
                            placeholder="تأكيد كلمة المرور الجديدة"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength={8}
                            style={inputStyle}
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn-primary"
                        style={{ width: '100%', marginTop: '10px' }}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'جاري الحفظ...' : 'حفظ كلمة المرور الجديدة'}
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate('/')}
                        style={{
                            width: '100%',
                            marginTop: '12px',
                            padding: '10px',
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-dim, #888)',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            fontFamily: 'var(--font-main, Cairo, sans-serif)',
                        }}
                    >
                        إلغاء والعودة إلى الصفحة الرئيسية
                    </button>
                </form>
            </div>

            <style>{styles}</style>
        </div>
    );
}

const styles = `
    @keyframes rpSlideIn {
        from { transform: translateY(-25px); opacity: 0; }
        to   { transform: translateY(0);     opacity: 1; }
    }
`;
