import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLoading } from '../context/LoadingContext';
import { supabase } from '../supabase/client';
import Swal from 'sweetalert2';
import { 
    Plus, Trash2, Edit, Loader2, Search, Layers, Users, 
    Activity, ShoppingBag, Clock, Filter, LayoutGrid, 
    LayoutList, Check, MoreVertical, Package, ArrowUpRight,
    TrendingUp, Star, Box, Tag, Flame
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { deleteFromCloudinary } from '../utils/cloudinary';
import { Link } from 'react-router-dom';
import FilterBar from '../components/FilterBar';

const Products = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
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
    const [filterType, setFilterType] = useState('all');
    const [filterStyle, setFilterStyle] = useState('all');
    const [sortPrice, setSortPrice] = useState('none');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProducts, setSelectedProducts] = useState(new Set());
    const [totalMatchingCount, setTotalMatchingCount] = useState(0);

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
            const { count: total } = await supabase.from('products').select('*', { count: 'exact', head: true });
            const { count: men } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('category', 'men');
            const { count: women } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('category', 'women');
            const { count: kids } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('category', 'kids');

            setTotalStats({ total: total || 0, men: men || 0, women: women || 0, kids: kids || 0 });
        } catch (error) {
            console.error("Stats fetch error:", error);
        }
    };

    const buildQuery = (selectString = '*', { count = null, head = false } = {}) => {
        let query = supabase.from('products').select(selectString, { count, head });

        if (filterType !== 'all') query = query.eq('category', filterType);
        if (filterStyle !== 'all') query = query.eq('style', filterStyle);
        if (minPrice !== '') query = query.gte('price', Number(minPrice));
        if (maxPrice !== '') query = query.lte('price', Number(maxPrice));
        if (searchQuery) {
            if (!isNaN(searchQuery)) {
                query = query.or(`name.ilike.%${searchQuery}%,displayId.eq.${searchQuery}`);
            } else {
                query = query.ilike('name', `%${searchQuery}%`);
            }
        }
        return query;
    };

    const fetchProducts = async (pageNum, isInitial = false) => {
        if (isInitial) {
            startLoading();
            setLoading(true);
        } else {
            setLoadingMore(true);
        }

        try {
            let query = buildQuery('*', { count: 'exact' });

            // Apply Sorting
            if (sortPrice === 'asc') query = query.order('price', { ascending: true });
            else if (sortPrice === 'desc') query = query.order('price', { ascending: false });
            else query = query.order('created_at', { ascending: false });

            const from = pageNum * 6;
            const to = from + 5;
            const { data, error, count } = await query.range(from, to);

            if (error) throw error;

            if (isInitial) {
                setProducts(data || []);
                setTotalMatchingCount(count || 0);
            } else {
                setProducts(prev => [...prev, ...data]);
            }

            setHasMore(count > to + 1);
        } catch (error) {
            console.error(error);
            Swal.fire({
                icon: 'error',
                title: 'خطأ',
                text: 'فشل تحميل المنتجات من قاعدة البيانات',
                background: '#141414',
                color: '#fff'
            });
        } finally {
            if (isInitial) {
                setLoading(false);
                stopLoading();
            } else {
                setLoadingMore(false);
            }
        }
    };

    // Filter changes
    useEffect(() => {
        setPage(0);
        fetchProducts(0, true);
        fetchStats();
    }, [filterType, filterStyle, sortPrice, minPrice, maxPrice, searchQuery]);

    // Page changes
    useEffect(() => {
        if (page > 0) {
            fetchProducts(page);
        }
    }, [page]);

    useEffect(() => {
        const subscription = supabase
            .channel('products-realtime')
            .on(
                'postgres_changes',
                { event: '*', table: 'products', schema: 'public' },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        setPage(0);
                        fetchProducts(0, true);
                        fetchStats();
                    } else if (payload.eventType === 'UPDATE') {
                        setProducts(prev => prev.map(p => p.id === payload.new.id ? { ...p, ...payload.new } : p));
                    } else if (payload.eventType === 'DELETE') {
                        setProducts(prev => prev.filter(p => p.id !== payload.old.id));
                        fetchStats();
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, []);

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
                const { data: productToDelete, error: fetchError } = await supabase
                    .from('products')
                    .select('video, images, imageUrl')
                    .eq('id', id)
                    .single();

                if (!fetchError && productToDelete) {
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

                const { error } = await supabase
                    .from('products')
                    .delete()
                    .eq('id', id);

                if (error) throw error;

                setProducts(prev => prev.filter(p => p.id !== id));
                fetchStats();
                Swal.fire({ title: 'تم الحذف بنجاح', icon: 'success', background: '#141414', color: '#fff' });
            } catch (error) {
                console.error(error);
                Swal.fire({ icon: 'error', title: 'خطأ', text: 'فشل الحذف', background: '#141414', color: '#fff' });
            } finally {
                stopLoading();
            }
        }
    };

    const toggleBestSellerStatus = async (id, currentStatus) => {
        startLoading();
        try {
            const { error } = await supabase
                .from('products')
                .update({ is_best_seller: !currentStatus })
                .eq('id', id);

            if (error) throw error;
            
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
            Swal.fire({ icon: 'error', title: 'خطأ', text: 'فشل تحديث الحالة', background: '#141414', color: '#fff' });
        } finally {
            stopLoading();
        }
    };

    const toggleLatestStatus = async (id, currentStatus) => {
        startLoading();
        try {
            const { error } = await supabase
                .from('products')
                .update({ is_latest: !currentStatus })
                .eq('id', id);

            if (error) throw error;
            
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

    const toggleAll = async () => {
        if (selectedProducts.size === totalMatchingCount && totalMatchingCount > 0) {
            setSelectedProducts(new Set());
        } else {
            startLoading();
            try {
                let query = buildQuery('id');
                const { data, error } = await query;

                if (error) throw error;

                if (data) {
                    setSelectedProducts(new Set(data.map(p => p.id)));
                    Swal.fire({
                        title: 'تم تحديد الكل',
                        text: `تم تحديد ${data.length} منتج`,
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
                stopLoading();
            }
        }
    };

    const handleBulkDelete = async () => {
        const result = await Swal.fire({
            title: 'هل أنت متأكد؟',
            text: `سيتم حذف ${selectedProducts.size} من المنتجات نهائياً!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'نعم، احذف المحدد',
            cancelButtonText: 'إلغاء',
            background: '#141414',
            color: '#fff',
            confirmButtonColor: '#ef4444',
            cancelButtonColor: 'rgba(255,255,255,0.1)'
        });

        if (result.isConfirmed) {
            startLoading();
            try {
                // Fetch media to delete
                const { data: productsToDelete, error: fetchError } = await supabase
                    .from('products')
                    .select('id, video, images, imageUrl')
                    .in('id', Array.from(selectedProducts));

                if (!fetchError && productsToDelete) {
                    for (const product of productsToDelete) {
                        if (product.video && product.video.includes('cloudinary')) {
                            await deleteFromCloudinary(product.video, 'video');
                        }
                        const imagesToDelete = new Set(product.images || []);
                        if (product.imageUrl) imagesToDelete.add(product.imageUrl);
                        for (const img of imagesToDelete) {
                            if (img && img.includes('cloudinary')) {
                                await deleteFromCloudinary(img, 'image');
                            }
                        }
                    }
                }

                const { error } = await supabase
                    .from('products')
                    .delete()
                    .in('id', Array.from(selectedProducts));

                if (error) throw error;

                setProducts(prev => prev.filter(p => !selectedProducts.has(p.id)));
                setSelectedProducts(new Set());
                fetchStats();
                Swal.fire({ title: 'تم الحذف بنجاح', icon: 'success', background: '#141414', color: '#fff' });
            } catch (error) {
                console.error(error);
                Swal.fire({ icon: 'error', title: 'خطأ', text: 'فشل الحذف الجماعي', background: '#141414', color: '#fff' });
            } finally {
                stopLoading();
            }
        }
    };

    const summaryStats = [
        { label: 'إجمالي المخزون', value: totalStats.total, icon: <Package size={22} />, color: 'var(--primary)', bg: 'rgba(212, 175, 55, 0.1)' },
        { label: 'ساعات رجالية', value: totalStats.men, icon: <Users size={22} />, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
        { label: 'ساعات نسائية', value: totalStats.women, icon: <ShoppingBag size={22} />, color: '#ec4899', bg: 'rgba(236, 72, 153, 0.1)' },
        { label: 'ساعات أطفال', value: totalStats.kids, icon: <Activity size={22} />, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
    ];

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
                            <button onClick={toggleAll} style={{ flex: 1, padding: '12px 10px', borderRadius: '14px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#fff', fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem' }}>
                                {selectedProducts.size === totalMatchingCount ? 'إلغاء' : 'تحديد الكل'}
                            </button>
                            <button onClick={handleBulkDelete} style={{ flex: 1.5, padding: '12px 10px', borderRadius: '14px', background: '#ef4444', border: 'none', color: '#fff', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.85rem' }}>
                                <Trash2 size={16} /> حذف ({selectedProducts.size})
                            </button>
                        </motion.div>
                    ) : (
                        <Link to="/products/add" style={{ textDecoration: 'none', width: '100%' }}>
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={{ width: '100%', padding: '14px 20px', borderRadius: '16px', background: 'var(--primary)', color: '#000', border: 'none', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 10px 25px rgba(212, 175, 55, 0.2)', fontSize: '0.9rem' }}>
                                <Plus size={20} /> إضافة ساعة جديدة
                            </motion.button>
                        </Link>
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
                filterType={filterType} setFilterType={setFilterType}
                filterStyle={filterStyle} setFilterStyle={setFilterStyle}
                minPrice={minPrice} setMinPrice={setMinPrice}
                maxPrice={maxPrice} setMaxPrice={setMaxPrice}
                sortPrice={sortPrice} setSortPrice={setSortPrice}
            />

            {loading ? (
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

                {/* Style Tag */}
                <div style={{ position: 'absolute', bottom: '16px', left: '16px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', color: '#fff', padding: '6px 14px', borderRadius: '50px', fontSize: '0.75rem', fontWeight: '700' }}>
                    {product.style === 'classic' ? 'كلاسيكي' : product.style === 'formal' ? 'رسمي' : 'عرض خاص'}
                </div>
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
