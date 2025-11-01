-- Check RLS policies on complaints table
-- This will help identify if RLS is blocking complaint updates

-- Check if RLS is enabled on complaints table
SELECT 
  schemaname,
  tablename,
  rowsecurity,
  hasrls
FROM pg_tables 
WHERE tablename = 'complaints';

-- Check existing RLS policies on complaints table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'complaints'
ORDER BY policyname;
