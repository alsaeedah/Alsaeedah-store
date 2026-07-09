import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import { fetchLatestProducts, subscribeToProducts } from '../services/productService';
import { useNavigate } from 'react-router-dom';

const LatestProducts = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef(null);
    const navigate = useNavigate();
    const [canScrollRight, setCanScrollRight] = useState(false);
    const [canScrollLeft, setCanScrollLeft] = useState(false);

    useEffect(() => {
        loadLatest();
        
        // Realtime Subscription
        const unsubscribe = subscribeToProducts((payload) => {
            loadLatest();
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        checkScroll();
        window.addEventListener('resize', checkScroll);
        return () => window.removeEventListener('resize', checkScroll);
    }, [products]);

    const loadLatest = async () => {
        const data = await fetchLatestProducts();
        setProducts(data);
        setLoading(false);
    };

    const checkScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            // In RTL, scrollLeft is 0 at the right (start) and becomes negative as we scroll left
            // Or in some browsers it's positive. Let's use a safe check.
            const isAtStart = Math.abs(scrollLeft) < 10;
            const isAtEnd = Math.abs(scrollLeft) + clientWidth >= scrollWidth - 10;
            
            setCanScrollRight(!isAtStart);
            setCanScrollLeft(!isAtEnd);
        }
    };

    const scroll = (direction) => {
        const { current } = scrollRef;
        const scrollAmount = 300;
        if (direction === 'left') {
            current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        } else {
            current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    if (!loading && products.length === 0) return null;

    return (
        <section className="latest-products-section" style={{ padding: '60px 0', background: 'rgba(255,255,255,0.01)', position: 'relative', overflow: 'hidden' }}>
            <div className="container" style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 20px' }}>
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    style={{ textAlign: 'center', marginBottom: '50px' }}
                >
                    <h2 style={{
                        fontSize: window.innerWidth < 480 ? '1.7rem' : '2.4rem',
                        color: 'var(--text-main)',
                        marginBottom: '10px'
                    }}>
                        <span style={{ color: 'var(--primary)' }}>أحدث</span> الساعات
                    </h2>
                    <p style={{ color: 'var(--text-dim)', fontSize: '1.2rem' }}>
                        اكتشف آخر ما وصل من أناقة وفن في عالم الساعات
                    </p>
                </motion.div>

                {/* Horizontal Scroll Wrapper with Side Buttons */}
                <div style={{ position: 'relative', padding: '0 10px' }}>
                    {/* Right Button (Back / رجوع) */}
                    <AnimatePresence>
                        {canScrollRight && (
                            <motion.button 
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.5 }}
                                onClick={() => scroll('right')} 
                                className="golden-circle right"
                                style={{ zIndex: 100 }}
                            >
                                <ChevronRight size={24} />
                            </motion.button>
                        )}
                    </AnimatePresence>

                    <div 
                        ref={scrollRef}
                        onScroll={checkScroll}
                        className="no-scrollbar"
                        style={{ 
                            display: 'flex', 
                            gap: '20px', 
                            overflowX: 'auto', 
                            padding: '20px 0',
                            scrollBehavior: 'smooth',
                            WebkitOverflowScrolling: 'touch',
                            minHeight: '200px'
                        }}
                    >
                        {loading && products.length === 0 ? (
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', padding: '100px 0' }}>
                                <div className="loading-dots">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                            </div>
                        ) : products.map((product, idx) => (
                            <motion.div
                                key={product.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                viewport={{ once: true }}
                                className="latest-product-card"
                            >
                                <img 
                                    src={product.imageUrl || product.image} 
                                    alt={product.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: '0.6s' }}
                                    className="product-img"
                                />
                                <div style={{ 
                                    position: 'absolute', 
                                    inset: 0, 
                                    background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, transparent 60%)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'flex-end',
                                    padding: '20px'
                                }}>
                                    <span style={{ color: 'var(--primary)', fontSize: '0.7rem', fontWeight: '900', marginBottom: '5px', display: 'block' }}>#وصل_حديثاً</span>
                                    <h3 className="card-title">{product.name}</h3>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span className="card-price">
                                            {Number(product.price).toLocaleString()} <small style={{ fontSize: '0.75rem', color: '#fff' }}>ر.س</small>
                                        </span>
                                        <motion.div 
                                            whileHover={{ scale: 1.1, background: 'var(--primary)', color: '#000' }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => navigate(`/product/${product.id}`)}
                                            className="card-arrow"
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <ArrowLeft size={18} />
                                        </motion.div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Left Button (Explore / استكشاف) */}
                    <AnimatePresence>
                        {canScrollLeft && (
                            <motion.button 
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.5 }}
                                onClick={() => scroll('left')} 
                                className="golden-circle left"
                                style={{ zIndex: 100 }}
                            >
                                <ChevronLeft size={24} />
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                
                .golden-circle {
                    width: 50px;
                    height: 50px;
                    background: var(--primary);
                    color: #000;
                    border: none;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    box-shadow: 0 10px 20px rgba(212, 175, 55, 0.4);
                    position: absolute;
                    top: 50%;
                    transform: translateY(-50%) !important;
                    transition: 0.3s;
                }
                
                .golden-circle.right { right: -5px; }
                .golden-circle.left { left: -5px; }
                
                .golden-circle:hover {
                    box-shadow: 0 15px 30px rgba(212, 175, 55, 0.5);
                    scale: 1.1;
                }

                .latest-product-card {
                    width: 280px;
                    min-width: 280px;
                    height: 380px;
                    border-radius: 20px;
                    position: relative;
                    cursor: pointer;
                    overflow: hidden;
                    border: 1px solid rgba(255,255,255,0.08);
                    flex-shrink: 0;
                }

                .card-title {
                    color: #fff;
                    font-size: 1.2rem;
                    font-weight: 800;
                    margin-bottom: 8px;
                }

                .card-price {
                    font-size: 1.2rem;
                    font-weight: 950;
                    color: var(--primary);
                }

                .card-arrow {
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    background: rgba(255,255,255,0.1);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #fff;
                    backdrop-filter: blur(5px);
                }
                
                .product-img:hover { transform: scale(1.08); }

                .loading-dots {
                    display: flex;
                    gap: 8px;
                }
                .loading-dots span {
                    width: 10px;
                    height: 10px;
                    background-color: var(--primary);
                    border-radius: 50%;
                    display: inline-block;
                    animation: dots 1.4s infinite ease-in-out both;
                }
                .loading-dots span:nth-child(1) { animation-delay: -0.32s; }
                .loading-dots span:nth-child(2) { animation-delay: -0.16s; }
                @keyframes dots {
                    0%, 80%, 100% { transform: scale(0); }
                    40% { transform: scale(1.0); }
                }
                
                @media (max-width: 768px) {
                    .latest-product-card {
                        min-width: 220px;
                        height: 300px;
                    }
                    .card-title { font-size: 1rem; }
                    .card-price { font-size: 1rem; }
                    .golden-circle {
                        width: 40px;
                        height: 40px;
                    }
                }

                .latest-products-section {
                    border-top: 1px solid rgba(255,255,255,0.05);
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                    background: radial-gradient(circle at center, rgba(212, 175, 55, 0.02) 0%, transparent 70%);
                }
            `}</style>
        </section>
    );
};

export default LatestProducts;
