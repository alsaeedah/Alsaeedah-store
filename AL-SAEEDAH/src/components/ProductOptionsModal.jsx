import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, ShoppingCart, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function ProductOptionsModal({ isOpen, onClose, product, onConfirm }) {
    const { setIsOptionsModalOpen } = useCart();
    const [quantity, setQuantity] = useState(1);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const getCurrentPrice = () => {
        if (selectedVariant) return selectedVariant.price;
        return Number(product.price);
    };

    const getSelectedImage = () => {
        if (selectedVariant && selectedVariant.image) return selectedVariant.image;
        return product.imageUrl || product.image;
    };

    const effectiveVariants = useMemo(() => {
        if (!product) return [];
        return (product.variants && product.variants.length > 0)
            ? product.variants
            : (product.images && product.images.length > 1)
                ? product.images.map(img => ({ image: img, price: Number(product.price) }))
                : [];
    }, [product]);

    useEffect(() => {
        const handleRemoteClose = () => {
            if (isOpen) onClose();
        };
        window.addEventListener('close-product-options', handleRemoteClose);
        return () => window.removeEventListener('close-product-options', handleRemoteClose);
    }, [isOpen, onClose]);

    useEffect(() => {
        setIsOptionsModalOpen(isOpen);
        return () => setIsOptionsModalOpen(false);
    }, [isOpen, setIsOptionsModalOpen]);

    useEffect(() => {
        if (isOpen) {
            setQuantity(1);
            setSelectedVariant(null);
            setError('');
            setSuccess('');
            
            // Auto-select first variant if exists
            if (effectiveVariants.length > 0) {
                setSelectedVariant(effectiveVariants[0]);
            }
        }
    }, [isOpen, product, effectiveVariants]);

    const handleConfirm = () => {
        if (effectiveVariants.length > 0 && !selectedVariant) {
            setError('يرجى اختيار شكل الساعة');
            return;
        }

        onConfirm({
            quantity,
            variantPrice: getCurrentPrice(),
            variantImage: getSelectedImage()
        });
        onClose();
    };

    const handleAddAnother = () => {
        if (effectiveVariants.length > 0 && !selectedVariant) {
            setError('يرجى اختيار شكل الساعة');
            return;
        }

        onConfirm({
            quantity,
            variantPrice: getCurrentPrice(),
            variantImage: getSelectedImage()
        });

        // Reset for next item
        setQuantity(1);
        setError('');
        setSuccess('تمت الإضافة بنجاح! يمكنك اختيار شكل آخر الآن.');

        // Hide success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
    };

    if (!isOpen || !product) return null;

    return createPortal(
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="custom-modal-overlay"
            >
                <div className="custom-modal-container">
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '800' }}>تخصيص طلبك</h2>
                            <p style={{ color: 'var(--text-dim)', margin: '5px 0 0' }}>اختر الموديل الذي نال إعجابك</p>
                        </div>
                        <button
                            onClick={onClose}
                            style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid var(--border-color)',
                                color: 'var(--text-main)',
                                cursor: 'pointer',
                                padding: '12px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: '0.3s'
                            }}
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <div className="custom-grid">
                        {/* Left Side: Preview */}
                        <div className="preview-pane">
                            <div className="preview-image-wrapper">
                                <motion.img
                                    key={getSelectedImage()}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    src={getSelectedImage()}
                                    alt={product.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                />
                            </div>
                            <div style={{ marginTop: '24px', textAlign: 'center' }}>
                                <h3 style={{ fontSize: '1.4rem', marginBottom: '8px' }}>{product.name}</h3>
                                <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--primary)' }}>
                                    {getCurrentPrice().toLocaleString()} <span style={{ fontSize: '1rem', fontWeight: '400' }}>ر.س</span>
                                </div>
                            </div>
                        </div>

                        {/* Right Side: Controls */}
                        <div className="controls-pane">
                            <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
                                {/* Variants Gallery */}
                                {effectiveVariants.length > 0 ? (
                                    <div className="option-group">
                                        <label className="option-label">اختر اللون والشكل المفضل</label>
                                        <div style={{ 
                                            display: 'grid', 
                                            gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', 
                                            gap: '12px',
                                            marginTop: '10px'
                                        }}>
                                            {effectiveVariants.map((variant, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => { setSelectedVariant(variant); setError(''); setSuccess(''); }}
                                                    style={{
                                                        position: 'relative',
                                                        padding: 0,
                                                        background: 'none',
                                                        border: selectedVariant === variant ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                                                        borderRadius: '12px',
                                                        overflow: 'hidden',
                                                        cursor: 'pointer',
                                                        aspectRatio: '1',
                                                        transition: '0.2s',
                                                        transform: selectedVariant === variant ? 'scale(1.05)' : 'scale(1)'
                                                    }}
                                                >
                                                    <img src={variant.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    {selectedVariant === variant && (
                                                        <div style={{
                                                            position: 'absolute',
                                                            top: '4px',
                                                            right: '4px',
                                                            background: 'var(--primary)',
                                                            color: '#000',
                                                            borderRadius: '50%',
                                                            width: '18px',
                                                            height: '18px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center'
                                                        }}>
                                                            <Check size={12} strokeWidth={4} />
                                                        </div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="option-group">
                                        <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>هذا المنتج متوفر بمواصفات قياسية فقط.</p>
                                    </div>
                                )}

                                {/* Quantity */}
                                <div className="option-group" style={{ marginBottom: 0 }}>
                                    <label className="option-label">الكمية</label>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '24px',
                                        background: 'rgba(255,255,255,0.03)',
                                        padding: '8px',
                                        borderRadius: '14px',
                                        width: 'fit-content',
                                        border: '1px solid var(--border-color)'
                                    }}>
                                        <button
                                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                            style={{
                                                width: '36px', height: '36px',
                                                borderRadius: '10px',
                                                background: 'var(--bg-card)',
                                                color: 'var(--text-main)',
                                                border: '1px solid var(--border-color)',
                                                cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}
                                        >
                                            <Minus size={16} />
                                        </button>
                                        <span style={{ fontSize: '1.3rem', fontWeight: '700', minWidth: '30px', textAlign: 'center' }}>
                                            {quantity}
                                        </span>
                                        <button
                                            onClick={() => setQuantity(quantity + 1)}
                                            style={{
                                                width: '36px', height: '36px',
                                                borderRadius: '10px',
                                                background: 'var(--bg-card)',
                                                color: 'var(--text-main)',
                                                border: '1px solid var(--border-color)',
                                                cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Messages */}
                            <AnimatePresence>
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        style={{
                                            color: '#ff6b6b', background: 'rgba(255,107,107,0.1)',
                                            padding: '12px', borderRadius: '12px', marginBottom: '16px',
                                            textAlign: 'center', border: '1px solid rgba(255,107,107,0.2)', fontSize: '0.9rem'
                                        }}
                                    >
                                        {error}
                                    </motion.div>
                                )}
                                {success && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        style={{
                                            color: '#4ecb71', background: 'rgba(78, 203, 113, 0.1)',
                                            padding: '12px', borderRadius: '12px', marginBottom: '16px',
                                            textAlign: 'center', border: '1px solid rgba(78, 203, 113, 0.2)', fontSize: '0.9rem'
                                        }}
                                    >
                                        {success}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
                                <button
                                    onClick={handleConfirm}
                                    className="btn-primary"
                                    style={{
                                        width: '100%',
                                        justifyContent: 'center',
                                        padding: '16px',
                                        fontSize: '1.1rem',
                                        borderRadius: '14px',
                                        boxShadow: '0 8px 16px rgba(212, 175, 55, 0.2)'
                                    }}
                                >
                                    <ShoppingCart size={22} />
                                    <span>إضافة وإنهاء - {(getCurrentPrice() * quantity).toLocaleString()} ر.س</span>
                                </button>

                                {effectiveVariants.length > 1 && (
                                    <button
                                        onClick={handleAddAnother}
                                        style={{
                                            width: '100%',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            gap: '10px', padding: '14px', fontSize: '1rem',
                                            background: 'rgba(255,255,255,0.02)',
                                            border: '2px solid var(--primary)',
                                            color: 'var(--primary)',
                                            borderRadius: '14px',
                                            cursor: 'pointer',
                                            fontWeight: '700',
                                            transition: '0.3s'
                                        }}
                                    >
                                        <Plus size={20} />
                                        <span>إضافة واختيار شكل آخر</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>,
        document.body
    );
}
