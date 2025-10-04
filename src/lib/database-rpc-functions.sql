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
