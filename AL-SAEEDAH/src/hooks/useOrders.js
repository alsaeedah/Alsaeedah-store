import { useState, useCallback, useRef } from 'react';
import { ordersService } from '../services/ordersService';
import { useAuth } from '../context/AuthContext';

export function useOrders(pageSize = 10) {
  const { currentUser } = useAuth();
  const [allOrders, setAllOrders] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Monotonically-increasing counter used to discard responses from stale
  // in-flight requests.  Each fetchOrders call increments the counter and
  // captures its own generation; the state-update block is only executed
  // when the captured generation still matches the latest one.
  const fetchGeneration = useRef(0);

  const fetchOrders = useCallback(async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    // Claim this generation before any async work begins.
    const generation = ++fetchGeneration.current;

    try {
      setLoading(true);
      setError(null);

      const result = await ordersService.getAllUserOrders(currentUser.uid || currentUser.id);

      // Discard if a newer request has already claimed the slot.
      if (generation !== fetchGeneration.current) return;

      setAllOrders(result);
      setOrders(result.slice(0, pageSize));
      setHasMore(result.length > pageSize);
      setCurrentPage(1);

      setLoading(false);
    } catch (err) {
      // Only surface the error if this is still the latest request.
      if (generation !== fetchGeneration.current) return;

      console.error('Failed to fetch orders:', err);
      setError(err.message || 'Unable to load your orders');
      setLoading(false);
    }
  }, [currentUser, pageSize]);

  const refreshOrders = useCallback(() => {
    return fetchOrders();
  }, [fetchOrders]);

  const loadMoreOrders = useCallback(() => {
    if (hasMore && !loadingMore) {
      setLoadingMore(true);
      const nextPage = currentPage + 1;
      const nextOrders = allOrders.slice(0, nextPage * pageSize);
      
      setTimeout(() => {
        setOrders(nextOrders);
        setCurrentPage(nextPage);
        setHasMore(allOrders.length > nextOrders.length);
        setLoadingMore(false);
      }, 400); // Small artificial delay to show loader feedback
    }
  }, [allOrders, currentPage, hasMore, pageSize, loadingMore]);

  return {
    orders,
    loading,
    loadingMore,
    error,
    hasMore,
    refreshOrders,
    loadMoreOrders
  };
}
