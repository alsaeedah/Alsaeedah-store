import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function ValidationChangesModal({ isOpen, onClose, changes }) {
    const { reconcileCart } = useCart();

    if (!isOpen) return null;

    const handleAcceptAndContinue = () => {
        reconcileCart(changes);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                    padding: '20px'
                }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ duration: 0.2 }}
                        style={{
                            background: 'var(--bg-main)',
                            borderRadius: '24px',
                            width: '100%',
                            maxWidth: '480px',
                            padding: '32px',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                            border: '1px solid var(--border-color)',
                            maxHeight: '90vh',
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                            <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '10px', borderRadius: '50%' }}>
                                <AlertTriangle size={24} color="#f59e0b" />
                            </div>
                            <h2 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '1.4rem', color: 'var(--text-main)' }}>
                                تحديثات في السلة
                            </h2>
                        </div>
                        
                        <p style={{ fontFamily: 'var(--font-main)', color: 'var(--text-dim)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '24px' }}>
                            عذراً، بعض المنتجات في سلتك قد تغيرت حالتها أو أسعارها. يرجى مراجعة التغييرات التالية:
                        </p>

                        <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px', paddingRight: '8px' }}>
                            {changes.map((change, idx) => {
                                const isDeleted = change.type === 'PRODUCT_DELETED' || change.type === 'VARIANT_DELETED';
                                const isPriceChanged = change.type === 'PRICE_CHANGED' || change.type === 'VARIANT_PRICE_CHANGED';
                                const isDataChanged = change.type === 'PRODUCT_DATA_CHANGED' || change.type === 'VARIANT_DATA_CHANGED';

                                return (
                                    <div key={idx} style={{ 
                                        background: 'var(--bg-card)', 
                                        border: '1px solid var(--border-color)', 
                                        borderRadius: '16px', 
                                        padding: '16px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '8px'
                                    }}>
                                        <h4 style={{ margin: 0, fontFamily: 'var(--font-main)', fontSize: '1rem', color: 'var(--text-main)' }}>
                                            {change.name}
                                        </h4>
                                        
                                        {isDeleted && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444' }}>
                                                <Trash2 size={16} />
                                                <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem' }}>
                                                    هذا المنتج لم يعد متوفراً وسيتم حذفه من السلة.
                                                </span>
                                            </div>
                                        )}
                                        
                                        {isPriceChanged && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(245,158,11,0.05)', padding: '10px 14px', borderRadius: '10px' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--text-dim)' }}>السعر السابق</span>
                                                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.95rem', color: 'var(--text-main)', textDecoration: 'line-through' }}>{change.previousPrice?.toLocaleString()} ر.س</span>
                                                </div>
                                                <ArrowRight size={16} color="var(--text-dim)" style={{ transform: 'rotate(180deg)' }} />
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: '#f59e0b', fontWeight: 600 }}>السعر الحالي</span>
                                                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '1.1rem', color: '#f59e0b', fontWeight: 700 }}>{change.currentPrice?.toLocaleString()} ر.س</span>
                                                </div>
                                            </div>
                                        )}

                                        {isDataChanged && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-dim)' }}>
                                                <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem' }}>
                                                    تم تحديث تفاصيل هذا المنتج (الاسم أو الصورة).
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <div style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
                            <button
                                onClick={handleAcceptAndContinue}
                                className="btn-primary"
                                style={{ flex: 1, padding: '14px', fontSize: '1rem', justifyContent: 'center' }}
                            >
                                تحديث السلة ومتابعة
                            </button>
                            <button
                                onClick={onClose}
                                style={{
                                    flex: 1,
                                    padding: '14px',
                                    fontSize: '1rem',
                                    background: 'transparent',
                                    border: '1px solid var(--border-color)',
                                    color: 'var(--text-main)',
                                    borderRadius: '12px',
                                    cursor: 'pointer',
                                    fontFamily: 'var(--font-main)'
                                }}
                            >
                                إلغاء
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
