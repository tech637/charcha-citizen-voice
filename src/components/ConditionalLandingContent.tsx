import { useUserCommunityStatus } from '@/hooks/useUserCommunityStatus'
import JoinCommunityForm from './JoinCommunityForm'
import ComplaintForm from './ComplaintForm'
import { Button } from '@/components/ui/button'
import { AlertCircle, Users, FileText, Loader2 } from 'lucide-react'

export const ConditionalLandingContent = () => {
  const { user, isLoggedIn, hasJoinedCommunity, isLoading } = useUserCommunityStatus()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#001F3F] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Not logged in - show join community form
  if (!isLoggedIn) {
    return <JoinCommunityForm />
  }

  // Logged in but not joined any community - show join community form
  if (!hasJoinedCommunity) {
    return (
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
          <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-blue-900 mb-2">Join Your Community</h3>
          <p className="text-blue-700">To file complaints and participate in community discussions, you need to join a community first.</p>
        </div>
        <JoinCommunityForm />
      </div>
    )
  }

  // Logged in and has joined community - show complaint form
  return (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
        <FileText className="h-12 w-12 text-green-600 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-green-900 mb-2">File a Complaint</h3>
        <p className="text-green-700">You're a community member! You can now file complaints and participate in community discussions.</p>
      </div>
      <ComplaintForm stayOnPage={true} />
    </div>
  )
}
