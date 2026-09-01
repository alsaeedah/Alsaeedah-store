import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Printer, FileText, Loader2 } from 'lucide-react';

const InvoiceActionMenu = ({ 
    order, 
    invoiceType, 
    onDownloadInvoice, 
    onPrintInvoice, 
    isInvoiceLoading, 
    invoiceAction,
    isMobile 
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleEscape);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen]);

    const handleDownloadClick = () => {
        if (!isInvoiceLoading) {
            onDownloadInvoice(order, invoiceType);
            setIsOpen(false);
        }
    };

    const handlePrintClick = () => {
        if (!isInvoiceLoading) {
            onPrintInvoice(order, invoiceType);
            setIsOpen(false);
        }
    };

    return (
        <div ref={menuRef} style={{ position: 'relative', display: 'flex', flex: 1 }}>
            <motion.button
                whileHover={isInvoiceLoading ? {} : { scale: 1.02 }}
                whileTap={isInvoiceLoading ? {} : { scale: 0.98 }}
                onClick={() => setIsOpen(!isOpen)}
                disabled={isInvoiceLoading}
                aria-haspopup="menu"
                aria-expanded={isOpen}
                style={{
                    flex: 1,
                    padding: isMobile ? '0 6px' : '0 15px',
                    height: isMobile ? '38px' : '44px',
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.05)',
                    color: '#fff',
                    border: '1px solid var(--border-color)',
                    cursor: isInvoiceLoading ? 'not-allowed' : 'pointer',
                    opacity: isInvoiceLoading ? 0.5 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: isMobile ? '4px' : '8px',
                    fontSize: isMobile ? '0.7rem' : '0.85rem',
                    fontWeight: '700',
                    whiteSpace: 'nowrap',
                    width: '100%'
                }}
            >
                {isInvoiceLoading ? (
                    <Loader2 className="animate-spin" size={isMobile ? 14 : 16} />
                ) : (
                    <FileText size={isMobile ? 14 : 16} />
                )}
                الفاتورة
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        style={{
                            position: 'absolute',
                            bottom: 'calc(100% + 8px)',
                            right: 0,
                            minWidth: '180px',
                            background: '#141414',
                            border: '1px solid var(--border-color)',
                            borderRadius: '12px',
                            padding: '8px',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                            zIndex: 50,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px'
                        }}
                    >
                        <button
                            onClick={handleDownloadClick}
                            disabled={isInvoiceLoading}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                width: '100%',
                                padding: '10px 12px',
                                background: 'transparent',
                                border: 'none',
                                borderRadius: '8px',
                                color: '#fff',
                                cursor: isInvoiceLoading ? 'not-allowed' : 'pointer',
                                textAlign: 'right',
                                fontSize: '0.85rem',
                                fontWeight: '600',
                                transition: 'background 0.2s',
                                opacity: (isInvoiceLoading && invoiceAction !== 'download') ? 0.5 : 1
                            }}
                            onMouseOver={(e) => {
                                if (!isInvoiceLoading) e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.background = 'transparent';
                            }}
                        >
                            {isInvoiceLoading && invoiceAction === 'download' ? (
                                <Loader2 className="animate-spin" size={16} />
                            ) : (
                                <Download size={16} color="var(--primary)" />
                            )}
                            تحميل الفاتورة
                        </button>
                        
                        <button
                            onClick={handlePrintClick}
                            disabled={isInvoiceLoading}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                width: '100%',
                                padding: '10px 12px',
                                background: 'transparent',
                                border: 'none',
                                borderRadius: '8px',
                                color: '#fff',
                                cursor: isInvoiceLoading ? 'not-allowed' : 'pointer',
                                textAlign: 'right',
                                fontSize: '0.85rem',
                                fontWeight: '600',
                                transition: 'background 0.2s',
                                opacity: (isInvoiceLoading && invoiceAction !== 'print') ? 0.5 : 1
                            }}
                            onMouseOver={(e) => {
                                if (!isInvoiceLoading) e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.background = 'transparent';
                            }}
                        >
                            {isInvoiceLoading && invoiceAction === 'print' ? (
                                <Loader2 className="animate-spin" size={16} />
                            ) : (
                                <Printer size={16} color="var(--primary)" />
                            )}
                            طباعة الفاتورة
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default InvoiceActionMenu;
