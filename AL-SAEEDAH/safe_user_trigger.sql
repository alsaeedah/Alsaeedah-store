-- 1. دالة ذكية لإدخال بيانات المستخدم تلقائياً بدون التسبب في تعطل نظام تسجيل الدخول أو جوجل
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- استخدام تقنية ON CONFLICT لتجنب مشاكل تكرار السجلات
  INSERT INTO public.users (id, email, name, phone, governorate, district, neighborhood, created_at)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(COALESCE(new.email, 'user'), '@', 1)),
    COALESCE(new.raw_user_meta_data->>'whatsapp', new.raw_user_meta_data->>'phone'),
    new.raw_user_meta_data->>'governorate',
    new.raw_user_meta_data->>'district',
    new.raw_user_meta_data->>'neighborhood',
    COALESCE(new.created_at, now())
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(NULLIF(EXCLUDED.name, 'User'), public.users.name, EXCLUDED.name),
    phone = COALESCE(EXCLUDED.phone, public.users.phone),
    governorate = COALESCE(EXCLUDED.governorate, public.users.governorate),
    district = COALESCE(EXCLUDED.district, public.users.district),
    neighborhood = COALESCE(EXCLUDED.neighborhood, public.users.neighborhood);
    
  RETURN new;
EXCEPTION
  -- في حال حدوث أي خطأ في قاعدة البيانات (مثل عدم وجود الجدول أو اختلاف الأعمدة)
  -- سيتم تجاهل الخطأ والسماح للمستخدم بالدخول لتجنب ظهور Database Error
  WHEN OTHERS THEN
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. إرجاع الـ Trigger ليعمل على جدول auth.users بشكل آمن
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
