-- =============================================================================
-- SYNAPTRA — Migration 010: Role-Based Dashboard RLS Verification
-- =============================================================================
-- This migration verifies and reinforces row-level security policies for
-- role-based access. All policies here are idempotent (uses DROP IF EXISTS).
-- =============================================================================

-- ─── Ensure profiles are readable by the owner of the profile and college admins ──
-- (These should already exist from schema.sql / migration 008 but we reinforce them)

-- Profiles: users can read their own profile; authenticated users can read others (public data)
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
CREATE POLICY "Profiles are viewable by authenticated users" ON public.profiles
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Profiles: users can only update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id);

-- ─── College memberships: role-based seat validation ─────────────────────────
-- Verify that only college admins can activate/deactivate seats
DROP POLICY IF EXISTS "Only college admin can manage seat activation" ON public.college_memberships;
CREATE POLICY "Only college admin can manage seat activation" ON public.college_memberships
    FOR UPDATE
    USING (
        public.is_college_admin(auth.uid(), college_id)
        OR public.is_platform_owner(auth.uid())
    );

-- ─── Platform owner gets full access to all colleges ─────────────────────────
DROP POLICY IF EXISTS "Platform owner can view all colleges" ON public.colleges;
CREATE POLICY "Platform owner can view all colleges" ON public.colleges
    FOR SELECT
    USING (
        auth.uid() IS NOT NULL
        -- All authenticated users can browse colleges (for discovery)
    );

DROP POLICY IF EXISTS "Platform owner can manage all colleges" ON public.colleges;
CREATE POLICY "Platform owner can manage all colleges" ON public.colleges
    FOR ALL
    USING (public.is_platform_owner(auth.uid()))
    WITH CHECK (public.is_platform_owner(auth.uid()));

-- ─── Industry partners: restrict access to industry-relevant tables ───────────
-- Industry partners should not be able to see college membership details
DROP POLICY IF EXISTS "Industry partners cannot view college memberships" ON public.college_memberships;
-- (No separate deny policy needed; the existing SELECT policy already restricts to
--  own membership or college admin — industry partners only see their own record)

-- ─── Summary of role routing enforced at DB level ───────────────────────────
-- Role       | Dashboard Route | Admin Access | Industry Access
-- -----------|-----------------|--------------|----------------
-- student    | /dashboard      | NO           | NO
-- faculty    | /dashboard      | NO           | NO
-- staff      | /dashboard      | NO           | NO
-- admin      | /admin          | YES          | NO
-- college_admin | /admin       | YES          | NO
-- owner      | /admin          | YES (full)   | NO
-- industry_partner | /industry | NO           | YES
-- =============================================================================
-- End of Migration 010
-- =============================================================================
