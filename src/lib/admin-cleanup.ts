// Admin-level database cleanup functions
import { supabase } from './supabase'

// Global cleanup function that can be called by admins or scheduled jobs
export const runGlobalCleanup = async (adminUserId?: string) => {
  try {
    console.log('Running global database cleanup...')
    
    // If user ID provided, verify they're admin
    if (adminUserId) {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', adminUserId)
        .single()
        
      if (userError || user?.role !== 'admin') {
        throw new Error('Only admins can run global cleanup')
      }
    }

    const results = {
      orphanedMembershipsDeleted: 0,
      pendingRequestsForInactiveDeleted: 0,
      rejectedRequestsDeleted: 0,
      communitiesReactivated: 0,
      communitiesDeactivated: 0
    }

    // Step 1: Cleanup orphaned user_communities records
    const orphanedResult = await supabase.rpc('cleanup_orphaned_memberships')
    if (!orphanedResult.error) {
      results.orphanedMembershipsDeleted = orphanedResult.data || 0
    }

    // Step 2: Cleanup pending requests for inactive communities
    const pendingResult = await supabase.rpc('cleanup_pending_for_inactive')
    if (!pendingResult.error) {
      results.pendingRequestsForInactiveDeleted = pendingResult.data || 0
    }

    // Step 3: Cleanup old rejected requests
    const rejectedResult = await supabase.rpc('cleanup_old_rejected')
    if (!rejectedResult.error) {
      results.rejectedRequestsDeleted = rejectedResult.data || 0
    }

    // Step 4: Reactivate communities with approved members
    const reactivatedResult = await supabase.rpc('reactivate_communities_with_members')
    if (!reactivatedResult.error) {
      results.communitiesReactivated = reactivatedResult.data || 0
    }

    // Step 5: Deactivate communities without members
    const deactivatedResult = await supabase.rpc('deactivate_communities_without_members')
    if (!deactivatedResult.error) {
      results.communitiesDeactivated = deactivatedResult.data || 0
    }

    console.log('Global cleanup completed:', results)
    return { data: results, error: null }
  } catch (error) {
    console.error('Error in global cleanup:', error)
    return { data: null, error }
  }
}

// Individual cleanup function that runs automatically for each user
export const cleanupUserData = async (userId: string) => {
  try {
    console.log(`Running cleanup for user: ${userId}`)
    
    // Cleanup orphaned memberships for this specific user
    const { error: orphanedError } = await supabase
      .from('user_communities')
      .delete()
      .eq('user_id', userId)
      .not('community_id', 'in', '(SELECT id FROM communities)')
    
    if (orphanedError) {
      console.error('Error cleaning orphaned memberships:', orphanedError)
    }

    // Cleanup pending requests for inactive communities for this user
    const { error: pendingError } = await supabase
      .from('user_communities')
      .delete()
      .eq('user_id', userId)
      .eq('status', 'pending')
      .in('community_id', `
        SELECT c.id FROM communities c 
        WHERE c.is_active = false
      `)
    
    if (pendingError) {
      console.error('Error cleaning pending requests:', pendingError)
    }

    // Cleanup old rejected requests for this user (older than 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const { error: rejectedError } = await supabase
      .from('user_communities')
      .delete()
      .eq('user_id', userId)
      .eq('status', 'rejected')
      .lt('joined_at', thirtyDaysAgo.toISOString())
    
    if (rejectedError) {
      console.error('Error cleaning rejected requests:', rejectedError)
    }

    console.log(`Cleanup completed for user: ${userId}`)
    return { data: { success: true }, error: null }
  } catch (error) {
    console.error(`Error cleaning user data for ${userId}:`, error)
    return { data: null, error }
  }
}
