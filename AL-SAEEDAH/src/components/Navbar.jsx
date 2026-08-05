import { ShoppingBag, Sun, Moon, User, Heart, X, AlignJustify } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '../assets/logo.png';

const FAB = ({ isMobile }) => {
    const { theme, toggleTheme } = useTheme();
    const { currentUser, openAuthModal, openProfilePage } = useAuth();
    const { openWishlist } = useFavorites();
    const [isOpen, setIsOpen] = useState(false);
    const toggleOpen = () => setIsOpen(!isOpen);

    // Adjust radius based on screen size
    const radius = isMobile ? 65 : 75; 
    
    const subButtons = [
        { icon: <User size={20} strokeWidth={1.5} />, onClick: () => { currentUser ? openProfilePage() : openAuthModal(); setIsOpen(false); }, label: 'Profile' },
        { icon: <Heart size={20} strokeWidth={1.5} />, onClick: () => { openWishlist(); setIsOpen(false); }, label: 'Favorites' },
        { icon: theme === 'dark' ? <Sun size={20} strokeWidth={1.5} /> : <Moon size={20} strokeWidth={1.5} />, onClick: () => { toggleTheme(); setIsOpen(false); }, label: 'Theme' },
    ];

    return (
        <div style={{ position: 'relative', zIndex: 1001 }}>
            <AnimatePresence>
                {isOpen && subButtons.map((btn, index) => {
                    // Calculate positions for an arc extending downwards and to the LEFT
                    const targetX = index === 0 ? -radius : index === 1 ? -radius * 0.707 : 0;
                    const targetY = index === 0 ? 0 : index === 1 ? radius * 0.707 : radius;

                    return (
                        <motion.button
                            key={index}
                            initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
                            animate={{ opacity: 1, x: targetX, y: targetY, scale: 1 }}
                            exit={{ opacity: 0, x: 0, y: 0, scale: 0.5 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20, delay: index * 0.04 }}
                            onClick={btn.onClick}
                            title={btn.label}
                            style={{
                                position: 'absolute',
                                top: isMobile ? 2 : 4, 
                                left: isMobile ? 2 : 4,
                                width: isMobile ? '42px' : '46px', 
                                height: isMobile ? '42px' : '46px',
                                borderRadius: '50%',
                                // Premium glassmorphism
                                background: theme === 'dark' ? 'rgba(25,25,25,0.85)' : 'rgba(255,255,255,0.9)',
                                border: '1px solid rgba(212,175,55,0.5)', // Subtle golden border
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'var(--primary)',
                                cursor: 'pointer',
                                backdropFilter: 'blur(10px)',
                                WebkitBackdropFilter: 'blur(10px)',
                                zIndex: 1,
                                boxShadow: '0 8px 16px rgba(0,0,0,0.15)'
                            }}
                            whileHover={{ scale: 1.1, backgroundColor: 'rgba(212,175,55,0.1)' }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {btn.icon}
                        </motion.button>
                    );
                })}
            </AnimatePresence>

            {/* Main FAB Button */}
            <motion.button
                onClick={toggleOpen}
                whileTap={{ scale: 0.9 }}
                style={{
                    position: 'relative',
                    width: isMobile ? '46px' : '54px', 
                    height: isMobile ? '46px' : '54px',
                    borderRadius: '50%',
                    background: isOpen ? 'var(--primary)' : (theme === 'dark' ? 'rgba(20,20,20,0.6)' : 'rgba(255,255,255,0.6)'),
                    border: isOpen ? '1px solid var(--primary)' : '1px solid rgba(212,175,55,0.6)', 
                    boxShadow: isOpen 
                        ? '0 0 15px rgba(212,175,55,0.6)' 
                        : '0 0 10px rgba(212,175,55,0.3), inset 0 0 5px rgba(212,175,55,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                    color: isOpen ? 'var(--btn-text)' : 'var(--primary)',
                    zIndex: 2,
                    backdropFilter: 'blur(8px)',
                    transition: 'all 0.3s ease'
                }}
                whileHover={{ boxShadow: '0 0 15px rgba(212,175,55,0.8), inset 0 0 8px rgba(212,175,55,0.3)' }}
            >
                <motion.div 
                    animate={{ rotate: isOpen ? 90 : 0 }} 
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                >
                    {isOpen ? <X size={26} strokeWidth={1.5} /> : <AlignJustify size={26} strokeWidth={1.5} />}
                </motion.div>
            </motion.button>
        </div>
    );
};

export default function Navbar() {
    const { cart, openCart } = useCart();
    const { theme } = useTheme();
    const navigate = useNavigate();
    
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
    const itemCount = cart.reduce((acc, item) => acc + item.dp_qty, 0);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 1024);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleLogoClick = () => {
        navigate('/');
        window.scrollTo(0, 0);
    };

    return (
        <nav className="glass-panel" style={{
            position: 'fixed',
            top: '0',
            left: '0',
            right: '0',
            zIndex: 1000,
            width: '100%',
            padding: isMobile
                ? 'calc(10px + var(--safe-area-top, 0px)) 20px 10px 20px'
                : '10px 50px',
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            alignItems: 'center',
            height: isMobile ? 'calc(75px + var(--safe-area-top, 0px))' : '85px',
            borderRadius: '0',
            // Thin horizontal golden line, more elegant opacity
            borderBottom: '1px solid rgba(212,175,55,0.4)',
            background: theme === 'dark' ? 'rgba(10, 10, 10, 0.85)' : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
        }}>
            
            {/* Left Section: FAB (Swapped) */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
                <FAB isMobile={isMobile} />
            </div>

            {/* Center Section: Logo */}
            <div 
                style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', justifyContent: 'center' }} 
                onClick={handleLogoClick}
            >
                <motion.img 
                    src={logo} 
                    alt="متجر السعيدة" 
                    style={{ 
                        width: isMobile ? '48px' : '58px', 
                        height: isMobile ? '48px' : '58px', 
                        objectFit: 'cover',
                        filter: 'drop-shadow(0 2px 4px rgba(212,175,55,0.2))'
                    }} 
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                />
                <h1 style={{ 
                    fontSize: isMobile ? '1.3rem' : '1.9rem', 
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

            {/* Right Section: Cart (Swapped) */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                <motion.div
                    style={{ 
                        position: 'relative', 
                        cursor: 'pointer', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        width: isMobile ? '46px' : '54px', 
                        height: isMobile ? '46px' : '54px',
                        borderRadius: '50%',
                        color: 'var(--primary)', 
                        background: theme === 'dark' ? 'rgba(212,175,55,0.05)' : 'rgba(212,175,55,0.08)',
                        border: '1px solid rgba(212,175,55,0.2)',
                        transition: 'all 0.3s ease'
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
                            style={{
                                position: 'absolute', top: '-2px', right: '-2px',
                                background: 'var(--primary)', color: 'var(--btn-text)', borderRadius: '50%',
                                width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '11px', fontWeight: '800', fontFamily: 'var(--font-body)',
                                border: `2px solid var(--bg-main)`,
                                boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                            }}
                        >
                            {itemCount > 99 ? '99+' : itemCount}
                        </motion.span>
                    )}
                </motion.div>
            </div>

        </nav>
    );
}
