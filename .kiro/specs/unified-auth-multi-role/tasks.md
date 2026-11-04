# Implementation Plan: Unified Auth Multi-Role

## Overview

This plan migrates SYNAPTRA to a unified authentication and multi-role model by closing four security gaps: a frontend role override via localStorage metadata, a client-side invitation acceptance path that bypasses the JWT-guarded server function, missing email verification gating for privileged roles, and Edge Functions with JWT verification disabled. The work spans four layers — PostgreSQL database (migrations and triggers), TypeScript data access (`supabase-db.ts`, `saasService.ts`), React UI (`Register.tsx`), and Deno Edge Functions — plus verification that the existing `AuthContext` and `ProtectedRoute` work correctly once the data source is fixed.

All changes are additive and backward-compatible. Database migrations use `ALTER TYPE ADD VALUE`, `ADD COLUMN IF NOT EXISTS`, and `CREATE OR REPLACE` — no destructive operations, preserving all existing accounts, profiles, projects, teams, messages, and files.

## Tasks

- [ ] 1. Set up test infrastructure for property-based testing
  - [ ] 1.1 Install vitest and fast-check, create vitest configuration
    - Install `vitest`, `@vitest/coverage-v8`, and `fast-check` as devDependencies
    - Create `vitest.config.ts` with jsdom environment, path aliases matching `tsconfig`, and coverage settings
    - Add `"test": "vitest --run"` and `"test:coverage": "vitest --run --coverage"` scripts to `package.json`
    - Create `src/__tests__/` directory for test files
    - _Requirements: Design testing strategy_

