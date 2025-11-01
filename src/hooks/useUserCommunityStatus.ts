import { useAuth } from '@/contexts/AuthContext'
import { getUserCommunities } from '@/lib/communities'
import { useState, useEffect } from 'react'

export const useUserCommunityStatus = () => {
  const { user, loading: authLoading } = useAuth()
  const [hasJoinedCommunity, setHasJoinedCommunity] = useState(false)
  const [isCheckingMembership, setIsCheckingMembership] = useState(false)

  useEffect(() => {
    const checkMembership = async () => {
      if (!user) {
        setHasJoinedCommunity(false)
        return
      }

      setIsCheckingMembership(true)
      try {
        const { data: communities } = await getUserCommunities(user.id)
        setHasJoinedCommunity(communities && communities.length > 0)
      } catch (error) {
        console.error('Error checking community membership:', error)
        setHasJoinedCommunity(false)
      } finally {
        setIsCheckingMembership(false)
      }
    }

    checkMembership()
  }, [user])

  return {
    user,
    isLoggedIn: !!user,
    hasJoinedCommunity,
    isCheckingMembership,
    isLoading: authLoading || isCheckingMembership
  }
}
