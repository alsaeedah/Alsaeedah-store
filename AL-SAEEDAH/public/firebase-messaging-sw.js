// ============================================================
// Firebase Cloud Messaging Service Worker
// File: AL-SAEEDAH/public/firebase-messaging-sw.js
//
// This Service Worker handles push notifications for the 
// AL-SAEEDAH storefront when the tab is CLOSED or in the BACKGROUND.
//
// STRICT CONSTRAINT: 
// This file handles ONLY receiving pushes, displaying them, 
// and handling notification clicks.
// It MUST NOT access or modify Product cache, EntityStore, 
// ProductDAL, SyncEngine, or application data.
// ============================================================

importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

// Fallback config if injection fails
firebase.initializeApp({
  apiKey: "AIzaSyA742ivL9YWQElCmBs2gFQqlzxC70zBoWc",
  authDomain: "al-saeedah8.firebaseapp.com",
  projectId: "al-saeedah8",
  messagingSenderId: "54441603865",
  appId: "1:54441603865:web:fd6cf275a14c0530f64b88",
});

const messaging = firebase.messaging();

// ── Background Message Handler ─────────────────────────────────────────────
messaging.onBackgroundMessage((payload) => {
  console.log("[SW] Background FCM message received:", payload);

  const notificationTitle = payload.notification?.title || "السعيدة للصرافة";
  const notificationBody = payload.notification?.body || "لديك إشعار جديد.";

  const notificationOptions = {
    body: notificationBody,
    icon: "/logo.png",
    badge: "/logo.png",
    requireInteraction: true,
    vibrate: [200, 100, 200],
    data: {
      url: payload.data?.url || "/",
    },
    actions: [
      {
        action: "open_app",
        title: "عرض",
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
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") return;

  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        // If the app is already open in a tab, focus it and navigate
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
