import { AlertTriangle } from 'lucide-react';

export default function ClearCartConfirmModal({ isOpen, onClose, onConfirm }) {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(5px)',
            zIndex: 3000, // Higher than sidebar (2001)
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'fadeIn 0.2s ease-out'
        }}>
            <div className="glass-panel" style={{
                width: '90%',
                maxWidth: '400px',
                padding: '30px',
                textAlign: 'center',
                border: '1px solid rgba(255, 75, 75, 0.3)',
                boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
            }}>
                <div style={{
                    width: '70px',
                    height: '70px',
                    borderRadius: '50%',
                    background: 'rgba(255, 75, 75, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                    border: '1px solid #ff4b4b'
                }}>
                    <AlertTriangle size={32} color="#ff4b4b" />
                </div>

                <h2 style={{ color: 'var(--text-main)', marginBottom: '10px', fontSize: '1.4rem' }}>تفريغ السلة؟</h2>
                <p style={{ color: 'var(--text-dim)', marginBottom: '30px', lineHeight: '1.6' }}>
                    هل أنت متأكد من رغبتك في حذف جميع المنتجات من السلة؟ لا يمكن التراجع عن هذا الإجراء.
                </p>

                <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '10px 25px',
                            background: 'transparent',
                            border: '1px solid var(--text-dim)',
                            color: 'var(--text-main)',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            flex: 1,
                            fontFamily:'cairo',
                        }}
                    >
                        إلغاء
                    </button>
                    <button
                        onClick={onConfirm}
                        style={{
                            padding: '10px 25px',
                            background: '#ff4b4b',
                            border: 'none',
                            color: 'white',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            fontWeight: 'bold',
                            flex: 1,
                            fontFamily:'cairo',
                            boxShadow: '0 4px 15px rgba(255, 75, 75, 0.3)'
                        }}
                    >
                        حذف الكل
                    </button>
                </div>
            </div>
        </div>
    );
}
