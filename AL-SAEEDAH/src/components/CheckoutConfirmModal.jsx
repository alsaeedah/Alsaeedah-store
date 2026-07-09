import { HelpCircle } from 'lucide-react';

export default function CheckoutConfirmModal({ isOpen, onClose, onConfirm }) {
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
            zIndex: 1100,
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
                border: '1px solid rgba(212, 175, 55, 0.3)',
                boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
            }}>
                <div style={{
                    width: '70px',
                    height: '70px',
                    borderRadius: '50%',
                    background: 'rgba(212, 175, 55, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                    border: '1px solid var(--primary)'
                }}>
                    <HelpCircle size={32} color="var(--primary)" />
                </div>

                <h2 style={{ color: 'var(--text-main)', marginBottom: '10px', fontSize: '1.4rem' }}>تأكيد الطلب؟</h2>
                <p style={{ color: 'var(--text-dim)', marginBottom: '30px', lineHeight: '1.6' }}>
                    هل أنت متأكد من رغبتك في إتمام الطلب وتحميل الفاتورة؟
                </p>

                <div  style={{ display: 'flex', gap: '15px', justifyContent: 'center',alignItems: 'center' }}>
                    <button
                    className='btn-primary cancel-btn'
                        onClick={onClose}
                        style={{
                            padding: '10px 25px',
                            background: '#ff4b4b',
                            border: 'none',
                            color: 'white',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            fontFamily:'cairo',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            flex:1,
                        }}
                    >
                        إلغاء
                    </button>
                    <button
                        onClick={onConfirm}
                        className="btn-primary"
                        style={{
                            padding: '10px 25px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            fontWeight: 'bold',
                            flex: 1,
                            justifyContent: 'center'
                        }}
                    >
                        تأكيد الطلب
                    </button>
                </div>
            </div>
        </div>
    );
}
