-- Comprehensive Community Synchronization Script
-- This ensures strong interlinked logic between communities and user_communities tables

-- =============================================
-- 1. DIAGNOSTIC QUERIES
-- =============================================

-- Check user's current memberships and their community status
SELECT 
  uc.user_id,
  uc.community_id,
  uc.status,
  uc.role,
  u.email,
  c.name as community_name,
  c.is_active,
  c.admin_id,
  c.created_at as community_created,
  uc.joined_at
FROM user_communities uc
LEFT JOIN users u ON uc.user_id = u.id
LEFT JOIN communities c ON uc.community_id = c.id
WHERE u.email = 'msingh.18.2001@gmail.com'
ORDER BY uc.joined_at DESC;

-- Check if Sarita Vihar community exists and its status
SELECT 
  id,
  name,
  is_active,
  admin_id,
  created_at,
  updated_at
FROM communities 
WHERE name ILIKE '%Sarita Vihar%'
ORDER BY created_at DESC;

-- Check all communities with their member counts
SELECT 
  c.id,
  c.name,
  c.is_active,
  c.admin_id,
  COUNT(uc.id) as member_count,
  COUNT(CASE WHEN uc.status = 'approved' THEN 1 END) as approved_members,
  COUNT(CASE WHEN uc.status = 'pending' THEN 1 END) as pending_requests
FROM communities c
LEFT JOIN user_communities uc ON c.id = uc.community_id
GROUP BY c.id, c.name, c.is_active, c.admin_id
ORDER BY member_count DESC, c.created_at DESC;

-- =============================================
-- 2. CLEANUP ORPHANED RECORDS
-- =============================================

-- Clean up user_communities records that reference non-existent communities
DELETE FROM user_communities 
WHERE community_id NOT IN (SELECT id FROM communities);

-- Clean up pending requests for inactive communities
-- (This handles the Sarita Vihar issue)
DELETE FROM user_communities 
WHERE status = 'pending' 
AND community_id IN (
 SELECT id FROM communities WHERE is_active = false
);

-- Clean up rejected memberships older than 30 days
DELETE FROM user_communities 
WHERE status = 'rejected' 
AND joined_at < NOW() - INTERVAL '30 days';

-- =============================================
-- 3. COMMUNITY STATUS CORRECTIONS
-- =============================================

-- For communities with no members, mark as inactive
UPDATE communities 
SET is_active = false
WHERE id NOT IN (
  SELECT DISTINCT community_id 
  FROM user_communities 
  WHERE status = 'approved'
);

-- Reactivate communities that have approved members
-- (This fixes cases where community got deactivated incorrectly)
UPDATE communities 
SET is_active = true
WHERE id IN (
  SELECT DISTINCT community_id 
  FROM user_communities 
  WHERE status = 'approved'
);

-- =============================================
-- 4. VERIFICATION QUERIES
-- =============================================

-- Final check: User's clean memberships
SELECT 
  uc.user_id,
  uc.community_id,
  uc.status,
  uc.role,
  u.email,
  c.name as community_name,
  c.is_active,
  c.admin_id
FROM user_communities uc
LEFT JOIN users u ON uc.user_id = u.id
LEFT JOIN communities c ON uc.community_id = c.id
WHERE u.email = 'msingh.18.2001@gmail.com'
AND c.is_active = true  -- Only show active communities
ORDER BY uc.joined_at DESC;

-- Final check: All active communities with member counts
SELECT 
  c.id,
  c.name,
  c.is_active,
  COUNT(CASE WHEN uc.status = 'approved' THEN 1 END) as approved_members,
  COUNT(CASE WHEN uc.status = 'pending' THEN 1 END) as pending_requests
FROM communities c
LEFT JOIN user_communities uc ON c.id = uc.community_id
WHERE c.is_active = true
GROUP BY c.id, c.name, c.is_active
ORDER BY approved_members DESC;
