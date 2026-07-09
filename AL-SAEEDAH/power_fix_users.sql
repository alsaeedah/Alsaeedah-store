
-- 1. التأكد من وجود الجدول بالأعمدة الصحيحة
CREATE TABLE IF NOT EXISTS public.users (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  email text,
  phone text,
  governorate text,
  district text,
  neighborhood text,
  created_at timestamp with time zone DEFAULT now()
);

-- 2. إيقاف RLS مؤقتاً للتأكد من أن البيانات تصل (سنعيده لاحقاً)
-- ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 3. مسح أي سياسات قديمة متعارضة
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Allow individual insert" ON public.users;
DROP POLICY IF EXISTS "Allow individual update" ON public.users;
DROP POLICY IF EXISTS "Allow admin read all" ON public.users;
DROP POLICY IF EXISTS "Allow admin delete any" ON public.users;

-- 4. إعداد سياسات جديدة ومرنة
-- السماح لأي مستخدم (مسجل) برؤية وتعديل بياناته
CREATE POLICY "user_self_access" ON public.users FOR ALL USING (auth.uid() = id);

-- السماح للإدمن (أنت) برؤية وحذف كل شيء
-- تأكد من كتابة الإيميل بدقة كما هو في Supabase Auth
CREATE POLICY "admin_all_access" ON public.users FOR ALL 
USING (
  auth.jwt() ->> 'email' = 'timetick711@gmail.com' OR 
  auth.jwt() ->> 'email' = 'saeedbinmeslem@gmail.com'
);

-- السماح بالإدخال الأولي للبيانات (ضروري للمزامنة)
CREATE POLICY "allow_initial_insert" ON public.users FOR INSERT WITH CHECK (true);

-- 5. نسخ المستخدمين من نظام Auth إلى الجدول العام (يدوياً)
INSERT INTO public.users (id, email, name, phone, created_at)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', split_part(email, '@', 1)),
    COALESCE(raw_user_meta_data->>'whatsapp', raw_user_meta_data->>'phone', ''),
    created_at
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name;

-- 6. تفعيل الصلاحيات للأدوار
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.users TO anon;
GRANT ALL ON public.users TO service_role;

-- 7. تفعيل المزامنة اللحظية (بشكل آمن)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'users'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
  END IF;
END $$;

ALTER TABLE public.users REPLICA IDENTITY FULL;

-- أداة فحص سريعة: تشغيل هذا السطر لرؤية إذا كانت البيانات موجودة فعلاً
-- SELECT count(*) as total_users_found FROM public.users;