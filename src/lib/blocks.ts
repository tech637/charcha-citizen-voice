import { supabase, Block } from './supabase'

// Get blocks for a specific community
export const getCommunityBlocks = async (communityId: string) => {
  try {
    const { data, error } = await supabase
      .from('blocks')
      .select('*')
      .eq('community_id', communityId)
      .order('name', { ascending: true })

    if (error) {
      throw error
    }

    return { data: data || [], error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// Create a new block
export const createBlock = async (blockData: {
  name: string
  community_id: string
  description?: string
}, adminId: string) => {
  try {
    // Check if user is admin of the community
    const { data: community, error: communityError } = await supabase
      .from('communities')
      .select('admin_id')
      .eq('id', blockData.community_id)
      .single()

    if (communityError) {
      throw communityError
    }

    if (community.admin_id !== adminId) {
      throw new Error('Only community admin can create blocks')
    }

    const { data, error } = await supabase
      .from('blocks')
      .insert({
        name: blockData.name,
        community_id: blockData.community_id,
        description: blockData.description
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

// Update a block
export const updateBlock = async (blockId: string, updates: {
  name?: string
  description?: string
}, adminId: string) => {
  try {
    // Check if user is admin of the community that owns this block
    const { data: block, error: blockError } = await supabase
      .from('blocks')
      .select(`
        *,
        communities!inner(admin_id)
      `)
      .eq('id', blockId)
      .single()

    if (blockError) {
      throw blockError
    }

    if (block.communities.admin_id !== adminId) {
      throw new Error('Only community admin can update blocks')
    }

    const { data, error } = await supabase
      .from('blocks')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', blockId)
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

// Delete a block
export const deleteBlock = async (blockId: string, adminId: string) => {
  try {
    // Check if user is admin of the community that owns this block
    const { data: block, error: blockError } = await supabase
      .from('blocks')
      .select(`
        *,
        communities!inner(admin_id)
      `)
      .eq('id', blockId)
      .single()

    if (blockError) {
      throw blockError
    }

    if (block.communities.admin_id !== adminId) {
      throw new Error('Only community admin can delete blocks')
    }

    const { error } = await supabase
      .from('blocks')
      .delete()
      .eq('id', blockId)

    if (error) {
      throw error
    }

    return { data: true, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

