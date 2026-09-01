const fs = require('fs');
const path = require('path');

const filePath = path.resolve('src/pages/Orders.jsx');
let content = fs.readFileSync(filePath, 'utf-8');

// Replace OrderCard usage
content = content.replace(/onInvoice=\{generateInvoice\}/g, `onDownloadInvoice={handleDownloadInvoice} 
                                    onPrintInvoice={handlePrintInvoice}
                                    isInvoiceLoading={invoiceLoadingId?.id === order.id}
                                    invoiceAction={invoiceLoadingId?.id === order.id ? invoiceLoadingId.action : null}`);

// Replace OrderCard definition
content = content.replace(
    "const OrderCard = ({ order, index, lastOrderRef, onUpdateStatus, onDelete, onInvoice, onImageClick, isHighlighted, isDeleting, setRef }) => {",
    "const OrderCard = ({ order, index, lastOrderRef, onUpdateStatus, onDelete, onDownloadInvoice, onPrintInvoice, isInvoiceLoading, invoiceAction, onImageClick, isHighlighted, isDeleting, setRef }) => {"
);

// Replace the buttons inside OrderCard
const old_buttons = `                        <motion.button 
                            whileHover={{ scale: 1.02 }} 
                            whileTap={{ scale: 0.98 }} 
                            onClick={() => onInvoice(order, invoiceType)} 
                            style={{ flex: 1, padding: isMobile ? '0 6px' : '0 15px', height: isMobile ? '38px' : '44px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: isMobile ? '4px' : '8px', fontSize: isMobile ? '0.7rem' : '0.85rem', fontWeight: '700', whiteSpace: 'nowrap' }}>
                            <Download size={isMobile ? 14 : 16} /> فاتورة
                        </motion.button>`;

const new_buttons = `                        <motion.button 
                            whileHover={isInvoiceLoading ? {} : { scale: 1.02 }} 
                            whileTap={isInvoiceLoading ? {} : { scale: 0.98 }} 
                            onClick={() => !isInvoiceLoading && onPrintInvoice(order, invoiceType)} 
                            disabled={isInvoiceLoading}
                            style={{ flex: 1, padding: isMobile ? '0 6px' : '0 15px', height: isMobile ? '38px' : '44px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)', cursor: isInvoiceLoading ? 'not-allowed' : 'pointer', opacity: isInvoiceLoading ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: isMobile ? '4px' : '8px', fontSize: isMobile ? '0.7rem' : '0.85rem', fontWeight: '700', whiteSpace: 'nowrap' }}>
                            {isInvoiceLoading && invoiceAction === 'print' ? <Loader2 className="animate-spin" size={isMobile ? 14 : 16} /> : <Printer size={isMobile ? 14 : 16} />} طباعة
                        </motion.button>
                        <motion.button 
                            whileHover={isInvoiceLoading ? {} : { scale: 1.02 }} 
                            whileTap={isInvoiceLoading ? {} : { scale: 0.98 }} 
                            onClick={() => !isInvoiceLoading && onDownloadInvoice(order, invoiceType)} 
                            disabled={isInvoiceLoading}
                            style={{ flex: 1, padding: isMobile ? '0 6px' : '0 15px', height: isMobile ? '38px' : '44px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)', cursor: isInvoiceLoading ? 'not-allowed' : 'pointer', opacity: isInvoiceLoading ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: isMobile ? '4px' : '8px', fontSize: isMobile ? '0.7rem' : '0.85rem', fontWeight: '700', whiteSpace: 'nowrap' }}>
                            {isInvoiceLoading && invoiceAction === 'download' ? <Loader2 className="animate-spin" size={isMobile ? 14 : 16} /> : <Download size={isMobile ? 14 : 16} />} تحميل
                        </motion.button>`;

// we need to match it accurately, windows has \r\n, so let's do a regex replace
const oldButtonsRegex = /<motion\.button[\s\S]*?onClick=\{\(\) => onInvoice\(order, invoiceType\)\}[\s\S]*?<\/motion\.button>/;

content = content.replace(oldButtonsRegex, new_buttons);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('OrderCard fixed with Node!');
