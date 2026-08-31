import { useState, useRef, useEffect } from 'react';
import { Menu, ShoppingBag, Search, X, Clock, ArrowRight } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import NavigationDrawer from './NavigationDrawer';
import logo from '../../assets/logo.png';
import { motion, AnimatePresence } from 'framer-motion';
import { useRecentSearches } from '../../hooks/useRecentSearches';

export default function MobileNavigation() {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const { cart, openCart } = useCart();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const itemCount = cart.reduce((acc, item) => acc + item.dp_qty, 0);
    const handleLogoClick = () => {
        navigate('/');
        window.scrollTo(0, 0);
    };

    return (
        <>
            <nav className="store-nav-glass nav-mobile" style={{
                padding: 'calc(10px + env(safe-area-inset-top, 0px)) 15px 10px 15px',
                justifyContent: 'space-between',
                alignItems: 'center',
                height: 'calc(75px + env(safe-area-inset-top, 0px))'
            }}>
                <AnimatePresence>
                    {!isSearchOpen && (
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }} 
                            style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}
                        >
                            {/* Menu Button */}
                            <button
                                onClick={() => setIsDrawerOpen(true)}
                                style={{ 
                                    cursor: 'pointer', background: 'transparent', border: 'none', 
                                    display: 'flex', alignItems: 'center', color: 'var(--text-main)', 
                                    minWidth: '44px', minHeight: '44px', padding: '0' 
                                }}
                                aria-label="فتح القائمة"
                            >
                                <Menu size={28} strokeWidth={1.5} />
                            </button>

                            {/* Logo Centered */}
                            <div 
                                style={{ 
                                    position: 'absolute', left: '50%', transform: 'translateX(-50%)', 
                                    display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' 
                                }} 
                                onClick={handleLogoClick}
                            >
                                <motion.img 
                                    src={logo} alt="متجر السعيدة" 
                                    style={{ width: '42px', height: '42px', objectFit: 'cover' }} 
                                    whileHover={{ scale: 1.05 }}
                                />
                                <h1 style={{ 
                                    fontSize: 'clamp(1.05rem, 4vw, 1.25rem)', fontWeight: '800', margin: 0, 
                                    fontFamily: 'var(--font-heading)', color: 'var(--primary)', whiteSpace: 'nowrap'
                                }}>
                                    متجر السعيدة
                                </h1>
                            </div>

                            {/* Actions (Search + Cart) */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <button
                                    onClick={() => setIsSearchOpen(true)}
                                    style={{ 
                                        cursor: 'pointer', background: 'transparent', border: 'none', 
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: 'var(--text-main)', minWidth: '44px', minHeight: '44px', padding: '0' 
                                    }}
                                    aria-label="بحث"
                                >
                                    <Search size={24} strokeWidth={1.5} />
                                </button>

                                <button
                                    onClick={openCart}
                                    style={{ 
                                        position: 'relative', cursor: 'pointer', background: 'transparent', 
                                        border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: 'var(--text-main)', minWidth: '44px', minHeight: '44px', padding: '0' 
                                    }}
                                    aria-label="السلة"
                                >
                                    <ShoppingBag size={26} strokeWidth={1.5} />
                                    {itemCount > 0 && (
                                        <motion.span 
                                            initial={{ scale: 0 }} animate={{ scale: 1 }}
                                            className="nav-icon-badge" style={{ top: '4px', right: '4px' }}
                                        >
                                            {itemCount > 99 ? '99+' : itemCount}
                                        </motion.span>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Search Overlay */}
                <AnimatePresence>
                    {isSearchOpen && (
                        <MobileSearchOverlay 
                            onClose={() => setIsSearchOpen(false)} 
                            initialQuery={searchParams.get('q') || ''} 
                        />
                    )}
                </AnimatePresence>
            </nav>

            <NavigationDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
        </>
    );
}

function MobileSearchOverlay({ onClose, initialQuery }) {
    const [query, setQuery] = useState(initialQuery);
    const navigate = useNavigate();
    const inputRef = useRef(null);
    const { recentSearches, addRecentSearch, removeRecentSearch, clearAllSearches } = useRecentSearches();

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    const handleSubmit = (e) => {
        e?.preventDefault();
        if (query.trim()) {
            addRecentSearch(query);
            navigate(`/search?q=${encodeURIComponent(query.trim())}`);
            onClose();
        }
    };

    const handleSuggestionClick = (term) => {
        setQuery(term);
        addRecentSearch(term);
        navigate(`/search?q=${encodeURIComponent(term)}`);
        onClose();
    };

    return (
        <motion.div 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: -20 }}
            style={{ 
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
                display: 'flex', flexDirection: 'column', 
                background: 'var(--bg-main)', zIndex: 100,
                padding: 'calc(10px + env(safe-area-inset-top, 0px)) 15px 10px 15px',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', height: '100%' }}>
                <form 
                    onSubmit={handleSubmit}
                    style={{
                        display: 'flex', alignItems: 'center', flex: 1,
                        background: 'var(--skeleton-bg)', border: '1px solid var(--border-color)',
                        borderRadius: '24px', padding: '4px 12px', height: '44px'
                    }}
                >
                    <Search size={18} color="var(--text-dim)" />
                    <input 
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="البحث عن منتجات..."
                        style={{
                            background: 'transparent', border: 'none', outline: 'none',
                            color: 'var(--text-main)', padding: '0 10px', width: '100%',
                            fontFamily: 'var(--font-main)', fontSize: '1rem'
                        }}
                    />
                    {query && (
                        <button type="button" onClick={() => setQuery('')} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', padding: '4px' }}>
                            <X size={18} />
                        </button>
                    )}
                </form>
                <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-main)', padding: '8px' }}>
                    <ArrowRight size={24} />
                </button>
            </div>

            {recentSearches.length > 0 && !query && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-main)', padding: '15px', height: '100vh', zIndex: 99 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: '600' }}>عمليات البحث الأخيرة</span>
                        <button onClick={clearAllSearches} style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: '0.9rem' }}>مسح الكل</button>
                    </div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {recentSearches.map((term, index) => (
                            <li key={index} style={{ display: 'flex', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
                                <button 
                                    onClick={() => handleSuggestionClick(term)}
                                    style={{ background: 'none', border: 'none', color: 'var(--text-main)', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '12px', flex: 1, textAlign: 'right' }}
                                >
                                    <Clock size={18} color="var(--text-dim)" />
                                    {term}
                                </button>
                                <button onClick={() => removeRecentSearch(term)} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', padding: '8px' }}>
                                    <X size={16} />
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </motion.div>
    );
}
