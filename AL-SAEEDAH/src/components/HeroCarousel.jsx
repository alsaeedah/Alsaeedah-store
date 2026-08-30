import { useState, useEffect, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { ShoppingBag, ChevronRight, ChevronLeft } from 'lucide-react';
import { subscribeToHero } from '../services/productService';

const getCloudinaryBlurUrl = (url) => {
    if (!url || !url.includes('cloudinary.com')) return url;
    return url.replace('/upload/', '/upload/w_100,e_blur:1000,q_auto,f_auto/');
};

const getCloudinaryOptimizedUrl = (url) => {
    if (!url || !url.includes('cloudinary.com')) return url;
    return url.replace('/upload/', '/upload/q_auto,f_auto/');
};

const BlurUpImage = ({ src, alt }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    
    const blurUrl = getCloudinaryBlurUrl(src);
    const optimizedUrl = getCloudinaryOptimizedUrl(src);

    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            overflow: 'hidden'
        }}>
            {/* Low-res blurred placeholder */}
            <div 
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundImage: `url(${blurUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    filter: 'blur(20px)',
                    transform: 'scale(1.1)', // Prevent blur edges from showing
                    opacity: isLoaded ? 0 : 1,
                    transition: 'opacity 0.5s ease-in-out',
                    zIndex: 1
                }} 
            />
            {/* High-res image */}
            <div 
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundImage: `url(${optimizedUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    opacity: isLoaded ? 1 : 0,
                    transition: 'opacity 0.8s ease-in-out',
                    zIndex: 2
                }} 
            />
            {/* Hidden img tag just to track loading */}
            <img 
                src={optimizedUrl} 
                alt={alt} 
                onLoad={() => setIsLoaded(true)}
                style={{ display: 'none' }}
            />
        </div>
    );
};

