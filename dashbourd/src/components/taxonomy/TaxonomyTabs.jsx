import React from 'react';
import { TAXONOMY_TYPES } from 'shared/taxonomy';
import { Layers, Briefcase, Grid, Users } from 'lucide-react';

export default function TaxonomyTabs({ activeTab, onTabChange }) {
  const tabs = [
    { id: TAXONOMY_TYPES.CATEGORY, label: 'الأقسام (Categories)', icon: Layers },
    { id: TAXONOMY_TYPES.BRAND, label: 'الماركات (Brands)', icon: Briefcase },
    { id: TAXONOMY_TYPES.COLLECTION, label: 'التشكيلات (Collections)', icon: Grid }
  ];

  return (
    <div style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.3)', padding: '6px', borderRadius: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            style={{
              padding: '12px 20px',
              borderRadius: '12px',
              border: 'none',
              background: isActive ? 'var(--primary)' : 'transparent',
              color: isActive ? '#000' : 'var(--text-muted)',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: '0.3s',
            }}
          >
            <Icon size={18} /> {tab.label}
          </button>
        );
      })}
    </div>
  );
}
