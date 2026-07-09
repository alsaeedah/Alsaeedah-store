
import React, { useState, useEffect } from 'react';
import { useLoading } from '../context/LoadingContext';
import { supabase } from '../supabase/client';
import { deleteFromCloudinary } from '../utils/cloudinary';
import Swal from 'sweetalert2';
import ProductForm from '../components/ProductForm';
import { useParams, useNavigate } from 'react-router-dom';

const EditProduct = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { startLoading, stopLoading } = useLoading();
    const [initialData, setInitialData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const { data, error } = await supabase
                    .from('products')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error) throw error;

                if (data) {
                    setInitialData(data);
                } else {
                    Swal.fire({ icon: 'error', title: 'خطأ', text: 'المنتج غير موجود', background: '#141414', color: '#fff' });
                    navigate('/products');
                }
            } catch (error) {
                console.error(error);
                Swal.fire({ icon: 'error', title: 'خطأ', text: 'حدث خطأ أثناء تحميل البيانات', background: '#141414', color: '#fff' });
                navigate('/products');
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

            const { error } = await supabase
                .from('products')
                .update({
                    displayId: Number(formData.displayId),
                    name: formData.name,
                    price: formData.price,
                    old_price: formData.old_price || null,
                    category: formData.category,
                    style: formData.style,
                    description: formData.description,
                    video: formData.video,
                    imageUrl: formData.imageUrl,
                    images: formData.images || [],
                    colors: formData.colors || [],
                    materials: formData.materials || [],
                    variants: formData.variants || []
                })
                .eq('id', id);

            if (error) throw error;

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
            Swal.fire({ icon: 'error', title: 'خطأ', text: 'حدث خطأ أثناء التحديث', background: '#141414', color: '#fff' });
        } finally {
            stopLoading();
        }
    };


    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '100px', color: 'var(--primary)' }}>
                <div className="loader" style={{ margin: '0 auto 20px', width: '40px', height: '40px', border: '3px solid var(--glass-border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <p style={{ fontWeight: '600' }}>جاري تحميل البيانات...</p>
                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <ProductForm
            initialData={initialData}
            onSubmit={handleSubmit}
            title="تعديل الساعة"
            subTitle="يمكنك تعديل أي من التفاصيل أدناه"
        />
    );
};

export default EditProduct;
