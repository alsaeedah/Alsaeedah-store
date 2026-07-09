import React from 'react';
import { Search, ArrowUpDown, DollarSign, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';

const FilterBar = ({
    searchQuery, setSearchQuery,
    filterType, setFilterType,
    filterStyle, setFilterStyle,
    minPrice, setMinPrice,
    maxPrice, setMaxPrice,
    sortPrice, setSortPrice
}) => {
    const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);

    React.useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div
            className="glass-card"
            style={{
                padding: isMobile ? '16px' : '24px',
                marginBottom: isMobile ? '24px' : '40px',
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: 'space-between',
                gap: isMobile ? '16px' : '24px',
                alignItems: isMobile ? 'stretch' : 'center',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '24px',
                backdropFilter: 'blur(10px)',
                border: '1px solid var(--border-color)'
            }}
        >
            {/* Search Section */}
            <div style={{ position: 'relative', minWidth: isMobile ? '100%' : '320px', flex: isMobile ? 'none' : 1.5 }}>
                <Search size={18} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.7 }} />
                <input
                    type="text"
                    placeholder="بحث في المخزون..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '12px 48px 12px 16px',
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '14px',
                        color: '#fff',
                        fontSize: '0.95rem',
                        outline: 'none',
                        transition: '0.3s',
                        fontFamily: 'inherit'
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                />
            </div>

            {/* Filters Section */}
            <div style={{ 
                display: 'flex', 
                gap: isMobile ? '10px' : '15px', 
                alignItems: 'center', 
                flexWrap: 'wrap',
                flexDirection: isMobile ? 'column' : 'row'
            }}>
                <div style={{ 
                    display: 'flex', 
                    gap: '4px', 
                    background: 'rgba(255,255,255,0.03)', 
                    padding: '4px', 
                    borderRadius: '16px', 
                    border: '1px solid var(--border-color)',
                    width: isMobile ? '100%' : 'auto',
                    overflowX: 'auto'
                }}>
                    {[
                        { label: 'الكل', value: 'all' },
                        { label: 'رجالي', value: 'men' },
                        { label: 'نسائي', value: 'women' },
                        { label: 'أطفال', value: 'kids' }
                    ].map(type => (
                        <button
                            key={type.value}
                            onClick={() => setFilterType(type.value)}
                            style={{
                                flex: isMobile ? 1 : 'none',
                                padding: isMobile ? '8px 12px' : '10px 22px',
                                borderRadius: '12px',
                                border: 'none',
                                background: filterType === type.value ? 'var(--primary)' : 'transparent',
                                color: filterType === type.value ? '#000' : 'var(--text-muted)',
                                cursor: 'pointer',
                                transition: 'all 0.3s',
                                fontSize: isMobile ? '0.8rem' : '0.9rem',
                                fontWeight: '700',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {type.label}
                        </button>
                    ))}
                </div>

                <div style={{ 
                    display: 'flex', 
                    gap: '10px', 
                    width: isMobile ? '100%' : 'auto',
                    flexDirection: isMobile ? 'row' : 'row'
                }}>
                    <select
                        value={filterStyle}
                        onChange={(e) => setFilterStyle(e.target.value)}
                        style={{
                            flex: isMobile ? 1 : 'none',
                            padding: '12px 15px',
                            borderRadius: '14px',
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid var(--border-color)',
                            color: '#fff',
                            cursor: 'pointer',
                            outline: 'none',
                            fontSize: '0.9rem',
                            fontWeight: '600'
                        }}
                    >
                        <option value="all" style={{ background: '#141414' }}>النمط</option>
                        <option value="classic" style={{ background: '#141414' }}>كلاسيكي</option>
                        <option value="formal" style={{ background: '#141414' }}>رسمي</option>
                        <option value="wedding" style={{ background: '#141414' }}>عرائسي</option>
                    </select>

                    <button
                        onClick={() => setSortPrice(prev => prev === 'asc' ? 'desc' : prev === 'desc' ? 'none' : 'asc')}
                        style={{ 
                            width: '48px', height: '48px', borderRadius: '14px', 
                            background: sortPrice !== 'none' ? 'var(--primary)' : 'rgba(255,255,255,0.03)', 
                            border: '1px solid var(--border-color)', 
                            color: sortPrice !== 'none' ? '#000' : 'var(--text-muted)', 
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: '0.3s',
                            flexShrink: 0
                        }}
                    >
                        <ArrowUpDown size={18} />
                    </button>
                </div>

                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    padding: '10px 16px', 
                    background: 'rgba(255,255,255,0.03)', 
                    borderRadius: '14px', 
                    border: '1px solid var(--border-color)',
                    width: isMobile ? '100%' : 'auto',
                    justifyContent: 'center'
                }}>
                    <DollarSign size={16} color="var(--primary)" />
                    <input
                        type="number"
                        placeholder="الأدنى"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        style={{ width: '100%', background: 'transparent', border: 'none', color: '#fff', textAlign: 'center', outline: 'none', fontSize: '0.9rem' }}
                    />
                    <span style={{ color: 'var(--border-color)' }}>|</span>
                    <input
                        type="number"
                        placeholder="الأقصى"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        style={{ width: '100%', background: 'transparent', border: 'none', color: '#fff', textAlign: 'center', outline: 'none', fontSize: '0.9rem' }}
                    />
                </div>

                {/* Reset Action */}
                {(searchQuery || filterType !== 'all' || filterStyle !== 'all' || minPrice || maxPrice || sortPrice !== 'none') && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={() => {
                            setSearchQuery('');
                            setFilterType('all');
                            setFilterStyle('all');
                            setMinPrice('');
                            setMaxPrice('');
                            setSortPrice('none');
                        }}
                        style={{
                            width: isMobile ? '100%' : 'auto',
                            padding: '12px 20px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            borderRadius: '14px',
                            color: '#ef4444',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            fontSize: '0.9rem',
                            fontWeight: '700'
                        }}
                    >
                        <RotateCcw size={16} /> تهيئة الفلاتر
                    </motion.button>
                )}
            </div>
        </div>
    );
};

export default FilterBar;
