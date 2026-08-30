import React from 'react';
import { Edit2, Trash2, ArrowUp, ArrowDown } from 'lucide-react';

export default function TaxonomyList({ items, onEdit, onDeactivate, onMoveUp, onMoveDown }) {
  if (!items || items.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
        لا توجد عناصر حالياً في هذا القسم.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {items.map((item, index) => (
        <div 
          key={item.id} 
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: '16px 20px', 
            background: 'rgba(255,255,255,0.03)', 
            borderRadius: '16px', 
            border: '1px solid var(--border-color)',
            opacity: item.active ? 1 : 0.5,
            transition: '0.3s'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <button 
                onClick={() => onMoveUp(item, index)} 
                disabled={index === 0}
                style={{ background: 'transparent', border: 'none', color: index === 0 ? 'rgba(255,255,255,0.1)' : '#fff', cursor: index === 0 ? 'default' : 'pointer' }}
                title="تحريك لأعلى"
              >
                <ArrowUp size={18} />
              </button>
              <button 
                onClick={() => onMoveDown(item, index)} 
                disabled={index === items.length - 1}
                style={{ background: 'transparent', border: 'none', color: index === items.length - 1 ? 'rgba(255,255,255,0.1)' : '#fff', cursor: index === items.length - 1 ? 'default' : 'pointer' }}
                title="تحريك لأسفل"
              >
                <ArrowDown size={18} />
              </button>
            </div>
            
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--primary)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '1rem' }}>
              {item.order !== undefined ? item.order : index + 1}
            </div>
            
            <div>
              <h4 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: '700', margin: 0, marginBottom: '4px', textDecoration: item.active ? 'none' : 'line-through' }}>
                {item.name}
              </h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>
                {item.slug} {item.active ? '' : '(معطل)'}
              </p>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              onClick={() => onEdit(item)} 
              title="تعديل"
              style={{ padding: '8px', background: 'rgba(212, 175, 55, 0.1)', color: 'var(--primary)', border: 'none', borderRadius: '10px', cursor: 'pointer', transition: '0.3s' }}
            >
              <Edit2 size={18} />
            </button>
            {item.active && (
              <button 
                onClick={() => onDeactivate(item.id)} 
                title="تعطيل"
                style={{ padding: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', borderRadius: '10px', cursor: 'pointer', transition: '0.3s' }}
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
