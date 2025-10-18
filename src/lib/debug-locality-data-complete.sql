-- Complete debug query to check locality_data for Krishna Nagar and other Nagar communities
-- This will show us exactly what's in the locality_data field

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
