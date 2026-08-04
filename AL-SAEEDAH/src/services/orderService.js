import { db } from '../firebase/config';
import { collection, doc, setDoc, query, where, getDocs, limit } from 'firebase/firestore';

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
        // Step 1: Check for duplicate order (Idempotency)
        console.log(`[OrderService] Checking for duplicate requestId: ${requestId}`);
        const ordersRef = collection(db, 'orders');
        const duplicateQuery = query(ordersRef, where('requestId', '==', requestId), limit(1));
        const duplicateSnapshot = await getDocs(duplicateQuery);

        if (!duplicateSnapshot.empty) {
            const existingOrder = duplicateSnapshot.docs[0].data();
            console.log(`[OrderService] Duplicate order found. Returning existing invoiceId: ORD${existingOrder.order_number}`);
            return `ORD${existingOrder.order_number}`;
        }

        // Step 2: Generate Order Number
        // Generate a 5-digit random number
        console.log(`[OrderService] Generating order number.`);
        const orderNumber = Math.floor(10000 + Math.random() * 90000).toString();
        const newOrderId = doc(ordersRef).id;
        
        console.log(`[OrderService] Order number generated: ${orderNumber}`);

        // Step 3: Create Order Document
        console.log(`[OrderService] Creating order document in Firestore.`);
        const orderRef = doc(db, 'orders', newOrderId);
        
        // Firestore does not accept undefined values, so we sanitize the object
        const rawOrderData = {
            ...orderData,
            order_number: orderNumber,
            requestId,
            created_at: new Date().toISOString()
        };
        
        // Remove undefined properties recursively by stringifying and parsing
        const cleanOrderData = JSON.parse(JSON.stringify(rawOrderData));

        await setDoc(orderRef, cleanOrderData);

        console.log(`[OrderService] Order document created successfully.`);
        return `ORD${orderNumber}`;
    })();

    try {
        const finalInvoiceId = await Promise.race([orderPromise, timeoutPromise]);
        console.log(`[OrderService] Order flow completed successfully: ${finalInvoiceId}`);
        return { success: true, invoiceId: finalInvoiceId };
    } catch (error) {
        console.error("[OrderService] Order creation failed:", error);
        if (error.message === 'TIMEOUT') {
            return { 
                success: false, 
                reason: 'timeout', 
                message: 'انتهى وقت الطلب. يرجى المحاولة مرة أخرى أو التحقق من اتصالك بالإنترنت.' 
            };
        }
        return { 
            success: false, 
            reason: 'error', 
            message: error.message || 'حدث خطأ غير متوقع أثناء إنشاء الطلب.' 
        };
    }
};
