import { useState, useCallback, useRef, useEffect } from 'react';
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

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = ordersService.subscribeToUserOrders(
      currentUser.uid || currentUser.id,
      (result) => {
        setAllOrders(result);
        
        setOrders(prev => {
           // We need to keep the loaded pages
           // If we were on page 1, show pageSize.
           // If we were on page 3, show 3*pageSize.
           // But since state might not be up-to-date in the closure, we can use a functional update or just rely on currentPage from the outer scope if we add it to deps.
           return result.slice(0, currentPage * pageSize);
        });

        setHasMore(result.length > currentPage * pageSize);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser, pageSize, currentPage]);

  // Keep loadMoreOrders exactly the same
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
      }, 400); 
    }
  }, [allOrders, currentPage, hasMore, pageSize, loadingMore]);

  // We no longer need refreshOrders, or we can just make it a no-op 
  // since lifecycleCoordinator handles visibilitychange
  const refreshOrders = useCallback(() => {
     // Optional: could manually trigger lifecycleCoordinator if we wanted a pull-to-refresh
  }, []);

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
