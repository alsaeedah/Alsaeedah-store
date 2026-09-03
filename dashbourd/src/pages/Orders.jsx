import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useLoading } from '../context/LoadingContext';
import Swal from 'sweetalert2';
import { StorageEngine } from '../../../shared/storage/StorageEngine.js';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Download, Trash2, CheckCircle, XCircle, RotateCcw, Loader2, ShoppingCart, TrendingUp, Clock, Users as UsersIcon, Box, ShoppingBag, Printer } from 'lucide-react';
import InvoiceActionMenu from '../components/InvoiceActionMenu';
import { dashboardOrdersRepository } from '../services/DashboardOrdersRepository';
import { downloadInvoice } from '../services/invoice/invoiceDownload';
import { printInvoice } from '../services/invoice/invoicePrint';

const Orders = () => {

    const [orders, setOrders] = useState([]);
    const [selectedImage, setSelectedImage] = useState(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const { startLoading, stopLoading } = useLoading();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const location = useLocation();
    const [highlightOrderId, setHighlightOrderId] = useState(null);
    const [deletingOrderId, setDeletingOrderId] = useState(null);
    const [invoiceLoadingId, setInvoiceLoadingId] = useState(null);
    const orderRefs = useRef({});  // { [orderId]: DOM element }

    const lastDocRef = useRef(null);

        const cacheKey = dashboardOrdersRepository.buildCacheKey(statusFilter, searchQuery, page);
    const [pageStatus, setPageStatus] = useState('UNINITIALIZED');
    const [loadError, setLoadError] = useState(null);
    const [loadMoreError, setLoadMoreError] = useState(false);

    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const currentQueryRef = useRef({ statusFilter, searchQuery, page });

    useEffect(() => {
        let isMounted = true;
        let unsubscribe = () => {};
        
        const loadOrders = async () => {
            currentQueryRef.current = { statusFilter, searchQuery, page };
            const qRef = currentQueryRef.current;

            if (page === 0 && pageStatus !== 'STALE' && pageStatus !== 'READY') {
                setPageStatus('LOADING');
            }
            if (page > 0) {
                setLoadMoreError(false);
                setLoadingMore(true);
            }

            const cached = await dashboardOrdersRepository.getCachedOrders(cacheKey);
            
            if (!isMounted || currentQueryRef.current.statusFilter !== qRef.statusFilter || currentQueryRef.current.searchQuery !== qRef.searchQuery || currentQueryRef.current.page !== qRef.page) return;

            if (cached.status === 'READY') {
                if (page === 0) {
                    setOrders(cached.data);
                    if (cached.data.length === 0) {
                        setPageStatus('EMPTY');
                    } else {
                        setPageStatus('READY');
                    }
                } else {
                    setOrders(prev => {
                        const newMap = new Map(prev.map(o => [o.id, o]));
                        cached.data.forEach(o => newMap.set(o.id, o));
                        return Array.from(newMap.values()).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
                    });
                }
                setHasMore(cached.hasMore);
                setLoadingMore(false);
            }
            
            const validated = await dashboardOrdersRepository.revalidateOrders(
                cacheKey, statusFilter, searchQuery, page, lastDocRef.current, cached
            );

            if (!isMounted || currentQueryRef.current.statusFilter !== qRef.statusFilter || currentQueryRef.current.searchQuery !== qRef.searchQuery || currentQueryRef.current.page !== qRef.page) return;

            const handleValidatedData = (val) => {
                if (val.status === 'ERROR' || val.status === 'STALE') {
                    if (page === 0) {
                        setPageStatus(orders.length > 0 || (cached.data && cached.data.length > 0) ? 'STALE' : 'ERROR');
                        if (val.error) setLoadError(val.error);
                    } else {
                        setLoadingMore(false);
                        setLoadMoreError(true);
                    }
                    return;
                }

                if (val.status === 'EMPTY' && page === 0) {
                    setOrders([]);
                    setPageStatus('EMPTY');
                    setHasMore(false);
                    setLoadingMore(false);
                    return;
                }

                if (page === 0) {
                    setOrders(val.data);
                    setPageStatus('READY');
                } else {
                    setOrders(prev => {
                        const newMap = new Map(prev.map(o => [o.id, o]));
                        val.data.forEach(o => newMap.set(o.id, o));
                        return Array.from(newMap.values()).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
                    });
                }
                setHasMore(val.hasMore);
                if (val.lastDocRefObj) {
                    lastDocRef.current = val.lastDocRefObj;
                }
                setLoadingMore(false);
            };

            handleValidatedData(validated);
            
            unsubscribe = dashboardOrdersRepository.subscribe(
                cacheKey, statusFilter, searchQuery, page, lastDocRef.current, cached, (newValidated) => {
                    if (isMounted && currentQueryRef.current.statusFilter === qRef.statusFilter && currentQueryRef.current.searchQuery === qRef.searchQuery && currentQueryRef.current.page === qRef.page) {
                        handleValidatedData(newValidated);
                    }
                }
            );
        };

        loadOrders();

        return () => { 
            isMounted = false; 
            unsubscribe();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cacheKey, page, refreshTrigger]);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const hId = params.get('highlight');
        if (hId) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setHighlightOrderId(hId);
            window.history.replaceState({}, '', location.pathname);
        }
    }, [location.search, location.pathname]);

    useEffect(() => {
        if (!highlightOrderId || pageStatus === 'LOADING' || pageStatus === 'UNINITIALIZED') return;
        const el = orderRefs.current[highlightOrderId];
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => setHighlightOrderId(null), 3500);
        }
    }, [highlightOrderId, pageStatus, orders]);

    const observer = useRef();
    const lastOrderRef = useCallback(node => {
        if (loadingMore) return; 
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prev => prev + 1);
            }
        });
        if (node) observer.current.observe(node);
    }, [loadingMore, hasMore]);

    const fetchOrders = () => {
        if (orders.length === 0) {
            setPageStatus('LOADING');
        }
        setPage(0);
        lastDocRef.current = null;
        setLoadError(null);
        setRefreshTrigger(prev => prev + 1);
    };

    const handleFilterChange = (newFilter) => {
        if (newFilter === statusFilter) return;
        setStatusFilter(newFilter);
        setPage(0);
        lastDocRef.current = null;
        setLoadError(null);
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        setPage(0);
        lastDocRef.current = null;
        setLoadError(null);
    };

    const handleUpdateStatus = async (orderId, newStatus) => {
        try {
            const { ConnectivityService } = await import('../../../shared/connectivity/ConnectivityService.js');
            await ConnectivityService.getInstance().requireOnline();

            await dashboardOrdersRepository.updateOrderStatus(orderId, newStatus);
            
            if (statusFilter !== 'all' && statusFilter !== newStatus) {
                setOrders(prev => prev.filter(o => o.id !== orderId));
            } else {
                setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
            }

            Swal.fire({
                icon: 'success',
                title: 'تم التحديث',
                text: `تم تغيير حالة الطلب إلى ${newStatus === 'completed' ? 'مكتمل' : newStatus === 'cancelled' ? 'ملغي' : 'قيد الانتظار'}`,
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                background: '#141414',
                color: '#fff'
            });
        } catch (error) {
            console.error("Update status error:", error);
            Swal.fire({
                icon: 'error',
                title: 'خطأ',
                text: error.name === 'OfflineError' ? error.message : 'فشل تحديث حالة الطلب',
                background: '#141414',
                color: '#fff'
            });
        }
    };

    const handleDeleteOrder = async (orderId) => {
        if (deletingOrderId === orderId) return;
        setDeletingOrderId(orderId);

        const result = await Swal.fire({
            title: 'هل أنت متأكد؟',
            text: "لن تتمكن من استرجاع هذا الطلب!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'نعم، احذف الطلب',
            cancelButtonText: 'إلغاء',
            background: '#141414',
            color: '#fff'
        });

        if (result.isConfirmed) {
            startLoading();
            try {
                const { ConnectivityService } = await import('../../../shared/connectivity/ConnectivityService.js');
                await ConnectivityService.getInstance().requireOnline();

                const order = orders.find(o => o.id === orderId);
                if (order) {
                    const deleteResult = await dashboardOrdersRepository.deleteOrder(orderId, order.total_amount, order.status);
                    if (!deleteResult.success) {
                        throw deleteResult.error || new Error('Delete failed');
                    }
                }

                setOrders(prev => prev.filter(order => order.id !== orderId));
                Swal.fire({
                    title: 'تم الحذف!',
                    text: 'تم حذف الطلب بنجاح.',
                    icon: 'success',
                    background: '#141414',
                    color: '#fff'
                });
            } catch (error) {
                console.error("Delete error:", error);
                let errorMessage = 'فشل حذف الطلب';
                if (error.name === 'OfflineError') errorMessage = error.message;
                else if (error.code === 'permission-denied') errorMessage = 'ليس لديك صلاحية لحذف هذا الطلب.';
                else if (error.code === 'unavailable') errorMessage = 'لا يمكن الاتصال بقاعدة البيانات حالياً.';

                Swal.fire({
                    icon: 'error',
                    title: 'خطأ',
                    text: errorMessage,
                    background: '#141414',
                    color: '#fff'
                });
            } finally {
                stopLoading();
                setDeletingOrderId(null);
            }
        } else {
            setDeletingOrderId(null);
        }
    };

    const handleInvoiceProgress = (progress) => {
        if (!Swal.isVisible()) {
            Swal.fire({
                title: 'جاري تجهيز الفاتورة...',
                text: 'يرجى الانتظار...',
                allowOutsideClick: false,
                background: '#141414',
                color: '#fff',
                didOpen: () => {
                    Swal.showLoading();
                }
            });
        }
        
        let text = 'يرجى الانتظار...';
        if (progress.stage === 'rendering') {
            text = `تحضير الصفحة ${progress.currentPage} من ${progress.totalPages}`;
        } else if (progress.stage === 'saving') {
            text = 'جاري الحفظ...';
        }
        
        Swal.update({ text });
    };

    const handleDownloadInvoice = async (order, paymentType) => {
        setInvoiceLoadingId({ id: order.id, action: 'download' });
        try {
            const result = await downloadInvoice(order, paymentType, handleInvoiceProgress);
            Swal.close();
            if (result && result.message) {
                Swal.fire({
                    icon: 'success',
                    title: 'تم الحفظ',
                    text: result.message,
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000,
                    background: '#141414',
                    color: '#fff'
                });
            }
        } catch (error) {
            Swal.close();
            Swal.fire({ icon: 'error', title: 'خطأ', text: error.message || 'فشل تحميل الفاتورة', background: '#141414', color: '#fff' });
        } finally {
            setInvoiceLoadingId(null);
        }
    };

    const handlePrintInvoice = async (order, paymentType) => {
        setInvoiceLoadingId({ id: order.id, action: 'print' });
        try {
            await printInvoice(order, paymentType, handleInvoiceProgress);
            Swal.close();
        } catch (error) {
            Swal.close();
            Swal.fire({ icon: 'error', title: 'خطأ', text: error.message || 'فشل طباعة الفاتورة', background: '#141414', color: '#fff' });
        } finally {
            setInvoiceLoadingId(null);
        }
    };

    const pendingCount = orders.filter(o => o.status === 'pending').length;
    const completedCount = orders.filter(o => o.status === 'completed').length;
    const totalRevenue = orders.filter(o => o.status === 'completed').reduce((acc, o) => acc + (Number(o.total_amount) || 0), 0);

    return (
        <div style={{ direction: 'rtl', padding: '10px' }}>
            <div style={{ marginBottom: isMobile ? '2rem' : '3rem' }}>
                <h1 style={{ 
                    fontSize: isMobile ? '1.8rem' : '2.8rem', 
                    fontWeight: '900', 
                    color: '#fff', 
                    marginBottom: '8px', 
                    letterSpacing: '-1.5px' 
                }}>
                    إدارة الطلبات <span style={{ color: 'var(--primary)', fontSize: isMobile ? '0.9rem' : '1.2rem', verticalAlign: 'middle', opacity: 0.8 }}>| مركز العمليات</span>
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: isMobile ? '0.95rem' : '1.1rem' }}>تتبع، تنظيم، وإصدار فواتير عملاء متجر السعيدة.</p>
            </div>

            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(220px, 1fr))', 
                gap: isMobile ? '12px' : '20px', 
                marginBottom: isMobile ? '2rem' : '3rem' 
            }}>
                {[
                    { label: 'بانتظار المعالجة', value: `${pendingCount} طلب`, icon: <ShoppingCart size={isMobile ? 18 : 22} />, color: 'var(--primary)', bg: 'rgba(212, 175, 55, 0.15)', delay: 0.1 },
                    { label: 'طلبات مكتملة', value: `${completedCount} طلب`, icon: <CheckCircle size={isMobile ? 18 : 22} />, color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', delay: 0.2 },
                    { label: 'الإجمالي الحالي', value: `${totalRevenue.toLocaleString()} ر.س`, icon: <TrendingUp size={isMobile ? 18 : 22} />, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', delay: 0.3 }
                ].map((stat, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: stat.delay }}
                        style={{ 
                            padding: isMobile ? '16px' : '20px', 
                            borderRadius: '20px', 
                            background: 'rgba(255,255,255,0.02)', 
                            border: '1px solid var(--border-color)', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: isMobile ? '12px' : '15px' 
                        }}>
                        <div style={{ 
                            width: isMobile ? '40px' : '45px', 
                            height: isMobile ? '40px' : '45px', 
                            borderRadius: '12px', 
                            background: stat.bg, 
                            color: stat.color, 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            flexShrink: 0
                        }}>
                            {stat.icon}
                        </div>
                        <div>
                            <p style={{ fontSize: isMobile ? '0.7rem' : '0.85rem', color: 'var(--text-muted)', marginBottom: '2px' }}>{stat.label}</p>
                            <h4 style={{ fontSize: isMobile ? '1.1rem' : '1.4rem', fontWeight: '800', color: '#fff' }}>{stat.value}</h4>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div style={{ 
                padding: isMobile ? '16px' : '24px', 
                marginBottom: '40px', 
                display: 'flex', 
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: 'space-between', 
                gap: '20px', 
                alignItems: isMobile ? 'stretch' : 'center', 
                background: 'rgba(255,255,255,0.03)', 
                borderRadius: '24px', 
                backdropFilter: 'blur(10px)', 
                border: '1px solid var(--border-color)' 
            }}>
                <div style={{ position: 'relative', minWidth: isMobile ? '100%' : '320px', flex: 1.5 }}>
                    <Search size={18} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.7 }} />
                    <input type="text" placeholder="البحث برقم الطلب، الاسم، الواتساب..." value={searchQuery} onChange={handleSearchChange} style={{ width: '100%', padding: '12px 48px 12px 16px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '14px', color: '#fff', fontSize: '0.95rem', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', overflowX: 'auto', paddingBottom: isMobile ? '5px' : '0' }}>
                    <button onClick={fetchOrders} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem', whiteSpace: 'nowrap' }}><RotateCcw size={16} /> تحديث</button>
                    {[{ label: 'الجميع', value: 'all' }, { label: 'انتظار', value: 'pending' }, { label: 'مكتمل', value: 'completed' }, { label: 'ملغي', value: 'cancelled' }].map(status => (
                        <button key={status.value} onClick={() => handleFilterChange(status.value)} style={{ padding: '8px 16px', borderRadius: '10px', border: '1px solid', borderColor: statusFilter === status.value ? 'var(--primary)' : 'rgba(255,255,255,0.05)', background: statusFilter === status.value ? 'var(--primary)' : 'rgba(255,255,255,0.02)', color: statusFilter === status.value ? '#000' : 'var(--text-muted)', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{status.label}</button>
                    ))}
                </div>
            </div>

            {pageStatus === 'LOADING' || pageStatus === 'UNINITIALIZED' ? (
                <div style={{ textAlign: 'center', padding: '100px', color: 'var(--primary)' }}><Loader2 className="animate-spin" style={{ margin: '0 auto 20px', width: '50px', height: '50px' }} /><p style={{ fontWeight: '700' }}>جاري تحميل البيانات الفاخرة...</p></div>
            ) : pageStatus === 'ERROR' ? (
                <div style={{ textAlign: 'center', padding: '100px', color: '#ef4444' }}>
                    <XCircle size={60} style={{ margin: '0 auto 20px', display: 'block' }} />
                    <p style={{ fontWeight: '700', fontSize: '1.2rem', marginBottom: '10px' }}>تعذر تحميل الطلبات</p>
                    <p style={{ marginBottom: '20px', color: 'var(--text-muted)' }}>{loadError?.message || 'تحقق من الاتصال وحاول مرة أخرى'}</p>
                    <button onClick={fetchOrders} style={{ padding: '10px 20px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}>إعادة المحاولة</button>
                </div>
            ) : pageStatus === 'EMPTY' ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '100px', opacity: 0.5 }}><ShoppingBag size={80} style={{ margin: '0 auto 20px', display: 'block', opacity: 0.2 }} /><p style={{ fontSize: '1.2rem' }}>لا توجد طلبات متوافقة مع هذا البحث</p></motion.div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', paddingBottom: '50px' }}>
                    {pageStatus === 'STALE' && (
                        <div style={{ padding: '12px 20px', background: 'rgba(234, 179, 8, 0.1)', color: '#eab308', border: '1px solid rgba(234, 179, 8, 0.2)', borderRadius: '12px', textAlign: 'center', fontWeight: 'bold', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <XCircle size={18} /> أنت في وضع عدم الاتصال. يتم عرض البيانات المخزنة مؤقتاً.
                        </div>
                    )}
                    <AnimatePresence mode="popLayout">
                        {orders.map((order, index) => (
                            <OrderCard 
                                key={order.id} 
                                order={order} 
                                lastOrderRef={orders.length === index + 1 ? lastOrderRef : null} 
                                onUpdateStatus={handleUpdateStatus} 
                                onDelete={handleDeleteOrder} 
                                    onDownloadInvoice={handleDownloadInvoice} 
                                    onPrintInvoice={handlePrintInvoice}
                                    isInvoiceLoading={invoiceLoadingId?.id === order.id}
                                    invoiceAction={invoiceLoadingId?.id === order.id ? invoiceLoadingId.action : null} 
                                    onImageClick={setSelectedImage}
                                    isHighlighted={highlightOrderId === order.id}
                                    isDeleting={deletingOrderId === order.id}
                                    setRef={(el) => { if (el) orderRefs.current[order.id] = el; }}
                                />
                            ))}
                    </AnimatePresence>
                    {loadingMore && <div style={{ textAlign: 'center', padding: '20px' }}><Loader2 className="animate-spin" style={{ width: '40px', height: '40px', color: 'var(--primary)', margin: '0 auto' }} /></div>}
                    {loadMoreError && (
                        <div style={{ textAlign: 'center', padding: '20px' }}>
                            <p style={{ color: '#ef4444', fontSize: '0.9rem', marginBottom: '10px' }}>فشل تحميل المزيد من الطلبات</p>
                            <button onClick={() => setPage(prev => prev)} style={{ padding: '6px 14px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '700' }}>إعادة المحاولة</button>
                        </div>
                    )}
                </div>
            )}
            <ImagePreviewModal imageUrl={selectedImage} onClose={() => setSelectedImage(null)} />
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } .animate-spin { animation: spin 1s linear infinite; }`}</style>
        </div>
    );
};

const ImagePreviewModal = ({ imageUrl, onClose }) => {
    if (typeof window === 'undefined') return null;
    
    return createPortal(
        <AnimatePresence>
            {imageUrl && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.85)',
                        backdropFilter: 'blur(8px)',
                        zIndex: 99999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '20px',
                        cursor: 'zoom-out'
                    }}
                >
                    <motion.img
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        src={imageUrl}
                        style={{
                            maxWidth: '100%',
                            width: 'auto',
                            maxHeight: '75vh',
                            objectFit: 'contain',
                            borderRadius: '16px',
                            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                            border: '2px solid rgba(212, 175, 55, 0.3)',
                            background: '#0a0a0a'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    />
                    <button 
                        onClick={onClose}
                        style={{
                            position: 'absolute',
                            top: '25px',
                            right: '25px',
                            background: 'rgba(20,20,20,0.8)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            color: '#fff',
                            width: '45px',
                            height: '45px',
                            borderRadius: '50%',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.3s'
                        }}
                    >
                        <XCircle size={28} />
                    </button>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};

const OrderCard = ({ order, lastOrderRef, onUpdateStatus, onDelete, onDownloadInvoice, onPrintInvoice, isInvoiceLoading, invoiceAction, onImageClick, isHighlighted, isDeleting, setRef }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [invoiceType, setInvoiceType] = useState('cash');
    const isMobile = window.innerWidth < 768;
    const items = Array.isArray(order.items) ? order.items : [];
    const visibleItems = isExpanded ? items : items.slice(0, 2);
    const hasMoreItems = items.length > 2;

    // Parse address from JSONB or string
    const addressData = order.customer_address;
    const addressStr = addressData
        ? (typeof addressData === 'object'
            ? [addressData.governorate, addressData.district, addressData.neighborhood].filter(Boolean).join(' • ')
            : String(addressData))
        : 'غير محدد';

    return (
        <motion.div
            ref={(el) => { if (lastOrderRef) lastOrderRef(el); if (setRef) setRef(el); }}
            layout
            initial={{ opacity: 0, scale: 0.98, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{
                borderRadius: '24px',
                background: 'rgba(255,255,255,0.02)',
                border: isHighlighted ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                overflow: 'hidden',
                boxShadow: isHighlighted
                    ? '0 0 30px rgba(212, 175, 55, 0.4), 0 10px 30px rgba(0,0,0,0.1)'
                    : '0 10px 30px rgba(0,0,0,0.1)',
                transition: 'border 0.4s ease, box-shadow 0.4s ease',
            }}
        >
            <div style={{ 
                padding: isMobile ? '12px 16px' : '20px 30px', 
                background: 'rgba(255,255,255,0.02)', 
                borderBottom: '1px solid var(--border-color)', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                flexDirection: 'row',
                gap: '10px' 
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '20px' }}>
                    <div style={{ padding: '6px 12px', background: 'rgba(212, 175, 55, 0.1)', borderRadius: '10px', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
                        <span style={{ fontSize: isMobile ? '0.85rem' : '1.1rem', fontWeight: '900', color: 'var(--primary)', letterSpacing: '0.5px' }}>ORD{order.order_number}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: isMobile ? '0.7rem' : '0.9rem' }}>
                        <Clock size={14} />{new Date(order.created_at).toLocaleString('ar-EG', { dateStyle: isMobile ? 'short' : 'medium', timeStyle: 'short' })}
                    </div>
                </div>
                <span style={{ 
                    padding: isMobile ? '4px 10px' : '6px 14px', 
                    borderRadius: '8px', 
                    fontSize: isMobile ? '0.65rem' : '0.75rem', 
                    fontWeight: '900', 
                    background: order.status === 'completed' ? 'rgba(34, 197, 94, 0.1)' : order.status === 'cancelled' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(234, 179, 8, 0.1)', 
                    color: order.status === 'completed' ? '#22c55e' : order.status === 'cancelled' ? '#ef4444' : '#eab308',
                    whiteSpace: 'nowrap'
                }}>
                    {order.status === 'completed' ? 'مكتمل' : order.status === 'cancelled' ? 'ملغي' : 'بانتظار'}
                </span>
            </div>
            <div style={{ padding: isMobile ? '16px' : '30px', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(280px, 1fr))', gap: isMobile ? '24px' : '40px' }}>
                <div>
                    <h4 style={{ fontSize: isMobile ? '0.95rem' : '1.1rem', color: '#fff', marginBottom: '14px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}><UsersIcon size={16} color="var(--primary)" /> بيانات العميـل</h4>
                    <div style={{ fontSize: isMobile ? '0.85rem' : '1rem', lineHeight: '1.8', color: 'var(--text-secondary)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '4px', marginBottom: '4px' }}><span>الاسم الكامل:</span><span style={{ fontWeight: '700', color: '#fff' }}>{order.customer_name || '---'}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '4px', marginBottom: '4px' }}><span>الواتسـاب:</span><span style={{ fontWeight: '700', color: 'var(--primary)' }}>{order.customer_phone || '---'}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>العنوان:</span><span style={{ fontWeight: '700', color: '#fff', textAlign: 'left', maxWidth: '60%' }}>{addressStr}</span></div>
                    </div>
                </div>
                <div>
                    <h4 style={{ fontSize: isMobile ? '0.95rem' : '1.1rem', color: '#fff', marginBottom: '14px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}><Box size={16} color="var(--primary)" /> تفاصيل الشراء</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <AnimatePresence>
                            {visibleItems.map((item, idx) => (
                                <motion.div key={idx} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ padding: '8px 10px', background: 'rgba(255,255,255,0.01)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', overflow: 'hidden' }}>
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                        <motion.img 
                                            src={item.image || item.imageUrl || (item.images && item.images[0]) || (item.variants && item.variants[0]?.image)} 
                                            onClick={() => onImageClick(item.image || item.imageUrl || (item.images && item.images[0]) || (item.variants && item.variants[0]?.image))}
                                            style={{ 
                                                width: isMobile ? '40px' : '50px', 
                                                height: isMobile ? '40px' : '50px', 
                                                borderRadius: '8px', 
                                                objectFit: 'cover',
                                                cursor: 'zoom-in'
                                            }} 
                                            whileHover={{ scale: 1.15, zIndex: 1 }}
                                            transition={{ type: 'spring', stiffness: 300 }}
                                        />
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontSize: isMobile ? '0.8rem' : '0.9rem', fontWeight: '700', color: '#fff' }}>{item.name || item.title}</span>
                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{item.displayId ? `#${item.displayId}` : 'ساعة راقية'}</span>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'left' }}><span style={{ fontSize: '0.85rem', fontWeight: '900', color: 'var(--primary)' }}>{item.dp_qty || item.quantity} ×</span><br/><span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{item.price.toLocaleString()}</span></div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        {hasMoreItems && (
                            <button onClick={() => setIsExpanded(!isExpanded)} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', textAlign: 'right', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                {isExpanded ? 'عرض أقل' : `+ ${items.length - 2} قطع أخرى`} <span>▼</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
            <div style={{ 
                padding: isMobile ? '16px' : '24px 30px', 
                background: 'rgba(212, 175, 55, 0.03)', 
                borderTop: '1px solid var(--border-color)', 
                display: 'flex', 
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: 'space-between', 
                alignItems: isMobile ? 'stretch' : 'center', 
                gap: isMobile ? '12px' : '20px' 
            }}>
                <div style={{ 
                    display: 'flex', 
                    gap: isMobile ? '10px' : '30px',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: isMobile ? 'rgba(255,255,255,0.02)' : 'transparent',
                    padding: isMobile ? '10px 12px' : '0',
                    borderRadius: isMobile ? '12px' : '0',
                    border: isMobile ? '1px solid rgba(255,255,255,0.05)' : 'none'
                }}>
                    <div>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '2px' }}>الدفع</p>
                        <p style={{ fontSize: isMobile ? '0.85rem' : '0.9rem', fontWeight: '800', color: '#fff' }}>{order.payment_method === 'cash_on_delivery' ? 'كاش' : order.payment_method}</p>
                    </div>
                    <div style={{ borderRight: isMobile ? '1px solid rgba(255,255,255,0.1)' : '1px solid var(--border-color)', paddingRight: isMobile ? '10px' : '30px', textAlign: 'left' }}>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '2px' }}>الإجمالـي</p>
                        <p style={{ fontSize: isMobile ? '1.1rem' : '1.6rem', fontWeight: '900', color: 'var(--primary)' }}>{Number(order.total_amount).toLocaleString()} <span style={{ fontSize: '0.75rem' }}>ر.س</span></p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: isMobile ? '6px' : '10px', flexDirection: isMobile ? 'column' : 'row', width: isMobile ? '100%' : 'auto' }}>
                    <div style={{ display: 'flex', gap: '6px', flexDirection: isMobile ? 'column' : 'row', flex: isMobile ? 1 : 'none' }}>
                        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '4px', gap: '4px', height: isMobile ? '38px' : '44px' }}>
                            <button
                                onClick={() => setInvoiceType('cash')}
                                style={{ flex: 1, border: 'none', borderRadius: '8px', background: invoiceType === 'cash' ? 'var(--primary)' : 'transparent', color: invoiceType === 'cash' ? '#000' : 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: isMobile ? '0.7rem' : '0.85rem', fontWeight: invoiceType === 'cash' ? '800' : '600', transition: 'all 0.2s', padding: isMobile ? '0 10px' : '0 16px' }}
                            >
                                نقد
                            </button>
                            <button
                                onClick={() => setInvoiceType('credit')}
                                style={{ flex: 1, border: 'none', borderRadius: '8px', background: invoiceType === 'credit' ? 'var(--primary)' : 'transparent', color: invoiceType === 'credit' ? '#000' : 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: isMobile ? '0.7rem' : '0.85rem', fontWeight: invoiceType === 'credit' ? '800' : '600', transition: 'all 0.2s', padding: isMobile ? '0 10px' : '0 16px' }}
                            >
                                أجل
                            </button>
                        </div>
                        <InvoiceActionMenu 
                            order={order}
                            invoiceType={invoiceType}
                            onDownloadInvoice={onDownloadInvoice}
                            onPrintInvoice={onPrintInvoice}
                            isInvoiceLoading={isInvoiceLoading}
                            invoiceAction={invoiceAction}
                            isMobile={isMobile}
                        />
                    </div>
                    
                    <div style={{ display: 'flex', gap: isMobile ? '6px' : '10px', flexDirection: 'row', width: isMobile ? '100%' : 'auto', flexWrap: 'nowrap', flex: isMobile ? 1 : 'none' }}>
                    {order.status === 'pending' ? (
                        <>
                            <motion.button 
                                whileHover={{ scale: 1.02 }} 
                                whileTap={{ scale: 0.98 }} 
                                onClick={() => onUpdateStatus(order.id, 'completed')} 
                                style={{ flex: 1, padding: isMobile ? '0 6px' : '0 15px', height: isMobile ? '38px' : '44px', borderRadius: '12px', background: 'var(--primary)', color: '#000', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: isMobile ? '4px' : '8px', fontSize: isMobile ? '0.75rem' : '0.85rem', fontWeight: '800', whiteSpace: 'nowrap', boxShadow: '0 4px 15px rgba(212, 175, 55, 0.2)' }}>
                                <CheckCircle size={isMobile ? 14 : 18} /> إتمام
                            </motion.button>
                            <motion.button 
                                whileHover={{ scale: 1.05, background: '#ef4444', color: '#fff' }} 
                                whileTap={{ scale: 0.95 }} 
                                onClick={() => onUpdateStatus(order.id, 'cancelled')} 
                                title="إلغاء الطلب"
                                style={{ width: isMobile ? '38px' : '44px', height: isMobile ? '38px' : '44px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <XCircle size={isMobile ? 14 : 18} />
                            </motion.button>
                        </>
                    ) : (
                        <motion.button 
                            whileHover={{ scale: 1.02 }} 
                            whileTap={{ scale: 0.98 }} 
                            onClick={() => onUpdateStatus(order.id, 'pending')} 
                            style={{ flex: 1, padding: isMobile ? '0 6px' : '0 15px', height: isMobile ? '38px' : '44px', borderRadius: '12px', background: 'rgba(234, 179, 8, 0.1)', color: '#eab308', border: '1px solid rgba(234, 179, 8, 0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: isMobile ? '4px' : '8px', fontSize: isMobile ? '0.7rem' : '0.85rem', fontWeight: '700', whiteSpace: 'nowrap' }}>
                            <RotateCcw size={isMobile ? 14 : 16} /> تراجع
                        </motion.button>
                    )}
                    
                    <motion.button 
                        whileHover={isDeleting ? {} : { scale: 1.05, background: '#ef4444', color: '#fff' }} 
                        whileTap={isDeleting ? {} : { scale: 0.95 }} 
                        onClick={() => !isDeleting && onDelete(order.id)} 
                        disabled={isDeleting}
                        title="حذف نهائي"
                        style={{ width: isMobile ? '38px' : '44px', height: isMobile ? '38px' : '44px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', color: 'var(--text-dim)', border: '1px solid var(--border-color)', cursor: isDeleting ? 'not-allowed' : 'pointer', opacity: isDeleting ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {isDeleting ? <Loader2 className="animate-spin" size={isMobile ? 14 : 16} /> : <Trash2 size={isMobile ? 14 : 16} />}
                    </motion.button>
                </div>
            </div>
        </div>
        </motion.div>
    );
};

export default Orders;