- [ ] 2. Database schema and triggers
  - [ ] 2.1 Verify and extend platform_role enum to all seven roles
    - Verify the enum currently has `('student', 'faculty', 'admin')` and that `college_admin`, `owner`, `industry_partner`, `staff` were added in a prior session
    - If any values are missing, write and apply `ALTER TYPE platform_role ADD VALUE IF NOT EXISTS` for each missing value via Supabase MCP
    - Write the migration SQL to a version-controlled file in `supabase/schema/`
    - _Requirements: 2.1_

  - [ ] 2.2 Add pending_role column to profiles table
    - Write and apply `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pending_role platform_role` via Supabase MCP
    - Create partial index `idx_profiles_pending_role` on `profiles(pending_role) WHERE pending_role IS NOT NULL`
    - Existing rows default to NULL for pending_role — no existing data is modified
    - _Requirements: 3.2_

  - [ ] 2.3 Update handle_new_user trigger to record pending_role
    - Rewrite the `handle_new_user()` function to accept only student/faculty as active roles, defaulting all others to student
    - Record non-student/faculty valid platform roles (admin, college_admin, owner, industry_partner, staff) in `pending_role` for later activation
    - Apply via Supabase MCP (CREATE OR REPLACE FUNCTION + DROP/CREATE TRIGGER)
    - The `ON CONFLICT DO UPDATE` clause must not overwrite `role` or `pending_role` on re-runs
    - _Requirements: 3.1, 3.2, 4.1, 4.2_

  - [ ] 2.4 Create activate_verified_role trigger on auth.users
    - Create `activate_verified_role()` function that fires when `email_confirmed_at` transitions from null to non-null
    - The function promotes `pending_role` to `role`, clears `pending_role`, and sets `is_seat_active = true` on pending college memberships
    - Create `on_email_verified` trigger (`AFTER UPDATE OF email_confirmed_at ON auth.users FOR EACH ROW`)
    - Apply via Supabase MCP
    - _Requirements: 3.3, 3.4_

  - [ ] 2.5 Create enforce_membership_email_gate trigger on college_memberships
    - Create `enforce_membership_email_gate()` function that forces `is_seat_active = false` when the user's `email_confirmed_at` is null
    - Create `trg_membership_email_gate` trigger (`BEFORE INSERT OR UPDATE OF is_seat_active ON public.college_memberships FOR EACH ROW`)
    - Apply via Supabase MCP
    - _Requirements: 3.3_

  - [ ] 2.6 Verify and fix is_admin() to include owner and college_admin
    - Verify `is_admin()` currently checks only `role = 'admin'` and that it was updated to include owner and college_admin in a prior session
    - If not fixed, apply `CREATE OR REPLACE FUNCTION is_admin()` checking `role IN ('admin', 'owner', 'college_admin')` via Supabase MCP
    - Backward-compatible: existing `admin` users continue to pass the check
    - _Requirements: 7.4_

  - [ ] 2.7 Create SQL bootstrap script for elevated role assignment
    - Write `supabase/schema/bootstrap-elevated-roles.sql` with a parameterized DO block
    - The script grants owner/college_admin roles to specified verified users (requires `email_confirmed_at` non-null)
    - Uses `RAISE NOTICE` for skipped users so one unverified user does not block the rest
    - Links college_admin users to their college via `college_memberships` upsert and sets `colleges.admin_id`
    - No runtime Edge Function or API endpoint for elevation is created
    - _Requirements: 6.1, 6.2, 6.3_

  - [ ]* 2.8 Write property test for handle_new_user role enforcement
    - **Feature: unified-auth-multi-role, Property 6: handle_new_user accepts only student and faculty for self-registration**
    - Test that student/faculty metadata produces the matching active role, and all other valid/invalid roles default to student with the valid ones recorded as pending_role
    - Minimum 100 iterations with randomized role strings
    - **Validates: Requirements 4.1, 4.2**

  - [ ]* 2.9 Write property test for email verification gating non-student roles
    - **Feature: unified-auth-multi-role, Property 4: Email verification gates non-student roles**
    - Test that unverified users always have active role "student" regardless of requested role, with pending_role recording the request
    - Minimum 100 iterations
    - **Validates: Requirements 3.1, 3.2**

  - [ ]* 2.10 Write property test for email verification activation
    - **Feature: unified-auth-multi-role, Property 5: Email verification activates pending roles and memberships**
    - Test that when email_confirmed_at transitions from null to a timestamp, pending_role is promoted to role, pending_role is cleared, and all memberships become active
    - Minimum 100 iterations
    - **Validates: Requirements 3.3, 3.4**

  - [ ]* 2.11 Write property test for multi-role storage independence
    - **Feature: unified-auth-multi-role, Property 3: Multi-role storage independence**
    - Test that changing a role in one college membership does not affect roles in other college memberships for the same user, and that exactly one row exists per (user, college) pair
    - Minimum 100 iterations
    - **Validates: Requirements 2.1, 2.2, 2.3**

  - [ ]* 2.12 Write property test for bootstrap script email verification requirement
    - **Feature: unified-auth-multi-role, Property 8: Bootstrap script requires email verification**
    - Test that the bootstrap script grants elevated roles only when email_confirmed_at is non-null, and skips with a notice otherwise
    - Minimum 100 iterations
    - **Validates: Requirements 6.2**

  - [ ]* 2.13 Write property test for RPC error state preservation
    - **Feature: unified-auth-multi-role, Property 7: RPC error preserves invitation and membership state**
    - Test that when accept_college_invitation() returns an error, invitation status is unchanged and no college_memberships row is created or modified
    - Minimum 100 iterations with randomized error scenarios
    - **Validates: Requirements 5.3**

  - [ ]* 2.14 Write property test for migration preserving non-role profile data
    - **Feature: unified-auth-multi-role, Property 13: Migration role updates preserve non-role profile data**
    - Test that updating the role column leaves all other profile columns (email, full_name, institution, department, phone, location, bio, visibility, profile_completeness) unchanged
    - Minimum 100 iterations with randomized profile rows
    - **Validates: Requirements 10.3_

- [ ] 3. Checkpoint - Database and test infrastructure complete
  - Ensure all applied migrations are verified, ask the user if questions arise.

