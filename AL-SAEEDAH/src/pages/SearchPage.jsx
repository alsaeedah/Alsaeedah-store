import { useLocation, useNavigate } from 'react-router-dom';
import ProductList from '../components/ProductList';
import { motion } from 'framer-motion';

export default function SearchPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const searchParams = new URLSearchParams(location.search);
    const q = searchParams.get('q') || '';

    if (!q.trim()) {
        return (
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: '20px', textAlign: 'center', padding: '20px' }}
            >
                <h2 style={{ color: 'var(--text-main)', fontSize: '2rem' }}>البحث عن منتجات</h2>
                <p style={{ color: 'var(--text-secondary)' }}>الرجاء إدخال اسم المنتج أو رقمه للبحث.</p>
                <button 
                    onClick={() => navigate('/')}
                    style={{ padding: '10px 20px', background: 'var(--skeleton-bg)', border: '1px solid var(--border-color)', color: 'var(--text-main)', borderRadius: '8px', cursor: 'pointer', fontFamily: 'cairo' }}
                >
                    العودة للرئيسية
                </button>
            </motion.div>
        );
    }

    return (
        <ProductList 
            key={q} 
            initialSearch={q} 
            title="نتائج البحث عن:" 
            subtitle={`"${q}"`} 
            description="المنتجات التي تطابق بحثك"
        />
    );
}
