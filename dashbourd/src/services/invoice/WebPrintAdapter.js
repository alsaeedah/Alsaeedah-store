export const printWebPdf = (blob) => {
    return new Promise((resolve, reject) => {
        try {
            const url = URL.createObjectURL(blob);
            
            // Open the PDF in a new tab. Chrome/Windows will use its native PDF viewer,
            // which has a robust, built-in print workflow.
            const printWindow = window.open(url, '_blank');
            
            if (!printWindow) {
                // Popup blocked
                reject(new Error('تعذر فتح الفاتورة للطباعة.\nيرجى السماح بالنوافذ المنبثقة ثم المحاولة مرة أخرى.'));
                return;
            }

            // Revoke the object URL after a delay to ensure it loads in the new tab
            setTimeout(() => {
                URL.revokeObjectURL(url);
                resolve({ success: true });
            }, 2000);
            
        } catch (error) {
            reject(new Error('تعذر تجهيز الفاتورة للطباعة.\nيرجى المحاولة مرة أخرى.'));
        }
    });
};
