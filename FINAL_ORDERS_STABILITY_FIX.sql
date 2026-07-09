
-- ==========================================
-- FINAL ORDERS STABILITY FIX
-- ==========================================

-- 1. التأكد من هيكلة جدول الطلبات بجميع الأعمدة المطلوبة
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    customer_name TEXT,
    customer_phone TEXT,
    customer_address JSONB,
    items JSONB NOT NULL DEFAULT '[]',
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    status TEXT DEFAULT 'pending',
    payment_method TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. إضافة الأعمدة في حال كان الجدول موجوداً مسبقاً (safely)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='order_number') THEN
        ALTER TABLE public.orders ADD COLUMN order_number TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='customer_name') THEN
        ALTER TABLE public.orders ADD COLUMN customer_name TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='customer_phone') THEN
        ALTER TABLE public.orders ADD COLUMN customer_phone TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='customer_address') THEN
        ALTER TABLE public.orders ADD COLUMN customer_address JSONB;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='payment_method') THEN
        ALTER TABLE public.orders ADD COLUMN payment_method TEXT;
    END IF;

    -- التأكد من وجود العلاقة (Foreign Key) بين الطلبات والبروفايلات
    -- ملاحظة: هذا التعديل ضروري لظهور الطلبات في لوحة التحكم
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_user_id_fkey') THEN
        ALTER TABLE public.orders 
        ADD CONSTRAINT orders_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- إعادة تنشيط الذاكرة المؤقتة لـ Supabase (Schema Cache)
NOTIFY pgrst, 'reload';

-- 3. تفعيل الأمان RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 4. سياسات الأمان
-- السماح لأي شخص مسجل (أو حتى زائر إذا أردت) بإضافة طلب
DROP POLICY IF EXISTS "Anyone can insert orders" ON public.orders;
CREATE POLICY "Anyone can insert orders" ON public.orders FOR INSERT WITH CHECK (true);

-- السماح للأدمن (أو الجميع للمشاهدة في لوحة التحكم) برؤية الطلبات
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
CREATE POLICY "Admins can view all orders" ON public.orders FOR SELECT USING (true);

-- السماح بتحديث الحالة (عادة للأدمن)
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
CREATE POLICY "Admins can update orders" ON public.orders FOR UPDATE USING (true);

-- السماح بحذف الطلبات
DROP POLICY IF EXISTS "Admins can delete orders" ON public.orders;
CREATE POLICY "Admins can delete orders" ON public.orders FOR DELETE USING (true);

-- 5. تفعيل التنبيهات اللحظية (Realtime) للطلبات
-- هذا الجزء يضمن ظهور الطلب فوراً في لوحة التحكم مع صوت تنبيه
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;
END $$;

-- 6. منح الصلاحيات
GRANT ALL ON TABLE public.orders TO anon, authenticated, service_role;
