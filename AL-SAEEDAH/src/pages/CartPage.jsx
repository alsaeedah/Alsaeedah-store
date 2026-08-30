import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useLoader } from '../context/LoaderContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, ShoppingBag, Minus, Plus, ArrowRight, AlertTriangle, PackageOpen } from 'lucide-react';
import ClearCartConfirmModal from '../components/ClearCartConfirmModal';
import CheckoutSuccessModal from '../components/CheckoutSuccessModal';
import PaymentMethodsModal from '../components/PaymentMethodsModal';
import ValidationChangesModal from '../components/ValidationChangesModal';
import { validateCartForCheckout } from '../services/cartValidationService';

export default function CartPage() {
    const { cart, removeFromCart, updateQuantity, total, prepareWhatsAppCheckout, clearCart } = useCart();
    const { currentUser, openAuthModal, openProfilePage } = useAuth();
    const { showLoader, hideLoader } = useLoader();
    const navigate = useNavigate();

    const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [showProfileWarning, setShowProfileWarning] = useState(false);
    const [validationChanges, setValidationChanges] = useState(null);
    const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);
    const [isValidating, setIsValidating] = useState(false);

    const handleClearCart = () => { clearCart(); setIsClearConfirmOpen(false); };

    const handleCheckoutClick = async () => {
        if (!currentUser) { openAuthModal(); return; }
        if (cart.length === 0) return;
        if (!currentUser.whatsapp || !currentUser.governorate || !currentUser.district) {
            setShowProfileWarning(true);
            return;
        }
        setShowProfileWarning(false);
        
        if (isValidating) return;

        setIsValidating(true);
        showLoader('جاري التحقق من المنتجات...');
        
        try {
            const result = await validateCartForCheckout(cart);
            
            if (result.networkError) {
                alert('تعذر التحقق من السلة. يرجى التأكد من اتصالك بالإنترنت والمحاولة مرة أخرى.');
                return;
            }

            if (result.valid) {
                navigate('/checkout');
            } else {
                setValidationChanges(result.changes);
                setIsValidationModalOpen(true);
            }
        } finally {
            hideLoader();
            setIsValidating(false);
        }
    };

    const handleConfirmCheckout = async (paymentMethod) => {
        setIsPaymentModalOpen(false);
        showLoader('جاري تأكيد الطلب وإتمام العملية...');
        const result = await prepareWhatsAppCheckout(paymentMethod);
        if (result && result.success) {
            setIsSuccessModalOpen(true);
            clearCart();
        }
        hideLoader();
    };

    return (
        <>
            <ClearCartConfirmModal isOpen={isClearConfirmOpen} onClose={() => setIsClearConfirmOpen(false)} onConfirm={handleClearCart} />
            <PaymentMethodsModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} onConfirm={handleConfirmCheckout} />
            <CheckoutSuccessModal isOpen={isSuccessModalOpen} onClose={() => setIsSuccessModalOpen(false)} onProceed={() => { setIsSuccessModalOpen(false); navigate('/'); }} />
            <ValidationChangesModal isOpen={isValidationModalOpen} onClose={() => setIsValidationModalOpen(false)} changes={validationChanges || []} />

            <div style={{ minHeight: '100dvh', background: 'var(--bg-main)', padding: '40px 20px 80px' }}>
                <div style={{ maxWidth: '900px', margin: '0 auto' }}>

                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <button
                                onClick={() => navigate('/')}
                                style={{ background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '50%', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-main)', flexShrink: 0 }}
                            >
                                <ArrowRight size={20} />
                            </button>
                            <div>
                                <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--primary)', marginBottom: '4px', fontWeight: 500 }}>ALSAEEDAH</p>
                                <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 700, color: 'var(--text-main)', margin: 0, lineHeight: 1.1 }}>سلة المشتريات</h1>
                            </div>
                        </div>
                        {cart.length > 0 && (
                            <button
                                onClick={() => setIsClearConfirmOpen(true)}
                                style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '8px 16px', color: '#ef4444', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '0.85rem', fontWeight: 500 }}
                            >
                                <Trash2 size={15} />
                                حذف الكل
                            </button>
                        )}
                    </div>

                    {/* Empty State */}
                    {cart.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{ textAlign: 'center', padding: '80px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}
                        >
                            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--bg-card)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <PackageOpen size={36} color="var(--primary)" strokeWidth={1.5} />
                            </div>
                            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', color: 'var(--text-main)', fontWeight: 600 }}>السلة فارغة</h2>
                            <p style={{ fontFamily: 'var(--font-main)', color: 'var(--text-dim)', maxWidth: '300px', lineHeight: 1.8 }}>لم تضف أي منتجات بعد. تصفح مجموعتنا من الساعات الفاخرة.</p>
                            <button
                                onClick={() => navigate('/')}
                                className="btn-primary"
                                style={{ marginTop: '8px' }}
                            >
                                <ShoppingBag size={18} />
                                تسوق الآن
                            </button>
                        </motion.div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>

                            {/* Items List */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <AnimatePresence>
                                    {cart.map((item, i) => (
                                        <motion.div
                                            key={item.variantId || item.id}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
                                            transition={{ delay: i * 0.05, duration: 0.25 }}
                                            style={{
                                                background: 'var(--bg-card)',
                                                border: '1px solid var(--border-color)',
                                                borderRadius: '16px',
                                                padding: '20px',
                                                display: 'flex',
                                                gap: '20px',
                                                alignItems: 'center'
                                            }}
                                        >
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                style={{ width: '90px', height: '90px', borderRadius: '12px', objectFit: 'cover', flexShrink: 0 }}
                                            />
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '6px' }}>
                                                    <h3 style={{ fontFamily: 'var(--font-main)', fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0, lineHeight: 1.3 }}>{item.name}</h3>
                                                    {item.displayId && (
                                                        <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.7rem', background: 'var(--primary)', color: '#000', padding: '2px 8px', borderRadius: '6px', fontWeight: 700, flexShrink: 0 }}>#{item.displayId}</span>
                                                    )}
                                                </div>
                                                <p style={{ fontFamily: 'var(--font-body)', color: 'var(--primary)', fontWeight: 600, fontSize: '1.1rem', marginBottom: '14px' }}>
                                                    {item.price.toLocaleString()} ر.س
                                                </p>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    {/* Quantity Stepper */}
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0', background: 'var(--bg-main)', borderRadius: '10px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                                                        <button onClick={() => updateQuantity(item.variantId || item.id, -1)} style={{ background: 'transparent', border: 'none', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-main)' }}>
                                                            <Minus size={14} />
                                                        </button>
                                                        <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '1rem', minWidth: '32px', textAlign: 'center', color: 'var(--text-main)' }}>{item.dp_qty}</span>
                                                        <button onClick={() => updateQuantity(item.variantId || item.id, 1)} style={{ background: 'transparent', border: 'none', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-main)' }}>
                                                            <Plus size={14} />
                                                        </button>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                        <span style={{ fontFamily: 'var(--font-body)', color: 'var(--text-dim)', fontSize: '0.9rem' }}>
                                                            الإجمالي: <strong style={{ color: 'var(--text-main)' }}>{(item.price * item.dp_qty).toLocaleString()} ر.س</strong>
                                                        </span>
                                                        <button onClick={() => removeFromCart(item.variantId || item.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', padding: '4px' }}>
                                                            <Trash2 size={17} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>

                            {/* Order Summary */}
                            <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '28px' }}
                            >
                                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
                                    ملخص الطلب
                                </h2>

                                {/* Items summary */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                                    {cart.map(item => (
                                        <div key={item.variantId || item.id} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-main)', fontSize: '0.9rem', color: 'var(--text-dim)' }}>
                                            <span>{item.name} × {item.dp_qty}</span>
                                            <span>{(item.price * item.dp_qty).toLocaleString()} ر.س</span>
                                        </div>
                                    ))}
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid var(--border-color)', marginBottom: '24px' }}>
                                    <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-main)' }}>الإجمالي الكلي</span>
                                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>{total.toLocaleString()} ر.س</span>
                                </div>

                                {/* Profile warning */}
                                <AnimatePresence>
                                    {showProfileWarning && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            style={{ overflow: 'hidden', marginBottom: '16px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.35)', borderRadius: '12px', padding: '14px 16px' }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                                <AlertTriangle size={16} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
                                                <div>
                                                    <p style={{ color: '#f59e0b', fontFamily: 'var(--font-main)', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>يجب استكمال الملف الشخصي</p>
                                                    <p style={{ color: 'rgba(245,158,11,0.8)', fontFamily: 'var(--font-main)', fontSize: '0.8rem', marginBottom: '10px' }}>يجب إدخال رقم الواتساب وعنوان التوصيل قبل إتمام الطلب.</p>
                                                    <button onClick={openProfilePage} style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)', color: '#f59e0b', padding: '6px 14px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-main)' }}>
                                                        استكمال الملف الشخصي
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <button
                                    className="btn-primary"
                                    onClick={handleCheckoutClick}
                                    style={{ width: '100%', justifyContent: 'center', fontSize: '1rem', padding: '15px', borderRadius: '14px', gap: '10px' }}
                                >
                                    <ShoppingBag size={20} />
                                    إتمام الطلب
                                </button>

                                <button
                                    onClick={() => navigate('/')}
                                    style={{ width: '100%', marginTop: '12px', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '13px', color: 'var(--text-dim)', cursor: 'pointer', fontFamily: 'var(--font-main)', fontSize: '0.9rem', transition: 'all 0.2s' }}
                                >
                                    متابعة التسوق
                                </button>
                            </motion.div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
