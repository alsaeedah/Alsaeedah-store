import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import FilterControls from './FilterControls';
import './filters.css';

export default function MobileFilterDrawer({ isOpen, onClose, ...filterProps }) {
    
    // Scroll lock
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{
                            position: 'fixed',
                            top: 0, left: 0, right: 0, bottom: 0,
                            background: 'rgba(0,0,0,0.5)',
                            zIndex: 2999,
                            backdropFilter: 'blur(4px)'
                        }}
                        onClick={onClose}
                    />
                    <motion.div
                        className="mobile-filter-drawer"
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200, mass: 0.8 }}
                    >
                        <div className="mobile-filter-header">
                            <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-main)' }}>الفلاتر</h3>
                            <button 
                                onClick={onClose}
                                style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: '4px' }}
                            >
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div className="mobile-filter-content">
                            <FilterControls {...filterProps} />
                        </div>

                        <div className="mobile-filter-footer">
                            <button className="mobile-filter-btn apply" onClick={onClose}>
                                تطبيق
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
