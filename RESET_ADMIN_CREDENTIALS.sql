
-- ==========================================
-- SUPER ADMIN ACCOUNT RESET (V2)
-- ==========================================

-- 1. التأكد من وجود ملحق التشفير
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. تحديث شامل لبيانات الحساب لضمان تفعيله بالكامل
DO $$
BEGIN
    -- إذا كان الحساب موجوداً، نقوم بتحديث كلمة السر وتأكيد البريد فوراً
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'timetick711@gmail.com') THEN
        UPDATE auth.users 
        SET 
            encrypted_password = crypt('770822310saeed', gen_salt('bf')),
            email_confirmed_at = now(),
            confirmed_at = now(),
            last_sign_in_at = NULL,
            raw_app_meta_data = '{"provider":"email","providers":["email"]}',
            raw_user_meta_data = '{"full_name":"Admin"}',
            aud = 'authenticated',
            role = 'authenticated',
            is_super_admin = FALSE -- Supabase عادة لا يستخدم هذا لبياناتنا ولكن للتأكد
        WHERE email = 'timetick711@gmail.com';
        
        RAISE NOTICE 'Admin user updated successfully.';
    ELSE
        -- إذا لم يكن موجوداً، نقوم بإنشائه يدوياً (حالة طارئة)
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password, 
            email_confirmed_at, recovery_sent_at, last_sign_in_at, 
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at, 
            confirmation_token, email_change, email_change_token_new, recovery_token
        )
        VALUES (
            '00000000-0000-0000-0000-000000000000', 
            gen_random_uuid(), 
            'authenticated', 
            'authenticated', 
            'timetick711@gmail.com', 
            crypt('770822310saeed', gen_salt('bf')), 
            now(), 
            now(), 
            now(), 
            '{"provider":"email","providers":["email"]}', 
            '{"full_name":"Admin"}', 
            now(), 
            now(), 
            '', '', '', ''
        );
        RAISE NOTICE 'Admin user created successfully.';
    END IF;
END $$;

-- 3. التأكد من وجود بروفايل مرتبط
INSERT INTO public.profiles (id, email, full_name)
SELECT id, email, 'Admin'
FROM auth.users 
WHERE email = 'timetick711@gmail.com'
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;

-- 4. عرض النتائج للتحقق
SELECT id, email, confirmed_at, role, last_sign_in_at 
FROM auth.users 
WHERE email = 'timetick711@gmail.com';
