import { supabase } from './supabase'

// Get the India community ID for public complaints
export const getIndiaCommunityId = async (): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('communities')
      .select('id')
      .eq('name', 'India')
      .eq('is_active', true)
      .single()

    if (error) {
      console.error('Error fetching India community:', error)
      return null
    }

    return data?.id || null
  } catch (error) {
    console.error('Error in getIndiaCommunityId:', error)
    return null
  }
}
