-- Migration: Fix RLS policies to allow community admins to transfer ownership
-- This fixes the "new row violates row-level security policy for table 'communities'" error

-- =============================================
-- Update communities RLS policy to allow community admins to transfer ownership
-- =============================================

-- Allow community admins to update their own communities (for admin transfer)
DROP POLICY IF EXISTS "Community admin can update own community" ON public.communities;
CREATE POLICY "Community admin can update own community" ON public.communities
FOR UPDATE
USING (
  -- admin_id matches authenticated user OR global admin
  admin_id = auth.uid() OR public.is_admin()
)
WITH CHECK (
  -- admin_id matches authenticated user OR global admin  
  admin_id = auth.uid() OR public.is_admin()
);

-- Ensure the global admin policy still exists (in case it was dropped)
DROP POLICY IF EXISTS "Global admin can update any community" ON public.communities;
CREATE POLICY "Global admin can update any community" ON public.communities
FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- =============================================
-- Also ensure community admins can update user_communities within their communities
-- =============================================

-- Allow community admins to update membership roles within their community
DROP POLICY IF EXISTS "Community admin can update roles in own community" ON public.user_communities;
CREATE POLICY "Community admin can update roles in own community" ON public.user_communities
FOR UPDATE
USING (
  -- Community admin of the community
  EXISTS (
    SELECT 1 FROM public.communities c
    WHERE c.id = user_communities.community_id
      AND c.admin_id = auth.uid()
  )
  OR public.is_admin()
)
WITH CHECK (
  -- Same conditions for updates
  EXISTS (
    SELECT 1 FROM public.communities c
    WHERE c.id = user_communities.community_id
      AND c.admin_id = auth.uid()
  )
  OR public.is_admin()
);
