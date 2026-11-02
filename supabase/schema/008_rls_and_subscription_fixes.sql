-- =============================================================================
-- SYNAPTRA — Migration 008: RLS Fixes, Subscription Policies, Membership Policies
-- Run this in: Supabase Dashboard > SQL Editor
-- =============================================================================

-- ─── Fix 1: is_college_admin parameter shadowing bug ───────────────────────
-- The original function had `user_id = user_id` (column compared to itself).
-- Fixed by using $1 parameter references explicitly.
CREATE OR REPLACE FUNCTION public.is_college_admin(p_user_id UUID, col_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.college_memberships
        WHERE college_memberships.user_id = p_user_id
          AND college_memberships.college_id = col_id
          AND college_memberships.role = 'college_admin'
    ) OR EXISTS (
        SELECT 1 FROM public.colleges
        WHERE id = col_id AND admin_id = p_user_id
    ) OR public.is_platform_owner(p_user_id);
$$;

-- ─── Fix 2: college_memberships RLS policies ───────────────────────────────
-- Members should be readable by the college admin of that college and by the user themselves.
DROP POLICY IF EXISTS "Members can view own membership" ON public.college_memberships;
CREATE POLICY "Members can view own membership" ON public.college_memberships
    FOR SELECT
    USING (user_id = auth.uid() OR public.is_college_admin(auth.uid(), college_id));

DROP POLICY IF EXISTS "College admin can insert memberships" ON public.college_memberships;
CREATE POLICY "College admin can insert memberships" ON public.college_memberships
    FOR INSERT
    WITH CHECK (public.is_college_admin(auth.uid(), college_id) OR auth.uid() = user_id);

DROP POLICY IF EXISTS "College admin can update memberships" ON public.college_memberships;
CREATE POLICY "College admin can update memberships" ON public.college_memberships
    FOR UPDATE
    USING (public.is_college_admin(auth.uid(), college_id));

DROP POLICY IF EXISTS "College admin can delete memberships" ON public.college_memberships;
CREATE POLICY "College admin can delete memberships" ON public.college_memberships
    FOR DELETE
    USING (public.is_college_admin(auth.uid(), college_id) OR auth.uid() = user_id);

-- ─── Fix 3: college_invitations — allow users to SELECT invitations for their email ──
DROP POLICY IF EXISTS "Users can view invitations for their email" ON public.college_invitations;
CREATE POLICY "Users can view invitations for their email" ON public.college_invitations
    FOR SELECT
    USING (
        email = (SELECT email FROM auth.users WHERE id = auth.uid())
        OR public.is_college_admin(auth.uid(), college_id)
    );

DROP POLICY IF EXISTS "College admins can insert invitations" ON public.college_invitations;
CREATE POLICY "College admins can insert invitations" ON public.college_invitations
    FOR INSERT
    WITH CHECK (public.is_college_admin(auth.uid(), college_id));

DROP POLICY IF EXISTS "College admins can update invitations" ON public.college_invitations;
CREATE POLICY "College admins can update invitations" ON public.college_invitations
    FOR UPDATE
    USING (
        public.is_college_admin(auth.uid(), college_id)
        OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
    );

-- ─── Fix 4: payment_transactions — college admins can insert (create order) ──
DROP POLICY IF EXISTS "College admin can create payment orders" ON public.payment_transactions;
CREATE POLICY "College admin can create payment orders" ON public.payment_transactions
    FOR INSERT
    WITH CHECK (public.is_college_admin(auth.uid(), college_id));

-- ─── Fix 5: college_subscriptions — college admins can SELECT their subscription ──
-- (already covered by the migration but ensure the function name matches)
DROP POLICY IF EXISTS "College admin and owner can view subscriptions" ON public.college_subscriptions;
CREATE POLICY "College admin and owner can view subscriptions" ON public.college_subscriptions
    FOR SELECT
    USING (public.is_college_admin(auth.uid(), college_id));

-- ─── Fix 6: Auth trigger — allow college_admin role on acceptInvitation ───
-- The handle_new_user trigger only assigns student/faculty to prevent self-escalation.
-- acceptInvitation() updates the profile role via a separate UPDATE after user creation.
-- The prevent_role_escalation trigger blocks non-admins from changing role via UPDATE.
-- We need a security-definer helper that acceptInvitation can call server-side.
-- Since this is a frontend app, we use a DB function callable by authenticated users
-- but only for accepted invitations where the role was pre-authorized by a college admin.

CREATE OR REPLACE FUNCTION public.accept_college_invitation(
    p_token TEXT,
    p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    inv RECORD;
    college_rec RECORD;
BEGIN
    -- Fetch the invitation
    SELECT * INTO inv
    FROM public.college_invitations
    WHERE token = p_token
      AND status = 'pending'
      AND expires_at > NOW();

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invitation not found, already used, or expired.');
    END IF;

    -- Verify the email matches the authenticated user
    IF inv.email != (SELECT email FROM auth.users WHERE id = p_user_id) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invitation email does not match your account.');
    END IF;

    -- Mark invitation as accepted
    UPDATE public.college_invitations
    SET status = 'accepted'
    WHERE id = inv.id;

    -- Update profile role and college_id (SECURITY DEFINER bypasses role escalation trigger)
    UPDATE public.profiles
    SET role = inv.role::platform_role,
        college_id = inv.college_id,
        updated_at = NOW()
    WHERE id = p_user_id;

    -- Upsert college membership
    INSERT INTO public.college_memberships (college_id, user_id, role, is_seat_active, joined_at)
    VALUES (inv.college_id, p_user_id, inv.role, true, NOW())
    ON CONFLICT (college_id, user_id) DO UPDATE
        SET role = EXCLUDED.role,
            is_seat_active = true;

    -- Update colleges.admin_id if this is a college_admin invitation
    IF inv.role = 'college_admin' THEN
        UPDATE public.colleges
        SET admin_id = p_user_id,
            updated_at = NOW()
        WHERE id = inv.college_id AND admin_id IS NULL;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'collegeId', inv.college_id,
        'role', inv.role
    );
END;
$$;

-- Grant execute to authenticated users
REVOKE ALL ON FUNCTION public.accept_college_invitation(TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_college_invitation(TEXT, UUID) TO authenticated;

-- ─── Fix 7: owner_audit_logs — authenticated users can INSERT (for subscription requests) ──
DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON public.owner_audit_logs;
CREATE POLICY "Authenticated users can insert audit logs" ON public.owner_audit_logs
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Platform owner can view audit logs" ON public.owner_audit_logs;
CREATE POLICY "Platform owner can view audit logs" ON public.owner_audit_logs
    FOR SELECT
    USING (public.is_platform_owner(auth.uid()));

-- ─── Fix 8: platform_settings — public read ───────────────────────────────
DROP POLICY IF EXISTS "Platform settings readable by all authenticated" ON public.platform_settings;
CREATE POLICY "Platform settings readable by all authenticated" ON public.platform_settings
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- ─── End of Migration 008 ─────────────────────────────────────────────────
