import { generateInvoicePdf, getCachedInvoice } from './invoiceGenerator';
import { Capacitor } from '@capacitor/core';
import { mobileShareHandler } from './mobileShareHandler';

/**
 * Downloads / saves the invoice for the given order.
 *
 * Mobile (native):
 *   Saves a freshly-generated PDF to Documents using a timestamped filename
 *   (preventing repeated-download cache failures), then opens the Share Sheet
 *   so the user can save, forward or open the file.
 *
 * Web (desktop browser):
 *   Creates a temporary object URL and triggers a browser file download.
 *
 * @param {object}   order       - The order object.
 * @param {string}   paymentType - 'cash' | 'credit'.
 * @param {Function} onProgress  - Optional progress callback.
 */
export const downloadInvoice = async (order, paymentType, onProgress) => {
    let artifact = getCachedInvoice(order.id || order.order_number);

    if (!artifact) {
        artifact = await generateInvoicePdf(order, paymentType, { onProgress });
    } else {
        // Already cached — immediately signal the UI that we are in the saving stage.
        if (onProgress) {
            onProgress({ stage: 'saving', currentPage: 1, totalPages: 1 });
        }
    }

    if (Capacitor.isNativePlatform()) {
        // Write a fresh timestamped file every time so repeated downloads never collide.
        return await mobileShareHandler(artifact.blob, order.order_number);
    } else {
        // Web: create a temporary object URL and trigger a <a> download.
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
