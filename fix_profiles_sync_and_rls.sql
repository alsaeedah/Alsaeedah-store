-- 1. التأكد من هيكلة الجدول public.profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    whatsapp TEXT,
    governorate TEXT,
    district TEXT,
    neighborhood TEXT,
    image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. تفعيل صلاحيات التحكم بالأمان (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. حذف السياسات القديمة لتفادي التعارض
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role has full access" ON public.profiles;

-- 4. إنشاء سياسات أمان جديدة ومرنة
-- السماح للجميع برؤية البريد الإلكتروني (مهم للتحقق أثناء التسجيل)
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles 
FOR SELECT 
USING (true);

-- السماح للمستخدم بتحديث بياناته الشخصية فقط
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- السماح للـ Trigger والـ Admin بالتحكم الكامل (غالباً يمر عبر الخدمة)
CREATE POLICY "Service role has full access" 
ON public.profiles 
FOR ALL 
USING (true);

-- 5. دالة المزامنة التلقائية (تأخذ البيانات من Auth وترسلها لـ Profiles)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, whatsapp, governorate, district, neighborhood, image, created_at)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'whatsapp',
    new.raw_user_meta_data->>'governorate',
    new.raw_user_meta_data->>'district',
    new.raw_user_meta_data->>'neighborhood',
    COALESCE(new.raw_user_meta_data->>'image', new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture'),
    new.created_at
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    whatsapp = EXCLUDED.whatsapp,
    governorate = EXCLUDED.governorate,
    district = EXCLUDED.district,
    neighborhood = EXCLUDED.neighborhood,
    image = EXCLUDED.image;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. تفعيل الزناد (Trigger) على نظام Supabase Auth
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. مزامنة المستخدمين الحاليين (في حال فاتنا أحد سابقاً)
INSERT INTO public.profiles (id, email, full_name, whatsapp, governorate, district, neighborhood, image, created_at)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name'), 
    raw_user_meta_data->>'whatsapp', 
    raw_user_meta_data->>'governorate', 
    raw_user_meta_data->>'district', 
    raw_user_meta_data->>'neighborhood', 
    COALESCE(raw_user_meta_data->>'image', raw_user_meta_data->>'avatar_url', raw_user_meta_data->>'picture'),
    created_at
FROM auth.users
ON CONFLICT (id) DO NOTHING;
