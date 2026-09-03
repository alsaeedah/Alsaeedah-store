import { generateInvoicePdf } from './invoiceGenerator';
import { Capacitor } from '@capacitor/core';
import { mobilePrintHandler } from './mobilePrintHandler';
import { printWebPdf } from './WebPrintAdapter';

/**
 * Prints the invoice for the given order.
 *
 * Mobile (native):
 *   Delegates to mobilePrintHandler which attempts a 1-click native print dialog
 *   via @capgo/capacitor-printer.  If no print service is available on the device
 *   it falls back gracefully to the Share Sheet.
 *
 * Web (desktop browser):
 *   Opens the PDF in a new tab using the browser's built-in PDF viewer / print flow.
 *
 * @param {object}   order       - The order object.
 * @param {string}   paymentType - 'cash' | 'credit'.
 * @param {Function} onProgress  - Optional progress callback.
 */
export const printInvoice = async (order, paymentType, onProgress) => {
    const artifact = await generateInvoicePdf(order, paymentType, { onProgress });

    if (Capacitor.isNativePlatform()) {
        return await mobilePrintHandler(artifact.blob, order.order_number);
    } else {
        // Web: open PDF in new tab — the browser's native PDF viewer handles printing.
        return await printWebPdf(artifact.blob);
    }
};
