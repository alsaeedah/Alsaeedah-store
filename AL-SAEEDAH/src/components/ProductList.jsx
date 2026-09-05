import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from './ProductCard';
import { Loader2, Sliders } from 'lucide-react';
import { productRepository } from '../services/productService';
import { fetchAvailableBrandIds } from '../services/productService';
import { useTaxonomyStore } from '../services/taxonomyService';
import DesktopFilterPanel from './filters/DesktopFilterPanel';
import MobileFilterDrawer from './filters/MobileFilterDrawer';
import SortDropdown from './filters/SortDropdown';

export default function ProductList({ 
    initialCategory = 'all',
    initialBrand = 'all',
    initialSearch = '',
    title = 'تشكيلة', 
    subtitle = 'حصرية',
    description = 'اختر ما يناسب ذوقك الرفيع من مجموعتنا المميزة'
}) {
    const [productsByPage, setProductsByPage] = useState({});
    const products = useMemo(() => {
        return Object.keys(productsByPage)
            .sort((a, b) => Number(a) - Number(b))
            .flatMap(k => productsByPage[k] || []);
    }, [productsByPage]);

    const [loading, setLoading] = useState(true);
    const [showLoader, setShowLoader] = useState(false);
    
    useEffect(() => {
        let isMounted = true;
        const timer = setTimeout(() => {
            if (isMounted && loading) setShowLoader(true);
        }, 150);
        return () => { isMounted = false; clearTimeout(timer); };
    }, [loading]);

    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const nextCursorRef = useRef(null);
    const requestIdRef = useRef(0);
    const subsRef = useRef({}); // Tracks subscriptions for each page

    const store = useTaxonomyStore();
    const activeCategories = store.categories.filter(c => c.active !== false).sort((a, b) => (a.order || 0) - (b.order || 0));
    const activeBrands = store.brands.filter(b => b.active !== false).sort((a, b) => (a.order || 0) - (b.order || 0));

    const [filterCategoryIds, setFilterCategoryIds] = useState(initialCategory === 'all' ? [] : [initialCategory]);
    const [filterBrandIds, setFilterBrandIds] = useState(initialBrand === 'all' ? [] : [initialBrand]);
    const [sortPrice, setSortPrice] = useState('none');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [searchQuery, setSearchQuery] = useState(initialSearch);
    const [randomSeed, setRandomSeed] = useState(() => Math.random().toString(36).substring(7));
    const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
    const [isDesktopFilterOpen, setIsDesktopFilterOpen] = useState(window.innerWidth >= 992);
    
    const [filterState, setFilterState] = useState('normal');
    const layoutRef = useRef(null);
    const fixedPanelRef = useRef(null);

    useEffect(() => {
        if (window.innerWidth < 992) return;

        const layout = layoutRef.current;
        if (!layout) return;

        const checkBounds = () => {
            if (!layoutRef.current || !fixedPanelRef.current) return;
            const layoutRect = layoutRef.current.getBoundingClientRect();
            const panelHeight = fixedPanelRef.current.offsetHeight;
            
            if (layoutRect.bottom <= (100 + panelHeight)) {
                setFilterState('bottom');
            } else if (layoutRect.top <= 100) {
                setFilterState('fixed');
            } else {
                setFilterState('normal');
            }
        };

        const observer = new IntersectionObserver((entries) => {
            const entry = entries[0];
            if (entry.isIntersecting) {
                window.addEventListener('scroll', checkBounds, { passive: true });
                window.addEventListener('resize', checkBounds, { passive: true });
                checkBounds(); 
            } else {
                window.removeEventListener('scroll', checkBounds);
                window.removeEventListener('resize', checkBounds);
                
                if (entry.boundingClientRect.top < 0) {
                    setFilterState('bottom');
                } else {
                    setFilterState('normal');
                }
            }
        }, {
            rootMargin: '200px'
        });

        observer.observe(layout);

        return () => {
            observer.disconnect();
            window.removeEventListener('scroll', checkBounds);
            window.removeEventListener('resize', checkBounds);
        };
    }, []);

    const [contextualBrandIds, setContextualBrandIds] = useState(null);

    const handleClearFilters = () => {
        if (initialCategory === 'all') {
            setFilterCategoryIds([]);
        } else {
            setFilterCategoryIds([initialCategory]);
        }
        setFilterBrandIds([]);
        setMinPrice('');
        setMaxPrice('');
        setSearchQuery('');
        setSortPrice('none');
    };

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

    // Cleanup all subscriptions
    const cleanupSubs = useCallback(() => {
        Object.values(subsRef.current).forEach(unsub => unsub && unsub());
        subsRef.current = {};
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return cleanupSubs;
    }, [cleanupSubs]);

    const loadProducts = useCallback((pageNum, isInitial = false, currentSeed = randomSeed, options = {}) => {
        const thisRequestId = isInitial ? ++requestIdRef.current : requestIdRef.current;
        
        if (isInitial) {
            setLoading(true);
            setProductsByPage({});
        } else {
            setLoadingMore(true);
        }

        const filters = {
            categoryIds: filterCategoryIds,
            brandIds: filterBrandIds,
            sortPrice,
            minPrice: minPrice !== '' ? Number(minPrice) : null,
            maxPrice: maxPrice !== '' ? Number(maxPrice) : null,
            search: searchQuery.trim() !== '' ? searchQuery : null
        };

        const currentCursor = isInitial ? null : nextCursorRef.current;

        // Clean up previous subscription for this specific page if any
        if (subsRef.current[pageNum]) {
            subsRef.current[pageNum]();
        }

        const unsub = productRepository.subscribeToPaginatedSWR(filters, pageNum, 6, currentCursor, (data) => {
            if (thisRequestId !== requestIdRef.current) return;

            if (!data || !data.products) {
                if (isInitial) setLoading(false);
                else setLoadingMore(false);
                return;
            }

            const mappedNewProducts = data.products.map(p => ({
                ...p,
                price: Number(p.price) || 0,
                image: p.imageUrl || p.image || 'https://placehold.co/400x500/1a1a1a/ffffff?text=No+Image',
                video: p.video || ''
            }));

            setProductsByPage(prev => ({
                ...prev,
                [pageNum]: mappedNewProducts
            }));

            // Only update cursor and hasMore if it's the latest page requested
            // (prevents background revalidations of page 0 from clearing page 1's cursor)
            if (pageNum === page) {
                setHasMore(data.hasMore);
                nextCursorRef.current = data.nextCursor;
            }

            setError(null);
            
            if (isInitial) setLoading(false);
            else setLoadingMore(false);
        }, options);

        subsRef.current[pageNum] = unsub;
        return unsub.fetchPromise;
    }, [filterCategoryIds, filterBrandIds, sortPrice, minPrice, maxPrice, searchQuery, randomSeed, page]);

    useEffect(() => {
        const timer = setTimeout(() => {
            cleanupSubs();
            const newSeed = Math.random().toString(36).substring(7);
            setRandomSeed(newSeed);
            setPage(0);
            nextCursorRef.current = null;
            loadProducts(0, true, newSeed, { forceRevalidate: true });
        }, 400); 
        return () => clearTimeout(timer);
    }, [JSON.stringify(filterCategoryIds), JSON.stringify(filterBrandIds), sortPrice, minPrice, maxPrice, searchQuery]);

    useEffect(() => {
        if (page > 0) {
            loadProducts(page, false, randomSeed, { forceRevalidate: true });
        }
    }, [page]);

    // Fetch Contextual Brands when category filter changes
    useEffect(() => {
        let isMounted = true;
        if (filterCategoryIds && filterCategoryIds.length > 0 && !(filterCategoryIds.length === 1 && filterCategoryIds[0] === 'all')) {
            fetchAvailableBrandIds(filterCategoryIds).then(ids => {
                if (isMounted) {
                    setContextualBrandIds(ids);
                    // Ensure the currently selected brands are still valid in the new context
                    if (ids && filterBrandIds.length > 0) {
                        setFilterBrandIds(prev => prev.filter(bId => ids.includes(bId)));
                    }
                }
            }).catch(err => {
                console.error('[ProductList] Failed to fetch contextual brands:', err);
                if (isMounted) setContextualBrandIds(null); // Fallback to all brands on error
            });
        } else {
            setContextualBrandIds(null);
        }
        return () => { isMounted = false; };
    }, [JSON.stringify(filterCategoryIds)]);

    // Real-time subscription removed per Phase 4 Local-First architecture.
    // UI will update on next navigation or pull-to-refresh.

    // Listen for manual pull-to-refresh
    useEffect(() => {
        const handleRefresh = (e) => {
            if (e.detail) {
                e.detail.handled = true;
            }
            const newSeed = Math.random().toString(36).substring(7);
            setRandomSeed(newSeed);
            setPage(0);
            nextCursorRef.current = null;
            const promise = loadProducts(0, true, newSeed, { forceRevalidate: true });
            
            if (e.detail && e.detail.resolve) {
                promise.then(e.detail.resolve).catch(e.detail.reject);
            }
        };
        window.addEventListener('app-pull-to-refresh', handleRefresh);
        return () => window.removeEventListener('app-pull-to-refresh', handleRefresh);
    }, [loadProducts]);

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
                    color: 'var(--text-main)',
                    marginBottom: '15px',
                    fontWeight: '800',
                    textShadow: '0 4px 20px rgba(212, 175, 55, 0.2)'
                }}>
                    {title} <span style={{ color: 'var(--primary)', textShadow: '0 0 30px rgba(212, 175, 55, 0.4)' }}>{subtitle}</span>
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.25rem', fontWeight: '500', maxWidth: '600px', margin: '0 auto' }}>
                    {description}
                </p>
            </motion.div>

            {/* Mobile Filter Toggle & Sort */}
            {window.innerWidth < 992 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                    <button 
                        className="filter-toggle-btn"
                        onClick={() => setIsMobileDrawerOpen(true)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 20px',
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '12px',
                            color: 'var(--text-main)',
                            fontFamily: 'var(--font-main)',
                            fontWeight: '700',
                            cursor: 'pointer'
                        }}
                    >
                        <Sliders size={18} /> فلاتر
                    </button>

                    <div style={{ marginRight: 'auto' }}>
                        <SortDropdown sortPrice={sortPrice} setSortPrice={setSortPrice} />
                    </div>
                </div>
            )}

            <div className={`product-page-layout ${isDesktopFilterOpen ? 'filter-open' : 'filter-closed'}`} style={{ position: 'relative' }} ref={layoutRef}>
                {/* Desktop Reserved Space & Fixed Container */}
                <div className="filter-sidebar-reserved" style={{ 
                    width: isDesktopFilterOpen ? 280 : 0, 
                    flexShrink: 0, 
                    transition: 'width 0.3s ease-in-out',
                    display: window.innerWidth >= 992 ? 'block' : 'none'
                }}>
                    <div 
                        ref={fixedPanelRef}
                        className={`filter-sidebar-fixed state-${filterState}`}
                    >
                        {/* Product Controls Row: Shared vertical alignment for Toggle and Sort */}
                        <div className="product-controls-row" style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'center' }}>
                            <button 
                                className="filter-toggle-btn"
                                onClick={() => setIsDesktopFilterOpen(!isDesktopFilterOpen)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '10px 16px',
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '12px',
                                    color: 'var(--text-main)',
                                    fontFamily: 'var(--font-main)',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    width: 'fit-content',
                                    whiteSpace: 'nowrap',
                                    flexShrink: 0
                                }}
                            >
                                <Sliders size={18} /> {isDesktopFilterOpen ? 'إخفاء' : 'إظهار'}
                            </button>
                            
                            <div style={{ width: 'fit-content', flexShrink: 0 }}>
                                <SortDropdown sortPrice={sortPrice} setSortPrice={setSortPrice} />
                            </div>
                        </div>

                        <DesktopFilterPanel 
                            isOpen={isDesktopFilterOpen}
                            hideCategoryFilter={initialCategory !== 'all'}
                            filterCategoryIds={filterCategoryIds} setFilterCategoryIds={setFilterCategoryIds}
                            filterBrandIds={filterBrandIds} setFilterBrandIds={setFilterBrandIds}
                            minPrice={minPrice} setMinPrice={setMinPrice}
                            maxPrice={maxPrice} setMaxPrice={setMaxPrice}
                            searchQuery={searchQuery} setSearchQuery={setSearchQuery}
                            activeCategories={activeCategories} 
                            activeBrands={contextualBrandIds ? activeBrands.filter(b => contextualBrandIds.includes(b.id)) : activeBrands}
                            onClear={handleClearFilters}
                        />
                    </div>
                </div>

                {/* Right Column: Products */}
                <div className="products-column desktop-margin" style={{ minWidth: 0, flex: 1 }}>
                    {loading && showLoader ? (
                        <div style={{ textAlign: 'center', padding: '120px 20px', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                            <div className="loader" style={{ width: '48px', height: '48px', border: '3px solid var(--border-color)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-secondary)', fontFamily: 'var(--font-heading)' }}>جاري تحميل المنتجات...</h2>
                        </div>
                    ) : loading && !showLoader ? (
                        <div style={{ minHeight: '400px' }}></div>
                    ) : error ? (
                        <div style={{ textAlign: 'center', padding: '100px', color: '#ff6b6b' }}>
                            <h2 style={{ marginBottom: '20px' }}>{error}</h2>
                            <button
                                className="btn-primary"
                                onClick={() => {
                                    setError(null);
                                    const newSeed = Math.random().toString(36).substring(7);
                                    setRandomSeed(newSeed);
                                    setPage(0);
                                    nextCursorRef.current = null;
                                    loadProducts(0, true, newSeed);
                                }}
                                style={{ background: 'rgba(255,107,107,0.1)', border: '1px solid #ff6b6b', color: '#ff6b6b' }}
                            >
                                إعادة المحاولة
                            </button>
                        </div>
                    ) : (
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
                                        style={{ textAlign: 'center', padding: '120px 20px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}
                                    >
                                        <h3 style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>عذراً، لا توجد نتائج</h3>
                                        <p style={{ fontSize: '1.1rem', color: 'var(--text-dim)', maxWidth: '400px', lineHeight: '1.6' }}>
                                            لم نتمكن من العثور على منتجات تطابق بحثك أو الفلاتر المحددة. جرب تغيير خيارات البحث.
                                        </p>
                                        <button
                                            onClick={handleClearFilters}
                                            style={{
                                                marginTop: '12px',
                                                background: 'transparent',
                                                border: '2px solid var(--primary)',
                                                color: 'var(--primary)',
                                                padding: '10px 28px',
                                                borderRadius: '24px',
                                                cursor: 'pointer',
                                                fontFamily: 'var(--font-main)',
                                                fontWeight: '700',
                                                fontSize: '1rem',
                                                transition: 'all 0.3s ease'
                                            }}
                                            onMouseEnter={(e) => { e.target.style.background = 'rgba(212,175,55,0.1)'; }}
                                            onMouseLeave={(e) => { e.target.style.background = 'transparent'; }}
                                        >
                                            إعادة تعيين الفلاتر
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile Drawer */}
            <MobileFilterDrawer 
                isOpen={isMobileDrawerOpen} 
                onClose={() => setIsMobileDrawerOpen(false)}
                hideCategoryFilter={initialCategory !== 'all'}
                filterCategoryIds={filterCategoryIds} setFilterCategoryIds={setFilterCategoryIds}
                filterBrandIds={filterBrandIds} setFilterBrandIds={setFilterBrandIds}
                minPrice={minPrice} setMinPrice={setMinPrice}
                maxPrice={maxPrice} setMaxPrice={setMaxPrice}
                searchQuery={searchQuery} setSearchQuery={setSearchQuery}
                activeCategories={activeCategories} 
                activeBrands={contextualBrandIds ? activeBrands.filter(b => contextualBrandIds.includes(b.id)) : activeBrands}
                onClear={handleClearFilters}
            />
        </div>
    );
}