- [ ] 4. Data access layer fixes
  - [ ] 4.1 Fix rowToProfile() to derive role and collegeId exclusively from the database
    - In `src/lib/supabase-db.ts`, change `role` assignment from `((meta.role as Profile["role"]) || (row.role ?? "student"))` to `(row.role ?? "student")` — discard localStorage meta.role
    - Add `collegeId: row.college_id ?? undefined` mapping (currently not mapped in the Profile object)
    - Keep `getProfileMeta()` for non-role fields (headline, coverPhotoUrl, education, achievements, organizationName, industryDomain, collegeCode, collegeDomain, website)
    - _Requirements: 1.1, 1.2, 8.2_

  - [ ] 4.2 Update signUp() to remove role from localStorage metadata
    - In `src/lib/supabase-db.ts`, remove the `role` field from the `saveProfileMeta()` call in `signUp()`
    - Keep `actual_role` in auth metadata for the trigger to record as pending_role
    - The `safeDbRole` mapping (faculty→faculty, admin/college_admin→admin, else→student) remains unchanged
    - _Requirements: 1.1_

  - [ ] 4.3 Replace acceptInvitation() with acceptCollegeInvitation() RPC wrapper
    - In `src/services/saasService.ts`, remove the `acceptInvitation()` function that queries/updates `college_invitations` and inserts into `college_memberships` using the anon key
    - Add `acceptCollegeInvitation(token: string)` that calls `supabase.rpc("accept_college_invitation", { p_token, p_user_id })` with the authenticated user's ID
    - Handle RPC errors by surfacing the error message without modifying any invitation or membership state
    - Return `{ success, collegeId?, role?, error? }` matching the RPC JSONB response
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ]* 4.4 Write property test for rowToProfile role derivation
    - **Feature: unified-auth-multi-role, Property 1: rowToProfile derives role exclusively from the database**
    - Test that for any DB role R and any localStorage role M (where M differs from R), rowToProfile returns role = R and never M
    - Minimum 100 iterations with randomized DB roles and localStorage roles
    - **Validates: Requirements 1.1, 1.2**

  - [ ]* 4.5 Write property test for rowToProfile collegeId derivation
    - **Feature: unified-auth-multi-role, Property 2: rowToProfile derives collegeId exclusively from the database**
    - Test that for any DB college_id C (including null) and any localStorage metadata, rowToProfile returns collegeId = C and is never influenced by localStorage
    - Minimum 100 iterations
    - **Validates: Requirements 8.2**

- [ ] 5. UI layer fixes (Register.tsx)
  - [ ] 5.1 Replace admin registration form with invitation/bootstrap info panel
    - In `src/pages/Register.tsx`, replace the admin tab registration form (`handleAdminRegistrationSubmit`) with an informational panel
    - The panel explains that college_admin/owner roles cannot be self-registered and directs users to the invitation or bootstrap flow
    - Include a "Proceed to Sign In" link to `/login`
    - Remove the `college_admin` role submission from the admin tab entirely
    - _Requirements: 4.3_

  - [ ] 5.2 Remove acceptInvitation calls from all registration handlers and update industry success message
    - Remove the `acceptInvitation` import from `src/pages/Register.tsx` (replace with just `fetchColleges`)
    - Remove `acceptInvitation()` calls from the student handler (~line 276), faculty handler (~line 331), and industry handler (~line 402)
    - Update the industry tab success message to prompt email verification: "Industry Partner account created! Please verify your email to activate your industry workspace."
    - _Requirements: 5.2_

  - [ ]* 5.3 Write unit test for admin tab redirect behavior
    - Test that selecting the admin tab shows the informational panel with no registration form
    - Test that the "Proceed to Sign In" link navigates to `/login`
    - Test that no elevated role value is submitted from the admin tab
    - **Validates: Requirements 4.3**

- [ ] 6. Edge function authorization
  - [ ] 6.1 Set verify_jwt=true for all active Edge Functions in config.toml
    - In `supabase/config.toml`, change `verify_jwt = false` to `verify_jwt = true` for `analyze-project-fit`, `analyze-skill-score`, and `ai-navigation`
    - Leave `setup-rls-fixes` as `enabled = false, verify_jwt = false` (inactive function)
    - _Requirements: 9.1, 9.2, 9.4_

  - [ ] 6.2 Add role check to analyze-project-fit Edge Function
    - In `supabase/functions/analyze-project-fit/index.ts`, after extracting userId from `ctx.userClaims`, query `profiles.role` via `ctx.supabaseAdmin`
    - Return HTTP 403 if role is not in `["student", "faculty"]`
    - Place the check after the existing user authentication check and before the profile loading section
    - _Requirements: 9.3_

  - [ ] 6.3 Add role check to analyze-skill-score Edge Function
    - In `supabase/functions/analyze-skill-score/index.ts`, add the same role check pattern
    - Required roles: `["student", "faculty", "industry_partner"]`
    - _Requirements: 9.3_

  - [ ] 6.4 Add role check to ai-navigation Edge Function
    - In `supabase/functions/ai-navigation/index.ts`, add the same role check pattern
    - Required roles: `["student", "faculty"]`
    - _Requirements: 9.3_

  - [ ]* 6.5 Write property test for Edge Function role enforcement
    - **Feature: unified-auth-multi-role, Property 12: Edge Function role check enforces required roles**
    - Test that for any caller role R and required role set S, the function returns 200 if R is in S and 403 if R is not in S
    - Mock the Supabase client with varied caller roles across all three functions
    - Minimum 100 iterations
    - **Validates: Requirements 9.3**

