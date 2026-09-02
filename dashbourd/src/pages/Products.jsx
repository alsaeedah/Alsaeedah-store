import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLoading } from '../context/LoadingContext';
import { productRepository, getFilteredIds, deleteProducts } from '../services/productService';
import Swal from 'sweetalert2';
import {
    Plus, Trash2, Edit, Loader2, Search, Layers, Users,
    Activity, ShoppingBag, Clock, Filter, LayoutGrid,
    LayoutList, Check, MoreVertical, Package, ArrowUpRight,
    TrendingUp, Star, Box, Tag, Flame, HardDrive
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { deleteFromCloudinary } from '../utils/cloudinary';
import { Link } from 'react-router-dom';
import FilterBar from '../components/FilterBar';
import { db } from '../firebase/config';
import { writeBatch, collection, getDocs, doc } from 'firebase/firestore';

const Products = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [totalStats, setTotalStats] = useState({ total: 0, men: 0, women: 0, kids: 0 });
    const { startLoading, stopLoading } = useLoading();
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Filter States
    const [genderId, setGenderId] = useState('all');
    const [categoryId, setCategoryId] = useState('all');
    const [brandId, setBrandId] = useState('all');
    const [sortPrice, setSortPrice] = useState('none');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProducts, setSelectedProducts] = useState(new Set());
    const [totalMatchingCount, setTotalMatchingCount] = useState(0);

    // Bulk-selection state
    const [isSelectAllLoading, setIsSelectAllLoading] = useState(false);
    const [selectAllCapped, setSelectAllCapped] = useState(false);

    const observer = useRef();
    const lastProductRef = useCallback(node => {
        if (loading || loadingMore) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prev => prev + 1);
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, loadingMore, hasMore]);

    const fetchStats = async () => {
        try {
            const stats = await productRepository.getStats();
            setTotalStats(stats);
        } catch (error) {
            console.error("Stats fetch error:", error);
        }
    };

    const nextCursorRef = useRef(null);
    const LIMIT = 20;

    /**
     * Builds the filter object from current FilterBar state.
     * Single source of truth used by both fetchProducts() and toggleAll().
     */
    const buildFilters = () => ({
        genderId: genderId !== 'all' ? genderId : null,
        categoryId: categoryId !== 'all' ? categoryId : null,
        brandId: brandId !== 'all' ? brandId : null,
        minPrice: minPrice !== '' ? Number(minPrice) : null,
        maxPrice: maxPrice !== '' ? Number(maxPrice) : null,
        search: searchQuery,
        sortPrice: sortPrice
    });

    const fetchProducts = async (pageNum, isInitial = false) => {
        if (isInitial) {
            startLoading();
            // Only show full-page loader if we have no products at all
            if (products.length === 0) setLoading(true);
            setError(null);
            nextCursorRef.current = null;
        } else {
            setLoadingMore(true);
        }

        try {
            const resolvedFilters = buildFilters();

            const currentCursor = isInitial ? null : nextCursorRef.current;
            const response = await productRepository.getPaginated(resolvedFilters, pageNum, LIMIT, currentCursor);

            if (response && response._isStaleCache) {
                console.log("[Products] Using LKG data, background revalidation started.");
            }

            const newProducts = response?.products || [];
            nextCursorRef.current = response?.nextCursor || null;

            if (isInitial) {
                setProducts(newProducts);
                setTotalMatchingCount(response?.total || newProducts.length);
            } else {
                setProducts(prev => {
                    const existingIds = new Set(prev.map(p => p.id));
                    const uniqueNew = newProducts.filter(p => !existingIds.has(p.id));
                    return [...prev, ...uniqueNew];
                });
            }

            setHasMore(response?.hasMore || false);
        } catch (err) {
            console.error("[Products] Product loading failed", err);
            if (isInitial) {
                setProducts([]);
                setError({
                    code: err?.code || 'unknown',
                    message: err?.message || 'فشل تحميل المنتجات من قاعدة البيانات'
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'خطأ',
                    text: 'فشل تحميل المزيد من المنتجات',
                    background: '#141414',
                    color: '#fff'
                });
            }
        } finally {
            if (isInitial) {
                setLoading(false);
                stopLoading();
            } else {
                setLoadingMore(false);
            }
        }
    };

    // Filter changes — reset page, clear selection, and reload
    useEffect(() => {
        setPage(0);
        setSelectedProducts(new Set());
        setSelectAllCapped(false);
        fetchProducts(0, true);
        fetchStats();
    }, [genderId, categoryId, brandId, sortPrice, minPrice, maxPrice, searchQuery]);

    // Page changes
    useEffect(() => {
        if (page > 0) {
            fetchProducts(page);
        }
    }, [page]);

    // Unbounded listener removed to comply with Phase 9 bounds constraints.

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'هل أنت متأكد؟',
            text: "لن تتمكن من التراجع عن الحذف!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'نعم، احذف',
            cancelButtonText: 'إلغاء',
            background: '#141414',
            color: '#fff',
            confirmButtonColor: '#ef4444',
            cancelButtonColor: 'rgba(255,255,255,0.1)'
        });

        if (result.isConfirmed) {
            startLoading();
            try {
                // Fetch product to get images and video
                const productToDelete = await productRepository.getById(id);

                if (productToDelete) {
                    if (productToDelete.video && productToDelete.video.includes('cloudinary')) {
                        await deleteFromCloudinary(productToDelete.video, 'video');
                    }
                    const imagesToDelete = new Set(productToDelete.images || []);
                    if (productToDelete.imageUrl) imagesToDelete.add(productToDelete.imageUrl);
                    for (const img of imagesToDelete) {
                        if (img && img.includes('cloudinary')) {
                            await deleteFromCloudinary(img, 'image');
                        }
                    }
                }

                await productRepository.delete(id);

                setProducts(prev => prev.filter(p => p.id !== id));
                fetchStats();
                Swal.fire({ title: 'تم الحذف بنجاح', icon: 'success', background: '#141414', color: '#fff' });
            } catch (error) {
                console.error(error);
                if (error.name === 'OfflineError') {
                    Swal.fire({ icon: 'error', title: 'خطأ', text: error.message, background: '#141414', color: '#fff' });
                    return;
                }
                Swal.fire({ icon: 'error', title: 'خطأ', text: 'فشل الحذف', background: '#141414', color: '#fff' });
            } finally {
                stopLoading();
            }
        }
    };

    const toggleBestSellerStatus = async (id, currentStatus) => {
        startLoading();
        try {
            await productRepository.update(id, { is_best_seller: !currentStatus });

            setProducts(prev => prev.map(p => p.id === id ? { ...p, is_best_seller: !currentStatus } : p));

            Swal.fire({
                icon: 'success',
                title: !currentStatus ? 'تمت الإضافة' : 'تمت الإزالة',
                text: !currentStatus ? 'تم نقل المنتج لقائمة أكثر الطلبات' : 'تم إزالة المنتج من قائمة أكثر الطلبات',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 2000,
                background: '#141414',
                color: '#fff'
            });
        } catch (error) {
            console.error(error);
            if (error.name === 'OfflineError') {
                Swal.fire({ icon: 'error', title: 'خطأ', text: error.message, background: '#141414', color: '#fff' });
                return;
            }
            Swal.fire({ icon: 'error', title: 'خطأ', text: 'فشل تحديث الحالة', background: '#141414', color: '#fff' });
        } finally {
            stopLoading();
        }
    };

    const toggleLatestStatus = async (id, currentStatus) => {
        startLoading();
        try {
            await productRepository.update(id, { is_latest: !currentStatus });

            setProducts(prev => prev.map(p => p.id === id ? { ...p, is_latest: !currentStatus } : p));

            Swal.fire({
                icon: 'success',
                title: !currentStatus ? 'تمت الإضافة' : 'تمت الإزالة',
                text: !currentStatus ? 'تم نقل المنتج لقائمة أحدث المنتجات' : 'تم إزالة المنتج من قائمة أحدث المنتجات',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 2000,
                background: '#141414',
                color: '#fff'
            });
        } catch (error) {
            console.error(error);
            if (error.name === 'OfflineError') {
                Swal.fire({ icon: 'error', title: 'خطأ', text: error.message, background: '#141414', color: '#fff' });
                return;
            }
            Swal.fire({ icon: 'error', title: 'خطأ', text: 'فشل تحديث الحالة', background: '#141414', color: '#fff' });
        } finally {
            stopLoading();
        }
    };

    const toggleProduct = (id) => {
        const newSelected = new Set(selectedProducts);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedProducts(newSelected);
    };

    /**
     * Select All / Deselect All.
     *
     * When deselecting: clears the selection immediately.
     * When selecting: calls getFilteredIds with the current FilterBar state to
     *   collect ALL matching product IDs across every pagination page — without
     *   introducing an unbounded Firestore read.
     *
     * Does NOT overwrite totalMatchingCount when the 500-ID cap is hit; the cap
     * only affects the selection set, not the displayed total.
     */
    const toggleAll = async () => {
        // --- Deselect All ---
        if (selectedProducts.size > 0) {
            setSelectedProducts(new Set());
            setSelectAllCapped(false);
            return;
        }

        // --- Select All ---
        setIsSelectAllLoading(true);
        try {
            const filters = buildFilters();
            const { ids, capped } = await getFilteredIds(filters);

            setSelectedProducts(new Set(ids));
            setSelectAllCapped(capped);
            // NOTE: totalMatchingCount is intentionally NOT overwritten here.
            // If the cap was reached, the true count is unknown; preserving the
            // existing displayed total is more accurate than showing the cap number.

            if (capped) {
                Swal.fire({
                    icon: 'warning',
                    title: 'تحديد جزئي',
                    text: `تم تحديد أول ${ids.length} منتج فقط. عدد المنتجات المطابقة يتجاوز الحد الأقصى المسموح به.`,
                    background: '#141414',
                    color: '#fff',
                    confirmButtonColor: 'var(--primary)'
                });
            } else {
                Swal.fire({
                    title: 'تم تحديد الكل',
                    text: `تم تحديد ${ids.length} منتج`,
                    icon: 'success',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 2000,
                    background: '#141414',
                    color: '#fff'
                });
            }
        } catch (error) {
            console.error("Select all error:", error);
            Swal.fire({
                icon: 'error',
                title: 'خطأ',
                text: 'فشل تحديد جميع المنتجات',
                background: '#141414',
                color: '#fff'
            });
        } finally {
            setIsSelectAllLoading(false);
        }
    };

    /**
     * Bulk Delete.
     *
     * Uses the IDs in selectedProducts as the sole source of truth.
     * Delegates all asset cleanup, Firestore batching, cache invalidation,
     * and sync to deleteProducts() in productService.js.
     *
     * Supports partial failures:
     *  - Successfully deleted products are removed from the UI.
     *  - Failed products remain visible and stay in the selection set.
     *  - The result toast accurately reflects the outcome.
     *
     * Offline: deleteProducts() will throw an OfflineError before touching
     * Firestore; the selection is preserved and an error toast is shown.
     */
    
    const handleMigrateGenders = async () => {
        try {
            startLoading('جاري تحديث بيانات الجنس لجميع المنتجات...');
            const querySnapshot = await getDocs(collection(db, 'products'));
            const batches = [];
            let currentBatch = writeBatch(db);
            let opCount = 0;
            let migratedCount = 0;
    
            for (const document of querySnapshot.docs) {
                const data = document.data();
                if (data.gender !== undefined) {
                    currentBatch.update(document.ref, {
                        genderId: data.gender
                    });
                    migratedCount++;
                    opCount++;
                }
    
                if (opCount === 500) {
                    batches.push(currentBatch);
                    currentBatch = writeBatch(db);
                    opCount = 0;
                }
            }
    
            if (opCount > 0) {
                batches.push(currentBatch);
            }
    
            for (let i = 0; i < batches.length; i++) {
                await batches[i].commit();
            }
            
            stopLoading();
            Swal.fire('تمت العملية', `تم تحديث ${migratedCount} منتج بنجاح.`, 'success');
            fetchProducts(0, true);
        } catch (err) {
            stopLoading();
            console.error(err);
            Swal.fire('خطأ', 'فشل تحديث المنتجات: ' + err.message, 'error');
        }
    };
    const handleBulkDelete = async () => {
        if (selectedProducts.size === 0) return;

        const idsToDelete = [...selectedProducts];
        const count = idsToDelete.length;

        const confirmation = await Swal.fire({
            title: 'هل أنت متأكد؟',
            text: `هل تريد حذف ${count} ${count === 1 ? 'منتج' : 'منتجات'} نهائياً؟`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'نعم، احذف المحدد',
            cancelButtonText: 'إلغاء',
            background: '#141414',
            color: '#fff',
            confirmButtonColor: '#ef4444',
            cancelButtonColor: 'rgba(255,255,255,0.1)'
        });

        if (!confirmation.isConfirmed) return;

        startLoading();
        try {
            const result = await deleteProducts(idsToDelete);

            const { deletedIds, failedIds } = result;

            // Remove successfully deleted products from the UI
            if (deletedIds.length > 0) {
                const deletedSet = new Set(deletedIds);
                setProducts(prev => prev.filter(p => !deletedSet.has(p.id)));
            }

            // Update selection: clear deleted, keep failed
            if (failedIds.length > 0) {
                setSelectedProducts(new Set(failedIds));
            } else {
                setSelectedProducts(new Set());
                setSelectAllCapped(false);
            }

            // Refresh stats
            fetchStats();

            // Show accurate result toast
            if (result.success) {
                Swal.fire({
                    title: 'تم الحذف بنجاح',
                    text: `تم حذف ${deletedIds.length} ${deletedIds.length === 1 ? 'منتج' : 'منتجات'} بنجاح`,
                    icon: 'success',
                    background: '#141414',
                    color: '#fff'
                });
            } else {
                const successMsg = deletedIds.length > 0
                    ? `تم حذف ${deletedIds.length} منتج بنجاح.`
                    : 'لم يتم حذف أي منتج.';
                const failMsg = `فشل حذف ${failedIds.length} منتج.`;
                Swal.fire({
                    title: 'اكتمل الحذف جزئياً',
                    html: `<p>${successMsg}</p><p style="color:#ef4444">${failMsg}</p>`,
                    icon: 'warning',
                    background: '#141414',
                    color: '#fff',
                    confirmButtonColor: 'var(--primary)'
                });
            }
        } catch (error) {
            console.error(error);
            if (error.name === 'OfflineError') {
                // Preserve selection — user can retry when online
                Swal.fire({
                    icon: 'error',
                    title: 'غير متصل بالإنترنت',
                    text: error.message,
                    background: '#141414',
                    color: '#fff'
                });
                return;
            }
            Swal.fire({ icon: 'error', title: 'خطأ', text: 'فشل الحذف الجماعي', background: '#141414', color: '#fff' });
        } finally {
            stopLoading();
        }
    };

    const summaryStats = [
        { label: 'إجمالي المخزون', value: totalStats.total, icon: <Package size={22} />, color: 'var(--primary)', bg: 'rgba(212, 175, 55, 0.1)' },
        { label: 'ساعات رجالية', value: totalStats.men, icon: <Users size={22} />, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
        { label: 'ساعات نسائية', value: totalStats.women, icon: <ShoppingBag size={22} />, color: '#ec4899', bg: 'rgba(236, 72, 153, 0.1)' },
        { label: 'ساعات أطفال', value: totalStats.kids, icon: <Activity size={22} />, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
    ];

    // Determine Select All button label
    const selectAllLabel = (() => {
        if (isSelectAllLoading) return <Loader2 size={14} className="animate-spin" />;
        if (selectedProducts.size > 0) return selectAllCapped ? 'إلغاء (محدود)' : 'إلغاء تحديد الكل';
        return 'تحديد الكل';
    })();

    return (
        <div style={{ direction: 'rtl', padding: '10px' }}>
            {/* Header Section */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: isMobile ? 'flex-start' : 'flex-end',
                marginBottom: isMobile ? '2rem' : '3rem',
                flexWrap: 'wrap',
                flexDirection: isMobile ? 'column' : 'row',
                gap: '24px'
            }}>
                <div>
                    <h1 style={{
                        fontSize: isMobile ? '1.8rem' : '2.8rem',
                        fontWeight: '900',
                        color: '#fff',
                        marginBottom: '8px',
                        letterSpacing: '-1.5px'
                    }}>
                        إدارة المخزون <span style={{ color: 'var(--primary)', fontSize: isMobile ? '0.9rem' : '1.2rem', verticalAlign: 'middle', opacity: 0.8 }}>| مركز المنتجات</span>
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: isMobile ? '0.95rem' : '1.1rem' }}>التحكم الكامل في تشكيلة الساعات الراقية لمتجر السعيدة.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px', width: isMobile ? '100%' : 'auto' }}>
                    {selectedProducts.size > 0 ? (
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ display: 'flex', gap: '12px', width: '100%' }}>
                            <button
                                onClick={toggleAll}
                                disabled={isSelectAllLoading}
                                style={{
                                    flex: 1, padding: '12px 10px', borderRadius: '14px',
                                    background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)',
                                    color: '#fff', fontWeight: '700', cursor: isSelectAllLoading ? 'not-allowed' : 'pointer',
                                    fontSize: '0.85rem', opacity: isSelectAllLoading ? 0.6 : 1,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                                }}
                            >
                                {selectAllLabel}
                            </button>
                            <button
                                onClick={handleBulkDelete}
                                style={{
                                    flex: 1.5, padding: '12px 10px', borderRadius: '14px',
                                    background: '#ef4444', border: 'none', color: '#fff', fontWeight: '800',
                                    cursor: 'pointer', display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', gap: '8px', fontSize: '0.85rem'
                                }}
                            >
                                <Trash2 size={16} /> حذف ({selectedProducts.size})
                            </button>
                        </motion.div>
                    ) : (
                        <>
                            <button
                                onClick={toggleAll}
                                disabled={isSelectAllLoading}
                                style={{
                                    padding: '12px 16px', borderRadius: '14px',
                                    background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)',
                                    color: '#fff', fontWeight: '700', cursor: isSelectAllLoading ? 'not-allowed' : 'pointer',
                                    fontSize: '0.85rem', opacity: isSelectAllLoading ? 0.6 : 1,
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                {isSelectAllLoading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                                تحديد الكل
                            </button>
                            <button 
                                onClick={handleMigrateGenders}
                                style={{
                                    padding: '10px 20px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid var(--border-color)', color: '#fff', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600'
                                }}>
                                <HardDrive size={14} /> تحديث قاعدة الجنس
                            </button>
                            <Link to="/products/add" style={{ textDecoration: 'none', width: isMobile ? '100%' : 'auto' }}>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    style={{
                                        width: '100%', padding: '14px 20px', borderRadius: '16px',
                                        background: 'var(--primary)', color: '#000', border: 'none',
                                        fontWeight: '800', cursor: 'pointer', display: 'flex',
                                        alignItems: 'center', justifyContent: 'center', gap: '10px',
                                        boxShadow: '0 10px 25px rgba(212, 175, 55, 0.2)', fontSize: '0.9rem'
                                    }}
                                >
                                    <Plus size={20} /> إضافة ساعة جديدة
                                </motion.button>
                            </Link>
                        </>
                    )}
                </div>
            </div>

            {/* Stats Section */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: isMobile ? '12px' : '20px',
                marginBottom: isMobile ? '2rem' : '3rem'
            }}>
                {summaryStats.map((stat, idx) => (
                    <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                        style={{
                            padding: isMobile ? '15px' : '24px',
                            borderRadius: '20px',
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid var(--border-color)',
                            display: 'flex',
                            flexDirection: isMobile ? 'column' : 'row',
                            alignItems: isMobile ? 'center' : 'center',
                            textAlign: isMobile ? 'center' : 'right',
                            gap: isMobile ? '10px' : '20px'
                        }}>
                        <div style={{ width: isMobile ? '40px' : '56px', height: isMobile ? '40px' : '56px', borderRadius: '12px', background: stat.bg, color: stat.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {React.cloneElement(stat.icon, { size: isMobile ? 18 : 22 })}
                        </div>
                        <div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px', fontWeight: '600' }}>{stat.label}</p>
                            <h4 style={{ fontSize: isMobile ? '1.3rem' : '1.8rem', fontWeight: '900', color: '#fff' }}>{stat.value}</h4>
                        </div>
                    </motion.div>
                ))}
            </div>

            <FilterBar
                searchQuery={searchQuery} setSearchQuery={setSearchQuery}
                genderId={genderId} setGenderId={setGenderId}
                categoryId={categoryId} setCategoryId={setCategoryId}
                brandId={brandId} setBrandId={setBrandId}
                minPrice={minPrice} setMinPrice={setMinPrice}
                maxPrice={maxPrice} setMaxPrice={setMaxPrice}
                sortPrice={sortPrice} setSortPrice={setSortPrice}
            />

            {error && products.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '100px 0' }}>
                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '30px', borderRadius: '20px', display: 'inline-block', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                        <h3 style={{ color: '#ef4444', fontSize: '1.5rem', marginBottom: '10px' }}>تعذر تحميل البيانات</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>السبب: {error.message}</p>
                        <button onClick={() => fetchProducts(0, true)} style={{ padding: '12px 24px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }}>
                            إعادة المحاولة
                        </button>
                    </div>
                </div>
            ) : loading ? (
                <div style={{ textAlign: 'center', padding: '120px 0', color: 'var(--primary)' }}>
                    <Loader2 className="animate-spin" style={{ margin: '0 auto 24px', width: '56px', height: '56px' }} />
                    <p style={{ fontWeight: '800', fontSize: '1.1rem', letterSpacing: '1px' }}>جاري استحضار المجموعة الملكية...</p>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(340px, 1fr))',
                    gap: isMobile ? '20px' : '30px',
                    paddingBottom: '60px'
                }}>
                    <AnimatePresence mode="popLayout">
                        {products.length === 0 ? (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ gridColumn: '1/-1', textAlign: 'center', padding: '100px 0', opacity: 0.3 }}>
                                <Box size={80} style={{ marginBottom: '24px' }} />
                                <p style={{ fontSize: '1.4rem', fontWeight: '700' }}>عذراً، لم نجد أي قطع تطابق بحثك</p>
                            </motion.div>
                        ) : (
                            products.map((product, index) => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    index={index}
                                    isSelected={selectedProducts.has(product.id)}
                                    onToggle={() => toggleProduct(product.id)}
                                    onDelete={() => handleDelete(product.id)}
                                    onToggleLatest={() => toggleLatestStatus(product.id, product.is_latest)}
                                    onToggleBestSeller={() => toggleBestSellerStatus(product.id, product.is_best_seller)}
                                    lastProductRef={products.length === index + 1 ? lastProductRef : null}
                                />
                            ))
                        )}
                    </AnimatePresence>
                </div>
            )}

            {loadingMore && (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <Loader2 className="animate-spin" style={{ width: '40px', height: '40px', color: 'var(--primary)', margin: '0 auto' }} />
                </div>
            )}

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .animate-spin { animation: spin 1s linear infinite; }
                .custom-checkbox {
                    appearance: none; -webkit-appearance: none;
                    width: 26px; height: 26px;
                    border: 2px solid rgba(255,255,255,0.2);
                    border-radius: 8px; background: rgba(0,0,0,0.4);
                    cursor: pointer; position: relative; transition: 0.3s;
                }
                .custom-checkbox:checked { background: var(--primary); border-color: var(--primary); }
                .custom-checkbox:checked::after {
                    content: '✓'; position: absolute; color: #000;
                    font-size: 16px; font-weight: 900; left: 5px; top: 0;
                }
            `}</style>
        </div>
    );
};

const ProductCard = ({ product, index, isSelected, onToggle, onDelete, onToggleLatest, onToggleBestSeller, lastProductRef }) => {
    const isMobile = window.innerWidth < 768;
    return (
        <motion.div
            ref={lastProductRef}
            layout
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.4, delay: (index % 6) * 0.05 }}
            style={{
                borderRadius: '28px', background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border-color)', overflow: 'hidden',
                display: 'flex', flexDirection: 'column', position: 'relative',
                backdropFilter: 'blur(10px)', boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
            }}
        >
            {/* Visual Header */}
            <div style={{ position: 'relative', height: isMobile ? '220px' : '280px', overflow: 'hidden' }}>
                <img
                    src={product.imageUrl || (product.images && product.images[0]) || 'https://placehold.co/600x600/1a1a1a/ffffff?text=Premium+Watch'}
                    alt={product.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: '0.5s' }}
                />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.4), transparent 40%, transparent 60%, rgba(0,0,0,0.8))' }} />

                {/* ID Badge */}
                <div style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(212, 175, 55, 0.9)', color: '#000', padding: '6px 14px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '900', backdropFilter: 'blur(5px)' }}>
                    #{product.displayId || '---'}
                </div>

                {/* Selection Checkbox & Latest Toggle */}
                <div style={{ position: 'absolute', top: '16px', left: '16px', display: 'flex', gap: '8px' }}>
                    <input type="checkbox" checked={isSelected} onChange={onToggle} className="custom-checkbox" />
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => { e.stopPropagation(); onToggleLatest(); }}
                        style={{
                            width: '26px', height: '26px', borderRadius: '8px',
                            background: product.is_latest ? 'var(--primary)' : 'rgba(0,0,0,0.4)',
                            border: '2px solid ' + (product.is_latest ? 'var(--primary)' : 'rgba(255,255,255,0.2)'),
                            color: product.is_latest ? '#000' : 'rgba(255,255,255,0.5)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                            fontSize: '14px', transition: '0.3s'
                        }}
                    >
                        <Star size={14} fill={product.is_latest ? 'currentColor' : 'transparent'} />
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => { e.stopPropagation(); onToggleBestSeller(); }}
                        style={{
                            width: '26px', height: '26px', borderRadius: '8px',
                            background: product.is_best_seller ? '#f97316' : 'rgba(0,0,0,0.4)',
                            border: '2px solid ' + (product.is_best_seller ? '#f97316' : 'rgba(255,255,255,0.2)'),
                            color: product.is_best_seller ? '#fff' : 'rgba(255,255,255,0.5)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                            fontSize: '14px', transition: '0.3s'
                        }}
                    >
                        <Flame size={14} fill={product.is_best_seller ? 'currentColor' : 'transparent'} />
                    </motion.button>
                </div>

                {/* Discount Badge */}
                {product.old_price && Number(product.old_price) > Number(product.price) && (
                    <div style={{ position: 'absolute', bottom: '16px', right: '16px', background: '#ef4444', color: '#fff', padding: '6px 12px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: '900', boxShadow: '0 4px 15px rgba(239,68,68,0.4)' }}>
                        خصم {Math.round(((Number(product.old_price) - Number(product.price)) / Number(product.old_price)) * 100)}%
                    </div>
                )}

            </div>

            {/* Card Content */}
            <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#fff', flex: 1 }}>{product.name}</h3>
                    <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: '1.6rem', fontWeight: '950', color: 'var(--primary)', lineHeight: 1 }}>
                            {Number(product.price).toLocaleString()}
                            <span style={{ fontSize: '0.9rem', fontWeight: '600', marginRight: '4px' }}>ر.س</span>
                        </div>
                        {product.old_price && Number(product.old_price) > Number(product.price) && (
                            <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.3)', textDecoration: 'line-through', fontWeight: '600' }}>
                                {Number(product.old_price).toLocaleString()} ر.س
                            </span>
                        )}
                    </div>
                </div>

                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.7', marginBottom: '24px', height: '48px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {product.description || 'لا يوجد وصف متاح لهذا المنتج الملكي.'}
                </p>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
                    <Link to={`/products/edit/${product.id}`} style={{ flex: 1, textDecoration: 'none' }}>
                        <motion.button whileHover={{ y: -3, background: 'rgba(255,255,255,0.08)' }} style={{ width: '100%', height: '50px', borderRadius: '14px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)', color: '#fff', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                            <Edit size={18} /> تعديل القطعة
                        </motion.button>
                    </Link>
                    <motion.button
                        whileHover={{ scale: 1.05, background: '#ef4444', color: '#fff' }}
                        onClick={onDelete}
                        style={{ width: '50px', height: '50px', borderRadius: '14px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <Trash2 size={20} />
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );
};

export default Products;
