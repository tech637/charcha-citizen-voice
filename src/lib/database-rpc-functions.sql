-- =============================================
-- SUPABASE RPC FUNCTIONS FOR AUTOMATED CLEANUP
-- =============================================

-- Function 1: Cleanup orphaned memberships
CREATE OR REPLACE FUNCTION cleanup_orphaned_memberships()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM user_communities 
  WHERE community_id NOT IN (SELECT id FROM communities);
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function 2: Cleanup pending requests for inactive communities
CREATE OR REPLACE FUNCTION cleanup_pending_for_inactive()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM user_communities 
  WHERE status = 'pending' 
  AND community_id IN (
    SELECT id FROM communities WHERE is_active = false
  );
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function 3: Cleanup old rejected requests (30+ days)
CREATE OR REPLACE FUNCTION cleanup_old_rejected()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM user_communities 
  WHERE status = 'rejected' 
  AND joined_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function 4: Reactivate communities with approved members
CREATE OR REPLACE FUNCTION reactivate_communities_with_members()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE communities 
  SET is_active = true, 
      updated_at = NOW()
  WHERE id IN (
    SELECT DISTINCT community_id 
    FROM user_communities 
    WHERE status = 'approved'
  ) AND is_active = false;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Function 5: Deactivate communities without any members
CREATE OR REPLACE FUNCTION deactivate_communities_without_members()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE communities 
  SET is_active = false, 
      updated_at = NOW()
  WHERE id NOT IN (
    SELECT DISTINCT community_id 
    FROM user_communities 
    WHERE status = 'approved'
  )
  AND is_active = true
  AND admin_id IS NOT NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- LEADER DASHBOARD RPC FUNCTIONS
-- =============================================

-- Function 6: Check if user is assigned as leader for a community
CREATE OR REPLACE FUNCTION is_user_leader(
  user_uuid UUID,
  community_uuid UUID,
  leader_type_text TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM community_leaders 
    WHERE user_id = user_uuid 
    AND community_id = community_uuid 
    AND leader_type = leader_type_text
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 7: Get all communities where user is assigned as specific leader type
CREATE OR REPLACE FUNCTION get_user_leader_communities(
  user_uuid UUID,
  leader_type_text TEXT
)
RETURNS TABLE (
  community_id UUID,
  community_name TEXT,
  community_description TEXT,
  community_location TEXT,
  assigned_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as community_id,
    c.name as community_name,
    c.description as community_description,
    c.location as community_location,
    cl.assigned_at
  FROM community_leaders cl
  JOIN communities c ON c.id = cl.community_id
  WHERE cl.user_id = user_uuid 
  AND cl.leader_type = leader_type_text
  AND cl.is_active = true
  AND c.is_active = true
  ORDER BY cl.assigned_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 8: Get all leaders (MP, MLA, Councillor) for a community
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
    assigner.full_name as assigned_by_name
  FROM community_leaders cl
  JOIN users u ON u.id = cl.user_id
  JOIN users assigner ON assigner.id = cl.assigned_by
  WHERE cl.community_id = community_uuid 
  AND cl.is_active = true
  ORDER BY cl.leader_type, cl.assigned_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 9: Get user ID by email (for leader assignment)
CREATE OR REPLACE FUNCTION get_user_id_by_email(email_address TEXT)
RETURNS UUID AS $$
DECLARE
  user_uuid UUID;
BEGIN
  SELECT id INTO user_uuid 
  FROM users 
  WHERE email = email_address;
  
  RETURN user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;