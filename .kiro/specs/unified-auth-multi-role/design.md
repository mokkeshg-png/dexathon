# Design Document: Unified Auth Multi-Role

## Overview

This design specifies the migration of SYNAPTRA to a unified authentication and multi-role model. The migration closes four security gaps: a frontend role override via localStorage metadata, a client-side invitation acceptance path that bypasses the JWT-guarded server function, missing email verification gating for privileged roles, and Edge Functions with JWT verification disabled. All changes are backward-compatible — no existing data, accounts, or UI routes are removed.

---

## Architecture

The platform has four layers that the migration touches:

```
┌─────────────────────────────────────────────────────────────┐
│  UI Layer (React)                                           │
│  Register.tsx · ProtectedRoute.tsx · AuthContext.tsx        │
├─────────────────────────────────────────────────────────────┤
│  Data Access Layer (TypeScript)                             │
│  supabase-db.ts (rowToProfile, signUp) · saasService.ts     │
├─────────────────────────────────────────────────────────────┤
│  Edge Functions (Deno)                                      │
│  analyze-project-fit · analyze-skill-score · ai-navigation  │
├─────────────────────────────────────────────────────────────┤
│  Database Layer (PostgreSQL 17)                             │
│  profiles.role · college_memberships.role · triggers · RPC  │
└─────────────────────────────────────────────────────────────┘
```

**Data flow for role resolution after migration:**

```
auth.users → handle_new_user trigger → profiles.role (student/faculty only)
                    ↓
           fetchProfile() → rowToProfile(row) → Profile.role (DB only, no localStorage)
                    ↓
           AuthContext → role predicates (isOwner, isAdmin, etc.)
                    ↓
           ProtectedRoute → dashboard routing
```

**Email verification activation flow:**

```
User signs up (non-student role requested)
  → handle_new_user: profiles.role = "student", pending_role = requested role
  → college_memberships.is_seat_active = false (gated by trigger)
  → User clicks email confirmation link
  → Supabase sets auth.users.email_confirmed_at
  → on_email_verified trigger: profiles.role = pending_role, memberships activated
```

---

## Components and Interfaces

### 1. Database Layer

#### 1.1 Extend `platform_role` Enum

The enum currently has only `('student', 'faculty', 'admin')`. The frontend `PlatformRole` type already defines seven values. The enum must be extended to match.

```sql
-- Migration: Extend platform_role enum (backward-compatible — ADD VALUE only)
ALTER TYPE platform_role ADD VALUE IF NOT EXISTS 'college_admin';
ALTER TYPE platform_role ADD VALUE IF NOT EXISTS 'owner';
ALTER TYPE platform_role ADD VALUE IF NOT EXISTS 'industry_partner';
ALTER TYPE platform_role ADD VALUE IF NOT EXISTS 'staff';
```

`ALTER TYPE ADD VALUE` is non-locking and backward-compatible. Existing rows with `role = 'admin'` remain valid.

#### 1.2 Add `pending_role` Column

Stores the requested role during registration when the user's email is not yet verified. When `email_confirmed_at` transitions from null to a timestamp, the pending role is promoted to the active role.

```sql
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS pending_role platform_role;

CREATE INDEX IF NOT EXISTS idx_profiles_pending_role
  ON public.profiles(pending_role) WHERE pending_role IS NOT NULL;
```

#### 1.3 Update `handle_new_user` Trigger

The trigger already rejects non-student/faculty roles (from `security_hardening.sql`). It must additionally record the requested role in `pending_role` when the user self-registers with a non-student/faculty role.

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    safe_role platform_role;
    raw_role TEXT;
    pending platform_role;
