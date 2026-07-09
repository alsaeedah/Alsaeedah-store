import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabase/client';
import { subscribeToHero } from '../services/productService';

export default function Hero() {
    const [slides, setSlides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [logoLoaded, setLogoLoaded] = useState(false); // New state to handle logo flash
    const [currentSlide, setCurrentSlide] = useState(0);

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
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 5000); 
        return () => clearInterval(timer);
    }, [slides.length, loading]);

    return (
        <div style={{
            position: 'relative',
            width: '100%',
            height: '100vh',
            minHeight: '600px',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0a0a0a'
        }}>
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
                            background: 'linear-gradient(-45deg, #050505, #1a150a, #050505, #120f06)',
                            backgroundSize: '400% 400%',
                            animation: 'glowBg 8s ease infinite',
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
                                scale: [1, 1.02, 1],
                                opacity: [0.8, 1, 0.8] 
                            }}
                            transition={{ duration: 3, repeat: Infinity }}
                            style={{ textAlign: 'center' }}
                        >
                            {/* Only show image tag if it is fully loaded to avoid broken icon mark */}
                            <img 
                                src="/logo.png" 
                                onLoad={() => setLogoLoaded(true)}
                                style={{ 
                                    width: '240px', 
                                    height: '240px', 
                                    border: 'none', 
                                    outline: 'none',
                                    opacity: logoLoaded ? 1 : 0,
                                    transition: 'opacity 0.5s ease-in',
                                    filter: 'drop-shadow(0 0 30px rgba(212, 175, 55, 0.4))' 
                                }}
                            />
                            <h2 style={{ 
                                color: 'var(--primary)', 
                                marginTop: '20px',
                                fontSize: 'clamp(2.5rem, 8vw, 4.5rem)', // Responsive bold font
                                letterSpacing: '2px', 
                                fontWeight: '900', 
                                textTransform: 'uppercase',
                                fontFamily: 'var(--font-main)',
                                textShadow: '0 0 40px rgba(212, 175, 55, 0.4)',
                                textAlign: 'center',
                                width: '100%'
                            }}>
                                متجر السعيدة
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
                            <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '2px' }}>اسحب للأسفل</span>
                            <div style={{
                                width: '26px',
                                height: '45px',
                                border: '2px solid var(--primary)',
                                borderRadius: '15px',
                                position: 'relative'
                            }}>
                                <div style={{
                                    width: '4px',
                                    height: '8px',
                                    background: 'var(--primary)',
                                    borderRadius: '2px',
                                    position: 'absolute',
                                    top: '8px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    animation: 'scrollAnim 2s infinite'
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
                            zIndex: 0
                        }}
                    >
                        {/* Background images for slider */}
                        {slides.map((slide, index) => (
                            <div key={slide.id} style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                opacity: currentSlide === index ? 1 : 0,
                                transition: 'opacity 1.5s ease-in-out'
                            }}>
                                <div style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    backgroundImage: `url(${slide.image_url || slide.image})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    filter: 'brightness(0.6)'
                                }} />
                                <div style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent 60%)',
                                }} />
                            </div>
                        ))}

                        <div className="container" style={{
                            position: 'relative',
                            zIndex: 10,
                            textAlign: 'center',
                            color: '#fff',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center', // Center the whole group
                            height: '100%',
                            gap: '20px'
                        }}>
                            {/* Text Area - Reserved Space to prevent button jump */}
                            <div style={{ minHeight: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {slides.map((slide, index) => (
                                    <motion.div 
                                        key={slide.id} 
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ 
                                            opacity: currentSlide === index ? 1 : 0,
                                            y: currentSlide === index ? 0 : 20
                                        }}
                                        transition={{ duration: 0.8 }}
                                        style={{
                                            position: currentSlide === index ? 'relative' : 'absolute',
                                            display: currentSlide === index ? 'block' : 'none',
                                            marginBottom: '10px'
                                        }}
                                    >
                                        <h1 style={{
                                            fontSize: '5rem',
                                            fontWeight: '700',
                                            marginBottom: '10px',
                                            textShadow: '0 4px 20px rgba(0,0,0,0.5)',
                                        }}>
                                            {slide.title}
                                            <br />
                                            <span style={{
                                                color: 'var(--primary)',
                                                fontSize: '2.5rem',
                                                fontWeight: '300',
                                                display: 'block'
                                            }}>
                                                {slide.subtitle}
                                            </span>
                                        </h1>
                                        <p style={{
                                            fontSize: '1.1rem',
                                            color: '#e0e0e0',
                                            maxWidth: '600px',
                                            margin: '0 auto'
                                        }}>
                                            {slide.description || 'مجموعة حصرية تجمع بين أصالة الماضي وتقنيات المستقبل'}
                                        </p>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Permanent Shop Now Button */}
                            <div style={{ marginTop: '0px' }}>
                                <button
                                    className="btn-primary"
                                    onClick={() => document.getElementById('products').scrollIntoView({ behavior: 'smooth' })}
                                >
                                    تسوق الآن
                                </button>
                            </div>

                            {/* Indicators */}
                            <div style={{ height: '70px', display: 'flex', alignItems: 'center' }}>
                                <div style={{
                                    display: 'flex',
                                    gap: '12px',
                                    background: 'rgba(0,0,0,0.3)',
                                    padding: '10px 20px',
                                    borderRadius: '30px',
                                    backdropFilter: 'blur(5px)'
                                }}>
                                    {slides.map((_, index) => (
                                        <div
                                            key={index}
                                            onClick={() => setCurrentSlide(index)}
                                            style={{
                                                width: currentSlide === index ? '12px' : '8px',
                                                height: currentSlide === index ? '12px' : '8px',
                                                borderRadius: '50%',
                                                background: currentSlide === index ? 'var(--primary)' : 'rgba(255,255,255,0.5)',
                                                cursor: 'pointer'
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                @keyframes scrollAnim {
                    0% { opacity: 0; transform: translate(-50%, 0); }
                    50% { opacity: 1; transform: translate(-50%, 15px); }
                    100% { opacity: 0; transform: translate(-50%, 25px); }
                }
                @keyframes glowBg {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
            `}</style>
        </div>
    );
}
