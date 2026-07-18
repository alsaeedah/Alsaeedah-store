import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from './ProductCard';
import { Filter, SlidersHorizontal, ArrowUpDown, DollarSign, Loader2, X } from 'lucide-react';
import { fetchProductsPaginated, subscribeToProducts } from '../services/productService';

export default function ProductList({ 
    initialCategory = 'all', 
    title = 'تشكيلة', 
    subtitle = 'حصرية',
    description = 'اختر ما يناسب ذوقك الرفيع من مجموعتنا المميزة'
}) {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    // Filters state
    const [filterType, setFilterType] = useState(initialCategory);
    const [filterStyle, setFilterStyle] = useState('all');
    const [sortPrice, setSortPrice] = useState('none');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [randomSeed, setRandomSeed] = useState(() => Math.random().toString(36).substring(7));

    const observer = useRef();
    const lastProductRef = useCallback(node => {
        if (loading || loadingMore) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prevPage => prevPage + 1);
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, loadingMore, hasMore]);

    const loadProducts = useCallback(async (pageNum, isInitial = false, currentSeed = randomSeed) => {
        try {
            if (isInitial) setLoading(true);
            else setLoadingMore(true);

            const filters = {
                category: filterType,
                style: filterStyle,
                sortPrice,
                minPrice: minPrice !== '' ? Number(minPrice) : null,
                maxPrice: maxPrice !== '' ? Number(maxPrice) : null,
                search: searchQuery.trim() !== '' ? searchQuery : null,
                seed: currentSeed
            };

            const data = await fetchProductsPaginated(pageNum, 6, filters);

            const mappedNewProducts = data.products.map(p => ({
                ...p,
                price: Number(p.price) || 0,
                image: p.imageUrl || p.image || 'https://placehold.co/400x500/1a1a1a/ffffff?text=No+Image',
                video: p.video || ''
            }));

            if (isInitial) {
                setProducts(mappedNewProducts);
            } else {
                setProducts(prev => [...prev, ...mappedNewProducts]);
            }

            setHasMore(data.hasMore);
            setError(null);
        } catch (err) {
            console.error("Loading error:", err);
            setError("عذراً، فشل تحميل المنتجات.");
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [filterType, filterStyle, sortPrice, minPrice, maxPrice, searchQuery, randomSeed]);

    // Initial load and filter change load with DEBOUNCE
    useEffect(() => {
        const timer = setTimeout(() => {
            const newSeed = Math.random().toString(36).substring(7);
            setRandomSeed(newSeed);
            setPage(0);
            loadProducts(0, true, newSeed);
        }, 400); 
        return () => clearTimeout(timer);
    }, [filterType, filterStyle, sortPrice, minPrice, maxPrice, searchQuery]);

    // Load more when page changes
    useEffect(() => {
        if (page > 0) {
            loadProducts(page);
        }
    }, [page, loadProducts]);

    // Real-time subscription (simplified for performance)
    useEffect(() => {
        const unsubscribe = subscribeToProducts((payload) => {
            if (payload.eventType === 'UPDATE' || payload.eventType === 'DELETE' || payload.eventType === 'INSERT') {
                setProducts(prev => {
                    if (payload.eventType === 'UPDATE') {
                        const updatedProduct = {
                            ...payload.new,
                            price: Number(payload.new.price) || 0,
                            image: payload.new.imageUrl || payload.new.image || 'https://placehold.co/400x500/1a1a1a/ffffff?text=No+Image',
                            video: payload.new.video || ''
                        };
                        return prev.map(p => p.id === updatedProduct.id ? updatedProduct : p);
                    }
                    if (payload.eventType === 'INSERT') {
                        const newProduct = {
                            ...payload.new,
                            price: Number(payload.new.price) || 0,
                            image: payload.new.imageUrl || payload.new.image || 'https://placehold.co/400x500/1a1a1a/ffffff?text=No+Image',
                            video: payload.new.video || ''
                        };
                        // Add to top of list if it doesn't already exist
                        return [newProduct, ...prev.filter(p => p.id !== newProduct.id)];
                    }
                    if (payload.eventType === 'DELETE') {
                        return prev.filter(p => p.id !== payload.old.id);
                    }
                    return prev;
                });
            }
        });
        return () => unsubscribe();
    }, []);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    return (
        <div id="products" className="container" style={{ padding: '80px 20px' }}>
            {/* Header Section */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                style={{ textAlign: 'center', marginBottom: '50px' }}
            >
                <h2 style={{
                    fontSize: window.innerWidth < 480 ? '2rem' : '3rem',
                    color: '#fff',
                    marginBottom: '15px',
                    fontWeight: '800',
                    textShadow: '0 4px 20px rgba(212, 175, 55, 0.2)'
                }}>
                    {title} <span style={{ color: 'var(--primary)', textShadow: '0 0 30px rgba(212, 175, 55, 0.4)' }}>{subtitle}</span>
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.25rem', fontWeight: '500', maxWidth: '600px', margin: '0 auto' }}>
                    {description}
                </p>
            </motion.div>

            {/* Filter Bar */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="filter-bar"
                style={{
                    padding: '24px',
                    marginBottom: '50px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '24px',
                    alignItems: 'center',
                    justifyContent: 'center',
                    maxWidth: '100%',
                    background: 'linear-gradient(145deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
                    borderRadius: '24px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(20px)'
                }}
            >
                {/* Search Bar - Priority 1 */}
                <div className="search-container" style={{ position: 'relative', flex: '1', minWidth: '300px', maxWidth: '450px' }}>
                    <div style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', pointerEvents: 'none' }}>
                        <Filter size={18} />
                    </div>
                    <input
                        type="text"
                        placeholder="ابحث بالاسم أو رقم الساعة (REF)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '12px 45px 12px 15px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255,255,255,0.15)',
                            borderRadius: '16px',
                            color: 'var(--text-main)',
                            fontSize: '0.95rem',
                            outline: 'none',
                            transition: 'all 0.3s ease',
                            fontFamily: 'cairo'
                        }}
                        onFocus={(e) => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 20px rgba(212, 175, 55, 0.2)'; e.target.style.background = 'rgba(255, 255, 255, 0.08)'; }}
                        onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.15)'; e.target.style.boxShadow = 'none'; e.target.style.background = 'rgba(255, 255, 255, 0.05)'; }}
                    />
                    {searchQuery && (
                        <button 
                            onClick={() => setSearchQuery('')}
                            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '5px' }}
                        >
                            <Loader2 size={16} style={{ animation: 'none' }} /> 
                        </button>
                    )}
                </div>

                {/* Type Filter */}
                <div className="category-filter-container" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <Filter size={20} color="var(--primary)" />
                    <span style={{ fontWeight: 'bold' }}>الفئة:</span>
                    <div className="category-buttons" style={{ display: 'flex', gap: '5px' }}>
                        {[
                            { label: 'الكل', value: 'all' },
                            { label: 'رجالي', value: 'men' },
                            { label: 'نسائي', value: 'women' },
                            { label: 'أطفال', value: 'kids' }
                        ].map(type => (
                            <button
                                key={type.value}
                                onClick={() => setFilterType(type.value)}
                                className={`category-btn ${filterType === type.value ? 'active' : ''}`}
                                style={{
                                    padding: '8px 20px',
                                    borderRadius: '20px',
                                    border: filterType === type.value ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.1)',
                                    background: filterType === type.value ? 'var(--primary)' : 'rgba(255,255,255,0.03)',
                                    color: filterType === type.value ? '#000' : 'rgba(255,255,255,0.8)',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    fontFamily: 'cairo',
                                    whiteSpace: 'nowrap',
                                    fontWeight: filterType === type.value ? '700' : '500'
                                }}
                            >
                                {type.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Style Filter */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <SlidersHorizontal size={20} color="var(--primary)" />
                    <span style={{ fontWeight: 'bold' }}>النمط:</span>
                    <select
                        value={filterStyle}
                        onChange={(e) => setFilterStyle(e.target.value)}
                        style={{
                            padding: '10px 18px',
                            borderRadius: '12px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.15)',
                            color: 'var(--text-main)',
                            fontFamily: 'var(--font-main)',
                            outline: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        <option value="all">جميع الأنماط</option>
                        <option value="classic">كلاسيكي</option>
                        <option value="formal">رسمي</option>
                        <option value="wedding">عرائسي</option>
                        <option value="smart">سمارت</option>
                        <option value="sport">سبورت</option>
                    </select>
                </div>

                {/* Price Range Filter */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <DollarSign size={20} color="var(--primary)" />
                    <span style={{ fontWeight: 'bold' }}>السعر:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <input
                            type="number"
                            placeholder="من"
                            value={minPrice}
                            min="0"
                            onChange={(e) => {
                                const val = e.target.value;
                                if (val === '' || Number(val) >= 0) setMinPrice(val);
                            }}
                            style={{
                                width: '90px',
                                padding: '10px',
                                borderRadius: '12px',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.15)',
                                color: 'var(--text-main)',
                                fontFamily: 'var(--font-main)',
                                outline: 'none',
                                transition: 'all 0.3s ease'
                            }}
                        />
                        <span style={{ color: 'var(--text-dim)' }}>-</span>
                        <input
                            type="number"
                            placeholder="إلى"
                            value={maxPrice}
                            min="0"
                            onChange={(e) => {
                                const val = e.target.value;
                                if (val === '' || Number(val) >= 0) setMaxPrice(val);
                            }}
                            style={{
                                width: '90px',
                                padding: '10px',
                                borderRadius: '12px',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.15)',
                                color: 'var(--text-main)',
                                fontFamily: 'var(--font-main)',
                                outline: 'none',
                                transition: 'all 0.3s ease'
                            }}
                        />
                    </div>
                </div>

                {/* Price Sort */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <ArrowUpDown size={20} color="var(--primary)" />
                    <select
                        value={sortPrice}
                        onChange={(e) => setSortPrice(e.target.value)}
                        style={{
                            padding: '10px 18px',
                            borderRadius: '12px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.15)',
                            color: 'var(--text-main)',
                            fontFamily: 'var(--font-main)',
                            outline: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        <option value="none">ترتيب حسب</option>
                        <option value="asc">الأقل سعراً</option>
                        <option value="desc">الأعلى سعراً</option>
                    </select>
                </div>
            </motion.div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '100px', color: 'var(--text-main)' }}>
                    <div className="loader" style={{ margin: '0 auto 20px', width: '40px', height: '40px', border: '3px solid var(--glass-border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    <h2>جاري تحميل المنتجات...</h2>
                </div>
            ) : error ? (
                <div style={{ textAlign: 'center', padding: '100px', color: '#ff6b6b' }}>
                    <h2 style={{ marginBottom: '20px' }}>{error}</h2>
                    <button
                        className="btn-primary"
                        onClick={() => window.location.reload()}
                        style={{ background: 'rgba(255,107,107,0.1)', border: '1px solid #ff6b6b', color: '#ff6b6b' }}
                    >
                        إعادة المحاولة
                    </button>
                </div>
            ) : (
                <>
                    {/* Grid */}
                    <div style={{ position: 'relative', minHeight: '400px' }}>
                        <AnimatePresence>
                            {products.length > 0 ? (
                                <>
                                    <motion.div
                                        key="grid"
                                        variants={containerVariants}
                                        initial="hidden"
                                        animate="visible"
                                        exit={{ opacity: 0 }}
                                        style={{}}
                                        className="product-grid"
                                    >
                                        {products.map((product, index) => (
                                            <ProductCard 
                                                key={product.id} 
                                                product={product} 
                                                ref={products.length === index + 1 ? lastProductRef : null}
                                            />
                                        ))}
                                    </motion.div>

                                    {/* Loading more indicator */}
                                    {loadingMore && (
                                        <div style={{ textAlign: 'center', padding: '40px' }}>
                                            <div className="loader" style={{ margin: '0 auto', width: '30px', height: '30px', border: '3px solid var(--glass-border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                                        </div>
                                    )}
                                </>
                            ) : (
                                <motion.div
                                    key="empty"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    style={{ textAlign: 'center', padding: '100px 0', width: '100%' }}
                                >
                                    <p style={{ fontSize: '1.2rem', color: 'var(--text-dim)' }}>
                                        لا توجد منتجات تطابق اختيارك.
                                    </p>
                                    <button
                                        onClick={() => {
                                            setFilterType('all');
                                            setFilterStyle('all');
                                            setMinPrice('');
                                            setMaxPrice('');
                                            setSortPrice('none');
                                        }}
                                        style={{
                                            marginTop: '20px',
                                            background: 'none',
                                            border: '1px solid var(--primary)',
                                            color: 'var(--primary)',
                                            padding: '8px 20px',
                                            borderRadius: '20px',
                                            cursor: 'pointer',
                                            fontFamily: 'cairo',
                                        }}
                                    >
                                        إعادة تعيين الفلاتر
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </>
            )}
        </div>
    );
}

