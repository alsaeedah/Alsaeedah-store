import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useLoader } from '../context/LoaderContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, CheckCircle2, ArrowRight, CreditCard, Banknote, ChevronLeft, Package } from 'lucide-react';
import logo from '../assets/logo.png';

const STEPS = [
    { id: 1, label: 'مراجعة السلة', icon: <ShoppingBag size={18} /> },
    { id: 2, label: 'بيانات التوصيل', icon: <ChevronLeft size={18} /> },
    { id: 3, label: 'طريقة الدفع', icon: <CreditCard size={18} /> },
    { id: 4, label: 'تم الطلب', icon: <CheckCircle2 size={18} /> },
];

const PAYMENT_METHODS = [
    { id: 'cash', label: 'الدفع عند الاستلام', icon: <Banknote size={24} />, description: 'ادفع نقداً عند وصول الطلب' },
    { id: 'transfer', label: 'تحويل بنكي', icon: <CreditCard size={24} />, description: 'تحويل عبر البنك أو المحفظة الإلكترونية' },
];

export default function CheckoutPage() {
    const { cart, total, prepareWhatsAppCheckout, clearCart } = useCart();
    const { currentUser } = useAuth();
    const { showLoader, hideLoader } = useLoader();
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [selectedPayment, setSelectedPayment] = useState('');
    const [orderNumber, setOrderNumber] = useState('');

    const handleProceedFromCart = () => {
        if (cart.length === 0) return;
        setStep(2);
    };

    const handleProceedFromDelivery = () => {
        setStep(3);
    };

    const handleConfirmOrder = async () => {
        if (!selectedPayment) return;
        showLoader('جاري تأكيد الطلب...');
        const result = await prepareWhatsAppCheckout(selectedPayment);
        hideLoader();
        if (result && result.success) {
            setOrderNumber(result.invoiceId || '');
            clearCart();
            setStep(4);
        }
    };

    return (
        <div style={{ minHeight: '100dvh', background: 'var(--bg-main)', display: 'flex', flexDirection: 'column' }}>

            {/* Isolated Header */}
            <header style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-card)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img src={logo} alt="متجر السعيدة" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                    <div>
                        <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)', margin: 0 }}>
                            <span style={{ color: 'var(--primary)' }}>متجر</span> السعيدة
                        </p>
                        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.7rem', color: 'var(--text-dim)', margin: 0, letterSpacing: '1px' }}>SECURE CHECKOUT</p>
                    </div>
                </div>
                {step < 4 && (
                    <button
                        onClick={() => step === 1 ? navigate('/cart') : setStep(s => s - 1)}
                        style={{ background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '8px 16px', color: 'var(--text-dim)', cursor: 'pointer', fontFamily: 'var(--font-main)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                        <ArrowRight size={16} /> رجوع
                    </button>
                )}
            </header>

            {/* Progress Bar */}
            <div style={{ padding: '24px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
                    {/* Background line */}
                    <div style={{ position: 'absolute', top: '20px', right: 0, left: 0, height: '2px', background: 'var(--border-color)', zIndex: 0 }} />
                    {/* Progress fill */}
                    <div style={{ position: 'absolute', top: '20px', right: 0, height: '2px', background: 'var(--primary)', zIndex: 1, width: `${((step - 1) / (STEPS.length - 1)) * 100}%`, transition: 'width 0.5s ease', transformOrigin: 'right' }} />

                    {STEPS.map(s => (
                        <div key={s.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: 2 }}>
                            <motion.div
                                animate={{
                                    background: step >= s.id ? 'var(--primary)' : 'var(--bg-main)',
                                    border: step >= s.id ? '2px solid var(--primary)' : '2px solid var(--border-color)',
                                    color: step >= s.id ? '#000' : 'var(--text-dim)',
                                }}
                                transition={{ duration: 0.3 }}
                                style={{ width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                {step > s.id ? <CheckCircle2 size={18} color="#000" /> : s.icon}
                            </motion.div>
                            <span style={{ fontFamily: 'var(--font-main)', fontSize: '0.7rem', color: step >= s.id ? 'var(--primary)' : 'var(--text-dim)', fontWeight: step === s.id ? 700 : 400, whiteSpace: 'nowrap' }}>
                                {s.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div style={{ flex: 1, padding: '32px 20px', overflowY: 'auto' }}>
                <div style={{ maxWidth: '680px', margin: '0 auto' }}>
                    <AnimatePresence mode="wait">

                        {/* Step 1: Cart Review */}
                        {step === 1 && (
                            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '24px' }}>مراجعة السلة</h2>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                                    {cart.map(item => (
                                        <div key={item.variantId || item.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '16px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                                            <img src={item.image} alt={item.name} style={{ width: '72px', height: '72px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }} />
                                            <div style={{ flex: 1 }}>
                                                <p style={{ fontFamily: 'var(--font-main)', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 4px' }}>{item.name}</p>
                                                <p style={{ fontFamily: 'var(--font-body)', color: 'var(--text-dim)', fontSize: '0.85rem', margin: 0 }}>الكمية: {item.dp_qty}</p>
                                            </div>
                                            <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, color: 'var(--primary)', fontSize: '1rem', flexShrink: 0 }}>
                                                {(item.price * item.dp_qty).toLocaleString()} ر.س
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                    <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)' }}>الإجمالي</span>
                                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--primary)' }}>{total.toLocaleString()} ر.س</span>
                                </div>

                                <button onClick={handleProceedFromCart} className="btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: '1rem', padding: '15px', borderRadius: '14px' }}>
                                    المتابعة إلى بيانات التوصيل
                                </button>
                            </motion.div>
                        )}

                        {/* Step 2: Delivery Info */}
                        {step === 2 && (
                            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '24px' }}>بيانات التوصيل</h2>

                                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
                                    {[
                                        { label: 'الاسم الكامل', value: currentUser?.name },
                                        { label: 'رقم الواتساب', value: currentUser?.whatsapp },
                                        { label: 'المحافظة', value: currentUser?.governorate },
                                        { label: 'المديرية', value: currentUser?.district },
                                        { label: 'الحي / المنطقة', value: currentUser?.neighborhood },
                                    ].map(({ label, value }) => (
                                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border-color)', fontFamily: 'var(--font-main)', fontSize: '0.9rem' }}>
                                            <span style={{ color: 'var(--text-dim)' }}>{label}</span>
                                            <span style={{ color: value ? 'var(--text-main)' : '#ef4444', fontWeight: 600 }}>{value || 'غير محدد'}</span>
                                        </div>
                                    ))}
                                </div>

                                <div style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '12px', padding: '14px 18px', marginBottom: '24px', fontFamily: 'var(--font-main)', fontSize: '0.85rem', color: 'var(--text-dim)', lineHeight: 1.7 }}>
                                    للتعديل على بيانات التوصيل، يرجى الذهاب إلى الملف الشخصي.
                                </div>

                                <button onClick={handleProceedFromDelivery} className="btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: '1rem', padding: '15px', borderRadius: '14px' }}>
                                    المتابعة إلى الدفع
                                </button>
                            </motion.div>
                        )}

                        {/* Step 3: Payment */}
                        {step === 3 && (
                            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '24px' }}>طريقة الدفع</h2>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                                    {PAYMENT_METHODS.map(method => (
                                        <button
                                            key={method.id}
                                            onClick={() => setSelectedPayment(method.id)}
                                            style={{
                                                background: selectedPayment === method.id ? 'rgba(212,175,55,0.1)' : 'var(--bg-card)',
                                                border: `2px solid ${selectedPayment === method.id ? 'var(--primary)' : 'var(--border-color)'}`,
                                                borderRadius: '14px', padding: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px',
                                                textAlign: 'right', transition: 'all 0.2s', width: '100%'
                                            }}
                                        >
                                            <span style={{ color: selectedPayment === method.id ? 'var(--primary)' : 'var(--text-dim)', flexShrink: 0 }}>{method.icon}</span>
                                            <div style={{ flex: 1 }}>
                                                <p style={{ fontFamily: 'var(--font-main)', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 4px', fontSize: '1rem' }}>{method.label}</p>
                                                <p style={{ fontFamily: 'var(--font-main)', color: 'var(--text-dim)', margin: 0, fontSize: '0.82rem' }}>{method.description}</p>
                                            </div>
                                            <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: `2px solid ${selectedPayment === method.id ? 'var(--primary)' : 'var(--border-color)'}`, background: selectedPayment === method.id ? 'var(--primary)' : 'transparent', flexShrink: 0, transition: 'all 0.2s' }} />
                                        </button>
                                    ))}
                                </div>

                                {/* Order Summary Mini */}
                                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '20px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontFamily: 'var(--font-main)', color: 'var(--text-dim)', fontSize: '0.9rem' }}>{cart.length} منتج</span>
                                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--primary)' }}>{total.toLocaleString()} ر.س</span>
                                </div>

                                <button
                                    onClick={handleConfirmOrder}
                                    disabled={!selectedPayment}
                                    className="btn-primary"
                                    style={{ width: '100%', justifyContent: 'center', fontSize: '1rem', padding: '15px', borderRadius: '14px', opacity: !selectedPayment ? 0.5 : 1, cursor: !selectedPayment ? 'not-allowed' : 'pointer' }}
                                >
                                    تأكيد الطلب
                                </button>
                            </motion.div>
                        )}

                        {/* Step 4: Success */}
                        {step === 4 && (
                            <motion.div key="step4" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
                                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                                        style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(34,197,94,0.1)', border: '2px solid rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px' }}
                                    >
                                        <CheckCircle2 size={52} color="#22c55e" strokeWidth={1.5} />
                                    </motion.div>

                                    <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '12px', lineHeight: 1.1 }}>
                                        تم تأكيد طلبك!
                                    </h2>
                                    {orderNumber && (
                                        <p style={{ fontFamily: 'var(--font-body)', color: 'var(--primary)', fontSize: '1rem', fontWeight: 600, marginBottom: '8px', letterSpacing: '1px' }}>
                                            رقم الطلب: #{orderNumber}
                                        </p>
                                    )}
                                    <p style={{ fontFamily: 'var(--font-main)', color: 'var(--text-dim)', maxWidth: '360px', margin: '0 auto 36px', lineHeight: 1.8, fontSize: '0.95rem' }}>
                                        تم استلام طلبك بنجاح. سيتواصل معك فريقنا قريباً للتأكيد وترتيب التوصيل.
                                    </p>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '300px', margin: '0 auto' }}>
                                        <button onClick={() => navigate('/profile?tab=orders')} className="btn-primary" style={{ justifyContent: 'center', padding: '14px' }}>
                                            <Package size={18} /> عرض طلباتي
                                        </button>
                                        <button onClick={() => navigate('/')} style={{ background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '14px', color: 'var(--text-dim)', cursor: 'pointer', fontFamily: 'var(--font-main)', fontSize: '0.9rem' }}>
                                            العودة إلى المتجر
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
