-- =============================================================================
-- SYNAPTRA — Supabase Storage Buckets & Policies
-- Run this in the Supabase SQL Editor (https://app.supabase.com/project/mzmhfiaiaflsxkdpfdzl/editor)
-- =============================================================================

-- ============================================================
-- 1. CREATE BUCKETS
-- ============================================================

-- Profile avatar photos (public — readable by anyone, writable by owner)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars',
    'avatars',
    true,
    5242880,                             -- 5 MB max
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Project documents (private — access controlled per project membership)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'documents',
    'documents',
    false,
    52428800,                            -- 50 MB max
    ARRAY[
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'text/csv',
        'image/jpeg',
        'image/png',
        'image/webp',
        'application/zip',
        'application/x-zip-compressed',
        'application/octet-stream'
    ]
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================================
-- 2. STORAGE RLS POLICIES — AVATARS BUCKET (public)
-- ============================================================

-- Anyone can view avatars (public bucket)
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');

-- Authenticated users can upload their own avatar
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
CREATE POLICY "Authenticated users can upload avatars"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'avatars'
        AND auth.uid() IS NOT NULL
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Users can update their own avatar
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
CREATE POLICY "Users can update own avatar"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'avatars'
        AND auth.uid() IS NOT NULL
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Users can delete their own avatar
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
CREATE POLICY "Users can delete own avatar"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'avatars'
        AND auth.uid() IS NOT NULL
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- ============================================================
-- 3. STORAGE RLS POLICIES — DOCUMENTS BUCKET (private)
-- ============================================================

-- Authenticated users can upload documents to their project folders
-- Path pattern: documents/{project_id}/{timestamp}-{filename}
DROP POLICY IF EXISTS "Project members can upload documents" ON storage.objects;
CREATE POLICY "Project members can upload documents"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'documents'
        AND auth.uid() IS NOT NULL
        AND (
            EXISTS (
                SELECT 1 FROM public.project_members pm
                WHERE pm.project_id = (storage.foldername(name))[1]::uuid
                AND pm.user_id = auth.uid()
                AND pm.status = 'active'
            )
            OR
            EXISTS (
                SELECT 1 FROM public.projects p
                WHERE p.id = (storage.foldername(name))[1]::uuid
                AND p.owner_id = auth.uid()
            )
        )
    );

-- Project members can read documents from their projects
DROP POLICY IF EXISTS "Project members can read documents" ON storage.objects;
CREATE POLICY "Project members can read documents"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'documents'
        AND auth.uid() IS NOT NULL
        AND (
            EXISTS (
                SELECT 1 FROM public.project_members pm
                WHERE pm.project_id = (storage.foldername(name))[1]::uuid
                AND pm.user_id = auth.uid()
                AND pm.status = 'active'
            )
            OR
            EXISTS (
                SELECT 1 FROM public.projects p
                WHERE p.id = (storage.foldername(name))[1]::uuid
                AND p.owner_id = auth.uid()
            )
        )
    );

-- Uploaders and project owners can delete documents
DROP POLICY IF EXISTS "Uploaders and owners can delete documents" ON storage.objects;
CREATE POLICY "Uploaders and owners can delete documents"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'documents'
        AND auth.uid() IS NOT NULL
        AND (
            -- Uploader check: object owner matches authenticated user
            owner = auth.uid()
            OR
            -- Project owner check
            EXISTS (
                SELECT 1 FROM public.projects p
                WHERE p.id = (storage.foldername(name))[1]::uuid
                AND p.owner_id = auth.uid()
            )
        )
    );

-- =============================================================================
-- END OF STORAGE BUCKET SETUP
-- =============================================================================
