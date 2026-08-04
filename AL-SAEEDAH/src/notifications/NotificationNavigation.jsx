import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '../context/AuthContext';
import * as Logger from './NotificationLogger';

/**
 * Notification Navigation Layer
 * 
 * Handles the `localNotificationActionPerformed` event.
 * Safely defers navigation until the App has finished loading
 * and the user session is restored (Cold Start safe).
 */
export default function NotificationNavigation() {
  const navigate = useNavigate();
  const { currentUser, loading } = useAuth();
  
  const [pendingTarget, setPendingTarget] = useState(null);
  const handledIds = useRef(new Set());

  // 1. Capture click events immediately (even during startup)
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const listener = LocalNotifications.addListener('localNotificationActionPerformed', (payload) => {
      const notification = payload.notification;
      
      // Prevent duplicate processing from capacitor queue anomalies
      if (handledIds.current.has(notification.id)) return;
      handledIds.current.add(notification.id);

      // Capacitor maps our 'data' to 'extra' internally
      const data = notification.extra || notification.data || {};
      
      Logger.log('NotificationNavigation', 'Action performed', data);

      if (data.target) {
        setPendingTarget(data);
      }
    });

    return () => {
      listener.then(l => l.remove());
    };
  }, []);

  // 2. Safely execute navigation only when App is ready
  useEffect(() => {
    if (!loading && pendingTarget) {
      const target = pendingTarget.target;
      
      // Clear immediately to prevent re-triggers
      setPendingTarget(null);
      
      Logger.log('NotificationNavigation', `Navigating to target: ${target}`);

      if (target === 'order_history') {
        // Slight delay ensures the UI has fully painted after Auth restore
        setTimeout(() => {
          navigate('/orders');
        }, 100);
      }
    }
  }, [loading, currentUser, pendingTarget, navigate]);

  return null;
}
