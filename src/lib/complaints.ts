import { supabase, Complaint, ComplaintFile } from './supabase'

/**
 * Complaint Creation with New Visibility System
 * 
 * The complaint system now supports two visibility types:
 * 1. 'private' - Only visible to the user who created it
 * 2. 'community' - Visible to members of a specific community
 * 
 * Usage Examples:
 * 
 * // Create a private complaint (backwards compatible)
 * const privateComplaint = {
 *   category: 'garbage',
 *   description: 'Garbage not collected',
 *   is_public: false,
 *   // ... other fields
 * }
 * 
 * // Create a community complaint using new system
 * const communityComplaint = createComplaintData({
 *   category: 'garbage',
 *   description: 'Garbage not collected',
 *   visibility: { type: 'community', community_id: 'uuid-here' }
 * })
 * 
 * // Create a private complaint using new system
 * const privateComplaintNew = createComplaintData({
 *   category: 'garbage',
 *   description: 'Garbage not collected',
 *   visibility: 'private'
 * })
 */

export interface CreateComplaintData {
  category: string
  description: string
  location_address?: string
  latitude?: number
  longitude?: number
  is_public: boolean
  community_id?: string
  files?: File[]
  // New visibility system
  visibility_type?: 'private' | 'community'
}

// Helper function to create complaint data with new visibility system
export const createComplaintData = (options: {
  category: string
  description: string
  location_address?: string
  latitude?: number
  longitude?: number
  files?: File[]
  visibility: 'private' | { type: 'community', community_id: string }
}): CreateComplaintData => {
  const baseData = {
    category: options.category,
    description: options.description,
    location_address: options.location_address,
    latitude: options.latitude,
    longitude: options.longitude,
    files: options.files,
  }

  if (options.visibility === 'private') {
    return {
      ...baseData,
      visibility_type: 'private',
      is_public: false,
      community_id: undefined,
    }
  } else {
    return {
      ...baseData,
      visibility_type: 'community',
      is_public: true,
      community_id: options.visibility.community_id,
    }
  }
}

