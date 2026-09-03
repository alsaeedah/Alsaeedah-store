package com.alsaeedah.dashboard;

import android.content.Context;
import android.os.CancellationSignal;
import android.os.ParcelFileDescriptor;
import android.print.PageRange;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintDocumentInfo;
import android.print.PrintManager;
import android.util.Base64;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;

@CapacitorPlugin(name = "AppPrinter")
public class AppPrinterPlugin extends Plugin {

    @PluginMethod
    public void printPdf(PluginCall call) {
        String base64 = call.getString("base64");
        String name = call.getString("name", "Document");

        if (base64 == null) {
            call.reject("يجب توفير ملف PDF (Base64)");
            return;
        }

        try {
            byte[] pdfAsBytes = Base64.decode(base64, Base64.DEFAULT);
            File cacheDir = getContext().getCacheDir();
            File tempPdf = new File(cacheDir, name + ".pdf");
            
            FileOutputStream os = new FileOutputStream(tempPdf);
            os.write(pdfAsBytes);
            os.flush();
            os.close();

            PrintManager printManager = (PrintManager) getContext().getSystemService(Context.PRINT_SERVICE);
            if (printManager == null) {
                call.reject("خدمة الطباعة غير متوفرة في هذا الجهاز.");
                return;
            }

            String jobName = getContext().getString(R.string.app_name) + " Document";
            printManager.print(jobName, new PdfDocumentAdapter(tempPdf), null);

            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);

        } catch (Exception e) {
            Log.e("AppPrinter", "Error printing PDF", e);
            call.reject("تعذر تجهيز الفاتورة للطباعة.", e);
        }
    }

    @PluginMethod
    public void printPdfFile(PluginCall call) {
        String uriStr = call.getString("uri");
        String name = call.getString("name", "Document");

        if (uriStr == null) {
            call.reject("يجب توفير مسار ملف PDF");
            return;
        }

        try {
            android.net.Uri uri = android.net.Uri.parse(uriStr);
            
            // Validate that we can read from this URI
            InputStream testStream = getContext().getContentResolver().openInputStream(uri);
            if (testStream == null) {
                call.reject("لا يمكن الوصول إلى ملف الفاتورة.");
                return;
            }
            testStream.close();

            PrintManager printManager = (PrintManager) getContext().getSystemService(Context.PRINT_SERVICE);
            if (printManager == null) {
                call.reject("خدمة الطباعة غير متوفرة في هذا الجهاز.");
                return;
            }

            String jobName = getContext().getString(R.string.app_name) + " Document";
            printManager.print(jobName, new UriDocumentAdapter(uri, name), null);

            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);

        } catch (Exception e) {
            Log.e("AppPrinter", "Error printing PDF from file", e);
            call.reject("تعذر تجهيز الفاتورة للطباعة.", e);
        }
    }

    private class UriDocumentAdapter extends PrintDocumentAdapter {
        private final android.net.Uri uri;
        private final String documentName;

        public UriDocumentAdapter(android.net.Uri uri, String documentName) {
            this.uri = uri;
            this.documentName = documentName;
        }

        @Override
        public void onLayout(PrintAttributes oldAttributes, PrintAttributes newAttributes, CancellationSignal cancellationSignal, LayoutResultCallback callback, android.os.Bundle extras) {
            if (cancellationSignal.isCanceled()) {
                callback.onLayoutCancelled();
                return;
            }
            PrintDocumentInfo info = new PrintDocumentInfo.Builder(documentName + ".pdf")
                    .setContentType(PrintDocumentInfo.CONTENT_TYPE_DOCUMENT)
                    .build();
            callback.onLayoutFinished(info, true);
        }

        @Override
        public void onWrite(PageRange[] pages, ParcelFileDescriptor destination, CancellationSignal cancellationSignal, WriteResultCallback callback) {
            try {
                InputStream input = getContext().getContentResolver().openInputStream(uri);
                if (input == null) {
                    callback.onWriteFailed("Cannot open file stream");
                    return;
                }
                OutputStream output = new FileOutputStream(destination.getFileDescriptor());
                byte[] buf = new byte[1024];
                int bytesRead;
                while ((bytesRead = input.read(buf)) > 0) {
                    if (cancellationSignal.isCanceled()) {
                        input.close();
                        output.close();
                        callback.onWriteCancelled();
                        return;
                    }
                    output.write(buf, 0, bytesRead);
                }
                callback.onWriteFinished(new PageRange[]{PageRange.ALL_PAGES});
                input.close();
                output.close();
            } catch (Exception e) {
                callback.onWriteFailed(e.toString());
            }
        }
    }

    private class PdfDocumentAdapter extends PrintDocumentAdapter {
        private final File fileToPrint;

        public PdfDocumentAdapter(File fileToPrint) {
            this.fileToPrint = fileToPrint;
        }

        @Override
        public void onLayout(PrintAttributes oldAttributes, PrintAttributes newAttributes, CancellationSignal cancellationSignal, LayoutResultCallback callback, android.os.Bundle extras) {
            if (cancellationSignal.isCanceled()) {
                callback.onLayoutCancelled();
                return;
            }
            PrintDocumentInfo info = new PrintDocumentInfo.Builder(fileToPrint.getName())
                    .setContentType(PrintDocumentInfo.CONTENT_TYPE_DOCUMENT)
                    .build();
            callback.onLayoutFinished(info, true);
        }

        @Override
        public void onWrite(PageRange[] pages, ParcelFileDescriptor destination, CancellationSignal cancellationSignal, WriteResultCallback callback) {
            try {
                InputStream input = new FileInputStream(fileToPrint);
                OutputStream output = new FileOutputStream(destination.getFileDescriptor());
                byte[] buf = new byte[1024];
                int bytesRead;
                while ((bytesRead = input.read(buf)) > 0) {
                    output.write(buf, 0, bytesRead);
                }
                callback.onWriteFinished(new PageRange[]{PageRange.ALL_PAGES});
                input.close();
                output.close();
            } catch (Exception e) {
                callback.onWriteFailed(e.toString());
            }
        }
    }
}
