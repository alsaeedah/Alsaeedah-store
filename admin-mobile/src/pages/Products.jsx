import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase/client';
import { useLoading } from '../context/LoadingContext';
import { motion } from 'framer-motion';
import { Search, Plus, Package, Edit, Trash2, X } from 'lucide-react';
import Swal from 'sweetalert2';

const statusConfig = {
    active: { label: 'متاح', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
    low: { label: 'منخفض', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
    out: { label: 'نفد', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
};

const getStockStatus = (stock) => {
    if (stock <= 0) return 'out';
    if (stock <= 10) return 'low';
    return 'active';
};

const Products = () => {
    const { startLoading, stopLoading } = useLoading();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState('الكل');
    const [categories, setCategories] = useState(['الكل']);

    const fetchProducts = async () => {
        startLoading();
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const prods = data || [];
            setProducts(prods);

            // Extract unique categories
            const cats = ['الكل', ...new Set(prods.map(p => p.category).filter(Boolean))];
            setCategories(cats);
        } catch (err) {
            console.error('Products fetch error:', err);
        } finally {
            setLoading(false);
            stopLoading();
        }
    };

    useEffect(() => { fetchProducts(); }, []);

    const handleDelete = (product) => {
        Swal.fire({
            title: 'حذف المنتج',
            text: `هل تريد حذف "${product.name}"؟`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: 'rgba(255,255,255,0.1)',
            confirmButtonText: 'حذف',
            cancelButtonText: 'إلغاء',
            background: '#141414',
            color: '#fff',
        }).then(async (result) => {
            if (result.isConfirmed) {
                const { error } = await supabase.from('products').delete().eq('id', product.id);
                if (!error) {
                    Swal.fire({ title: 'تم الحذف', icon: 'success', background: '#141414', color: '#fff', timer: 1500, showConfirmButton: false });
                    fetchProducts();
                }
            }
        });
    };

    const filtered = products.filter((p) => {
        const matchCat = activeCategory === 'الكل' || p.category === activeCategory;
        const matchSearch = !search || p.name?.includes(search) || p.id?.toString().includes(search);
        return matchCat && matchSearch;
    });

    return (
        <div>
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">المنتجات</h1>
                    <p className="page-subtitle">{products.length} منتج إجمالاً</p>
                </div>
                <button className="btn-primary" style={{ padding: '10px 14px' }}>
                    <Plus size={18} />
                    <span>إضافة</span>
                </button>
            </div>

            {/* Search */}
            <div className="search-wrap">
                <Search size={16} color="var(--text-muted)" />
                <input
                    className="search-input"
                    placeholder="بحث عن منتج..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                    <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                        <X size={16} />
                    </button>
                )}
            </div>

            {/* Category Chips */}
            <div className="chips-row">
                {categories.map((cat) => (
                    <button
                        key={cat}
                        className={`chip ${activeCategory === cat ? 'active' : ''}`}
                        onClick={() => setActiveCategory(cat)}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                {filtered.length} نتيجة
            </p>

            {/* Loading */}
            {loading && (
                <div className="spinner-wrap"><div className="spinner" /></div>
            )}

            {/* Empty */}
            {!loading && filtered.length === 0 && (
                <div className="empty-state">
                    <Package size={44} className="empty-state-icon" />
                    <p className="empty-state-text">لا توجد منتجات</p>
                    <p className="empty-state-sub">جرب تغيير الفلتر أو كلمة البحث</p>
                </div>
            )}

            {/* Product List */}
            {!loading && filtered.map((product, idx) => {
                const stockStatus = getStockStatus(product.stock || 0);
                const cfg = statusConfig[stockStatus];
                const imageUrl = product.image_url || product.images?.[0];

                return (
                    <motion.div
                        key={product.id}
                        className="list-item"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.04 }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {/* Product Image / Icon */}
                            <div style={{
                                width: '52px', height: '52px', borderRadius: '12px',
                                background: imageUrl ? 'transparent' : 'rgba(212,175,55,0.08)',
                                border: '1px solid rgba(212,175,55,0.15)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0, overflow: 'hidden',
                            }}>
                                {imageUrl ? (
                                    <img src={imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <Package size={24} color="#d4af37" />
                                )}
                            </div>

                            {/* Info */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{
                                    fontSize: '14px', fontWeight: '600', color: 'var(--text-main)',
                                    marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                }}>
                                    {product.name}
                                </p>
                                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                                    {product.category || 'بدون تصنيف'} • مخزون: {product.stock || 0}
                                </p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--primary)' }}>
                                        {Number(product.price || 0).toLocaleString()} ر.س
                                    </span>
                                    <span className="badge" style={{ background: cfg.bg, color: cfg.color }}>
                                        {cfg.label}
                                    </span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                                <button
                                    onClick={(e) => { e.stopPropagation(); }}
                                    style={{
                                        width: '34px', height: '34px', borderRadius: '10px',
                                        background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.15)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                                    }}
                                >
                                    <Edit size={15} color="#d4af37" />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDelete(product); }}
                                    style={{
                                        width: '34px', height: '34px', borderRadius: '10px',
                                        background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                                    }}
                                >
                                    <Trash2 size={15} color="#ef4444" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                );
            })}

            <div style={{ height: '8px' }} />
        </div>
    );
};

export default Products;
