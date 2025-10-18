-- Migration: Add community_leaders table for MP/MLA/Councillor assignments
-- This migration creates the leader assignment system separate from Presidents

-- Create community_leaders table
CREATE TABLE IF NOT EXISTS community_leaders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  leader_type VARCHAR(20) NOT NULL CHECK (leader_type IN ('mp', 'mla', 'councillor')),
  assigned_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint: one leader per type per community
CREATE UNIQUE INDEX IF NOT EXISTS ux_community_leaders_type_community 
  ON community_leaders (community_id, leader_type) 
  WHERE is_active = true;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_community_leaders_community_id ON community_leaders(community_id);
CREATE INDEX IF NOT EXISTS idx_community_leaders_user_id ON community_leaders(user_id);
CREATE INDEX IF NOT EXISTS idx_community_leaders_leader_type ON community_leaders(leader_type);
CREATE INDEX IF NOT EXISTS idx_community_leaders_active ON community_leaders(is_active);

-- Enable RLS
ALTER TABLE community_leaders ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read active leader assignments
DROP POLICY IF EXISTS "Anyone can read active leader assignments" ON community_leaders;
CREATE POLICY "Anyone can read active leader assignments" ON community_leaders
  FOR SELECT USING (is_active = true);

-- Policy: Only global admins can insert/update/delete
DROP POLICY IF EXISTS "Only global admins can manage leader assignments" ON community_leaders;
CREATE POLICY "Only global admins can manage leader assignments" ON community_leaders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role = 'admin'
    )
  );

-- Function to auto-add leader as approved community member
CREATE OR REPLACE FUNCTION public.ensure_leader_membership()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only run on INSERT or when is_active changes to true
  IF (TG_OP = 'INSERT' AND NEW.is_active = true) OR 
     (TG_OP = 'UPDATE' AND OLD.is_active = false AND NEW.is_active = true) THEN
    
    -- Insert leader as approved member if not already a member
    INSERT INTO public.user_communities (user_id, community_id, role, status, joined_at)
    VALUES (NEW.user_id, NEW.community_id, 'member', 'approved', NOW())
    ON CONFLICT (user_id, community_id)
    DO UPDATE SET 
      role = 'member', 
      status = 'approved',
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to enforce membership when leader is assigned
DROP TRIGGER IF EXISTS trg_ensure_leader_membership ON public.community_leaders;
CREATE TRIGGER trg_ensure_leader_membership
  AFTER INSERT OR UPDATE OF is_active ON public.community_leaders
  FOR EACH ROW EXECUTE FUNCTION public.ensure_leader_membership();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.set_community_leaders_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Trigger to maintain updated_at
DROP TRIGGER IF EXISTS trg_community_leaders_set_updated_at ON public.community_leaders;
CREATE TRIGGER trg_community_leaders_set_updated_at
  BEFORE UPDATE ON public.community_leaders
  FOR EACH ROW EXECUTE FUNCTION public.set_community_leaders_updated_at();
