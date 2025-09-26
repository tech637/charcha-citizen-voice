import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Building2, 
  Users, 
  Calendar, 
  CheckCircle, 
  Loader2, 
  Eye, 
  RefreshCw,
  Flag,
  UserPlus,
  Clock
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getAllCommunities, getCommunityMembers, joinCommunity, getUserCommunities } from '@/lib/communities';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { EmptyState } from './EmptyState';

interface Community {
  id: string;
  name: string;
  description: string;
  location: string;
  is_active: boolean;
  created_at: string;
}

const JoinCommunities = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});
  const [userMemberships, setUserMemberships] = useState<Map<string, 'approved' | 'pending' | 'rejected'>>(new Map());
  const [joiningCommunities, setJoiningCommunities] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: communitiesData, error: communitiesError } = await getAllCommunities();
      if (communitiesError) throw communitiesError;
      
      const activeCommunities = (communitiesData || []).filter(c => c.is_active);
      setCommunities(activeCommunities);
      
      const counts: Record<string, number> = {};
      for (const community of activeCommunities) {
        try {
          const { data: members } = await getCommunityMembers(community.id);
          counts[community.id] = members?.length || 0;
        } catch {
          counts[community.id] = 0;
        }
      }
      setMemberCounts(counts);

      if (user) {
        const { data: memberships, error } = await supabase
          .from('user_communities')
          .select('community_id, status')
          .eq('user_id', user.id);
        if (error) throw error;
        const membershipsMap = new Map((memberships || []).map(m => [m.community_id, m.status]));
        setUserMemberships(membershipsMap);
      }
    } catch (error) {
      console.error('Error fetching communities:', error);
      toast({ title: "Error", description: "Could not load communities.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleJoinCommunity = async (communityId: string, communityName: string) => {
    if (!user) {
      toast({ title: "Login Required", description: "Please login to join communities", variant: "destructive" });
      return;
    }

    setJoiningCommunities(prev => new Set(prev).add(communityId));
    try {
      const { error } = await joinCommunity({ communityId, userId: user.id, role: 'member' });
      if (error) throw error;

      setUserMemberships(prev => new Map(prev).set(communityId, 'pending'));
      toast({
        title: "Request Sent",
        description: `Your request to join ${communityName} is pending approval.`,
      });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to send join request.", variant: "destructive" });
    } finally {
      setJoiningCommunities(prev => {
        const newSet = new Set(prev);
        newSet.delete(communityId);
        return newSet;
      });
    }
  };
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Explore Communities</h1>
          <p className="text-muted-foreground">Discover and join communities to get involved.</p>
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {communities.map((community) => {
          const membershipStatus = userMemberships.get(community.id);
          const isJoining = joiningCommunities.has(community.id);

          return (
            <Card key={community.id} className="flex flex-col">
              <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        {community.name.toLowerCase() === 'india' ? (
                          <Flag className="h-6 w-6 text-primary" />
                        ) : (
                          <Building2 className="h-6 w-6 text-primary" />
                        )}
                      </div>
                      <div>
                        <CardTitle>{community.name}</CardTitle>
                        <CardDescription>{community.location}</CardDescription>
                      </div>
                    </div>
                  </div>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col justify-between">
                <p className="text-sm text-muted-foreground mb-4">{community.description}</p>
                <div className="text-sm text-muted-foreground space-y-2 py-4 border-t border-b">
                   <div className="flex items-center justify-between">
                      <span><Users className="h-4 w-4 inline mr-2" />Members</span>
                      <span className="font-medium">{memberCounts[community.id] || 0}</span>
                   </div>
                   <div className="flex items-center justify-between">
                      <span><Calendar className="h-4 w-4 inline mr-2" />Created</span>
                      <span className="font-medium">{formatDate(community.created_at)}</span>
                   </div>
                </div>
              </CardContent>
              <div className="p-6 pt-0">
                {membershipStatus === 'approved' ? (
                  <Button className="w-full" onClick={() => navigate(`/communities/${encodeURIComponent(community.name)}`)}>
                    <Eye className="h-4 w-4 mr-2" /> View
                  </Button>
                ) : membershipStatus === 'pending' ? (
                  <Button variant="secondary" className="w-full" disabled>
                    <Clock className="h-4 w-4 mr-2" /> Request Sent
                  </Button>
                ) : (
                  <Button className="w-full" disabled={isJoining} onClick={() => handleJoinCommunity(community.id, community.name)}>
                    {isJoining ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UserPlus className="h-4 w-4 mr-2" />}
                    Request to Join
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {communities.length === 0 && (
        <EmptyState
          Icon={Building2}
          title="No Communities Found"
          description="There are no active communities available right now. Please check back later."
        />
      )}
    </div>
  );
};

export default JoinCommunities;
