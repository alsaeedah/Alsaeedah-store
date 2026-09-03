import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { blobToBase64 } from './invoiceGenerator';

/**
 * Saves the PDF to the device Documents folder and opens the native Share Sheet.
 *
 * Used in two scenarios:
 *   1. As the primary handler for the "Download" action on mobile.
 *   2. As a graceful fallback inside mobilePrintHandler when no print service is available.
 *
 * A timestamped filename is used on every call so each action writes a genuinely
 * new file — eliminating the repeated-download caching issue.
 *
 * @param {Blob}          blob          - The PDF Blob from invoiceGenerator.
 * @param {string|number} invoiceNumber - The order number used in the filename.
 * @returns {Promise<{ success: boolean, usedShare: true, cancelled?: boolean }>}
 */
export const mobileShareHandler = async (blob, invoiceNumber) => {
    // Convert blob to base64
    const base64Data = await blobToBase64(blob);

    // Unique timestamped filename prevents OS/WebView caching on repeated actions.
    const fileName = `invoice_${invoiceNumber}_${Date.now()}.pdf`;

    // Persist to Documents so the file URI is stable and shareable.
    const writeResult = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Documents,
        recursive: true,
    });

    try {
        await Share.share({
            title: `فاتورة رقم ${invoiceNumber}`,
            url: writeResult.uri,
            dialogTitle: 'مشاركة / حفظ الفاتورة',
        });
        return { success: true, usedShare: true };
    } catch (error) {
        // User dismissed the Share Sheet — treat as a non-error soft cancel.
        if (
            error &&
            (error.message === 'Share canceled' ||
                (error.message && error.message.toLowerCase().includes('cancel')))
        ) {
            return { success: true, usedShare: true, cancelled: true };
        }
        throw error;
    }
};
