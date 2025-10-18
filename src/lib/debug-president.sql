-- Debug query to check president/admin data for Krishna Nagar community
-- This will help identify why president details are not showing

-- Check community admin details
SELECT 
  c.id as community_id,
  c.name as community_name,
  c.admin_id,
  c.description,
  c.location,
  u.full_name as admin_name,
  u.email as admin_email,
  u.phone as admin_phone,
  u.created_at as admin_created_at
FROM public.communities c
LEFT JOIN public.users u ON u.id = c.admin_id
WHERE c.name ILIKE '%krishna%' OR c.name ILIKE '%nagar%'
ORDER BY c.created_at DESC;
