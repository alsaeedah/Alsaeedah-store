import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../hooks/useOrders';
import OrderCard from './OrderCard';
import OrderSkeleton from './OrderSkeleton';
import EmptyOrders from './EmptyOrders';
import { AlertCircle, RefreshCw } from 'lucide-react';
import './OrdersHistory.css';

export default function OrdersHistory() {
  const { currentUser } = useAuth();
  const { orders, loading, loadingMore, error, hasMore, refreshOrders, loadMoreOrders } = useOrders(10);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (currentUser) {
      refreshOrders();
    }
  }, [currentUser, refreshOrders]);

  if (!currentUser) return null; // AuthGate handles redirect

  return (
    <div className="orders-history-container">
      <div style={{ width: '100%' }}>


        {error && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="error-card"
          >
            <AlertCircle size={32} color="#ef4444" style={{ flexShrink: 0 }} />
            <div style={{ wordBreak: 'break-word', overflowWrap: 'break-word', width: '100%' }}>
              <h3 style={{ margin: '0 0 4px 0' }}>عذراً، لم نتمكن من تحميل طلباتك</h3>
              <p style={{ margin: 0, fontSize: '0.85rem' }}>{error}</p>
            </div>
            <button onClick={refreshOrders} className="btn-primary" style={{ marginTop: '16px' }}>
              <RefreshCw size={16} /> إعادة المحاولة
            </button>
          </motion.div>
        )}

        {loading ? (
          <OrderSkeleton isMobile={isMobile} />
        ) : !error && orders.length === 0 ? (
          <EmptyOrders isMobile={isMobile} />
        ) : !error && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} isMobile={isMobile} />
            ))}
            
            {hasMore && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ textAlign: 'center', marginTop: '20px' }}
              >
                <button 
                  className="btn-secondary load-more-btn"
                  onClick={loadMoreOrders}
                  disabled={loadingMore}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '12px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-main)',
                    fontWeight: '600',
                    cursor: loadingMore ? 'not-allowed' : 'pointer',
                    opacity: loadingMore ? 0.7 : 1
                  }}
                >
                  {loadingMore ? 'جاري التحميل...' : 'عرض المزيد من الطلبات'}
                </button>
              </motion.div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
