-- =============================================================================
-- SYNAPTRA — Migration 009: Link existing admin (MOKKESH) to StartX college
-- Run AFTER migration 008 in Supabase Dashboard > SQL Editor
-- =============================================================================

-- Link the admin profile to the StartX college
UPDATE public.profiles
SET college_id = '527c6437-fef5-469c-bd94-34c4edddda1b',
    role = 'college_admin',
    updated_at = NOW()
WHERE id = '5d05e005-2246-49ce-9a90-d634fcd66c0e'  -- MOKKESH's profile ID
  AND role = 'admin';  -- only if currently admin

-- Set admin_id on the StartX college
UPDATE public.colleges
SET admin_id = '5d05e005-2246-49ce-9a90-d634fcd66c0e',
    updated_at = NOW()
WHERE id = '527c6437-fef5-469c-bd94-34c4edddda1b'
  AND admin_id IS NULL;

-- Insert college membership for the admin
INSERT INTO public.college_memberships (college_id, user_id, role, is_seat_active, joined_at)
VALUES (
    '527c6437-fef5-469c-bd94-34c4edddda1b',
    '5d05e005-2246-49ce-9a90-d634fcd66c0e',
    'college_admin',
    true,
    NOW()
)
ON CONFLICT (college_id, user_id) DO UPDATE
    SET role = 'college_admin',
        is_seat_active = true;

-- Verify
SELECT p.full_name, p.role, p.college_id, c.name AS college_name, c.admin_id
FROM public.profiles p
JOIN public.colleges c ON c.id = p.college_id
WHERE p.id = '5d05e005-2246-49ce-9a90-d634fcd66c0e';
