import { supabase, Community, UserCommunity, Profile } from './supabase'

export interface CreateCommunityData {
  name: string
  description?: string
  location?: string
  latitude?: number
  longitude?: number
  leader_name?: string
  leader_email?: string
  leader_mobile?: string
  leader_address?: string
}

export interface JoinCommunityData {
  community_id: string
}

// Get user's role from users table (simple approach)
export const getUserRole = async (userId: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching user role:', error)
      return 'citizen' // Default fallback
    }

    return data?.role || 'citizen'
  } catch (error) {
    console.error('Error in getUserRole:', error)
    return 'citizen' // Default fallback
  }
}

// Check if user is admin
export const isUserAdmin = async (userId: string): Promise<boolean> => {
  const role = await getUserRole(userId)
  return role === 'admin'
}

// Create a new community
export const createCommunity = async (communityData: CreateCommunityData, adminId: string) => {
  try {
    // Check if user is admin
    const isAdmin = await isUserAdmin(adminId)
    if (!isAdmin) {
      throw new Error('Only admins can create communities')
    }

    const { data: community, error: communityError } = await supabase
      .from('communities')
      .insert({
        name: communityData.name,
        description: communityData.description,
        location: communityData.location,
        latitude: communityData.latitude,
        longitude: communityData.longitude,
        leader_name: communityData.leader_name,
        leader_email: communityData.leader_email,
        leader_mobile: communityData.leader_mobile,
        leader_address: communityData.leader_address,
        admin_id: adminId,
        is_active: true
      })
      .select()
      .single()

    if (communityError) {
      throw communityError
    }

    // Add admin as a member of the community (approved)
    const { error: membershipError } = await supabase
      .from('user_communities')
      .insert({
        user_id: adminId,
        community_id: community.id,
        role: 'admin',
        status: 'approved',
        joined_at: new Date().toISOString()
      })

    if (membershipError) {
      console.error('Error adding admin to community:', membershipError)
      // Don't throw here as community was created successfully
    }

    return { data: community, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// Get all communities
export const getAllCommunities = async () => {
  try {
    const { data, error } = await supabase
      .from('communities')
      .select(`
        *,
        user_communities!inner(count)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// Get communities that user can join (not already a member)
export const getAvailableCommunities = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('communities')
      .select(`
        *,
        user_communities!left(count)
      `)
      .not('id', 'in', `(
        SELECT community_id 
        FROM user_communities 
        WHERE user_id = '${userId}'
      )`)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// Get user's communities
export const getUserCommunities = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_communities')
      .select(`
        *,
        communities (*)
      `)
      .eq('user_id', userId)
      .eq('status', 'approved')
      .order('joined_at', { ascending: false })

    if (error) {
      throw error
    }

    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export const getApprovedCommunitiesForUser = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_communities')
      .select(`
        communities!inner(*)
      `)
      .eq('user_id', userId)
      .eq('status', 'approved')

    if (error) throw error

    return { data: (data || []).map((row: any) => row.communities), error: null }
  } catch (error) {
    return { data: [], error }
  }
}

// Join a community (enhanced version with new fields)
export const joinCommunity = async (joinData: {
  communityId: string
  userId: string
  blockId?: string
  blockName?: string
  role: 'member' | 'moderator' | 'admin' | 'tenant' | 'owner'
  address?: string
}) => {
  try {
    // First check if user already has a membership in this community
    const { data: existingMembership, error: checkError } = await supabase
      .from('user_communities')
      .select('id, status, role')
      .eq('user_id', joinData.userId)
      .eq('community_id', joinData.communityId)
      .maybeSingle()

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError
    }

    // If user already has membership, handle accordingly
    if (existingMembership) {
      // If already approved, return success without creating duplicate
      if (existingMembership.status === 'approved') {
        return { 
          data: { 
            id: existingMembership.id, 
            message: 'Already a member of this community' 
          }, 
          error: null 
        }
      }
      
      // If pending or rejected, update the existing record
      const { data, error } = await supabase
        .from('user_communities')
        .update({
          block_id: joinData.blockId || null,
          block_name: joinData.blockName || null,
          role: joinData.role,
          address: joinData.address || null,
          status: 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('id', existingMembership.id)
        .select()
        .single()

      if (error) {
        throw error
      }

      return { data, error: null }
    }

    // If no existing membership, create new one
    const { data, error } = await supabase
      .from('user_communities')
      .insert({
        user_id: joinData.userId,
        community_id: joinData.communityId,
        block_id: joinData.blockId || null,
        block_name: joinData.blockName || null,
        role: joinData.role,
        address: joinData.address || null,
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// Join a community (legacy version for backward compatibility)
export const joinCommunityLegacy = async (communityId: string, userId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_communities')
      .insert({
        user_id: userId,
        community_id: communityId,
        role: 'member',
        status: 'approved' // Legacy joins are auto-approved
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// Leave a community
export const leaveCommunity = async (communityId: string, userId: string) => {
  try {
    const { error } = await supabase
      .from('user_communities')
      .delete()
      .eq('user_id', userId)
      .eq('community_id', communityId)

    if (error) {
      throw error
    }

    return { data: true, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// Get community members
export const getCommunityMembers = async (communityId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_communities')
      .select('*')
      .eq('community_id', communityId)
      .eq('status', 'approved')
      .order('joined_at', { ascending: false })

    if (error) {
      console.error('Error fetching community members:', error)
      return { data: [], error: null } // Return empty array instead of throwing
    }

    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error in getCommunityMembers:', error)
    return { data: [], error: null } // Return empty array instead of throwing
  }
}

// Update community
export const updateCommunity = async (communityId: string, updates: Partial<CreateCommunityData>, userId: string) => {
  try {
    // Check if user is admin of this community OR a global admin
    const { data: community, error: fetchError } = await supabase
      .from('communities')
      .select('admin_id')
      .eq('id', communityId)
      .single()

    if (fetchError) {
      throw fetchError
    }
    
    const isGlobalAdmin = await isUserAdmin(userId);

    if (community.admin_id !== userId && !isGlobalAdmin) {
      throw new Error('Only community admin or a global admin can update the community')
    }

    const { data, error } = await supabase
      .from('communities')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', communityId)
      .select()
      .single()

    if (error) {
      throw error
    }

    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// Delete community
export const deleteCommunity = async (communityId: string, userId: string) => {
  try {
    // Check if user is a global admin
    const isGlobalAdmin = await isUserAdmin(userId)
    if (!isGlobalAdmin) {
      throw new Error('Only super admin can delete the community')
    }

    // Hard delete the community
    const { error } = await supabase
      .from('communities')
      .delete()
      .eq('id', communityId)

    if (error) {
      throw error
    }

    return { data: true, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// Assign/replace community president by email (super admin only)
export const assignCommunityPresident = async (
  communityId: string,
  presidentEmail: string,
  superAdminId: string
): Promise<{ data: any; error: any }> => {
  try {
    // Verify global admin
    const globalAdmin = await isUserAdmin(superAdminId)
    if (!globalAdmin) {
      throw new Error('Only global admin can assign/replace president')
    }

    // Resolve user by email using the secure RPC call
    const { data: userId, error: rpcError } = await supabase.rpc(
      'get_user_id_by_email', 
      { email_address: presidentEmail.trim() }
    )

    if (rpcError || !userId) {
      console.error('RPC get_user_id_by_email error:', rpcError)
      throw new Error('User with this email was not found or an error occurred.')
    }

    const userRow = { id: userId as string }; // We have the ID now

    // Update community admin_id
    const { data: updated, error: updErr } = await supabase
      .from('communities')
      .update({ admin_id: userRow.id, updated_at: new Date().toISOString() })
      .eq('id', communityId)
      .select()
      .single()

    if (updErr) throw updErr

    // Ensure membership exists with admin role
    const { data: membership, error: memCheckErr } = await supabase
      .from('user_communities')
      .select('id')
      .eq('user_id', userRow.id)
      .eq('community_id', communityId)
      .single()

    if (memCheckErr && memCheckErr.code === 'PGRST116') {
      await supabase
        .from('user_communities')
        .insert({
          user_id: userRow.id,
          community_id: communityId,
          role: 'admin',
          status: 'approved',
          joined_at: new Date().toISOString()
        })
    } else if (!memCheckErr && membership) {
      await supabase
        .from('user_communities')
        .update({ role: 'admin', status: 'approved' })
        .eq('id', membership.id)
    }

    return { data: updated, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// Check if user is a member of a specific community
export const isUserMemberOfCommunity = async (userId: string, communityId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('user_communities')
      .select('id')
      .eq('user_id', userId)
      .eq('community_id', communityId)
      .eq('status', 'approved')
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking community membership:', error)
      return false
    }

    return !!data
  } catch (error) {
    console.error('Error in isUserMemberOfCommunity:', error)
    return false
  }
}

// Get user's membership status for multiple communities
export const getUserCommunityMemberships = async (userId: string, communityIds: string[]): Promise<Record<string, boolean>> => {
  try {
    const { data, error } = await supabase
      .from('user_communities')
      .select('community_id')
      .eq('user_id', userId)
      .in('community_id', communityIds)

    if (error) {
      console.error('Error fetching community memberships:', error)
      return {}
    }

    const memberships: Record<string, boolean> = {}
    communityIds.forEach(id => {
      memberships[id] = false
    })

    data?.forEach(membership => {
      memberships[membership.community_id] = true
    })

    return memberships
  } catch (error) {
    console.error('Error in getUserCommunityMemberships:', error)
    return {}
  }
}

// Get approved communities for a user (id, name)
export const getUserApprovedCommunities = async (userId: string): Promise<{ data: Array<{ id: string; name: string }>, error: any }> => {
  try {
    const { data, error } = await supabase
      .from('user_communities')
      .select(`
        community_id,
        communities!inner(id, name)
      `)
      .eq('user_id', userId)
      .eq('status', 'approved')

    if (error) {
      throw error
    }

    const mapped = (data || []).map((row: any) => ({ id: row.communities.id, name: row.communities.name }))
    return { data: mapped, error: null }
  } catch (error) {
    return { data: [], error }
  }
}

// Get pending membership requests for a community (admin only)
export const getPendingMembershipRequests = async (communityId: string, adminId: string) => {
  try {
    // Check if user is admin of the community OR a global admin
    const { data: community, error: communityError } = await supabase
      .from('communities')
      .select('admin_id')
      .eq('id', communityId)
      .single()

    if (communityError) {
      throw communityError
    }

    const globalAdmin = await isUserAdmin(adminId)
    if (community.admin_id !== adminId && !globalAdmin) {
      throw new Error('Only community admin or global admin can view pending requests')
    }

    // First fetch pending requests with block relation only
    const { data: requests, error } = await supabase
      .from('user_communities')
      .select(`
        *,
        blocks (name)
      `)
      .eq('community_id', communityId)
      .eq('status', 'pending')
      .order('joined_at', { ascending: false })

    if (error) {
      throw error
    }

    const pending = requests || []
    if (pending.length === 0) {
      return { data: [], error: null }
    }

    // Fetch user details from public.users separately and merge
    const userIds = Array.from(new Set(pending.map((r: any) => r.user_id)))
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, full_name, email')
      .in('id', userIds)

    if (usersError) {
      // If user fetch fails, still return requests without user details
      return { data: pending, error: null }
    }

    const idToUser: Record<string, { id: string; full_name?: string | null; email?: string | null }> = {}
    usersData?.forEach(u => { idToUser[u.id] = u })

    const merged = pending.map((r: any) => ({
      ...r,
      users: idToUser[r.user_id] || null,
    }))

    return { data: merged, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// Approve or reject membership request (admin only)
export const updateMembershipStatus = async (
  membershipId: string, 
  status: 'approved' | 'rejected', 
  adminId: string
) => {
  try {
    // Check if user is admin of the community OR a global admin
    const { data: membership, error: membershipError } = await supabase
      .from('user_communities')
      .select(`
        *,
        communities!inner(admin_id)
      `)
      .eq('id', membershipId)
      .maybeSingle()

    if (membershipError) {
      throw membershipError
    }

    const globalAdmin = await isUserAdmin(adminId)
    if (membership && membership.communities?.admin_id !== adminId && !globalAdmin) {
      throw new Error('Only community admin or global admin can update membership status')
    }

    const { data, error } = await supabase
      .from('user_communities')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', membershipId)
      ;

    if (error) {
      throw error
    }

    // Fire-and-forget email notification when approved
    if (status === 'approved') {
      try {
        await supabase.functions.invoke('send-approval-email', {
          body: { membershipId }
        })
      } catch (notifyErr) {
        console.error('Email notification failed (non-blocking):', notifyErr)
      }
    }

    return { data: null, error: null }
  } catch (error) {
    return { data: null, error }
  }
}
