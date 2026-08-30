
import React, { useState, useEffect } from 'react';
import { useLoading } from '../context/LoadingContext';
import { productRepository } from '../services/productService';
import { deleteFromCloudinary } from '../utils/cloudinary';
import Swal from 'sweetalert2';
import ProductForm from '../components/ProductForm';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const EditProduct = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { startLoading, stopLoading } = useLoading();
    const [initialData, setInitialData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [errorState, setErrorState] = useState(null);

    useEffect(() => {
        const fetchProduct = async () => {
            if (!id) {
                setErrorState('invalid-id');
                setLoading(false);
                return;
            }

            try {
                const product = await productRepository.getById(id);

                if (product) {
                    setInitialData(product);
                } else {
                    setErrorState('not-found');
                }
            } catch (error) {
                console.error(error);
                setErrorState('network');
            } finally {
                setLoading(false);
                stopLoading();
            }
        };
        startLoading();
        fetchProduct();
    }, [id, navigate]);

    const handleSubmit = async (formData) => {
        Swal.fire({
            title: 'جاري الحفظ...',
            html: 'جاري تحديث بيانات المنتج...',
            background: '#141414',
            color: '#fff',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        startLoading();

        try {
            // ── Delete removed media from Cloudinary ──────────────────────────────
            if (initialData) {
                // Collect all old Cloudinary image URLs
                const oldImages = new Set([
                    ...(initialData.images || []),
                    initialData.imageUrl
                ].filter(Boolean).filter(u => u.includes('cloudinary')));

                // Collect all new image URLs
                const newImages = new Set([
                    ...(formData.images || []),
                    formData.imageUrl
                ].filter(Boolean));

                // Delete images that existed before but are gone now
                for (const oldImg of oldImages) {
                    if (!newImages.has(oldImg)) {
                        await deleteFromCloudinary(oldImg, 'image');
                    }
                }

                // Delete old Cloudinary video if it was replaced or removed
                const oldVideo = initialData.video;
                const newVideo = formData.video;
                if (
                    oldVideo &&
                    oldVideo.includes('cloudinary') &&
                    oldVideo !== newVideo
                ) {
                    await deleteFromCloudinary(oldVideo, 'video');
                }
            }
            // ─────────────────────────────────────────────────────────────────────

            await productRepository.update(id, {
                displayId: Number(formData.displayId),
                name: formData.name,
                price: formData.price,
                old_price: formData.old_price || null,
                categoryId: formData.categoryId || null,
                brandId: formData.brandId || null,
                collectionId: formData.collectionId || null,
                genderId: formData.genderId || null,
                category: formData.category || '',
                style: formData.style || '',
                description: formData.description,
                video: formData.video,
                imageUrl: formData.imageUrl,
                images: formData.images || [],
                colors: formData.colors || [],
                materials: formData.materials || [],
                variants: formData.variants || [],
                updated_at: new Date().toISOString()
            });

            await Swal.fire({
                icon: 'success',
                title: 'تم بنجاح',
                text: 'تم تحديث البيانات في قاعدة البيانات',
                background: '#141414',
                color: '#fff',
                confirmButtonColor: 'var(--primary)'
            });
            navigate('/products');
        } catch (error) {
            console.error(error);
            if (error.name === 'OfflineError') {
                Swal.fire({ icon: 'error', title: 'خطأ', text: error.message, background: '#141414', color: '#fff' });
                return;
            }
            Swal.fire({ icon: 'error', title: 'خطأ', text: 'حدث خطأ أثناء التحديث', background: '#141414', color: '#fff' });
        } finally {
            stopLoading();
        }
    };


    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '100px', color: 'var(--primary)' }}>
                <div className="loader" style={{ margin: '0 auto 20px', width: '40px', height: '40px', border: '3px solid var(--glass-border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <p style={{ fontWeight: '600' }}>جاري تحميل بيانات المنتج...</p>
                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (errorState) {
        let message = '';
        if (errorState === 'invalid-id') message = 'تعذر تحديد المنتج المطلوب تعديله.';
        else if (errorState === 'not-found') message = 'المنتج غير موجود أو تم حذفه.';
        else if (errorState === 'network') message = 'تعذر تحميل بيانات المنتج.';

        return (
            <div style={{ textAlign: 'center', padding: '100px', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '3rem', marginBottom: '20px' }}>⚠️</div>
                <h2 style={{ color: '#fff', marginBottom: '10px' }}>خطأ</h2>
                <p style={{ marginBottom: '30px', fontSize: '1.2rem' }}>{message}</p>
                <button
                    onClick={() => navigate('/products')}
                    className="btn-primary"
                    style={{ padding: '12px 24px', display: 'inline-flex', alignItems: 'center', gap: '10px' }}
                >
                    <ArrowRight size={20} />
                    العودة إلى المنتجات
                </button>
            </div>
        );
    }

    return (
        <ProductForm
            key={id}
            initialData={initialData}
            onSubmit={handleSubmit}
            title="تعديل الساعة"
            subTitle="يمكنك تعديل أي من التفاصيل أدناه"
        />
    );
};

export default EditProduct;
