-- ============================================================
-- AL-SAEEDAH STORE MULTI-MANAGER ACCESS CONTROL (RBAC) SETUP
-- Run this script in the SQL Editor of your Supabase project.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Create Managers Table
CREATE TABLE IF NOT EXISTS public.managers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    permissions JSONB NOT NULL DEFAULT '{"products": false, "orders": false, "users": false}'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMPTZ,
    last_seen TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT -- Super admin email
);

-- Index on email for fast lookups
CREATE INDEX IF NOT EXISTS idx_managers_email ON public.managers (LOWER(email));

-- 2. Trigger function to automatically hash password on insert or update
CREATE OR REPLACE FUNCTION public.hash_manager_password()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if password has changed or if it's a new row
    IF TG_OP = 'INSERT' OR NEW.password_hash <> OLD.password_hash THEN
        -- If password is not already hashed (bcrypt hashes start with $2a$ or $2b$), hash it
        IF NEW.password_hash NOT LIKE '$2a$%' AND NEW.password_hash NOT LIKE '$2b$%' THEN
            NEW.password_hash := crypt(NEW.password_hash, gen_salt('bf', 10));
        END IF;
    END IF;
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create trigger
DROP TRIGGER IF EXISTS trg_hash_manager_password ON public.managers;
CREATE TRIGGER trg_hash_manager_password
    BEFORE INSERT OR UPDATE ON public.managers
    FOR EACH ROW
    EXECUTE FUNCTION public.hash_manager_password();


-- 3. RPC: Verify Manager Login
CREATE OR REPLACE FUNCTION public.verify_manager_login(p_email TEXT, p_password TEXT)
RETURNS TABLE (
    id UUID,
    name TEXT,
    email TEXT,
    permissions JSONB,
    is_active BOOLEAN
) AS $$
DECLARE
    v_id UUID;
    v_name TEXT;
    v_email TEXT;
    v_password_hash TEXT;
    v_permissions JSONB;
    v_is_active BOOLEAN;
BEGIN
    -- Find manager matching email
    SELECT m.id, m.name, m.email, m.password_hash, m.permissions, m.is_active
    INTO v_id, v_name, v_email, v_password_hash, v_permissions, v_is_active
    FROM public.managers m
    WHERE LOWER(m.email) = LOWER(p_email);

    -- If manager exists, is active, and password matches hash
    IF FOUND AND v_is_active = TRUE AND v_password_hash = crypt(p_password, v_password_hash) THEN
        -- Update last_login and last_seen
        UPDATE public.managers
        SET last_login = NOW(), last_seen = NOW()
        WHERE managers.id = v_id;

        RETURN QUERY SELECT v_id, v_name, v_email, v_permissions, v_is_active;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.verify_manager_login(TEXT, TEXT) TO anon, authenticated;


-- 4. RPC: Update Manager Presence (last_seen)
CREATE OR REPLACE FUNCTION public.update_manager_last_seen(p_manager_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.managers
    SET last_seen = NOW()
    WHERE id = p_manager_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.update_manager_last_seen(UUID) TO anon, authenticated;


-- 5. RPC: Get All Managers (Excludes password hashes for security)
CREATE OR REPLACE FUNCTION public.get_managers()
RETURNS TABLE (
    id UUID,
    name TEXT,
    email TEXT,
    permissions JSONB,
    is_active BOOLEAN,
    last_login TIMESTAMPTZ,
    last_seen TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    created_by TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT m.id, m.name, m.email, m.permissions, m.is_active, m.last_login, m.last_seen, m.created_at, m.created_by
    FROM public.managers m
    ORDER BY m.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_managers() TO anon, authenticated;


-- 6. RPC: Create Manager (Trigger hashes the password)
CREATE OR REPLACE FUNCTION public.create_manager(
    p_name TEXT,
    p_email TEXT,
    p_password TEXT,
    p_permissions JSONB,
    p_created_by TEXT
)
RETURNS UUID AS $$
DECLARE
    new_manager_id UUID;
BEGIN
    -- Check if email is unique
    IF EXISTS (SELECT 1 FROM public.managers WHERE LOWER(email) = LOWER(p_email)) THEN
        RAISE EXCEPTION 'هذا البريد الإلكتروني مسجل بالفعل لمدير آخر.';
    END IF;

    INSERT INTO public.managers (name, email, password_hash, permissions, created_by)
    VALUES (p_name, p_email, p_password, p_permissions, p_created_by)
    RETURNING id INTO new_manager_id;

    RETURN new_manager_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.create_manager(TEXT, TEXT, TEXT, JSONB, TEXT) TO anon, authenticated;


-- 7. RPC: Update Manager Details
CREATE OR REPLACE FUNCTION public.update_manager(
    p_id UUID,
    p_name TEXT,
    p_email TEXT,
    p_password TEXT,
    p_permissions JSONB,
    p_is_active BOOLEAN
)
RETURNS VOID AS $$
BEGIN
    -- Check if email is already taken by another manager
    IF EXISTS (SELECT 1 FROM public.managers WHERE LOWER(email) = LOWER(p_email) AND id <> p_id) THEN
        RAISE EXCEPTION 'هذا البريد الإلكتروني مسجل لمدير آخر.';
    END IF;

    -- Update manager details
    UPDATE public.managers
    SET 
        name = p_name,
        email = p_email,
        permissions = p_permissions,
        is_active = p_is_active,
        updated_at = NOW()
    WHERE id = p_id;

    -- Update password if provided
    IF p_password IS NOT NULL AND p_password <> '' THEN
        UPDATE public.managers
        SET password_hash = p_password
        WHERE id = p_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.update_manager(UUID, TEXT, TEXT, TEXT, JSONB, BOOLEAN) TO anon, authenticated;


-- 8. RPC: Delete Manager
CREATE OR REPLACE FUNCTION public.delete_manager(p_id UUID)
RETURNS VOID AS $$
BEGIN
    DELETE FROM public.managers WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.delete_manager(UUID) TO anon, authenticated;


-- 9. Enable RLS on managers (Default block everything, operations run through SECURITY DEFINER RPCs)
ALTER TABLE public.managers ENABLE ROW LEVEL SECURITY;

-- Simple read policy so managers can subscribe to realtime changes (like status updates)
DROP POLICY IF EXISTS "Allow select for managers" ON public.managers;
CREATE POLICY "Allow select for managers" ON public.managers FOR SELECT USING (true);
