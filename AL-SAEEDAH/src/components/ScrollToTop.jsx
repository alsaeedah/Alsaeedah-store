import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp } from "lucide-react";

export default function ScrollToTop() {
    const { pathname } = useLocation();
    const [isVisible, setIsVisible] = useState(false);

    // Reset scroll on route change
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    // Handle scroll visibility
    useEffect(() => {
        const toggleVisibility = () => {
            if (window.pageYOffset > 400) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener("scroll", toggleVisibility);
        return () => window.removeEventListener("scroll", toggleVisibility);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.button
                    initial={{ opacity: 0, scale: 0.5, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.5, y: 20 }}
                    whileHover={{ 
                        scale: 1.1, 
                        backgroundColor: 'var(--primary)', 
                        color: '#000',
                        boxShadow: '0 0 20px rgba(212, 175, 55, 0.6)' 
                    }}
                    whileTap={{ scale: 0.9 }}
                    onClick={scrollToTop}
                    title="العودة للأعلى"
                    style={{
                        position: 'fixed',
                        bottom: '30px',
                        right: '30px',
                        zIndex: 2000,
                        width: '50px',
                        height: '50px',
                        borderRadius: '50%',
                        background: 'var(--glass)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid var(--primary)',
                        color: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                        transition: 'background-color 0.3s, color 0.3s, box-shadow 0.3s'
                    }}
                >
                    <ChevronUp size={28} strokeWidth={3} />
                </motion.button>
            )}
        </AnimatePresence>
    );
}
