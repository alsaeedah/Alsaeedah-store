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

export const printAndroidPdf = async (blob, documentName) => {
    try {
        const base64Data = await blobToBase64(blob);
        
        // AppPrinter is a custom Capacitor plugin we will register in the Android project.
        const { AppPrinter } = Capacitor.Plugins;
        
        if (!AppPrinter) {
            throw new Error('خدمة الطباعة غير متوفرة في هذا الإصدار.');
        }

        const result = await AppPrinter.printPdf({
            base64: base64Data,
            name: documentName
        });
        
        if (!result || !result.success) {
            throw new Error('لا توجد طابعة متاحة للطباعة على هذا الجهاز.');
        }

        return { success: true };
    } catch (error) {
        console.error('Android print error:', error);
        // Map error to the expected PRD message if needed
        if (error.message.includes('طابعة')) {
            throw error;
        }
        throw new Error('تعذر تجهيز الفاتورة للطباعة.\nيرجى المحاولة مرة أخرى.');
    }
};
