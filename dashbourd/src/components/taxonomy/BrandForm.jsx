import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { validateBrand } from 'shared/taxonomy';

// ─── Ref-counted scroll lock ──────────────────────────────────────────────────
// Shared counter lives on document.body so BrandForm and TaxonomyForm cooperate:
// a second modal opening will not lose the lock, and the first to close will
// not remove the class while the other is still mounted.
const LOCK_ATTR = 'data-taxonomy-modal-count';

function lockBodyScroll() {
  const current = parseInt(document.body.getAttribute(LOCK_ATTR) || '0', 10);
  document.body.setAttribute(LOCK_ATTR, current + 1);
  document.body.classList.add('taxonomy-modal-open');
}

function unlockBodyScroll() {
  const current = parseInt(document.body.getAttribute(LOCK_ATTR) || '1', 10);
  const next = Math.max(0, current - 1);
  document.body.setAttribute(LOCK_ATTR, next);
  if (next === 0) {
    document.body.classList.remove('taxonomy-modal-open');
    document.body.removeAttribute(LOCK_ATTR);
  }
}
// ─────────────────────────────────────────────────────────────────────────────

export default function BrandForm({ item, onSave, onCancel }) {
  const [name, setName] = useState(item?.name || '');
  // Order is only relevant when editing an existing item.
  // For creation, the repository calculates max(order) + 1 automatically.
  const [order, setOrder] = useState(item?.order ?? 1);
  const [active, setActive] = useState(item?.active ?? true);
  const [error, setError] = useState(null);

  // Lock body scroll while this modal is mounted; always unlock on unmount.
  useEffect(() => {
    lockBodyScroll();
    return () => {
      unlockBodyScroll();
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    
    const data = {
      name: name.trim(),
      active
    };

    // Include order only when editing so the existing order is preserved.
    // When creating, the repository auto-assigns max(order) + 1.
    if (item) {
      data.order = parseInt(order, 10) || 1;
    }

    if (item) {
      data.id = item.id;
    }

    try {
      validateBrand(data);
      onSave(data);
    } catch (err) {
      setError(err.message);
    }
  };

  // ── Portal: render the overlay directly into document.body so that
  // ── position:fixed resolves against the true browser viewport, not
  // ── any ancestor that creates a CSS containing block (backdrop-filter,
  // ── transform, will-change, etc.) inside the dashboard layout.
  return createPortal(
    <div style={{ background: 'rgba(0,0,0,0.5)', position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ background: '#141414', padding: '32px', borderRadius: '24px', width: '100%', maxWidth: '500px', border: '1px solid var(--border-color)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
        <h3 style={{ color: '#fff', fontSize: '1.4rem', fontWeight: '800', marginBottom: '24px' }}>
          {item ? 'تعديل' : 'إضافة'} ماركة
        </h3>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '12px', borderRadius: '12px', marginBottom: '20px', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '8px', fontSize: '0.9rem' }}>الاسم</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: '12px', color: '#fff', outline: 'none' }}
              placeholder="الاسم بالعربية أو الإنجليزية"
            />
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            {/* Order input is shown only in Edit mode. Creation order is set automatically by the repository. */}
            {item && (
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '8px', fontSize: '0.9rem' }}>الترتيب</label>
                <input 
                  type="number" 
                  value={order} 
                  onChange={(e) => setOrder(e.target.value)} 
                  min="1"
                  style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: '12px', color: '#fff', outline: 'none' }}
                />
              </div>
            )}
            <div style={{ flex: item ? 1 : undefined, display: 'flex', alignItems: 'center', paddingTop: item ? '28px' : '0' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={active} 
                  onChange={(e) => setActive(e.target.checked)} 
                  style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                />
                نشط (Active)
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <button 
              type="submit"
              style={{ flex: 1, padding: '12px', background: 'var(--primary)', color: '#000', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer' }}
            >
              حفظ
            </button>
            <button 
              type="button"
              onClick={onCancel}
              style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer' }}
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

