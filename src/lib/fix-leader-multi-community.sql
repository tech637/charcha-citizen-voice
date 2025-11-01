-- Fix: Allow leaders to be members of multiple communities
-- This migration fixes the unique constraint that prevents leaders from multiple community memberships

-- Step 1: Drop the existing unique constraint that prevents multiple memberships
DROP INDEX IF EXISTS ux_user_communities_single_active;

-- Step 2: Create a function to check if user is a leader
CREATE OR REPLACE FUNCTION public.is_user_active_leader(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM community_leaders 
    WHERE user_id = user_uuid 
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Step 3: Create new constraint using the function (PostgreSQL allows functions in index predicates)
CREATE UNIQUE INDEX ux_user_communities_single_active_except_leaders 
ON user_communities (user_id) 
WHERE status = 'approved' 
AND NOT public.is_user_active_leader(user_id);

-- Step 4: Update the leader membership trigger to handle the new constraint
CREATE OR REPLACE FUNCTION public.ensure_leader_membership()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only run on INSERT or when is_active changes to true
  IF (TG_OP = 'INSERT' AND NEW.is_active = true) OR 
     (TG_OP = 'UPDATE' AND OLD.is_active = false AND NEW.is_active = true) THEN
    
    -- Insert leader as approved member if not already a member
    INSERT INTO public.user_communities (user_id, community_id, role, status, joined_at)
    VALUES (NEW.user_id, NEW.community_id, 'member', 'approved', NOW())
    ON CONFLICT (user_id, community_id)
    DO UPDATE SET 
      role = 'member', 
      status = 'approved',
      updated_at = NOW();
  END IF;
  
  -- Handle leader removal: revoke membership when is_active becomes false
  IF TG_OP = 'UPDATE' AND OLD.is_active = true AND NEW.is_active = false THEN
    -- Remove the user's membership from this community
    DELETE FROM public.user_communities 
    WHERE user_id = NEW.user_id 
    AND community_id = NEW.community_id;
  END IF;
  
  RETURN NEW;
END;
$$;
