import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Calendar, CreditCard, ChevronDown, ChevronUp, Copy, CheckCircle2, Clock, XCircle, RotateCcw } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useLoader } from '../context/LoaderContext';
import ToastNotification from '../components/ToastNotification';
import { db } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';

export default function OrderCard({ order, isMobile }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const { addToCart, openCart } = useCart();
  const { showLoader, hideLoader } = useLoader();

  const getStatusConfig = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'delivered':
        return { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)', icon: <CheckCircle2 size={16} />, label: 'تم التوصيل' };
      case 'pending':
      case 'pending review':
        return { color: '#d4af37', bg: 'rgba(212, 175, 55, 0.1)', icon: <Clock size={16} />, label: 'قيد المراجعة' };
      case 'preparing':
        return { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)', icon: <Package size={16} />, label: 'قيد التجهيز' };
      case 'shipped':
        return { color: '#a855f7', bg: 'rgba(168, 85, 247, 0.1)', icon: <Package size={16} />, label: 'تم الشحن' };
      case 'cancelled':
        return { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', icon: <XCircle size={16} />, label: 'ملغي' };
      default:
        return { color: 'var(--text-dim)', bg: 'rgba(255, 255, 255, 0.05)', icon: <Package size={16} />, label: status || 'جديد' };
    }
  };

  const statusConfig = getStatusConfig(order.status);
  
  const copyOrderNumber = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`ORD-${order.order_number}`);
    setToastMessage({ message: 'تم نسخ رقم الطلب', type: 'success' });
  };

  const handleReorder = async (e) => {
    e.stopPropagation();
    showLoader('جاري التحقق من توفر المنتجات...');
    
    try {
      const availableItems = [];
      const unavailableItems = [];

      // Validate products existence before reordering
      for (const item of order.items || []) {
        const productRef = doc(db, 'products', String(item.id));
        const productSnap = await getDoc(productRef);
        
        if (productSnap.exists()) {
          const productData = { id: productSnap.id, ...productSnap.data() };
          // Assume product is available if it exists
          availableItems.push({ item, productData });
        } else {
          unavailableItems.push(item);
        }
      }

      if (availableItems.length === 0) {
        setToastMessage({ message: 'عذراً، جميع منتجات هذا الطلب غير متوفرة حالياً.', type: 'error' });
      } else {
        availableItems.forEach(({ item, productData }) => {
          addToCart(productData, {
            quantity: item.dp_qty,
            selectedColor: item.selectedColor,
            selectedMaterial: item.selectedMaterial,
            variantImage: item.variantImage
          });
        });
        
        if (unavailableItems.length > 0) {
          setToastMessage({ message: `تمت إضافة ${availableItems.length} منتج، و ${unavailableItems.length} منتجات غير متوفرة.`, type: 'success' });
        } else {
          setToastMessage({ message: 'تمت إضافة جميع المنتجات إلى السلة بنجاح!', type: 'success' });
        }
        
        setTimeout(() => {
          openCart();
        }, 1500);
      }
    } catch (error) {
      console.error('Error reordering:', error);
      setToastMessage({ message: 'حدث خطأ أثناء إعادة الطلب', type: 'error' });
    } finally {
      hideLoader();
    }
  };

  return (
    <>
      {toastMessage && <ToastNotification message={toastMessage.message} type={toastMessage.type} onDone={() => setToastMessage(null)} />}
      
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'var(--bg-card)',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          overflow: 'hidden',
          transition: 'all 0.3s ease',
          boxShadow: isExpanded ? '0 10px 30px rgba(0,0,0,0.15)' : 'none'
        }}
      >
        {/* Compact Order Header */}
        <div
          style={{
            padding: isMobile ? '12px 14px' : '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
          }}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div style={{ display: 'flex', gap: isMobile ? '10px' : '12px', alignItems: 'center' }}>
            <div style={{
              width: isMobile ? '36px' : '42px',
              height: isMobile ? '36px' : '42px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.1), rgba(212, 175, 55, 0.05))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)',
              border: '1px solid rgba(212,175,55,0.2)',
              flexShrink: 0
            }}>
              <Package size={isMobile ? 18 : 20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                <h3 style={{ fontSize: isMobile ? '0.85rem' : '0.95rem', fontWeight: 'bold', margin: 0, fontFamily: 'var(--font-main)' }}>
                  #ORD-{order.order_number}
                </h3>
                <button 
                  onClick={copyOrderNumber}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', padding: '2px' }}
                >
                  <Copy size={14} />
                </button>
                <span style={{
                  fontSize: '0.65rem',
                  padding: '2px 6px',
                  borderRadius: '6px',
                  background: statusConfig.bg,
                  color: statusConfig.color,
                  fontWeight: '700',
                  whiteSpace: 'nowrap'
                }}>
                  {statusConfig.label}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '10px', fontSize: isMobile ? '0.65rem' : '0.75rem', color: 'var(--text-dim)', fontWeight: '500' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={12} />
                  {new Date(order.created_at).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary)' }}>
                  <CreditCard size={12} />
                  {order.total_amount?.toLocaleString()} ر.ي
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {!isMobile && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontFamily: 'var(--font-main)' }}>
                  {order.items?.length || 0} منتجات
                </span>
              </div>
            )}
            {isExpanded ? <ChevronUp size={18} color="var(--text-dim)" /> : <ChevronDown size={18} color="var(--text-dim)" />}
          </div>
        </div>

        {/* Expandable Order Details */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{
                padding: isMobile ? '0 12px 15px' : '0 20px 20px',
                borderTop: '1px dashed var(--border-color)',
                marginTop: '5px'
              }}>
                <div style={{ padding: isMobile ? '12px 0' : '16px 0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {order.items?.map((item, idx) => (
                    <div key={idx} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '10px',
                      background: 'rgba(255,255,255,0.02)',
                      padding: '10px',
                      borderRadius: '12px',
                      border: '1px solid rgba(255,255,255,0.03)'
                    }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div style={{ position: 'relative' }}>
                          <img 
                            src={item.image || item.imageUrl || (item.images && item.images[0]) || (item.variants && item.variants[0]?.image)} 
                            alt={item.name} 
                            style={{ width: isMobile ? '45px' : '55px', height: isMobile ? '45px' : '55px', borderRadius: '10px', objectFit: 'cover' }} 
                          />
                          <span style={{
                            position: 'absolute',
                            top: '-6px',
                            right: '-6px',
                            background: 'var(--primary)',
                            color: '#000',
                            fontSize: '0.65rem',
                            fontWeight: 'bold',
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1.5px solid var(--bg-card)',
                            pointerEvents: 'none'
                          }}>{item.dp_qty}</span>
                        </div>
                        <div>
                          <p style={{ fontSize: isMobile ? '0.8rem' : '0.9rem', fontWeight: '600', marginBottom: '2px', color: 'var(--text-main)' }}>{item.name}</p>
                          <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                            {item.price?.toLocaleString()} ر.ي للوحدة
                          </p>
                        </div>
                      </div>
                      <p style={{ fontSize: isMobile ? '0.85rem' : '0.95rem', fontWeight: '700', color: 'var(--primary)' }}>
                        {(item.price * item.dp_qty).toLocaleString()} ر.ي
                      </p>
                    </div>
                  ))}
                </div>

                <div style={{
                  padding: isMobile ? '12px' : '16px',
                  background: 'var(--bg-main)',
                  borderRadius: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  border: '1px solid var(--border-color)',
                  marginBottom: '16px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>طريقة الدفع</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)' }}>
                      {order.payment_method === 'cash_on_delivery' ? 'الدفع عند الاستلام' : (order.payment_method === 'bank_transfer' ? 'تحويل بنكي' : order.payment_method || 'غير محدد')}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>عنوان التوصيل</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)', textAlign: 'left', maxWidth: '60%' }}>
                      {order.customer_address?.governorate}، {order.customer_address?.district}، {order.customer_address?.neighborhood}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    onClick={handleReorder}
                    className="btn-primary" 
                    style={{ flex: 1, padding: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontSize: '0.9rem', borderRadius: '10px' }}
                  >
                    <RotateCcw size={16} />
                    إعادة الطلب
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}
