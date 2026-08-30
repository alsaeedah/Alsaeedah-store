import { useParams, Navigate } from 'react-router-dom';
import ProductList from '../components/ProductList';
import { useTaxonomyStore } from '../services/taxonomyService';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CategoryPage() {
    const { slugId } = useParams();
    const store = useTaxonomyStore();

    // The slugId could be just an ID (e.g., 'abc123') or a slugified name (e.g., 'men-watches-abc123')
    // Or it might be one of our legacy redirects: 'men-watches', 'women-watches', 'children-watches'
    
    if ((store.status === 'loading' || store.status === 'idle') && store.categories.length === 0) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: '20px' }}>
                <Loader2 size={40} className="spinner" style={{ color: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
                <p style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-main)' }}>جاري تحميل الأقسام...</p>
            </div>
        );
    }

    if (store.status === 'error' && store.categories.length === 0) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: '20px' }}>
                <p style={{ color: 'var(--danger)', fontFamily: 'var(--font-main)' }}>عذراً، حدث خطأ أثناء تحميل الأقسام.</p>
                <button 
                    onClick={() => window.location.reload()}
                    style={{ padding: '10px 20px', background: 'var(--primary)', color: 'var(--btn-text)', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                >
                    إعادة المحاولة
                </button>
            </div>
        );
    }

    let matchedCategory = null;
    let needsCanonicalRedirect = false;

    // 1. Try matching by slug first (NEW URL PATTERN)
    matchedCategory = store.categories.find(c => c.slug === slugId);

    // 2. Fallback: match by ID (LEGACY URL PATTERN)
    if (!matchedCategory) {
        matchedCategory = store.categories.find(c => c.id === slugId);
        if (matchedCategory) {
            needsCanonicalRedirect = true;
        }
    }
    
    // 3. Fallback: match by old split format
    if (!matchedCategory) {
        const parts = slugId.split('-');
        if (parts.length > 1) {
            const possibleId = parts[parts.length - 1];
            matchedCategory = store.categories.find(c => c.id === possibleId);
            if (matchedCategory) {
                needsCanonicalRedirect = true;
            }
        }
    }

    // 4. Legacy Redirect Compatibility (for hardcoded slugs that didn't have an ID)
    if (!matchedCategory) {
        if (slugId === 'men-watches') {
            // Find a category named 'رجالي' or similar, or fallback to all
            matchedCategory = store.categories.find(c => c.name.includes('رجال') || c.name.includes('Men'));
            if (!matchedCategory) return <ProductList initialCategory="all" />;
            needsCanonicalRedirect = true;
        } else if (slugId === 'women-watches') {
            matchedCategory = store.categories.find(c => c.name.includes('نساء') || c.name.includes('Women'));
            if (!matchedCategory) return <ProductList initialCategory="all" />;
            needsCanonicalRedirect = true;
        } else if (slugId === 'children-watches') {
            matchedCategory = store.categories.find(c => c.name.includes('أطفال') || c.name.includes('Kids') || c.name.includes('Children'));
            if (!matchedCategory) return <ProductList initialCategory="all" />;
            needsCanonicalRedirect = true;
        }
    }

    // Redirect to canonical slug if matched by legacy ID and a slug exists
    if (matchedCategory && needsCanonicalRedirect && matchedCategory.slug) {
        return <Navigate to={`/category/${matchedCategory.slug}`} replace />;
    }

    // 3. 404 / Empty State
    if (!matchedCategory) {
        return (
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: '20px', textAlign: 'center', padding: '20px' }}
            >
                <h2 style={{ color: 'var(--text-main)', fontSize: '2rem' }}>القسم غير موجود</h2>
                <p style={{ color: 'var(--text-secondary)' }}>عذراً، القسم الذي تبحث عنه غير موجود أو تم إزالته.</p>
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
            initialCategory={matchedCategory.id} 
            title="قسم" 
            subtitle={matchedCategory.name} 
            description={matchedCategory.description || "اكتشف مجموعتنا المميزة التي تناسب جميع الأذواق"} 
        />
    );
}
