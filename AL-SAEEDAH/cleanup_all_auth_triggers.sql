-- 1. هذا الكود سيبحث عن أي Triggers (مُشغّلات) متبقية لديك تم إنشاؤها مسبقاً 
-- على جدول auth.users والتي تستدعي دوال في الـ public schema وسيقوم بحذفها.

DO $$ 
DECLARE 
    trigger_record RECORD;
BEGIN 
    FOR trigger_record IN 
        SELECT t.tgname, p.proname 
        FROM pg_trigger t
        JOIN pg_proc p ON t.tgfoid = p.oid
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE t.tgrelid = 'auth.users'::regclass 
        AND n.nspname = 'public'
    LOOP 
        EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(trigger_record.tgname) || ' ON auth.users CASCADE';
        EXECUTE 'DROP FUNCTION IF EXISTS public.' || quote_ident(trigger_record.proname) || ' CASCADE';
    END LOOP;
END $$;
