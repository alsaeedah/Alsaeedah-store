import { db } from '../firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';

export const ordersService = {
  /**
   * Fetches all orders for a specific user and sorts them client-side
   * to avoid requiring a composite index in Firestore.
   * @param {string} userId - The authenticated user's ID
   * @returns {Promise<Array>}
   */
  subscribeToUserOrders(userId, callback) {
    if (!userId) throw new Error('User ID is required');

    let isCancelled = false;
    const cacheKey = `order_history_${userId}`;

    const fetchAndNotify = async () => {
      try {
        const { StorageEngine } = await import('../../../shared/storage/StorageEngine');
        
        let cached = await StorageEngine.get(cacheKey);
        if (cached && Array.isArray(cached) && !isCancelled) {
          cached.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
          callback(cached);
        }

        try {
          const q = query(collection(db, 'orders'), where('user_id', '==', userId));
          const snapshot = await getDocs(q);
          const freshOrders = [];
          snapshot.forEach(doc => {
              freshOrders.push({ id: doc.id, ...doc.data() });
          });

          freshOrders.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

          await StorageEngine.set(cacheKey, freshOrders);
          
          if (!isCancelled) {
              callback(freshOrders);
          }
        } catch (networkErr) {
          console.warn('[ordersService] Network failed, using cache if available');
        }
      } catch (e) {
        console.error('Error fetching user orders:', e);
      }
    };

    fetchAndNotify();

    // Revalidate on lifecycle events (like resume/focus)
    let unsubscribeLifecycle;
    import('../../../shared/startup/LifecycleCoordinator.js').then(({ lifecycleCoordinator }) => {
      unsubscribeLifecycle = lifecycleCoordinator.subscribe(() => {
        if (!isCancelled) fetchAndNotify();
      });
    });

    return () => {
      isCancelled = true;
      if (unsubscribeLifecycle) unsubscribeLifecycle();
    };
  },

  async getAllUserOrders(userId) {
    if (!userId) {
      throw new Error('User ID is required to fetch orders.');
    }

    try {
      const { StorageEngine } = await import('../../../shared/storage/StorageEngine');
      const cacheKey = `order_history_${userId}`;
      
      let userOrders = [];
      
      try {
          const cached = await StorageEngine.get(cacheKey);
          if (cached && Array.isArray(cached)) {
              userOrders = cached;
          }
      } catch (err) {}

      let firestoreSucceeded = false;
      try {
          const q = query(collection(db, 'orders'), where('user_id', '==', userId));
          const snapshot = await getDocs(q);
          const freshOrders = [];
          snapshot.forEach(doc => {
              freshOrders.push({ id: doc.id, ...doc.data() });
          });

          freshOrders.sort((a, b) => {
              const dateA = new Date(a.created_at || 0).getTime();
              const dateB = new Date(b.created_at || 0).getTime();
              return dateB - dateA;
          });

          userOrders = freshOrders;
          await StorageEngine.set(cacheKey, freshOrders);
          firestoreSucceeded = true;
      } catch (networkErr) {
          console.warn('[ordersService] Network failed, using cache if available');
      }

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
