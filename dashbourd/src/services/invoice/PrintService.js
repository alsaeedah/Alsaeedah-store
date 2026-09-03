import { printWebPdf } from './WebPrintAdapter';

// PrintService is kept for backward compatibility.
// Native mobile printing is now handled directly in invoicePrint.js via mobileInvoiceHandler.
export const PrintService = {
    print: async (artifact) => {
        return await printWebPdf(artifact.blob);
    }
};

