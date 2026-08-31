import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, ChevronUp, Home, User, Heart, ShoppingBag, Sun, Moon, ListOrdered } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTaxonomyStore } from '../../services/taxonomyService';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useFavorites } from '../../context/FavoritesContext';
import { useCart } from '../../context/CartContext';
import logo from '../../assets/logo.png';

export default function NavigationDrawer({ isOpen, onClose }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { theme, toggleTheme } = useTheme();
    const { currentUser, openAuthModal, openProfilePage, openLogoutConfirm } = useAuth();
    const { favorites, openWishlist } = useFavorites();
    const { cart, openCart } = useCart();

    const categories = useTaxonomyStore(state => state.categories);
    const brands = useTaxonomyStore(state => state.brands);
    const taxonomyStatus = useTaxonomyStore(state => state.status);

    const activeCategories = categories.filter(c => c.active !== false).sort((a, b) => (a.order || 0) - (b.order || 0));
    const activeBrands = brands.filter(b => b.active !== false).sort((a, b) => (a.order || 0) - (b.order || 0));

    const itemCount = cart.reduce((acc, item) => acc + item.dp_qty, 0);

    // Scroll locking
    useEffect(() => {
        if (isOpen) {
            document.body.classList.add('nav-drawer-open');
        } else {
            document.body.classList.remove('nav-drawer-open');
        }
        return () => {
            document.body.classList.remove('nav-drawer-open');
        };
    }, [isOpen]);

    // Close drawer when route changes
    useEffect(() => {
        if (isOpen) {
            onClose();
        }
    }, [location.pathname]);

    // Keyboard support (Escape to close)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const handleNavigation = (path) => {
        navigate(path);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* ── Backdrop ── */}
                    <motion.div
                        className="nav-drawer-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.22 }}
                        onClick={onClose}
                    />

                    {/* ── Drawer ── */}
                    <motion.div
                        className="nav-drawer-container"
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 240 }}
                    >
                        {/* ─── Zone 1: Header ─────────────────────────────── */}
                        <div style={{
                            padding: 'calc(14px + env(safe-area-inset-top, 0px)) 14px 14px',
                            borderBottom: '1px solid var(--border-color)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                        }}>
                            {/* Logo + Brand */}
                            <div
                                style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flex: 1 }}
                                onClick={() => handleNavigation('/')}
                            >
                                <img
                                    src={logo}
                                    alt="متجر السعيدة"
                                    style={{
                                        width: '40px', height: '40px',
                                        objectFit: 'cover',
                                        borderRadius: '10px',
                                        border: '1px solid rgba(212,175,55,0.25)',
                                        boxShadow: theme === 'dark' ? '0 0 10px rgba(212,175,55,0.1)' : 'none',
                                        flexShrink: 0
                                    }}
                                />
                                <div>
                                    <p style={{
                                        fontFamily: 'var(--font-main)',
                                        fontSize: '0.95rem', fontWeight: 700,
                                        color: 'var(--text-main)',
                                        margin: 0, lineHeight: 1.2
                                    }}>
                                        <span style={{ color: 'var(--primary)' }}>متجر</span> السعيدة
                                    </p>
                                    <p style={{
                                        fontSize: '0.68rem', color: 'var(--text-dim)',
                                        margin: 0, fontFamily: 'var(--font-main)'
                                    }}>تسوق بكل يسر</p>
                                </div>
                            </div>
                            {/* Close */}
                            <button
                                onClick={onClose}
                                style={{
                                    background: 'var(--skeleton-bg)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '50%',
                                    width: '34px', height: '34px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', color: 'var(--text-dim)', flexShrink: 0
                                }}
                                aria-label="إغلاق القائمة"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* ─── Zone 2: Scrollable Nav ──────────────────────── */}
                        <div className="nav-drawer-content">
                            {/* User Card */}
                            <div
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    cursor: 'pointer', marginBottom: '16px',
                                    padding: '10px 11px', borderRadius: '12px',
                                    background: 'rgba(212,175,55,0.05)',
                                    border: '1px solid rgba(212,175,55,0.09)'
                                }}
                                onClick={() => { currentUser ? openProfilePage() : openAuthModal(); onClose(); }}
                            >
                                <img
                                    src={currentUser?.image || logo}
                                    alt={currentUser?.name || 'ضيف'}
                                    style={{
                                        width: '40px', height: '40px', borderRadius: '50%',
                                        border: '1.5px solid var(--primary)',
                                        objectFit: 'cover', flexShrink: 0
                                    }}
                                />
                                <div style={{ overflow: 'hidden' }}>
                                    <p style={{
                                        fontFamily: 'var(--font-main)', fontSize: '0.875rem',
                                        fontWeight: 600, color: 'var(--text-main)', margin: 0,
                                        whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden'
                                    }}>
                                        {currentUser?.name || 'زائر'}
                                    </p>
                                    <p style={{ fontSize: '0.72rem', color: 'var(--primary)', margin: 0, fontFamily: 'var(--font-main)' }}>
                                        {currentUser ? 'عضو مميز' : 'اضغط للتسجيل'}
                                    </p>
                                </div>
                            </div>

                            {/* Main Links */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <button
                                    className={`nav-drawer-link ${location.pathname === '/' ? 'active' : ''}`}
                                    onClick={() => handleNavigation('/')}
                                >
                                    <Home size={19} /> الرئيسية
                                </button>
                                <NavigationSection title="الأقسام" items={activeCategories} basePath="/category" status={taxonomyStatus} handleNavigation={handleNavigation} />
                            </div>

                            <div style={{ height: '1px', background: 'var(--border-color)', margin: '14px 0' }} />

                            {/* Secondary Links */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <button className="nav-drawer-link" onClick={() => { openCart(); onClose(); }}>
                                    <div style={{ position: 'relative', display: 'flex' }}>
                                        <ShoppingBag size={19} />
                                        {itemCount > 0 && (
                                            <span className="nav-icon-badge" style={{ top: '-5px', right: '-7px' }}>
                                                {itemCount > 9 ? '9+' : itemCount}
                                            </span>
                                        )}
                                    </div>
                                    السلة
                                </button>
                                <button className="nav-drawer-link" onClick={() => { openWishlist(); onClose(); }}>
                                    <div style={{ position: 'relative', display: 'flex' }}>
                                        <Heart size={19} />
                                        {favorites.length > 0 && (
                                            <span className="nav-icon-badge" style={{ top: '-5px', right: '-7px' }}>
                                                {favorites.length > 9 ? '9+' : favorites.length}
                                            </span>
                                        )}
                                    </div>
                                    المفضلة
                                </button>
                                <button className="nav-drawer-link" onClick={() => handleNavigation('/profile')}>
                                    <ListOrdered size={19} /> طلباتي
                                </button>
                            </div>
                        </div>

                        {/* ─── Zone 3: Footer ──────────────────────────────── */}
                        <div style={{
                            padding: '10px 12px',
                            borderTop: '1px solid var(--border-color)',
                            paddingBottom: 'max(10px, env(safe-area-inset-bottom, 0px))'
                        }}>
                            <button
                                className="nav-drawer-link"
                                onClick={toggleTheme}
                                style={{ justifyContent: 'center', gap: '8px', opacity: 0.75 }}
                            >
                                {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
                                <span style={{ fontSize: '0.82rem' }}>
                                    {theme === 'dark' ? 'الوضع النهاري' : 'الوضع الليلي'}
                                </span>
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

// Expandable Section Component for drawer
function NavigationSection({ title, items, basePath, status, handleNavigation }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const location = useLocation();

    // Auto-expand if a child route is active
    useEffect(() => {
        if (items.some(item => location.pathname === `${basePath}/${item.slug || item.id}`)) {
            setIsExpanded(true);
        }
    }, [location.pathname, items, basePath]);

    if ((status === 'loading' || status === 'idle') && items.length === 0) {
        return (
            <div style={{ padding: '14px 16px', color: 'var(--text-dim)', textAlign: 'right', fontSize: '0.9rem', fontFamily: 'var(--font-main)' }}>
                جاري تحميل {title}...
            </div>
        );
    }

    if (items.length === 0) {
        return null; // Do not render section if empty
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            <button 
                className="nav-drawer-link"
                style={{ justifyContent: 'space-between' }}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    {title}
                </div>
                {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ overflow: 'hidden', paddingRight: '24px', display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}
                    >
                        {items.map(item => {
                            const path = `${basePath}/${item.slug || item.id}`;
                            const isActive = location.pathname === path;
                            return (
                                <button
                                    key={item.id}
                                    className={`nav-drawer-link ${isActive ? 'active' : ''}`}
                                    style={{ padding: '9px 12px', fontSize: '0.84rem' }}
                                    onClick={() => handleNavigation(path)}
                                >
                                    {item.name}
                                </button>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
