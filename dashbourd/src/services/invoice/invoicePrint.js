import { generateInvoicePdf } from './invoiceGenerator';
import { Capacitor } from '@capacitor/core';
import { handleMobileInvoice } from './mobileInvoiceHandler';
import { printWebPdf } from './WebPrintAdapter';

export const printInvoice = async (order, paymentType, onProgress) => {
    const artifact = await generateInvoicePdf(order, paymentType, { onProgress });

    if (Capacitor.isNativePlatform()) {
        // On mobile, "Print" opens the native Share Sheet, which includes
        // the system's native Print option alongside WhatsApp, Save, etc.
        return await handleMobileInvoice(artifact.blob, order.order_number);
    } else {
        // Web: open the PDF in a new tab to leverage the browser's native print workflow.
        return await printWebPdf(artifact.blob);
    }
};

