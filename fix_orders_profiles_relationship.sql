-- 1. التأكد من وجود جدول الحسابات (Profiles) بهيكل صحيح إذا لم يكن موجوداً
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    whatsapp TEXT,
    governorate TEXT,
    district TEXT,
    neighborhood TEXT,
    image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. إضافة حقول بيانات العميل المباشرة لجدول الطلبات (لضمان التوافق مع المتجر)
DO $$ 
BEGIN 
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
END $$;

-- 3. تفعيل الربط الرسمي (Foreign Key) بين جدول الطلبات وجدول الحسابات
-- هذا السطر هو الذي سيحل مشكلة "Could not find a relationship"
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_user_id_fkey') THEN
        ALTER TABLE public.orders 
        ADD CONSTRAINT orders_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 4. إعطاء صلاحيات الوصول للوحة التحكم
GRANT ALL ON TABLE public.profiles TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.orders TO anon, authenticated, service_role;

-- 5. تحديث السياسات الأمنية للسماح بالاستعلام المدمج (Join)
DROP POLICY IF EXISTS "Allow join access" ON public.orders;
CREATE POLICY "Allow join access" ON public.orders FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow profiles access" ON public.profiles;
CREATE POLICY "Allow profiles access" ON public.profiles FOR SELECT USING (true);
