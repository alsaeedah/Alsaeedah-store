import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { supabase } from '../supabase/client';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const messaging = typeof window !== 'undefined' && 'serviceWorker' in navigator ? getMessaging(app) : null;

export const requestNotificationPermission = async () => {
    try {
        if (!('Notification' in window)) return false;
        if (Notification.permission === 'granted') return true;
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    } catch (error) {
        console.error('Notification permission error:', error);
        return false;
    }
};

export const getFCMToken = async () => {
    if (!messaging) return null;
    try {
        const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
        const currentToken = await getToken(messaging, { vapidKey });
        return currentToken || null;
    } catch (error) {
        console.warn('FCM Get Token failed:', error);
        return null;
    }
};

export const saveTokenToDatabase = async (userId, token) => {
    if (!userId || !token) return;
    try {
        const { error } = await supabase
            .from('managers')
            .update({ fcm_token: token })
            .eq('id', userId);

        if (error && userId !== 'admin-user') {
            console.error('Failed to save FCM token:', error);
        }
    } catch (err) {
        console.error('Database token update error:', err);
    }
};

export const setupFCMNotifications = async (userId) => {
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) return null;

    const token = await getFCMToken();
    if (token) {
        await saveTokenToDatabase(userId, token);
    }
    return token;
};

export const listenForForegroundMessages = (onMessageReceived) => {
    if (!messaging) return () => {};
    return onMessage(messaging, (payload) => {
        if (payload.data && payload.data.type === 'NEW_ORDER') {
            onMessageReceived({
                orderId: payload.data.order_id,
                orderNumber: payload.data.order_number,
                title: payload.notification?.title || 'طلب جديد!',
                body: payload.notification?.body || 'تم استلام طلب جديد'
            });
        }
    });
};

export const refreshFCMToken = async (userId) => {
    if (!userId) return;
    try {
        const token = await getFCMToken();
        if (token) {
            await saveTokenToDatabase(userId, token);
        }
    } catch (e) {
        console.error("Token refresh error:", e);
    }
};