- [ ] 7. Verification and wiring
  - [ ] 7.1 Verify AuthContext and ProtectedRoute need no code changes
    - Confirm `AuthContext.tsx` role predicates (isOwner, isAdmin, isCollegeAdmin, isFaculty, isStudent, isStaff, isIndustryPartner) derive exclusively from `profile?.role` (now DB-only after the rowToProfile fix in 4.1)
    - Confirm `collegeId` derives from `profile?.collegeId` (now DB-only after the rowToProfile fix in 4.1)
    - Confirm `ProtectedRoute.tsx` dashboard routing uses `profile?.role` correctly for all seven roles: student→student dashboard, faculty→faculty dashboard, admin/college_admin/owner→admin console, industry_partner→industry dashboard
    - Confirm `refresh()` recomputes all predicates from the updated DB profile
    - Confirm unauthorized route access redirects to the role-appropriate dashboard, not the restricted route
    - No code changes expected — document findings in the task output
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 8.1, 8.2, 8.3_

  - [ ]* 7.2 Write property test for role-based dashboard routing
    - **Feature: unified-auth-multi-role, Property 9: Role-based dashboard routing matches verified role**
    - Test that student routes to student dashboard, faculty routes to faculty dashboard, admin/college_admin/owner route to admin console, industry_partner routes to industry dashboard
    - Minimum 100 iterations with randomized roles
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5**

  - [ ]* 7.3 Write property test for unauthorized route redirect
    - **Feature: unified-auth-multi-role, Property 10: Unauthorized route access redirects to role-appropriate dashboard**
    - Test that a user with role R accessing a route restricted to role S (where R is not in the allowed roles for that route) is redirected to R's dashboard, not S's route
    - Minimum 100 iterations with randomized role/route pairs
    - **Validates: Requirements 7.6**

  - [ ]* 7.4 Write property test for role predicates from database
    - **Feature: unified-auth-multi-role, Property 11: Role predicates derive exclusively from database profile.role**
    - Test that each predicate is true if and only if the DB role matches, and that refresh() recomputes all predicates after a role change
    - Minimum 100 iterations with randomized roles
    - **Validates: Requirements 8.1, 8.3**

- [ ] 8. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties with minimum 100 iterations per test
- Unit tests validate specific examples and edge cases
- Database migrations are applied via Supabase MCP (project ref: mzmhfiaiaflsxkdpfdzl) — write SQL to version-controlled files in `supabase/schema/` and apply via MCP `apply_migration`
- The `platform_role` enum extension (2.1) and `is_admin()` fix (2.6) may already be applied from a prior session — verify before re-applying
- AuthContext and ProtectedRoute require no code changes; the fix is in the data source (rowToProfile in task 4.1)
- All changes are additive — no existing data, accounts, profiles, projects, teams, messages, or uploaded files are deleted (Requirements 10.1, 10.2)
- The college_memberships table already supports one row per (user, college) with an independent role per college — multi-role storage (Requirements 2.2, 2.3) is enabled by the enum extension in task 2.1

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1", "2.5", "2.6", "6.1"] },
    { "id": 1, "tasks": ["2.2", "2.7", "4.1", "4.3", "5.1", "6.2", "6.3", "6.4"] },
    { "id": 2, "tasks": ["2.3", "2.4", "4.2", "5.2", "7.1"] },
    { "id": 3, "tasks": ["2.8", "2.9", "2.10", "2.11", "2.12", "2.13", "2.14", "4.4", "4.5", "5.3", "6.5", "7.2", "7.3", "7.4"] }
  ]
}
```
