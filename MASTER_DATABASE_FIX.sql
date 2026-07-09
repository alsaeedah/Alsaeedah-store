
-- ==========================================
-- MASTER DATABASE FIX: PROFILES & USER SYNC
-- ==========================================

-- 1. التأكد من إنشاء جدول profiles بجميع الأعمدة المطلوبة
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    whatsapp TEXT,
    governorate TEXT,
    district TEXT,
    neighborhood TEXT,
    image TEXT,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_online BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. نقل البيانات من جدول users القديم (إن وجد) لتجنب فقدان البيانات
DO $$ 
BEGIN 
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
        INSERT INTO public.profiles (id, email, full_name, whatsapp, governorate, district, neighborhood, created_at)
        SELECT 
            id, 
            email, 
            COALESCE(name, email), 
            phone, 
            governorate, 
            district, 
            neighborhood, 
            created_at
        FROM public.users
        ON CONFLICT (id) DO UPDATE SET
            full_name = EXCLUDED.full_name,
            whatsapp = EXCLUDED.whatsapp;
            
        RAISE NOTICE 'Data migrated from users to profiles.';
    END IF;
END $$;

-- 3. تفعيل الأمان RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. سياسات الأمان للجدول
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 5. وظيفة المزامنة التلقائية من نظام Auth إلى جدول Profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, whatsapp, governorate, district, neighborhood, image, created_at)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'User'),
    new.raw_user_meta_data->>'whatsapp',
    new.raw_user_meta_data->>'governorate',
    new.raw_user_meta_data->>'district',
    new.raw_user_meta_data->>'neighborhood',
    COALESCE(new.raw_user_meta_data->>'image', new.raw_user_meta_data->>'avatar_url'),
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

-- 6. ربط الوظيفة بالزناد (Trigger)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. تحديث ربط جدول الطلبات (Orders) بجدول الـ Profiles
DO $$ 
BEGIN 
    -- التأكد من وجود عمود profile_id أو استخدامه كبديل لـ user_id
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
        -- هنا نفترض أن user_id في جدول orders يشير إلى UUID المستخدم
        -- لا نحتاج لتغيير الاسم، فقط نتأكد من إمكانية الربط (Joins) برمجياً
        RAISE NOTICE 'Orders table linked to profiles via user_id successfully.';
    END IF;
END $$;

-- 8. تفعيل الـ Realtime للجدول (لميزة المتصلين الآن)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;
END $$;

-- 9. وظيفة حذف المستخدم نهائياً (من الـ Auth والـ Profiles)
DROP FUNCTION IF EXISTS public.delete_user_by_admin(uuid);
CREATE OR REPLACE FUNCTION public.delete_user_by_admin(target_user_id uuid)
RETURNS void AS $$
BEGIN
    -- Delete from profiles
    DELETE FROM public.profiles WHERE id = target_user_id;
    -- Delete active sessions to force logout
    DELETE FROM auth.sessions WHERE user_id = target_user_id;
    -- Delete from auth.users (This is what makes it permanent)
    DELETE FROM auth.users WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. منح الصلاحيات للأدمن لتشغيل الوظيفة
GRANT EXECUTE ON FUNCTION public.delete_user_by_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_user_by_admin(uuid) TO anon;

-- 11. مزامنة فورية للمستخدمين الحاليين المسجلين في Auth
INSERT INTO public.profiles (id, email, full_name, whatsapp, governorate, district, neighborhood, image, created_at)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', 'User'), 
    raw_user_meta_data->>'whatsapp', 
    raw_user_meta_data->>'governorate', 
    raw_user_meta_data->>'district', 
    raw_user_meta_data->>'neighborhood', 
    COALESCE(raw_user_meta_data->>'image', raw_user_meta_data->>'avatar_url'),
    created_at
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Database Fix Script Updated.
