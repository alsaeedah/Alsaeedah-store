-- 1. التأكد من إنشاء الخاصية supabase_realtime إذا لم تكن موجودة
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_publication
        WHERE pubname = 'supabase_realtime'
    ) THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END
$$;

-- 2. تفعيل المزامنة لجدول المنتجات
ALTER PUBLICATION supabase_realtime ADD TABLE products;

-- 3. تفعيل RLS على Realtime ليسمح بإرسال الإشعارات للكل
ALTER TABLE products REPLICA IDENTITY FULL;
