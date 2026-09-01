import { generateInvoicePdf } from './invoiceGenerator';
import { Capacitor } from '@capacitor/core';

// Helper to convert blob to base64
const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64data = reader.result.split(',')[1];
            resolve(base64data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

export const downloadInvoice = async (order, paymentType) => {
    const blob = await generateInvoicePdf(order, paymentType);
    const fileName = `invoice_ORD${order.order_number}.pdf`;

    if (Capacitor.isNativePlatform()) {
        try {
            const { Filesystem, Directory } = await import('@capacitor/filesystem');
            const base64Data = await blobToBase64(blob);

            await Filesystem.writeFile({
                path: fileName,
                data: base64Data,
                directory: Directory.Documents,
                recursive: true
            });

            return { success: true, message: 'تم حفظ الفاتورة في مجلد المستندات (Documents).' };
        } catch (error) {
            console.error('Android download error:', error);
            throw new Error('تعذر حفظ الفاتورة. يرجى التحقق من أذونات التخزين.');
        }
    } else {
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
