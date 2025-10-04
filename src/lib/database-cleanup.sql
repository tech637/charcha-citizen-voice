-- =============================================
-- SYSTEMATIC DATABASE CLEANUP FOR ALL USERS
-- =============================================

-- Automated cleanup procedures that should run periodically
-- This addresses the core data integrity issues across all users

-- =============================================
-- 1. CLEANUP ORPHANED USER_COMMUNITIES RECORDS
-- =============================================

-- Remove all user_communities records that reference non-existent communities
DELETE FROM user_communities 
WHERE community_id NOT IN (SELECT id FROM communities);

-- =============================================
-- 2. CLEANUP PENDING REQUESTS FOR INACTIVE COMMUNITIES
-- =============================================

-- Remove all pending requests for inactive/deleted communities
DELETE FROM user_communities 
WHERE status = 'pending' 
AND community_id IN (
  SELECT id FROM communities WHERE is_active = false
);

-- =============================================
-- 3. CLEANUP REJECTED REQUESTS OLDER THAN 30 DAYS
-- =============================================

-- Remove rejected requests that are older than 30 days
DELETE FROM user_communities 
WHERE status = 'rejected' 
AND joined_at < NOW() - INTERVAL '30 days';

-- =============================================
-- 4. REACTIVATE COMMUNITIES WITH APPROVED MEMBERS
-- =============================================

-- If a community has approved members but is marked inactive, reactivate it
UPDATE communities 
SET is_active = true, 
    updated_at = NOW()
WHERE id IN (
  SELECT DISTINCT community_id 
  FROM user_communities 
  WHERE status = 'approved'
) 
AND is_active = false;

-- =============================================
-- 5. DEACTIVATE COMMUNITIES WITH NO MEMBERS
-- =============================================

-- If a community has no approved members, deactivate it (except admin-created ones)
UPDATE communities 
SET is_active = false, 
    updated_at = NOW()
WHERE id NOT IN (
  SELECT DISTINCT community_id 
  FROM user_communities 
  WHERE status = 'approved'
)
AND is_active = true
AND admin_id IS NOT NULL;  -- Keep admin-created communities active for discovery

-- =============================================
-- 6. CREATE AUTOMATED CLEANUP FUNCTION
-- =============================================

CREATE OR REPLACE FUNCTION cleanup_user_communitiy_data()
RETURNS void AS $$
BEGIN
  -- Cleanup orphaned memberships
  DELETE FROM user_communities 
  WHERE community_id NOT IN (SELECT id FROM communities);
  
  -- Cleanup pending requests for inactive communities
  DELETE FROM user_communities 
  WHERE status = 'pending' 
  AND community_id IN (
    SELECT id FROM communities WHERE is_active = false
  );
  
  -- Cleanup old rejected requests
  DELETE FROM user_communities 
  WHERE status = 'rejected' 
  AND joined_at < NOW() - INTERVAL '30 days';
  
  -- Reactivate communities with approved members
  UPDATE communities 
  SET is_active = true, updated_at = NOW()
  WHERE id IN (
    SELECT DISTINCT community_id 
    FROM user_communities 
    WHERE status = 'approved'
  ) AND is_active = false;
  
  RAISE NOTICE 'Cleanup completed successfully';
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 7. CREATE SCHEDULED CLEANUP (IF USING PG_CRON)
-- =============================================

-- Uncomment these lines if you have pg_cron extension installed
-- -- Run cleanup daily at 2 AM
-- SELECT cron.schedule('daily-cleanup', '0 2 * * *', 'SELECT cleanup_user_communitiy_data();');
