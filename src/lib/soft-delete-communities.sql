-- Add soft delete functionality to communities
-- Instead of deleting, mark as inactive and remove references

-- Step 1: Check if is_active column exists, if not add it
ALTER TABLE public.communities 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Step 2: Create a function to safely delete communities
CREATE OR REPLACE FUNCTION safe_delete_community(community_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
    complaint_count INTEGER;
BEGIN
    -- Check if community exists
    IF NOT EXISTS (SELECT 1 FROM public.communities WHERE id = community_uuid) THEN
        RETURN json_build_object('success', false, 'error', 'Community not found');
    END IF;
    
    -- Count related complaints
    SELECT COUNT(*) INTO complaint_count 
    FROM public.complaints 
    WHERE community_id = community_uuid;
    
    -- If there are complaints, do soft delete
    IF complaint_count > 0 THEN
        -- Soft delete: mark as inactive and remove admin/assignments
        UPDATE public.complaints 
        SET community_id = NULL 
        WHERE community_id = community_uuid;
        
        UPDATE public.user_communities 
        SET status = 'inactive' 
        WHERE community_id = community_uuid;
        
        UPDATE public.communities 
        SET is_active = false, admin_id = NULL 
        WHERE id = community_uuid;
        
        RETURN json_build_object(
            'success', true, 
            'method', 'soft_delete',
            'complaints_moved', complaint_count,
            'message', 'Community soft deleted. Related complaints unassigned.'
        );
    ELSE
        -- Hard delete if no complaints
        DELETE FROM public.user_communities WHERE community_id = community_uuid;
        DELETE FROM public.complaints WHERE community_id = community_uuid;
        DELETE FROM public.communities WHERE id = community_uuid;
        
        RETURN json_build_object(
            'success', true, 
            'method', 'hard_delete',
            'message', 'Community and all related data deleted.'
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Grant permissions
GRANT EXECUTE ON FUNCTION safe_delete_community TO authenticated;

