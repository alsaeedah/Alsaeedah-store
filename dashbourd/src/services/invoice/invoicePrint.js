import { generateInvoicePdf } from './invoiceGenerator';
import { PrintService } from './PrintService';

export const printInvoice = async (order, paymentType, onProgress) => {
    const artifact = await generateInvoicePdf(order, paymentType, { onProgress, saveToDocuments: false });
    const documentName = `invoice_ORD${order.order_number}`;
    
    // Delegate the actual printing to the PrintService
    return await PrintService.print(artifact, documentName);
};
