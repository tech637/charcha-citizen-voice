import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  RefreshCw,
  BarChart3
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getCommunityComplaints } from '@/lib/complaints';
import { LeaderType } from '@/lib/leaders';
import { useToast } from '@/hooks/use-toast';

interface LeaderOverviewProps {
  communityId: string;
  leaderType: LeaderType;
}

interface CommunityStats {
  totalMembers: number;
  totalComplaints: number;
  acknowledgedComplaints: number;
  forwardedComplaints: number;
  resolvedComplaints: number;
}

interface RecentComplaint {
  id: string;
  category: string;
  description: string;
  status: string;
  created_at: string;
  users: {
    full_name?: string;
  };
}

const LeaderOverview: React.FC<LeaderOverviewProps> = ({ communityId, leaderType }) => {
  const [stats, setStats] = useState<CommunityStats>({
    totalMembers: 0,
    totalComplaints: 0,
    acknowledgedComplaints: 0,
    forwardedComplaints: 0,
    resolvedComplaints: 0
  });
  const [recentComplaints, setRecentComplaints] = useState<RecentComplaint[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchOverviewData();
  }, [communityId]);

  // Real-time subscription for complaint updates
  useEffect(() => {
    if (!communityId) return;

    const channel = supabase
      .channel(`overview-updates-${communityId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'complaints',
          filter: `community_id=eq.${communityId}`
        },
        (payload) => {
          console.log('Complaint updated in overview:', payload);
          // Refresh overview data when any complaint in this community is updated
          fetchOverviewData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [communityId]);

  const fetchOverviewData = async () => {
    try {
      setLoading(true);
      
      // Fetch community members count
      const { count: membersCount } = await supabase
        .from('user_communities')
        .select('*', { count: 'exact', head: true })
        .eq('community_id', communityId)
        .eq('status', 'approved');

      // Fetch complaints for this community
      const { data: complaints, error } = await getCommunityComplaints(communityId);
      
      if (error) {
        throw error;
      }

      const complaintsData = complaints || [];
      
      // Calculate stats
      const stats: CommunityStats = {
        totalMembers: membersCount || 0,
        totalComplaints: complaintsData.length,
        acknowledgedComplaints: complaintsData.filter(c => c.status === 'acknowledged').length,
        forwardedComplaints: complaintsData.filter(c => c.status === 'forwarded').length,
        resolvedComplaints: complaintsData.filter(c => c.status === 'resolved').length
      };

      setStats(stats);

      // Get recent complaints (last 5)
      const recent = complaintsData
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);

      setRecentComplaints(recent);

    } catch (error) {
      console.error('Error fetching overview data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch community overview data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'in_progress':
        return <Badge className="bg-orange-500"><AlertCircle className="w-3 h-3 mr-1" />In Progress</Badge>;
      case 'resolved':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Resolved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500"><AlertCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading overview...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMembers}</div>
            <p className="text-xs text-muted-foreground">
              Community members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Complaints</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalComplaints}</div>
            <p className="text-xs text-muted-foreground">
              All complaints
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Acknowledged</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.acknowledgedComplaints}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting action
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Forwarded</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.forwardedComplaints}</div>
            <p className="text-xs text-muted-foreground">
              With authorities
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.resolvedComplaints}</div>
            <p className="text-xs text-muted-foreground">
              Successfully resolved
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recent Complaints
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentComplaints.length === 0 ? (
                <div className="text-center py-4">
                  <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No complaints yet</p>
                </div>
              ) : (
                recentComplaints.map((complaint) => (
                  <div key={complaint.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {complaint.users?.full_name || 'Anonymous'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {complaint.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(complaint.created_at)}
                      </p>
                    </div>
                    <div className="ml-4">
                      {getStatusBadge(complaint.status)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Resolution Rate</span>
                <span className="text-sm font-bold">
                  {stats.totalComplaints > 0 
                    ? Math.round((stats.resolvedComplaints / stats.totalComplaints) * 100)
                    : 0}%
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Acknowledged</span>
                <Badge className="bg-yellow-500">
                  {stats.acknowledgedComplaints}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Forwarded</span>
                <Badge className="bg-blue-500">
                  {stats.forwardedComplaints}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total Members</span>
                <Badge variant="outline">
                  {stats.totalMembers}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Refresh Button */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          onClick={fetchOverviewData}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Data
        </Button>
      </div>
    </div>
  );
};

export default LeaderOverview;
