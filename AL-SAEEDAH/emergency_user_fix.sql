
-- 1. تفريغ وإعادة ملء جدول المستخدمين من بيانات Auth (Migration)
-- هذا سيحل مشكلة المستخدمين القدامى الذين سجلوا قبل وجود الجدول
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
    name = EXCLUDED.name,
    phone = EXCLUDED.phone;

-- 2. فتح الصلاحيات بشكل أوسع للإدمن (باستخدام JWT)
DROP POLICY IF EXISTS "Allow admin read all" ON public.users;
CREATE POLICY "Allow admin read all" 
ON public.users 
FOR SELECT 
USING (
  (auth.jwt() ->> 'email') = 'timetick711@gmail.com' OR 
  (auth.jwt() ->> 'email') = 'saeedbinmeslem@gmail.com'
);

-- 3. السماح لأي مستخدم مسجل بإدخال بياناته الخاصة (منعاً لأي تعارض RLS)
DROP POLICY IF EXISTS "Allow individual insert" ON public.users;
CREATE POLICY "Allow individual insert" 
ON public.users 
FOR INSERT 
WITH CHECK (true); -- السماح بالإدخال للكل والتحكم سيكون عبر الـ Controller أو auth.uid() لاحقاً

DROP POLICY IF EXISTS "Allow individual update" ON public.users;
CREATE POLICY "Allow individual update" 
ON public.users 
FOR UPDATE 
USING (auth.uid() = id);

-- 4. التأكد من صلاحيات الجداول للأدوار (Roles)
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.users TO anon;
GRANT ALL ON public.users TO service_role;

-- 5. تفعيل المزامنة اللحظية (لضمان ظهورهم في الداشبورد فوراً)
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
ALTER TABLE public.users REPLICA IDENTITY FULL;
