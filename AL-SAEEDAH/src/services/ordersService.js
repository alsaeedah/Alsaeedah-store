import { db } from '../firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';

export const ordersService = {
  /**
   * Fetches all orders for a specific user and sorts them client-side
   * to avoid requiring a composite index in Firestore.
   * @param {string} userId - The authenticated user's ID
   * @returns {Promise<Array>}
   */
  async getAllUserOrders(userId) {
    if (!userId) {
      throw new Error('User ID is required to fetch orders.');
    }

    try {
      const { StorageEngine } = await import('../../../shared/storage/StorageEngine');
      const cacheKey = `order_history_${userId}`;
      
      let userOrders = [];
      
      // 1. Try local cache first
      try {
          const cached = await StorageEngine.get(cacheKey);
          if (cached && Array.isArray(cached)) {
              userOrders = cached;
          }
      } catch (err) {}

      // 2. Try network — Firestore is the source of truth on success.
      //    A successful response (including an empty array) always replaces
      //    the local cache.  Only a network failure leaves the existing cache
      //    intact so offline-first behaviour is preserved.
      let firestoreSucceeded = false;
      try {
          const q = query(collection(db, 'orders'), where('user_id', '==', userId));
          const snapshot = await getDocs(q);
          const freshOrders = [];
          snapshot.forEach(doc => {
              freshOrders.push({ id: doc.id, ...doc.data() });
          });

          // Sort client-side by created_at descending
          freshOrders.sort((a, b) => {
              const dateA = new Date(a.created_at || 0).getTime();
              const dateB = new Date(b.created_at || 0).getTime();
              return dateB - dateA;
          });

          // Always replace — even when freshOrders is []
          userOrders = freshOrders;
          await StorageEngine.set(cacheKey, freshOrders);
          firestoreSucceeded = true;
      } catch (networkErr) {
          console.warn('[ordersService] Network failed, using cache if available');
      }

      // 3. Fallback sort for the cached result when Firestore was unreachable
      if (!firestoreSucceeded && userOrders.length > 0) {
          userOrders.sort((a, b) => {
              const dateA = new Date(a.created_at || 0).getTime();
              const dateB = new Date(b.created_at || 0).getTime();
              return dateB - dateA;
          });
      }

      return userOrders;
    } catch (error) {
      console.error('Error fetching user orders:', error);
      throw error;
    }
  },

  /**
   * Injects a newly created order directly into the local cache.
   * Prevents duplicates and maintains descending sort order.
   */
  async injectOrderIntoCache(userId, order) {
    if (!userId || !order) return;
    try {
      const { StorageEngine } = await import('../../../shared/storage/StorageEngine');
      const cacheKey = `order_history_${userId}`;
      let cached = await StorageEngine.get(cacheKey) || [];
      if (!Array.isArray(cached)) cached = [];

      // Avoid duplicates
      const exists = cached.find(o => o.id === order.id || o.requestId === order.requestId);
      if (exists) {
        cached = cached.map(o => (o.id === order.id || o.requestId === order.requestId) ? order : o);
      } else {
        cached.unshift(order);
      }

      // Sort client-side by created_at descending
      cached.sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA;
      });

      await StorageEngine.set(cacheKey, cached);
    } catch (err) {
      console.warn('[ordersService] Failed to inject order into cache', err);
    }
  }
};
