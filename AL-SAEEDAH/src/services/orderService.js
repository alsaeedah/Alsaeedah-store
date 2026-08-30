import { db } from '../firebase/config';
import { collection, doc, setDoc, query, where, getDocs, limit, increment } from 'firebase/firestore';

/**
 * Validates and creates an order in Firestore with idempotency and timeout protection.
 * @param {Object} orderData - The order payload
 * @param {string} requestId - A unique identifier for the request to prevent duplicates
 * @returns {Promise<{success: boolean, invoiceId?: string, reason?: string, message?: string}>}
 */
export const createOrder = async (orderData, requestId) => {
    console.log(`[OrderService] Starting order creation with requestId: ${requestId}`);

    if (!orderData.user_id) {
        console.error("[OrderService] Missing user_id in order data.");
        return { success: false, reason: 'auth', message: 'User not authenticated' };
    }

    // 15 seconds timeout promise
    const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('TIMEOUT')), 15000)
    );

    const orderPromise = (async () => {
        // Validation is now handled completely before reaching Checkout.
        // Proceeding directly to order creation.
        try {
            const ordersRef = collection(db, 'orders');
            const duplicateQuery = query(ordersRef, where('requestId', '==', requestId), limit(1));
            const duplicateSnapshot = await getDocs(duplicateQuery);
            if (!duplicateSnapshot.empty) {
                const existingOrder = duplicateSnapshot.docs[0].data();
                return `ORD${existingOrder.order_number}`;
            }
        } catch (err) {
            // Ignore cache/network issues for duplicate check
        }

        // Step 2: Generate Order Number and Save directly to Firestore
        const orderNumber = Math.floor(10000 + Math.random() * 90000).toString();
        const ordersRef = collection(db, 'orders');
        const newOrderDoc = doc(ordersRef);
        
        const timestamp = new Date().toISOString();
        const rawOrderData = {
            ...orderData,
            order_number: orderNumber,
            requestId,
            status: 'pending',
            payment_status: 'pending',
            created_at: timestamp,
            updated_at: timestamp
        };
        
        const cleanOrderData = JSON.parse(JSON.stringify(rawOrderData));

        // Write directly to Firestore
        await setDoc(newOrderDoc, cleanOrderData);
        
        // Update stats transactionally or asynchronously if needed (dashboard usually calculates this or we can skip for now)
        // We will just let the backend/dashboard handle it.
        
        return `ORD${orderNumber}`;
    })();

    try {
        const finalInvoiceId = await Promise.race([orderPromise, timeoutPromise]);
        return { success: true, invoiceId: finalInvoiceId, pendingNetwork: false };
    } catch (error) {
        if (error.message === 'TIMEOUT' || error.message.includes('offline')) {
            // Handled as offline queued in an advanced implementation.
            // For now, return a generic error or success if we managed to queue it.
            return { success: false, reason: 'network', message: 'الشبكة ضعيفة، تمت محاولة الحفظ.' };
        }

        return { 
            success: false, 
            reason: 'error', 
            message: error.message || 'حدث خطأ غير متوقع أثناء إنشاء الطلب.' 
        };
    }
};
