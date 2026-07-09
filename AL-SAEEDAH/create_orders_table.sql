-- مسح الجدول القديم إذا كان موجوداً لتجنب التعارض (اختياري، يمكنك حذفه إذا كان لديك بيانات مهمة)
DROP TABLE IF EXISTS public.orders CASCADE;

-- إنشاء جدول الطلبات
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number SERIAL,          -- رقم الطلب (تسلسلي تلقائي)
    user_id UUID,                 -- معرف المستخدم (العميل)
    customer_name TEXT,           -- اسم العميل
    customer_phone TEXT,          -- رقم الواتساب/الجوال
    customer_address JSONB,       -- عنوان العميل (دولة، مدينة، حي..)
    items JSONB NOT NULL,         -- المنتجات المطلوبة (مصفوفة تحتوي تفاصيل المنتج، الكمية، السعر، اللون..)
    total_amount NUMERIC NOT NULL,-- الإجمالي الكلي
    status TEXT DEFAULT 'pending',-- حالة الطلب (قيد الانتظار، قيد التنفيذ، مكتمل، ملغي)
    payment_method TEXT,          -- طريقة الدفع
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() -- تاريخ ووقت الطلب
);

-- إعداد صلاحيات الأمان (Row Level Security - RLS)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 1. سياسة السماح للإضافة: السماح للزوار أو المستخدمين المسجلين بإضافة طلب جديد
CREATE POLICY "Allow insert for all" 
ON public.orders 
FOR INSERT 
WITH CHECK (true);

-- 2. سياسة السماح للقراءة والتعديل: السماح للكل في بيئة التطوير
-- (في الإنتاج يجب أن تكون مقتصرة على الإدمن، أو المستخدم يرى طلباته فقط)
CREATE POLICY "Allow full access for development" 
ON public.orders 
FOR ALL 
USING (true)
WITH CHECK (true);

-- تفعيل المزامنة اللحظية (Realtime) لجدول الطلبات لتظهر فوراً في لوحة التحكم
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER TABLE public.orders REPLICA IDENTITY FULL;
