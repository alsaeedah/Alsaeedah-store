import { useState } from 'react';
import { CreditCard, Banknote, Landmark, Smartphone, X, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PaymentMethodsModal({ isOpen, onClose, onConfirm }) {
    const [mainMethod, setMainMethod] = useState(null); // 'bank' or 'cod'
    const [selectedBank, setSelectedBank] = useState(null);

    if (!isOpen) return null;

    const banks = [
        {
            id: 'kuraimi-ye',
            name: 'الكريمي (يمني)',
            icon: <Landmark size={20} />,
            account: '3171354667'
        },
        {
            id: 'kuraimi-sa',
            name: 'الكريمي (سعودي)',
            icon: <Landmark size={20} />,
            account: '3171266447'
        },
        {
            id: 'bkash',
            name: 'محفظة بي كاش',
            icon: <Smartphone size={20} />,
            account: '770822310'
        },
        {
            id: 'bank-busairi',
            name: 'بنك البسيري',
            icon: <Landmark size={20} />,
            account: '60874 - فرع خور المكلا'
        },
        {
            id: 'alamqi',
            name: 'صرافة العمقي',
            icon: <Banknote size={20} />,
            account: '254281825'
        }
    ];

    const handleConfirmSelection = () => {
        if (!mainMethod) return;

        let finalSelection = '';
        if (mainMethod === 'cod') {
            finalSelection = 'الدفع عند الاستلام';
        } else if (mainMethod === 'bank' && selectedBank) {
            const bank = banks.find(b => b.id === selectedBank);
            finalSelection = `تحويل بنكي - ${bank.name}`;
        } else if (mainMethod === 'bank') {
            // If they just selected bank but no specific bank, maybe alert or just general
            finalSelection = 'تحويل بنكي';
        }

        if (finalSelection) {
            onConfirm(finalSelection);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'rgba(0,0,0,0.85)',
                    backdropFilter: 'blur(10px)',
                    zIndex: 3000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px'
                }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="glass-panel"
                        style={{
                            width: '100%',
                            maxWidth: '500px',
                            padding: '30px',
                            border: '1px solid rgba(212, 175, 55, 0.3)',
                            position: 'relative',
                            maxHeight: '90vh',
                            overflowY: 'auto'
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

                        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                            <h2 style={{ color: 'var(--primary)', fontSize: '1.8rem', marginBottom: '10px' }}>اختيار طريقة الدفع</h2>
                            <p style={{ color: 'var(--text-dim)' }}>يرجى اختيار وسيلة الدفع المناسبة لك</p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px' }}>
                            {/* Option 1: Bank Transfer */}
                            <div
                                onClick={() => setMainMethod(mainMethod === 'bank' ? null : 'bank')}
                                style={{
                                    padding: '20px',
                                    background: mainMethod === 'bank' ? 'rgba(212, 175, 55, 0.1)' : 'var(--glass-bg)',
                                    borderRadius: '12px',
                                    border: mainMethod === 'bank' ? '2px solid var(--primary)' : '1px solid var(--glass-border)',
                                    cursor: 'pointer',
                                    transition: '0.3s'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        <Landmark size={28} color={mainMethod === 'bank' ? 'var(--primary)' : 'var(--text-dim)'} />
                                        <h3 style={{ color: 'var(--text-main)', fontSize: '1.2rem' }}>عبر البنوك وشركات الصرافة</h3>
                                    </div>
                                    {mainMethod === 'bank' ? <ChevronUp size={20} color="var(--primary)" /> : <ChevronDown size={20} color="var(--text-dim)" />}
                                </div>

                                <motion.div
                                    initial={false}
                                    animate={{ height: mainMethod === 'bank' ? 'auto' : 0, opacity: mainMethod === 'bank' ? 1 : 0 }}
                                    style={{ overflow: 'hidden' }}
                                >
                                    <div style={{ paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {banks.map((bank) => (
                                            <div
                                                key={bank.id}
                                                onClick={(e) => { e.stopPropagation(); setSelectedBank(bank.id); }}
                                                style={{
                                                    padding: '12px 15px',
                                                    background: selectedBank === bank.id ? 'rgba(212, 175, 55, 0.15)' : 'var(--glass-bg)',
                                                    borderRadius: '8px',
                                                    border: '1px solid',
                                                    borderColor: selectedBank === bank.id ? 'var(--primary)' : 'var(--glass-border)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    transition: '0.2s'
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    {bank.icon}
                                                    <div>
                                                        <p style={{ color: 'var(--text-main)', fontSize: '0.9rem', fontWeight: 'bold' }}>{bank.name}</p>
                                                        <p style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>{bank.account}</p>
                                                    </div>
                                                </div>
                                                {selectedBank === bank.id && <Check size={18} color="var(--primary)" />}
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            </div>

                            {/* Option 2: COD */}
                            <div
                                onClick={() => { setMainMethod('cod'); setSelectedBank(null); }}
                                style={{
                                    padding: '20px',
                                    background: mainMethod === 'cod' ? 'rgba(34, 197, 94, 0.1)' : 'var(--glass-bg)',
                                    borderRadius: '12px',
                                    border: mainMethod === 'cod' ? '2px solid #22c55e' : '1px solid var(--glass-border)',
                                    cursor: 'pointer',
                                    transition: '0.3s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <Banknote size={28} color={mainMethod === 'cod' ? '#22c55e' : 'var(--text-dim)'} />
                                    <div>
                                        <h3 style={{ color: 'var(--text-main)', fontSize: '1.2rem' }}>الدفع عند الاستلام</h3>
                                        <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>متوفر حالياً في مدينة المكلا وضواحيها</p>
                                    </div>
                                </div>
                                {mainMethod === 'cod' && <Check size={20} color="#22c55e" />}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '15px' }}>
                            <button
                                onClick={onClose}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    background: 'transparent',
                                    border: '1px solid var(--border-color)',
                                    color: 'var(--text-main)',
                                    borderRadius: '10px',
                                    cursor: 'pointer',
                                    fontFamily: 'cairo'
                                }}
                            >
                                إلغاء
                            </button>
                            <button
                                onClick={handleConfirmSelection}
                                disabled={!mainMethod || (mainMethod === 'bank' && !selectedBank)}
                                className="btn-primary"
                                style={{
                                    flex: 2,
                                    padding: '12px',
                                    borderRadius: '10px',
                                    justifyContent: 'center',
                                    opacity: (!mainMethod || (mainMethod === 'bank' && !selectedBank)) ? 0.5 : 1,
                                    cursor: (!mainMethod || (mainMethod === 'bank' && !selectedBank)) ? 'not-allowed' : 'pointer',
                                    background: mainMethod === 'cod' ? '#22c55e' : 'var(--primary)'
                                }}
                            >
                                {mainMethod === 'cod' ? 'تأكيد الطلب (الدفع عند الاستلام)' : 'تأكيد الطلب والمتابعة'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
