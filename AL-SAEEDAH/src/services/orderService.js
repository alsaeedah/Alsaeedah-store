import { db } from '../firebase/config';
import { collection, doc, setDoc, query, where, getDocs, limit } from 'firebase/firestore';

const getPendingSubmissionKey = (userId) => `pending_order_${userId}`;

export const getPendingOrderSubmission = async (userId) => {
    try {
        const { StorageEngine } = await import('../../../shared/storage/StorageEngine');
        const pending = await StorageEngine.get(getPendingSubmissionKey(userId));
        return pending || null;
    } catch (e) {
        return null;
    }
};

export const clearPendingOrderSubmission = async (userId, clientOrderId = null) => {
    try {
        const { StorageEngine } = await import('../../../shared/storage/StorageEngine');
        const key = getPendingSubmissionKey(userId);
        if (clientOrderId) {
            const pending = await StorageEngine.get(key);
            if (pending && pending.clientOrderId !== clientOrderId) {
                // Do not delete a newer pending submission for a different order
                return;
            }
        }
        await StorageEngine.remove(key);
    } catch (e) {
        // ignore
    }
};

/**
 * Validates and creates an order in Firestore with idempotency and timeout protection.
 * @param {Object} orderData - The order payload
 * @param {string} clientOrderId - A unique identifier for the request to prevent duplicates
 * @returns {Promise<{status: string, invoiceId?: string, clientOrderId: string, order?: Object, reason?: string, message?: string}>}
 */
export const createOrder = async (orderData, clientOrderId) => {
    console.log(`[OrderService] Starting order creation with clientOrderId: ${clientOrderId}`);

    const userId = orderData.user_id;

    if (!userId) {
        console.error("[OrderService] Missing user_id in order data.");
        return { status: 'failed', reason: 'auth', message: 'User not authenticated' };
    }

    if (!clientOrderId) {
        console.error("[OrderService] Missing clientOrderId.");
        return { status: 'failed', reason: 'invalid_request', message: 'Missing clientOrderId' };
    }

    try {
        const { StorageEngine } = await import('../../../shared/storage/StorageEngine');
        await StorageEngine.set(getPendingSubmissionKey(userId), {
            clientOrderId,
            userId,
            orderData,
            createdAt: new Date().toISOString(),
            status: 'pending'
        });
    } catch (e) {
        console.warn("[OrderService] Failed to persist pending order", e);
    }

    const SUBMISSION_TIMEOUT_MS = 15000;
    const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('TIMEOUT')), SUBMISSION_TIMEOUT_MS)
    );

    const orderPromise = (async () => {
        // Step 1: Generate Order Number
        const orderNumber = Math.floor(10000 + Math.random() * 90000).toString();
        
        // Use clientOrderId as the deterministic Firestore doc ID
        const ordersRef = collection(db, 'orders');
        const newOrderDoc = doc(ordersRef, clientOrderId);
        
        const timestamp = new Date().toISOString();
        const rawOrderData = {
            ...orderData,
            order_number: orderNumber,
            requestId: clientOrderId,
            status: 'pending',
            payment_status: 'pending',
            created_at: timestamp,
            updated_at: timestamp
        };
        
        const cleanOrderData = JSON.parse(JSON.stringify(rawOrderData));

        await setDoc(newOrderDoc, cleanOrderData);
        
        return {
            invoiceId: `ORD${orderNumber}`,
            order: {
                id: clientOrderId,
                ...cleanOrderData
            }
        };
    })();

    try {
        const result = await Promise.race([orderPromise, timeoutPromise]);
        
        // Confirmed Success
        await clearPendingOrderSubmission(userId, clientOrderId);
        
        return {
            status: 'success',
            invoiceId: result.invoiceId,
            clientOrderId,
            order: result.order
        };
    } catch (error) {
        if (error.message === 'TIMEOUT' || error.message.includes('offline') || error.code === 'unavailable' || error.code === 'deadline-exceeded' || error.message.includes('network') || error.message.includes('fetch')) {
            return {
                status: 'unknown',
                clientOrderId,
                reason: 'network',
                message: 'تعذر تأكيد حالة الطلب.'
            };
        }

        const isAuthError = error.code === 'permission-denied' || error.code === 'unauthenticated';
        const isValidationError = error.code === 'invalid-argument';

        if (isAuthError || isValidationError) {
            await clearPendingOrderSubmission(userId, clientOrderId);
            return {
                status: 'failed',
                clientOrderId,
                reason: error.code || 'error',
                message: 'تعذر إنشاء الطلب. يرجى المحاولة مرة أخرى.'
            };
        }

        return {
            status: 'unknown',
            clientOrderId,
            reason: error.code || 'error',
            message: 'تعذر تأكيد حالة الطلب.'
        };
    }
};

export const verifyOrderSubmission = async (clientOrderId, userId) => {
    if (!clientOrderId || !userId) {
        return { status: 'not_found' };
    }

    try {
        const ordersRef = collection(db, 'orders');
        const q = query(
            ordersRef,
            where('requestId', '==', clientOrderId),
            where('user_id', '==', userId),
            limit(1)
        );
        
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            const docSnap = snapshot.docs[0];
            return {
                status: 'found',
                order: {
                    id: docSnap.id,
                    ...docSnap.data()
                }
            };
        }
        
        return { status: 'not_found' };
    } catch (error) {
        console.error('[OrderService] verifyOrderSubmission error:', error);
        return { status: 'unknown', error };
    }
};
