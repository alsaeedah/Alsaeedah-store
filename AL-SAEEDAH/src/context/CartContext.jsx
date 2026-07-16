import { createContext, useState, useContext, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useAuth } from './AuthContext';
import { supabase } from '../supabase/client';

import logo from '../assets/logo.png';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const { currentUser, openAuthModal } = useAuth();
    const [cart, setCart] = useState(() => {
        const saved = localStorage.getItem('time-tick-cart');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('time-tick-cart', JSON.stringify(cart));
    }, [cart]);

    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
    
    // Real-time listener for product deletions and updates + On-load Hydration
    useEffect(() => {
        const cartChannel = supabase
            .channel('realtime_cart_sync')
            .on(
                'postgres_changes',
                { event: 'DELETE', schema: 'public', table: 'products' },
                (payload) => {
                    const deletedId = payload.old?.id;
                    if (!deletedId) return;
                    setCart(prev => prev.filter(item => String(item.id) !== String(deletedId)));
                }
            )
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'products' },
                (payload) => {
                    const updatedProduct = payload.new;
                    if (!updatedProduct) return;
                    setCart(prev => prev.map(item => {
                        if (String(item.id) === String(updatedProduct.id)) {
                            let updatedPrice = updatedProduct.price;
                            if (item.selectedMaterial || item.selectedColor) {
                                const variants = updatedProduct.variants || [];
                                const matchedVariant = variants.find(v => 
                                    (!item.selectedMaterial || v.material === item.selectedMaterial) && 
                                    (!item.selectedColor || v.color === item.selectedColor)
                                );
                                if (matchedVariant && matchedVariant.price) {
                                    updatedPrice = matchedVariant.price;
                                }
                            }
                            return {
                                ...item,
                                name: updatedProduct.name || item.name,
                                price: updatedPrice || item.price,
                                image: item.variantImage || updatedProduct.imageUrl || (updatedProduct.images && updatedProduct.images[0]) || item.image
                            };
                        }
                        return item;
                    }));
                }
            )
            .subscribe();

        // Hydrate cart items on load to ensure single source of truth
        const hydrateCart = async () => {
            const saved = localStorage.getItem('time-tick-cart');
            const initialCart = saved ? JSON.parse(saved) : [];
            if (initialCart.length === 0) return;
            
            const productIds = [...new Set(initialCart.map(item => item?.id).filter(Boolean))];
            
            try {
                const { data, error } = await supabase
                    .from('products')
                    .select('id, name, price, imageUrl, images, variants')
                    .in('id', productIds);
                    
                if (!error && data) {
                    setCart(prev => {
                        return prev.map(item => {
                            const latest = data.find(p => String(p.id) === String(item.id));
                            if (!latest) return null; // Remove if deleted while offline
                            
                            let updatedPrice = latest.price;
                            if (item.selectedMaterial || item.selectedColor) {
                                const variants = latest.variants || [];
                                const matchedVariant = variants.find(v => 
                                    (!item.selectedMaterial || v.material === item.selectedMaterial) && 
                                    (!item.selectedColor || v.color === item.selectedColor)
                                );
                                if (matchedVariant && matchedVariant.price) {
                                    updatedPrice = matchedVariant.price;
                                }
                            }
                            
                            return {
                                ...item,
                                name: latest.name || item.name,
                                price: updatedPrice || item.price,
                                image: item.variantImage || latest.imageUrl || (latest.images && latest.images[0]) || item.image
                            };
                        }).filter(Boolean); // Remove nulls
                    });
                }
            } catch (err) {
                console.error("Failed to hydrate cart:", err);
            }
        };
        
        hydrateCart();

        return () => {
            supabase.removeChannel(cartChannel);
        };
    }, []);

    const openCart = () => setIsCartOpen(true);
    const closeCart = () => setIsCartOpen(false);

    const addToCart = (product, options = {}) => {
        setCart(prev => {
            const { quantity = 1, selectedColor, selectedMaterial, variantPrice } = options;
            const priceToUse = variantPrice !== undefined ? variantPrice : Number(product.price);

            // Create a unique ID for the variant based on the specific image/model
            const variantId = options.variantImage ? `${product.id}-${options.variantImage}` : product.id;

            const existing = prev.find(item => item.variantId === variantId);

            if (existing) {
                return prev.map(item =>
                    item.variantId === variantId ? { ...item, dp_qty: item.dp_qty + quantity } : item
                );
            }

            return [...prev, {
                ...product,
                price: priceToUse,
                variantId, // Store the variant ID
                dp_qty: quantity,
                selectedColor,
                selectedMaterial,
                image: options.variantImage || product.imageUrl || product.image
            }];
        });
        // setIsCartOpen(true); // Auto open disabled by user request
    };

    const removeFromCart = (variantId) => {
        setCart(prev => prev.filter(item => item.variantId !== variantId));
    };

    const updateQuantity = (variantId, delta) => {
        setCart(prev => prev.map(item => {
            if (item.variantId === variantId) {
                const newQty = item.dp_qty + delta;
                return newQty > 0 ? { ...item, dp_qty: newQty } : item;
            }
            return item;
        }));
    };

    const clearCart = () => setCart([]);

    const total = cart.reduce((sum, item) => sum + (item.price * item.dp_qty), 0);

    const generateOrderPDF = async (orderNumber) => {
        const invoiceId = orderNumber || `ORD-${Date.now().toString().slice(-6)}`;

        // Create a hidden div for the invoice
        const invoiceDiv = document.createElement('div');
        invoiceDiv.id = 'temp-invoice';
        invoiceDiv.style.position = 'absolute';
        invoiceDiv.style.left = '-9999px';
        invoiceDiv.style.top = '-9999px';
        invoiceDiv.style.width = '800px';
        invoiceDiv.style.padding = '40px';
        invoiceDiv.style.background = '#ffffff'; // White background as requested
        invoiceDiv.style.color = '#000'; // Black text
        invoiceDiv.style.fontFamily = "'Cairo', sans-serif";
        invoiceDiv.style.direction = 'rtl';

        invoiceDiv.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #d4af37; padding-bottom: 20px; margin-bottom: 30px;">
                
                <!-- Right Side: Store Info -->
                <div style="flex: 1; text-align: right;">
                    <h1 style="color: #d4af37; font-size: 28px; margin: 0 0 10px 0; font-weight: 700;letter-spacing: 0px;">متجر السعيدة</h1>
                    <div style="font-size: 13px; color: #444; line-height: 1.8;">
                         <p style="margin: 0;"><strong>تواصل : </strong> 772754414, 775055319</p>
                         <p style="margin: 0;"><strong>الإيميل : </strong> alsaeedah8@gmail.com</p>
                         <p style="margin: 0; direction: ltr; text-align: right;"><strong>العنوان : </strong> حضرموت / المكلا / الشرج</p>
                    </div>
                </div>

                <!-- Center: Logo -->
                <div style="flex: 1; text-align: center;justify-content:center;">
                    <img src="${logo}" style="width: 100px; height: 100px;" />
                </div>

                <!-- Left Side: Slogans & Date -->
                <div style="flex: 1; text-align: left; display: flex; flex-direction: column; justify-content: space-between; height: 100px;">
                    <div>
                        <p style="margin: 0; font-size: 15px; color: #d4af37; font-weight: bold; font-style: italic;">"الفخامة ... في كل ثانية"</p>
                        <p style="margin: 5px 0 0; color: #888; font-size: 11px;">نصنع التميز، لنهديه إليكم</p>
                    </div>
                    
                    <div style="font-size: 12px; color: #666;">
                        <span style="display: block; margin-bottom: 3px;">رقم الفاتورة: <strong>${invoiceId}</strong></span>
                        <span>التاريخ: ${new Date().toLocaleDateString('ar-SA')}</span>
                    </div>
                </div>

            </div>
            
            
            <div data-segment="customer-info" style="display: flex; gap: 40px; margin-bottom: 30px; padding: 20px; background: #f9f9f9; border-radius: 8px; border: 1px solid #eee;">
                <div style="flex: 1;">
                    <h3 style="color: #d4af37; margin-bottom: 10px; font-size: 16px;letter-spacing: 0px;">بيانات العميل</h3>
                    <p style="margin: 5px 0;"><strong> الاسم : </strong> ${currentUser.name}</p>
                    <p style="margin: 5px 0;"><strong> واتساب : </strong> ${currentUser.whatsapp}</p>
                    <p style="margin: 5px 0;"><strong>الإيميل : </strong> ${currentUser.email}</p>
                </div>
                <div style="flex: 1;">
                    <h3 style="color: #d4af37; margin-bottom: 10px; font-size: 16px;letter-spacing: 0px;">عنوان التوصيل</h3>
                    <p style="margin: 5px 0;"><strong> المحافظة : </strong> ${currentUser.governorate}</p>
                    <p style="margin: 5px 0;"><strong>المديرية : </strong> ${currentUser.district}</p>
                    <p style="margin: 5px 0;"><strong>الحي : </strong> ${currentUser.neighborhood}</p>
                </div>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                <thead>
                    <tr style="background: rgba(212, 175, 55, 0.1); color: #000;">
                        <th style="padding: 15px; text-align: right; border-bottom: 2px solid #d4af37;">رقم الموديل</th>
                        <th style="padding: 15px; text-align: right; border-bottom: 2px solid #d4af37;">المنتج</th>
                        <th style="padding: 15px; text-align: center; border-bottom: 2px solid #d4af37;">السعر</th>
                        <th style="padding: 15px; text-align: center; border-bottom: 2px solid #d4af37;">الكمية</th>
                        <th style="padding: 15px; text-align: left; border-bottom: 2px solid #d4af37;">الإجمالي</th>
                    </tr>
                </thead>
                <tbody>
                    ${cart.map(item => `
                        <tr style="border-bottom: 1px solid #eee;">
                            <td style="padding: 15px; text-align: right; color: #555; font-size: 13px; font-weight: bold;">#${item.displayId || '---'}</td>
                            <td style="padding: 15px; text-align: right; color: #000; font-weight: 600;">
                                ${item.name}
                            </td>
                            <td style="padding: 15px; text-align: center; color: #333;">${item.price.toLocaleString()} ر.س</td>
                            <td style="padding: 15px; text-align: center; color: #333;">${item.dp_qty}</td>
                            <td style="padding: 15px; text-align: left; color: #d4af37; font-weight: bold;">${(item.price * item.dp_qty).toLocaleString()} ر.س</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <div data-segment="total" style="display: flex; flex-direction: column; align-items: flex-start; margin-top: 30px; padding: 20px; background: #fcfcfc; border: 1px solid #eee; border-radius: 8px;">
                <div style="width: 100%; display: flex; justify-content: space-between; font-size: 22px; font-weight: bold;">
                    <span style="color: #000;">الإجمالي الكلي:</span>
                    <span style="color: #d4af37;">${total.toLocaleString()} ر.س</span>
                </div>
            </div>
            
            <div style="margin-top: 60px; text-align: center; color: #888; font-size: 13px;">
                <p style="margin-bottom: 5px;">نشكركم على اختياركم متجر السعيدة - الفخامة في كل ثانية</p>
            </div>
        `;

        document.body.appendChild(invoiceDiv);

        // Intelligent Page Breaking Logic
        const PAGE_HEIGHT_PX = 1120; // Safe height for A4 at 800px width
        const segments = invoiceDiv.querySelectorAll('tbody tr, [data-segment]');

        segments.forEach(el => {
            const elBottom = el.offsetTop + el.offsetHeight;
            const currentPageBottom = Math.ceil(el.offsetTop / PAGE_HEIGHT_PX) * PAGE_HEIGHT_PX;

            // If the element crosses the page boundary
            if (elBottom > currentPageBottom && el.offsetTop < currentPageBottom) {
                const spacer = document.createElement('div');
                spacer.style.height = `${currentPageBottom - el.offsetTop + 2}px`; // Push to next page (+2 for safety)
                el.parentNode.insertBefore(spacer, el);
            }
        });

        try {
            const canvas = await html2canvas(invoiceDiv, {
                backgroundColor: '#ffffff',
                scale: 2,
                useCORS: true,
                logging: false
            });
            const imgData = canvas.toDataURL('image/png');

            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = pageWidth;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            let heightLeft = imgHeight;
            let position = 0;

            // First page
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            // Additional pages if needed
            while (heightLeft > 0) {
                position -= 297;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            const pdfBlob = pdf.output('blob');
            const pdfFile = new File([pdfBlob], `TimeTick-Invoice-${invoiceId}.pdf`, { type: 'application/pdf' });

            // pdf.save(`${invoiceId}.pdf`); // Disabled per user request

            document.body.removeChild(invoiceDiv);
            return { invoiceId: orderNumber || invoiceId, pdfFile };
        } catch (error) {
            console.error('PDF Error:', error);
            if (document.body.contains(invoiceDiv)) document.body.removeChild(invoiceDiv);
            return { invoiceId: null, pdfFile: null };
        }
    };

    const prepareWhatsAppCheckout = async (paymentMethod = '') => {
        if (!currentUser) {
            openAuthModal();
            return { success: false, reason: 'login' };
        }

        if (cart.length === 0) return { success: false, reason: 'empty' };

        // Save order to Supabase
        let orderId = `ORD-${Date.now().toString().slice(-6)}`;
        try {
            const { supabase } = await import('../supabase/client');
            const { data, error } = await supabase.from('orders').insert([{
                user_id: currentUser.uid || currentUser.id,
                customer_name: currentUser.name,
                customer_phone: currentUser.whatsapp,
                customer_address: {
                    governorate: currentUser.governorate,
                    district: currentUser.district,
                    neighborhood: currentUser.neighborhood
                },
                items: cart,
                total_amount: total,
                status: 'pending',
                payment_method: paymentMethod
            }]).select('order_number').single();

            if (error) {
                console.error("Database save error:", error);
            } else if (data && data.order_number) {
                orderId = `ORD${data.order_number}`;
                // Fire-and-forget: send FCM push notification to all manager devices
                // Must NEVER block or fail the checkout flow
                supabase.functions.invoke('send-fcm-notification', {
                    body: {
                        orderId: data.id,
                        customerId: currentUser?.uid || currentUser?.id || '',
                        orderNumber: data.order_number,
                        notificationType: 'new_order'
                    }
                }).catch(err => console.warn('[FCM] Notification failed (non-critical):', err));
            }
        } catch (error) {
            console.error("Supabase error:", error);
        }

        return { success: true, url: '', invoiceId: orderId };
    };

    return (
        <CartContext.Provider value={{
            cart,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            total,
            prepareWhatsAppCheckout,
            isCartOpen,
            openCart,
            closeCart,
            isOptionsModalOpen,
            setIsOptionsModalOpen
        }}>
            {children}
        </CartContext.Provider>
    );
};