BEGIN
    raw_role := NEW.raw_user_meta_data->>'role';

    -- Only student and faculty can self-register as their active role
    IF raw_role IN ('student', 'faculty') THEN
        safe_role := raw_role::platform_role;
        pending := NULL;
    ELSE
        safe_role := 'student'::platform_role;
        -- Record the requested role as pending for later activation
        IF raw_role IN ('industry_partner', 'staff', 'college_admin', 'owner', 'admin') THEN
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
```

The trigger is idempotent (`DROP TRIGGER IF EXISTS` before re-create, as already done in `auth_trigger.sql`). The `ON CONFLICT DO UPDATE` clause does not overwrite `role` or `pending_role` on re-runs, preserving existing values.

#### 1.4 Email Verification Activation Trigger

A trigger on `auth.users` that fires when `email_confirmed_at` transitions from null to non-null. It promotes the pending role and activates pending memberships.

```sql
CREATE OR REPLACE FUNCTION public.activate_verified_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Only fire when email_confirmed_at transitions from null to a timestamp
    IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
        -- Promote pending role to active role
        UPDATE public.profiles
        SET role = pending_role,
            pending_role = NULL,
            updated_at = NOW()
        WHERE id = NEW.id
          AND pending_role IS NOT NULL;

        -- Activate pending college memberships
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
```

#### 1.5 College Membership Seat Activation Gate

A trigger that prevents `is_seat_active` from being set to true when the user's email is not verified.

```sql
CREATE OR REPLACE FUNCTION public.enforce_membership_email_gate()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_email_confirmed TIMESTAMPTZ;
BEGIN
    SELECT email_confirmed_at INTO user_email_confirmed
    FROM auth.users WHERE id = NEW.user_id;

    IF user_email_confirmed IS NULL AND NEW.is_seat_active = true THEN
        -- Allow the insert but force is_seat_active to false
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
```

#### 1.6 Update `is_admin()` to Include Owner

The current `is_admin()` function only checks `role = 'admin'`. The `prevent_role_escalation` trigger uses it, meaning `owner` users cannot change roles. This must be fixed.

```sql
CREATE OR REPLACE FUNCTION public.is_admin(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = p_user_id
          AND role IN ('admin', 'owner', 'college_admin')
    );
$$;
```

This is backward-compatible: existing `role = 'admin'` users continue to pass the check, and `owner` and `college_admin` users now also pass.

#### 1.7 SQL Bootstrap Script

A parameterized, one-time script that grants `owner` and `college_admin` roles to specified verified users. It requires `email_confirmed_at` to be non-null for each target user.

```sql
-- =============================================================================
-- SYNAPTRA — Elevated Role Bootstrap Script
-- One-time execution to grant owner and college_admin roles to verified users.
-- Requires email_confirmed_at to be non-null for each target user.
-- =============================================================================

-- Parameter: array of {email, role} pairs to grant.
-- Execute manually, replacing the target list with real verified users.

DO $$
DECLARE
    targets JSONB := '[
        {"email": "gmokkesh@gmail.com", "role": "college_admin"},
        {"email": "owner@synaptra.edu", "role": "owner"}
    ]'::jsonb;
    t RECORD;
    v_user_id UUID;
    v_confirmed TIMESTAMPTZ;
BEGIN
    FOR t IN SELECT * FROM jsonb_array_elements(targets)
    LOOP
        -- Look up the user by email
        SELECT id, email_confirmed_at INTO v_user_id, v_confirmed
        FROM auth.users
        WHERE email = t.value->>'email';

        IF v_user_id IS NULL THEN
            RAISE NOTICE 'SKIP: No auth user found for email %', t.value->>'email';
            CONTINUE;
        END IF;

        -- Require email verification
        IF v_confirmed IS NULL THEN
            RAISE NOTICE 'SKIP: User % has unverified email — cannot grant elevated role', t.value->>'email';
            CONTINUE;
        END IF;

        -- Grant the elevated role (bypasses prevent_role_escalation via SECURITY DEFINER context)
        UPDATE public.profiles
        SET role = (t.value->>'role')::platform_role,
            pending_role = NULL,
            updated_at = NOW()
        WHERE id = v_user_id;

        -- If college_admin, link to the specified college
        IF t.value->>'role' = 'college_admin' AND (t.value->>'college_id') IS NOT NULL THEN
            INSERT INTO public.college_memberships (college_id, user_id, role, is_seat_active, joined_at)
            VALUES ((t.value->>'college_id')::uuid, v_user_id, 'college_admin', true, NOW())
            ON CONFLICT (college_id, user_id) DO UPDATE
                SET role = 'college_admin', is_seat_active = true;

            UPDATE public.colleges
            SET admin_id = v_user_id, updated_at = NOW()
            WHERE id = (t.value->>'college_id')::uuid AND admin_id IS NULL;
        END IF;

        RAISE NOTICE 'GRANTED: % role %', t.value->>'email', t.value->>'role';
    END LOOP;
