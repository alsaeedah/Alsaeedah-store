import { ShoppingBag, Sun, Moon, User, Heart, ChevronDown, Search, X, Clock } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useFavorites } from '../../context/FavoritesContext';
import { useTaxonomyStore } from '../../services/taxonomyService';
import { useNavigate, useLocation, Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '../../assets/logo.png';
import { useState, useRef, useEffect } from 'react';
import { useRecentSearches } from '../../hooks/useRecentSearches';

export default function DesktopNavigation() {
    const { cart, openCart } = useCart();
    const { theme, toggleTheme } = useTheme();
    const { currentUser, openAuthModal, openProfilePage } = useAuth();
    const { openWishlist, favorites } = useFavorites();
    const navigate = useNavigate();
    const location = useLocation();

    const categories = useTaxonomyStore(state => state.categories);
    const brands = useTaxonomyStore(state => state.brands);

    const itemCount = cart.reduce((acc, item) => acc + item.dp_qty, 0);

    const activeCategories = categories.filter(c => c.active !== false).sort((a, b) => (a.order || 0) - (b.order || 0));
    const activeBrands = brands.filter(b => b.active !== false).sort((a, b) => (a.order || 0) - (b.order || 0));

    const handleLogoClick = () => {
        navigate('/');
        window.scrollTo(0, 0);
    };

    return (
        <nav className="store-nav-glass nav-desktop" style={{
            padding: '10px 60px',
            gridTemplateColumns: 'auto 1fr auto',
            alignItems: 'center',
            height: '90px',
            gap: '40px'
        }}>
            {/* Logo */}
            <div 
                style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} 
                onClick={handleLogoClick}
            >
                <motion.img 
                    src={logo} 
                    alt="متجر السعيدة" 
                    style={{ 
                        width: '58px', 
                        height: '58px', 
                        objectFit: 'cover',
                        filter: 'drop-shadow(0 2px 4px rgba(212,175,55,0.2))'
                    }} 
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                />
                <h1 style={{ 
                    fontSize: '1.9rem', 
                    fontWeight: '800', 
                    margin: 0, 
                    fontFamily: 'var(--font-heading)',
                    color: 'var(--primary)',
                    letterSpacing: '0.5px',
                    textShadow: theme === 'dark' ? '0 2px 8px rgba(0,0,0,0.5)' : 'none'
                }}>
                    متجر السعيدة
                </h1>
            </div>

            {/* Links / Menus */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', justifyContent: 'center' }}>
                <Link to="/" className={`nav-desktop-link ${location.pathname === '/' ? 'active' : ''}`}>
                    الرئيسية
                </Link>
                
                {/* Categories Dropdown */}
                {activeCategories.length > 0 && (
                    <div className="nav-dropdown-container">
                        <button className="nav-desktop-link" aria-haspopup="true">
                            الأقسام
                            <ChevronDown size={16} />
                        </button>
                        <div className="nav-dropdown-menu">
                            {activeCategories.map(cat => (
                                <Link 
                                    key={cat.id} 
                                    to={`/category/${cat.slug || cat.id}`}
                                    className={`nav-dropdown-item ${location.pathname === `/category/${cat.slug || cat.id}` ? 'active' : ''}`}
                                >
                                    {cat.name}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}



            </div>

            {/* Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', justifyContent: 'flex-end' }}>
                <DesktopSearch />
                
                <ActionIcon 
                    icon={theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />} 
                    onClick={toggleTheme} 
                    title={theme === 'dark' ? 'الوضع النهاري' : 'الوضع الليلي'} 
                />
                
                <ActionIcon 
                    icon={<Heart size={20} />} 
                    onClick={openWishlist} 
                    title="المفضلة" 
                    badge={favorites.length}
                />
                
                <ActionIcon 
                    icon={<User size={20} />} 
                    onClick={currentUser ? openProfilePage : openAuthModal} 
                    title={currentUser ? 'حسابي' : 'تسجيل الدخول'} 
                />

                <motion.div
                    style={{ 
                        position: 'relative', 
                        cursor: 'pointer', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        width: '54px', 
                        height: '54px',
                        borderRadius: '50%',
                        color: 'var(--primary)', 
                        background: theme === 'dark' ? 'rgba(212,175,55,0.05)' : 'rgba(212,175,55,0.08)',
                        border: '1px solid rgba(212,175,55,0.2)',
                        transition: 'all 0.3s ease',
                        marginLeft: '8px'
                    }}
                    onClick={openCart}
                    title="السلة"
                    whileHover={{ 
                        backgroundColor: 'rgba(212,175,55,0.15)',
                        borderColor: 'rgba(212,175,55,0.5)',
                        scale: 1.05
                    }}
                    whileTap={{ scale: 0.95 }}
                >
                    <ShoppingBag size={24} strokeWidth={1.5} />
                    {itemCount > 0 && (
                        <motion.span 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="nav-icon-badge"
                        >
                            {itemCount > 99 ? '99+' : itemCount}
                        </motion.span>
                    )}
                </motion.div>
            </div>
        </nav>
    );
}

// Helper component for small action icons
function ActionIcon({ icon, onClick, title, badge }) {
    const { theme } = useTheme();
    return (
        <motion.button
            onClick={onClick}
            title={title}
            style={{
                position: 'relative',
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                background: theme === 'dark' ? 'rgba(25,25,25,0.85)' : 'rgba(255,255,255,0.9)',
                border: '1px solid rgba(212,175,55,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--primary)',
                cursor: 'pointer',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
            }}
            whileHover={{ scale: 1.1, backgroundColor: 'rgba(212,175,55,0.1)' }}
            whileTap={{ scale: 0.95 }}
        >
            {icon}
            {badge > 0 && (
                <span className="nav-icon-badge" style={{ transform: 'scale(0.85)', top: '-4px', right: '-4px' }}>
                    {badge > 99 ? '99+' : badge}
                </span>
            )}
        </motion.button>
    );
}

// Desktop Search Component
function DesktopSearch() {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const initialQ = searchParams.get('q') || '';
    
    const [query, setQuery] = useState(initialQ);
    const [isFocused, setIsFocused] = useState(false);
    const { recentSearches, addRecentSearch, removeRecentSearch, clearAllSearches } = useRecentSearches();
    const containerRef = useRef(null);
    const inputRef = useRef(null);

    // Sync query with URL if it changes externally
    useEffect(() => {
        setQuery(searchParams.get('q') || '');
    }, [searchParams]);

    // Close suggestions on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsFocused(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSubmit = (e) => {
        e?.preventDefault();
        if (query.trim()) {
            addRecentSearch(query);
            navigate(`/search?q=${encodeURIComponent(query.trim())}`);
            setIsFocused(false);
            inputRef.current?.blur();
        }
    };

    const handleClear = () => {
        setQuery('');
        inputRef.current?.focus();
    };

    const handleSuggestionClick = (term) => {
        setQuery(term);
        addRecentSearch(term);
        navigate(`/search?q=${encodeURIComponent(term)}`);
        setIsFocused(false);
    };

    return (
        <div ref={containerRef} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <form 
                onSubmit={handleSubmit}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: theme === 'dark' ? 'rgba(25,25,25,0.95)' : 'rgba(255,255,255,1)',
                    border: isFocused ? '1px solid var(--primary)' : '1px solid rgba(212,175,55,0.4)',
                    borderRadius: '24px',
                    padding: '6px 16px',
                    width: isFocused ? '320px' : '240px',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: isFocused ? '0 4px 15px rgba(212,175,55,0.2)' : '0 2px 8px rgba(0,0,0,0.05)'
                }}
            >
                <button type="submit" style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}>
                    <Search size={18} />
                </button>
                <input 
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    placeholder="ابحث عن منتج..."
                    style={{
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        color: 'var(--text-main)',
                        padding: '6px 8px',
                        width: '100%',
                        fontFamily: 'var(--font-main)',
                        fontSize: '0.95rem'
                    }}
                />
                {query && (
                    <button type="button" onClick={handleClear} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}>
                        <X size={16} />
                    </button>
                )}
            </form>

            <AnimatePresence>
                {isFocused && recentSearches.length > 0 && !query && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        style={{
                            position: 'absolute',
                            top: '100%',
                            right: 0,
                            marginTop: '12px',
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '16px',
                            width: '300px',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                            zIndex: 100,
                            overflow: 'hidden'
                        }}
                    >
                        <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)' }}>
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: '600' }}>عمليات البحث الأخيرة</span>
                            <button onClick={clearAllSearches} style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: '0.85rem', cursor: 'pointer' }}>
                                مسح الكل
                            </button>
                        </div>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            {recentSearches.map((term, index) => (
                                <li key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: index < recentSearches.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                                    <button 
                                        onClick={() => handleSuggestionClick(term)}
                                        style={{ background: 'none', border: 'none', color: 'var(--text-main)', fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', flex: 1, textAlign: 'right' }}
                                    >
                                        <Clock size={16} color="var(--text-dim)" />
                                        {term}
                                    </button>
                                    <button onClick={() => removeRecentSearch(term)} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '4px' }}>
                                        <X size={14} />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
