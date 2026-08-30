import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
    verifyOrderSubmission, 
    getPendingOrderSubmission, 
    clearPendingOrderSubmission 
} from '../services/orderService';
import { ordersService } from '../services/ordersService';

export const ORDER_SUBMISSION_STATES = {
    IDLE: 'idle',
    SUBMITTING: 'submitting',
    SUCCESS: 'success',
    FAILED: 'failed',
    UNKNOWN: 'unknown',
    VERIFYING: 'verifying',
    RETRYABLE: 'retryable',
};

const VERIFICATION_DELAYS = [0, 5000, 15000];

export const useOrderSubmission = ({ onSuccess } = {}) => {
    const { currentUser } = useAuth();
    const userId = currentUser?.uid || currentUser?.id;
    
    const [status, setStatus] = useState(ORDER_SUBMISSION_STATES.IDLE);
    const [clientOrderId, setClientOrderId] = useState('');
    const [order, setOrder] = useState(null);
    const [error, setError] = useState(null);
    const [verificationAttempt, setVerificationAttempt] = useState(0);

    // Initial check for pending submission on mount
    useEffect(() => {
        if (!userId) return;
        
        const checkPending = async () => {
            const pending = await getPendingOrderSubmission(userId);
            if (pending && pending.clientOrderId) {
                setClientOrderId(pending.clientOrderId);
                setStatus(ORDER_SUBMISSION_STATES.VERIFYING);
                startVerificationLoop(pending.clientOrderId, 0);
            } else {
                // Ensure we have an ID ready if no pending order
                setClientOrderId(crypto.randomUUID());
            }
        };
        checkPending();
    }, [userId]);

    const delay = (ms) => new Promise(res => setTimeout(res, ms));

    const startVerificationLoop = useCallback(async (orderId, attempt = 0) => {
        setVerificationAttempt(attempt);
        setStatus(ORDER_SUBMISSION_STATES.VERIFYING);
        
        if (attempt >= VERIFICATION_DELAYS.length) {
            setStatus(ORDER_SUBMISSION_STATES.RETRYABLE);
            return;
        }

        const waitTime = VERIFICATION_DELAYS[attempt];
        if (waitTime > 0) {
            await delay(waitTime);
        }

        // Try verifying
        const result = await verifyOrderSubmission(orderId, userId);
        
        if (result.status === 'found') {
            await clearPendingOrderSubmission(userId, orderId);
            await ordersService.injectOrderIntoCache(userId, result.order);
            setOrder(result.order);
            setStatus(ORDER_SUBMISSION_STATES.SUCCESS);
            if (onSuccess) {
                onSuccess(result.order);
            }
        } else if (result.status === 'not_found' || result.status === 'unknown') {
            // Keep trying
            startVerificationLoop(orderId, attempt + 1);
        }
    }, [userId, onSuccess]);

    const beginSubmission = useCallback((existingOrderId) => {
        const idToUse = existingOrderId || clientOrderId || crypto.randomUUID();
        if (idToUse !== clientOrderId) {
            setClientOrderId(idToUse);
        }
        setStatus(ORDER_SUBMISSION_STATES.SUBMITTING);
        setError(null);
        return idToUse;
    }, [clientOrderId]);

    const handleResult = useCallback(async (result) => {
        if (result.status === 'success') {
            await ordersService.injectOrderIntoCache(userId, result.order);
            setOrder(result.order);
            setStatus(ORDER_SUBMISSION_STATES.SUCCESS);
            if (onSuccess) {
                onSuccess(result.order);
            }
        } else if (result.status === 'failed') {
            setError(result.message || 'حدث خطأ غير متوقع');
            setStatus(ORDER_SUBMISSION_STATES.FAILED);
        } else if (result.status === 'unknown') {
            startVerificationLoop(result.clientOrderId, 0);
        }
    }, [userId, onSuccess, startVerificationLoop]);

    const verify = useCallback(() => {
        if (clientOrderId) {
            startVerificationLoop(clientOrderId, 0);
        }
    }, [clientOrderId, startVerificationLoop]);

    const isSubmitting = status === ORDER_SUBMISSION_STATES.SUBMITTING || status === ORDER_SUBMISSION_STATES.VERIFYING;

    return {
        status,
        clientOrderId,
        order,
        error,
        verificationAttempt,
        beginSubmission,
        handleResult,
        verify,
        isSubmitting,
        setStatus
    };
};
