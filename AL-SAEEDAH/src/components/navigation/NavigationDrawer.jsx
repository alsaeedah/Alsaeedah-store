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
                    <motion.div
                        className="nav-drawer-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        onClick={onClose}
                    />
                    <motion.div
                        className="nav-drawer-container"
                        initial={{ x: '100%' }} // RTL: slide in from right
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                    >
                        <button 
                            onClick={onClose} 
                            style={{ 
                                position: 'absolute', 
                                top: 'calc(16px + env(safe-area-inset-top, 0px))', 
                                left: '16px', 
                                background: 'var(--bg-card)', 
                                border: '1px solid var(--border-color)', 
                                borderRadius: '50%', 
                                width: '36px', 
                                height: '36px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                cursor: 'pointer', 
                                color: 'var(--text-main)', 
                                zIndex: 2000 
                            }}
                            aria-label="إغلاق القائمة"
                        >
                            <X size={20} />
                        </button>

                        <div className="nav-drawer-content">
                            {/* Header Logo */}
                            <div 
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px', cursor: 'pointer', flexDirection: 'column', gap: '12px' }} 
                                onClick={() => handleNavigation('/')}
                            >
                                <img src={logo} alt="متجر السعيدة" style={{ width: '64px', height: '64px', objectFit: 'cover', filter: theme === 'dark' ? 'drop-shadow(0 0 10px rgba(212, 175, 55, 0.2))' : 'none' }} />
                                <h2 style={{ fontSize: '1.2rem', fontWeight: '900', margin: 0, fontFamily: 'var(--font-main)' }}>
                                    <span style={{ color: 'var(--primary)' }}>متجر</span> <span style={{ color: 'var(--text-main)' }}>السعيدة</span>
                                </h2>
                            </div>

                            {/* User Info (same as Sidebar.jsx) */}
                            <div 
                                style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', marginBottom: '32px', padding: '12px', borderRadius: '16px', background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.1)' }} 
                                onClick={() => { currentUser ? openProfilePage() : openAuthModal(); onClose(); }}
                            >
                                <img
                                    src={currentUser?.image || logo}
                                    alt={currentUser?.name || 'ضيف'}
                                    style={{ width: '48px', height: '48px', borderRadius: '50%', border: '2px solid var(--primary)', objectFit: 'cover', flexShrink: 0 }}
                                />
                                <div style={{ overflow: 'hidden' }}>
                                    <p style={{ fontFamily: 'var(--font-main)', fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                        {currentUser?.name || 'زائر'}
                                    </p>
                                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--primary)', margin: 0, letterSpacing: '1px' }}>
                                        {currentUser ? 'عضو مميز' : 'سجل دخولك'}
                                    </p>
                                </div>
                            </div>

                            {/* Links */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <button className={`nav-drawer-link ${location.pathname === '/' ? 'active' : ''}`} onClick={() => handleNavigation('/')}>
                                    <Home size={20} /> الرئيسية
                                </button>
                                
                                <NavigationSection title="الأقسام" items={activeCategories} basePath="/category" status={taxonomyStatus} handleNavigation={handleNavigation} />
                            </div>

                            <div style={{ height: '1px', background: 'var(--border-color)', margin: '24px 0' }} />

                            {/* Bottom Actions */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <button className="nav-drawer-link" onClick={() => { openCart(); onClose(); }}>
                                    <div style={{ position: 'relative' }}>
                                        <ShoppingBag size={20} />
                                        {itemCount > 0 && <span className="nav-icon-badge" style={{ transform: 'scale(0.8)', top: '-6px', right: '-8px' }}>{itemCount}</span>}
                                    </div>
                                    السلة
                                </button>
                                <button className="nav-drawer-link" onClick={() => { openWishlist(); onClose(); }}>
                                    <div style={{ position: 'relative' }}>
                                        <Heart size={20} />
                                        {favorites.length > 0 && <span className="nav-icon-badge" style={{ transform: 'scale(0.8)', top: '-6px', right: '-8px' }}>{favorites.length}</span>}
                                    </div>
                                    المفضلة
                                </button>
                                <button className="nav-drawer-link" onClick={() => handleNavigation('/profile')}>
                                    <ListOrdered size={20} /> طلباتي
                                </button>
                                
                                <button className="nav-drawer-link" onClick={toggleTheme}>
                                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                                    {theme === 'dark' ? 'الوضع النهاري' : 'الوضع الليلي'}
                                </button>
                            </div>
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
                                    style={{ padding: '10px 16px', fontSize: '0.95rem' }}
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
