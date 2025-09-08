import { supabase } from './supabase'

// Automatically join user to India community when they sign up
export const autoJoinIndiaCommunity = async (userId: string): Promise<boolean> => {
  try {
    // Get India community ID
    const { data: indiaCommunity, error: communityError } = await supabase
      .from('communities')
      .select('id')
      .eq('name', 'India')
      .eq('is_active', true)
      .single()

    if (communityError || !indiaCommunity) {
      console.error('India community not found:', communityError)
      return false
    }

    // Check if user is already a member
    const { data: existingMembership, error: checkError } = await supabase
      .from('user_communities')
      .select('id')
      .eq('user_id', userId)
      .eq('community_id', indiaCommunity.id)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing membership:', checkError)
      return false
    }

    if (existingMembership) {
      console.log('User already a member of India community')
      return true
    }

    // Add user to India community
    const { error: joinError } = await supabase
      .from('user_communities')
      .insert({
        user_id: userId,
        community_id: indiaCommunity.id,
        role: 'citizen',
        joined_at: new Date().toISOString()
      })

    if (joinError) {
      console.error('Error joining India community:', joinError)
      return false
    }

    console.log('✅ User automatically joined India community')
    return true
  } catch (error) {
    console.error('Error in autoJoinIndiaCommunity:', error)
    return false
  }
}
