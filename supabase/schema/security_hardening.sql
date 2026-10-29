-- =============================================================================
-- SYNAPTRA — Security & RBAC Hardening Migration
-- Comprehensive Authorization, RLS, and Anti-Escalation Policies
-- Architecture: Platform serving 100,000 students, faculty, and administrators
-- =============================================================================

-- 1. HARDEN ACCESS CHECK FUNCTION: Remove admin backdoor from project room data
-- Administrators manage metadata and institutional compliance, but do not automatically
-- expose private student chat rooms, research notes, or work items without membership.
CREATE OR REPLACE FUNCTION has_project_access(p_user_id UUID, p_project_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT is_project_owner(p_user_id, p_project_id)
        OR is_project_member(p_user_id, p_project_id);
$$;

-- 2. ROLE ESCALATION PROTECTION TRIGGER ON PROFILES
-- Prevents clients from updating their own 'role' or 'status' columns via direct Supabase calls.
CREATE OR REPLACE FUNCTION prevent_role_escalation()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.role IS DISTINCT FROM OLD.role OR NEW.status IS DISTINCT FROM OLD.status) THEN
        IF NOT is_admin(auth.uid()) THEN
            RAISE EXCEPTION 'Unauthorized: Only platform administrators can change user role or account status.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_role_escalation ON profiles;
CREATE TRIGGER trg_prevent_role_escalation
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION prevent_role_escalation();

-- 3. HARDEN AUTH REGISTRATION TRIGGER: Disallow self-registration as admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
    safe_role platform_role;
    raw_role TEXT;
BEGIN
    raw_role := NEW.raw_user_meta_data->>'role';
    -- Only student and faculty roles can be selected on self-registration
    IF raw_role IN ('student', 'faculty') THEN
        safe_role := raw_role::platform_role;
    ELSE
        safe_role := 'student'::platform_role;
    END IF;

    INSERT INTO public.profiles (
        id, email, full_name, role, institution, department, phone, location, status, visibility, profile_completeness
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.email, ''),
        COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), 'Unknown User'),
        safe_role,
        COALESCE(NULLIF(NEW.raw_user_meta_data->>'institution', ''), 'Unknown Institution'),
        COALESCE(NULLIF(NEW.raw_user_meta_data->>'department', ''), 'Unknown Department'),
        NULLIF(NEW.raw_user_meta_data->>'phone', ''),
        NULLIF(NEW.raw_user_meta_data->>'location', ''),
        'active'::account_status,
        'public'::profile_visibility,
        10
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        institution = EXCLUDED.institution,
        department = EXCLUDED.department,
        phone = EXCLUDED.phone,
        location = EXCLUDED.location;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'handle_new_user failed for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$;

-- 4. HARDEN PROJECT MEMBERS POLICIES (Prevent member self-escalation to owner)
DROP POLICY IF EXISTS "Owners update member status" ON project_members;
DROP POLICY IF EXISTS "Members can leave project" ON project_members;

CREATE POLICY "Owners update member status"
    ON project_members FOR UPDATE
    USING (is_project_owner(auth.uid(), project_id))
    WITH CHECK (is_project_owner(auth.uid(), project_id));

CREATE POLICY "Members can leave project"
    ON project_members FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid() AND status = 'left');

-- 5. HARDEN JOIN REQUESTS POLICIES (Prevent applicant self-acceptance)
DROP POLICY IF EXISTS "Applicant can withdraw; owner can review" ON join_requests;
DROP POLICY IF EXISTS "Applicant can withdraw request" ON join_requests;
DROP POLICY IF EXISTS "Owner can review join request" ON join_requests;

CREATE POLICY "Applicant can withdraw request"
    ON join_requests FOR UPDATE
    USING (applicant_id = auth.uid())
    WITH CHECK (applicant_id = auth.uid() AND status = 'withdrawn');

CREATE POLICY "Owner can review join request"
    ON join_requests FOR UPDATE
    USING (is_project_owner(auth.uid(), project_id))
    WITH CHECK (is_project_owner(auth.uid(), project_id));

-- 6. HARDEN PROJECT INVITATIONS POLICIES (Prevent arbitrary tampering)
DROP POLICY IF EXISTS "Invitee or owner can update invitation" ON project_invitations;
DROP POLICY IF EXISTS "Invitee can respond to invitation" ON project_invitations;
DROP POLICY IF EXISTS "Owner can manage invitation" ON project_invitations;

CREATE POLICY "Invitee can respond to invitation"
    ON project_invitations FOR UPDATE
    USING (invitee_id = auth.uid())
    WITH CHECK (invitee_id = auth.uid() AND status IN ('accepted', 'declined'));

CREATE POLICY "Owner can manage invitation"
    ON project_invitations FOR UPDATE
    USING (is_project_owner(auth.uid(), project_id))
    WITH CHECK (is_project_owner(auth.uid(), project_id));

-- 7. HARDEN DOCUMENTS ACCESS: Prevent automatic admin document exposure
DROP POLICY IF EXISTS "View documents based on access level" ON documents;
CREATE POLICY "View documents based on access level"
    ON documents FOR SELECT
    USING (
        CASE access
            WHEN 'project_members' THEN has_project_access(auth.uid(), project_id)
            WHEN 'owner_only' THEN is_project_owner(auth.uid(), project_id)
            WHEN 'mentor_owner' THEN (
                is_project_owner(auth.uid(), project_id)
                OR EXISTS (
                    SELECT 1 FROM project_members pm
                    WHERE pm.project_id = documents.project_id
                    AND pm.user_id = auth.uid()
                    AND pm.system_role = 'mentor'
                    AND pm.status = 'active'
                )
            )
            WHEN 'role_restricted' THEN has_project_access(auth.uid(), project_id)
            ELSE FALSE
        END
    );
