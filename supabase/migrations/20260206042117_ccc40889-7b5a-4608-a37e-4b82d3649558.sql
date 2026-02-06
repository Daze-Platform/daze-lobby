-- =====================================================
-- PRODUCTION-GRADE SECURITY: ZERO TRUST MODEL
-- =====================================================

-- 1. HELPER FUNCTION: Check if user is admin (bulletproof admin override)
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin'
  )
$$;

-- 2. HELPER FUNCTION: Get user's assigned hotel_id
CREATE OR REPLACE FUNCTION public.get_user_hotel_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT hotel_id
  FROM public.client_hotels
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- 3. HELPER FUNCTION: Check if user can access a specific hotel
CREATE OR REPLACE FUNCTION public.can_access_hotel(_user_id uuid, _hotel_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    -- Admins and ops_managers can access all hotels
    has_dashboard_access(_user_id)
    OR
    -- Clients can only access their assigned hotel
    EXISTS (
      SELECT 1 FROM public.client_hotels
      WHERE user_id = _user_id AND hotel_id = _hotel_id
    )
$$;

-- =====================================================
-- HOTELS TABLE: Add client read access
-- =====================================================

-- Allow clients to view their assigned hotel
CREATE POLICY "Clients can view their assigned hotel"
ON public.hotels
FOR SELECT
USING (
  id IN (
    SELECT hotel_id FROM public.client_hotels WHERE user_id = auth.uid()
  )
);

-- =====================================================
-- STORAGE BUCKETS: Contracts (Private) & Assets (Public)
-- =====================================================

-- Create contracts bucket (PRIVATE - for signed agreements)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'contracts',
  'contracts',
  false,
  10485760, -- 10MB limit
  ARRAY['application/pdf']::text[] -- PDF only
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['application/pdf']::text[];

-- Create onboarding-assets bucket (PUBLIC - for logos/menus)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'onboarding-assets',
  'onboarding-assets',
  true,
  20971520, -- 20MB limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'application/pdf']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 20971520,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'application/pdf']::text[];

-- =====================================================
-- CONTRACTS BUCKET POLICIES (Private, Secure)
-- =====================================================

-- Policy: Only authenticated clients can upload to their folder
CREATE POLICY "Clients can upload contracts to their folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'contracts'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Clients can only download their own contracts
CREATE POLICY "Clients can download their own contracts"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'contracts'
  AND (
    -- User owns this folder
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    -- Admin override
    is_admin(auth.uid())
  )
);

-- Policy: Admins can upload contracts anywhere
CREATE POLICY "Admins can upload any contracts"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'contracts'
  AND is_admin(auth.uid())
);

-- Policy: Clients can update their own contracts
CREATE POLICY "Clients can update their own contracts"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'contracts'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR is_admin(auth.uid())
  )
);

-- Policy: Clients can delete their own contracts
CREATE POLICY "Clients can delete their own contracts"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'contracts'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR is_admin(auth.uid())
  )
);

-- =====================================================
-- ONBOARDING-ASSETS BUCKET POLICIES (Public read, Auth write)
-- =====================================================

-- Policy: Anyone can view onboarding assets (public bucket)
CREATE POLICY "Public read access for onboarding assets"
ON storage.objects
FOR SELECT
USING (bucket_id = 'onboarding-assets');

-- Policy: Only authenticated users can upload to their folder
CREATE POLICY "Authenticated users can upload onboarding assets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'onboarding-assets'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can update their own assets
CREATE POLICY "Users can update their own onboarding assets"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'onboarding-assets'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR is_admin(auth.uid())
  )
);

-- Policy: Users can delete their own assets
CREATE POLICY "Users can delete their own onboarding assets"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'onboarding-assets'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR is_admin(auth.uid())
  )
);

-- =====================================================
-- UPDATE CLIENT-UPLOADS BUCKET (Existing, add restrictions)
-- =====================================================

-- Update client-uploads bucket with file type restrictions
UPDATE storage.buckets
SET 
  file_size_limit = 20971520,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'application/pdf']::text[]
WHERE id = 'client-uploads';