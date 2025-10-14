-- Fix complaints foreign key to allow cascade deletion
-- This will automatically delete related complaints when a community is deleted

-- Step 1: Drop the existing foreign key constraint
ALTER TABLE public.complaints 
DROP CONSTRAINT IF EXISTS complaints_community_id_fkey;

-- Step 2: Add new foreign key constraint with CASCADE DELETE
ALTER TABLE public.complaints 
ADD CONSTRAINT complaints_community_id_fkey 
FOREIGN KEY (community_id) 
REFERENCES public.communities(id) 
ON DELETE CASCADE;

-- Step 3: Verify the constraint
SELECT 
    conname as constraint_name,
    conrelid::regclass as table_name,
    confrelid::regclass as referenced_table,
    confdeltype as delete_action
FROM pg_constraint 
WHERE conname = 'complaints_community_id_fkey';

