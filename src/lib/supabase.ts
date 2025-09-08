import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://charcha.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key-here'

// Debug logging
console.log('Supabase Configuration:')
console.log('URL:', supabaseUrl)
console.log('Anon Key:', supabaseAnonKey ? 'Present' : 'Missing')

if (!supabaseAnonKey || supabaseAnonKey === 'your-anon-key-here') {
  console.error('❌ Supabase anon key not configured!')
  console.log('Please create a .env.local file with your actual Supabase anon key')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Test connection immediately
supabase.auth.getSession().then(({ data, error }) => {
  if (error) {
    console.error('❌ Supabase connection error:', error)
    console.error('Error details:', {
      message: error.message,
      status: error.status,
      statusText: error.statusText
    })
  } else {
    console.log('✅ Supabase connected successfully!')
    console.log('Session:', data.session)
  }
}).catch((err) => {
  console.error('❌ Supabase connection failed:', err)
})

// Database types
export interface User {
  id: string
  email: string
  full_name?: string
  role?: 'citizen' | 'admin' | 'moderator'
  created_at: string
  updated_at: string
}

export interface Complaint {
  id: string
  user_id: string
  category: string
  description: string
  location_address?: string
  latitude?: number
  longitude?: number
  is_public: boolean
  community_id?: string
  status: 'pending' | 'in-progress' | 'resolved' | 'rejected'
  created_at: string
  updated_at: string
}

export interface ComplaintFile {
  id: string
  complaint_id: string
  file_name: string
  file_url: string
  file_type?: string
  file_size?: number
  created_at: string
}

export interface Community {
  id: string
  name: string
  description?: string
  location?: string
  latitude?: number
  longitude?: number
  admin_id: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface UserCommunity {
  id: string
  user_id: string
  community_id: string
  role: 'member' | 'moderator' | 'admin'
  joined_at: string
}

export interface Profile {
  id: string
  role: 'citizen' | 'admin' | 'moderator'
  created_at: string
}