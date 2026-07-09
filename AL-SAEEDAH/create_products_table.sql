-- إنشاء جدول المنتجات (products)
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL,
    category TEXT,
    style TEXT,
    image TEXT,        -- الصورة الرئيسية
    "imageUrl" TEXT,   -- رابط الصورة (في حال تم استخدامه)
    images TEXT[],     -- مصفوفة تحتوي على عدة صور
    video TEXT,        -- رابط الفيديو
    "displayId" TEXT,  -- المعرف المميز للمنتج المعروض
    variants JSONB,    -- تفاصيل المنتجات المتغيرة (مثل المقاسات والأسعار المختلفة)
    stock INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إعداد صلاحيات الأمان (Row Level Security - RLS)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- سياسة 1: السماح لجميع المستخدمين (حتى الزوار) برؤية المنتجات (للعرض في المتجر)
CREATE DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO PUBLIC;

CREATE POLICY "Allow public read access" 
ON public.products 
FOR SELECT 
USING (true);

-- سياسة 2: السماح للمستخدمين المسجلين (أو المسؤولين) بإضافة وحذف وتعديل المنتجات (من لوحة التحكم)
-- ملاحظة: في بيئة الإنتاج الفعلية، يُفضل التحقق من أن المستخدم مسجل كمدير (Admin)
CREATE POLICY "Allow authenticated full access" 
ON public.products 
FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);
