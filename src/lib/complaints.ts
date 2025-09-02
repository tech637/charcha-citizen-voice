import { supabase, Complaint, ComplaintFile } from './supabase'

export interface CreateComplaintData {
  category: string
  description: string
  location_address?: string
  latitude?: number
  longitude?: number
  is_public: boolean
  files?: File[]
}

export const createComplaint = async (complaintData: CreateComplaintData, userId: string) => {
  try {
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
        is_public: complaintData.is_public,
        status: 'pending'
      })
      .select()
      .single()

    if (complaintError) {
      throw complaintError
    }

    // If there are files, upload them to Supabase Storage
    if (complaintData.files && complaintData.files.length > 0) {
      const filePromises = complaintData.files.map(async (file) => {
        // Create a unique filename
        const fileExt = file.name.split('.').pop()
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

    return { data: complaint, error: null }
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
    const { data, error } = await supabase
      .from('complaints')
      .select(`
        *,
        complaint_files (*),
        users (full_name)
      `)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      throw error
    }

    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export const updateComplaintStatus = async (complaintId: string, status: string) => {
  try {
    const { data, error } = await supabase
      .from('complaints')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', complaintId)
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