END;
$$;
```

The script is idempotent: re-running it updates the role to the same value. It uses `RAISE NOTICE` for skipped users rather than `RAISE EXCEPTION`, so one unverified user does not block the rest.

### 2. Data Access Layer

#### 2.1 Fix `rowToProfile()` — Remove localStorage Role Override

**Current (buggy) code in `supabase-db.ts`:**

```typescript
const meta = getProfileMeta(row.id);
const profile: Profile = {
    // ...
    role: ((meta.role as Profile["role"]) || (row.role ?? "student")) as Profile["role"],
    // ...
    collegeId: row.college_id,  // Note: currently NOT mapped — must be added
};
```

The `meta.role` lookup reads from `localStorage.getItem('synaptra_profile_meta_${userId}')`, allowing the client to override the DB role.

**Fixed code:**

```typescript
function rowToProfile(row: any, extras?: { /* same as before */ }): Profile {
    const meta = getProfileMeta(row.id);

    const profile: Profile = {
        id: row.id,
        userId: row.id,
        email: row.email ?? "",
        // Role comes EXCLUSIVELY from the DB column — localStorage meta.role is discarded
        role: (row.role ?? "student") as Profile["role"],
        // collegeId comes EXCLUSIVELY from the DB column
        collegeId: row.college_id ?? undefined,
        fullName: row.full_name ?? "",
        // ... all other fields unchanged ...
        // meta is still used for non-role fields: headline, coverPhotoUrl, education, achievements,
        // organizationName, industryDomain, collegeCode, collegeDomain, website
        headline: meta.headline,
        coverPhotoUrl: meta.coverPhotoUrl ? meta.coverPhotoUrl : undefined,
        education: meta.education ?? [],
        achievements: meta.achievements ?? [],
        // ...
    };

    return profile;
}
```

The `getProfileMeta()` and `saveProfileMeta()` functions remain for non-role metadata (headline, coverPhotoUrl, education, achievements, organizationName, etc.). Only the `role` field is removed from the meta path.

#### 2.2 Update `signUp()` — Remove localStorage Role Storage

**Current code:**

```typescript
saveProfileMeta(userId, {
    role: input.role,  // ← BUG: stores role in localStorage
    organizationName: input.organizationName,
    industryDomain: input.industryDomain,
    collegeCode: input.collegeCode,
    collegeDomain: input.collegeDomain,
    website: input.website,
});
```

**Fixed code:**

```typescript
saveProfileMeta(userId, {
    // role is NOT stored in localStorage — it comes from the DB exclusively
    organizationName: input.organizationName,
    industryDomain: input.industryDomain,
    collegeCode: input.collegeCode,
    collegeDomain: input.collegeDomain,
    website: input.website,
});
```

The `signUp()` function also sends `safeDbRole` in auth metadata. This is already correct: it maps faculty→faculty, admin/college_admin→admin, everything else→student. The `handle_new_user` trigger enforces the same constraint server-side, so even if the client sends a different role, the trigger defaults it.

The `actual_role` metadata field can remain for the trigger to record as `pending_role`, but the active role in `profiles.role` will always be student or faculty until email verification.

#### 2.3 Replace Client-Side `acceptInvitation()` with RPC Call

**Remove** the `acceptInvitation()` function from `saasService.ts`:

```typescript
// REMOVE THIS FUNCTION:
// export async function acceptInvitation(email: string, userId: string): Promise<boolean> {
//     const normEmail = email.trim().toLowerCase();
//     const { data } = await supabase.from("college_invitations").select("*")...
//     await supabase.from("college_invitations").update({ status: "accepted" })...
//     await addCollegeMember({ collegeId, userId, role, isSeatActive: true });
//     return true;
// }
```

**Replace with** a new function that calls the server-side RPC:

```typescript
import { supabase } from "@/lib/supabase";

/**
 * Accept a college invitation through the server-side accept_college_invitation() RPC.
 * This is JWT-guarded, email-checked, and atomic — the client never directly
 * queries or modifies college_invitations or college_memberships.
 */
