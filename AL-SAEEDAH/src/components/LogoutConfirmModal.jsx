import { useAuth } from '../context/AuthContext';
import { LogOut, X } from 'lucide-react';

export default function LogoutConfirmModal() {
    const { isLogoutConfirmOpen, closeLogoutConfirm, logout } = useAuth();

    if (!isLogoutConfirmOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 3000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
        }}>
            <div className="glass-panel" style={{
                width: '100%',
                maxWidth: '400px',
                padding: '40px',
                textAlign: 'center',
                animation: 'modalSlideIn 0.3s ease-out'
            }}>
                <div style={{
                    width: '70px',
                    height: '70px',
                    background: 'rgba(255, 75, 75, 0.1)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                    color: '#ff4b4b'
                }}>
                    <LogOut size={35} />
                </div>

                <h2 style={{
                    marginBottom: '15px',
                    fontSize: '1.5rem',
                    color: 'var(--text-main)',
                    fontFamily: 'var(--font-main)'
                }}>
                    تسجيل الخروج
                </h2>

                <p style={{
                    color: 'var(--text-dim)',
                    marginBottom: '30px',
                    lineHeight: '1.6'
                }}>
                    هل أنت متأكد من تسجيل الخروج من حسابك؟
                </p>

                <div style={{ display: 'flex', gap: '15px' }}>
                    <button
                        onClick={closeLogoutConfirm}
                        className="glass-panel"
                        style={{
                            flex: 1,
                            padding: '12px',
                            border: '1px solid var(--glass-border)',
                            background: 'rgba(255,255,255,0.05)',
                            color: 'var(--text-main)',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            fontFamily: 'cairo',
                            fontWeight: 'bold'
                        }}
                    >
                        إلغاء
                    </button>
                    <button
                        onClick={logout}
                        style={{
                            flex: 1,
                            padding: '12px',
                            border: 'none',
                            background: '#ff4b4b',
                            color: 'white',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            fontWeight: 'bold',
                            fontFamily: 'cairo',
                            boxShadow: '0 4px 15px rgba(255, 75, 75, 0.3)'
                        }}
                    >
                        خروج
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes modalSlideIn {
                    from { transform: scale(0.9); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
