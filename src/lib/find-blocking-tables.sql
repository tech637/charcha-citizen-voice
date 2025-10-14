-- Find ALL tables that might be blocking community deletion
-- This will identify every table that has foreign key references to communities

-- =============================================
-- STEP 1: Find all foreign key constraints pointing to communities
-- =============================================
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE constraint_type = 'FOREIGN KEY' 
  AND ccu.table_name = 'communities'
ORDER BY tc.table_name;

-- =============================================
-- STEP 2: Check if community exists and what references it
-- =============================================
-- Replace 'd656d56d-e15a-4897-84d7-d65813e2eec4' with your actual community ID
SELECT 'communities' as table_name, COUNT(*) as reference_count 
FROM communities WHERE id = 'd656d56d-e15a-4897-84d7-d65813e2eec4'
UNION ALL
SELECT 'complaints', COUNT(*) FROM complaints WHERE community_id = 'd656d56d-e15a-4897-84d7-d65813e2eec4'
UNION ALL  
SELECT 'user_communities', COUNT(*) FROM user_communities WHERE community_id = 'd656d56d-e15a-4897-84d7-d65813e2eec4'
UNION ALL
SELECT 'community_transactions', COUNT(*) FROM community_transactions WHERE community_id = 'd656d56d-e15a-4897-84d7-d65813e2eec4'
UNION ALL
SELECT 'blocks', COUNT(*) FROM blocks WHERE id = 'd656d56d-e15a-4897-84d7-d65813e2eec4'
UNION ALL
SELECT 'community_feed', COUNT(*) FROM community_feed WHERE community_id = 'd656d56d-e15a-4897-84d7-d65813e2eec4';

-- =============================================
-- STEP 3: Find any OTHER tables that might reference this community
-- =============================================
-- This searches for any table with a column containing community data
SELECT 
    t.table_name,
    c.column_name ctor_name,
    'Found' as status
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE c.table_schema = 'public' 
  AND (c.column_name LIKE '%community%' 
       OR c.column_name LIKE '%comm%'
       OR t.table_name LIKE '%community%'
       OR t.table_name LIKE '%comm%')
ORDER BY t.table_name, c.alumn_name;

