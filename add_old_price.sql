-- إضافة عمود السعر القديم (السعر قبل الخصم) لجدول المنتجاتsaeed
ALTER TABLE products ADD COLUMN IF NOT EXISTS old_price NUMERIC DEFAULT NULL;
