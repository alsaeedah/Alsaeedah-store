
import React from 'react';
import { useLoading } from '../context/LoadingContext';
import { supabase } from '../supabase/client';
import Swal from 'sweetalert2';
import ProductForm from '../components/ProductForm';
import { useNavigate } from 'react-router-dom';

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
            // Calculate random display ID or leave for DB to handle unique logic
            const displayId = Math.floor(1000 + Math.random() * 9000);

            const { error } = await supabase
                .from('products')
                .insert([{
                    displayId: displayId,
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
                    variants: formData.variants || [],
                    featured: false // Default
                }]);

            if (error) throw error;

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

