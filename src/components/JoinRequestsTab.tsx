import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Building2, 
  MapPin, 
  User, 
  Home,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

interface JoinRequest {
  id: string;
  user_id: string;
  community_id: string;
  block_id?: string;
  block_name?: string;
  role: 'member' | 'moderator' | 'admin' | 'tenant' | 'owner';
  address?: string;
  status: 'pending' | 'approved' | 'rejected';
  joined_at: string;
  communities: {
    name: string;
    location?: string;
  };
  blocks?: {
    name: string;
  };
}

const JoinRequestsTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRequests = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_communities')
        .select(`
          *,
          communities (name, location),
          blocks (name)
        `)
        .eq('user_id', user.id)
        .order('joined_at', { ascending: false });

      if (error) {
        throw error;
      }
      const rows: JoinRequest[] = (data as any) || [];
      // Deduplicate by community, prioritize status: approved > pending > rejected
      const statusRank: Record<string, number> = { approved: 3, pending: 2, rejected: 1 };
      const byCommunity = new Map<string, JoinRequest>();
      for (const row of rows) {
        const key = row.community_id;
        const existing = byCommunity.get(key);
        if (!existing) {
          byCommunity.set(key, row);
        } else {
          const existingRank = statusRank[existing.status] || 0;
          const newRank = statusRank[row.status] || 0;
          // Prefer higher status; if equal, keep most recent by joined_at
          if (newRank > existingRank || (newRank === existingRank && new Date(row.joined_at) > new Date(existing.joined_at))) {
            byCommunity.set(key, row);
          }
        }
      }
      const deduped = Array.from(byCommunity.values()).sort((a, b) => new Date(b.joined_at).getTime() - new Date(a.joined_at).getTime());
      setRequests(deduped);
    } catch (error: any) {
      console.error('Error fetching join requests:', error);
      toast({
        title: "Error",
        description: "Failed to fetch your join requests. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchRequests();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchRequests();
  }, [user]);

  // Realtime updates for join request status
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`user_communities_${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_communities', filter: `user_id=eq.${user.id}` }, () => {
        fetchRequests();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-orange-500" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="secondary" className="bg-orange-100 text-orange-700 border-orange-200">
            <Clock className="w-3 h-3 mr-1" />
            Under Review
          </Badge>
        );
      case 'approved':
        return (
          <Badge className="bg-green-100 text-green-700 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStatusMessage = (request: JoinRequest) => {
    const blockInfo = request.block_name || request.blocks?.name || 'Unknown Block';
    const communityName = request.communities.name;
    
    switch (request.status) {
      case 'pending':
        return `Your request to join ${blockInfo}, ${communityName} is under review.`;
      case 'approved':
        return `You are now a member of ${blockInfo}, ${communityName}.`;
      case 'rejected':
        return `Your request was rejected. Contact your community leader for more information.`;
      default:
        return `Status: ${request.status}`;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'tenant':
        return <User className="h-4 w-4" />;
      case 'owner':
        return <Home className="h-4 w-4" />;
      default:
        return <Building2 className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#001F3F]" />
        <p className="text-[#001F3F]/70">Loading your requests...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-[#001F3F]">Join Requests</h2>
          <p className="text-[#001F3F]/70 mt-1">
            Track your community membership requests
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Requests List */}
      {requests.length === 0 ? (
        <Card className="border-2 border-dashed border-[#001F3F]/20">
          <CardContent className="text-center py-12">
            <Building2 className="h-16 w-16 text-[#001F3F]/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[#001F3F] mb-2">
              No Join Requests
            </h3>
            <p className="text-[#001F3F]/70 mb-4">
              You haven't submitted any community join requests yet.
            </p>
            <Button 
              onClick={() => window.location.href = '/#join-community-form'}
              className="bg-gradient-to-r from-[#001F3F] to-[#001F3F]/90 hover:from-[#001F3F]/90 hover:to-[#001F3F] text-white"
            >
              <Building2 className="h-4 w-4 mr-2" />
              Join a Community
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <Card 
              key={request.id} 
              className={`border-2 transition-all duration-300 hover:shadow-lg ${
                request.status === 'approved' 
                  ? 'border-green-200 bg-green-50/50' 
                  : request.status === 'rejected'
                  ? 'border-red-200 bg-red-50/50'
                  : 'border-orange-200 bg-orange-50/50'
              }`}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      request.status === 'approved' 
                        ? 'bg-green-100' 
                        : request.status === 'rejected'
                        ? 'bg-red-100'
                        : 'bg-orange-100'
                    }`}>
                      {getStatusIcon(request.status)}
                    </div>
                    <div>
                      <CardTitle className="text-lg text-[#001F3F]">
                        {request.communities.name}
                      </CardTitle>
                      <p className="text-sm text-[#001F3F]/70">
                        {request.communities.location || 'Community Location'}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(request.status)}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Status Message */}
                <div className={`p-4 rounded-lg ${
                  request.status === 'approved' 
                    ? 'bg-green-100 border border-green-200' 
                    : request.status === 'rejected'
                    ? 'bg-red-100 border border-red-200'
                    : 'bg-orange-100 border border-orange-200'
                }`}>
                  <p className={`font-medium ${
                    request.status === 'approved' 
                      ? 'text-green-800' 
                      : request.status === 'rejected'
                      ? 'text-red-800'
                      : 'text-orange-800'
                  }`}>
                    {getStatusMessage(request)}
                  </p>
                </div>

                {/* Request Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="h-4 w-4 text-[#001F3F]/60" />
                      <span className="font-medium">Block:</span>
                      <span>{request.block_name || request.blocks?.name || 'Not specified'}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      {getRoleIcon(request.role)}
                      <span className="font-medium">Role:</span>
                      <span className="capitalize">{request.role}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-[#001F3F]/60" />
                      <span className="font-medium">Submitted:</span>
                      <span>{new Date(request.joined_at).toLocaleDateString()}</span>
                    </div>
                    
                    {request.address && (
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-[#001F3F]/60 mt-0.5" />
                        <div>
                          <span className="font-medium">Address:</span>
                          <p className="text-[#001F3F]/70 mt-1">{request.address}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                {request.status === 'rejected' && (
                  <div className="pt-2 border-t border-gray-200">
                    <Button variant="outline" size="sm">
                      Contact Community Leader
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default JoinRequestsTab;

