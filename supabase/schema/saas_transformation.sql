-- =============================================================================
-- SYNAPTRA — Multi-College SaaS Platform Transformation Migration
-- Non-destructive, additive schema defining College Tenancy, Owner Dashboard,
-- Subscription Billing, Payment Ledger, Industry Bridge, Curriculum Evolution,
-- and Project-Driven Knowledge Recovery.
-- =============================================================================

-- Enable UUID extension if not present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. COLLEGES / TENANTS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.colleges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    domain TEXT UNIQUE,
    logo_url TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    contact_email TEXT NOT NULL,
    contact_phone TEXT,
    admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'suspended', 'expired', 'cancelled')),
    max_students INT NOT NULL DEFAULT 100,
    max_faculty INT NOT NULL DEFAULT 10,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_colleges_status ON public.colleges(status);
CREATE INDEX IF NOT EXISTS idx_colleges_code ON public.colleges(code);
CREATE INDEX IF NOT EXISTS idx_colleges_domain ON public.colleges(domain);

-- -----------------------------------------------------------------------------
-- 2. SUBSCRIPTION PLANS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    monthly_price_inr NUMERIC(10,2) NOT NULL DEFAULT 0,
    annual_price_inr NUMERIC(10,2) NOT NULL DEFAULT 0,
    student_seat_limit INT NOT NULL DEFAULT 100,
    faculty_seat_limit INT NOT NULL DEFAULT 10,
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed Initial Standard Plans if not exist
INSERT INTO public.subscription_plans (name, code, description, monthly_price_inr, annual_price_inr, student_seat_limit, faculty_seat_limit, features)
VALUES 
    ('Starter Campus', 'starter', 'For small academic departments and research cohorts', 9999.00, 99999.00, 100, 10, '["Core Project Workspace", "Basic AI Matching", "Weekly Submissions", "Role-Based Access"]'::jsonb),
    ('Growth Institution', 'growth', 'For growing multi-department engineering and science colleges', 24999.00, 249999.00, 500, 50, '["All Starter Features", "Full Gemini AI Integration", "Industry Innovation Bridge", "Detailed Faculty Monitoring", "Dedicated Support"]'::jsonb),
    ('Enterprise University', 'enterprise', 'Full institutional deployment with custom seats and priority integration', 49999.00, 499999.00, 2000, 200, '["All Growth Features", "Curriculum Evolution Intelligence", "Custom Domain SSO", "Unlimited Storage", "24/7 SLA Support"]'::jsonb)
ON CONFLICT (code) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 3. COLLEGE SUBSCRIPTIONS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.college_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.subscription_plans(id) ON DELETE RESTRICT,
    billing_cycle TEXT NOT NULL DEFAULT 'annual' CHECK (billing_cycle IN ('monthly', 'annual')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'grace_period', 'expired', 'suspended', 'cancelled')),
    student_seats_purchased INT NOT NULL DEFAULT 100,
    faculty_seats_purchased INT NOT NULL DEFAULT 10,
    additional_student_seats INT NOT NULL DEFAULT 0,
    current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_period_end TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 year'),
    grace_period_end TIMESTAMPTZ,
    auto_renew BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_college_subscriptions_college_id ON public.college_subscriptions(college_id);
CREATE INDEX IF NOT EXISTS idx_college_subscriptions_status ON public.college_subscriptions(status);

-- -----------------------------------------------------------------------------
-- 4. PAYMENT TRANSACTIONS & INVOICES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.college_subscriptions(id) ON DELETE SET NULL,
    order_id TEXT NOT NULL,
    payment_id TEXT,
    signature TEXT,
    amount_inr NUMERIC(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'authorized', 'captured', 'failed', 'refunded')),
    method TEXT DEFAULT 'upi',
    invoice_number TEXT UNIQUE,
    invoice_url TEXT,
    gateway_response JSONB,
    error_description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_college_id ON public.payment_transactions(college_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_id ON public.payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON public.payment_transactions(status);

-- -----------------------------------------------------------------------------
-- 5. COLLEGE MEMBERSHIPS & SEAT TRACKING
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.college_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('college_admin', 'faculty', 'student', 'staff')),
    is_seat_active BOOLEAN NOT NULL DEFAULT true,
    department TEXT,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (college_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_college_memberships_college_id ON public.college_memberships(college_id);
CREATE INDEX IF NOT EXISTS idx_college_memberships_user_id ON public.college_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_college_memberships_role ON public.college_memberships(role);

-- -----------------------------------------------------------------------------
-- 6. COLLEGE INVITATIONS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.college_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('college_admin', 'faculty', 'student', 'staff')),
    invited_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_college_invitations_token ON public.college_invitations(token);
