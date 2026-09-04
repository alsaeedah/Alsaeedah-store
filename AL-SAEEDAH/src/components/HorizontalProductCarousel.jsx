import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, ChevronLeft } from 'lucide-react';

const HorizontalProductCarousel = ({ children, className = '', ...props }) => {
    const scrollRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);
    const [showButtons, setShowButtons] = useState(true);

    const checkScroll = () => {
        if (!scrollRef.current) return;
        const container = scrollRef.current;
        const maxScroll = container.scrollWidth - container.clientWidth;
        
        if (maxScroll <= 5) {
            setShowButtons(false);
            setCanScrollLeft(false);
            setCanScrollRight(false);
            return;
        } else {
            setShowButtons(true);
        }

        const isRtl = window.getComputedStyle(container).direction === 'rtl';
        const absScroll = Math.abs(container.scrollLeft);

        if (isRtl) {
            setCanScrollRight(absScroll > 1);
            setCanScrollLeft(absScroll < maxScroll - 1);
        } else {
            setCanScrollLeft(container.scrollLeft > 1);
            setCanScrollRight(container.scrollLeft < maxScroll - 1);
        }
    };

    useEffect(() => {
        checkScroll();
        window.addEventListener('resize', checkScroll);
        const timer = setTimeout(checkScroll, 300);
        return () => {
            window.removeEventListener('resize', checkScroll);
            clearTimeout(timer);
        };
    }, [children]);

    const scroll = (direction) => {
        if (!scrollRef.current) return;
        const { clientWidth } = scrollRef.current;
        const scrollAmount = clientWidth * 0.8;
        
        if (direction === 'right') {
            scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        } else {
            scrollRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        }
    };

    return (
        <div className="product-carousel-wrapper">
            <motion.div 
                ref={scrollRef} 
                className={`product-carousel-scroll ${className}`}
                onScroll={checkScroll}
                {...props}
            >
                {children}
            </motion.div>
            
            {showButtons && (
                <>
                    <button 
                        className={`carousel-nav-btn right ${!canScrollRight ? 'hidden' : ''}`}
                        onClick={() => scroll('right')}
                        aria-label="التمرير إلى اليمين"
                        disabled={!canScrollRight}
                    >
                        <ChevronRight size={24} />
                    </button>
                    
                    <button 
                        className={`carousel-nav-btn left ${!canScrollLeft ? 'hidden' : ''}`}
                        onClick={() => scroll('left')}
                        aria-label="التمرير إلى اليسار"
                        disabled={!canScrollLeft}
                    >
                        <ChevronLeft size={24} />
                    </button>
                </>
            )}
        </div>
    );
};

export default HorizontalProductCarousel;
