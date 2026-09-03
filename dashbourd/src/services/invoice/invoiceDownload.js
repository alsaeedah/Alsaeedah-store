import { generateInvoicePdf, getCachedInvoice } from './invoiceGenerator';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';

export const downloadInvoice = async (order, paymentType, onProgress) => {
    let artifact = getCachedInvoice(order.id || order.order_number);
    
    if (!artifact) {
        artifact = await generateInvoicePdf(order, paymentType, { onProgress, saveToDocuments: true });
    } else {
        // If it's cached, we should quickly notify progress is complete for the UI
        if (onProgress) {
            onProgress({ stage: 'saving', currentPage: 1, totalPages: 1 });
        }
    }

    const fileName = `invoice_ORD${order.order_number}.pdf`;

    if (Capacitor.isNativePlatform()) {
        try {
            if (artifact.type === 'uri') {
                if (artifact.directory !== Directory.Documents) {
                    // It was generated for printing (Cache), we must copy it to Documents
                    await Filesystem.copy({
                        from: artifact.path,
                        directory: artifact.directory,
                        to: fileName,
                        toDirectory: Directory.Documents
                    });
                }
            } else {
                throw new Error('Internal Error: Missing PDF URI on Android.');
            }

            return { success: true, message: 'تم حفظ الفاتورة في مجلد المستندات (Documents).' };
        } catch (error) {
            console.error('Android download error:', error);
            throw new Error('تعذر حفظ الفاتورة. يرجى التحقق من أذونات التخزين.');
        }
    } else {
        const blob = artifact.blob;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);

        return { success: true };
    }
};
