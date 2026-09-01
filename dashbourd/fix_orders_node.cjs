const fs = require('fs');
const path = require('path');

const filePath = path.resolve('src/pages/Orders.jsx');
let content = fs.readFileSync(filePath, 'utf-8');

const badPattern = /        }\r?\n    };\r?\n\r?\n                    fontWeight: '900',/g;

const goodReplacement = `        }
    };

    const handleDownloadInvoice = async (order, paymentType) => {
        setInvoiceLoadingId({ id: order.id, action: 'download' });
        try {
            const result = await downloadInvoice(order, paymentType);
            if (result && result.message) {
                Swal.fire({
                    icon: 'success',
                    title: 'تم الحفظ',
                    text: result.message,
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000,
                    background: '#141414',
                    color: '#fff'
                });
            }
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'خطأ', text: error.message || 'فشل تحميل الفاتورة', background: '#141414', color: '#fff' });
        } finally {
            setInvoiceLoadingId(null);
        }
    };

    const handlePrintInvoice = async (order, paymentType) => {
        setInvoiceLoadingId({ id: order.id, action: 'print' });
        try {
            await printInvoice(order, paymentType);
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'خطأ', text: error.message || 'فشل طباعة الفاتورة', background: '#141414', color: '#fff' });
        } finally {
            setInvoiceLoadingId(null);
        }
    };

    const pendingCount = orders.filter(o => o.status === 'pending').length;
    const completedCount = orders.filter(o => o.status === 'completed').length;
    const totalRevenue = orders.filter(o => o.status === 'completed').reduce((acc, o) => acc + (Number(o.total_amount) || 0), 0);

    return (
        <div style={{ direction: 'rtl', padding: '10px' }}>
            <div style={{ marginBottom: isMobile ? '2rem' : '3rem' }}>
                <h1 style={{ 
                    fontSize: isMobile ? '1.8rem' : '2.8rem', 
                    fontWeight: '900',`;

content = content.replace(badPattern, goodReplacement);

// Also we need to strip jsPDF and html2canvas imports
content = content.replace(/import jsPDF from 'jspdf';\r?\n/g, '');
content = content.replace(/import html2canvas from 'html2canvas';\r?\n/g, '');

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Orders.jsx rewritten with Node!');
