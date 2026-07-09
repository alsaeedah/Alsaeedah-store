import React, { useState } from 'react';
import { X, ShoppingBag, Heart, Trash2, ArrowRight, Sparkles } from 'lucide-react';
import { useFavorites } from '../context/FavoritesContext';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ProductOptionsModal from './ProductOptionsModal';

export default function FavoritesModal() {
    const { favorites, isFavoritesOpen, setIsFavoritesOpen, toggleFavorite } = useFavorites();
    const { addToCart } = useCart();
    const navigate = useNavigate();

    // Customization Modal State
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);

    const handleOpenOptions = (product) => {
        setSelectedProduct(product);
        setIsOptionsModalOpen(true);
    };


    // Drawer variants
    const drawerVariants = {
        hidden: { x: '100%', transition: { type: 'spring', damping: 25, stiffness: 200 } },
        visible: { x: 0, transition: { type: 'spring', damping: 25, stiffness: 200 } }
    };

    const overlayVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1 }
    };

    const itemVariants = {
        hidden: { opacity: 0, x: 20 },
        visible: (i) => ({
            opacity: 1,
            x: 0,
            transition: { delay: i * 0.1, duration: 0.3 }
        })
    };

    return (
        <>
            <AnimatePresence>
                {isFavoritesOpen && (
                    <>
                        {/* Backdrop Overlay */}
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            variants={overlayVariants}
                            onClick={() => setIsFavoritesOpen(false)}
                            style={{
                                position: 'fixed',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                background: 'rgba(0, 0, 0, 0.6)',
                                backdropFilter: 'blur(10px)',
                                zIndex: 2000,
                                cursor: 'pointer'
                            }}
                        />

                        {/* Modern Drawer Container */}
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            variants={drawerVariants}
                            style={{
                                position: 'fixed',
                                top: 0,
                                right: 0,
                                width: '100%',
                                maxWidth: '450px',
                                height: '100%',
                                background: 'var(--bg-main)',
                                zIndex: 2001,
                                boxShadow: '-10px 0 40px rgba(0,0,0,0.5)',
                                display: 'flex',
                                flexDirection: 'column',
                                borderLeft: '1px solid var(--border-color)',
                                overflow: 'hidden'
                            }}
                        >
                            {/* Header Section */}
                            <div style={{
                                padding: '30px',
                                borderBottom: '1px solid var(--border-color)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                background: 'rgba(255,255,255,0.02)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ 
                                        width: '45px', 
                                        height: '45px', 
                                        background: 'rgba(212,175,55,0.1)', 
                                        borderRadius: '12px', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center' 
                                    }}>
                                        <Heart size={24} color="var(--primary)" fill="var(--primary)" />
                                    </div>
                                    <div>
                                        <h2 style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--text-main)', margin: 0 }}>المفضلات</h2>
                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>{favorites.length} منتجات محفوظة</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsFavoritesOpen(false)}
                                    style={{
                                        background: 'var(--bg-card)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '50%',
                                        width: '40px',
                                        height: '40px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'var(--text-main)',
                                        cursor: 'pointer',
                                        transition: '0.2s'
                                    }}
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* List Content Section */}
                            <div style={{
                                flex: 1,
                                overflowY: 'auto',
                                padding: '20px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '16px'
                            }} className="hide-scrollbar">
                                {favorites.length === 0 ? (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        style={{
                                            height: '100%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            textAlign: 'center',
                                            gap: '20px',
                                            padding: '0 40px'
                                        }}
                                    >
                                        <div style={{ position: 'relative' }}>
                                            <div style={{ position: 'absolute', top: -10, right: -10 }}>
                                                <Sparkles size={24} color="var(--primary)" />
                                            </div>
                                            <Heart size={80} color="var(--border-color)" strokeWidth={1} />
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '10px' }}>قائمة مفضلاتك فارغة</h3>
                                            <p style={{ color: 'var(--text-dim)', fontSize: '1rem', lineHeight: '1.6' }}>
                                                لم تقم بإضافة أي منتجات بعد. ابحث عن الساعة التي تحبها وأضفها إلى قائمتك!
                                            </p>
                                        </div>
                                        <button 
                                            onClick={() => { setIsFavoritesOpen(false); navigate('/'); }}
                                            className="btn-primary" 
                                            style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}
                                        >
                                            ابدأ التسوق <ArrowRight size={18} style={{ transform: 'rotate(180deg)' }} />
                                        </button>
                                    </motion.div>
                                ) : (
                                    <AnimatePresence mode="popLayout">
                                        {favorites.map((product, index) => (
                                            <motion.div
                                                key={product.id}
                                                custom={index}
                                                variants={itemVariants}
                                                initial="hidden"
                                                animate="visible"
                                                exit={{ opacity: 0, x: 50, transition: { duration: 0.2 } }}
                                                layout
                                                className="glass-panel"
                                                style={{
                                                    padding: '12px',
                                                    display: 'flex',
                                                    gap: '16px',
                                                    alignItems: 'center',
                                                    border: '1px solid var(--border-color)',
                                                    borderRadius: '16px',
                                                    background: 'rgba(255,255,255,0.02)',
                                                    transition: 'border-color 0.3s'
                                                }}
                                            >
                                                <div 
                                                    onClick={() => { navigate(`/product/${product.id}`); setIsFavoritesOpen(false); }}
                                                    style={{ 
                                                        width: '90px', 
                                                        height: '90px', 
                                                        borderRadius: '12px', 
                                                        overflow: 'hidden', 
                                                        cursor: 'pointer', 
                                                        flexShrink: 0,
                                                        background: '#000'
                                                    }}
                                                >
                                                    <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                </div>

                                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    <h4 
                                                        onClick={() => { navigate(`/product/${product.id}`); setIsFavoritesOpen(false); }}
                                                        style={{ 
                                                            color: 'var(--text-main)', 
                                                            margin: 0, 
                                                            fontSize: '1rem', 
                                                            fontWeight: '800',
                                                            cursor: 'pointer',
                                                            display: '-webkit-box',
                                                            WebkitLineClamp: 2,
                                                            WebkitBoxOrient: 'vertical',
                                                            overflow: 'hidden'
                                                        }}
                                                    >
                                                        {product.name}
                                                    </h4>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <span style={{ color: 'var(--primary)', fontWeight: '950', fontSize: '1.2rem' }}>
                                                            {(Number(product.price) || 0).toLocaleString()}
                                                        </span>
                                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: '700' }}>ر.س</span>
                                                    </div>
                                                </div>

                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                    <button
                                                        onClick={() => handleOpenOptions(product)}
                                                        style={{
                                                            background: 'var(--primary)',
                                                            border: 'none',
                                                            borderRadius: '10px',
                                                            width: '38px',
                                                            height: '38px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            cursor: 'pointer',
                                                            color: '#000',
                                                            boxShadow: '0 4px 12px rgba(212,175,55,0.2)',
                                                            transition: 'background 0.2s'
                                                        }}
                                                        title="إضافة للسلة (تخصيص)"
                                                    >
                                                        <ShoppingBag size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => toggleFavorite(product)}
                                                        style={{
                                                            background: 'rgba(239, 68, 68, 0.1)',
                                                            border: '1px solid rgba(239, 68, 68, 0.2)',
                                                            borderRadius: '10px',
                                                            width: '38px',
                                                            height: '38px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            cursor: 'pointer',
                                                            color: '#ef4444',
                                                            transition: '0.3s'
                                                        }}
                                                        className="delete-btn"
                                                        title="حذف من المفضلات"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
                
                <style>{`
                    .hide-scrollbar::-webkit-scrollbar { display: none; }
                    .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                    
                    .delete-btn:hover {
                        background: #ef4444 !important;
                        color: #fff !important;
                    }

                    @keyframes spin {
                        from { transform: rotate(0deg); }
                        to   { transform: rotate(360deg); }
                    }
                `}</style>
            </AnimatePresence>

            <ProductOptionsModal 
                isOpen={isOptionsModalOpen}
                onClose={() => setIsOptionsModalOpen(false)}
                product={selectedProduct}
                onConfirm={(options) => {
                    addToCart(selectedProduct, options);
                    setIsOptionsModalOpen(false);
                    // Do not close favorites drawer yet so they can continue managing it
                }}
            />
        </>
    );
}


