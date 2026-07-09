
-- 1. إضافة أعمدة تتبع الحالة (Online/Offline)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT FALSE;

-- 2. تفعيل الـ Realtime للجدول (مهم جداً للتحديث اللحظي في الدشبورد)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;
END $$;

-- 3. سياسة تتيح للمستخدم تحديث حالته الخاصة
DROP POLICY IF EXISTS "Users can update their own status" ON public.profiles;
CREATE POLICY "Users can update their own status" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 4. سياسة تتيح للأدمن رؤية هذه البيانات (موجودة سابقاً ولكن للتأكيد)
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles 
FOR SELECT 
USING (true);
