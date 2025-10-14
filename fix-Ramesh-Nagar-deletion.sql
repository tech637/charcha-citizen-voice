-- IMMEDIATE FIX for Ramesh Nagar deletion
-- Run this to manually clean up all blocking references

-- =============================================
-- STEP 1: Clean user_communities (the 5 blocking records)
-- =============================================
DELETE FROM user_communities 
WHERE community_id = 'd656d56d-e15a-4897-84d7-d65813e2eec4';

-- =============================================
-- STEP 2: Unassign complaints (the 5 complaining records)  
-- =============================================
UPDATE complaints 
SET community_id = NULL 
WHERE community_id = 'd656d56d-e15a-4897-84d7-d65813e2eec4';

-- =============================================
-- STEP 3: Clean community_transactions (if any exist)
-- =============================================
DELETE FROM community_transactions 
WHERE community_id = 'd656d56d-e15a-4897-84d7-d65813e2eec4';

-- =============================================
-- STEP 4: Clean blocks table (if any exist)
-- =============================================
DELETE FROM blocks 
WHERE community_id = 'd656d56d-e15a-4897-84d7-d65813e2eec4';

-- =============================================
-- STEP 5: Finally delete the community
-- =============================================
DELETE FROM communities 
WHERE id = 'd656d56d-e15a-4897-84d7-d65813e2eec4';

-- =============================================
-- VERIFICATION: Check if deletion successful
-- =============================================
SELECT 'DELETION STATUS' as check_type,
       CASE 
           WHEN NOT EXISTS (SELECT 1 FROM communities WHERE id = 'd656d56d-e15a-e07-84d7-d65813e2eec4') 
           THEN 'SUCCESS: Community deleted'
           ELSE 'FAILED: Community still exists'
       END as result;


