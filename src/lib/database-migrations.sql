-- Migration: Complete database schema setup
-- This migration includes all necessary tables and functions for the Charcha platform

-- =============================================
-- Create users table (extends Supabase auth.users)
-- =============================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'citizen' CHECK (role IN ('citizen', 'admin', 'moderator')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for role-based queries
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile and admins can view all" ON public.users
FOR SELECT
USING (
  auth.uid() = id OR
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Users can update their own profile" ON public.users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Anyone can insert their profile" ON public.users
FOR INSERT
WITH CHECK (auth.uid() = id);

-- =============================================
-- Create is_admin() function
-- =============================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- Create communities table
-- =============================================
CREATE TABLE IF NOT EXISTS public.communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  leader_name TEXT,
  leader_email TEXT,
  leader_mobile TEXT,
  leader_address TEXT,
  admin_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_communities_admin_id ON public.communities(admin_id);
CREATE INDEX IF NOT EXISTS idx_communities_is_active ON public.communities(is_active);

ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;

-- =============================================
-- Create user_communities table
-- =============================================
CREATE TABLE IF NOT EXISTS public.user_communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin', 'tenant', 'owner')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  address TEXT,
  block_name VARCHAR(100),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, community_id)
);

CREATE INDEX IF NOT EXISTS idx_user_communities_user_id ON public.user_communities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_communities_community_id ON public.user_communities(community_id);
CREATE INDEX IF NOT EXISTS idx_user_communities_status ON public.user_communities(status);
CREATE INDEX IF NOT EXISTS idx_user_communities_role ON public.user_communities(role);

ALTER TABLE public.user_communities ENABLE ROW LEVEL SECURITY;

-- =============================================
-- Create complaints table
-- =============================================
CREATE TABLE IF NOT EXISTS public.complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  location TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'in-progress', 'resolved', 'closed', 'rejected')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'community')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_complaints_user_id ON public.complaints(user_id);
CREATE INDEX IF NOT EXISTS idx_complaints_community_id ON public.complaints(community_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON public.complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_category ON public.complaints(category);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON public.complaints(created_at DESC);

ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

-- =============================================
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

-- =============================================
-- Ensure user_communities has updated_at and maintain it automatically
-- =============================================
ALTER TABLE public.user_communities
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_user_communities_set_updated_at'
  ) THEN
    CREATE TRIGGER trg_user_communities_set_updated_at
    BEFORE UPDATE ON public.user_communities
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- =============================================
-- Social features: votes and comments for complaints
-- =============================================

-- complaint_votes: one vote per user per complaint
CREATE TABLE IF NOT EXISTS public.complaint_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('up','down')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- prevent duplicate votes by same user on same complaint
CREATE UNIQUE INDEX IF NOT EXISTS ux_complaint_votes_complaint_user
  ON public.complaint_votes (complaint_id, user_id);

CREATE INDEX IF NOT EXISTS idx_complaint_votes_complaint ON public.complaint_votes(complaint_id);
CREATE INDEX IF NOT EXISTS idx_complaint_votes_user ON public.complaint_votes(user_id);

ALTER TABLE public.complaint_votes ENABLE ROW LEVEL SECURITY;

-- Read open to everyone; write allowed to authenticated users
DROP POLICY IF EXISTS "Read complaint_votes" ON public.complaint_votes;
CREATE POLICY "Read complaint_votes" ON public.complaint_votes
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Write complaint_votes (auth users)" ON public.complaint_votes;
CREATE POLICY "Write complaint_votes (auth users)" ON public.complaint_votes
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Update own complaint_votes" ON public.complaint_votes;
CREATE POLICY "Update own complaint_votes" ON public.complaint_votes
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Delete own complaint_votes" ON public.complaint_votes;
CREATE POLICY "Delete own complaint_votes" ON public.complaint_votes
FOR DELETE USING (auth.uid() = user_id);

-- complaint_comments: simple threaded list (no parent id for now)
CREATE TABLE IF NOT EXISTS public.complaint_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_complaint_comments_complaint ON public.complaint_comments(complaint_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_complaint_comments_user ON public.complaint_comments(user_id);

ALTER TABLE public.complaint_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read complaint_comments" ON public.complaint_comments;
CREATE POLICY "Read complaint_comments" ON public.complaint_comments
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Insert complaint_comments (auth users)" ON public.complaint_comments;
CREATE POLICY "Insert complaint_comments (auth users)" ON public.complaint_comments
FOR INSERT WITH CHECK (auth.uid() = user_id AND length(trim(content)) > 0);

DROP POLICY IF EXISTS "Update own complaint_comments" ON public.complaint_comments;
CREATE POLICY "Update own complaint_comments" ON public.complaint_comments
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Delete own complaint_comments" ON public.complaint_comments;
CREATE POLICY "Delete own complaint_comments" ON public.complaint_comments
FOR DELETE USING (auth.uid() = user_id OR public.is_admin());
