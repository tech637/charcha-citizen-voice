import { supabase } from './supabase'

export type LeaderType = 'mp' | 'mla' | 'councillor'

export interface CommunityLeader {
  leader_id: string
  user_id: string
  leader_type: LeaderType
  user_name: string
  user_email: string
  assigned_at: string
  assigned_by_name: string
}

export interface LeaderCommunity {
  community_id: string
  community_name: string
  community_description: string
  community_location: string
  assigned_at: string
}

// Check if user is assigned as leader for a specific community
export const isUserLeader = async (
  userId: string, 
  communityId: string, 
  leaderType: LeaderType
): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('is_user_leader', {
      user_uuid: userId,
      community_uuid: communityId,
      leader_type_text: leaderType
    })

    if (error) {
      console.error('Error checking leader status:', error)
      return false
    }

    return data || false
  } catch (error) {
    console.error('Error in isUserLeader:', error)
    return false
  }
}

// Get all communities where user is assigned as specific leader type
export const getUserLeaderCommunities = async (
  userId: string, 
  leaderType: LeaderType
): Promise<{ data: LeaderCommunity[] | null; error: any }> => {
  try {
    const { data, error } = await supabase.rpc('get_user_leader_communities', {
      user_uuid: userId,
      leader_type_text: leaderType
    })

    if (error) {
      console.error('Error fetching leader communities:', error)
      return { data: null, error }
    }

    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error in getUserLeaderCommunities:', error)
    return { data: null, error }
  }
}

// Get all leaders (MP, MLA, Councillor) for a community
export const getCommunityLeaders = async (
  communityId: string
): Promise<{ data: CommunityLeader[] | null; error: any }> => {
  try {
    // Use a more reliable query approach
    const { data, error } = await supabase
      .from('community_leaders')
      .select(`
        id,
        user_id,
        leader_type,
        assigned_at,
        assigned_by
      `)
      .eq('community_id', communityId)
      .eq('is_active', true)
      .order('assigned_at', { ascending: false })

    if (error) {
      console.error('Error fetching community leaders:', error)
      return { data: null, error }
    }

    if (!data || data.length === 0) {
      return { data: [], error: null }
    }

    // Fetch user details separately for each leader
    const leadersWithUsers = await Promise.all(
      data.map(async (leader) => {
        console.log('Fetching user details for leader:', leader.user_id);
        
        // Get user details
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('full_name, email')
          .eq('id', leader.user_id)
          .single()

        console.log('User data for leader:', userData, 'Error:', userError);

        // Get assigned by user details
        let assignedByUser = null
        if (leader.assigned_by) {
          const { data: assignedByData } = await supabase
            .from('users')
            .select('full_name')
            .eq('id', leader.assigned_by)
            .single()
          assignedByUser = assignedByData
        }

        return {
          leader_id: leader.id,
          user_id: leader.user_id,
          leader_type: leader.leader_type,
          user_name: userData?.full_name || 'Unknown User',
          user_email: userData?.email || 'No Email',
          assigned_at: leader.assigned_at,
          assigned_by_name: assignedByUser?.full_name || 'System'
        }
      })
    )

    return { data: leadersWithUsers, error: null }
  } catch (error) {
    console.error('Error in getCommunityLeaders:', error)
    return { data: null, error }
  }
}

// Assign leader to community (admin only)
export const assignCommunityLeader = async (
  communityId: string,
  userEmail: string,
  leaderType: LeaderType,
  adminId: string
): Promise<{ data: any; error: any }> => {
  try {
    // First verify admin access
    const { data: adminUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', adminId)
      .single()

    if (!adminUser || adminUser.role !== 'admin') {
      throw new Error('Only global admin can assign leaders')
    }

    // Get user ID by email
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, full_name, email')
      .eq('email', userEmail.trim())
      .single()

    if (userError || !userData) {
      throw new Error('User with this email was not found')
    }

    const userId = userData.id

    // Check if leader already assigned for this type
    const { data: existingLeader } = await supabase
      .from('community_leaders')
      .select('id')
      .eq('community_id', communityId)
      .eq('leader_type', leaderType)
      .eq('is_active', true)
      .single()

    if (existingLeader) {
      throw new Error(`${leaderType.toUpperCase()} is already assigned to this community`)
    }

    // Insert new leader assignment
    const { data, error } = await supabase
      .from('community_leaders')
      .insert({
        community_id: communityId,
        user_id: userId,
        leader_type: leaderType,
        assigned_by: adminId,
        is_active: true
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error assigning community leader:', error)
    return { data: null, error }
  }
}

// Remove leader assignment (admin only)
export const removeCommunityLeader = async (
  leaderId: string,
  adminId: string
): Promise<{ data: any; error: any }> => {
  try {
    // First verify admin access
    const { data: adminUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', adminId)
      .single()

    if (!adminUser || adminUser.role !== 'admin') {
      throw new Error('Only global admin can remove leaders')
    }

    // Deactivate leader assignment (soft delete)
    const { data, error } = await supabase
      .from('community_leaders')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', leaderId)
      .select()
      .single()

    if (error) {
      throw error
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error removing community leader:', error)
    return { data: null, error }
  }
}

// Get complaints for leader's community (reuse existing complaint functions)
export const getLeaderComplaints = async (
  communityId: string,
  userId: string,
  leaderType: LeaderType
): Promise<{ data: any[] | null; error: any }> => {
  try {
    // First verify leader access
    const isLeader = await isUserLeader(userId, communityId, leaderType)
    if (!isLeader) {
      throw new Error('You are not assigned as a leader for this community')
    }

    // Get complaints for the community (reuse existing function)
    const { getCommunityComplaints } = await import('./complaints')
    return await getCommunityComplaints(communityId)
  } catch (error) {
    console.error('Error fetching leader complaints:', error)
    return { data: null, error }
  }
}

// Check if user is any type of leader for any community
export const isUserAnyLeader = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('community_leaders')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .limit(1)

    if (error) {
      console.error('Error checking if user is any leader:', error)
      return false
    }

    return (data && data.length > 0) || false
  } catch (error) {
    console.error('Error in isUserAnyLeader:', error)
    return false
  }
}

// Get user's leader type(s) for any community (returns unique types only)
export const getUserLeaderTypes = async (userId: string): Promise<LeaderType[]> => {
  try {
    const { data, error } = await supabase
      .from('community_leaders')
      .select('leader_type')
      .eq('user_id', userId)
      .eq('is_active', true)

    if (error) {
      console.error('Error fetching user leader types:', error)
      return []
    }

    // Return unique leader types only (remove duplicates)
    const uniqueTypes = [...new Set((data || []).map((item: any) => item.leader_type))]
    return uniqueTypes as LeaderType[]
  } catch (error) {
    console.error('Error in getUserLeaderTypes:', error)
    return []
  }
}
