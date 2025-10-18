-- Fix get_community_leaders RPC function type mismatch
-- The leader_type column is VARCHAR(20) but function returns TEXT

CREATE OR REPLACE FUNCTION get_community_leaders(community_uuid UUID)
RETURNS TABLE (
  leader_id UUID,
  user_id UUID,
  leader_type VARCHAR(20),
  user_name TEXT,
  user_email TEXT,
  assigned_at TIMESTAMPTZ,
  assigned_by_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cl.id as leader_id,
    cl.user_id,
    cl.leader_type,
    u.full_name as user_name,
    u.email as user_email,
    cl.assigned_at,
    COALESCE(assigned_by.full_name, 'System') as assigned_by_name
  FROM public.community_leaders cl
  JOIN public.users u ON u.id = cl.user_id
  LEFT JOIN public.users assigned_by ON assigned_by.id = cl.assigned_by
  WHERE cl.community_id = community_uuid
    AND cl.is_active = true
  ORDER BY cl.assigned_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
