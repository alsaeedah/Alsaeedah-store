import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function EmptyOrders({ isMobile }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="empty-orders-container"
      style={{
        textAlign: 'center',
        padding: isMobile ? '60px 20px' : '80px 40px',
        background: 'var(--bg-card)',
        borderRadius: '24px',
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.05)'
      }}
    >
      <div style={{
        width: isMobile ? '80px' : '100px',
        height: isMobile ? '80px' : '100px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, rgba(212,175,55,0.1), rgba(212,175,55,0.05))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <ShoppingBag size={isMobile ? 40 : 48} style={{ color: 'var(--primary)' }} strokeWidth={1.5} />
      </div>
      
      <div>
        <h2 style={{ 
          fontSize: isMobile ? '1.2rem' : '1.5rem', 
          fontWeight: '700', 
          color: 'var(--text-main)',
          marginBottom: '8px'
        }}>
          لا يوجد طلبات بعد
        </h2>
        <p style={{ 
          color: 'var(--text-dim)', 
          fontSize: isMobile ? '0.9rem' : '1rem',
          maxWidth: '300px',
          margin: '0 auto',
          lineHeight: '1.5'
        }}>
          مستقبلا سترى جميع طلباتك في هذه الخانه
        </p>
      </div>

      <Link 
        to="/" 
        className="btn-primary" 
        style={{ 
          padding: isMobile ? '12px 28px' : '14px 32px', 
          fontSize: isMobile ? '0.95rem' : '1.05rem', 
          textDecoration: 'none',
          borderRadius: '12px',
          marginTop: '10px',
          fontWeight: '600'
        }}
      >
        أبدأ التسوق
      </Link>
    </motion.div>
  );
}
