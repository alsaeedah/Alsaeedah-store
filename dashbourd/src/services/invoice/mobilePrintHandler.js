import { Printer } from '@capgo/capacitor-printer';
import { blobToBase64 } from './invoiceGenerator';
import { mobileShareHandler } from './mobileShareHandler';

/**
 * Attempts a 1-click direct print using the native print spooler.
 *
 * Flow:
 *   1. Convert the PDF Blob to Base64.
 *   2. Call Printer.printBase64() to open the native Android/iOS print dialog immediately.
 *   3. If the printer plugin throws (no print service installed, device unsupported, etc.),
 *      fall back gracefully to mobileShareHandler so the user can still export the invoice
 *      via the system Share Sheet without the app crashing.
 *
 * The plugin (@capgo/capacitor-printer) does not expose an isAvailable() API, so we rely
 * on a try/catch with error-code inspection to detect the "no print service" case.
 *
 * @param {Blob}          blob          - The PDF Blob from invoiceGenerator.
 * @param {string|number} invoiceNumber - The order number (used for the document title).
 * @returns {Promise<{ success: boolean, usedPrinter: boolean, usedShare?: boolean, cancelled?: boolean }>}
 */
export const mobilePrintHandler = async (blob, invoiceNumber) => {
    let base64Data;
    try {
        base64Data = await blobToBase64(blob);
    } catch (convErr) {
        console.error('mobilePrintHandler: blob-to-base64 conversion failed', convErr);
        throw new Error('تعذر تجهيز الفاتورة للطباعة. يرجى المحاولة مرة أخرى.');
    }

    try {
        // Direct path: open native print spooler immediately (1 click, no Share Sheet)
        await Printer.printBase64({
            name: `فاتورة رقم ${invoiceNumber}`,
            data: base64Data,
            mimeType: 'application/pdf',
        });

        return { success: true, usedPrinter: true };
    } catch (printError) {
        // Determine whether the error signals an unavailable print service or a real crash.
        const isUnavailable = isPrintUnavailableError(printError);

        if (isUnavailable) {
            // Graceful fallback: open Share Sheet so the user can still export the invoice.
            console.warn(
                'mobilePrintHandler: No print service available — falling back to Share Sheet.',
                printError
            );
            try {
                // mobileShareHandler already has the blob; we pass it directly.
                const shareResult = await mobileShareHandler(blob, invoiceNumber);
                return { success: true, usedPrinter: false, ...shareResult };
            } catch (shareErr) {
                console.error('mobilePrintHandler: Share fallback also failed', shareErr);
                throw new Error(
                    'لا تتوفر خدمة طباعة على هذا الجهاز ولم نتمكن من فتح المشاركة. يرجى المحاولة لاحقاً.'
                );
            }
        }

        // Unknown / unexpected print error — surface it to the caller.
        console.error('mobilePrintHandler: Unexpected print error', printError);
        throw new Error('تعذر تجهيز الفاتورة للطباعة. يرجى المحاولة مرة أخرى.');
    }
};

/**
 * Heuristically detects whether a printer error means the print service is
 * absent on the device vs. a genuine plugin/runtime failure.
 *
 * @param {unknown} error
 * @returns {boolean}
 */
function isPrintUnavailableError(error) {
    if (!error) return false;
    const msg = (error.message || '').toLowerCase();
    const code = (error.code || '');

    return (
        msg.includes('unavailable') ||
        msg.includes('not available') ||
        msg.includes('no print') ||
        msg.includes('print service') ||
        msg.includes('printmanager') ||
        msg.includes('not supported') ||
        code === 'UNAVAILABLE' ||
        code === 'UNIMPLEMENTED'
    );
}
