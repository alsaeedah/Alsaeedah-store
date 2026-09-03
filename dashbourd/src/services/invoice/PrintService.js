import { Capacitor } from '@capacitor/core';
import { printWebPdf } from './WebPrintAdapter';
import { printAndroidPdf } from './AndroidPrintAdapter';

export const PrintService = {
    print: async (artifact, documentName) => {
        if (Capacitor.isNativePlatform()) {
            return await printAndroidPdf(artifact, documentName);
        } else {
            return await printWebPdf(artifact.blob);
        }
    }
};
