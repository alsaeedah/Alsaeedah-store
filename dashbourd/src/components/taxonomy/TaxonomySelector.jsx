import React from 'react';

const TaxonomySelector = ({
    type,
    value,
    onChange,
    entities = [],
    isLoading = false,
    isDisabled = false,
    label,
    required = false
}) => {
    // Determine active and inactive entities
    const activeEntities = entities.filter(e => e.active);
    
    // Find the currently selected entity to handle inactive gracefully
    const selectedEntity = value ? entities.find(e => e.id === value) : null;
    const isSelectedInactive = selectedEntity && !selectedEntity.active;

    if (isLoading) {
        return (
            <div style={{ width: '100%', marginBottom: '15px' }}>
                {label && <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>{label}</label>}
                <select disabled style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: '1px solid var(--glass-border)' }}>
                    <option>جاري التحميل...</option>
                </select>
            </div>
        );
    }

    if (entities.length === 0) {
        return (
            <div style={{ width: '100%', marginBottom: '15px' }}>
                {label && <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>{label}</label>}
                <div style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: '0.9rem' }}>
                    لا توجد بيانات (يرجى إضافتها من إدارة الأصناف أولاً)
                </div>
            </div>
        );
    }

    return (
        <div style={{ width: '100%', marginBottom: '15px' }}>
            {label && <label style={{ display: 'block', marginBottom: '8px', color: '#fff' }}>{label}</label>}
            <select
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                disabled={isDisabled}
                required={required}
                style={{ 
                    width: '100%', 
                    padding: '12px', 
                    borderRadius: '12px', 
                    background: 'rgba(0,0,0,0.2)', 
                    color: '#fff', 
                    border: '1px solid var(--glass-border)',
                    outline: 'none',
                    cursor: isDisabled ? 'not-allowed' : 'pointer'
                }}
            >
                <option value="" disabled>اختر {label}</option>
                
                {/* Always render the inactive selected item if it exists so the user doesn't lose it implicitly */}
                {isSelectedInactive && (
                    <option value={selectedEntity.id}>
                        {selectedEntity.name} (غير نشط)
                    </option>
                )}

                {/* Render all active entities */}
                {activeEntities.map(entity => (
                    <option key={entity.id} value={entity.id}>
                        {entity.name}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default TaxonomySelector;
