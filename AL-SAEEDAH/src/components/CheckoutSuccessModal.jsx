import { CheckCircle, MessageCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CheckoutSuccessModal({ isOpen, onClose, onProceed }) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'rgba(0,0,0,0.9)',
                    backdropFilter: 'blur(10px)',
                    zIndex: 3010,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px'
                }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 30 }}
                        className="glass-panel"
                        style={{
                            width: '100%',
                            maxWidth: '400px',
                            padding: '40px 30px',
                            textAlign: 'center',
                            border: '1px solid rgba(212, 175, 55, 0.3)',
                            boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
                            position: 'relative'
                        }}
                    >
                        <button
                            onClick={onClose}
                            style={{
                                position: 'absolute',
                                top: '15px',
                                right: '15px',
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-dim)',
                                cursor: 'pointer'
                            }}
                        >
                            <X size={24} />
                        </button>

                        <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            background: 'rgba(212, 175, 55, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 25px',
                            border: '2px solid var(--primary)',
                            color: 'var(--primary)'
                        }}>
                            <CheckCircle size={40} />
                        </div>

                        <h2 style={{ color: 'var(--primary)', marginBottom: '15px', fontSize: '1.6rem', fontWeight: 'bold' }}>تم إرسال طلبك!</h2>

                        <p style={{ color: 'var(--text-dim)', marginBottom: '30px', lineHeight: '1.6', fontSize: '1rem' }}>
                            سيتم معالجة طلبك قريباً. شكراً لتسوقك معنا!
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <button
                                onClick={onClose}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid var(--glass-border)',
                                    color: 'var(--text-main)',
                                    borderRadius: '12px',
                                    cursor: 'pointer',
                                    fontSize: '1rem',
                                    fontWeight: '500',
                                    fontFamily: 'cairo',
                                    transition: 'all 0.3s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                            >
                                إغلاق
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