export default function HeroCarousel() {
    const [slides, setSlides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [logoLoaded, setLogoLoaded] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);

    const [emblaRef, emblaApi] = useEmblaCarousel(
        { loop: true, direction: 'rtl' }, 
        [Autoplay({ delay: 5000, stopOnInteraction: true, stopOnMouseEnter: true })]
    );

    const scrollPrev = useCallback(() => {
        if (emblaApi) emblaApi.scrollPrev();
    }, [emblaApi]);

    const scrollNext = useCallback(() => {
        if (emblaApi) emblaApi.scrollNext();
    }, [emblaApi]);

    const scrollTo = useCallback((index) => {
        if (emblaApi) emblaApi.scrollTo(index);
    }, [emblaApi]);

    const onSelect = useCallback(() => {
        if (!emblaApi) return;
        setSelectedIndex(emblaApi.selectedScrollSnap());
    }, [emblaApi]);

    useEffect(() => {
        if (!emblaApi) return;
        onSelect();
        emblaApi.on('select', onSelect);
        emblaApi.on('reInit', onSelect);
        return () => {
            emblaApi.off('select', onSelect);
            emblaApi.off('reInit', onSelect);
        };
    }, [emblaApi, onSelect]);

    useEffect(() => {
        const unsubscribe = subscribeToHero((data) => {
            setSlides(data && data.length > 0 ? data : []);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

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
                background: 'var(--bg-main)',
                touchAction: 'pan-y',
                overscrollBehaviorX: 'none'
            }}
        >
            {/* Loading Placeholder */}
            {(loading && slides.length === 0) && (
                <div 
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: 'var(--bg-main)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column',
                        zIndex: 50,
                        paddingBottom: '100px',
                        transition: 'opacity 0.8s'
                    }}
                >
                    <div style={{ textAlign: 'center', animation: 'pulseLogo 2.5s infinite ease-in-out' }}>
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
                    </div>

                    {/* Scroll Icon */}
                    <div
                        onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
                        style={{
                            position: 'absolute',
                            bottom: '40px',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '10px',
                            color: 'var(--primary)',
                            animation: 'fadeIn 2s ease-in forwards 1s'
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
                    </div>
                </div>
            )}

            {/* Slider Layer & Details */}
            {!loading && slides.length > 0 && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    zIndex: 0,
                    overflow: 'hidden',
                    animation: 'fadeIn 1.5s ease-in-out'
                }}>
                    <div className="embla" ref={emblaRef} style={{ width: '100%', height: '100%' }} dir="rtl">
                        <div className="embla__container" style={{ display: 'flex', height: '100%' }}>
                            {slides.map((slide, index) => (
                                <div className="embla__slide" key={slide.id || index} style={{ 
                                    flex: '0 0 100%', 
                                    minWidth: 0,
                                    position: 'relative',
                                    height: '100%'
                                }}>
                                    {/* Background */}
                                    <div style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%',
                                        zIndex: 0
                                    }}>
                                        <BlurUpImage src={slide.image_url || slide.image} alt={slide.title} />
                                        {/* Premium Multi-layer Overlay */}
                                        <div style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '100%',
                                            background: 'linear-gradient(to right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.85) 100%)',
                                            zIndex: 3
                                        }} />
                                        <div style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '100%',
                                            background: `linear-gradient(to top, var(--bg-main) 0%, transparent 40%, var(--hero-overlay) 100%)`,
                                            zIndex: 4
                                        }} />
                                    </div>

                                    {/* Content inside the slide */}
                                    <div className="container" style={{
                                        position: 'relative',
                                        zIndex: 10,
                                        color: 'var(--hero-text-color)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                        height: '100%',
                                        padding: '0 20px',
                                        maxWidth: '1200px',
                                        margin: '0 auto',
                                        paddingBottom: '80px'
                                    }}>
                                        <div 
                                            className={`slide-content ${selectedIndex === index ? 'active' : ''}`}
                                            style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                textAlign: 'center',
                                                width: '100%',
                                                opacity: selectedIndex === index ? 1 : 0,
                                                transform: `translateY(${selectedIndex === index ? '0' : '40px'}) scale(${selectedIndex === index ? 1 : 0.95})`,
                                                transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                                                transitionDelay: selectedIndex === index ? '0.2s' : '0s'
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

                                                <button
                                                    className="hero-cta-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
                                                    }}
                                                    style={{
                                                    background: 'linear-gradient(135deg, var(--primary) 0%, #b8860b 100%)',
                                                        color: 'var(--btn-text)',
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
                                                        transition: 'transform 0.2s, box-shadow 0.2s'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.transform = 'scale(1.05)';
                                                        e.currentTarget.style.boxShadow = '0 0 25px rgba(212, 175, 55, 0.4)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.transform = 'scale(1)';
                                                        e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.3)';
                                                    }}
                                                    onMouseDown={(e) => {
                                                        e.currentTarget.style.transform = 'scale(0.98)';
                                                    }}
                                                    onMouseUp={(e) => {
                                                        e.currentTarget.style.transform = 'scale(1.05)';
                                                    }}
                                                >
                                                    <ShoppingBag size={20} />
                                                    تسوق التشكيلة
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Left/Right Navigation Arrows */}
                    {slides.length > 1 && (
                        <>
                            <button 
                                onClick={scrollNext} // For Arabic (RTL), Next is Left Arrow
                                className="hero-nav-btn"
                                style={{
                                    position: 'absolute',
                                    left: '20px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'var(--glass-hover)',
                                    border: '1px solid var(--border-color)',
                                    color: 'var(--hero-text-color)',
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
                                    e.currentTarget.style.color = 'var(--btn-text)';
                                    e.currentTarget.style.borderColor = 'var(--primary)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'var(--glass-hover)';
                                    e.currentTarget.style.color = 'var(--hero-text-color)';
                                    e.currentTarget.style.borderColor = 'var(--border-color)';
                                }}
                            >
                                <ChevronLeft size={24} />
                            </button>
                            <button 
                                onClick={scrollPrev} // For Arabic (RTL), Prev is Right Arrow
                                className="hero-nav-btn"
                                style={{
                                    position: 'absolute',
                                    right: '20px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'var(--glass-hover)',
                                    border: '1px solid var(--border-color)',
                                    color: 'var(--hero-text-color)',
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
                                    e.currentTarget.style.color = 'var(--btn-text)';
                                    e.currentTarget.style.borderColor = 'var(--primary)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'var(--glass-hover)';
                                    e.currentTarget.style.color = 'var(--hero-text-color)';
                                    e.currentTarget.style.borderColor = 'var(--border-color)';
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
                                background: 'var(--overlay-dim)',
                                padding: '12px 24px',
                                borderRadius: '30px',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid var(--border-color)'
                            }}>
                                {slides.map((_, index) => (
                                    <div
                                        key={index}
                                        onClick={() => scrollTo(index)}
                                        style={{
                                            width: selectedIndex === index ? '30px' : '10px',
                                            height: '6px',
                                            borderRadius: '10px',
                                            background: selectedIndex === index ? 'var(--primary)' : 'rgba(255,255,255,0.3)',
                                            cursor: 'pointer',
                                            position: 'relative',
                                            overflow: 'hidden',
                                            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            <style>{`
                @keyframes scrollAnim {
                    0% { opacity: 0; transform: translate(-50%, 0); }
                    50% { opacity: 1; transform: translate(-50%, 15px); }
                    100% { opacity: 0; transform: translate(-50%, 25px); }
                }
                
                @keyframes pulseLogo {
                    0% { transform: scale(1); opacity: 0.7; }
                    50% { transform: scale(1.05); opacity: 1; }
                    100% { transform: scale(1); opacity: 0.7; }
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
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