CREATE INDEX IF NOT EXISTS idx_college_invitations_email ON public.college_invitations(email);

-- -----------------------------------------------------------------------------
-- 7. FUTURE FEATURE 1: INDUSTRY-TO-CAMPUS INNOVATION BRIDGE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.industry_partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    website TEXT,
    logo_url TEXT,
    industry_domain TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'suspended')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.industry_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID NOT NULL REFERENCES public.industry_partners(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    problem_statement TEXT NOT NULL,
    domain TEXT NOT NULL,
    required_skills TEXT[] NOT NULL DEFAULT '{}',
    expected_outcomes TEXT,
    bounty_or_grant TEXT,
    target_college_id UUID REFERENCES public.colleges(id) ON DELETE SET NULL,
    deadline TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('draft', 'open', 'reviewing', 'assigned', 'completed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.challenge_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID NOT NULL REFERENCES public.industry_challenges(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    college_id UUID REFERENCES public.colleges(id) ON DELETE CASCADE,
    team_name TEXT NOT NULL,
    lead_student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    mentor_faculty_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    proposal_summary TEXT NOT NULL,
    ai_match_score NUMERIC(5,2) DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'accepted', 'rejected')),
    feedback TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 8. FUTURE FEATURE 2: CURRICULUM EVOLUTION INTELLIGENCE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.curriculum_frameworks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
    department TEXT NOT NULL,
    degree TEXT NOT NULL,
    academic_year TEXT NOT NULL,
    course_code TEXT NOT NULL,
    course_name TEXT NOT NULL,
    learning_outcomes JSONB NOT NULL DEFAULT '[]'::jsonb,
    syllabus_topics JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.curriculum_gap_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
    framework_id UUID REFERENCES public.curriculum_frameworks(id) ON DELETE SET NULL,
    department TEXT NOT NULL,
    coverage_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
    practical_evidence_score NUMERIC(5,2) NOT NULL DEFAULT 0,
    gaps_identified JSONB NOT NULL DEFAULT '[]'::jsonb,
    industry_alignment_score NUMERIC(5,2) DEFAULT 0,
    recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'published',
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 9. FUTURE FEATURE 3: PROJECT-DRIVEN KNOWLEDGE RECOVERY
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.knowledge_recovery_paths (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
    concept_name TEXT NOT NULL,
    difficulty_level TEXT NOT NULL DEFAULT 'intermediate' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    prerequisite_path JSONB NOT NULL DEFAULT '[]'::jsonb,
    learning_resources JSONB NOT NULL DEFAULT '[]'::jsonb,
    progress_percent INT NOT NULL DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('not_started', 'in_progress', 'completed', 'verified')),
    faculty_feedback TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_recovery_student_id ON public.knowledge_recovery_paths(student_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_recovery_task_id ON public.knowledge_recovery_paths(task_id);

-- -----------------------------------------------------------------------------
-- 10. OWNER AUDIT LOGS & PLATFORM SETTINGS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.owner_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    actor_email TEXT,
    action TEXT NOT NULL,
    target_entity TEXT NOT NULL,
    target_id TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_owner_audit_logs_action ON public.owner_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_owner_audit_logs_created_at ON public.owner_audit_logs(created_at DESC);

CREATE TABLE IF NOT EXISTS public.platform_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert Default Platform Settings
INSERT INTO public.platform_settings (key, value, description)
VALUES 
    ('maintenance_mode', 'false'::jsonb, 'Global maintenance mode flag'),
    ('default_grace_period_days', '14'::jsonb, 'Grace period days before subscription deactivation'),
    ('allow_public_college_signup', 'true'::jsonb, 'Allow external colleges to submit onboarding requests'),
    ('payment_gateway_mode', '"test"'::jsonb, 'Payment gateway mode (test or live)')
ON CONFLICT (key) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 11. ADDITIVE TENANCY EXTENSIONS TO EXISTING TABLES
-- Non-destructive additions: Adds college_id if not present
-- -----------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'college_id'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN college_id UUID REFERENCES public.colleges(id) ON DELETE SET NULL;
        CREATE INDEX idx_profiles_college_id ON public.profiles(college_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'college_id'
    ) THEN
        ALTER TABLE public.projects ADD COLUMN college_id UUID REFERENCES public.colleges(id) ON DELETE SET NULL;
        CREATE INDEX idx_projects_college_id ON public.projects(college_id);
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 12. ROW LEVEL SECURITY (RLS) POLICIES
-- -----------------------------------------------------------------------------
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.college_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.college_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.college_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.industry_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.industry_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculum_frameworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculum_gap_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_recovery_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owner_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Helper function: Is Platform Owner (either role='owner' or role='admin')
CREATE OR REPLACE FUNCTION public.is_platform_owner(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = user_id AND (role::text = 'admin' OR role::text = 'owner')
    );
$$;

-- Helper function: Is College Admin for given college
CREATE OR REPLACE FUNCTION public.is_college_admin(user_id UUID, col_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.college_memberships
        WHERE user_id = user_id AND college_id = col_id AND role = 'college_admin'
    ) OR EXISTS (
        SELECT 1 FROM public.colleges
        WHERE id = col_id AND admin_id = user_id
    ) OR is_platform_owner(user_id);
$$;

-- COLLEGES POLICIES
DROP POLICY IF EXISTS "Public can view active colleges" ON public.colleges;
CREATE POLICY "Public can view active colleges" ON public.colleges
    FOR SELECT USING (status = 'active' OR is_platform_owner(auth.uid()) OR admin_id = auth.uid());

DROP POLICY IF EXISTS "Platform Owner can manage colleges" ON public.colleges;
CREATE POLICY "Platform Owner can manage colleges" ON public.colleges
    FOR ALL USING (is_platform_owner(auth.uid()));

-- SUBSCRIPTION PLANS POLICIES (Public read, Owner manage)
DROP POLICY IF EXISTS "Plans are readable by all" ON public.subscription_plans;
CREATE POLICY "Plans are readable by all" ON public.subscription_plans
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Owner can manage plans" ON public.subscription_plans;
CREATE POLICY "Owner can manage plans" ON public.subscription_plans
    FOR ALL USING (is_platform_owner(auth.uid()));

-- COLLEGE SUBSCRIPTIONS POLICIES
DROP POLICY IF EXISTS "College admin and owner can view subscriptions" ON public.college_subscriptions;
CREATE POLICY "College admin and owner can view subscriptions" ON public.college_subscriptions
    FOR SELECT USING (is_college_admin(auth.uid(), college_id));

DROP POLICY IF EXISTS "Platform Owner can manage all subscriptions" ON public.college_subscriptions;
CREATE POLICY "Platform Owner can manage all subscriptions" ON public.college_subscriptions
    FOR ALL USING (is_platform_owner(auth.uid()));

-- PAYMENT TRANSACTIONS POLICIES
DROP POLICY IF EXISTS "College admin and owner can view payments" ON public.payment_transactions;
CREATE POLICY "College admin and owner can view payments" ON public.payment_transactions
    FOR SELECT USING (is_college_admin(auth.uid(), college_id));

DROP POLICY IF EXISTS "Platform owner can manage payments" ON public.payment_transactions;
CREATE POLICY "Platform owner can manage payments" ON public.payment_transactions
    FOR ALL USING (is_platform_owner(auth.uid()));

-- KNOWLEDGE RECOVERY POLICIES
DROP POLICY IF EXISTS "Students see own recovery paths" ON public.knowledge_recovery_paths;
CREATE POLICY "Students see own recovery paths" ON public.knowledge_recovery_paths
    FOR SELECT USING (student_id = auth.uid() OR is_platform_owner(auth.uid()));

DROP POLICY IF EXISTS "Students can insert and update own recovery progress" ON public.knowledge_recovery_paths;
CREATE POLICY "Students can insert and update own recovery progress" ON public.knowledge_recovery_paths
    FOR ALL USING (student_id = auth.uid());

-- INDUSTRY CHALLENGES POLICIES
DROP POLICY IF EXISTS "Industry challenges are viewable by authenticated users" ON public.industry_challenges;
CREATE POLICY "Industry challenges are viewable by authenticated users" ON public.industry_challenges
    FOR SELECT USING (status = 'open' OR is_platform_owner(auth.uid()));

-- CURRICULUM GAP REPORTS POLICIES
DROP POLICY IF EXISTS "College members can view gap reports" ON public.curriculum_gap_reports;
CREATE POLICY "College members can view gap reports" ON public.curriculum_gap_reports
    FOR SELECT USING (is_college_admin(auth.uid(), college_id) OR is_platform_owner(auth.uid()));

