-- Fix complaint status update issue
-- The problem is likely RLS policies blocking leaders from updating complaints

-- Step 1: Check current RLS policies on complaints table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'complaints'
ORDER BY policyname;

-- Step 2: Create/Update RLS policy to allow leaders to update complaints
-- Drop existing update policy if it exists
DROP POLICY IF EXISTS "Leaders can update complaints" ON public.complaints;

-- Create new policy that allows leaders to update complaints
CREATE POLICY "Leaders can update complaints" ON public.complaints
FOR UPDATE
TO authenticated
USING (
  -- Allow if user is a leader of the community this complaint belongs to
  EXISTS (
    SELECT 1 FROM public.community_leaders cl
    WHERE cl.user_id = auth.uid()
    AND cl.community_id = complaints.community_id
    AND cl.is_active = true
  )
  OR
  -- Allow if user is the complaint creator
  user_id = auth.uid()
  OR
  -- Allow if user is admin
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- Step 3: Also ensure leaders can read complaints
DROP POLICY IF EXISTS "Leaders can read complaints" ON public.complaints;

CREATE POLICY "Leaders can read complaints" ON public.complaints
FOR SELECT
TO authenticated
USING (
  -- Allow if user is a leader of the community this complaint belongs to
  EXISTS (
    SELECT 1 FROM public.community_leaders cl
    WHERE cl.user_id = auth.uid()
    AND cl.community_id = complaints.community_id
    AND cl.is_active = true
  )
  OR
  -- Allow if user is the complaint creator
  user_id = auth.uid()
  OR
  -- Allow if user is admin
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role = 'admin'
  )
  OR
  -- Allow if complaint is public/community visibility
  visibility_type = 'community'
);
