# Requirements Document

## Introduction

SYNAPTRA is a campus research collaboration platform built on React 18, TypeScript, Vite, and Supabase PostgreSQL 17. The platform supports seven platform roles — student, faculty, admin, college_admin, owner, industry_partner, and staff — across a multi-tenant college architecture with 59 tables, all protected by row-level security.

This feature migrates SYNAPTRA to a unified authentication and multi-role model: one account, one authentication system, multiple verified roles, and role-based dashboards. The migration addresses four security gaps identified in the auth audit: a frontend role override via localStorage metadata that lets the client override the database role, a client-side invitation acceptance path that bypasses the JWT-guarded server-side function, missing email verification gating for privileged roles, and Edge Functions with JWT verification disabled and no role checks. The migration preserves all existing accounts, profiles, projects, teams, messages, and uploaded files.

## Glossary

- **System**: The SYNAPTRA platform comprising the React frontend and Supabase PostgreSQL backend.
- **Profile_Mapper**: The rowToProfile function in supabase-db.ts that converts database profile rows to frontend Profile objects.
- **handle_new_user Trigger**: The PostgreSQL trigger function that creates a profiles row when a new auth.users record is inserted during sign-up.
- **accept_college_invitation() Function**: The JWT-guarded, email-checked PostgreSQL function that atomically accepts a college invitation and creates a college_memberships row.
- **AuthContext**: The React context provider in AuthContext.tsx that exposes session, user, profile, and role predicates to the application.
- **ProtectedRoute**: The React component in ProtectedRoute.tsx that enforces route-level role access control and redirects unauthorized users to a role-appropriate dashboard.
- **Registration_Form**: The Register page component in Register.tsx that handles user self-registration across role-specific tabs.
- **Edge Functions**: The three deployed Supabase Edge Functions — analyze-project-fit, analyze-skill-score, ai-navigation — that provide AI analysis capabilities.
- **SQL Bootstrap Script**: A one-time SQL script that grants owner and college_admin roles to specified verified users.
- **Migration**: The process of transitioning the authentication and role system to the unified multi-role model.
- **email_confirmed_at**: The Supabase auth.users column set to a timestamp when a user verifies the email address through the Supabase confirmation flow.
- **profiles.role**: The platform_role enum column in the profiles table storing the user's primary platform-wide role.
- **college_memberships.role**: The column in the college_memberships table storing the user's role within a specific college.
- **college_memberships.is_seat_active**: The boolean column in the college_memberships table indicating whether the membership grants active access to the college.
- **Platform Role**: One of the seven values in the platform_role enum: student, faculty, admin, college_admin, owner, industry_partner, staff.
- **Primary Role**: The platform-wide role stored in profiles.role that governs dashboard routing and platform-level access.
- **College-Scoped Role**: The role a user holds within a specific college, stored in college_memberships.role.
- **Pending Role**: A non-student role requested during registration that the System records but does not activate until email_confirmed_at is set.

## Requirements

### Requirement 1: Authoritative Role Source of Truth

**User Story:** As a platform security officer, I want each user's role to come exclusively from the database profiles.role column, so that the frontend cannot override role assignments through localStorage metadata.

#### Acceptance Criteria

1. THE Profile_Mapper SHALL derive profile.role exclusively from the profiles.role database column and SHALL discard any role value stored in localStorage metadata.
2. WHEN the Profile_Mapper converts a database profile row to a frontend Profile object, THE Profile_Mapper SHALL populate profile.role using the database row's role value without consulting localStorage.

### Requirement 2: Multi-Role Storage Model

**User Story:** As a system architect, I want each user to hold one platform-wide primary role plus independent college-scoped roles, so that a user can serve different roles across multiple colleges without a separate user_roles table.

#### Acceptance Criteria

1. THE System SHALL store each user's platform-wide primary role in the profiles.role column.
2. THE System SHALL store each user's college-scoped roles in the college_memberships.role column, with one row per college per user.
3. WHERE a user belongs to multiple colleges, THE System SHALL maintain an independent college_memberships.role value for each college.

### Requirement 3: Email Verification Hard Gate

**User Story:** As a college administrator, I want non-student roles and college memberships to remain inactive until the user verifies the email address, so that unverified email addresses cannot assume privileged positions or join college rosters.

#### Acceptance Criteria

1. WHILE a user's email_confirmed_at is null, THE System SHALL restrict the user's active profile.role to "student".
2. WHEN a user registers with a non-student role, THE System SHALL record the requested role and SHALL not activate the non-student role until the user's email_confirmed_at is set.
3. WHILE a user's email_confirmed_at is null, THE System SHALL prevent any college_memberships row for that user from setting is_seat_active to true.
4. WHEN Supabase sets email_confirmed_at for a user, THE System SHALL activate the user's pending non-student role and SHALL set is_seat_active to true for the user's pending college memberships.

