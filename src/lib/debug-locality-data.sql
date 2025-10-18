-- Debug query to check locality_data for Krishna Nagar community
-- This will help identify why locality_data is showing as false

SELECT 
  id,
  name,
  description,
  location,
  pincode,
  locality_name,
  locality_data,
  admin_id,
  is_active,
  created_at
FROM public.communities 
WHERE name ILIKE '%krishna%' OR name ILIKE '%nagar%'
ORDER BY created_at DESC;
