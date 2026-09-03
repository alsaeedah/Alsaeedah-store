import { Capacitor } from '@capacitor/core';

export const printAndroidPdf = async (artifact, documentName) => {
    try {
        if (!artifact || !artifact.uri) {
            throw new Error('Internal Error: Missing PDF URI for printing.');
        }

        const { AppPrinter } = Capacitor.Plugins;
        
        if (!AppPrinter) {
            throw new Error('خدمة الطباعة غير متوفرة في هذا الإصدار.');
        }

        const result = await AppPrinter.printPdfFile({
            uri: artifact.uri,
            name: documentName
        });
        
        if (!result || !result.success) {
            throw new Error('لا توجد طابعة متاحة للطباعة على هذا الجهاز.');
        }

        return { success: true };
    } catch (error) {
        console.error('Android print error:', error);
        if (error.message && error.message.includes('طابعة')) {
            throw error;
        }
        throw new Error('تعذر تجهيز الفاتورة للطباعة.\nيرجى المحاولة مرة أخرى.');
    }
};