export const createComplaint = async (complaintData: CreateComplaintData, userId: string) => {
  try {
    // Determine visibility settings based on the new logic
    let visibility_type: 'private' | 'community'
    let is_public: boolean
    let community_id: string | null = null

    if (complaintData.visibility_type) {
      // New visibility system
      visibility_type = complaintData.visibility_type
      if (visibility_type === 'community' && complaintData.community_id) {
        is_public = true
        community_id = complaintData.community_id
      } else {
        is_public = false
        community_id = null
      }
    } else {
      // Backwards compatibility - use existing is_public logic
      is_public = complaintData.is_public
      if (is_public) {
        visibility_type = 'community'
        community_id = complaintData.community_id || null
      } else {
        visibility_type = 'private'
        community_id = null
      }
    }

    // First, create the complaint
    const { data: complaint, error: complaintError } = await supabase
      .from('complaints')
      .insert({
        user_id: userId,
        category: complaintData.category,
        description: complaintData.description,
        location_address: complaintData.location_address,
        latitude: complaintData.latitude,
        longitude: complaintData.longitude,
        is_public: is_public,
        visibility_type: visibility_type,
        community_id: community_id,
        status: 'acknowledged'
      })
      .select()
      .single()

    if (complaintError) {
      throw complaintError
    }

    // If complaint is community-based, ensure user is a member of that community
    if (visibility_type === 'community' && community_id) {
      try {
        // Check if user is already a member
        const { data: existingMembership, error: membershipCheckError } = await supabase
          .from('user_communities')
          .select('id')
          .eq('user_id', userId)
          .eq('community_id', community_id)
          .single()

        // If not a member, add them automatically
        if (membershipCheckError && membershipCheckError.code === 'PGRST116') {
          const { error: joinError } = await supabase
            .from('user_communities')
            .insert({
              user_id: userId,
              community_id: community_id,
              role: 'member'
            })

          if (joinError) {
            console.warn('Failed to auto-join user to community:', joinError)
            // Don't throw error here as complaint was created successfully
          } else {
            console.log('User automatically joined community:', community_id)
          }
        }
      } catch (error) {
        console.warn('Error handling community membership:', error)
        // Don't throw error here as complaint was created successfully
      }
    }

    // Handle file uploads
    if (complaintData.files && complaintData.files.length > 0) {
      const filePromises = complaintData.files.map(async (file) => {
        // Check if file has a valid name
        if (!file || !file.name) {
          console.warn('Skipping file without name:', file)
          return
        }
        
        // Create a unique filename
        const fileExt = file.name.split('.').pop() || 'bin'
        const fileName = `${complaint.id}/${Date.now()}.${fileExt}`
        
        // Upload file to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('complaint-files')
          .upload(fileName, file)

        if (uploadError) {
          throw uploadError
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('complaint-files')
          .getPublicUrl(fileName)

        // Save file reference to database
        const { error: fileError } = await supabase
          .from('complaint_files')
          .insert({
            complaint_id: complaint.id,
            file_name: file.name,
            file_url: urlData.publicUrl,
            file_type: file.type,
            file_size: file.size
          })

        if (fileError) {
          throw fileError
        }
      })

      await Promise.all(filePromises)
    }

    // Return the complaint with the new fields
    const responseData = {
      id: complaint.id,
      title: complaint.category, // Using category as title for now
      visibility_type: visibility_type,
      is_public: is_public,
      community_id: community_id,
      ...complaint // Include all other complaint fields
    }

    return { data: responseData, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export const getUserComplaints = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('complaints')
      .select(`
        *,
        complaint_files (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export const getPublicComplaints = async () => {
  try {
    // First try the new visibility_type system
    const { data: newData, error: newError } = await supabase
      .from('complaints')
      .select(`
        *,
        complaint_files (*),
        users (full_name),
        communities (name, location, is_active)
      `)
      .eq('visibility_type', 'community')
      .order('created_at', { ascending: false })
      .limit(20)

    if (!newError && newData && newData.length > 0) {
      console.log('complaints.ts: Using new visibility_type query, found:', newData?.length || 0, 'complaints');
      return { data: newData, error: null }
    }

    console.warn('complaints.ts: New visibility_type query failed, falling back to is_public:', newError);
    
    // Fallback to old is_public system for backward compatibility
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('complaints')
      .select(`
        *,
        complaint_files (*),
        users (full_name),
        communities (name, location, is_active)
      `)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(20)

    if (fallbackError) {
      console.error('complaints.ts: Both new and fallback queries failed:', fallbackError);
      throw fallbackError
    }

    console.log('complaints.ts: Using fallback is_public query, found:', fallbackData?.length || 0, 'complaints');
    return { data: fallbackData, error: null }
  } catch (error: any) {
    console.error('complaints.ts: Error in getPublicComplaints:', error);
    return { 
      data: null, 
      error: {
        message: error.message || 'Failed to fetch public complaints',
        details: error.details || null,
        hint: error.hint || null
      }
    }
  }
}

// New function to get complaints for a specific community
export const getCommunityComplaints = async (communityId: string) => {
  try {
    const { data, error } = await supabase
      .from('complaints')
      .select(`
        *,
        complaint_files (*),
        users (full_name),
        communities (name, location, is_active)
      `)
      .eq('community_id', communityId)
      .eq('visibility_type', 'community')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('complaints.ts: Supabase error for community complaints:', error);
      throw error
    }

    return { data, error: null }
  } catch (error: any) {
    console.error('complaints.ts: Error in getCommunityComplaints:', error);
    return { 
      data: null, 
      error: {
        message: error.message || 'Failed to fetch community complaints',
        details: error.details || null,
        hint: error.hint || null
      }
    }
  }
}

// New function to get all community complaints (for India community)
export const getAllCommunityComplaints = async () => {
  try {
    const { data, error } = await supabase
      .from('complaints')
      .select(`
        *,
        complaint_files (*),
        users (full_name),
        communities (name, location, is_active)
      `)
      .eq('visibility_type', 'community')
      .not('community_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('complaints.ts: Supabase error for all community complaints:', error);
      throw error
    }

    return { data, error: null }
  } catch (error: any) {
    console.error('complaints.ts: Error in getAllCommunityComplaints:', error);
    return { 
      data: null, 
      error: {
        message: error.message || 'Failed to fetch all community complaints',
        details: error.details || null,
        hint: error.hint || null
      }
    }
  }
}

export const updateComplaintStatus = async (complaintId: string, status: string) => {
  try {
    console.log('Updating complaint status:', { complaintId, status });
    
    const { data, error } = await supabase
      .from('complaints')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', complaintId)
      .select()
      .maybeSingle()

    if (error) {
      console.error('Error updating complaint status:', error);
      throw error
    }

    console.log('Complaint status updated successfully:', data);
    return { data, error: null }
  } catch (error) {
    console.error('Exception in updateComplaintStatus:', error);
    return { data: null, error }
  }
}

// ===== Social: Votes =====
export const upsertComplaintVote = async (complaintId: string, userId: string, vote: 'up' | 'down') => {
  try {
    const { error } = await supabase
      .from('complaint_votes')
      .upsert({ complaint_id: complaintId, user_id: userId, vote_type: vote }, { onConflict: 'complaint_id,user_id' })

    if (error) throw error
    return { data: true, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export const removeComplaintVote = async (complaintId: string, userId: string) => {
  try {
    const { error } = await supabase
      .from('complaint_votes')
      .delete()
      .eq('complaint_id', complaintId)
      .eq('user_id', userId)

    if (error) throw error
    return { data: true, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export const getComplaintVoteSummary = async (complaintId: string) => {
  try {
    const { data, error } = await supabase
      .from('complaint_votes')
      .select('vote_type')
      .eq('complaint_id', complaintId)

    if (error) throw error
    const up = (data || []).filter(v => v.vote_type === 'up').length
    const down = (data || []).filter(v => v.vote_type === 'down').length
    return { data: { up, down }, error: null }
  } catch (error) {
    return { data: { up: 0, down: 0 }, error }
  }
}

export const getUserVoteForComplaint = async (complaintId: string, userId: string) => {
  try {
    const { data, error } = await supabase
      .from('complaint_votes')
      .select('vote_type')
      .eq('complaint_id', complaintId)
      .eq('user_id', userId)
      .maybeSingle()

    if (error && (error as any).code !== 'PGRST116') throw error
    return { data: (data?.vote_type as 'up' | 'down' | undefined) || null, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// ===== Social: Comments =====
export const listComplaintComments = async (complaintId: string) => {
  try {
    const { data, error } = await supabase
      .from('complaint_comments')
      .select('*, users(full_name)')
      .eq('complaint_id', complaintId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: [], error }
  }
}

export const addComplaintComment = async (complaintId: string, userId: string, content: string) => {
  try {
    const trimmed = content.trim()
    if (!trimmed) throw new Error('Comment cannot be empty')

    const { data, error } = await supabase
      .from('complaint_comments')
      .insert({ complaint_id: complaintId, user_id: userId, content: trimmed })
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}
