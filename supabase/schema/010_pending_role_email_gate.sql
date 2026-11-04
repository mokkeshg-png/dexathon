-- ============================================================
-- Migration: pending_role + email verification activation
-- Adds pending_role column and trigger to promote it on email confirm
-- ============================================================

-- 1. Add pending_role column (backward-compatible, defaults NULL)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS pending_role platform_role;

CREATE INDEX IF NOT EXISTS idx_profiles_pending_role
  ON public.profiles(pending_role) WHERE pending_role IS NOT NULL;

-- 2. activate_verified_role: promotes pending_role on email confirmation
CREATE OR REPLACE FUNCTION public.activate_verified_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    UPDATE public.profiles
    SET role         = pending_role,
        pending_role = NULL,
        updated_at   = NOW()
    WHERE id = NEW.id
      AND pending_role IS NOT NULL;

    UPDATE public.college_memberships
    SET is_seat_active = true
    WHERE user_id = NEW.id
      AND is_seat_active = false;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_email_verified ON auth.users;
CREATE TRIGGER on_email_verified
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.activate_verified_role();

-- 3. enforce_membership_email_gate: prevent unverified users from being active
CREATE OR REPLACE FUNCTION public.enforce_membership_email_gate()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  email_confirmed TIMESTAMPTZ;
BEGIN
  SELECT email_confirmed_at INTO email_confirmed
  FROM auth.users WHERE id = NEW.user_id;

  IF email_confirmed IS NULL AND NEW.is_seat_active = true THEN
    NEW.is_seat_active := false;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_membership_email_gate ON public.college_memberships;
CREATE TRIGGER trg_membership_email_gate
  BEFORE INSERT OR UPDATE OF is_seat_active ON public.college_memberships
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_membership_email_gate();

-- 4. Update handle_new_user to record pending_role for non-student/faculty roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  safe_role platform_role;
  raw_role  TEXT;
  pending   platform_role;
BEGIN
  raw_role := NEW.raw_user_meta_data->>'role';

  IF raw_role IN ('student', 'faculty') THEN
    safe_role := raw_role::platform_role;
    pending   := NULL;
  ELSE
    safe_role := 'student'::platform_role;
    IF raw_role IN ('industry_partner','staff','college_admin','owner','admin') THEN
      pending := raw_role::platform_role;
    ELSE
      pending := NULL;
    END IF;
  END IF;

  INSERT INTO public.profiles (
    id, email, full_name, role, pending_role,
    institution, department, phone, location,
    status, visibility, profile_completeness
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), 'Unknown User'),
    safe_role,
    pending,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'institution', ''), 'Unknown Institution'),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'department', ''), 'Unknown Department'),
    NULLIF(NEW.raw_user_meta_data->>'phone', ''),
    NULLIF(NEW.raw_user_meta_data->>'location', ''),
    'active'::account_status,
    'public'::profile_visibility,
    10
  )
  ON CONFLICT (id) DO UPDATE SET
    email       = EXCLUDED.email,
    full_name   = EXCLUDED.full_name,
    institution = EXCLUDED.institution,
    department  = EXCLUDED.department,
    phone       = EXCLUDED.phone,
    location    = EXCLUDED.location;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user failed for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
