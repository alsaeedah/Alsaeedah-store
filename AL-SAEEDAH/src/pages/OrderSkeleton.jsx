import React from 'react';
import { motion } from 'framer-motion';

export default function OrderSkeleton({ isMobile }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {[1, 2, 3].map((item) => (
        <motion.div
          key={item}
          initial={{ opacity: 0.5 }}
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          style={{
            background: 'var(--bg-card)',
            borderRadius: '16px',
            border: '1px solid var(--border-color)',
            padding: isMobile ? '16px' : '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          {/* Shimmer effect overlay */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent)',
            transform: 'skewX(-20deg)',
            animation: 'shimmer 2s infinite linear',
            zIndex: 1
          }}></div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              {/* Icon skeleton */}
              <div style={{
                width: isMobile ? '40px' : '48px',
                height: isMobile ? '40px' : '48px',
                borderRadius: '12px',
                background: 'var(--border-color)',
              }}></div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* Title skeleton */}
                <div style={{ width: '100px', height: '14px', borderRadius: '4px', background: 'var(--border-color)' }}></div>
                {/* Date skeleton */}
                <div style={{ width: '140px', height: '10px', borderRadius: '4px', background: 'var(--border-color)', opacity: 0.7 }}></div>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
              {/* Status skeleton */}
              <div style={{ width: '80px', height: '22px', borderRadius: '12px', background: 'var(--border-color)' }}></div>
              {/* Price skeleton */}
              <div style={{ width: '90px', height: '14px', borderRadius: '4px', background: 'var(--border-color)' }}></div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
