-- هذا الملف يقوم بحذف جداول المنتجات، الطلبات، والمستخدمين فقط بناءً على طلبك.
-- تحذير: هذه الأوامر ستقوم بحذف الجداول بالكامل.

DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ملاحظة: إذا كنت تقصد حذف "البيانات" فقط من هذه الجداول مع الإبقاء على الجداول نفسها،
-- فيمكنك مسح الأوامر أعلاه (DROP) واستخدام الأوامر التالية بدلاً منها:
-- TRUNCATE TABLE products CASCADE;
-- TRUNCATE TABLE orders CASCADE;
-- TRUNCATE TABLE users CASCADE;
