import { useState, forwardRef, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Image as ImageIcon, PlayCircle, Heart, Info } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import { useVideo } from '../context/VideoContext';
import { useNavigate } from 'react-router-dom';
import ProductOptionsModal from './ProductOptionsModal';

const ProductCard = forwardRef(({ product }, ref) => {
    const { addToCart } = useCart();
    const { toggleFavorite, isFavorite } = useFavorites();
    const navigate = useNavigate();
    const isFav = isFavorite(product.id);
    
    const [mediaMode, setMediaMode] = useState(
        (product.video && product.imageUrl?.includes('placehold.co')) ? 'video' : 'image'
    );
    const { activeVideoId, setActiveVideoId, isVideoPlaying, setIsVideoPlaying, isVideoFullscreen, setIsVideoFullscreen } = useVideo();
    const videoRef = useRef(null);
    const [showModal, setShowModal] = useState(false);

    // Sync media mode with global video context
    useEffect(() => {
        if (activeVideoId !== product.id && mediaMode === 'video') {
            setMediaMode('image');
        }
        
        // If global state says no video is playing, but we are in video mode, switch back
        if (!isVideoPlaying && activeVideoId === product.id && mediaMode === 'video') {
            setMediaMode('image');
        }
    }, [activeVideoId, product.id, mediaMode, isVideoPlaying]);

    // Fullscreen handling
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleFullscreenChange = () => {
            const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
            if (activeVideoId === product.id) {
                setIsVideoFullscreen(isFs);
            }
        };

        // Standard and iOS specific events
        video.addEventListener('webkitbeginfullscreen', () => activeVideoId === product.id && setIsVideoFullscreen(true));
        video.addEventListener('webkitendfullscreen', () => activeVideoId === product.id && setIsVideoFullscreen(false));
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

        return () => {
            video.removeEventListener('webkitbeginfullscreen', () => {});
            video.removeEventListener('webkitendfullscreen', () => {});
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
        };
    }, [activeVideoId, product.id]);

    // React to global fullscreen exit (from BackButtonHandler)
    useEffect(() => {
        if (!isVideoFullscreen && activeVideoId === product.id) {
            if (document.fullscreenElement || document.webkitFullscreenElement) {
                if (document.exitFullscreen) document.exitFullscreen();
                else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
            }
        }
    }, [isVideoFullscreen, activeVideoId, product.id]);

    const handleInquiry = (e) => {
        e.stopPropagation();
        navigate(`/product/${product.id}`);
    };

    const handleAddToCart = (e) => {
        e.stopPropagation();
        setShowModal(true);
    };

    const renderMediaContent = () => {
        if (mediaMode === 'image') {
            return (
                <motion.img
                    key="image"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    src={product.imageUrl || product.image}
                    alt={product.name}
                    loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
            );
        }
        return (
            <motion.div
                key="video"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ width: '100%', height: '100%' }}
            >
                <video
                    ref={videoRef}
                    src={product.video}
                    muted
                    loop
                    autoPlay
                    controls
                    playsInline
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
            </motion.div>
        );
    };

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="product-card"
        >
            {/* Media Section */}
            <div className="product-card-media">
                <AnimatePresence mode="wait">
                    {renderMediaContent()}
                </AnimatePresence>

                {/* Overlays */}
                {product.old_price && Number(product.old_price) > Number(product.price) && (
                    <div className="discount-badge">
                        -{Math.round(((Number(product.old_price) - Number(product.price)) / Number(product.old_price)) * 100)}%
                    </div>
                )}

                <motion.button
                    whileTap={{ scale: 0.8 }}
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(product); }}
                    className="wishlist-btn"
                    style={{ color: isFav ? 'var(--primary)' : '#fff' }}
                >
                    <Heart size={20} fill={isFav ? "currentColor" : "none"} />
                </motion.button>

                {/* Media Toggles (Always Visible) */}
                {product.video && (
                    <div className="media-toggle-bar" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => {
                                setMediaMode('image');
                                if (activeVideoId === product.id) setIsVideoPlaying(false);
                            }}
                            className={`media-toggle-btn ${mediaMode === 'image' ? 'active' : ''}`}
                        >
                            <ImageIcon size={14} /> صورة
                        </button>
                        <button
                            onClick={() => {
                                setMediaMode('video');
                                setActiveVideoId(product.id);
                                setIsVideoPlaying(true);
                            }}
                            className={`media-toggle-btn ${mediaMode === 'video' ? 'active' : ''}`}
                        >
                            <PlayCircle size={14} /> فيديو
                        </button>
                    </div>
                )}
                
                {/* Gradient Overlay */}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.4))', pointerEvents: 'none' }} />
            </div>

            {/* Content Section */}
            <div className="product-card-body">
                <div className="product-ref">REF: {product.displayId || '---'}</div>
                <h3 className="product-name">{product.name}</h3>
                
                <div className="price-section">
                    <span className="current-price">{Number(product.price).toLocaleString()} <small style={{ fontSize: '0.9rem' }}>ر.س</small></span>
                    {product.old_price && Number(product.old_price) > Number(product.price) && (
                        <span className="old-price">{Number(product.old_price).toLocaleString()} ر.س</span>
                    )}
                </div>

                {/* Action Area */}
                <div className="product-card-actions">
                    <button className="btn-add-cart" onClick={handleAddToCart}>
                        <ShoppingCart size={18} /> اضف للسلة
                    </button>
                    <button className="btn-inquiry" onClick={handleInquiry}>
                        تفاصيل المنتج
                    </button>
                </div>
            </div>

            <ProductOptionsModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                product={product}
                onConfirm={(options) => addToCart(product, options)}
            />
        </motion.div>
    );
});

export default ProductCard;
