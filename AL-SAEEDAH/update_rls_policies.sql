-- تحديث سياسات الأمان الخاصة بجدول المنتجات لتسمح بالإضافة والتعديل

-- أولاً: حذف السياسات القديمة (إذا كانت موجودة) لتجنب التعارض
DROP POLICY IF EXISTS "Allow authenticated full access" ON public.products;
DROP POLICY IF EXISTS "Allow public read access" ON public.products;

-- ثانياً: إنشاء السياسات من جديد لتسمح لجميع المستخدمين بما فيهم الزوار بحرية التعديل (في بيئة التطوير)
-- تنبيه: هذه السياسة تقوم بفتح جميع الصلاحيات (قراءة، إضافة، تعديل، حذف) للجميع (anon و authenticated)
-- يفضل في المستقبل (عند إطلاق المتجر) تقييدها بحيث تقتصر الإضافة والتعديل على لوحة التحكم فقط

CREATE POLICY "Allow public all access"
ON public.products
FOR ALL
USING (true)
WITH CHECK (true);
