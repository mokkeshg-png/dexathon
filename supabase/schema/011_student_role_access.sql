-- =============================================================================
-- SYNAPTRA — Migration 011: Student Role Access Control
-- Students may only read/write resources they are authorized to use.
-- Idempotent. Does not drop tables.
-- =============================================================================

-- 1. Restore visibility-aware profile SELECT (overrides overly-open 010 policy)
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "View accessible profiles" ON public.profiles;
CREATE POLICY "View accessible profiles"
    ON public.profiles FOR SELECT
    USING (
        id = auth.uid()
        OR public.is_admin(auth.uid())
        OR (
            visibility = 'public'
        )
        OR (
            visibility = 'members'
            AND auth.uid() IS NOT NULL
        )
        OR (
            visibility = 'institution'
            AND auth.uid() IS NOT NULL
            AND (
                college_id IS NOT NULL
                AND college_id = (
                    SELECT p.college_id FROM public.profiles p WHERE p.id = auth.uid()
                )
            )
        )
    );

-- 2. Students cannot change their own role or account status
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.role IS DISTINCT FROM OLD.role OR NEW.status IS DISTINCT FROM OLD.status) THEN
        IF NOT (public.is_admin(auth.uid()) OR public.is_platform_owner(auth.uid())) THEN
            RAISE EXCEPTION 'Unauthorized: Only administrators can change user role or account status.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_prevent_role_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_role_escalation
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_role_escalation();

-- 3. Students cannot create faculty-managed or industry-owned project types
CREATE OR REPLACE FUNCTION public.enforce_student_project_create()
RETURNS TRIGGER AS $$
DECLARE
    actor_role text;
BEGIN
    SELECT role::text INTO actor_role FROM public.profiles WHERE id = auth.uid();
    IF actor_role = 'student' THEN
        IF NEW.project_type IN (
            'Faculty Academic Project',
            'Faculty-Led Research',
            'College Innovation Project',
            'Industry Challenge',
            'Joint Industry Project'
        ) THEN
            RAISE EXCEPTION 'Unauthorized: Students cannot create faculty-only or industry-owned project types.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_student_project_create ON public.projects;
CREATE TRIGGER trg_student_project_create
    BEFORE INSERT ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_student_project_create();

-- 4. Applicants cannot self-accept join requests (reinforce)
DROP POLICY IF EXISTS "Applicant can withdraw request" ON public.join_requests;
CREATE POLICY "Applicant can withdraw request"
    ON public.join_requests FOR UPDATE
    USING (applicant_id = auth.uid())
    WITH CHECK (applicant_id = auth.uid() AND status = 'withdrawn');

DROP POLICY IF EXISTS "Owner can review join request" ON public.join_requests;
CREATE POLICY "Owner can review join request"
    ON public.join_requests FOR UPDATE
    USING (public.is_project_owner(auth.uid(), project_id) AND applicant_id <> auth.uid())
    WITH CHECK (public.is_project_owner(auth.uid(), project_id) AND applicant_id <> auth.uid());

-- 5. Weekly submissions: students write own rows; cannot set review fields
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'weekly_submissions') THEN
        ALTER TABLE public.weekly_submissions ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Team can view weekly submissions" ON public.weekly_submissions;
        CREATE POLICY "Team can view weekly submissions"
            ON public.weekly_submissions FOR SELECT
            USING (public.has_project_access(auth.uid(), project_id));

        DROP POLICY IF EXISTS "Students insert own weekly submissions" ON public.weekly_submissions;
        CREATE POLICY "Students insert own weekly submissions"
            ON public.weekly_submissions FOR INSERT
            WITH CHECK (student_id = auth.uid() AND public.has_project_access(auth.uid(), project_id));

        DROP POLICY IF EXISTS "Students update own unreviewed submissions" ON public.weekly_submissions;
        CREATE POLICY "Students update own unreviewed submissions"
            ON public.weekly_submissions FOR UPDATE
            USING (student_id = auth.uid())
            WITH CHECK (
                student_id = auth.uid()
                AND reviewed_by IS NULL
            );

        DROP POLICY IF EXISTS "Faculty review weekly submissions" ON public.weekly_submissions;
        CREATE POLICY "Faculty review weekly submissions"
            ON public.weekly_submissions FOR UPDATE
            USING (
                EXISTS (
                    SELECT 1 FROM public.profiles p
                    WHERE p.id = auth.uid()
                    AND p.role IN ('faculty', 'admin', 'college_admin', 'owner')
                )
                OR EXISTS (
                    SELECT 1 FROM public.project_members pm
                    WHERE pm.project_id = weekly_submissions.project_id
                    AND pm.user_id = auth.uid()
                    AND pm.system_role = 'mentor'
                    AND pm.status = 'active'
                )
            );
    END IF;
END $$;

-- 6. Billing: students must not read payment or subscription rows
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payment_transactions') THEN
        ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Students cannot read payments" ON public.payment_transactions;
        -- Existing admin policies remain; add explicit student-safe SELECT
        DROP POLICY IF EXISTS "College admin or owner can view payments" ON public.payment_transactions;
        CREATE POLICY "College admin or owner can view payments"
            ON public.payment_transactions FOR SELECT
            USING (
                public.is_platform_owner(auth.uid())
                OR public.is_college_admin(auth.uid(), college_id)
            );
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'college_subscriptions') THEN
        ALTER TABLE public.college_subscriptions ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "College admin or owner can view subscriptions" ON public.college_subscriptions;
        CREATE POLICY "College admin or owner can view subscriptions"
            ON public.college_subscriptions FOR SELECT
            USING (
                public.is_platform_owner(auth.uid())
                OR public.is_college_admin(auth.uid(), college_id)
            );
    END IF;
END $$;

-- 7. Industry challenge applications: students see/insert own rows only
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'challenge_applications') THEN
        ALTER TABLE public.challenge_applications ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Students view own challenge applications" ON public.challenge_applications;
        CREATE POLICY "Students view own challenge applications"
            ON public.challenge_applications FOR SELECT
            USING (
                lead_student_id = auth.uid()
                OR public.is_platform_owner(auth.uid())
                OR EXISTS (
                    SELECT 1 FROM public.profiles p
                    WHERE p.id = auth.uid() AND p.role IN ('industry_partner', 'faculty', 'college_admin', 'admin')
                )
            );

        DROP POLICY IF EXISTS "Students insert own challenge applications" ON public.challenge_applications;
        CREATE POLICY "Students insert own challenge applications"
            ON public.challenge_applications FOR INSERT
            WITH CHECK (lead_student_id = auth.uid());

        DROP POLICY IF EXISTS "Industry reviews challenge applications" ON public.challenge_applications;
        CREATE POLICY "Industry reviews challenge applications"
            ON public.challenge_applications FOR UPDATE
            USING (
                EXISTS (
                    SELECT 1 FROM public.profiles p
                    WHERE p.id = auth.uid() AND p.role IN ('industry_partner', 'admin', 'owner', 'college_admin')
                )
            );
    END IF;
END $$;

-- 8. Storage: certificates live under the authenticated user's folder
DROP POLICY IF EXISTS "Users upload own evidence" ON storage.objects;
CREATE POLICY "Users upload own evidence"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id IN ('avatars', 'documents')
        AND auth.uid() IS NOT NULL
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- =============================================================================
-- End of Migration 011
-- =============================================================================
