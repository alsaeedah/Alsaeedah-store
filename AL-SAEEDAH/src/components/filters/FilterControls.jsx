import { Filter, SlidersHorizontal, DollarSign, Search, X } from 'lucide-react';
import './filters.css';

export default function FilterControls({
    filterCategoryIds, setFilterCategoryIds,
    filterBrandIds, setFilterBrandIds,
    minPrice, setMinPrice,
    maxPrice, setMaxPrice,
    searchQuery, setSearchQuery,
    activeCategories, activeBrands,
    onClear, hideCategoryFilter
}) {
    const handleCategoryToggle = (id) => {
        setFilterCategoryIds(prev => {
            if (id === null) return [];
            return prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id];
        });
    };

    const handleBrandToggle = (id) => {
        setFilterBrandIds(prev => {
            if (id === null) return [];
            return prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id];
        });
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Search */}
            <div className="filter-section">
                <div className="filter-section-title">
                    <Search size={18} /> بحث
                </div>
                <input
                    type="text"
                    placeholder="الاسم أو رقم المنتج..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="price-input"
                />
            </div>

            {/* Category */}
            {!hideCategoryFilter && activeCategories.length > 0 && (
                <div className="filter-section">
                    <div className="filter-section-title">
                        <Filter size={18} /> الأقسام
                    </div>
                    <div className="filter-radio-group">
                        <label className="filter-radio-label">
                            <input 
                                type="checkbox" 
                                className="filter-radio-input"
                                checked={filterCategoryIds.length === 0}
                                onChange={() => handleCategoryToggle(null)}
                            />
                            الكل
                        </label>
                        {activeCategories.map(cat => (
                            <label key={cat.id} className="filter-radio-label">
                                <input 
                                    type="checkbox" 
                                    className="filter-radio-input"
                                    checked={filterCategoryIds.includes(cat.id)}
                                    onChange={() => handleCategoryToggle(cat.id)}
                                />
                                {cat.name}
                            </label>
                        ))}
                    </div>
                </div>
            )}

            {/* Brand */}
            {activeBrands.length > 0 && (
                <div className="filter-section">
                    <div className="filter-section-title">
                        <SlidersHorizontal size={18} /> الماركات
                    </div>
                    <div className="filter-radio-group">
                        <label className="filter-radio-label">
                            <input 
                                type="checkbox" 
                                className="filter-radio-input"
                                checked={filterBrandIds.length === 0}
                                onChange={() => handleBrandToggle(null)}
                            />
                            الكل
                        </label>
                        {activeBrands.map(brand => (
                            <label key={brand.id} className="filter-radio-label">
                                <input 
                                    type="checkbox" 
                                    className="filter-radio-input"
                                    checked={filterBrandIds.includes(brand.id)}
                                    onChange={() => handleBrandToggle(brand.id)}
                                />
                                {brand.name}
                            </label>
                        ))}
                    </div>
                </div>
            )}

            {/* Price Range */}
            <div className="filter-section">
                <div className="filter-section-title">
                    <DollarSign size={18} /> السعر
                </div>
                <div className="price-inputs">
                    <input
                        type="number"
                        placeholder="من"
                        value={minPrice}
                        min="0"
                        onChange={(e) => {
                            const val = e.target.value;
                            if (val === '' || Number(val) >= 0) setMinPrice(val);
                        }}
                        className="price-input"
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
                        className="price-input"
                    />
                </div>
            </div>

            {/* Clear Button */}
            <button onClick={onClear} className="clear-filters-btn">
                <X size={16} /> مسح الفلاتر
            </button>
        </div>
    );
}
