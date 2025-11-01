-- Debug query to check community leaders and their user data
-- This will help identify why user details are not showing

-- Check community leaders for Krishna Nagar
SELECT 
  cl.id as leader_id,
  cl.user_id,
  cl.leader_type,
  cl.assigned_at,
  cl.assigned_by,
  u.full_name,
  u.email,
  u.created_at as user_created_at
FROM public.community_leaders cl
LEFT JOIN public.users u ON u.id = cl.user_id
JOIN public.communities c ON c.id = cl.community_id
WHERE c.name ILIKE '%krishna%' OR c.name ILIKE '%nagar%'
AND cl.is_active = true
ORDER BY cl.assigned_at DESC;
