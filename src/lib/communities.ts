import { supabase, Community, UserCommunity, Profile } from './supabase'

export interface CreateCommunityData {
  name: string
  description?: string
  location?: string
  latitude?: number
  longitude?: number
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
        admin_id: adminId,
        is_active: true
      })
      .select()
      .single()

    if (communityError) {
      throw communityError
    }

    // Add admin as a member of the community
    const { error: membershipError } = await supabase
      .from('user_communities')
      .insert({
        user_id: adminId,
        community_id: community.id,
        role: 'admin'
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
      .eq('is_active', true)
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
      .eq('is_active', true)
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
      .order('joined_at', { ascending: false })

    if (error) {
      throw error
    }

    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// Join a community
export const joinCommunity = async (communityId: string, userId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_communities')
      .insert({
        user_id: userId,
        community_id: communityId,
        role: 'member'
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
    // Check if user is admin of this community
    const { data: community, error: fetchError } = await supabase
      .from('communities')
      .select('admin_id')
      .eq('id', communityId)
      .single()

    if (fetchError) {
      throw fetchError
    }

    if (community.admin_id !== userId) {
      throw new Error('Only community admin can update the community')
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
    // Check if user is admin of this community
    const { data: community, error: fetchError } = await supabase
      .from('communities')
      .select('admin_id')
      .eq('id', communityId)
      .single()

    if (fetchError) {
      throw fetchError
    }

    if (community.admin_id !== userId) {
      throw new Error('Only community admin can delete the community')
    }

    const { error } = await supabase
      .from('communities')
      .update({ is_active: false })
      .eq('id', communityId)

    if (error) {
      throw error
    }

    return { data: true, error: null }
  } catch (error) {
    return { data: null, error }
  }
}
