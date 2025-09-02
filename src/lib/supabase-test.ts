import { createClient } from '@supabase/supabase-js'

// Test different Supabase configurations
const testSupabaseConnection = () => {
  console.log('Testing Supabase connection...')
  
  // Try with environment variables first
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  
  console.log('Environment variables:')
  console.log('VITE_SUPABASE_URL:', supabaseUrl)
  console.log('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Present' : 'Missing')
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing environment variables!')
    console.log('Please create a .env.local file with:')
    console.log('VITE_SUPABASE_URL=https://your-project.supabase.co')
    console.log('VITE_SUPABASE_ANON_KEY=your-anon-key')
    return null
  }
  
  // Create client
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  
  // Test connection
  supabase.auth.getSession().then(({ data, error }) => {
    if (error) {
      console.error('❌ Supabase connection error:', error)
    } else {
      console.log('✅ Supabase connected successfully!')
      console.log('Session:', data.session)
    }
  })
  
  return supabase
}

export default testSupabaseConnection
