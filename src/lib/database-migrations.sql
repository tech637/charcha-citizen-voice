-- Migration: Add blocks table and update user_communities table
-- This migration adds support for community blocks and enhanced user community membership

-- Create blocks table
CREATE TABLE IF NOT EXISTS blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_blocks_community_id ON blocks(community_id);
CREATE INDEX IF NOT EXISTS idx_blocks_name ON blocks(name);

-- Add new columns to user_communities table
ALTER TABLE user_communities 
ADD COLUMN IF NOT EXISTS block_id UUID REFERENCES blocks(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS block_name VARCHAR(100), -- For custom block names
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin', 'tenant', 'owner')),
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'));

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_user_communities_block_id ON user_communities(block_id);
CREATE INDEX IF NOT EXISTS idx_user_communities_status ON user_communities(status);
CREATE INDEX IF NOT EXISTS idx_user_communities_role ON user_communities(role);

-- Insert sample blocks for the suggested communities
-- Note: These community IDs should be replaced with actual IDs from your database
INSERT INTO blocks (name, community_id, description) VALUES
  ('Sector 1', (SELECT id FROM communities WHERE name = 'Sarita Vihar' LIMIT 1), 'Residential sector 1'),
  ('Sector 2', (SELECT id FROM communities WHERE name = 'Sarita Vihar' LIMIT 1), 'Residential sector 2'),
  ('Sector 3', (SELECT id FROM communities WHERE name = 'Sarita Vihar' LIMIT 1), 'Commercial sector'),
  ('Phase 1', (SELECT id FROM communities WHERE name = 'Paschim Vihar' LIMIT 1), 'Phase 1 residential'),
  ('Phase 2', (SELECT id FROM communities WHERE name = 'Paschim Vihar' LIMIT 1), 'Phase 2 residential'),
  ('Phase 3', (SELECT id FROM communities WHERE name = 'Paschim Vihar' LIMIT 1), 'Phase 3 residential')
ON CONFLICT DO NOTHING;

-- Update existing user_communities records to have 'approved' status
UPDATE user_communities 
SET status = 'approved' 
WHERE status IS NULL;

-- Add RLS policies for blocks table
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read blocks
CREATE POLICY "Anyone can read blocks" ON blocks
  FOR SELECT USING (true);

-- Policy: Only admins can insert/update/delete blocks
CREATE POLICY "Only admins can manage blocks" ON blocks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM communities c 
      WHERE c.id = blocks.community_id 
      AND c.admin_id = auth.uid()
    )
  );

-- Update RLS policies for user_communities table
-- Policy: Users can read their own memberships
CREATE POLICY "Users can read own memberships" ON user_communities
  FOR SELECT USING (user_id = auth.uid());

-- Policy: Users can insert their own membership requests
CREATE POLICY "Users can create own membership requests" ON user_communities
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Policy: Users can update their own membership details
CREATE POLICY "Users can update own membership details" ON user_communities
  FOR UPDATE USING (user_id = auth.uid());

-- Policy: Community admins can read all memberships in their communities
CREATE POLICY "Community admins can read memberships" ON user_communities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM communities c 
      WHERE c.id = user_communities.community_id 
      AND c.admin_id = auth.uid()
    )
  );

-- Policy: Community admins can update membership status
CREATE POLICY "Community admins can update membership status" ON user_communities
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM communities c 
      WHERE c.id = user_communities.community_id 
      AND c.admin_id = auth.uid()
    )
  );

-- =============================================
-- Finance: community_transactions table and policies
-- =============================================

-- Create community_transactions table (basic finance ledger)
CREATE TABLE IF NOT EXISTS community_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  type VARCHAR(10) NOT NULL CHECK (type IN ('income','expense')),
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ctx_community_id ON community_transactions(community_id);
CREATE INDEX IF NOT EXISTS idx_ctx_created_at ON community_transactions(created_at);

-- Enable RLS
ALTER TABLE community_transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read finance summary/transactions (public read)
CREATE POLICY "Anyone can read community transactions" ON community_transactions
  FOR SELECT USING (true);

-- Policy: Only community admin or global admin can insert/update/delete
CREATE POLICY "Community admins can manage transactions" ON community_transactions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM communities c
      WHERE c.id = community_transactions.community_id
      AND (c.admin_id = auth.uid() OR EXISTS (
        SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin'
      ))
    )
  );

-- Note: UI computes collected/spent/balance from transactions

-- =============================================
-- Migration: Add ON DELETE CASCADE to foreign keys referencing communities
-- This ensures that when a community is deleted, all its related data is also removed.
-- =============================================

-- Add ON DELETE CASCADE to user_communities
ALTER TABLE public.user_communities DROP CONSTRAINT IF EXISTS user_communities_community_id_fkey;
ALTER TABLE public.user_communities
ADD CONSTRAINT user_communities_community_id_fkey
FOREIGN KEY (community_id)
REFERENCES public.communities(id)
ON DELETE CASCADE;

-- Add ON DELETE CASCADE to complaints
ALTER TABLE public.complaints DROP CONSTRAINT IF EXISTS complaints_community_id_fkey;
ALTER TABLE public.complaints
ADD CONSTRAINT complaints_community_id_fkey
FOREIGN KEY (community_id)
REFERENCES public.communities(id)
ON DELETE CASCADE;

-- =============================================
-- Migration: Update RLS policy for users table to allow admin reads
-- =============================================

-- Allow admins to read all user profiles for president assignment
-- First, drop the existing policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own profile." ON public.users;
DROP POLICY IF EXISTS "Allow individual read access" ON public.users;

-- Create a new policy that allows users to view their own profile,
-- and allows admins to view any profile.
CREATE POLICY "Allow users to view own profile and admins to view all" ON public.users
FOR SELECT
USING (
  auth.uid() = id OR
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);

-- =============================================
-- Communities RLS: allow global admins to UPDATE/DELETE any community
-- =============================================

-- Ensure RLS is enabled (noop if already enabled)
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;

-- Allow global admins (checked via public.is_admin()) to update any row
DROP POLICY IF EXISTS "Global admin can update any community" ON public.communities;
CREATE POLICY "Global admin can update any community" ON public.communities
FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Allow global admins to delete any row
DROP POLICY IF EXISTS "Global admin can delete any community" ON public.communities;
CREATE POLICY "Global admin can delete any community" ON public.communities
FOR DELETE
USING (public.is_admin());

-- =============================================
-- RLS for user_communities: allow community admin or global admin to update status
-- =============================================
ALTER TABLE public.user_communities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Community or global admin can update membership status" ON public.user_communities;
CREATE POLICY "Community or global admin can update membership status" ON public.user_communities
FOR UPDATE
USING (
  -- community admin of the record's community
  EXISTS (
    SELECT 1 FROM public.communities c
    WHERE c.id = user_communities.community_id
      AND c.admin_id = auth.uid()
  )
  OR public.is_admin()
);
