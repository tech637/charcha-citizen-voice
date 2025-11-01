import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  FileText,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getCommunityComplaints } from '@/lib/complaints';
import { LeaderType } from '@/lib/leaders';
import { useToast } from '@/hooks/use-toast';

interface LeaderAnalyticsProps {
  communityId: string;
  leaderType: LeaderType;
}

interface AnalyticsData {
  totalComplaints: number;
  pendingComplaints: number;
  inProgressComplaints: number;
  resolvedComplaints: number;
  rejectedComplaints: number;
  complaintsByCategory: Record<string, number>;
  complaintsByMonth: Array<{
    month: string;
    total: number;
    resolved: number;
    pending: number;
  }>;
  resolutionRate: number;
  avgResolutionTime: number;
  totalMembers: number;
}

const LeaderAnalytics: React.FC<LeaderAnalyticsProps> = ({ communityId, leaderType }) => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalComplaints: 0,
    pendingComplaints: 0,
    inProgressComplaints: 0,
    resolvedComplaints: 0,
    rejectedComplaints: 0,
    complaintsByCategory: {},
    complaintsByMonth: [],
    resolutionRate: 0,
    avgResolutionTime: 0,
    totalMembers: 0
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<string>('6months');
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalytics();
  }, [communityId, timeRange]);

  const fetchAnalytics = async () => {
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
      
      // Calculate time range filter
      const now = new Date();
      let startDate: Date;
      
      switch (timeRange) {
        case '1month':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          break;
        case '3months':
          startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
          break;
        case '6months':
          startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
          break;
        case '1year':
          startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
          break;
        default:
          startDate = new Date(0); // All time
      }

      // Filter complaints by time range
      const filteredComplaints = complaintsData.filter(complaint => 
        new Date(complaint.created_at) >= startDate
      );

      // Calculate basic stats
      const stats = {
        totalComplaints: filteredComplaints.length,
        pendingComplaints: filteredComplaints.filter(c => c.status === 'pending').length,
        inProgressComplaints: filteredComplaints.filter(c => c.status === 'in_progress').length,
        resolvedComplaints: filteredComplaints.filter(c => c.status === 'resolved').length,
        rejectedComplaints: filteredComplaints.filter(c => c.status === 'rejected').length,
        totalMembers: membersCount || 0
      };

      // Calculate complaints by category
      const categoryCounts: Record<string, number> = {};
      filteredComplaints.forEach(complaint => {
        categoryCounts[complaint.category] = (categoryCounts[complaint.category] || 0) + 1;
      });

      // Calculate monthly trends
      const monthlyData: Record<string, { total: number; resolved: number; pending: number }> = {};
      
      filteredComplaints.forEach(complaint => {
        const date = new Date(complaint.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { total: 0, resolved: 0, pending: 0 };
        }
        
        monthlyData[monthKey].total++;
        if (complaint.status === 'resolved') {
          monthlyData[monthKey].resolved++;
        } else if (complaint.status === 'pending') {
          monthlyData[monthKey].pending++;
        }
      });

      // Convert to array and sort by month
      const complaintsByMonth = Object.entries(monthlyData)
        .map(([month, data]) => ({
          month,
          ...data
        }))
        .sort((a, b) => a.month.localeCompare(b.month));

      // Calculate resolution rate
      const resolutionRate = stats.totalComplaints > 0 
        ? Math.round((stats.resolvedComplaints / stats.totalComplaints) * 100)
        : 0;

      // Calculate average resolution time (simplified)
      const resolvedComplaints = filteredComplaints.filter(c => c.status === 'resolved');
      let avgResolutionTime = 0;
      
      if (resolvedComplaints.length > 0) {
        const totalDays = resolvedComplaints.reduce((sum, complaint) => {
          const created = new Date(complaint.created_at);
          const resolved = new Date(); // Assuming resolved now for simplicity
          return sum + Math.floor((resolved.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
        }, 0);
        avgResolutionTime = Math.round(totalDays / resolvedComplaints.length);
      }

      setAnalytics({
        ...stats,
        complaintsByCategory: categoryCounts,
        complaintsByMonth,
        resolutionRate,
        avgResolutionTime
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Error",
        description: "Failed to fetch analytics data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCategoryName = (category: string) => {
    return category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatMonth = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Time Range Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-gray-600">Community performance metrics and trends</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">Last Month</SelectItem>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="1year">Last Year</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={fetchAnalytics}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Complaints</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalComplaints}</div>
            <p className="text-xs text-muted-foreground">
              In selected time range
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{analytics.resolutionRate}%</div>
            <p className="text-xs text-muted-foreground">
              Successfully resolved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Resolution Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.avgResolutionTime}</div>
            <p className="text-xs text-muted-foreground">
              Days to resolve
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Community Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalMembers}</div>
            <p className="text-xs text-muted-foreground">
              Active members
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Complaint Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">Pending</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gray-500 h-2 rounded-full" 
                      style={{ 
                        width: `${analytics.totalComplaints > 0 ? (analytics.pendingComplaints / analytics.totalComplaints) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{analytics.pendingComplaints}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                  <span className="text-sm">In Progress</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-orange-500 h-2 rounded-full" 
                      style={{ 
                        width: `${analytics.totalComplaints > 0 ? (analytics.inProgressComplaints / analytics.totalComplaints) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{analytics.inProgressComplaints}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Resolved</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ 
                        width: `${analytics.totalComplaints > 0 ? (analytics.resolvedComplaints / analytics.totalComplaints) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{analytics.resolvedComplaints}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm">Rejected</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full" 
                      style={{ 
                        width: `${analytics.totalComplaints > 0 ? (analytics.rejectedComplaints / analytics.totalComplaints) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{analytics.rejectedComplaints}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Complaints by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(analytics.complaintsByCategory).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No complaints in selected time range
                </p>
              ) : (
                Object.entries(analytics.complaintsByCategory)
                  .sort(([,a], [,b]) => b - a)
                  .map(([category, count]) => (
                    <div key={category} className="flex items-center justify-between">
                      <span className="text-sm">{formatCategoryName(category)}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full" 
                            style={{ 
                              width: `${analytics.totalComplaints > 0 ? (count / analytics.totalComplaints) * 100 : 0}%` 
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium w-8 text-right">{count}</span>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trends */}
      {analytics.complaintsByMonth.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Monthly Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.complaintsByMonth.map((monthData) => (
                <div key={monthData.month} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium">{formatMonth(monthData.month)}</h4>
                    <p className="text-sm text-gray-600">
                      {monthData.total} total complaints
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">{monthData.resolved}</div>
                      <div className="text-xs text-gray-600">Resolved</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-600">{monthData.pending}</div>
                      <div className="text-xs text-gray-600">Pending</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LeaderAnalytics;
