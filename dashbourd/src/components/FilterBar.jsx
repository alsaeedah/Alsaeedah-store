import React, { useEffect, useState } from 'react';
import {
    Search,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    DollarSign,
    RotateCcw,
    SlidersHorizontal,
    Layers,
    Tag,
    X,
    ChevronDown,
    Sparkles,
    Filter
} from 'lucide-react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { useStore } from 'zustand';
import { taxonomyStore, GENDERS } from 'shared/taxonomy';
import { getAvailableBrandIds } from '../services/productService';
import './FilterBar.css';

const FilterBar = ({
    searchQuery, setSearchQuery,
    genderId, setGenderId,
    categoryId, setCategoryId,
    brandId, setBrandId,
    minPrice, setMinPrice,
    maxPrice, setMaxPrice,
    sortPrice, setSortPrice
}) => {
    const [availableBrandIds, setAvailableBrandIds] = useState(null);
    const [loadingBrands, setLoadingBrands] = useState(false);

    const categories = useStore(taxonomyStore, state => state.categories);
    const brands = useStore(taxonomyStore, state => state.brands);
    const initialized = useStore(taxonomyStore, state => state.initialized);
    const storeStatus = useStore(taxonomyStore, state => state.status);

    useEffect(() => {
        if (!initialized && storeStatus === 'idle') {
            taxonomyStore.getState().fetchTaxonomies && taxonomyStore.getState().fetchTaxonomies(taxonomyStore.getState().repository);
        }
    }, [initialized, storeStatus]);

    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => {
        if (categoryId === 'all') {
            setAvailableBrandIds(null);
            setBrandId('all');
        } else {
            setLoadingBrands(true);
            setBrandId('all'); // Reset brand when category changes
            getAvailableBrandIds([categoryId])
                .then(ids => {
                    setAvailableBrandIds(ids);
                })
                .catch(err => {
                    console.error("Failed to fetch available brands:", err);
                    setAvailableBrandIds([]);
                })
                .finally(() => {
                    setLoadingBrands(false);
                });
        }
    }, [categoryId, setBrandId]);
    /* eslint-enable react-hooks/set-state-in-effect */

    const activeCategories = categories.filter(c => c.active);
    const displayedBrands = availableBrandIds 
        ? brands.filter(b => b.active && availableBrandIds.includes(b.id)) 
        : [];

    // Filter Active Indicators
    const isSearchActive = Boolean(searchQuery && searchQuery.trim());
    const isGenderActive = genderId !== 'all';
    const isCategoryActive = categoryId !== 'all';
    const isBrandActive = brandId !== 'all';
    const isPriceActive = Boolean(minPrice !== '' || maxPrice !== '');
    const isSortActive = sortPrice !== 'none';

    const activeCount = (isSearchActive ? 1 : 0) +
        (isGenderActive ? 1 : 0) +
        (isCategoryActive ? 1 : 0) +
        (isBrandActive ? 1 : 0) +
        (isPriceActive ? 1 : 0) +
        (isSortActive ? 1 : 0);

    const hasActiveFilters = activeCount > 0;

    const handleResetAll = () => {
        setSearchQuery('');
        setGenderId('all');
        setCategoryId('all');
        setBrandId('all');
        setMinPrice('');
        setMaxPrice('');
        setSortPrice('none');
    };

    const handleSortCycle = () => {
        setSortPrice(prev => (prev === 'asc' ? 'desc' : prev === 'desc' ? 'none' : 'asc'));
    };

    // Label resolvers for active chips
    const selectedGender = GENDERS.find(g => g.id === genderId);
    const selectedCategory = categories.find(c => c.id === categoryId);
    const selectedBrand = brands.find(b => b.id === brandId);

    return (
        <div className={`sf-panel ${hasActiveFilters ? 'sf-has-active-filters' : ''}`}>
            {/* Header */}
            <div className="sf-header">
                <div className="sf-header-start">
                    <div className="sf-icon-badge">
                        <SlidersHorizontal size={18} />
                    </div>
                    <div className="sf-header-text">
                        <h3 className="sf-title">تصفية المنتجات</h3>
                        {hasActiveFilters && (
                            <span className="sf-active-count-badge">
                                {activeCount} {activeCount === 1 ? 'فلتر نشط' : 'فلاتر نشطة'}
                            </span>
                        )}
                    </div>
                </div>

                <div className="sf-header-actions">
                    <AnimatePresence>
                        {hasActiveFilters && (
                            <Motion.button
                                initial={{ opacity: 0, scale: 0.9, y: -4 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: -4 }}
                                transition={{ duration: 0.18 }}
                                type="button"
                                className="sf-btn-reset"
                                onClick={handleResetAll}
                                title="إعادة تعيين جميع الفلاتر"
                            >
                                <RotateCcw size={14} />
                                <span>تهيئة الفلاتر</span>
                            </Motion.button>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Search Input Bar */}
            <div className="sf-search-row">
                <Search size={18} className="sf-search-icon" />
                <input
                    type="text"
                    className="sf-search-input"
                    placeholder="بحث في المخزون بالاسم، الماركة، أو المواصفات..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    aria-label="بحث في المخزون"
                />
                {searchQuery && (
                    <button
                        type="button"
                        className="sf-search-clear"
                        onClick={() => setSearchQuery('')}
                        title="مسح البحث"
                        aria-label="مسح البحث"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>

            {/* Controls Grid */}
            <div className="sf-controls-grid">
                {/* 1. Target Audience (Gender) Segmented Capsule */}
                <div className="sf-field-group">
                    <span className="sf-field-label">
                        <Sparkles size={13} />
                        الفئة المستهدفة
                    </span>
                    <div className="sf-segmented-pills" role="radiogroup" aria-label="الفئة المستهدفة">
                        <button
                            type="button"
                            className={`sf-segmented-pill ${genderId === 'all' ? 'sf-active' : ''}`}
                            onClick={() => setGenderId('all')}
                            aria-checked={genderId === 'all'}
                            role="radio"
                        >
                            الكل
                        </button>
                        {GENDERS.map(gender => (
                            <button
                                key={gender.id}
                                type="button"
                                className={`sf-segmented-pill ${genderId === gender.id ? 'sf-active' : ''}`}
                                onClick={() => setGenderId(gender.id)}
                                aria-checked={genderId === gender.id}
                                role="radio"
                            >
                                {gender.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 2. Category Dropdown */}
                <div className="sf-field-group">
                    <label htmlFor="sf-category-select" className="sf-field-label">
                        <Layers size={13} />
                        القسم / الفئة
                    </label>
                    <div className="sf-select-container">
                        <Layers size={16} className="sf-select-icon" />
                        <select
                            id="sf-category-select"
                            className={`sf-select ${isCategoryActive ? 'sf-selected' : ''}`}
                            value={categoryId}
                            onChange={(e) => setCategoryId(e.target.value)}
                            aria-label="اختر الفئة"
                        >
                            <option value="all">كل الفئات</option>
                            {activeCategories.map(cat => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                        <ChevronDown size={15} className="sf-select-chevron" />
                    </div>
                </div>

                {/* 3. Brand Dropdown */}
                <div className="sf-field-group">
                    <label htmlFor="sf-brand-select" className="sf-field-label">
                        <Tag size={13} />
                        الماركة
                    </label>
                    <div className="sf-select-container">
                        <Tag size={16} className="sf-select-icon" />
                        <select
                            id="sf-brand-select"
                            className={`sf-select ${isBrandActive ? 'sf-selected' : ''}`}
                            value={brandId}
                            onChange={(e) => setBrandId(e.target.value)}
                            disabled={categoryId === 'all' || loadingBrands}
                            aria-label="اختر الماركة"
                        >
                            {categoryId === 'all' ? (
                                <option value="all">اختر القسم أولاً</option>
                            ) : loadingBrands ? (
                                <option value="all">جاري تحميل الماركات...</option>
                            ) : (
                                <>
                                    <option value="all">كل الماركات المتاحة</option>
                                    {displayedBrands.map(brand => (
                                        <option key={brand.id} value={brand.id}>
                                            {brand.name}
                                        </option>
                                    ))}
                                </>
                            )}
                        </select>
                        <ChevronDown size={15} className="sf-select-chevron" />
                    </div>
                </div>

                {/* 4. Price Range Dual Inputs */}
                <div className="sf-field-group">
                    <span className="sf-field-label">
                        <DollarSign size={13} />
                        نطاق السعر
                    </span>
                    <div className={`sf-price-container ${isPriceActive ? 'sf-active' : ''}`}>
                        <DollarSign size={15} className="sf-price-icon" />
                        <input
                            type="number"
                            className="sf-price-input"
                            placeholder="الأدنى"
                            value={minPrice}
                            onChange={(e) => setMinPrice(e.target.value)}
                            aria-label="الحد الأدنى للسعر"
                        />
                        <span className="sf-price-divider">—</span>
                        <input
                            type="number"
                            className="sf-price-input"
                            placeholder="الأقصى"
                            value={maxPrice}
                            onChange={(e) => setMaxPrice(e.target.value)}
                            aria-label="الحد الأقصى للسعر"
                        />
                    </div>
                </div>

                {/* 5. Sort by Price Toggle */}
                <div className="sf-field-group">
                    <span className="sf-field-label">
                        <ArrowUpDown size={13} />
                        ترتيب السعر
                    </span>
                    <button
                        type="button"
                        className={`sf-sort-btn ${isSortActive ? 'sf-active' : ''}`}
                        onClick={handleSortCycle}
                        title="تغيير اتجاه ترتيب السعر"
                        aria-label="تغيير اتجاه ترتيب السعر"
                    >
                        {sortPrice === 'asc' ? (
                            <>
                                <ArrowUp size={15} />
                                <span>الأقل أولاً</span>
                            </>
                        ) : sortPrice === 'desc' ? (
                            <>
                                <ArrowDown size={15} />
                                <span>الأعلى أولاً</span>
                            </>
                        ) : (
                            <>
                                <ArrowUpDown size={15} />
                                <span>الافتراضي</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Active Filters Chips Bar */}
            <AnimatePresence>
                {hasActiveFilters && (
                    <Motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="sf-active-chips-row"
                    >
                        <span className="sf-chips-label">
                            <Filter size={12} />
                            الفلاتر النشطة:
                        </span>

                        {isSearchActive && (
                            <Motion.div
                                initial={{ opacity: 0, scale: 0.85 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.85 }}
                                className="sf-chip"
                            >
                                <span className="sf-chip-tag">البحث:</span>
                                <span className="sf-chip-val">"{searchQuery}"</span>
                                <button
                                    type="button"
                                    className="sf-chip-close"
                                    onClick={() => setSearchQuery('')}
                                    title="إزالة فلتر البحث"
                                    aria-label="إزالة فلتر البحث"
                                >
                                    <X size={11} />
                                </button>
                            </Motion.div>
                        )}

                        {isGenderActive && (
                            <Motion.div
                                initial={{ opacity: 0, scale: 0.85 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.85 }}
                                className="sf-chip"
                            >
                                <span className="sf-chip-tag">الفئة:</span>
                                <span className="sf-chip-val">{selectedGender?.name || genderId}</span>
                                <button
                                    type="button"
                                    className="sf-chip-close"
                                    onClick={() => setGenderId('all')}
                                    title="إزالة فلتر الفئة"
                                    aria-label="إزالة فلتر الفئة"
                                >
                                    <X size={11} />
                                </button>
                            </Motion.div>
                        )}

                        {isCategoryActive && (
                            <Motion.div
                                initial={{ opacity: 0, scale: 0.85 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.85 }}
                                className="sf-chip"
                            >
                                <span className="sf-chip-tag">القسم:</span>
                                <span className="sf-chip-val">{selectedCategory?.name || categoryId}</span>
                                <button
                                    type="button"
                                    className="sf-chip-close"
                                    onClick={() => setCategoryId('all')}
                                    title="إزالة فلتر القسم"
                                    aria-label="إزالة فلتر القسم"
                                >
                                    <X size={11} />
                                </button>
                            </Motion.div>
                        )}

                        {isBrandActive && (
                            <Motion.div
                                initial={{ opacity: 0, scale: 0.85 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.85 }}
                                className="sf-chip"
                            >
                                <span className="sf-chip-tag">الماركة:</span>
                                <span className="sf-chip-val">{selectedBrand?.name || brandId}</span>
                                <button
                                    type="button"
                                    className="sf-chip-close"
                                    onClick={() => setBrandId('all')}
                                    title="إزالة فلتر الماركة"
                                    aria-label="إزالة فلتر الماركة"
                                >
                                    <X size={11} />
                                </button>
                            </Motion.div>
                        )}

                        {isPriceActive && (
                            <Motion.div
                                initial={{ opacity: 0, scale: 0.85 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.85 }}
                                className="sf-chip"
                            >
                                <span className="sf-chip-tag">السعر:</span>
                                <span className="sf-chip-val">
                                    {minPrice && maxPrice
                                        ? `${minPrice} - ${maxPrice}`
                                        : minPrice
                                        ? `من ${minPrice}`
                                        : `إلى ${maxPrice}`}
                                </span>
                                <button
                                    type="button"
                                    className="sf-chip-close"
                                    onClick={() => { setMinPrice(''); setMaxPrice(''); }}
                                    title="إزالة فلتر السعر"
                                    aria-label="إزالة فلتر السعر"
                                >
                                    <X size={11} />
                                </button>
                            </Motion.div>
                        )}

                        {isSortActive && (
                            <Motion.div
                                initial={{ opacity: 0, scale: 0.85 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.85 }}
                                className="sf-chip"
                            >
                                <span className="sf-chip-tag">الترتيب:</span>
                                <span className="sf-chip-val">
                                    {sortPrice === 'asc' ? 'الأقل أولاً' : 'الأعلى أولاً'}
                                </span>
                                <button
                                    type="button"
                                    className="sf-chip-close"
                                    onClick={() => setSortPrice('none')}
                                    title="إلغاء ترتيب السعر"
                                    aria-label="إلغاء ترتيب السعر"
                                >
                                    <X size={11} />
                                </button>
                            </Motion.div>
                        )}
                    </Motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default FilterBar;
