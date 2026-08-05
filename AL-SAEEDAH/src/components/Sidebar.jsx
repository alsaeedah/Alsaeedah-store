import { ShoppingBag, Sun, Moon, User, LogOut, Heart, Menu, X, Home, ListOrdered, Bookmark, Watch } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '../assets/logo.png';

export default function Sidebar() {
    const { cart, openCart } = useCart();
    const { theme, toggleTheme } = useTheme();
    const { currentUser, openLogoutConfirm, openAuthModal, openProfilePage } = useAuth();
    const { favorites } = useFavorites();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const itemCount = cart.reduce((acc, item) => acc + item.dp_qty, 0);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 1024);
            if (window.innerWidth >= 1024) setIsMenuOpen(false);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Close drawer on route change on mobile
    useEffect(() => { 
        if (isMobile) setIsMenuOpen(false); 
    }, [location.pathname, isMobile]);

    const handleLogoClick = () => {
        navigate('/');
        window.scrollTo(0, 0);
        if (isMobile) setIsMenuOpen(false);
    };

    // Sidebar menu items
    const menuLinks = [
        { icon: <Home size={20} />, label: 'الرئيسية', path: '/' },
        { icon: <Watch size={20} />, label: 'ساعات رجالية', path: '/men-watches' },
        { icon: <Watch size={20} />, label: 'ساعات نسائية', path: '/women-watches' },
        { icon: <Watch size={20} />, label: 'ساعات أطفال', path: '/children-watches' },
        { icon: <ListOrdered size={20} />, label: 'طلباتي', path: '/profile' },
        { icon: <Heart size={20} />, label: 'المفضلة', path: '/wishlist' },
        { icon: <ShoppingBag size={20} />, label: 'السلة', path: '/cart' },
    ];

    const SidebarContent = () => (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '32px 24px', color: 'var(--text-main)', background: 'var(--bg-main)', overflowY: 'auto' }}>
            {/* Header / Logo */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '40px', cursor: 'pointer', flexDirection: 'column', gap: '12px' }} onClick={handleLogoClick}>
                <img src={logo} alt="متجر السعيدة" style={{ width: '80px', height: '80px', objectFit: 'cover', filter: theme === 'dark' ? 'drop-shadow(0 0 10px rgba(212, 175, 55, 0.2))' : 'none' }} />
                <h1 style={{ fontSize: '1.4rem', fontWeight: '900', margin: 0, fontFamily: 'var(--font-main)' }}>
                    <span style={{ color: 'var(--primary)' }}>متجر</span> <span style={{ color: 'var(--text-main)' }}>السعيدة</span>
                </h1>
            </div>

            {/* User Profile Summary */}
            <div 
                style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', marginBottom: '32px', padding: '12px', borderRadius: '16px', background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.1)' }} 
                onClick={() => { currentUser ? openProfilePage() : openAuthModal(); if(isMobile) setIsMenuOpen(false); }}
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

            {/* Navigation Links */}
            <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {menuLinks.map(link => {
                    const isActive = location.pathname === link.path;
                    return (
                        <button
                            key={link.path}
                            onClick={() => {
                                if (link.path === '/cart') {
                                    openCart();
                                    if(isMobile) setIsMenuOpen(false);
                                } else {
                                    navigate(link.path); 
                                }
                            }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '14px',
                                padding: '14px 16px', borderRadius: '12px', cursor: 'pointer', border: 'none',
                                background: isActive ? 'rgba(212,175,55,0.12)' : 'transparent',
                                color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                                fontFamily: 'var(--font-main)', fontSize: '1rem', fontWeight: isActive ? 700 : 500,
                                transition: 'all 0.2s ease', width: '100%', textAlign: 'right',
                            }}
                        >
                            <span style={{ color: isActive ? 'var(--primary)' : 'var(--text-dim)', transition: 'color 0.2s' }}>{link.icon}</span>
                            {link.label}
                            {link.path === '/cart' && itemCount > 0 && (
                                <span style={{ marginRight: 'auto', background: 'var(--primary)', color: 'var(--btn-text)', borderRadius: '12px', padding: '2px 8px', fontSize: '0.75rem', fontWeight: 700, fontFamily: 'var(--font-body)' }}>{itemCount}</span>
                            )}
                            {link.path === '/wishlist' && favorites.length > 0 && (
                                <span style={{ marginRight: 'auto', background: 'rgba(212,175,55,0.15)', color: 'var(--primary)', borderRadius: '12px', padding: '2px 8px', fontSize: '0.75rem', fontWeight: 700, fontFamily: 'var(--font-body)' }}>{favorites.length}</span>
                            )}
                        </button>
                    )
                })}
            </nav>

            <div style={{ height: '1px', background: 'var(--border-color)', margin: '24px 0' }} />

            {/* Bottom Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button onClick={toggleTheme} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', borderRadius: '12px', cursor: 'pointer', border: 'none', background: 'transparent', color: 'var(--text-secondary)', fontFamily: 'var(--font-main)', fontSize: '1rem', width: '100%', textAlign: 'right', transition: 'background 0.2s' }}>
                    {theme === 'dark' ? <Sun size={20} color="var(--text-dim)" /> : <Moon size={20} color="var(--text-dim)" />}
                    {theme === 'dark' ? 'الوضع النهاري' : 'الوضع الليلي'}
                </button>

                {currentUser ? (
                    <button onClick={() => { openLogoutConfirm(); if(isMobile) setIsMenuOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', borderRadius: '12px', cursor: 'pointer', border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.05)', color: '#ef4444', fontFamily: 'var(--font-main)', fontSize: '0.95rem', width: '100%', textAlign: 'right', transition: 'all 0.2s' }}>
                        <LogOut size={20} />
                        تسجيل الخروج
                    </button>
                ) : (
                    <button onClick={() => { openAuthModal(); if(isMobile) setIsMenuOpen(false); }} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px' }}>
                        <User size={18} /> تسجيل الدخول
                    </button>
                )}
            </div>
        </div>
    );

    // Badge component for mobile header icons
    const NavIcon = ({ icon: Icon, onClick, badge, color = "var(--text-main)" }) => (
        <div
            style={{ position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '44px', minHeight: '44px' }}
            onClick={onClick}
            role="button"
            tabIndex={0}
        >
            <Icon color={color} size={24} />
            {badge > 0 && (
                <span style={{
                    position: 'absolute', top: '4px', right: '4px',
                    background: 'var(--primary)', color: 'var(--btn-text)', borderRadius: '50%',
                    width: '17px', height: '17px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '10px', fontWeight: 'bold', fontFamily: 'var(--font-body)',
                    border: '2px solid var(--bg-main)'
                }}>
                    {badge}
                </span>
            )}
        </div>
    );

    return (
        <>
            {/* Desktop Sidebar (Persistent) */}
            {!isMobile && (
                <div className="glass-panel" style={{
                    position: 'fixed',
                    top: '0',
                    right: '0',
                    bottom: '0',
                    width: 'var(--sidebar-width, 260px)',
                    zIndex: 1000,
                    borderRadius: '0',
                    borderLeft: '1px solid var(--border-color)',
                    borderRight: 'none',
                    borderTop: 'none',
                    borderBottom: 'none'
                }}>
                    <SidebarContent />
                </div>
            )}

            {/* Mobile Top Header (replaces old navbar on mobile) */}
            {isMobile && (
                <div className="glass-panel" style={{
                    position: 'fixed',
                    top: '0',
                    left: '0',
                    right: '0',
                    zIndex: 1000,
                    padding: 'calc(10px + var(--safe-area-top, 0px)) 15px 10px 15px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    height: 'calc(70px + var(--safe-area-top, 0px))',
                    borderRadius: '0',
                    borderBottom: '1px solid var(--border-color)'
                }}>
                    <button
                        onClick={() => setIsMenuOpen(v => !v)}
                        style={{ cursor: 'pointer', zIndex: 102, background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', color: 'var(--text-main)', minWidth: '44px', minHeight: '44px', padding: '0' }}
                        aria-label="فتح القائمة"
                    >
                        <Menu size={26} />
                    </button>

                    <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={handleLogoClick}>
                        <img src={logo} alt="متجر السعيدة" style={{ width: '40px', height: '40px', objectFit: 'cover' }} />
                        <h1 style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: 0, fontFamily: 'var(--font-main)' }}>
                            <span style={{ color: 'var(--primary)' }}>السعيدة</span>
                        </h1>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <NavIcon icon={ShoppingBag} onClick={openCart} badge={itemCount} />
                    </div>
                </div>
            )}

            {/* Mobile Sidebar Overlay & Drawer */}
            {isMobile && (
                <AnimatePresence>
                    {isMenuOpen && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.25 }}
                                onClick={() => setIsMenuOpen(false)}
                                style={{ position: 'fixed', inset: 0, background: 'var(--overlay-dim)', backdropFilter: 'blur(4px)', zIndex: 1998 }}
                            />
                            <motion.div
                                initial={{ x: '100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: '100%' }}
                                transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                                style={{
                                    position: 'fixed', top: 0, right: 0, bottom: 0,
                                    width: '80%', maxWidth: '320px',
                                    zIndex: 1999,
                                    boxShadow: '-10px 0 40px rgba(0,0,0,0.4)',
                                    paddingTop: 'var(--safe-area-top)',
                                }}
                            >
                                <button onClick={() => setIsMenuOpen(false)} style={{ position: 'absolute', top: 'calc(16px + var(--safe-area-top))', left: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-main)', zIndex: 2000 }}>
                                    <X size={20} />
                                </button>
                                <SidebarContent />
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            )}
        </>
    );
}
