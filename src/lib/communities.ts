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

export interface CreateCommunityFromLocalityData {
  locality_name: string
  pincode: string
  locality_data: any // JSON data from locality lookup
  description?: string
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

// Create a new community from locality data (for regular users)
export const createCommunityFromLocality = async (communityData: CreateCommunityFromLocalityData, userId: string) => {
  try {
    // First, check if user has any existing approved memberships
    const { data: existingMembership, error: checkError } = await supabase
      .from('user_communities')
      .select('id, community_id, status, communities!inner(name)')
      .eq('user_id', userId)
      .eq('status', 'approved')
      .maybeSingle()

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError
    }

    // If user has an existing approved membership, prevent creating new community
    if (existingMembership) {
      throw new Error(`You already have an active membership in "${existingMembership.communities?.name}". Please leave your current community first before creating a new one.`)
    }

    // Also check for pending memberships
    const { data: pendingMembership, error: pendingError } = await supabase
      .from('user_communities')
      .select('id, status, communities!inner(name)')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .maybeSingle()

    if (pendingError && pendingError.code !== 'PGRST116') {
      throw pendingError
    }

    // If user has a pending membership, prevent creating new community
    if (pendingMembership) {
      throw new Error(`You already have a pending request for "${pendingMembership.communities?.name}". Please wait for approval or cancel your request before creating a new community.`)
    }

    const { data: community, error: communityError } = await supabase
      .from('communities')
      .insert({
        name: communityData.locality_name,
        description: communityData.description || `Community for ${communityData.locality_name}`,
        location: `${communityData.locality_name}, Pincode: ${communityData.pincode}`,
        pincode: communityData.pincode,
        locality_name: communityData.locality_name,
        locality_data: communityData.locality_data,
        created_by_user: true,
        admin_id: userId,
        is_active: true
      })
      .select()
      .single()

    if (communityError) {
      console.error('Community creation error:', communityError)
      throw communityError
    }

    // Add creator as admin member of the community (approved)
    const { error: membershipError } = await supabase
      .from('user_communities')
      .insert({
        user_id: userId,
        community_id: community.id,
        role: 'admin',
        status: 'approved',
        joined_at: new Date().toISOString()
      })

    if (membershipError) {
      console.error('Error adding creator to community:', membershipError)
      // Don't throw here as community was created successfully
    }

    return { data: community, error: null }
  } catch (error) {
    return { data: null, error }
  }
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

// Get all communities (only active ones with proper member counts)
export const getAllCommunities = async () => {
  try {
    const { data, error } = await supabase
      .from('communities')
      .select(`
        id,
        name,
        description,
        location,
        latitude,
        longitude,
        admin_id,
        is_active,
        pincode,
        locality_name,
        locality_data,
        created_by_user,
        created_at,
        updated_at,
        user_communities!inner(
          user_id,
          status
        )
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    // Process communities to add member counts
    const processedCommunities = data?.map(community => ({
      ...community,
      memberCount: community.user_communities?.filter((uc: any) => uc.status === 'approved').length || 0,
      pendingCount: community.user_communities?.filter((uc: any) => uc.status === 'pending').length || 0,
      // Remove the user_communities array from final result
      user_communities: undefined
    })) || []

    return { data: processedCommunities, error: null }
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
    // First check if user already has an active membership in any other community
    const { data: otherMembership, error: otherError } = await supabase
      .from('user_communities')
      .select('id, community_id, status, communities!inner(name)')
      .eq('user_id', joinData.userId)
      .eq('status', 'approved')
      .neq('community_id', joinData.communityId)
      .maybeSingle()

    if (otherError && otherError.code !== 'PGRST116') {
      throw otherError
    }

    // If user has an active membership in another community, prevent joining
    if (otherMembership) {
      throw new Error(`You already have an active membership in "${otherMembership.communities?.name}". Please leave your current community first before joining another one.`)
    }

    // Check if user has a pending membership in any other community
    const { data: pendingMembership, error: pendingError } = await supabase
      .from('user_communities')
      .select('id, community_id, status, communities!inner(name)')
      .eq('user_id', joinData.userId)
      .eq('status', 'pending')
      .neq('community_id', joinData.communityId)
      .maybeSingle()

    if (pendingError && pendingError.code !== 'PGRST116') {
      throw pendingError
    }

    // If user has a pending membership in another community, prevent joining
    if (pendingMembership) {
      throw new Error(`You already have a pending request for "${pendingMembership.communities?.name}". Please wait for approval or cancel your request before joining another community.`)
    }

    // Check if user already has a membership in this community
    const { data: existingMembership, error: checkError } = await supabase
      .from('user_communities')
      .select('id, status, role')
      .eq('user_id', joinData.userId)
      .eq('community_id', joinData.communityId)
      .maybeSingle()

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError
    }

    // If user already has membership in this community, handle accordingly
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
      
      // If pending or rejected in this community, update the existing record
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

// Enhanced leave community function that handles admin scenarios
export const leaveCommunityWithAdminCheck = async (communityId: string, userId: string) => {
  try {
    // Check if user is admin of this community
    const { data: community, error: communityError } = await supabase
      .from('communities')
      .select('admin_id')
      .eq('id', communityId)
      .single()

    if (communityError) {
      throw communityError
    }

    const isUserAdmin = community.admin_id === userId
    let transferredAdminId = null

    // If user is admin, transfer admin to another member or set to null
    if (isUserAdmin) {
      // Try to find another member to transfer admin to
      const { data: otherMembers, error: membersError } = await supabase
        .from('user_communities')
        .select('user_id')
        .eq('community_id', communityId)
        .neq('user_id', userId)
        .eq('status', 'approved')
        .limit(1)

      if (membersError) {
        console.error('Error finding other members:', membersError)
      }

      // Transfer admin to another member if available, otherwise set to null
      const newAdminId = otherMembers?.[0]?.user_id || null
      transferredAdminId = newAdminId

      if (newAdminId) {
        // Update community admin_id to another member
        const { error: updateError } = await supabase
          .from('communities')
          .update({ admin_id: newAdminId, updated_at: new Date().toISOString() })
          .eq('id', communityId)

        if (updateError) {
          console.error('Error transferring admin ownership (RLS policy may be blocking):', updateError)
          // Don't throw error - user can still leave, just admin transfer failed
        }

        // Also update the new admin's role in user_communities
        const { error: roleUpdateError } = await supabase
          .from('user_communities')
          .update({ role: 'admin', updated_at: new Date().toISOString() })
          .eq('user_id', newAdminId)
          .eq('community_id', communityId)

        if (roleUpdateError) {
          console.error('Error updating new admin role:', roleUpdateError)
        }
      } else {
        // For now, don't update communities table due to RLS restrictions
        // Just log this for admins - they can leave but ownership transfer will need manual action
        console.log('No other members found for admin transfer. Community may need global admin intervention.')
      }
    }

    // Now proceed with the regular leave operation
    const { error } = await supabase
      .from('user_communities')
      .delete()
      .eq('user_id', userId)
      .eq('community_id', communityId)

    if (error) {
      throw error
    }

    return { 
      data: { 
        success: true, 
        transferredAdmin: transferredAdminId,
        message: isUserAdmin 
          ? 'Left community successfully. Admin privileges transfer may require global admin action due to security policies.'
          : 'Left community successfully'
      }, 
      error: null 
    }
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
export const updateCommunity = async (communityId: string, updates: Partial<CreateCommunityData & { locality_data?: any; pincode?: string; locality_name?: string }>, userId: string) => {
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

    console.log('🔍 Updating community with data:', {
      communityId,
      updates: {
        ...updates,
        updated_at: new Date().toISOString()
      }
    });

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
      console.error('❌ Supabase update error:', error);
      throw error
    }

    console.log('✅ Community updated successfully:', data);
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

    // Step 1: Check for related complaints  
    let complaintsData = []
    try {
      const { data } = await supabase
        .from('complaints')
        .select('id')
        .eq('community_id', communityId)
      complaintsData = data || []
    } catch (e) {
      console.log('Complaints table not accessible or no complaints found')
    }

    const complaintsExist = complaintsData && complaintsData.length > 0

    if (complaintsExist) {
      // Step 2: Handle complaints first (unassign them)
      const { error: complaintsError } = await supabase
        .from('complaints')
        .update({ community_id: null })
        .eq('community_id', communityId)

      if (complaintsError) {
        console.error('Error unassigning complaints:', complaintsError)
        throw new Error('Failed to remove community references from complaints')
      }

      console.log('✅ Unassigned complaints from community')
    }

    // Step 3: Delete user_communities records
    const { error: userCommunitiesError } = await supabase
      .from('user_communities')
      .delete()
      .eq('community_id', communityId)

    if (userCommunitiesError) {
      console.error('Error deleting user_communities:', userCommunitiesError)
      throw new Error('Failed to remove community memberships')
    }

    console.log('✅ Deleted user_communities records')

    // Step 4: Finally delete the community
    const { error: communityError } = await supabase
      .from('communities')
      .delete()
      .eq('id', communityId)

    if (communityError) {
      throw communityError
    }

    console.log('✅ Successfully deleted community and all related data')

    return { 
      data: { 
        success: true, 
        message: `Community deleted successfully. ${complaintsExist ? 'Related complaints were unassigned.' : 'No complaints were associated.'}`,
        complaintsUnassigned: complaintsExist 
      }, 
      error: null 
    }
  } catch (error) {
    return { data: null, error }
  }
}

// Enhanced delete community with comprehensive foreign key handling
export const enhancedDeleteCommunity = async (communityId: string, userId: string) => {
  try {
    // Check if user is a global admin
    const isGlobalAdmin = await isUserAdmin(userId)
    if (!isGlobalAdmin) {
      throw new Error('Only super admin can delete the community')
    }

    console.log('🗑️ Starting enhanced community deletion for:', communityId)

    // Step 1: Try using SQL function first
    const { data: sqlResult, error: sqlError } = await supabase.rpc('safe_delete_community', {
      community_uuid: communityId
    })

    if (!sqlError && sqlResult?.success) {
      console.log('✅ Community deleted via SQL function')
      return { data: sqlResult, error: null }
    }

    console.log('📝 SQL function failed or unavailable, using manual approach...')

    // PERMANENT FIX: Step 2 - Based on debug analysis, fix exact blocking order
    const cleanupSteps = [
      // CRITICAL STEP 1: User communities FIRST (foreign key constraint blocks deletion)
      { 
        name: 'user_communities', 
        action: 'delete', 
        table: 'user_communities', 
        where: 'community_id',
        critical: true 
      },
      
      // CRITICAL STEP 2: Complaints - unassign them (don't delete complaints)
      { 
        name: 'complaints', 
        action: 'update', 
        set: { community_id: null }, 
        table: 'complaints', 
        where: 'community_id',
        critical: true 
      },
      
      // STEP 3: Community transactions (foreign key found in debug)
      { 
        name: 'community_transactions', 
        action: 'delete', 
        table: 'community_transactions', 
        where: 'community_id',
        critical: false 
      },
      
      // STEP 4: Blocks table (foreign key found in debug)
      { 
        name: 'blocks', 
        action: 'delete', 
        table: 'blocks', 
        where: 'community_id',
        critical: false 
      },
      
      // FINAL STEP: Delete community last
      { 
        name: 'communities', 
        action: 'delete', 
        table: 'communities', 
        where: 'id',
        critical: true 
      }
    ]

    const results = []
    const criticalErrors = []
    
    for (const step of cleanupSteps) {
      try {
        const stepType = step.critical ? 'CRITICAL' : 'optional'
        console.log(`🔄 Processing ${step.table} (${stepType})...`)
        
        if (step.action === 'update') {
          const { data, error } = await supabase
            .from(step.table)
            .update(step.set)
            .eq(step.where, communityId)
          
          if (error) {
            console.error(`❌ FAILED to update ${step.table}:`, error.message)
            if (step.critical) {
              criticalErrors.push(`CRITICAL: Failed to update ${step.table}: ${error.message}`)
            }
          } else {
            console.log(`✅ Updated ${step.name}`)
            results.push(`Updated ${step.table}`)
          }
        } else if (step.action === 'delete') {
          const { data, error } = await supabase
            .from(step.table)
            .delete()
            .eq(step.where, communityId)
          
          if (error) {
            console.error(`❌ FAILED to delete from ${step.table}:`, error.message)
            if (step.critical) {
              criticalErrors.push(`CRITICAL: Failed to delete from ${step.table}: ${error.message}`)
            }
          } else {
            console.log(`✅ Deleted from ${step.name}`)
            results.push(`Deleted from ${step.table}`)
          }
        }
      } catch (error: any) {
        console.error(`💥 EXCEPTION in ${step.table}:`, error.message)
        if (step.critical) {
          criticalErrors.push(`CRITICAL EXCEPTION: ${step.table}: ${error.message}`)
        }
      }
    }
    
    // Check if any critical steps failed
    if (criticalErrors.length > 0) {
      console.error('🚨 CRITICAL ERRORS:', criticalErrors)
      throw new Error(`Community deletion failed: ${criticalErrors.join('; ')}`)
    }

    return { 
      data: { 
        success: true, 
        message: 'Community deleted via enhanced manual process',
        steps: results,
        method: 'enhanced'
      }, 
      error: null 
    }

  } catch (error) {
    console.error('❌ Enhanced delete failed:', error)
    return { 
      data: null, 
      error,
      message: 'Enhanced deletion failed. Manual database intervention may be required.'
    }
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

// Helper function to check and clean up all memberships for a user (for debugging)
export const debugUserMemberships = async (userId: string) => {
  try {
    const { data: memberships, error } = await supabase
      .from('user_communities')
      .select(`
        id,
        community_id,
        status,
        joined_at,
        communities!inner(name)
      `)
      .eq('user_id', userId)
      .order('joined_at', { ascending: false })

    if (error) {
      console.error('Error fetching user memberships:', error)
      return { data: null, error }
    }

    console.log(`User ${userId} has ${memberships?.length || 0} memberships:`, memberships)
    return { data: memberships, error: null }
  } catch (error) {
    console.error('Error in debugUserMemberships:', error)
    return { data: null, error }
  }
}

// Simple and robust community synchronization
// Global cleanup function that fixes database issues for ALL users
const runGlobalCleanup = async () => {
  try {
    console.log('🌍 Running global database cleanup...');
    
    // Use Supabase RPC functions for efficient bulk cleanup
    const cleanupTasks = [
      supabase.rpc('cleanup_orphaned_memberships'),
      supabase.rpc('cleanup_pending_for_inactive'),
      supabase.rpc('reactivate_communities_with_members'),
      supabase.rpc('deactivate_communities_without_members')
    ];
    
    const results = await Promise.allSettled(cleanupTasks);
    
    const globalResults = {
      orphanedMembershipsDeleted: results[0].status === 'fulfilled' ? results[0].value.data || 0 : 0,
      pendingRequestsDeleted: results[1].status === 'fulfilled' ? results[1].value.data || 0 : 0,
      communitiesReactivated: results[2].status === 'fulfilled' ? results[2].value.data || 0 : 0,
      communitiesDeactivated: results[3].status === 'fulfilled' ? results[3].value.data || 0 : 0
    };
    
    console.log('✅ Global cleanup completed:', globalResults);
    return { data: globalResults, error: null };
  } catch (error) {
    console.warn('⚠️ Global cleanup had issues, but user-specific sync will continue:', error);
    return { data: null, error };
  }
};

export const syncUserCommunities = async (userId: string) => {
  try {
    console.log('🎯 Starting comprehensive community synchronization for user:', userId);
    
    // Step 0: Run global cleanup first - fixes issues for ALL users automatically
    const globalCleanupResult = await runGlobalCleanup();
    const globalCleanupApplied = !!globalCleanupResult.data && !globalCleanupResult.error;
    
    // Step 1: Get all user memberships (simple query)
    const { data: memberships, error: membershipsError } = await supabase
      .from('user_communities')
      .select('*')
      .eq('user_id', userId)

    if (membershipsError) {
      console.error('Error fetching user memberships:', membershipsError)
      return { data: null, error: membershipsError }
    }
    
    console.log(`Found ${memberships?.length || 0} raw memberships`)
    
    if (!memberships || memberships.length === 0) {
      return { 
        data: { 
          cleanedPendingRequests: 0, 
          cleanedInactiveCommunities: 0, 
          cleanedOrphanedRecords: 0, 
          reactivatedCommunities: 0,
          globalCleanupApplied,
          globalCleanupResults: globalCleanupResult.data
        }, 
        error: null 
      }
    }

    const results = {
      cleanedPendingRequests: 0,
      cleanedInactiveCommunities: 0,
      cleanedOrphanedRecords: 0,
      reactivatedCommunities: 0,
      globalCleanupApplied,
      globalCleanupResults: globalCleanupResult.data
    }

    // Step 2: Check each membership against its community
    for (const membership of memberships) {
      console.log(`Checking membership ${membership.id} for community ${membership.community_id}`)
      
      // Get the community details for this membership
      const { data: community, error: communityError } = await supabase
        .from('communities')
        .select('*')
        .eq('id', membership.community_id)
        .single()

      if (communityError) {
        console.log(`Community ${membership.community_id} not found or error:`, communityError.message)
        
        // If community doesn't exist, this is orphaned data - delete it
        if (communityError.code === 'PGRST116') {
          console.log(`Deleting orphaned membership ${membership.id}`)
          const { error: deleteError } = await supabase
            .from('user_communities')
            .delete()
            .eq('id', membership.id)
          
          if (!deleteError) {
            results.cleanedOrphanedRecords++
            console.log(`Successfully deleted orphaned membership ${membership.id}`)
          }
        }
        continue
      }

      console.log(`Community "${community.name}" status： active=${community.is_active}, membership status=${membership.status}`)
      
      // Clean up pending requests for inactive communities
      if (membership.status === 'pending' && !community.is_active) {
        console.log(`Deleting pending request for inactive community: ${community.name}`)
        const { error: deleteError } = await supabase
          .from('user_communities')
          .delete()
          .eq('id', membership.id)
        
        if (!deleteError) {
          results.cleanedPendingRequests++
          console.log(`Successfully deleted pending request for "${community.name}"`)
        }
        continue
      }
      
      // Clean up approved memberships for inactive communities (unless admin)
      if (membership.status === 'approved' && !community.is_active && membership.role !== 'admin') {
        console.log(`Deleting approved membership for inactive community: ${community.name}`)
        const { error: deleteError } = await supabase
          .from('user_communities')
          .delete()
          .eq('id', membership.id)
        
        if (!deleteError) {
          results.cleanedInactiveCommunities++
          console.log(`Successfully deleted membership for inactive community "${community.name}"`)
        }
        continue
      }
      
      // Check if inactive community should be reactivated (has approved members)
      if (!community.is_active && membership.status === 'approved') {
        console.log(`Reactivating community "${community.name}" as it has approved members`)
        const { error: reactivateError } = await supabase
          .from('communities')
          .update({ 
            is_active: true, 
            updated_at: new Date().toISOString() 
          })
          .eq('id', community.id)
        
        if (!reactivateError) {
          results.reactivatedCommunities++
          console.log(`Successfully reactivated community "${community.name}"`)
        }
      }
    }

    console.log('Community synchronization completed:', results)
    return { data: results, error: null }
  } catch (error) {
    console.error('Error in syncUserCommunities:', error)
    return { data: null, error }
  }
}

// Clean up orphaned pending requests (pending requests for non-active communities)
export const cleanupOrphanedRequests = async (userId: string) => {
  try {
    // First, get all pending memberships
    const { data: pendingMemberships, error: fetchError } = await supabase
      .from('user_communities')
      .select(`
        id,
        community_id,
        status,
        communities!inner(id, name, is_active)
      `)
      .eq('user_id', userId)
      .eq('status', 'pending')

    if (fetchError) {
      console.error('Error fetching pending memberships:', fetchError)
      return { data: null, error: fetchError }
    }

    const orphanedRequests = []
    
    // Check each pending membership
    for (const membership of pendingMemberships || []) {
      const community = membership.communities
      if (!community || !community.is_active) {
        // This is an orphaned request - community doesn't exist or is inactive
        orphanedRequests.push(membership.id)
      }
    }

    // Delete orphaned requests
    if (orphanedRequests.length > 0) {
      console.log(`Found ${orphanedRequests.length} orphaned pending requests, cleaning up...`)
      
      const { error: deleteError } = await supabase
        .from('user_communities')
        .delete()
        .in('id', orphanedRequests)

      if (deleteError) {
        console.error('Error cleaning up orphaned requests:', deleteError)
        return { data: null, error: deleteError }
      }
      
      console.log(`Cleaned up ${orphanedRequests.length} orphaned pending requests`)
    }

    return { data: { cleanedCount: orphanedRequests.length }, error: null }
  } catch (error) {
    console.error('Error in cleanupOrphanedRequests:', error)
    return { data: null, error }
  }
}
