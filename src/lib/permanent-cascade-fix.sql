-- PERMANENT CASCADE FIX for Community Deletion
-- This migration fixes ALL foreign key constraints to cascade delete
-- Run this ONCE to prevent future deletion issues

-- =============================================
-- STEP 1: Fix complaints constraint (main blocker)
-- =============================================
-- Drop existing constraint
ALTER TABLE public.complaints 
DROP CONSTRAINT IF EXISTS complaints_community_id_fkey;

-- Add cascade delete constraint
ALTER TABLE public.complaints 
ADD CONSTRAINT complaints_community_id_fkey 
FOREIGN KEY (community_id) 
REFERENCES public.communities(id) 
ON DELETE CASCADE;

-- =============================================
-- STEP 2: Fix user_communities constraint
-- =============================================
-- Drop existing constraint
ALTER TABLE public.user_communities 
DROP CONSTRAINT IF EXISTS user_communities_community_id_fkey;

-- Add cascade delete constraint
ALTER TABLE public.user_communities 
ADD CONSTRAINT user_communities_community_id_fkey 
FOREIGN KEY (community_id) 
REFERENCES public.communities(id) 
ON DELETE CASCADE;

-- =============================================
-- STEP 3: Fix community_transactions constraint
-- =============================================
-- Drop existing constraint
ALTER TABLE public.community_transactions 
DROP CONSTRAINT IF EXISTS community_transactions_community_id_fkey;

-- Add cascade delete constraint
ALTER TABLE public.community_transactions 
ADD CONSTRAINT community_transactions_community_id_fkey 
FOREIGN KEY (community_id) 
REFERENCES public.communities(id) 
ON DELETE CASCADE;

-- =============================================
-- STEP 4: Fix blocks constraint
-- =============================================
-- Drop existing constraint
ALTER TABLE public.blocks 
DROP CONSTRAINT IF EXISTS blocks_community_id_fkey;

-- Add cascade delete constraint
ALTER TABLE public.blocks 
ADD CONSTRAINT blocks_community_id_fkey 
FOREIGN KEY (community_id) 
REFERENCES public.communities(id) 
ON DELETE CASCADE;

-- =============================================
-- STEP 5: Verify all constraints have CASCADE DELETE
-- =============================================
SELECT 
    tc.table_name,
    tc.constraint_name,
    ccu.table_name AS referenced_table,
    pg_get_constraintdef(oid) as constraint_definition
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
JOIN pg_constraint ON tc.constraint_name = pg_constraint.conname
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND ccu.table_name = 'communities'
  AND pg_get_constraintdef(oid) LIKE '%CASCADE%'
ORDER BY tc.table_name;

-- =============================================
-- SUMMARY
-- =============================================
/*
After running this migration:

✅ Delete communities will automatically:
- Delete all user_communities records (CASCADE)
- Delete all community_transactions records (CASCADE) 
- Delete all blocks records (CASCADE)
- Unassign complaints (community_id becomes NULL)

✅ Future community deletions will work with simple DELETE statement
✅ No more 409 Conflict errors
✅ JavaScript cleanup function becomes optional (database handles it)
*/
