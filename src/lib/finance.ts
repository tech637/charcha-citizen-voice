import { supabase } from './supabase'
import { isUserAdmin } from './communities'

export type CommunityTransactionType = 'income' | 'expense'

export interface CommunityFinanceSummary {
  collected: number
  spent: number
  balance: number
}

export interface CommunityTransaction {
  id: string
  community_id: string
  type: CommunityTransactionType
  amount: number
  note?: string | null
  created_at: string
}

export const getCommunityTransactions = async (
  communityId: string,
  limit: number = 10
): Promise<{ data: CommunityTransaction[]; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('community_transactions')
      .select('*')
      .eq('community_id', communityId)
      .order('created_at', { ascending: false })
      .limit(limit)

    // If table doesn't exist or other error, return empty array
    if (error) {
      console.warn('Finance transactions table not available:', error.message)
      return { data: [], error: null }
    }

    return { data: (data as CommunityTransaction[]) || [], error: null }
  } catch (error) {
    console.warn('Finance transactions error:', error)
    return { data: [], error: null }
  }
}

export const getCommunityFinanceSummary = async (
  communityId: string
): Promise<{ data: CommunityFinanceSummary; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('community_transactions')
      .select('type, amount')
      .eq('community_id', communityId)

    // If table doesn't exist or other error, return default values
    if (error) {
      console.warn('Finance table not available:', error.message)
      return { data: { collected: 0, spent: 0, balance: 0 }, error: null }
    }

    let collected = 0
    let spent = 0

    ;(data || []).forEach((row: any) => {
      const amount = Number(row.amount || 0)
      if (row.type === 'income') collected += amount
      else if (row.type === 'expense') spent += amount
    })

    const summary: CommunityFinanceSummary = {
      collected: Number(collected.toFixed(2)),
      spent: Number(spent.toFixed(2)),
      balance: Number((collected - spent).toFixed(2))
    }

    return { data: summary, error: null }
  } catch (error) {
    console.warn('Finance summary error:', error)
    return { data: { collected: 0, spent: 0, balance: 0 }, error: null }
  }
}

export const addCommunityTransaction = async (
  params: {
    communityId: string
    type: CommunityTransactionType
    amount: number
    note?: string
  },
  actorUserId: string
): Promise<{ data: CommunityTransaction | null; error: any }> => {
  try {
    // Allow community admin (president) or global admin to add transactions
    const { data: community, error: communityError } = await supabase
      .from('communities')
      .select('admin_id')
      .eq('id', params.communityId)
      .single()

    if (communityError) throw communityError

    const isGlobalAdmin = await isUserAdmin(actorUserId)
    const isCommunityAdmin = community?.admin_id === actorUserId

    if (!isGlobalAdmin && !isCommunityAdmin) {
      throw new Error('Only community admin or global admin can add transactions')
    }

    const { data, error } = await supabase
      .from('community_transactions')
      .insert({
        community_id: params.communityId,
        type: params.type,
        amount: params.amount,
        note: params.note || null,
      })
      .select()
      .single()

    if (error) throw error

    return { data: data as CommunityTransaction, error: null }
  } catch (error) {
    return { data: null, error }
  }
}
