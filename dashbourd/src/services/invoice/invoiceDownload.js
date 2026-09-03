import { generateInvoicePdf, getCachedInvoice } from './invoiceGenerator';
import { Capacitor } from '@capacitor/core';
import { handleMobileInvoice } from './mobileInvoiceHandler';

export const downloadInvoice = async (order, paymentType, onProgress) => {
    let artifact = getCachedInvoice(order.id || order.order_number);

    if (!artifact) {
        artifact = await generateInvoicePdf(order, paymentType, { onProgress });
    } else {
        // If it's cached, notify progress is complete for the UI
        if (onProgress) {
            onProgress({ stage: 'saving', currentPage: 1, totalPages: 1 });
        }
    }

    if (Capacitor.isNativePlatform()) {
        // On mobile, save a fresh timestamped file and open the native Share Sheet.
        // The timestamp in the filename prevents repeated-download caching issues.
        return await handleMobileInvoice(artifact.blob, order.order_number);
    } else {
        // Web: create a temporary object URL and trigger a browser download.
        const fileName = `invoice_ORD${order.order_number}.pdf`;
        const url = URL.createObjectURL(artifact.blob);
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

