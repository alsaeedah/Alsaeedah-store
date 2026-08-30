import { useParams, Navigate } from 'react-router-dom';
import ProductList from '../components/ProductList';
import { useTaxonomyStore } from '../services/taxonomyService';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BrandPage() {
    const { slugId } = useParams();
    const store = useTaxonomyStore();

    if ((store.status === 'loading' || store.status === 'idle') && store.brands.length === 0) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: '20px' }}>
                <Loader2 size={40} className="spinner" style={{ color: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
                <p style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-main)' }}>جاري تحميل الماركات...</p>
            </div>
        );
    }

    if (store.status === 'error' && store.brands.length === 0) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: '20px' }}>
                <p style={{ color: 'var(--danger)', fontFamily: 'var(--font-main)' }}>عذراً، حدث خطأ أثناء تحميل الماركات.</p>
                <button 
                    onClick={() => window.location.reload()}
                    style={{ padding: '10px 20px', background: 'var(--primary)', color: 'var(--btn-text)', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                >
                    إعادة المحاولة
                </button>
            </div>
        );
    }

    // 1. Try to extract ID from slug (assuming format: 'slug-name-id')
    // Alternatively, if it's just an ID, use it directly.
    const parts = slugId.split('-');
    let matchedBrand = null;

    // We check if the exact slugId matches an ID first
    matchedBrand = store.brands.find(b => b.id === slugId);
    
    if (!matchedBrand && parts.length > 1) {
        // Try the last part as ID
        const possibleId = parts[parts.length - 1];
        matchedBrand = store.brands.find(b => b.id === possibleId);
    }

    // 2. 404 / Empty State
    if (!matchedBrand) {
        return (
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: '20px', textAlign: 'center', padding: '20px' }}
            >
                <h2 style={{ color: 'var(--text-main)', fontSize: '2rem' }}>الماركة غير موجودة</h2>
                <p style={{ color: 'var(--text-secondary)' }}>عذراً، الماركة التي تبحث عنها غير موجودة أو تم إزالتها.</p>
                <button 
                    onClick={() => window.history.back()}
                    style={{ padding: '10px 20px', background: 'var(--skeleton-bg)', border: '1px solid var(--border-color)', color: 'var(--text-main)', borderRadius: '8px', cursor: 'pointer' }}
                >
                    العودة
                </button>
            </motion.div>
        );
    }

    return (
        <ProductList 
            initialBrand={matchedBrand.id} 
            title="ماركات" 
            subtitle={matchedBrand.name} 
            description={matchedBrand.description || "تصفح منتجات هذه الماركة المميزة"} 
        />
    );
}
