import { useState } from 'react';
import { useFavorites } from '../context/FavoritesContext';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ShoppingBag, Trash2, ArrowRight, Sparkles } from 'lucide-react';
import ProductOptionsModal from '../components/ProductOptionsModal';

export default function WishlistPage() {
    const { favorites, toggleFavorite, refreshFavoriteProduct, loading } = useFavorites();
    const { addToCart } = useCart();
    const navigate = useNavigate();

    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isOptionsOpen, setIsOptionsOpen] = useState(false);
    const [addedIds, setAddedIds] = useState(new Set());

    const handleQuickAdd = async (product) => {
        // Refresh product data before opening options modal
        const fresh = await refreshFavoriteProduct(product.id);
        setSelectedProduct(fresh || product);
        setIsOptionsOpen(true);
    };

    const handleAddSuccess = (productId) => {
        setAddedIds(prev => new Set([...prev, productId]));
        setTimeout(() => {
            setAddedIds(prev => {
                const next = new Set(prev);
                next.delete(productId);
                return next;
            });
        }, 2000);
    };

    return (
        <>
            <ProductOptionsModal
                isOpen={isOptionsOpen}
                onClose={() => setIsOptionsOpen(false)}
                product={selectedProduct}
                onAddToCart={(product, options) => {
                    addToCart(product, options);
                    handleAddSuccess(product.id);
                    setIsOptionsOpen(false);
                }}
            />

            <div style={{ minHeight: '100dvh', background: 'var(--bg-main)', padding: '40px 20px 80px' }}>
                <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

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
                                <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 700, color: 'var(--text-main)', margin: 0, lineHeight: 1.1 }}>المفضلة</h1>
                            </div>
                        </div>
                        {favorites.length > 0 && (
                            <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: 'var(--text-dim)', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '6px 14px' }}>
                                {favorites.length} منتج
                            </span>
                        )}
                    </div>

                    {/* Empty State */}
                    {favorites.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{ textAlign: 'center', padding: '80px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}
                        >
                            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--bg-card)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Heart size={36} color="var(--primary)" strokeWidth={1.5} />
                            </div>
                            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', color: 'var(--text-main)', fontWeight: 600 }}>قائمة المفضلة فارغة</h2>
                            <p style={{ fontFamily: 'var(--font-main)', color: 'var(--text-dim)', maxWidth: '300px', lineHeight: 1.8 }}>احفظ المنتجات التي تعجبك للعودة إليها لاحقاً.</p>
                            <button onClick={() => navigate('/')} className="btn-primary" style={{ marginTop: '8px' }}>
                                <Sparkles size={18} />
                                تصفح المنتجات
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                                gap: '24px'
                            }}
                        >
                            <AnimatePresence>
                                {favorites.map((product, i) => (
                                    <motion.div
                                        key={product.id}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ delay: i * 0.05, duration: 0.25 }}
                                        style={{
                                            background: 'var(--bg-card)',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: '20px',
                                            overflow: 'hidden',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            transition: 'transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease',
                                            cursor: 'pointer'
                                        }}
                                        whileHover={{ y: -6, boxShadow: '0 20px 40px rgba(0,0,0,0.25)', borderColor: 'var(--primary)' }}
                                        onClick={() => navigate(`/product/${product.id}`)}
                                    >
                                        {/* Product Image */}
                                        <div style={{ position: 'relative', aspectRatio: '1/1', overflow: 'hidden', background: 'var(--bg-main)' }}>
                                            <img
                                                src={product.imageUrl || product.image}
                                                alt={product.name}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
                                                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                                                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                            />
                                            {/* Remove from favorites */}
                                            <button
                                                onClick={e => { e.stopPropagation(); toggleFavorite(product); }}
                                                style={{
                                                    position: 'absolute', top: '12px', right: '12px',
                                                    width: '36px', height: '36px', borderRadius: '50%',
                                                    background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    cursor: 'pointer', color: '#ff4b4b', transition: 'all 0.2s'
                                                }}
                                                title="إزالة من المفضلة"
                                            >
                                                <Heart size={16} fill="#ff4b4b" />
                                            </button>
                                        </div>

                                        {/* Card Body */}
                                        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                                            <div>
                                                <h3 style={{ fontFamily: 'var(--font-main)', fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                    {product.name}
                                                </h3>
                                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '8px' }}>
                                                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--primary)' }}>
                                                        {product.price?.toLocaleString()} ر.س
                                                    </span>
                                                    {product.old_price && (
                                                        <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: 'var(--text-dim)', textDecoration: 'line-through' }}>
                                                            {product.old_price?.toLocaleString()} ر.س
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <motion.button
                                                onClick={e => { e.stopPropagation(); handleQuickAdd(product); }}
                                                whileTap={{ scale: 0.97 }}
                                                style={{
                                                    width: '100%',
                                                    background: addedIds.has(product.id) ? 'rgba(34,197,94,0.15)' : 'var(--primary)',
                                                    color: addedIds.has(product.id) ? '#22c55e' : '#000',
                                                    border: addedIds.has(product.id) ? '1px solid rgba(34,197,94,0.4)' : 'none',
                                                    borderRadius: '12px',
                                                    padding: '11px',
                                                    fontFamily: 'var(--font-main)',
                                                    fontWeight: 700,
                                                    fontSize: '0.9rem',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '8px',
                                                    transition: 'all 0.3s ease',
                                                    marginTop: 'auto'
                                                }}
                                            >
                                                {addedIds.has(product.id) ? (
                                                    <><span>✓</span> تمت الإضافة</>
                                                ) : (
                                                    <><ShoppingBag size={16} /> إضافة للسلة</>
                                                )}
                                            </motion.button>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </div>
            </div>
        </>
    );
}
