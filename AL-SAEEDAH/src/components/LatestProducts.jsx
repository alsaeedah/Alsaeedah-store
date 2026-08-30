import { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { fetchLatestProducts, subscribeToProducts } from '../services/productService';
import { useNavigate } from 'react-router-dom';
import MinimalProductCard from './MinimalProductCard';

const FeaturedProduct = ({ product }) => {
    const navigate = useNavigate();
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    
    // Check if device supports touch to disable 3D hover on mobile
    const isTouch = typeof window !== 'undefined' && (('ontouchstart' in window) || (navigator.maxTouchPoints > 0));
    
    const handleMouseMove = (e) => {
        if (isTouch) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const xPct = (mouseX / width - 0.5) * 2; // -1 to 1
        const yPct = (mouseY / height - 0.5) * 2; // -1 to 1
        x.set(xPct);
        y.set(yPct);
    };
    
    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    // Subtle 3-5 degrees tilt
    const rotateX = useTransform(y, [-1, 1], [4, -4]);
    const rotateY = useTransform(x, [-1, 1], [-4, 4]);

    return (
        <motion.div 
            className="featured-layout"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ 
                rotateX: isTouch ? 0 : rotateX, 
                rotateY: isTouch ? 0 : rotateY, 
                transformPerspective: 1000 
            }}
            initial={{ opacity: 0, y: 40, filter: 'blur(10px)' }}
            whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8, ease: [0.25, 0.8, 0.25, 1] }}
        >
            <div className="featured-media">
                <img 
                    src={product.imageUrl || product.image} 
                    alt={product.name} 
                    loading="lazy" 
                    decoding="async" 
                />
            </div>
            <div className="featured-info">
                <motion.span 
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 }}
                    style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.9rem' }}
                >
                    ✨ الإصدار الأحدث
                </motion.span>
                <h3 className="featured-title">{product.name}</h3>
                <span className="featured-price">{Number(product.price).toLocaleString()} <small>ر.س</small></span>
                <button 
                    className="btn-primary" 
                    style={{ alignSelf: 'flex-start', marginTop: '10px' }}
                    onClick={() => navigate(`/product/${product.id}`)}
                >
                    تسوق الآن
                </button>
            </div>
        </motion.div>
    );
};

const SkeletonLoader = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
        <div className="featured-layout skeleton-shimmer" style={{ height: '400px' }}></div>
        <div className="collection-grid-carousel">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="carousel-item skeleton-shimmer" style={{ height: '380px', borderRadius: '20px' }}></div>
            ))}
        </div>
    </div>
);

const LatestProducts = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showSkeleton, setShowSkeleton] = useState(false);

    useEffect(() => {
        let isMounted = true;
        const timer = setTimeout(() => {
            if (isMounted && loading) setShowSkeleton(true);
        }, 150);

        import('../services/productService').then(({ fetchLatestProducts }) => {
            fetchLatestProducts().then((data) => {
                if (isMounted) {
                    setProducts(data || []);
                    setLoading(false);
                    setShowSkeleton(false);
                }
            }).catch(() => {
                if (isMounted) {
                    setLoading(false);
                    setShowSkeleton(false);
                }
            });
        });

        return () => {
            isMounted = false;
            clearTimeout(timer);
        };
    }, []);

    if (!loading && products.length === 0) return null;

    const featuredProduct = products.length > 0 ? products[0] : null;
    const carouselProducts = products.length > 1 ? products.slice(1) : [];

    return (
        <section className="immersive-section">
            <div className="immersive-content container">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20, filter: 'blur(5px)' }}
                    whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{ duration: 0.6 }}
                    style={{ textAlign: 'center', marginBottom: '50px' }}
                >
                    <h2 style={{
                        fontSize: typeof window !== 'undefined' && window.innerWidth < 480 ? '2rem' : '2.8rem',
                        color: 'var(--text-main)',
                        marginBottom: '10px',
                        fontFamily: 'var(--font-heading)'
                    }}>
                        <span style={{ color: 'var(--primary)' }}>أحدث</span> الساعات
                    </h2>
                    <p style={{ color: 'var(--text-dim)', fontSize: '1.2rem' }}>
                        اكتشف آخر ما وصل من أناقة وفن في عالم الساعات
                    </p>
                </motion.div>

                {loading && showSkeleton ? (
                    <SkeletonLoader />
                ) : !loading ? (
                    <>
                        {/* Featured Product */}
                        {featuredProduct && (
                            <FeaturedProduct product={featuredProduct} />
                        )}

                        {/* Remaining Products Carousel */}
                        {carouselProducts.length > 0 && (
                            <motion.div 
                                className="collection-grid-carousel"
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true, amount: 0.1 }}
                                variants={{
                                    visible: {
                                        transition: { staggerChildren: 0.1 }
                                    }
                                }}
                                style={{ marginTop: '40px' }}
                            >
                                {carouselProducts.map((product) => (
                                    <motion.div 
                                        key={product.id} 
                                        className="carousel-item"
                                        variants={{
                                            hidden: { opacity: 0, x: 50 },
                                            visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" } }
                                        }}
                                    >
                                        <MinimalProductCard product={product} />
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </>
                ) : null}
            </div>
        </section>
    );
};

export default LatestProducts;
