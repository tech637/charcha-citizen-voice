-- Comprehensive debugging script for community deletion issue
-- Run this directly in Supabase SQL Editor to debug the problem

-- =============================================
-- STEP 1: Check if the community exists
-- =============================================
SELECT 
  'Community Search' as check_type,
  id,
  name,
  admin_id,
  is_active,
  created_at
FROM communities 
WHERE id = 'd656d56d-e15a-4897-84d7-d65813e2eec4';

-- =============================================
-- STEP 2: Find ALL foreign key constraints pointing to communities
-- =============================================
SELECT 
    'Foreign Key Constraints' as check_type,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS references_table,
    ccu.column_name AS references_column,
    tc.constraint_name,
    'ACTIVE' as status
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE constraint_type = 'FOREIGN KEY' 
  AND ccu.table_name = 'communities'
ORDER BY tc.table_name;

-- =============================================
-- STEP 3: Check which tables actually have data for this community
-- =============================================
SELECT 'User Communities' as table_name, COUNT(*) as records FROM user_communities WHERE community_id = 'd656d56d-e15a-4897-84d7-d65813e2eec4'
UNION ALL
SELECT 'Complaints', COUNT(*) FROM complaints WHERE community_id = 'd656d56d-e15a-4897-84d7-d65813e2eec4'
UNION ALL
SELECT 'Community Transactions', COUNT(*) FROM community_transactions WHERE community_id = 'd656d56d-e15a-4897-84d7-d65813e2eec4'
UNION ALL
SELECT 'Community Finances', COUNT(*) FROM community_finances WHERE community_id = 'd656d56d-e15a-4897-84d7-d65813e2eec4'
UNION ALL
SELECT 'Blocks', COUNT(*) FROM blocks WHERE community_id = 'd656d56d-e15a-4897-84d7-d65813e2eec4'
UNION ALL
SELECT 'Community Feed', COUNT(*) FROM community_feed WHERE community_id = 'd656d56d-e15a-4897-84d7-d65813e2eec4';

-- =============================================
-- STEP 4: Find ALL tables with community-related columns
-- =============================================
SELECT DISTINCT
  'Table Structure' as check_type,
  t.table_name,
  c.column_name,
  c.data_type,
  'Found' as status
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE c.table_schema = 'public' 
  AND t.table_name NOT LIKE 'pg_%'
  AND t.table_name NOT LIKE 'information_schema%'
  AND (c.column_name LIKE '%community%' 
       OR c.column_name LIKE '%comm%'
       OR t.table_name LIKE '%community%'
       OR t.table_name LIKE '%comm%')
ORDER BY t.table_name, c.column_name;

-- =============================================
-- STEP 5: Check for any unknown constraints that might exist
-- =============================================
SELECT 
  'Constraint Details' as check_type,
  conname as constraint_name,
  contype as constraint_type,
  conrelid::regclass as table_name,
  confrelid::regclass as referenced_table,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE confrelid::regclass::text = 'communities'
ORDER BY conname;


