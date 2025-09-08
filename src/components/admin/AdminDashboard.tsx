import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Building2, 
  FileText, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getAllCommunities } from '@/lib/communities';

interface DashboardStats {
  totalUsers: number;
  totalCommunities: number;
  totalComplaints: number;
  pendingComplaints: number;
  resolvedComplaints: number;
  recentComplaints: any[];
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalCommunities: 0,
    totalComplaints: 0,
    pendingComplaints: 0,
    resolvedComplaints: 0,
    recentComplaints: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch users count
      const { count: usersCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // Fetch communities count
      const { data: communitiesData } = await getAllCommunities();
      const communitiesCount = communitiesData?.length || 0;

      // Fetch complaints stats
      const { count: totalComplaints } = await supabase
        .from('complaints')
        .select('*', { count: 'exact', head: true });

      const { count: pendingComplaints } = await supabase
        .from('complaints')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      const { count: resolvedComplaints } = await supabase
        .from('complaints')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'resolved');

      // Fetch recent complaints
      const { data: recentComplaints } = await supabase
        .from('complaints')
        .select(`
          *,
          users (full_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      setStats({
        totalUsers: usersCount || 0,
        totalCommunities: communitiesCount,
        totalComplaints: totalComplaints || 0,
        pendingComplaints: pendingComplaints || 0,
        resolvedComplaints: resolvedComplaints || 0,
        recentComplaints: recentComplaints || []
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'in-progress':
        return <Badge className="bg-orange-500"><AlertCircle className="w-3 h-3 mr-1" />In Progress</Badge>;
      case 'resolved':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Resolved</Badge>;
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
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Registered users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Communities</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCommunities}</div>
            <p className="text-xs text-muted-foreground">
              Active communities
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
              All time complaints
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingComplaints}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting resolution
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
              {stats.recentComplaints.map((complaint) => (
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
              ))}
              
              {stats.recentComplaints.length === 0 && (
                <div className="text-center py-4">
                  <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No recent complaints</p>
                </div>
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
                <span className="text-sm font-medium">Resolved Complaints</span>
                <Badge className="bg-green-500">
                  {stats.resolvedComplaints}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Resolution Rate</span>
                <span className="text-sm font-bold">
                  {stats.totalComplaints > 0 
                    ? Math.round((stats.resolvedComplaints / stats.totalComplaints) * 100)
                    : 0}%
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Active Communities</span>
                <Badge variant="outline">
                  {stats.totalCommunities}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total Users</span>
                <Badge variant="outline">
                  {stats.totalUsers}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;

