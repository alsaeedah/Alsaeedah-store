import React, { useState, useEffect } from 'react';
import TaxonomyManager from '../components/taxonomy/TaxonomyManager';

export default function Taxonomy() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
      const handleResize = () => setIsMobile(window.innerWidth < 768);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{ direction: 'rtl', padding: isMobile ? '5px' : '10px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: isMobile ? 'flex-start' : 'flex-end', 
        marginBottom: isMobile ? '2rem' : '3.5rem', 
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? '16px' : '24px' 
      }}>
        <div>
          <h1 style={{ fontSize: isMobile ? '1.8rem' : '2.8rem', fontWeight: '900', color: '#fff', marginBottom: '8px', letterSpacing: isMobile ? '-0.5px' : '-1.5px' }}>
            المنتجات <span style={{ color: 'var(--primary)', fontSize: isMobile ? '0.8rem' : '1.2rem', verticalAlign: 'middle', opacity: 0.8 }}>| إدارة التصنيفات</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: isMobile ? '0.9rem' : '1.1rem' }}>إدارة الأقسام والماركات والتشكيلات للمتجر.</p>
        </div>
      </div>

      <TaxonomyManager />
    </div>
  );
}
