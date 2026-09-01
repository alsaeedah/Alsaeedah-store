import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const generateInvoicePdf = async (order, paymentType) => {
    const invoiceId = `ORD${order.order_number}`;
    const dateStr = new Date(order.created_at).toLocaleDateString('ar-SA');
    const customerUser = order.users || {};
    const logo = '/logo.png';

    const invoiceDiv = document.createElement('div');
    invoiceDiv.id = 'temp-invoice';
    invoiceDiv.style.position = 'absolute';
    invoiceDiv.style.left = '-9999px';
    invoiceDiv.style.top = '-9999px';
    invoiceDiv.style.width = '800px';
    invoiceDiv.style.padding = '40px';
    invoiceDiv.style.background = '#ffffff';
    invoiceDiv.style.color = '#000';
    invoiceDiv.style.fontFamily = "'Cairo', sans-serif";
    invoiceDiv.style.direction = 'rtl';

    const items = Array.isArray(order.items) ? order.items : [];
    const addressData = order.customer_address;
    const addressText = addressData && typeof addressData === 'object'
        ? `${addressData.governorate || ''} - ${addressData.district || ''}`.replace(/^ - | - $/g, '') || 'غير محدد'
        : (addressData || 'غير محدد');

    const cashSelected = paymentType === 'cash';
    const creditSelected = paymentType === 'credit';

    invoiceDiv.innerHTML = `
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

        <!-- ═══ PAYMENT TYPE SELECTOR ═══ -->
        <div data-segment="payment-type" style="display: flex; justify-content: center; margin-bottom: 14px;">
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

        <!-- ═══ CUSTOMER INFO (Compact) ═══ -->
        <div data-segment="customer-info" style="margin-bottom: 10px; font-size: 14px; color: #333;">
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

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
            <thead>
                <tr style="background: rgba(212, 175, 55, 0.1); color: #000;">
                    <th style="padding: 15px; text-align: right; border-bottom: 2px solid #d4af37;">رقم الموديل</th>
                    <th style="padding: 15px; text-align: right; border-bottom: 2px solid #d4af37;">المنتج</th>
                    <th style="padding: 15px; text-align: center; border-bottom: 2px solid #d4af37;">السعر</th>
                    <th style="padding: 15px; text-align: center; border-bottom: 2px solid #d4af37;">الكمية</th>
                    <th style="padding: 15px; text-align: left; border-bottom: 2px solid #d4af37;">الإجمالي</th>
                </tr>
            </thead>
            <tbody>
                ${items.map(item => `
                    <tr data-segment="row" style="border-bottom: 1px solid #eee;">
                        <td style="padding: 15px; text-align: right; color: #555; font-size: 13px; font-weight: bold;">#${item.displayId || '---'}</td>
                        <td style="padding: 15px; text-align: right; color: #000; font-weight: 600;">${item.name || item.title}</td>
                        <td style="padding: 15px; text-align: center; color: #333;">${(item.price || 0).toLocaleString()} ر.س</td>
                        <td style="padding: 15px; text-align: center; color: #333;">${item.dp_qty || item.quantity || 1}</td>
                        <td style="padding: 15px; text-align: left; color: #d4af37; font-weight: bold;">${((item.price || 0) * (item.dp_qty || item.quantity || 1)).toLocaleString()} ر.س</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

        <div data-segment="total" style="display: flex; flex-direction: column; align-items: flex-start; margin-top: 30px; padding: 20px; background: #fcfcfc; border: 1px solid #eee; border-radius: 8px;">
            <div style="width: 100%; display: flex; justify-content: space-between; font-size: 22px; font-weight: bold;">
                <span style="color: #000;">الإجمالي الكلي:</span>
                <span style="color: #d4af37;">${order.total_amount.toLocaleString()} ر.س</span>
            </div>
        </div>

        <div style="margin-top: 60px; text-align: center; color: #888; font-size: 13px;">
            <p style="margin-bottom: 5px;">نشكركم على اختياركم متجر السعيدة - الفخامة في كل ثانية</p>
        </div>
    `;

    document.body.appendChild(invoiceDiv);

    const PAGE_HEIGHT_PX = 1120;
    const segments = invoiceDiv.querySelectorAll('tbody tr, [data-segment]');
    segments.forEach(el => {
        const elBottom = el.offsetTop + el.offsetHeight;
        const currentPageBottom = Math.ceil(el.offsetTop / PAGE_HEIGHT_PX) * PAGE_HEIGHT_PX;
        if (elBottom > currentPageBottom && el.offsetTop < currentPageBottom) {
            const spacer = document.createElement('div');
            spacer.style.height = `${currentPageBottom - el.offsetTop + 2}px`;
            el.parentNode.insertBefore(spacer, el);
        }
    });

    try {
        const canvas = await html2canvas(invoiceDiv, {
            backgroundColor: '#ffffff',
            scale: 2,
            useCORS: true,
            logging: false
        });
        const imgData = canvas.toDataURL('image/png');

        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = pageWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft > 0) {
            position -= 297;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }

        const blob = pdf.output('blob');
        return blob;
    } finally {
        if (document.body.contains(invoiceDiv)) {
            document.body.removeChild(invoiceDiv);
        }
    }
};
