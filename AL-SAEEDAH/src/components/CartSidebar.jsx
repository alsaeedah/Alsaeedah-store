import { Trash2, ShoppingBag, X, AlertTriangle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useLoader } from '../context/LoaderContext';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ClearCartConfirmModal from './ClearCartConfirmModal';
import CheckoutSuccessModal from './CheckoutSuccessModal';
import PaymentMethodsModal from './PaymentMethodsModal';
import { useAuth } from '../context/AuthContext';

export default function CartSidebar() {
    const { cart, removeFromCart, updateQuantity, total, prepareWhatsAppCheckout, isCartOpen, closeCart, clearCart } = useCart();
    const { currentUser, openAuthModal, openProfileModal } = useAuth();
    const { showLoader, hideLoader } = useLoader();
    const sidebarRef = useRef(null);
    const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [whatsappUrl, setWhatsappUrl] = useState('');
    const [showProfileWarning, setShowProfileWarning] = useState(false);
    
    // Order State
    const [orderStatus, setOrderStatus] = useState('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const requestRef = useRef(crypto.randomUUID());

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
                closeCart();
            }
        };
        if (isCartOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isCartOpen, closeCart]);

    const handleClearCart = () => {
        clearCart();
        setIsClearConfirmOpen(false);
    };

    const handleCheckoutClick = () => {
        if (!currentUser) {
            openAuthModal();
            return;
        }
        if (cart.length === 0) return;

        // Check if address is complete
        if (!currentUser.whatsapp || !currentUser.governorate || !currentUser.district) {
            setShowProfileWarning(true);
            return;
        }
        setShowProfileWarning(false);
        setIsPaymentModalOpen(true);
    };

    const handleConfirmCheckout = async (paymentMethod) => {
        setIsPaymentModalOpen(false); // Close payment modal first
        
        if (orderStatus === 'creating_order' || orderStatus === 'order_created' || orderStatus === 'clearing_cart') return;
        
        setOrderStatus('creating_order');
        setErrorMessage('');
        showLoader('جاري إرسال الطلب...');

        try {
            const result = await prepareWhatsAppCheckout(paymentMethod, requestRef.current);

            if (result && result.success) {
                setOrderStatus('order_created');
                setWhatsappUrl(result.url || '');
                setIsSuccessModalOpen(true);
                
                setOrderStatus('clearing_cart');
                try {
                    clearCart();
                } catch(e) {
                    console.error("Failed to clear cart, continuing...", e);
                }
                
                setOrderStatus('completed');
                hideLoader();
                requestRef.current = crypto.randomUUID();
            } else {
                setOrderStatus('failed');
                hideLoader();
                setErrorMessage(result?.message || 'فشل في إرسال الطلب. يرجى المحاولة مرة أخرى.');
            }
        } catch (error) {
            console.error("Unexpected checkout error:", error);
            setOrderStatus('failed');
            hideLoader();
            setErrorMessage('حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.');
        }
    };

    const handleProceedToWhatsApp = () => {
        setIsSuccessModalOpen(false);
        closeCart();
    };

    return (
        <>
            <ClearCartConfirmModal
                isOpen={isClearConfirmOpen}
                onClose={() => setIsClearConfirmOpen(false)}
                onConfirm={handleClearCart}
            />

            <PaymentMethodsModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                onConfirm={handleConfirmCheckout}
            />

            <CheckoutSuccessModal
                isOpen={isSuccessModalOpen}
                onClose={() => setIsSuccessModalOpen(false)}
                onProceed={handleProceedToWhatsApp}
            />

            {/* Overlay */}
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'var(--overlay-dim)',
                zIndex: 2000,
                opacity: isCartOpen ? 1 : 0,
                pointerEvents: isCartOpen ? 'auto' : 'none',
                transition: 'opacity 0.4s ease',
                backdropFilter: 'blur(8px)'
            }} />

            <div ref={sidebarRef} style={{
                position: 'fixed',
                top: 0,
                right: 0,
                width: 'min(340px, 94vw)',
                height: '100dvh',
                background: 'var(--bg-card)',
                zIndex: 2001,
                boxShadow: isCartOpen ? '-12px 0 48px rgba(0,0,0,0.55)' : 'none',
                transform: isCartOpen ? 'translateX(0)' : 'translateX(100%)',
                transition: 'transform 0.32s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'grid',
                gridTemplateRows: 'auto 1fr auto',
                borderLeft: '1px solid rgba(255,255,255,0.05)',
                borderRadius: '0 0 0 16px',
                overflow: 'hidden'
            }}>
                {/* ─── Header ─────────────────────────── */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '14px 16px',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    background: 'rgba(0,0,0,0.2)'
                }}>
                    <h2 style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        color: 'var(--primary)',
                        fontSize: '1rem', fontWeight: 700,
                        fontFamily: 'var(--font-main)', margin: 0
                    }}>
                        <ShoppingBag size={20} /> سلة المشتريات
                    </h2>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {cart.length > 0 && (
                            <button
                                onClick={() => setIsClearConfirmOpen(true)}
                                style={{
                                    background: 'rgba(255, 75, 75, 0.08)',
                                    border: '1px solid rgba(255, 75, 75, 0.25)',
                                    cursor: 'pointer',
                                    color: '#ff4b4b',
                                    borderRadius: '8px',
                                    width: '34px', height: '34px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'all 0.18s ease'
                                }}
                                title="حذف الكل"
                            >
                                <Trash2 size={17} />
                            </button>
                        )}
                        <button
                            onClick={closeCart}
                            style={{
                                background: 'var(--skeleton-bg)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '50%',
                                width: '34px', height: '34px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer',
                                color: 'var(--text-dim)',
                                transition: 'all 0.18s ease'
                            }}
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* ─── Items Area ─────────────────────── */}
                <div style={{ overflowY: 'auto', padding: '12px 16px', scrollbarWidth: 'none' }}>
                    {cart.length === 0 ? (
                        <div style={{ textAlign: 'center', marginTop: '60px' }}>
                            <ShoppingBag size={40} style={{ opacity: 0.15, margin: '0 auto 12px' }} />
                            <p style={{ color: 'var(--text-dim)', fontSize: '0.875rem' }}>السلة فارغة حالياً</p>
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item.variantId || item.id} style={{
                                display: 'flex',
                                gap: '10px',
                                marginBottom: '12px',
                                borderBottom: '1px solid var(--glass-border)',
                                paddingBottom: '12px'
                            }}>
                                <img
                                    src={item.image} alt={item.name}
                                    style={{ width: '56px', height: '56px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }}
                                />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px' }}>
                                        <h4 style={{ fontSize: '0.82rem', marginBottom: '3px', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {item.name}
                                        </h4>
                                        <span style={{
                                            fontSize: '0.68rem', background: 'var(--primary)', color: '#000',
                                            padding: '2px 5px', borderRadius: '4px', fontWeight: 700, flexShrink: 0
                                        }}>
                                            #{item.displayId || '---'}
                                        </span>
                                    </div>
                                    <p style={{ color: 'var(--primary)', fontSize: '0.78rem', marginBottom: '6px' }}>
                                        {item.price.toLocaleString()} ر.س
                                    </p>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: '6px',
                                            background: 'var(--skeleton-bg)', borderRadius: '6px', padding: '2px 4px'
                                        }}>
                                            <button
                                                onClick={() => updateQuantity(item.variantId || item.id, -1)}
                                                style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', padding: '3px 9px', fontSize: '1.1rem', cursor: 'pointer' }}
                                            >-</button>
                                            <span style={{ fontSize: '0.95rem', fontWeight: 700, minWidth: '18px', textAlign: 'center' }}>
                                                {item.dp_qty}
                                            </span>
                                            <button
                                                onClick={() => updateQuantity(item.variantId || item.id, 1)}
                                                style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', padding: '3px 9px', fontSize: '1.1rem', cursor: 'pointer' }}
                                            >+</button>
                                        </div>
                                        <button
                                            onClick={() => removeFromCart(item.variantId || item.id)}
                                            style={{ color: '#ff4444', background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }}
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {cart.length > 0 && (
                    <div style={{
                        borderTop: '1px solid rgba(255,255,255,0.06)',
                        padding: '14px 16px',
                        paddingBottom: 'max(14px, env(safe-area-inset-bottom, 0px))',
                        background: 'rgba(0,0,0,0.15)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>الإجمالي</span>
                            <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '1.05rem' }}>
                                {total.toLocaleString()} ر.س
                            </span>
                        </div>

                        {/* Profile incomplete warning */}
                        <AnimatePresence>
                            {showProfileWarning && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    style={{
                                        overflow: 'hidden',
                                        marginBottom: '12px',
                                        background: 'rgba(245, 158, 11, 0.08)',
                                        border: '1px solid rgba(245, 158, 11, 0.35)',
                                        borderRadius: '12px',
                                        padding: '12px 14px',
                                        textAlign: 'right'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                        <AlertTriangle size={16} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
                                        <div>
                                            <p style={{ color: '#f59e0b', fontSize: '0.8rem', fontWeight: '700', marginBottom: '4px' }}>يجب استكمال الملف الشخصي</p>
                                            <p style={{ color: 'rgba(245,158,11,0.75)', fontSize: '0.75rem', marginBottom: '8px' }}>يجب إدخال رقم الواتساب وعنوان التوصيل قبل إتمام الطلب.</p>
                                            <button
                                                onClick={() => { openProfileModal(); closeCart(); }}
                                                style={{
                                                    background: 'rgba(245,158,11,0.15)',
                                                    border: '1px solid rgba(245,158,11,0.4)',
                                                    color: '#f59e0b',
                                                    padding: '6px 14px',
                                                    borderRadius: '8px',
                                                    fontSize: '0.78rem',
                                                    fontWeight: '700',
                                                    cursor: 'pointer',
                                                    fontFamily: "'Cairo', sans-serif"
                                                }}
                                            >
                                                استكمال الملف الشخصي
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Error Message */}
                        <AnimatePresence>
                            {orderStatus === 'failed' && errorMessage && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    style={{
                                        overflow: 'hidden',
                                        marginBottom: '12px',
                                        background: 'rgba(239, 68, 68, 0.08)',
                                        border: '1px solid rgba(239, 68, 68, 0.35)',
                                        borderRadius: '12px',
                                        padding: '12px 14px',
                                        textAlign: 'right'
                                    }}
                                >
                                    <p style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: '700', marginBottom: '4px' }}>حدث خطأ</p>
                                    <p style={{ color: 'var(--text-main)', fontSize: '0.75rem' }}>{errorMessage}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <button
                            className="btn-primary"
                            onClick={handleCheckoutClick}
                            disabled={['creating_order', 'order_created', 'clearing_cart'].includes(orderStatus)}
                            style={{ 
                                width: '100%', 
                                justifyContent: 'center',
                                fontSize: '0.9rem',
                                padding: '11px 20px',
                                opacity: ['creating_order', 'order_created', 'clearing_cart'].includes(orderStatus) ? 0.6 : 1,
                                cursor: ['creating_order', 'order_created', 'clearing_cart'].includes(orderStatus) ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {['creating_order', 'order_created', 'clearing_cart'].includes(orderStatus) ? 'جاري الإرسال...' : 'إتمام الطلب'}
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}
