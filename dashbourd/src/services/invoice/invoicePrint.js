import { generateInvoicePdf } from './invoiceGenerator';
import { PrintService } from './PrintService';

export const printInvoice = async (order, paymentType) => {
    const blob = await generateInvoicePdf(order, paymentType);
    const documentName = `invoice_ORD${order.order_number}`;
    
    // Delegate the actual printing to the PrintService
    return await PrintService.print(blob, documentName);
};
