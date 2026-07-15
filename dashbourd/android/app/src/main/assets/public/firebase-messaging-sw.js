// ============================================================
// Firebase Cloud Messaging Service Worker
// File: dashbourd/public/firebase-messaging-sw.js
//
// This Service Worker handles push notifications when the
// dashboard tab is CLOSED or in the BACKGROUND.
//
// IMPORTANT: This file must be served from the root ("/") path.
// Placing it in /public ensures Vite serves it at the root.
// ============================================================

// Firebase compat SDK (must use importScripts — ES modules not supported in SW)
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

// ── Firebase config is injected at runtime via a fetch to /firebase-config.js
// ── OR hardcoded here (Service Workers cannot access import.meta.env)
// ── We use self.__FIREBASE_CONFIG set by the main app via postMessage / injected script
// ── Fallback: hardcoded config (replace with your actual values)
// ── IMPORTANT: These are PUBLIC client-side keys — safe to expose in JS
firebase.initializeApp({
  apiKey: "AIzaSyA742ivL9YWQElCmBs2gFQqlzxC70zBoWc",
  authDomain: "al-saeedah8.firebaseapp.com",
  projectId: "al-saeedah8",
  messagingSenderId: "54441603865",
  appId: "1:54441603865:web:fd6cf275a14c0530f64b88",
});

const messaging = firebase.messaging();

// ── Background Message Handler ─────────────────────────────────────────────
// Fires when tab is in background or closed
messaging.onBackgroundMessage((payload) => {
  console.log("[SW] Background FCM message received:", payload);

  const notificationTitle =
    payload.notification?.title || "طلب جديد";
  const notificationBody =
    payload.notification?.body || "تم استلام طلب عميل جديد ويحتاج إلى مراجعة.";
  const orderId = payload.data?.orderId;
  const orderNumber = payload.data?.orderNumber;

  const notificationOptions = {
    body: notificationBody,
    icon: "/logo.png",
    badge: "/logo.png",
    requireInteraction: true,
    vibrate: [200, 100, 200],
    tag: `new-order-${orderId}`,      // prevents duplicate notifications for same order
    renotify: false,
    data: {
      orderId,
      orderNumber,
      url: `/orders${orderId ? `?highlight=${orderId}` : ""}`,
    },
    actions: [
      {
        action: "open_orders",
        title: "عرض الطلبات",
      },
      {
        action: "dismiss",
        title: "إغلاق",
      },
    ],
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// ── Notification Click Handler ─────────────────────────────────────────────
// Fires when user clicks the notification
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") return;

  const targetUrl = event.notification.data?.url || "/orders";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        // If the dashboard is already open in a tab, focus it and navigate
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.focus();
            client.navigate(targetUrl);
            return;
          }
        }
        // Otherwise open a new tab
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});
