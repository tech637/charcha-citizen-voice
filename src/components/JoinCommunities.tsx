import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Building2, 
  MapPin, 
  Users, 
  Calendar, 
  CheckCircle, 
  Loader2, 
  Eye, 
  RefreshCw,
  AlertCircle,
  ArrowLeft,
  Flag,
  UserPlus,
  Clock
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getAllCommunities, getCommunityMembers, joinCommunity, getUserCommunities } from '@/lib/communities';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import Navigation from './Navigation';

interface Community {
  id: string;
  name: string;
  description: string;
  location: string;
  latitude?: number;
  longitude?: number;
  admin_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const JoinCommunities = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});
  const [userCommunities, setUserCommunities] = useState<Set<string>>(new Set());
  const [requestedCommunities, setRequestedCommunities] = useState<Set<string>>(new Set());
  const [joiningCommunities, setJoiningCommunities] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchCommunities();
    if (user) {
      fetchUserCommunities();
    }
  }, [user]);

  const fetchCommunities = async () => {
    try {
      setLoading(true);
      const { data, error } = await getAllCommunities();
      if (error) {
        console.error('Error fetching communities:', error);
      } else {
        setCommunities(data || []);
        
        // Fetch member counts for each community
        const counts: Record<string, number> = {};
        for (const community of data || []) {
          try {
            const { data: members } = await getCommunityMembers(community.id);
            counts[community.id] = members?.length || 0;
          } catch (error) {
            console.error(`Error fetching members for ${community.name}:`, error);
            counts[community.id] = 0;
          }
        }
        setMemberCounts(counts);
      }
    } catch (error) {
      console.error('Error fetching communities:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserCommunities = async () => {
    if (!user) return;
    
    try {
      // Fetch ALL memberships (approved, pending, rejected) to properly handle UI state
      const { data, error } = await supabase
        .from('user_communities')
        .select(`
          *,
          communities (*)
        `)
        .eq('user_id', user.id)
        .order('joined_at', { ascending: false });

      if (error) {
        console.error('Error fetching user communities:', error);
      } else {
        // Only approved memberships go into userCommunities set
        const approvedCommunityIds = new Set<string>(
          (data || [])
            .filter((uc: any) => uc.status === 'approved')
            .map((uc: any) => uc.community_id)
        );
        setUserCommunities(approvedCommunityIds);

        // Update requestedCommunities set with pending memberships
        const pendingCommunityIds = new Set<string>(
          (data || [])
            .filter((uc: any) => uc.status === 'pending')
            .map((uc: any) => uc.community_id)
        );
        setRequestedCommunities(pendingCommunityIds);
      }
    } catch (error) {
      console.error('Error fetching user communities:', error);
    }
  };

  const handleJoinCommunity = async (communityId: string, communityName: string) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to join communities",
        variant: "destructive",
      });
      return;
    }

    try {
      setJoiningCommunities(prev => new Set(prev).add(communityId));
      
      const { data, error } = await joinCommunity({ communityId, userId: user.id, role: 'member' });
      
      if (error) {
        throw error;
      }

      // Check if user was already a member
      if (data?.message === 'Already a member of this community') {
        toast({
          title: "Already a Member",
          description: `You are already a member of ${communityName}.`,
        });
        return;
      }

      // Mark as requested (pending). Do NOT add to approved membership set.
      setRequestedCommunities(prev => new Set(prev).add(communityId));

      toast({
        title: "Request Sent",
        description: `Your request to join ${communityName} was sent for approval.`,
      });
    } catch (error: any) {
      console.error('Error joining community:', error);
      toast({
        title: "Error Joining Community",
        description: error.message || "Failed to join community. Please try again.",
        variant: "destructive",
      });
    } finally {
      setJoiningCommunities(prev => {
        const newSet = new Set(prev);
        newSet.delete(communityId);
        return newSet;
      });
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchCommunities();
      if (user) {
        await fetchUserCommunities();
      }
      toast({
        title: "Communities Updated",
        description: "Community list has been refreshed",
      });
    } catch (error) {
      console.error('Error refreshing communities:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const isUserMember = (communityId: string) => {
    return userCommunities.has(communityId);
  };

  const isJoining = (communityId: string) => {
    return joiningCommunities.has(communityId);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return 'Invalid Date';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#E2EEF9]">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#001F3F] mx-auto mb-4"></div>
            <p className="text-[#001F3F]/70" style={{fontFamily: 'Montserrat-SemiBold, Helvetica'}}>Loading communities...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E2EEF9]">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#001F3F] mb-4" style={{fontFamily: 'Montserrat-Bold, Helvetica'}}>
            Join Communities
          </h1>
          <p className="text-[#001F3F]/80 max-w-2xl mx-auto text-base">
            Discover and join communities to connect with others and share local issues. 
            India community is public and available to everyone.
          </p>
        </div>

        {/* Refresh Button */}
        <div className="flex justify-end mb-6">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 text-[#001F3F] border-[#001F3F]/30 hover:bg-[#001F3F]/10"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>

        {/* Communities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {communities.map((community) => (
            <Card key={community.id} className="hover:shadow-xl transition-all duration-300 border border-[#001F3F]/20 shadow-lg hover:border-[#001F3F]/30">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#001F3F] to-[#001F3F]/80 rounded-full flex items-center justify-center shadow-md">
                      {community.name.toLowerCase() === 'india' ? (
                        <Flag className="h-6 w-6 text-white" />
                      ) : (
                        <Building2 className="h-6 w-6 text-white" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-lg text-[#001F3F]" style={{fontFamily: 'Montserrat-SemiBold, Helvetica'}}>
                        {community.name}
                      </CardTitle>
                      <p className="text-sm text-[#001F3F]/70 mt-1">
                        {community.location}
                      </p>
                    </div>
                  </div>
                  <Badge 
                    variant={community.is_active ? "default" : "secondary"} 
                    className={`text-xs px-3 py-1 rounded-full ${
                      community.is_active 
                        ? 'bg-[#001F3F]/10 text-[#001F3F] border border-[#001F3F]/20' 
                        : 'bg-gray-100 text-gray-600 border border-gray-200'
                    }`}
                  >
                    {community.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Description */}
                <p className="text-sm text-[#001F3F]/80 leading-relaxed">
                  {community.description || 'Join this community to connect with others and share local issues.'}
                </p>

                {/* Stats */}
                <div className="flex items-center justify-between text-sm text-[#001F3F]/60 bg-gray-50/50 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-[#001F3F]/70" />
                    <span className="font-medium">
                      {community.name.toLowerCase() === 'india' ? 'All Citizens' : `${memberCounts[community.id] || 0} members`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-[#001F3F]/70" />
                    <span className="font-medium">{formatDate(community.created_at)}</span>
                  </div>
                </div>

                {/* Join Button */}
                <div className="pt-2">
                  {community.name.toLowerCase() === 'india' ? (
                    <div className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white text-center py-3 rounded-lg font-semibold">
                      <Flag className="h-4 w-4 inline mr-2" />
                      Public Community - Auto Joined
                    </div>
                  ) : isUserMember(community.id) ? (
                    <div className="w-full bg-gradient-to-r from-[#001F3F]/90 to-[#001F3F]/70 text-white text-center py-3 rounded-lg font-semibold flex items-center justify-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      You're a Member
                    </div>
                  ) : requestedCommunities.has(community.id) ? (
                    <div className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-white text-center py-3 rounded-lg font-semibold flex items-center justify-center gap-2">
                      <Clock className="h-4 w-4" />
                      Request Pending
                    </div>
                  ) : (
                    <Button 
                      className="w-full bg-gradient-to-r from-[#001F3F] to-[#001F3F]/90 hover:from-[#001F3F]/90 hover:to-[#001F3F] text-white text-sm h-12 shadow-md hover:shadow-lg transition-all duration-200" 
                      disabled={!community.is_active || isJoining(community.id)}
                      onClick={() => handleJoinCommunity(community.id, community.name)}
                      style={{fontFamily: 'Montserrat-SemiBold, Helvetica'}}
                    >
                      {isJoining(community.id) ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Joining...
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4 mr-2" />
                          {community.is_active ? 'Join Community' : 'Inactive'}
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {communities.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="h-16 w-16 text-[#001F3F]/50 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-[#001F3F]" style={{fontFamily: 'Montserrat-Bold, Helvetica'}}>
              No Communities Available
            </h3>
            <p className="text-[#001F3F]/70" style={{fontFamily: 'Montserrat-SemiBold, Helvetica'}}>
              No communities are currently available. Check back later for new communities.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default JoinCommunities;
