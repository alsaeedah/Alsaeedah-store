import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, ChevronRight, ChevronLeft } from 'lucide-react';
import { subscribeToHero } from '../services/productService';

export default function Hero() {
    const [slides, setSlides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [logoLoaded, setLogoLoaded] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(1);
    const [isJump, setIsJump] = useState(false);
    
    const imageIndex = slides.length > 0 
        ? (currentSlide - 1 + slides.length) % slides.length 
        : 0;

    const paginate = (newDirection) => {
        setIsJump(false);
        setCurrentSlide(prev => {
            if (slides.length <= 1) return prev;
            const maxIndex = slides.length + 1;
            let next = prev + newDirection;
            if (next > maxIndex) return maxIndex;
            if (next < 0) return 0;
            return next;
        });
    };

    const extendedSlides = slides.length > 1 
        ? [slides[slides.length - 1], ...slides, slides[0]] 
        : slides;

    useEffect(() => {
        const unsubscribe = subscribeToHero((data) => {
            // Only show slides that have been added by the admin — no defaults
            setSlides(data && data.length > 0 ? data : []);
            setTimeout(() => setLoading(false), 800);
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (slides.length <= 1 || loading) return;
        const timer = setInterval(() => {
            paginate(1);
        }, 5000); // 5 seconds per slide, continuous auto-slide
        return () => clearInterval(timer);
    }, [slides.length, loading, currentSlide]);

    const handleNext = () => {
        paginate(1);
    };

    const handlePrev = () => {
        paginate(-1);
    };

    return (
        <div 
            style={{
                position: 'relative',
                width: '100%',
                height: '100vh',
                minHeight: '700px',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#050505',
                touchAction: 'pan-y',
                overscrollBehaviorX: 'none'
            }}
        >
            <AnimatePresence>
                {/* Default Hero Section / Loading Placeholder */}
                {(loading || slides.length === 0) && (
                    <motion.div 
                        key="default-hero"
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8 }}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            background: '#050505',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexDirection: 'column',
                            zIndex: 50,
                            paddingBottom: '100px'
                        }}
                    >
                        <motion.div
                            animate={{ 
                                scale: [1, 1.05, 1],
                                opacity: [0.7, 1, 0.7] 
                            }}
                            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                            style={{ textAlign: 'center' }}
                        >
                            <img 
                                src="/logo.png" 
                                onLoad={() => setLogoLoaded(true)}
                                style={{ 
                                    width: '180px', 
                                    height: '180px', 
                                    border: 'none', 
                                    outline: 'none',
                                    opacity: logoLoaded ? 1 : 0,
                                    transition: 'opacity 0.8s ease-in',
                                }}
                            />
                            <h2 style={{ 
                                color: 'var(--text-main)', 
                                marginTop: '24px',
                                fontSize: 'clamp(2rem, 6vw, 3.5rem)', 
                                letterSpacing: '4px', 
                                fontWeight: '300', 
                                fontFamily: 'var(--font-heading)',
                                textAlign: 'center',
                                width: '100%'
                            }}>
                                متجر <span style={{ color: 'var(--primary)', fontWeight: '600' }}>السعيدة</span>
                            </h2>
                        </motion.div>

                        {/* Scroll Icon */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1, y: [0, 10, 0] }}
                            transition={{ delay: 1, duration: 2, repeat: Infinity }}
                            onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
                            style={{
                                position: 'absolute',
                                bottom: '40px',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '10px',
                                color: 'var(--primary)'
                            }}
                        >
                            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '500' }}>استكشف الآن</span>
                            <div style={{
                                width: '24px',
                                height: '40px',
                                border: '2px solid var(--primary)',
                                borderRadius: '12px',
                                position: 'relative'
                            }}>
                                <div style={{
                                    width: '4px',
                                    height: '8px',
                                    background: 'var(--primary)',
                                    borderRadius: '2px',
                                    position: 'absolute',
                                    top: '6px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    animation: 'scrollAnim 2s infinite ease-in-out'
                                }} />
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {/* Slider Layer & Details */}
                {!loading && slides.length > 0 && (
                    <motion.div 
                        key="slider-hero"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.5 }}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            zIndex: 0,
                            overflow: 'hidden'
                        }}
                    >
                        <motion.div
                            drag="x"
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={1}
                            onDragEnd={(e, { offset, velocity }) => {
                                const swipeDistance = offset.x;
                                if (swipeDistance > 50 || velocity.x > 500) {
                                    paginate(1);
                                } else if (swipeDistance < -50 || velocity.x < -500) {
                                    paginate(-1);
                                }
                            }}
                            animate={{ x: slides.length > 1 ? `${currentSlide * 100}%` : '0%' }}
                            transition={isJump ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 30 }}
                            onAnimationComplete={() => {
                                if (slides.length <= 1) return;
                                if (currentSlide >= extendedSlides.length - 1) {
                                    setIsJump(true);
                                    setCurrentSlide(1);
                                } else if (currentSlide <= 0) {
                                    setIsJump(true);
                                    setCurrentSlide(extendedSlides.length - 2);
                                } else if (isJump) {
                                    setIsJump(false);
                                }
                            }}
                            style={{
                                display: 'flex',
                                width: '100%',
                                height: '100%',
                                cursor: 'grab',
                                direction: 'rtl'
                            }}
                        >
                            {extendedSlides.map((slide, index) => (
                                <div key={`${slide.id}-${index}`} style={{
                                    flex: '0 0 100%',
                                    width: '100%',
                                    height: '100%',
                                    position: 'relative',
                                    direction: 'rtl'
                                }}>
                                    {/* Background */}
                                    <div style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%'
                                    }}>
                                        <div 
                                            style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                width: '100%',
                                                height: '100%',
                                                backgroundImage: `url(${slide.image_url || slide.image})`,
                                                backgroundSize: 'cover',
                                                backgroundPosition: 'center',
                                            }} 
                                        />
                                        {/* Premium Multi-layer Overlay */}
                                        <div style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '100%',
                                            background: 'linear-gradient(to right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.85) 100%)',
                                        }} />
                                        <div style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '100%',
                                            background: 'linear-gradient(to top, #050505 0%, transparent 40%, rgba(0,0,0,0.3) 100%)',
                                        }} />
                                    </div>

                                    {/* Content inside the slide */}
                                    <div className="container" style={{
                                        position: 'relative',
                                        zIndex: 10,
                                        color: '#fff',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                        height: '100%',
                                        padding: '0 20px',
                                        maxWidth: '1200px',
                                        margin: '0 auto',
                                        paddingBottom: '80px'
                                    }}>
                                        {(() => {
                                            const realIndex = slides.length > 1 
                                                ? (index === 0 ? slides.length - 1 : index === slides.length + 1 ? 0 : index - 1)
                                                : index;
                                            const isActiveText = imageIndex === realIndex;
                                            
                                            return (
                                                <motion.div 
                                                    initial={{ opacity: 0, y: 40, scale: 0.95 }}
                                                    animate={{ 
                                                        opacity: isActiveText ? 1 : 0,
                                                        y: isActiveText ? 0 : 40,
                                                        scale: isActiveText ? 1 : 0.95,
                                                    }}
                                                    transition={isJump ? { duration: 0 } : { 
                                                        duration: 0.8, 
                                                        ease: [0.16, 1, 0.3, 1],
                                                        delay: isActiveText ? 0.2 : 0 
                                                    }}
                                                    style={{
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        textAlign: 'center',
                                                        width: '100%'
                                                    }}
                                                >
                                            <div style={{
                                                padding: 'clamp(20px, 5vw, 40px) clamp(10px, 4vw, 30px)',
                                                maxWidth: '800px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                            }}>
                                                <h1 style={{
                                                    fontSize: 'clamp(2.5rem, 6vw, 5rem)',
                                                    fontWeight: '700',
                                                    marginBottom: '20px',
                                                    fontFamily: 'var(--font-heading)',
                                                    lineHeight: '1.4',
                                                    padding: '10px 0',
                                                    letterSpacing: '0px',
                                                    textShadow: '0 4px 20px rgba(0,0,0,0.5)',
                                                    background: 'linear-gradient(to bottom, #ffffff, #d1d1d1)',
                                                    WebkitBackgroundClip: 'text',
                                                    WebkitTextFillColor: 'transparent',
                                                }}>
                                                    {slide.title}
                                                </h1>
                                                
                                                <p style={{
                                                    fontSize: 'clamp(1rem, 2vw, 1.25rem)',
                                                    color: '#e0e0e0',
                                                    maxWidth: '600px',
                                                    margin: '0 auto 35px auto',
                                                    fontFamily: 'var(--font-main)',
                                                    lineHeight: '1.8',
                                                    fontWeight: '300'
                                                }}>
                                                    {slide.description || 'مجموعة حصرية تجمع بين أصالة الماضي وتقنيات المستقبل، صُممت خصيصاً لترتقي بأسلوب حياتك.'}
                                                </p>

                                                <motion.button
                                                    whileHover={{ scale: 1.05, boxShadow: '0 0 25px rgba(212, 175, 55, 0.4)' }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
                                                    style={{
                                                        background: 'linear-gradient(135deg, var(--primary) 0%, #b8860b 100%)',
                                                        color: '#000',
                                                        border: 'none',
                                                        padding: '16px 40px',
                                                        fontSize: '1.1rem',
                                                        fontWeight: 'bold',
                                                        letterSpacing: '1px',
                                                        borderRadius: '30px',
                                                        fontFamily: 'var(--font-main)',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '10px',
                                                        boxShadow: '0 10px 20px rgba(0,0,0,0.3)',
                                                    }}
                                                >
                                                    <ShoppingBag size={20} />
                                                    تسوق التشكيلة
                                                </motion.button>
                                            </div>
                                        </motion.div>
                                        );
                                        })()}
                                    </div>
                                </div>
                            ))}
                        </motion.div>

                            {/* Left/Right Navigation Arrows */}
                            {slides.length > 1 && (
                                <>
                                    <button 
                                        onClick={handleNext} // For Arabic (RTL), Next is usually Left Arrow, but let's map visually
                                        className="hero-nav-btn"
                                        style={{
                                            position: 'absolute',
                                            left: '20px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            background: 'rgba(255,255,255,0.1)',
                                            border: '1px solid rgba(255,255,255,0.2)',
                                            color: '#fff',
                                            width: '50px',
                                            height: '50px',
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            backdropFilter: 'blur(10px)',
                                            transition: 'all 0.3s ease',
                                            zIndex: 20
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'var(--primary)';
                                            e.currentTarget.style.color = '#000';
                                            e.currentTarget.style.borderColor = 'var(--primary)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                                            e.currentTarget.style.color = '#fff';
                                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                                        }}
                                    >
                                        <ChevronLeft size={24} />
                                    </button>
                                    <button 
                                        onClick={handlePrev}
                                        className="hero-nav-btn"
                                        style={{
                                            position: 'absolute',
                                            right: '20px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            background: 'rgba(255,255,255,0.1)',
                                            border: '1px solid rgba(255,255,255,0.2)',
                                            color: '#fff',
                                            width: '50px',
                                            height: '50px',
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            backdropFilter: 'blur(10px)',
                                            transition: 'all 0.3s ease',
                                            zIndex: 20
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'var(--primary)';
                                            e.currentTarget.style.color = '#000';
                                            e.currentTarget.style.borderColor = 'var(--primary)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                                            e.currentTarget.style.color = '#fff';
                                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                                        }}
                                    >
                                        <ChevronRight size={24} />
                                    </button>
                                </>
                            )}

                            {/* Premium Progress Indicators */}
                            {slides.length > 1 && (
                                <div style={{ 
                                    position: 'absolute',
                                    bottom: '40px',
                                    left: '0',
                                    width: '100%',
                                    display: 'flex', 
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    zIndex: 20
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        gap: '12px',
                                        background: 'rgba(10, 10, 10, 0.6)',
                                        padding: '12px 24px',
                                        borderRadius: '30px',
                                        backdropFilter: 'blur(10px)',
                                        border: '1px solid rgba(255,255,255,0.1)'
                                    }}>
                                        {slides.map((_, index) => (
                                            <div
                                                key={index}
                                                onClick={() => {
                                                    const diff = index - imageIndex;
                                                    if (diff !== 0) {
                                                        paginate(diff);
                                                    }
                                                }}
                                                style={{
                                                    width: imageIndex === index ? '30px' : '10px',
                                                    height: '6px',
                                                    borderRadius: '10px',
                                                    background: imageIndex === index ? 'var(--primary)' : 'rgba(255,255,255,0.3)',
                                                    cursor: 'pointer',
                                                    position: 'relative',
                                                    overflow: 'hidden',
                                                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                                                }}
                                            >
                                                {imageIndex === index && (
                                                    <motion.div
                                                        initial={{ width: '0%' }}
                                                        animate={{ width: '100%' }}
                                                        transition={{ duration: 3, ease: "linear" }}
                                                        style={{
                                                            position: 'absolute',
                                                            top: 0,
                                                            left: 0,
                                                            height: '100%',
                                                            background: '#fff',
                                                            opacity: 0.5
                                                        }}
                                                    />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                @keyframes scrollAnim {
                    0% { opacity: 0; transform: translate(-50%, 0); }
                    50% { opacity: 1; transform: translate(-50%, 15px); }
                    100% { opacity: 0; transform: translate(-50%, 25px); }
                }
                
                @media (max-width: 768px) {
                    .hero-nav-btn {
                        display: none !important;
                    }
                }
            `}</style>
        </div>
    );
}
