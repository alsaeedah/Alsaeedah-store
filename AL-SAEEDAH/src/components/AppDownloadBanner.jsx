import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Smartphone } from 'lucide-react';
import { Capacitor } from '@capacitor/core';

export default function AppDownloadBanner() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // 1. Check if user is on Android
        const isAndroid = /Android/i.test(navigator.userAgent);
        
        // 2. Check if user is NOT on native platform (ensure it's the web version)
        const isNative = Capacitor.isNativePlatform();
        
        // 3. Check if user has closed it in this session
        const hasClosed = sessionStorage.getItem('hideAppBanner');

        if (isAndroid && !isNative && !hasClosed) {
            // Show banner after 3 seconds to not overwhelm the user immediately
            const timer = setTimeout(() => {
                setIsVisible(true);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        // Save to session storage so it doesn't reappear until the browser is reopened
        sessionStorage.setItem('hideAppBanner', 'true');
    };

    const handleDownload = () => {
        // Link to the mobile app landing page
        window.location.href = '/app';
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    style={{
                        position: 'fixed',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        zIndex: 10000, // Above everything
                        padding: '16px 20px',
                        background: 'rgba(10, 10, 10, 0.9)',
                        backdropFilter: 'blur(20px)',
                        borderTop: '1px solid rgba(212, 175, 55, 0.4)',
                        borderTopLeftRadius: '28px',
                        borderTopRightRadius: '28px',
                        boxShadow: '0 -15px 40px rgba(0,0,0,0.6)',
                        direction: 'rtl',
                        paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0))' // Respect safe areas
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        {/* App Icon Glow Effect */}
                        <div style={{ position: 'relative' }}>
                            <div style={{
                                position: 'absolute',
                                inset: '-4px',
                                background: 'var(--primary)',
                                borderRadius: '16px',
                                opacity: 0.2,
                                filter: 'blur(8px)'
                            }}></div>
                            <div style={{
                                width: '52px',
                                height: '52px',
                                borderRadius: '14px',
                                background: 'linear-gradient(135deg, #d4af37, #f1d592)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '1px solid rgba(255,255,255,0.1)',
                                position: 'relative',
                                flexShrink: 0,
                                overflow: 'hidden'
                            }}>
                                <Smartphone size={26} color="#000" />
                            </div>
                        </div>
                        
                        <div style={{ flex: 1 }}>
                            <h4 style={{ color: '#fff', fontSize: '1rem', fontWeight: '900', marginBottom: '2px' }}>تطبيق Time Tick</h4>
                            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', lineHeight: '1.3', fontWeight: '500' }}>
                                تجربة تسوق متكاملة، أسرع وبدون انقطاع
                            </p>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <motion.button 
                                whileTap={{ scale: 0.95 }}
                                onClick={handleDownload}
                                style={{
                                    background: 'var(--primary)',
                                    color: '#000',
                                    border: 'none',
                                    padding: '10px 20px',
                                    borderRadius: '14px',
                                    fontSize: '0.9rem',
                                    fontWeight: '900',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    cursor: 'pointer',
                                    boxShadow: '0 8px 20px rgba(212, 175, 55, 0.2)'
                                }}
                            >
                                <Download size={18} strokeWidth={3} />
                                تثبيت
                            </motion.button>
                            
                            <button 
                                onClick={handleClose}
                                style={{
                                    background: 'rgba(255,255,255,0.08)',
                                    color: 'rgba(255,255,255,0.6)',
                                    border: 'none',
                                    width: '38px',
                                    height: '38px',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    transition: '0.2s'
                                }}
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