export async function acceptCollegeInvitation(token: string): Promise<{
  success: boolean;
  collegeId?: string;
  role?: string;
  error?: string;
}> {
  const { data: user } = await supabase!.auth.getUser();
  if (!user?.user?.id) {
    return { success: false, error: "You must be signed in to accept an invitation." };
  }

  const { data, error } = await supabase!.rpc("accept_college_invitation", {
    p_token: token,
    p_user_id: user.user.id,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  // The RPC returns JSONB: { success, collegeId, role, error }
  return data as { success: boolean; collegeId?: string; role?: string; error?: string };
}
```

The existing `accept_college_invitation()` DB function already:
- Verifies the token exists and is pending
- Checks that the invitation email matches the authenticated user's email
- Marks the invitation as accepted
- Updates `profiles.role` and `profiles.college_id`
- Upserts `college_memberships` with `is_seat_active = true`

The email verification gate (Section 1.5) will prevent `is_seat_active = true` if the user's email is unverified. When the user later verifies their email, the activation trigger (Section 1.4) will activate the membership.

### 3. Auth Layer

#### 3.1 AuthContext — Role Predicates

The current `AuthContext.tsx` already derives predicates from `profile?.role`:

```typescript
const role = profile?.role;
const isOwner = Boolean(role === "owner");
const isCollegeAdmin = Boolean(role === "college_admin" || role === "admin");
const isAdmin = Boolean(isOwner || isCollegeAdmin);
const isFaculty = Boolean(role === "faculty");
const isStudent = Boolean(role === "student" || (!role && user));
const isStaff = Boolean(role === "staff");
const isIndustryPartner = Boolean(role === "industry_partner");
const collegeId = profile?.collegeId || null;
```

After fixing `rowToProfile()`, `profile.role` and `profile.collegeId` come exclusively from the database. No changes to the predicate logic are needed — the fix is in the data source.

One adjustment: `isStudent` currently treats `!role` as student (fallback for users with no profile). This is acceptable — a user without a profile row has no verified role and defaults to student-level access.

#### 3.2 ProtectedRoute — Dashboard Routing

The current `ProtectedRoute.tsx` routing logic is correct and needs no changes:

```typescript
const userRole = profile?.role || "student";
const homeRoute = isStudentRole(userRole)
    ? studentHomeRoute()           // → /dashboard
    : userRole === "faculty"
      ? "/faculty"
      : userRole === "admin" || userRole === "college_admin" || userRole === "owner" || isAdmin
        ? "/admin"
        : userRole === "industry_partner"
          ? "/industry"
          : "/dashboard";
```

After the `rowToProfile()` fix, `userRole` comes from the DB, so routing is based on the verified role. The `isStudentRole()` check and `canStudentAccessRoute()` gate remain unchanged.

### 4. UI Layer

#### 4.1 Register.tsx — Admin Tab Redirect

The admin/college_admin registration tab must not submit an elevated role. Instead, it directs the user to the invitation or bootstrap flow.

**Current admin submit handler:**

```typescript
const handleAdminRegistrationSubmit = async (e: React.FormEvent) => {
    // ...
    await signUp({
        email: adminEmail.trim().toLowerCase(),
        password,
        fullName: adminFullName.trim(),
        role: "college_admin",  // ← BUG: self-registers as college_admin
        institution,
        // ...
    });
    // ...
};
```

**Fixed admin tab behavior:**

The admin tab should not render a registration form. Instead, it shows an informational panel directing the user to the invitation or bootstrap flow.

```tsx
{activeTab === "admin" && (
  <div className="space-y-6">
    <Card className="p-6 space-y-4 border-[#ECE5D8] bg-white rounded-3xl">
      <div className="flex items-center gap-3">
        <Shield className="h-6 w-6 text-[#FFC812]" />
        <h3 className="font-serif text-lg font-bold text-[#181B1F]">
          College Administrator Access
        </h3>
      </div>
      <p className="text-sm text-[#5E646A] leading-relaxed">
        College Administrator and Platform Owner roles cannot be self-registered.
        You will receive an invitation email from your institution's existing
        administrator or the SYNAPTRA platform team.
      </p>
      <div className="space-y-3 pt-2">
        <div className="flex items-start gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
          <p className="text-xs text-[#5E646A]">
            If you have an invitation token, sign in with your institutional email
            and enter the token on your dashboard.
          </p>
        </div>
        <div className="flex items-start gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
          <p className="text-xs text-[#5E646A]">
            If you are the first administrator at your institution, contact the
            SYNAPTRA platform team to run the bootstrap script for your verified
            email.
          </p>
        </div>
      </div>
      <Link to="/login">
        <Button variant="primary" size="sm" className="w-full">
          Proceed to Sign In
        </Button>
      </Link>
    </Card>
  </div>
)}
```

#### 4.2 Register.tsx — Industry Tab

The industry tab currently self-registers as `industry_partner` and calls `acceptInvitation()`. Since `handle_new_user` only accepts student/faculty, the industry_partner role would be defaulted to student by the trigger, with `industry_partner` recorded as the pending role.

The industry tab should register the user as a student (the default), with `industry_partner` as the pending role. The user will need to verify their email to activate the industry_partner role. The client-side `acceptInvitation()` call must be removed.

```typescript
const handleIndustrySubmit = async (e: React.FormEvent) => {
    // ... validation unchanged ...

    setLoading(true);
    try {
        const authUser = await signUp({
            email: industryEmail.trim().toLowerCase(),
            password,
            fullName: industryContactPerson.trim(),
            role: "industry_partner",  // Trigger records as pending_role, active role = student
            companyName: companyName.trim(),
            industrySector: industrySector,
            website: companyWebsite.trim(),
            jobTitle: jobDesignation.trim(),
            location: companyLocation.trim(),
            phone: contactNumber.trim(),
            technologies: technologies,
            companyDescription: companyDescription.trim(),
        });

        // REMOVED: await acceptInvitation(industryEmail, authUser.id).catch(() => {});
        // The acceptInvitation client-side function is replaced by the RPC.
        // Industry partners are activated via email verification, not invitation acceptance.

        setSuccessMessage(
            "Industry Partner account created! Please verify your email to activate your industry workspace."
        );
    } catch (err: any) {
        setError(err?.message || "Registration failed.");
    } finally {
        setLoading(false);
    }
};
```

### 5. Edge Functions

#### 5.1 Update `config.toml`

Set `verify_jwt = true` for all three active Edge Functions:

```toml
[functions.analyze-project-fit]
enabled = true
verify_jwt = true
import_map = "./functions/analyze-project-fit/deno.json"
entrypoint = "./functions/analyze-project-fit/index.ts"

[functions.analyze-skill-score]
enabled = true
verify_jwt = true
import_map = "./functions/analyze-skill-score/deno.json"
entrypoint = "./functions/analyze-skill-score/index.ts"

[functions.ai-navigation]
enabled = true
verify_jwt = true
import_map = "./functions/ai-navigation/deno.json"
entrypoint = "./functions/ai-navigation/index.ts"
```

With `verify_jwt = true`, the Supabase gateway rejects unauthenticated requests with HTTP 401 before the function code runs. The `withSupabase({ auth: "user" })` wrapper in each function already extracts `ctx.userClaims` from the verified JWT.

#### 5.2 Add Role Checks to Edge Functions

Each Edge Function must verify the caller's role against the required role for that function. The functions serve student-facing AI analysis, so the required roles are student and faculty (industry partners may also use `analyze-skill-score`).

**Pattern for role checking (added at the top of each function handler):**

```typescript
// After extracting userId from ctx.userClaims:
const { data: profile } = await ctx.supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

const ALLOWED_ROLES = ["student", "faculty"]; // adjust per function

if (!profile || !ALLOWED_ROLES.includes(profile.role)) {
    return jsonResponse(
        { error: "Your role does not have access to this feature." },
        403,
    );
}
```

**Per-function role requirements:**

| Function | Required Roles |
|---|---|
| `analyze-project-fit` | student, faculty |
| `analyze-skill-score` | student, faculty, industry_partner |
| `ai-navigation` | student, faculty |

The role check uses `ctx.supabaseAdmin` (available via `withSupabase`) to read `profiles.role`, which is the DB-authoritative role. This is consistent with the `verify_jwt = true` gateway check — the JWT is verified first, then the role is verified against the DB.

---

## Data Models

### `profiles` Table (Modified)

| Column | Type | Change |
|---|---|---|
| `id` | UUID PK | unchanged |
| `email` | TEXT | unchanged |
| `role` | platform_role | now authoritative source (no localStorage override) |
| `pending_role` | platform_role (nullable) | **NEW** — stores requested role until email verified |
| `college_id` | UUID (nullable) | unchanged, now mapped in rowToProfile |
| `full_name` | TEXT | unchanged |
| `status` | account_status | unchanged |
| `visibility` | profile_visibility | unchanged |
| all other columns | various | unchanged |

### `college_memberships` Table (Unchanged Structure)

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | unchanged |
| `college_id` | UUID FK | unchanged |
| `user_id` | UUID FK | unchanged |
| `role` | TEXT | unchanged (college-scoped role) |
| `is_seat_active` | BOOLEAN | now gated by `enforce_membership_email_gate` trigger |
| `department` | TEXT | unchanged |
| `joined_at` | TIMESTAMPTZ | unchanged |

### `platform_role` Enum (Extended)

```sql
-- Before: ('student', 'faculty', 'admin')
-- After:  ('student', 'faculty', 'admin', 'college_admin', 'owner', 'industry_partner', 'staff')
```

### `auth.users` Table (Trigger Added)

A new `on_email_verified` trigger fires `AFTER UPDATE OF email_confirmed_at` when the column transitions from null to non-null.

---

## Interfaces

### `acceptCollegeInvitation()` — New Function

```typescript
// src/services/saasService.ts (replaces acceptInvitation)
export async function acceptCollegeInvitation(token: string): Promise<{
  success: boolean;
  collegeId?: string;
  role?: string;
  error?: string;
}>;
```

### `Profile` Interface (Unchanged Shape)

The `Profile` interface in `src/types/index.ts` is unchanged. The `role` and `collegeId` fields now come exclusively from the DB via `rowToProfile()`.

### DB Function: `accept_college_invitation(p_token TEXT, p_user_id UUID)` (Unchanged)

The existing RPC function in `008_rls_and_subscription_fixes.sql` is used as-is. It is `SECURITY DEFINER`, JWT-guarded (granted to `authenticated` only), email-checked, and atomic.

### DB Function: `activate_verified_role()` (New)

Fires on `auth.users` email confirmation. No direct client interface — triggered automatically by Supabase.

---

## Error Handling

### Registration Errors

| Scenario | Behavior |
|---|---|
| Non-student/faculty role in metadata | Trigger defaults to student, records pending_role |
| Email already registered | Supabase auth returns error, surfaced to user |
| College code not found | Registration proceeds with "Unknown Institution" default |

### Invitation Acceptance Errors

| Scenario | RPC Response | Frontend Behavior |
|---|---|---|
| Invalid/expired token | `{ success: false, error: "Invitation not found..." }` | Display error, no state change |
| Email mismatch | `{ success: false, error: "Invitation email does not match..." }` | Display error, no state change |
| Already accepted | `{ success: false, error: "Invitation not found..." }` | Display error, no state change |
| User not authenticated | Frontend check before RPC | Display "You must be signed in" |

### Email Verification Activation

| Scenario | Behavior |
|---|---|
| User verifies email, has pending_role | `activate_verified_role` trigger promotes role, activates memberships |
| User verifies email, no pending_role | Trigger does nothing (pending_role is NULL) |
| Membership insert for unverified user | `enforce_membership_email_gate` forces `is_seat_active = false` |

### Edge Function Errors

| Scenario | HTTP Status | Behavior |
|---|---|---|
| Missing/invalid JWT | 401 | Supabase gateway rejects before function runs |
| Valid JWT, wrong role | 403 | Function returns error JSON |
| Valid JWT, valid role | 200 | Function processes request |

---

## Migration Safety

### Backward Compatibility

All migrations use `ADD VALUE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`, and `CREATE OR REPLACE`. No `DROP COLUMN`, `DELETE`, or `DROP TABLE` statements are used.

### Data Preservation

- The `platform_role` enum extension (`ADD VALUE`) does not affect existing rows.
- The `pending_role` column addition defaults to NULL for all existing rows — existing users are unaffected.
- The `is_admin()` update is additive — existing `admin` users continue to pass.
- The `handle_new_user` trigger update does not change behavior for student/faculty registrations.
- The `accept_college_invitation()` RPC is unchanged.
- The `rowToProfile()` fix only changes the role source from localStorage to DB — existing DB roles are preserved.

### Rollback

The migration is not easily reversible (enum value additions cannot be removed in PostgreSQL without recreating the type). However, the changes are additive and do not break existing functionality. If needed, the `pending_role` column can be dropped and the triggers can be dropped, reverting to the previous state.

---

## Testing Strategy

**Dual Testing Approach:**
- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Property tests**: Verify universal properties across all inputs
- Both are complementary and necessary for comprehensive coverage

**Unit Testing Balance:**
- Unit tests are helpful for specific examples and edge cases
- Property-based tests handle covering lots of inputs
- Unit tests should focus on:
  - Specific examples that demonstrate correct behavior (e.g., a student registering and being routed to `/dashboard`)
  - Integration points between components (e.g., AuthContext calling fetchProfile after email verification)
  - Edge cases and error conditions (e.g., expired invitation token, unverified email attempting activation)
- Property tests should focus on:
  - Universal properties that hold for all inputs (e.g., rowToProfile always returns DB role)
  - Comprehensive input coverage through randomization

**Property Test Configuration:**
- Minimum 100 iterations per property test (due to randomization)
- Each property test must reference its design document property
- Tag format: **Feature: unified-auth-multi-role, Property {number}: {property_text}**

**Test Scope by Requirement:**

| Requirement | Test Type | What Varies |
|---|---|---|
| 1.1, 1.2 (rowToProfile role) | PROPERTY | DB row role vs localStorage role |
| 2.1-2.3 (multi-role storage) | PROPERTY | Roles across multiple colleges |
| 3.1, 3.2 (email verification gate) | PROPERTY | Requested role, email_confirmed_at |
| 3.3, 3.4 (membership activation) | PROPERTY | pending_role, email_confirmed_at transition |
| 4.1, 4.2 (trigger role enforcement) | PROPERTY | raw_role metadata value |
| 4.3 (admin tab redirect) | EXAMPLE | Tab selection, form submission behavior |
| 5.1 (RPC invocation) | INTEGRATION | Token, user authentication |
| 5.2 (remove client-side function) | SMOKE | Codebase structure verification |
| 5.3 (RPC error handling) | PROPERTY | Error type, state preservation |
| 6.1 (bootstrap script exists) | SMOKE | Script existence and idempotency |
| 6.2 (bootstrap email requirement) | PROPERTY | Target user email_confirmed_at |
| 6.3 (no runtime elevation) | SMOKE | Codebase structure verification |
| 7.1-7.5 (dashboard routing) | PROPERTY | profile.role value |
| 7.6 (unauthorized redirect) | PROPERTY | User role vs restricted route |
| 8.1, 8.3 (role predicates) | PROPERTY | profile.role value, refresh behavior |
| 8.2 (collegeId from DB) | PROPERTY | profile.college_id value |
| 9.1 (verify_jwt config) | SMOKE | config.toml verification |
| 9.2, 9.4 (JWT verification) | SMOKE | Gateway behavior verification |
| 9.3 (role check in functions) | PROPERTY | Caller role vs required roles |
| 10.1, 10.2 (data preservation) | SMOKE | Migration execution verification |
| 10.3 (role update preserves data) | PROPERTY | Profile columns other than role |

**Test Infrastructure:**
- Property tests use a test harness that can generate random `profiles` rows, random `college_memberships` rows, and random localStorage metadata
- Database-trigger properties are tested by calling the trigger function logic directly (extracted as a pure function) or against a test database
- Edge Function role checks are tested by mocking the Supabase client and varying the caller's role
- Integration tests for RPC calls use a test database with seeded invitations

---

## Correctness Properties


*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: rowToProfile derives role exclusively from the database

*For any* database profile row with a `role` column value R, and *for any* localStorage metadata that may contain a different role value M, the `rowToProfile` function SHALL produce a `Profile` object whose `role` field equals R and never equals M.

**Validates: Requirements 1.1, 1.2**

### Property 2: rowToProfile derives collegeId exclusively from the database

*For any* database profile row with a `college_id` column value C (including null), and *for any* localStorage metadata, the `rowToProfile` function SHALL produce a `Profile` object whose `collegeId` field equals C and is never influenced by localStorage.

**Validates: Requirements 8.2**

### Property 3: Multi-role storage independence

*For any* user belonging to multiple colleges, the `college_memberships` table SHALL maintain exactly one row per (user, college) pair, and *for any* change to the role in one college's membership, the roles in all other college memberships for that user SHALL remain unchanged.

**Validates: Requirements 2.1, 2.2, 2.3**

### Property 4: Email verification gates non-student roles

*For any* user whose `email_confirmed_at` is null, the user's active `profiles.role` SHALL be "student" regardless of the role requested during registration, and *for any* non-student role requested during registration, the `pending_role` column SHALL record the requested role while the active role remains "student".

**Validates: Requirements 3.1, 3.2**

### Property 5: Email verification activates pending roles and memberships

*For any* user with a non-null `pending_role` and inactive `college_memberships` rows, when `email_confirmed_at` transitions from null to a timestamp, the `profiles.role` SHALL be set to the `pending_role` value, `pending_role` SHALL be cleared, and all `college_memberships.is_seat_active` values SHALL transition to true.

**Validates: Requirements 3.3, 3.4**

### Property 6: handle_new_user accepts only student and faculty for self-registration

*For any* role string provided in user metadata during sign-up, if the string is "student" or "faculty", the `handle_new_user` trigger SHALL set `profiles.role` to that value; for any other string (including "admin", "college_admin", "owner", "industry_partner", "staff", or invalid values), the trigger SHALL set `profiles.role` to "student" and SHALL record the requested role in `pending_role` if it is a valid platform role.

**Validates: Requirements 4.1, 4.2**

### Property 7: RPC error preserves invitation and membership state

*For any* call to `accept_college_invitation()` that returns an error, the invitation status SHALL remain unchanged, no `college_memberships` row SHALL be created or modified, and the error SHALL be surfaced to the caller.

**Validates: Requirements 5.3**

### Property 8: Bootstrap script requires email verification

*For any* target user specified in the bootstrap script, the script SHALL grant the elevated role only if the user's `email_confirmed_at` is non-null, and SHALL skip the user with a notice if `email_confirmed_at` is null.

**Validates: Requirements 6.2**

### Property 9: Role-based dashboard routing matches verified role

*For any* authenticated user with a verified `profiles.role` value R, the `ProtectedRoute` SHALL route the user to the dashboard corresponding to R: student routes to the student dashboard, faculty routes to the faculty dashboard, admin/college_admin/owner route to the admin console, and industry_partner routes to the industry dashboard.

**Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5**

### Property 10: Unauthorized route access redirects to role-appropriate dashboard

*For any* authenticated user with role R who attempts to access a route restricted to a different role S (where R is not in the allowed roles for that route), the `ProtectedRoute` SHALL redirect the user to the dashboard corresponding to R, not to the restricted route.

**Validates: Requirements 7.6**

### Property 11: Role predicates derive exclusively from database profile.role

*For any* profile with a database `role` value R, the `AuthContext` SHALL compute `isOwner`, `isAdmin`, `isCollegeAdmin`, `isFaculty`, `isStudent`, `isStaff`, and `isIndustryPartner` such that each predicate is true if and only if R matches the predicate's corresponding role, and *for any* change to the database role, calling `refresh()` SHALL recompute all predicates to match the new role.

**Validates: Requirements 8.1, 8.3**

### Property 12: Edge Function role check enforces required roles

*For any* caller with a verified `profiles.role` value R requesting an Edge Function that requires role set S, the Edge Function SHALL process the request if R is in S, and SHALL return HTTP 403 if R is not in S.

**Validates: Requirements 9.3**

### Property 13: Migration role updates preserve non-role profile data

*For any* existing profile row, when the migration updates the `role` column to align with the authoritative role source, all other columns (email, full_name, institution, department, phone, location, bio, visibility, profile_completeness, etc.) SHALL remain unchanged.

**Validates: Requirements 10.3**
