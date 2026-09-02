import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLoading } from '../context/LoadingContext';
import { productRepository } from '../services/productService';
import { db } from '../firebase/config';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import Swal from 'sweetalert2';
import { Loader2, Plus, Minus, Package, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDashboardSWR } from '../hooks/useDashboardSWR';

const Inventory = () => {
    const [products, setProducts] = useState([]);
    const [inventoryData, setInventoryData] = useState({});
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const { startLoading, stopLoading } = useLoading();
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const observer = useRef();
    const lastProductRef = useCallback(node => {
        if (loading || loadingMore) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prev => prev + 1);
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, loadingMore, hasMore]);

    const nextCursorRef = useRef(null);
    const LIMIT = 20;

    const fetchInventoryData = async (productIds) => {
        if (!productIds.length) return {};
        const invData = {};
        try {
            for (let i = 0; i < productIds.length; i += 30) {
                const chunk = productIds.slice(i, i + 30);
                const q = query(collection(db, 'inventory'), where('__name__', 'in', chunk));
                const snap = await getDocs(q);
                snap.docs.forEach(d => {
                    invData[d.id] = d.data();
                });
            }
        } catch (e) {
            console.error("Failed to fetch inventory mapping", e);
        }
        return invData;
    };

    const activeSubs = useRef(new Map());
    
    useEffect(() => {
        return () => {
            activeSubs.current.forEach(unsub => unsub());
            activeSubs.current.clear();
        };
    }, []);

    const fetchInventoryForProducts = async (productIds, pageNum) => {
        if (!productIds || productIds.length === 0) return;
        
        const cacheKey = `dashboard_inventory_p${pageNum}`;
        
        // 1. Try LKG cache immediately
        try {
            const cachedInv = await StorageEngine.get(cacheKey);
            if (cachedInv && typeof cachedInv === 'object') {
                setInventoryData(prev => ({ ...prev, ...cachedInv }));
            }
        } catch (e) {}

        // 2. Background revalidate from Firestore
        try {
            const fetchedInv = await fetchInventoryData(productIds);
            if (fetchedInv && Object.keys(fetchedInv).length > 0) {
                // Check if it actually changed
                setInventoryData(prev => {
                    const merged = { ...prev, ...fetchedInv };
                    return merged;
                });
                await StorageEngine.set(cacheKey, fetchedInv);
            }
        } catch (e) {
            console.warn(`[Inventory] Failed to fetch inventory for page ${pageNum}, keeping LKG.`);
        }
    };

    const loadPage = (pageNum, isInitial = false) => {
        if (isInitial) {
            startLoading();
            if (products.length === 0) setLoading(true);
            nextCursorRef.current = null;
            activeSubs.current.forEach(unsub => unsub());
            activeSubs.current.clear();
        } else {
            setLoadingMore(true);
        }

        const currentCursor = isInitial ? null : nextCursorRef.current;
        
        const unsub = productRepository.subscribeToPaginatedSWR(
            {}, pageNum, LIMIT, currentCursor,
            (response) => {
                const newProducts = response?.products || [];
                
                if (!activeSubs.current.has(pageNum)) {
                    nextCursorRef.current = response?.nextCursor || null;
                    setHasMore(response?.hasMore || false);
                }

                setProducts(prev => {
                    if (isInitial && prev.length === 0) return newProducts;
                    
                    const newMap = new Map(newProducts.map(p => [p.id, p]));
                    const finalArray = [];
                    const added = new Set();
                    
                    prev.forEach(p => {
                        if (newMap.has(p.id)) {
                            finalArray.push(newMap.get(p.id));
                            added.add(p.id);
                        } else {
                            finalArray.push(p);
                            added.add(p.id);
                        }
                    });
                    
                    newProducts.forEach(p => {
                        if (!added.has(p.id)) {
                            finalArray.push(p);
                            added.add(p.id);
                        }
                    });
                    
                    return finalArray;
                });

                // Trigger inventory fetch for these products
                fetchInventoryForProducts(newProducts.map(p => p.id), pageNum);

                if (isInitial) {
                    setLoading(false);
                    stopLoading();
                } else {
                    setLoadingMore(false);
                }
            }
        );
        
        activeSubs.current.set(pageNum, unsub);
    };

    useEffect(() => {
        loadPage(page, page === 0);
    }, [page]);

    const handleEnableTracking = async (productId) => {
        startLoading();
        try {
            const { ConnectivityService } = await import('../../../shared/connectivity/ConnectivityService.js');
            await ConnectivityService.getInstance().requireOnline();

            const ref = doc(db, 'inventory', productId);
            await setDoc(ref, {
                productId,
                stock: 0,
                reserved: 0,
                available: 0,
                updated_at: new Date().toISOString()
            });
            setInventoryData(prev => ({
                ...prev,
                [productId]: { productId, stock: 0, reserved: 0, available: 0 }
            }));
            Swal.fire({ icon: 'success', title: 'تم التفعيل', toast: true, position: 'top-end', showConfirmButton: false, timer: 2000, background: '#141414', color: '#fff' });
        } catch (error) {
            console.error(error);
            if (error.name === 'OfflineError') {
                Swal.fire({ icon: 'error', title: 'خطأ', text: error.message, background: '#141414', color: '#fff' });
            } else {
                Swal.fire({ icon: 'error', title: 'خطأ', text: 'فشل تفعيل المخزون', background: '#141414', color: '#fff' });
            }
        } finally {
            stopLoading();
        }
    };

    const handleUpdateStock = async (productId, newStock) => {
        if (newStock < 0) return;
        startLoading();
        try {
            const { ConnectivityService } = await import('../../../shared/connectivity/ConnectivityService.js');
            await ConnectivityService.getInstance().requireOnline();

            const ref = doc(db, 'inventory', productId);
            const currentData = inventoryData[productId] || { reserved: 0 };
            const available = newStock - (currentData.reserved || 0);
            
            await updateDoc(ref, {
                stock: newStock,
                available: available,
                updated_at: new Date().toISOString()
            });

            setInventoryData(prev => ({
                ...prev,
                [productId]: { ...prev[productId], stock: newStock, available: available }
            }));
        } catch (error) {
            console.error(error);
            if (error.name === 'OfflineError') {
                Swal.fire({ icon: 'error', title: 'خطأ', text: error.message, background: '#141414', color: '#fff' });
            } else {
                Swal.fire({ icon: 'error', title: 'خطأ', text: 'فشل تحديث المخزون', background: '#141414', color: '#fff' });
            }
        } finally {
            stopLoading();
        }
    };

    return (
        <div style={{ direction: 'rtl', padding: '10px' }}>
            <div style={{ marginBottom: isMobile ? '2rem' : '3rem' }}>
                <h1 style={{ fontSize: isMobile ? '1.8rem' : '2.8rem', fontWeight: '900', color: '#fff', marginBottom: '8px', letterSpacing: '-1.5px' }}>
                    إدارة المخزون <span style={{ color: 'var(--primary)', fontSize: isMobile ? '0.9rem' : '1.2rem', verticalAlign: 'middle', opacity: 0.8 }}>| لوحة التحكم</span>
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: isMobile ? '0.95rem' : '1.1rem' }}>التحكم في مخزون المنتجات وتفعيل تتبع الكميات.</p>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '120px 0', color: 'var(--primary)' }}>
                    <Loader2 className="animate-spin" style={{ margin: '0 auto 24px', width: '56px', height: '56px' }} />
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px', paddingBottom: '60px' }}>
                    <AnimatePresence>
                        {products.map((product, index) => {
                            const inv = inventoryData[product.id];
                            const isTracked = !!inv;
                            return (
                                <motion.div
                                    key={product.id}
                                    ref={products.length === index + 1 ? lastProductRef : null}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    style={{ borderRadius: '24px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
                                >
                                    <div style={{ display: 'flex', padding: '16px', gap: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <img src={product.imageUrl || (product.images && product.images[0])} alt={product.name} style={{ width: '80px', height: '80px', borderRadius: '12px', objectFit: 'cover' }} />
                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#fff', marginBottom: '4px' }}>{product.name}</h3>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>#{product.displayId || '---'}</span>
                                        </div>
                                    </div>
                                    <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                        {!isTracked ? (
                                            <div style={{ textAlign: 'center' }}>
                                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '15px' }}>تتبع المخزون غير مفعل</p>
                                                <button onClick={() => handleEnableTracking(product.id)} style={{ padding: '10px 20px', background: 'rgba(212, 175, 55, 0.1)', color: 'var(--primary)', border: '1px solid var(--primary)', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                                    <Package size={18} /> تفعيل التتبع
                                                </button>
                                            </div>
                                        ) : (
                                            <div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                                    <span style={{ color: 'var(--text-muted)' }}>الكمية المتوفرة:</span>
                                                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: inv.available > 0 ? '#10b981' : '#ef4444' }}>{inv.available}</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <button onClick={() => handleUpdateStock(product.id, inv.stock - 1)} disabled={inv.stock <= 0} style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', cursor: inv.stock <= 0 ? 'not-allowed' : 'pointer' }}><Minus size={18} /></button>
                                                    <input 
                                                        type="number" 
                                                        value={inv.stock}
                                                        onChange={(e) => handleUpdateStock(product.id, parseInt(e.target.value) || 0)}
                                                        style={{ flex: 1, height: '40px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '10px', color: '#fff', textAlign: 'center', fontSize: '1.1rem', fontWeight: 'bold' }}
                                                    />
                                                    <button onClick={() => handleUpdateStock(product.id, inv.stock + 1)} style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', cursor: 'pointer' }}><Plus size={18} /></button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}
            {loadingMore && <div style={{ textAlign: 'center', padding: '20px' }}><Loader2 className="animate-spin" style={{ margin: '0 auto', color: 'var(--primary)' }} /></div>}
            <style>{`.animate-spin { animation: spin 1s linear infinite; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

export default Inventory;