### Requirement 4: Self-Registration Role Enforcement

**User Story:** As a platform owner, I want self-registration to be limited to student and faculty roles, so that elevated roles cannot be self-assigned through the registration form.

#### Acceptance Criteria

1. THE handle_new_user Trigger SHALL accept only "student" and "faculty" as self-registration roles.
2. IF the handle_new_user Trigger receives a role value other than "student" or "faculty" in user metadata, THEN THE handle_new_user Trigger SHALL default the profile role to "student".
3. WHEN a user selects the admin or college_admin registration tab, THE Registration_Form SHALL not submit an elevated role value and SHALL direct the user to the invitation or bootstrap flow.

### Requirement 5: Server-Side Invitation Acceptance

**User Story:** As a college administrator, I want invitation acceptance to run through the server-side accept_college_invitation() function, so that the process is atomic, JWT-guarded, and email-checked.

#### Acceptance Criteria

1. WHEN a user accepts a college invitation, THE System SHALL invoke the accept_college_invitation() function through an authenticated Supabase RPC call.
2. THE System SHALL remove the client-side acceptInvitation function that queries and updates the college_invitations table and inserts into the college_memberships table using the anon key.
3. IF the accept_college_invitation() function returns an error, THEN THE System SHALL surface the error to the user and SHALL not modify any invitation or membership state.

### Requirement 6: Elevated Role Bootstrap

**User Story:** As a platform owner, I want elevated roles to be assigned through a one-time SQL script, so that I control who receives owner and college_admin privileges without a runtime elevation endpoint.

#### Acceptance Criteria

1. THE System SHALL provide a one-time SQL bootstrap script that grants "owner" and "college_admin" roles to specified verified users.
2. WHEN the SQL bootstrap script grants an elevated role, THE System SHALL require the target user's email_confirmed_at to be non-null.
3. THE System SHALL not provide a runtime Edge Function or API endpoint that elevates a user's role to "owner" or "college_admin".

### Requirement 7: Role-Based Dashboard Routing

**User Story:** As a user, I want to be routed to a dashboard matching my verified role, so that I see the appropriate workspace after signing in.

#### Acceptance Criteria

1. WHEN an authenticated user loads the application, THE ProtectedRoute SHALL route the user to a dashboard based on the user's verified profile.role.
2. WHERE the user's profile.role is "student", THE ProtectedRoute SHALL route the user to the student dashboard.
3. WHERE the user's profile.role is "faculty", THE ProtectedRoute SHALL route the user to the faculty dashboard.
4. WHERE the user's profile.role is "admin", "college_admin", or "owner", THE ProtectedRoute SHALL route the user to the admin console.
5. WHERE the user's profile.role is "industry_partner", THE ProtectedRoute SHALL route the user to the industry dashboard.
6. IF an authenticated user attempts to access a route restricted to a role the user does not hold, THEN THE ProtectedRoute SHALL redirect the user to the role-appropriate dashboard.

### Requirement 8: Role Predicate Integrity

**User Story:** As a developer, I want role predicates in AuthContext to derive from the database-verified profile.role, so that access control decisions are based on authoritative role data.

#### Acceptance Criteria

1. THE AuthContext SHALL compute role predicates — isOwner, isAdmin, isCollegeAdmin, isFaculty, isStudent, isStaff, isIndustryPartner — exclusively from the profile.role value fetched from the database.
2. THE AuthContext SHALL compute collegeId exclusively from the profile.collegeId value fetched from the database.
3. WHEN the profile is refreshed, THE AuthContext SHALL recompute all role predicates from the updated database profile.

### Requirement 9: Edge Function Authorization

**User Story:** As a platform security officer, I want Edge Functions to verify the caller's JWT and role, so that unauthenticated or unauthorized users cannot invoke AI analysis endpoints.

#### Acceptance Criteria

1. THE System SHALL set verify_jwt to true for all active Edge Functions in the Supabase configuration.
2. WHEN an Edge Function receives a request, THE Edge Function SHALL verify the caller's JWT before processing the request.
3. WHEN an Edge Function processes a request, THE Edge Function SHALL verify the caller's role against the required role for that function.
4. IF the caller's JWT is missing or invalid, THEN THE Edge Function SHALL return an HTTP 401 status and SHALL not process the request.

### Requirement 10: Data Preservation

**User Story:** As a platform owner, I want the migration to preserve all existing user data, so that no accounts, profiles, projects, teams, messages, or uploaded files are lost.

#### Acceptance Criteria

1. THE Migration SHALL preserve all existing rows in the profiles, projects, project_members, messages, and storage tables.
2. WHEN the Migration executes, THE System SHALL not delete any existing user account, profile, project, team membership, message, or uploaded file.
3. WHERE the Migration updates role values to align with the authoritative role source, THE System SHALL update only the role column and SHALL preserve all other profile data.
