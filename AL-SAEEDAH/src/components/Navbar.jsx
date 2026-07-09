import { ShoppingBag, Sun, Moon, User, LogOut, Heart, Menu, X, Home, Watch, List as ListIcon } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import logo from '../assets/logo.png';
import Dock from './Dock';

export default function Navbar() {
    const { cart, openCart } = useCart();
    const { theme, toggleTheme } = useTheme();
    const { currentUser, openLogoutConfirm, openAuthModal, openProfileModal, isMenuOpen, setIsMenuOpen, toggleMenu } = useAuth();
    const { favorites, setIsFavoritesOpen } = useFavorites();
    const navigate = useNavigate();
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

    const itemCount = cart.reduce((acc, item) => acc + item.dp_qty, 0);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 1024);
            if (window.innerWidth >= 1024) {
                setIsMenuOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleLogoClick = () => {
        navigate('/');
        window.scrollTo(0, 0);
        setIsMenuOpen(false);
    };

    const NavIcon = ({ icon: Icon, onClick, badge, color = "var(--text-main)", title = "" }) => (
        <div
            style={{ position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            onClick={onClick}
            title={title}
        >
            <Icon color={color} size={24} />
            {badge > 0 && (
                <span style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-8px',
                    background: 'var(--primary)',
                    color: 'black',
                    borderRadius: '50%',
                    width: '18px',
                    height: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 'bold'
                }}>
                    {badge}
                </span>
            )}
        </div>
    );

    const dockItems = [
        { icon: <Home size={22} />, label: "الرئيسية", onClick: () => navigate('/') },
        { icon: <ListIcon size={22} />, label: "طلباتي", onClick: () => navigate('/orders') },
        { icon: <Heart size={22} />, label: "المفضلة", onClick: () => setIsFavoritesOpen(true), badgeCount: favorites.length },
        {
            icon: theme === 'dark' ? <Sun size={22} /> : <Moon size={22} />,
            label: theme === 'dark' ? 'الوضع النهاري' : 'الوضع الليلي',
            onClick: toggleTheme
        },
    ];

    // Sidebar Content (Mobile)
    const SidebarContent = () => (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '100%',
            padding: '40px 25px',
            color: 'var(--text-main)',
            background: 'var(--bg-main)'
        }}>
            {/* Header: User Profile */}
            <div style={{ marginBottom: '50px', display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', paddingBottom: '15px' }}>
                {currentUser ? (
                    <>
                        <img
                            src={currentUser.image || `https://ui-avatars.com/api/?name=${currentUser.name}&background=d4af37&color=000`}
                            alt={currentUser.name}
                            style={{ width: '60px', height: '60px', borderRadius: '50%', border: '2px solid var(--primary)', objectFit: 'cover' }}
                            onClick={() => { openProfileModal(); setIsMenuOpen(false); }}
                        />
                        <div onClick={() => { openProfileModal(); setIsMenuOpen(false); }}>
                            <h3 style={{ fontSize: '1.2rem', margin: 0, color: 'var(--text-main)' }}>{currentUser.name}</h3>
                            <span style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>عضو مميز</span>
                        </div>
                    </>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }} onClick={() => { openAuthModal(); setIsMenuOpen(false); }}>
                        <div style={{
                            width: '50px', height: '50px', borderRadius: '50%', background: 'var(--bg-card)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)'
                        }}>
                            <User size={24} color="var(--primary)" />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--text-main)' }}>زائر</h3>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>سجل دخولك الآن</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation Links */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
                <div className="action-icon" style={{ justifyContent: 'flex-start', padding: '10px 0' }} onClick={() => { navigate('/'); setIsMenuOpen(false); }}>
                    <Home size={22} color="var(--primary)" />
                    <span style={{ fontSize: '1.1rem' }}>الرئيسية</span>
                </div>

                <div className="action-icon" style={{ justifyContent: 'flex-start', padding: '10px 0' }} onClick={() => { navigate('/orders'); setIsMenuOpen(false); }}>
                    <ListIcon size={22} color="var(--primary)" />
                    <span style={{ fontSize: '1.1rem' }}>طلباتي</span>
                </div>

            </div>

            {/* Bottom: Service Icons */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-around',
                paddingTop: '20px',
                borderTop: '1px solid var(--border-color)'
            }}>
                <div className="action-icon" onClick={toggleTheme}>
                    {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
                    <span>{theme === 'dark' ? 'نهاري' : 'ليلي'}</span>
                </div>

                <div className="action-icon" style={{ justifyContent: 'flex-start', }} onClick={() => { setIsFavoritesOpen(true); setIsMenuOpen(false); }}>
                    <Heart size={22} color="#ff4b4b" />
                    <span style={{ fontSize: '1.1rem' }}>المفضلة ({favorites.length})</span>
                </div>

                {currentUser && (
                    <div className="action-icon" onClick={() => { openLogoutConfirm(); setIsMenuOpen(false); }}>
                        <LogOut size={24} color="#ff4b4b" />
                        <span>خروج</span>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <>
            <nav className="glass-panel" style={{
                position: 'fixed',
                top: isMobile ? '0' : '10px',
                left: isMobile ? '0' : '10px',
                right: isMobile ? '0' : '10px',
                zIndex: 1000,
                width: isMobile ? '100%' : 'calc(100% - 20px)',
                /* Mobile: top padding grows by safe-area-top so icons clear the OS status bar */
                padding: isMobile
                    ? 'calc(10px + var(--safe-area-top, 0px)) 15px 10px 15px'
                    : '10px 40px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                /* Mobile: height extends by the same inset for visual continuity behind the status bar */
                height: isMobile ? 'calc(70px + var(--safe-area-top, 0px))' : '70px',
                borderRadius: isMobile ? '0' : 'var(--radius)'
            }}>
                {/* Desktop LAYOUT: LEFT (Logo - Position swapped) */}
                {!isMobile && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '25px', flex: 1, justifyContent: 'flex-start' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={handleLogoClick}>
                            <img src={logo} alt="متجر السعيدة" style={{ width: '65px', height: '65px', objectFit: 'cover' }} />
                            <h1 style={{ fontSize: '1.6rem', fontWeight: '900', margin: 0 }}>
                                <span style={{ color: 'var(--primary)' }}>متجر</span> <span style={{ color: 'var(--text-main)' }}>السعيدة</span>
                            </h1>
                        </div>
                    </div>
                )}

                {/* Mobile LAYOUT: Left (Menu) */}
                {isMobile && (
                    <div onClick={toggleMenu} style={{ cursor: 'pointer', zIndex: 102 }}>
                        <Menu size={28} color="var(--text-main)" />
                    </div>
                )}

                {/* Desktop LAYOUT: CENTER (Dock) */}
                {!isMobile && (
                    <div style={{ flex: 2, display: 'flex', justifyContent: 'center' }}>
                        <Dock items={dockItems} />
                    </div>
                )}

                {/* Mobile LAYOUT: Center (Logo) */}
                {isMobile && (
                    <div style={{
                        position: 'absolute',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer'
                    }} onClick={handleLogoClick}>
                        <img src={logo} alt="متجر السعيدة" style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }} />
                        <h1 style={{ fontSize: '1.3rem', fontWeight: 'bold', margin: 0 }}>
                            <span style={{ color: 'var(--primary)' }}>متجر</span> <span style={{ color: 'var(--text-main)' }}>السعيدة</span>
                        </h1>
                    </div>
                )}

                {/* RIGHT SIDE: Icons (On right for Desktop, Cart on right for Mobile) */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: isMobile ? '15px' : '20px',
                    flex: isMobile ? 0 : 1,
                    justifyContent: 'flex-end'
                }}>
                    {!isMobile ? (
                        <>
                            {currentUser ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <img
                                        src={currentUser.image || logo}
                                        alt="user"
                                        style={{ width: '38px', height: '38px', borderRadius: '50%', border: '2px solid var(--primary)', cursor: 'pointer' }}
                                        onClick={openProfileModal}
                                    />
                                    <NavIcon icon={LogOut} onClick={openLogoutConfirm} color="#ff4b4b" title="تسجيل الخروج" />
                                </div>
                            ) : (
                                <button onClick={openAuthModal} className="btn-primary" style={{ padding: '8px 22px', fontSize: '0.9rem' }}>تسجيل الدخول</button>
                            )}
                            <NavIcon icon={ShoppingBag} onClick={openCart} badge={itemCount} title="السلة" />
                        </>
                    ) : (
                        /* Mobile Cart icon on the Right */
                        <NavIcon icon={ShoppingBag} onClick={openCart} badge={itemCount} />
                    )}
                </div>
            </nav>

            {/* Sidebar Overlay */}
            <div className={`sidebar-overlay ${isMenuOpen ? 'open' : ''}`} onClick={() => setIsMenuOpen(false)}>
                <div className="overlay-logo">
                    <img src={logo} alt="Time Tick" style={{ width: '80px', height: '80px', marginBottom: '10px' }} />
                    <h2 style={{ color: 'var(--primary)', margin: 0 }}>متجر السعيدة</h2>
                </div>
            </div>

            {/* Sidebar Drawer */}
            <div className={`sidebar-drawer ${isMenuOpen ? 'open' : ''}`}>
                <SidebarContent />
            </div>
        </>
    )
}
