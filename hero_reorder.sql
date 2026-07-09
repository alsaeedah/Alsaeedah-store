-- 1. إضافة عمود الترتيب (sort_order) لجدول الهيرو
ALTER TABLE hero ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;

-- 2. (اختياري) تهيئة الترتيب الحالي بناءً على تاريخ الإنشاء لكي لا تظهر السلايدات القديمة بشكل عشوائي
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as row_num
  FROM hero
)
UPDATE hero
SET sort_order = numbered.row_num
FROM numbered
WHERE hero.id = numbered.id;
