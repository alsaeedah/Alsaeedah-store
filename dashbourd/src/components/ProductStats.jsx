import React from 'react';

const ProductStats = ({ stats }) => {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '3rem' }}>
            {stats.map((stat, index) => (
                <div
                    key={stat.label}
                    className="glass-card"
                    style={{ padding: '24px', borderRadius: 'var(--radius-md)', borderRight: `4px solid ${stat.color || 'rgba(255,255,255,0.1)'}` }}
                >
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '10px' }}>{stat.label}</p>
                    <h2 style={{ fontSize: '2rem', color: '#fff' }}>{stat.value}</h2>
                </div>
            ))}
        </div>
    );
};

export default ProductStats;
