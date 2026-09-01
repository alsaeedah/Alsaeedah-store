import { Capacitor } from '@capacitor/core';
import { printWebPdf } from './WebPrintAdapter';
import { printAndroidPdf } from './AndroidPrintAdapter';

export const PrintService = {
    print: async (blob, documentName) => {
        if (Capacitor.isNativePlatform()) {
            return await printAndroidPdf(blob, documentName);
        } else {
            return await printWebPdf(blob);
        }
    }
};
