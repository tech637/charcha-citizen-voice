-- Update complaint status enum values
-- Old: pending, in_progress, resolved, rejected
-- New: acknowledged, forwarded, resolved

-- Step 1: Update existing data to map old values to new values
UPDATE public.complaints 
SET status = CASE 
  WHEN status = 'pending' THEN 'acknowledged'
  WHEN status = 'in_progress' THEN 'forwarded'
  WHEN status = 'in-progress' THEN 'forwarded'
  WHEN status = 'resolved' THEN 'resolved'
  WHEN status = 'rejected' THEN 'resolved'
  ELSE status
END;

-- Step 2: Add new check constraint (drop old one first if exists)
ALTER TABLE public.complaints 
DROP CONSTRAINT IF EXISTS complaints_status_check;

ALTER TABLE public.complaints 
ADD CONSTRAINT complaints_status_check 
CHECK (status IN ('acknowledged', 'forwarded', 'resolved'));

-- Step 3: Verify the update
SELECT status, COUNT(*) as count 
FROM public.complaints 
GROUP BY status
ORDER BY status;

