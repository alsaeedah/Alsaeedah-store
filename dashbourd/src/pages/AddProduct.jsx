
import React from 'react';
import { useLoading } from '../context/LoadingContext';
import { productRepository } from '../services/productService';
import Swal from 'sweetalert2';
import ProductForm from '../components/ProductForm';
import { useNavigate } from 'react-router-dom';
import { normalizeProductPrice, isValidPrice } from 'shared/product';

const AddProduct = () => {
    const navigate = useNavigate();
    const { startLoading, stopLoading } = useLoading();

    const handleSubmit = async (formData) => {
        Swal.fire({
            title: 'جاري الحفظ...',
            html: 'جاري إضافة المنتج الجديد...',
            background: '#141414',
            color: '#fff',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        startLoading();

        try {
            // ── Price normalization (UI-layer defense) ────────────────────────────
            // The repository will also enforce this, but we surface a clear error
            // to the user here rather than letting it propagate as an uncaught throw.
            const normalizedPrice = normalizeProductPrice(formData.price);
            if (!isValidPrice(normalizedPrice)) {
                Swal.fire({
                    icon: 'warning',
                    title: 'سعر غير صالح',
                    text: 'يرجى إدخال سعر صحيح (رقم موجب).',
                    background: '#141414',
                    color: '#fff',
                    confirmButtonColor: 'var(--primary)'
                });
                return;
            }

            const normalizedOldPrice = formData.old_price ? normalizeProductPrice(formData.old_price) : null;
            if (formData.old_price && !isValidPrice(normalizedOldPrice)) {
                Swal.fire({
                    icon: 'warning',
                    title: 'السعر السابق غير صالح',
                    text: 'يرجى إدخال سعر سابق صحيح أو اتركه فارغاً.',
                    background: '#141414',
                    color: '#fff',
                    confirmButtonColor: 'var(--primary)'
                });
                return;
            }

            const normalizedVariants = (formData.variants || []).map((v, i) => ({
                ...v,
                price: v.price !== undefined && v.price !== null && v.price !== ''
                    ? normalizeProductPrice(v.price)
                    : v.price
            }));
            // ─────────────────────────────────────────────────────────────────────

            // Calculate random display ID or leave for DB to handle unique logic
            const displayId = Math.floor(1000 + Math.random() * 9000);

            await productRepository.create({
                displayId: displayId,
                name: formData.name,
                price: normalizedPrice,
                old_price: normalizedOldPrice,
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
                variants: normalizedVariants,
                featured: false, // Default
                created_at: new Date().toISOString()
            });

            await Swal.fire({
                icon: 'success',
                title: 'تم بنجاح',
                text: 'تمت إضافة المنتج بنجاح لقاعدة البيانات',
                background: '#141414',
                color: '#fff',
                confirmButtonColor: 'var(--primary)'
            });
            navigate('/products');

        } catch (error) {
            console.error('Supabase Error:', error);
            if (error.name === 'OfflineError') {
                Swal.fire({
                    icon: 'error',
                    title: 'خطأ',
                    text: error.message,
                    background: '#141414',
                    color: '#fff',
                    confirmButtonColor: 'var(--primary)'
                });
                return;
            }
            
            Swal.fire({
                icon: 'error',
                title: 'خطأ في الحفظ',
                html: `
                    <div style="text-align: left; direction: ltr; font-size: 0.9em;">
                        <p><strong>Message:</strong> ${error.message || 'Unknown error'}</p>
                        ${error.details ? `<p><strong>Details:</strong> ${error.details}</p>` : ''}
                        ${error.hint ? `<p><strong>Hint:</strong> ${error.hint}</p>` : ''}
                    </div>
                `,
                background: '#141414',
                color: '#fff'
            });
        } finally {
            stopLoading();
        }
    };

    return (
        <ProductForm
            onSubmit={handleSubmit}
            title="إضافة ساعة جديدة"
            subTitle="أدخل تفاصيل الساعة بدقة لتظهر بشكل صحيح في المتجر"
        />
    );
};

export default AddProduct;

