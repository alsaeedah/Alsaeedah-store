import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Capacitor } from '@capacitor/core';

const activeGenerations = new Map();
const generatedArtifacts = new Map();

// Helper to convert blob to base64 — exported for use in mobilePrintHandler and mobileShareHandler
export const blobToBase64 = (blob) => {
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

export const clearInvoiceCache = (orderId) => {
    if (orderId) {
        generatedArtifacts.delete(orderId);
    } else {
        generatedArtifacts.clear();
    }
};

export const getCachedInvoice = (orderId) => {
    return generatedArtifacts.get(orderId);
};

export const generateInvoicePdf = async (order, paymentType, options = {}) => {
    const orderId = order.id || order.order_number;
    
    // Check if we already have a generated artifact
    if (generatedArtifacts.has(orderId)) {
        return generatedArtifacts.get(orderId);
    }

    // Check if generation is already in progress for this order
    if (activeGenerations.has(orderId)) {
        return activeGenerations.get(orderId);
    }

    const generationPromise = (async () => {
        const invoiceId = `ORD${order.order_number}`;
        const dateStr = new Date(order.created_at).toLocaleDateString('ar-SA');
        const customerUser = order.users || {};
        const logo = '/logo.png';
        const isAndroid = Capacitor.isNativePlatform();
        const renderScale = isAndroid ? 1 : 2;

        const { onProgress } = options;
        if (onProgress) {
            onProgress({ stage: 'starting', currentPage: 0, totalPages: 0 });
        }

        const items = Array.isArray(order.items) ? order.items : [];
        const addressData = order.customer_address;
        const addressText = addressData && typeof addressData === 'object'
            ? `${addressData.governorate || ''} - ${addressData.district || ''}`.replace(/^ - | - $/g, '') || 'غير محدد'
            : (addressData || 'غير محدد');

        const cashSelected = paymentType === 'cash';
        const creditSelected = paymentType === 'credit';

        const headerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #d4af37; padding-bottom: 20px; margin-bottom: 20px;">
            <div style="flex: 1; text-align: right;">
                <h1 style="color: #d4af37; font-size: 28px; margin: 0 0 10px 0; font-weight: 700;">متجر السعيدة</h1>
                <div style="font-size: 13px; color: #444; line-height: 1.8;">
                     <p style="margin: 0;"><strong>تواصل : </strong> 772754414, 775055319</p>
                     <p style="margin: 0;"><strong>الإيميل : </strong> alsaeedah8@gmail.com</p>
                     <p style="margin: 0; direction: ltr; text-align: right;"><strong>العنوان : </strong>حضرموت / المكلا / الشرج </p>
                </div>
            </div>
            <div style="flex: 1; text-align: center; justify-content: center;">
                <img src="${logo}" style="width: 100px; height: 100px;" />
            </div>
            <div style="flex: 1; text-align: left; display: flex; flex-direction: column; justify-content: space-between; height: 100px;">
                <div>
                    <p style="margin: 0; font-size: 15px; color: #d4af37; font-weight: bold; font-style: italic;">"الفخامة ... في كل ثانية"</p>
                    <p style="margin: 5px 0 0; color: #888; font-size: 11px;">نصنع التميز، لنهديه إليكم</p>
                </div>
                <div style="font-size: 12px; color: #666;">
                    <span style="display: block; margin-bottom: 3px;">رقم الفاتورة: <strong>${invoiceId}</strong></span>
                    <span>التاريخ: ${dateStr}</span>
                </div>
            </div>
        </div>

        <div style="display: flex; justify-content: center; margin-bottom: 14px;">
            <div style="display: inline-flex; align-items: center; border: 1.5px solid #e0d5b5; border-radius: 10px; padding: 8px 28px; gap: 0; background: #fff;">
                <span style="font-size: 14px; font-weight: 700; color: #333; padding-inline-end: 16px;">نوع الدفع:</span>
                <div style="display: flex; align-items: center; gap: 8px; padding-inline-end: 18px;">
                    <div style="width: 18px; height: 18px; border-radius: 50%; border: 2px solid #d4af37; display: flex; align-items: center; justify-content: center; background: #fff;">
                        ${cashSelected ? '<div style="width: 10px; height: 10px; border-radius: 50%; background: #d4af37;"></div>' : ''}
                    </div>
                    <span style="font-size: 14px; font-weight: 600; color: #333;">نقد</span>
                </div>
                <div style="width: 1px; height: 20px; background: #e0d5b5;"></div>
                <div style="display: flex; align-items: center; gap: 8px; padding-inline-start: 18px;">
                    <div style="width: 18px; height: 18px; border-radius: 50%; border: 2px solid #d4af37; display: flex; align-items: center; justify-content: center; background: #fff;">
                        ${creditSelected ? '<div style="width: 10px; height: 10px; border-radius: 50%; background: #d4af37;"></div>' : ''}
                    </div>
                    <span style="font-size: 14px; font-weight: 600; color: #333;">أجل</span>
                </div>
            </div>
        </div>

        <div style="margin-bottom: 10px; font-size: 14px; color: #333;">
            <div style="display: flex; align-items: baseline; gap: 8px; padding: 8px 0; border-bottom: 1px solid #eee;">
                <strong style="color: #555; white-space: nowrap;">الاسم:</strong>
                <span style="font-weight: 600;">${order.customer_name || customerUser.name || 'غير معروف'}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: baseline; padding: 8px 0;">
                <div style="display: flex; align-items: baseline; gap: 8px;">
                    <strong style="color: #555; white-space: nowrap;">العنوان:</strong>
                    <span>${addressText}</span>
                </div>
                <div style="display: flex; align-items: baseline; gap: 8px;">
                    <strong style="color: #555; white-space: nowrap;">رقم الجوال:</strong>
                    <span style="direction: ltr; display: inline-block;">${order.customer_phone || customerUser.phone || 'غير متوفر'}</span>
                </div>
            </div>
        </div>
        `;

        const tableHeaderHTML = `
        <tr style="background: rgba(212, 175, 55, 0.1); color: #000;">
            <th style="padding: 15px; text-align: right; border-bottom: 2px solid #d4af37;">رقم الموديل</th>
            <th style="padding: 15px; text-align: right; border-bottom: 2px solid #d4af37;">المنتج</th>
            <th style="padding: 15px; text-align: center; border-bottom: 2px solid #d4af37;">السعر</th>
            <th style="padding: 15px; text-align: center; border-bottom: 2px solid #d4af37;">الكمية</th>
            <th style="padding: 15px; text-align: left; border-bottom: 2px solid #d4af37;">الإجمالي</th>
        </tr>
        `;

        const generateRowHTML = (item) => `
        <td style="padding: 15px; text-align: right; color: #555; font-size: 13px; font-weight: bold;">#${item.displayId || '---'}</td>
        <td style="padding: 15px; text-align: right; color: #000; font-weight: 600;">${item.name || item.title}</td>
        <td style="padding: 15px; text-align: center; color: #333;">${(item.price || 0).toLocaleString()} ر.س</td>
        <td style="padding: 15px; text-align: center; color: #333;">${item.dp_qty || item.quantity || 1}</td>
        <td style="padding: 15px; text-align: left; color: #d4af37; font-weight: bold;">${((item.price || 0) * (item.dp_qty || item.quantity || 1)).toLocaleString()} ر.س</td>
        `;

        const footerHTML = `
        <div style="display: flex; flex-direction: column; align-items: flex-start; margin-top: 30px; padding: 20px; background: #fcfcfc; border: 1px solid #eee; border-radius: 8px;">
            <div style="width: 100%; display: flex; justify-content: space-between; font-size: 22px; font-weight: bold;">
                <span style="color: #000;">الإجمالي الكلي:</span>
                <span style="color: #d4af37;">${order.total_amount.toLocaleString()} ر.س</span>
            </div>
        </div>

        <div style="margin-top: 60px; text-align: center; color: #888; font-size: 13px;">
            <p style="margin-bottom: 5px;">نشكركم على اختياركم متجر السعيدة - الفخامة في كل ثانية</p>
        </div>
        `;

        const PAGE_WIDTH = 800;
        const PAGE_HEIGHT = 1131.43; // 800 * (297 / 210)
        const CONTENT_HEIGHT = Math.floor(PAGE_HEIGHT) - 80; // 40px padding top and bottom

        const invoiceContainer = document.createElement('div');
        invoiceContainer.id = 'temp-invoice-container';
        invoiceContainer.style.position = 'absolute';
        invoiceContainer.style.left = '-9999px';
        invoiceContainer.style.top = '-9999px';
        invoiceContainer.style.width = `${PAGE_WIDTH}px`;
        invoiceContainer.style.background = '#f0f0f0';
        document.body.appendChild(invoiceContainer);

        let pdf = null;
        let blob = null;

        try {
            const createPage = () => {
                const page = document.createElement('div');
                page.className = 'pdf-page';
                page.style.width = `${PAGE_WIDTH}px`;
                page.style.height = `${PAGE_HEIGHT}px`;
                page.style.padding = '40px';
                page.style.boxSizing = 'border-box';
                page.style.background = '#ffffff';
                page.style.color = '#000';
                page.style.fontFamily = "'Cairo', sans-serif";
                page.style.direction = 'rtl';
                page.style.position = 'relative';
                page.style.overflow = 'hidden';
                invoiceContainer.appendChild(page);
                return page;
            };

            let currentPage = createPage();
            let currentContentContainer = document.createElement('div');
            currentContentContainer.style.display = 'flow-root';
            currentPage.appendChild(currentContentContainer);

            // 1. Add Header
            currentContentContainer.innerHTML = headerHTML;
            
            // 2. Add Table wrapper
            let currentTable = document.createElement('table');
            currentTable.style.width = '100%';
            currentTable.style.borderCollapse = 'collapse';
            currentTable.style.marginBottom = '30px';
            currentTable.innerHTML = `<thead>${tableHeaderHTML}</thead><tbody></tbody>`;
            currentContentContainer.appendChild(currentTable);
            
            let currentTbody = currentTable.querySelector('tbody');

            const isOverflowing = () => {
                return currentContentContainer.offsetHeight > CONTENT_HEIGHT;
            };

            // 3. Add Rows
            for (const item of items) {
                const tr = document.createElement('tr');
                tr.style.borderBottom = '1px solid #eee';
                tr.innerHTML = generateRowHTML(item);
                currentTbody.appendChild(tr);

                if (isOverflowing()) {
                    currentTbody.removeChild(tr);
                    
                    currentPage = createPage();
                    currentContentContainer = document.createElement('div');
                    currentContentContainer.style.display = 'flow-root';
                    currentPage.appendChild(currentContentContainer);
                    
                    currentTable = document.createElement('table');
                    currentTable.style.width = '100%';
                    currentTable.style.borderCollapse = 'collapse';
                    currentTable.style.marginBottom = '30px';
                    currentTable.innerHTML = `<thead>${tableHeaderHTML}</thead><tbody></tbody>`;
                    currentContentContainer.appendChild(currentTable);
                    currentTbody = currentTable.querySelector('tbody');
                    
                    currentTbody.appendChild(tr);
                }
            }

            // 4. Add Footer
            const footerDiv = document.createElement('div');
            footerDiv.innerHTML = footerHTML;
            currentContentContainer.appendChild(footerDiv);

            if (isOverflowing()) {
                currentContentContainer.removeChild(footerDiv);
                
                currentPage = createPage();
                currentContentContainer = document.createElement('div');
                currentContentContainer.style.display = 'flow-root';
                currentPage.appendChild(currentContentContainer);
                currentContentContainer.appendChild(footerDiv);
            }

            pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            const pages = invoiceContainer.querySelectorAll('.pdf-page');
            const totalPages = pages.length;

            for (let i = 0; i < totalPages; i++) {
                if (onProgress) {
                    onProgress({ stage: 'rendering', currentPage: i + 1, totalPages });
                }

                const page = pages[i];
                let canvas = await html2canvas(page, {
                    backgroundColor: '#ffffff',
                    scale: renderScale,
                    useCORS: true,
                    logging: false
                });
                
                let imgData = canvas.toDataURL('image/png');
                
                if (i > 0) {
                    pdf.addPage();
                }
                
                const imgWidth = pdfWidth;
                const imgHeight = (canvas.height * imgWidth) / canvas.width;
                
                pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

                // Memory Cleanup for current page
                canvas.width = 0;
                canvas.height = 0;
                canvas = null;
                imgData = null;
                page.remove(); // Remove DOM node

                // Yield to UI thread
                await new Promise(r => setTimeout(r, 20));
            }

            if (onProgress) {
                onProgress({ stage: 'saving', currentPage: totalPages, totalPages });
            }

            blob = pdf.output('blob');
            pdf = null; // release jsPDF instance

            // Always return a blob — mobile file-saving is handled by mobileInvoiceHandler
            const artifactResult = { type: 'blob', blob: blob };

            generatedArtifacts.set(orderId, artifactResult);
            return artifactResult;
        } finally {
            if (document.body.contains(invoiceContainer)) {
                document.body.removeChild(invoiceContainer);
            }
            activeGenerations.delete(orderId);
        }
    })();

    activeGenerations.set(orderId, generationPromise);
    return generationPromise;
};
