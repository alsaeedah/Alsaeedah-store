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
      const ordersRef = collection(db, 'orders');
      
      // Only query by user_id to avoid needing a composite index
      const q = query(
        ordersRef,
        where('user_id', '==', userId)
      );

      const snapshot = await getDocs(q);
      
      const orders = [];
      snapshot.forEach(doc => {
        orders.push({ id: doc.id, ...doc.data() });
      });

      // Sort client-side by created_at descending (newest first)
      orders.sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA;
      });

      return orders;
    } catch (error) {
      console.error('Error fetching user orders:', error);
      throw error;
    }
  }
};
