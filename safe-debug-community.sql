-- Safe debug script for community deletion issue
-- Run these queries ONE BY ONE in Supabase SQL Editor

-- =============================================
-- QUERY 1: Check if community exists
-- =============================================
SELECT 
  'Community Status' as check_type,
  id,
  name,
  admin_id,
  is_active,
  created_at
FROM communities 
WHERE id = 'd656d56d-e15a-4897-84d7-d65813e2eec4';

-- =============================================
-- QUERY 2: Count blocking records in user_communities
-- =============================================
SELECT 
  'User Communities' as table_name, 
  COUNT(*) as blocking_records 
FROM user_communities 
WHERE community_id = 'd656d56d-e15a-4897-84d7-d65813e2eec4';

-- =============================================
-- QUERY 3: Count blocking records in complaints
-- =============================================
SELECT 
  'Complaints' as table_name, 
  COUNT(*) as blocking_records 
FROM complaints 
WHERE community_id = 'd656d56d-e15a-4897-84d7-d65813e2eec4';

-- =============================================
-- QUERY 4: Find ALL foreign key constraints pointing to communities
-- (This is the most important one!)
-- =============================================
SELECT 
    tc.table_name,
    kcu.column_name,
    tc.constraint_name,
    'BLOCKING CONSTRAINT' as status
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE constraint_type = 'FOREIGN KEY' 
  AND ccu.table_name = 'communities'
ORDER BY tc.table_name;

-- =============================================
-- QUERY 5 (Optional): Check if other tables exist and have community references
-- =============================================
-- Run these only if you want to check specific tables:

-- Check community_transactions table
SELECT 'Community Transactions' as table_name, COUNT(*) as records 
FROM community_transactions 
WHERE community_id = 'd656d56d-e15a-4897-84d7-d65813e2eec4';
-- (Ignore error if table doesn't exist)

-- =============================================
-- SUMMARY
-- =============================================
/*
After running these queries, you should see:

1. Community Status: Shows if Ramesh Nagar exists
2. User Communities: Should be 0 if cleanup worked
3. Complaints: Shows how many complaints still reference this community
4. Foreign Key Constraints: Lists ALL tables that can block deletion

The 4th query is the most important - it will show exactly which 
foreign key constraint is causing the 409 Conflict error.

If complaints count > 0, that's likely the culprit.
If there are other constraints listed, those might be blocking too.
*/






