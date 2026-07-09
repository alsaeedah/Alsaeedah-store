// ============================================================
// FCM Push Notification Manager — Firebase Web SDK
// Replaces the old VAPID/web-push implementation
//
// Responsibilities:
//   1. Initialize Firebase app
//   2. Register the firebase-messaging-sw.js Service Worker
//   3. Request notification permission
//   4. Get/refresh FCM token
//   5. Store/update token in Supabase manager_push_tokens table
// ============================================================

import { initializeApp, getApps, getApp } from "firebase/app";
import { getMessaging, getToken, onMessage, deleteToken } from "firebase/messaging";
import { createClient } from "@supabase/supabase-js";

// ── Firebase config (from Vite env vars) ──────────────────────────────────
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

// ── Supabase client (anon key — dashboard uses anon key) ──────────────────
const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ── Lazy singleton: Firebase app + messaging ──────────────────────────────
function getFirebaseMessaging() {
  const app = getApps().length === 0
    ? initializeApp(firebaseConfig)
    : getApp();
  return getMessaging(app);
}

// ── Device name: best-effort from User-Agent ──────────────────────────────
function getDeviceName() {
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) return `Android Browser (${ua.substring(0, 60)})`;
  if (/iPhone|iPad/i.test(ua)) return `iOS Browser (${ua.substring(0, 60)})`;
  if (/Windows/i.test(ua)) return `Windows Browser (${ua.substring(0, 60)})`;
  if (/Mac/i.test(ua)) return `Mac Browser (${ua.substring(0, 60)})`;
  return ua.substring(0, 100);
}

// ── Save or update FCM token in Supabase ──────────────────────────────────
async function saveTokenToDatabase(managerId, token) {
  const supabase = createClient(supabaseUrl, supabaseAnon);

  const { error } = await supabase
    .from("manager_push_tokens")
    .upsert(
      {
        manager_id:   managerId,
        fcm_token:    token,
        device_name:  getDeviceName(),
        platform:     "web",
        app_version:  import.meta.env.VITE_APP_VERSION || "1.0.0",
        updated_at:   new Date().toISOString(),
        last_seen_at: new Date().toISOString(),
        active:       true,
      },
      { onConflict: "fcm_token" }   // upsert by token — one row per device
    );

  if (error) {
    console.error("[FCM] Failed to save token to DB:", error.message);
  } else {
    console.log("[FCM] Token saved/updated in manager_push_tokens.");
  }
}

// ── Main setup function — call after successful manager login ──────────────
export const setupFCMNotifications = async (managerId) => {
  // Guard: browser support check
  if (!("serviceWorker" in navigator) || !("Notification" in window)) {
    console.warn("[FCM] Push notifications not supported in this browser.");
    return null;
  }

  try {
    // 1. Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("[FCM] Notification permission denied.");
      return null;
    }

    // 2. Register the Firebase Messaging Service Worker
    const registration = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js",
      { scope: "/" }
    );
    console.log("[FCM] Service Worker registered:", registration.scope);

    // 3. Initialize Firebase messaging
    const messaging = getFirebaseMessaging();

    // 4. Inject Firebase config into the Service Worker
    //    (SW cannot access import.meta.env — we send config via postMessage)
    if (registration.active) {
      registration.active.postMessage({
        type: "__FIREBASE_CONFIG",
        config: firebaseConfig,
      });
    }

    // 5. Get FCM token
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (!token) {
      console.warn("[FCM] No registration token available.");
      return null;
    }

    console.log("[FCM] Token acquired.");

    // 6. Persist token in Supabase
    await saveTokenToDatabase(managerId, token);

    return { messaging, token };
  } catch (error) {
    console.error("[FCM] Setup failed:", error);
    return null;
  }
};

// ── Foreground message handler — call once after app mounts ───────────────
// Returns an unsubscribe function
export const listenForForegroundMessages = (onNewOrder) => {
  try {
    const messaging = getFirebaseMessaging();
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log("[FCM] Foreground message received:", payload);
      if (payload.data?.notificationType === "new_order") {
        onNewOrder({
          orderId:     payload.data.orderId,
          orderNumber: payload.data.orderNumber,
          title:       payload.notification?.title || "طلب جديد",
          body:        payload.notification?.body  || "تم استلام طلب عميل جديد.",
        });
      }
    });
    return unsubscribe;
  } catch (error) {
    console.error("[FCM] Failed to set up foreground listener:", error);
    return () => {}; // no-op unsubscribe
  }
};

// ── Token refresh: call on app load for already-logged-in managers ─────────
export const refreshFCMToken = async (managerId) => {
  if (!managerId) return;
  try {
    const messaging = getFirebaseMessaging();
    const registration = await navigator.serviceWorker.getRegistration("/");
    if (!registration) return;

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (token) {
      await saveTokenToDatabase(managerId, token);
    }
  } catch (error) {
    // Non-critical — permission may have been revoked
    console.warn("[FCM] Token refresh failed:", error.message);
  }
};
