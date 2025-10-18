import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  FileText, 
  Clock, 
  MapPin, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Activity,
  Target,
  Globe,
  Calendar,
  PieChart,
  LineChart
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { 
  LineChart as RechartsLineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell,
  Pie
} from 'recharts';
import IndiaMap from './IndiaMap';

// Types for analytics data
interface UserAnalytics {
  total_users: number;
  admin_users: number;
  citizen_users: number;
  users_this_week: number;
  users_this_month: number;
  users_last_7_days: number;
  users_last_30_days: number;
}

interface ComplaintAnalytics {
  total_complaints: number;
  acknowledged_complaints: number;
  forwarded_complaints: number;
  resolved_complaints: number;
  complaints_this_week: number;
  complaints_this_month: number;
  avg_resolution_days: number;
}

interface RegistrationTrend {
  date: string;
  user_count: number;
}

interface StatusTrend {
  date: string;
  acknowledged_count: number;
  forwarded_count: number;
  resolved_count: number;
}

interface CategoryAnalytic {
  category_id: string;
  category_name: string;
  complaint_count: number;
  resolved_count: number;
  acknowledged_count: number;
  resolution_rate: number;
}

interface CommunityAnalytic {
  community_id: string;
  community_name: string;
  member_count: number;
  complaint_count: number;
  avg_complaints_per_member: number;
}

interface PriorityAnalytic {
  priority: string;
  complaint_count: number;
  resolved_count: number;
  acknowledged_count: number;
  resolution_rate: number;
}

interface GeographicAnalytic {
  location: string;
  complaint_count: number;
  resolved_count: number;
  acknowledged_count: number;
}

const Analytics: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userAnalytics, setUserAnalytics] = useState<UserAnalytics | null>(null);
  const [complaintAnalytics, setComplaintAnalytics] = useState<ComplaintAnalytics | null>(null);
  const [registrationTrends, setRegistrationTrends] = useState<RegistrationTrend[]>([]);
  const [statusTrends, setStatusTrends] = useState<StatusTrend[]>([]);
  const [categoryAnalytics, setCategoryAnalytics] = useState<CategoryAnalytic[]>([]);
  const [communityAnalytics, setCommunityAnalytics] = useState<CommunityAnalytic[]>([]);
  const [priorityAnalytics, setPriorityAnalytics] = useState<PriorityAnalytic[]>([]);
  const [geographicAnalytics, setGeographicAnalytics] = useState<GeographicAnalytic[]>([]);
  const [topLocations, setTopLocations] = useState<GeographicAnalytic[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchAllAnalytics();
  }, []);

  const fetchAllAnalytics = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchUserAnalytics(),
        fetchComplaintAnalytics(),
        fetchRegistrationTrends(),
        fetchStatusTrends(),
        fetchCategoryAnalytics(),
        fetchCommunityAnalytics(),
        fetchPriorityAnalytics(),
        fetchGeographicAnalytics(),
        fetchTopLocations()
      ]);
      
      // Show info toast if RPC functions are not available
      toast({
        title: "Analytics Loaded",
        description: "Some analytics may show placeholder data. Run the SQL functions in Supabase for full functionality.",
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Analytics Loaded",
        description: "Using fallback data. Run the SQL functions in Supabase for full functionality.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllAnalytics();
    setRefreshing(false);
    toast({
      title: "Analytics Updated",
      description: "All analytics data has been refreshed",
    });
  };

  const fetchUserAnalytics = async () => {
    try {
      const { data, error } = await supabase.rpc('get_user_analytics');
      if (error) {
        console.warn('User analytics RPC not available:', error.message);
        return;
      }
      setUserAnalytics(data?.[0] || null);
    } catch (error) {
      console.warn('User analytics fetch failed:', error);
    }
  };

  const fetchComplaintAnalytics = async () => {
    try {
      const { data, error } = await supabase.rpc('get_complaint_analytics');
      if (error) {
        console.warn('Complaint analytics RPC not available:', error.message);
        return;
      }
      setComplaintAnalytics(data?.[0] || null);
    } catch (error) {
      console.warn('Complaint analytics fetch failed:', error);
    }
  };

  const fetchRegistrationTrends = async () => {
    try {
      const { data, error } = await supabase.rpc('get_user_registration_trends');
      if (error) {
        console.warn('Registration trends RPC not available:', error.message);
        return;
      }
      setRegistrationTrends(data || []);
    } catch (error) {
      console.warn('Registration trends fetch failed:', error);
    }
  };

  const fetchStatusTrends = async () => {
    try {
      const { data, error } = await supabase.rpc('get_complaint_status_trends');
      if (error) {
        console.warn('Status trends RPC not available:', error.message);
        return;
      }
      setStatusTrends(data || []);
    } catch (error) {
      console.warn('Status trends fetch failed:', error);
    }
  };

  const fetchCategoryAnalytics = async () => {
    try {
      // Try RPC function first
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_category_analytics');
      if (!rpcError && rpcData) {
        setCategoryAnalytics(rpcData);
        return;
      }
      
      console.warn('Category analytics RPC not available, using direct query:', rpcError?.message);
      
      // Fallback: Direct query to get category analytics
      const { data: complaintsData, error: complaintsError } = await supabase
        .from('complaints')
        .select('category, status');
      
      if (complaintsError) {
        console.error('Error fetching complaints for category analytics:', complaintsError);
        return;
      }
      
      // Process data to create category analytics
      const categoryMap = new Map();
      
      complaintsData?.forEach(complaint => {
        const category = complaint.category;
        if (!categoryMap.has(category)) {
          categoryMap.set(category, {
            category_id: category,
            category_name: category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
            complaint_count: 0,
            resolved_count: 0,
            acknowledged_count: 0,
            resolution_rate: 0
          });
        }
        
        const categoryData = categoryMap.get(category);
        categoryData.complaint_count++;
        
        if (complaint.status === 'resolved') {
          categoryData.resolved_count++;
        } else if (complaint.status === 'acknowledged') {
          categoryData.acknowledged_count++;
        }
      });
      
      // Calculate resolution rates
      const categoryAnalytics = Array.from(categoryMap.values()).map(category => ({
        ...category,
        resolution_rate: category.complaint_count > 0 
          ? Math.round((category.resolved_count / category.complaint_count) * 100)
          : 0
      }));
      
      setCategoryAnalytics(categoryAnalytics);
      console.log('✅ Category analytics generated from direct query:', categoryAnalytics);
      
    } catch (error) {
      console.warn('Category analytics fetch failed:', error);
    }
  };

  const fetchCommunityAnalytics = async () => {
    try {
      const { data, error } = await supabase.rpc('get_community_analytics');
      if (error) {
        console.warn('Community analytics RPC not available:', error.message);
        return;
      }
      setCommunityAnalytics(data || []);
    } catch (error) {
      console.warn('Community analytics fetch failed:', error);
    }
  };

  const fetchPriorityAnalytics = async () => {
    try {
      console.log('📊 Fetching priority analytics (status data)...');
      
      // Try RPC function first
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_priority_analytics');
      if (!rpcError && rpcData) {
        setPriorityAnalytics(rpcData);
        return;
      }
      
      console.warn('Priority analytics RPC not available, using status distribution instead:', rpcError?.message);
      
      // Fallback: Since there's no priority field, show status distribution
      const { data: complaintsData, error: complaintsError } = await supabase
        .from('complaints')
        .select('status');
      
      if (complaintsError) {
        console.error('Error fetching complaints for status analytics:', complaintsError);
        return;
      }
      
      // Process data to create status analytics (as priority replacement)
      const statusMap = new Map();
      
      complaintsData?.forEach(complaint => {
        const status = complaint.status;
        if (!statusMap.has(status)) {
          statusMap.set(status, {
            priority_id: status,
            priority_name: status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
            priority: status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
            complaint_count: 0,
            resolved_count: 0,
            acknowledged_count: 0,
            resolution_rate: 0
          });
        }
        
        const statusData = statusMap.get(status);
        statusData.complaint_count++;
        
        if (status === 'resolved') {
          statusData.resolved_count++;
        } else if (status === 'acknowledged') {
          statusData.acknowledged_count++;
        }
      });
      
      // Calculate resolution rates
      const statusAnalytics = Array.from(statusMap.values()).map(status => ({
        ...status,
        resolution_rate: status.complaint_count > 0 
          ? Math.round((status.resolved_count / status.complaint_count) * 100)
          : 0
      }));
      
      setPriorityAnalytics(statusAnalytics);
      console.log('✅ Status analytics generated from direct query (as priority replacement):', statusAnalytics);
      console.log('📊 Raw complaints data for status:', complaintsData);
      
    } catch (error) {
      console.warn('Priority analytics fetch failed:', error);
    }
  };

  const fetchGeographicAnalytics = async () => {
    try {
      const { data, error } = await supabase.rpc('get_geographic_analytics');
      if (error) {
        console.warn('Geographic analytics RPC not available:', error.message);
        return;
      }
      setGeographicAnalytics(data || []);
    } catch (error) {
      console.warn('Geographic analytics fetch failed:', error);
    }
  };

  const fetchTopLocations = async () => {
    try {
      console.log('📍 Fetching top locations...');
      
      // Fetch complaints with location data
      const { data: complaintsData, error: complaintsError } = await supabase
        .from('complaints')
        .select('location_address, status')
        .not('location_address', 'is', null)
        .neq('location_address', '');
      
      if (complaintsError) {
        console.error('Error fetching complaints for top locations:', complaintsError);
        return;
      }
      
      // Process data to create location analytics
      const locationMap = new Map();
      
      complaintsData?.forEach(complaint => {
        const location = complaint.location_address;
        if (!locationMap.has(location)) {
          locationMap.set(location, {
            location: location,
            complaint_count: 0,
            resolved_count: 0,
            acknowledged_count: 0
          });
        }
        
        const locationData = locationMap.get(location);
        locationData.complaint_count++;
        
        if (complaint.status === 'resolved') {
          locationData.resolved_count++;
        } else if (complaint.status === 'acknowledged') {
          locationData.acknowledged_count++;
        }
      });
      
      // Sort by complaint count and take top 10
      const topLocationsData = Array.from(locationMap.values())
        .sort((a, b) => b.complaint_count - a.complaint_count)
        .slice(0, 10);
      
      setTopLocations(topLocationsData);
      console.log('✅ Top locations generated:', topLocationsData);
      console.log('📍 Raw complaints data:', complaintsData);
      
    } catch (error) {
      console.warn('Top locations fetch failed:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'acknowledged': return 'bg-yellow-100 text-yellow-800';
      case 'forwarded': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            Comprehensive insights into platform performance
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing} variant="outline" size="sm">
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* RPC Functions Notice */}
      {(!userAnalytics && !complaintAnalytics) && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="h-5 w-5" />
              Analytics Functions Not Available
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-amber-700 mb-4">
              To see real analytics data, you need to run the SQL functions in Supabase first.
            </p>
            <div className="bg-amber-100 p-3 rounded-md">
              <p className="text-sm font-medium text-amber-800 mb-2">Steps to enable analytics:</p>
              <ol className="text-sm text-amber-700 list-decimal list-inside space-y-1">
                <li>Go to Supabase Dashboard → SQL Editor</li>
                <li>Copy and paste the analytics functions SQL</li>
                <li>Click "Run" to create the functions</li>
                <li>Refresh this page to see real data</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Analytics Tabs - Hidden on mobile, show everything in overview */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="hidden sm:grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Users</span>
          </TabsTrigger>
          <TabsTrigger value="complaints" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Complaints</span>
          </TabsTrigger>
          <TabsTrigger value="communities" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">Communities</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab - Shows everything on mobile, filtered on desktop */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userAnalytics?.total_users || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {userAnalytics?.users_this_week || 0} this week
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Complaints</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{complaintAnalytics?.total_complaints || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {complaintAnalytics?.complaints_this_week || 0} this week
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Resolved</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {complaintAnalytics?.resolved_complaints || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {complaintAnalytics?.avg_resolution_days ? 
                    `${complaintAnalytics.avg_resolution_days.toFixed(1)} days avg` : 
                    'No data'
                  }
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {complaintAnalytics?.total_complaints ? 
                    `${((complaintAnalytics.resolved_complaints / complaintAnalytics.total_complaints) * 100).toFixed(1)}%` : 
                    '0%'
                  }
                </div>
                <p className="text-xs text-muted-foreground">
                  Overall success rate
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Status Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Complaint Status Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {complaintAnalytics && (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                          <span className="text-sm">Acknowledged</span>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{complaintAnalytics.acknowledged_complaints}</div>
                          <div className="text-xs text-muted-foreground">
                            {((complaintAnalytics.acknowledged_complaints / complaintAnalytics.total_complaints) * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                      <Progress 
                        value={(complaintAnalytics.acknowledged_complaints / complaintAnalytics.total_complaints) * 100} 
                        className="h-2"
                      />

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <span className="text-sm">Forwarded</span>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{complaintAnalytics.forwarded_complaints}</div>
                          <div className="text-xs text-muted-foreground">
                            {((complaintAnalytics.forwarded_complaints / complaintAnalytics.total_complaints) * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                      <Progress 
                        value={(complaintAnalytics.forwarded_complaints / complaintAnalytics.total_complaints) * 100} 
                        className="h-2"
                      />

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="text-sm">Resolved</span>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{complaintAnalytics.resolved_complaints}</div>
                          <div className="text-xs text-muted-foreground">
                            {((complaintAnalytics.resolved_complaints / complaintAnalytics.total_complaints) * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                      <Progress 
                        value={(complaintAnalytics.resolved_complaints / complaintAnalytics.total_complaints) * 100} 
                        className="h-2"
                      />

                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Role Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {userAnalytics && (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <span className="text-sm">Citizens</span>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{userAnalytics.citizen_users}</div>
                          <div className="text-xs text-muted-foreground">
                            {((userAnalytics.citizen_users / userAnalytics.total_users) * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                      <Progress 
                        value={(userAnalytics.citizen_users / userAnalytics.total_users) * 100} 
                        className="h-2"
                      />

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                          <span className="text-sm">Admins</span>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{userAnalytics.admin_users}</div>
                          <div className="text-xs text-muted-foreground">
                            {((userAnalytics.admin_users / userAnalytics.total_users) * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                      <Progress 
                        value={(userAnalytics.admin_users / userAnalytics.total_users) * 100} 
                        className="h-2"
                      />
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* India Map - Leaflet Implementation */}
          <IndiaMap />

          {/* Mobile: Show all content in overview */}
          <div className="block sm:hidden space-y-6">
            {/* User Registration Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  User Registration Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {registrationTrends.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%" minWidth={300} minHeight={200}>
                      <RechartsLineChart data={registrationTrends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        />
                        <YAxis />
                        <Tooltip 
                          labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                          formatter={(value) => [value, 'New Users']}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="user_count" 
                          stroke="#3b82f6" 
                          strokeWidth={2}
                          dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                        />
                      </RechartsLineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <LineChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No registration data available</p>
                        <p className="text-xs mt-2">
                          Run the SQL functions in Supabase to see trends
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Category Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Category Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                {categoryAnalytics.length > 0 ? (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%" minWidth={300} minHeight={200}>
                      <RechartsPieChart>
                        <Pie
                          data={categoryAnalytics.slice(0, 5).map(cat => ({
                            name: cat.category_name,
                            value: cat.complaint_count,
                            resolution_rate: cat.resolution_rate
                          }))}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${value}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {categoryAnalytics.slice(0, 5).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={`hsl(${index * 60}, 70%, 50%)`} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value, name, props) => [
                          `${value} complaints`,
                          'Complaints'
                        ]} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <PieChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No category data available</p>
                      <p className="text-xs mt-2">
                        Run the SQL functions in Supabase to see data
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Priority Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Status Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                {priorityAnalytics.length > 0 ? (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%" minWidth={300} minHeight={200}>
                      <RechartsBarChart data={priorityAnalytics.map(p => ({
                        priority: p.priority || p.priority_name || 'Unknown',
                        complaints: p.complaint_count,
                        resolved: p.resolved_count,
                        resolution_rate: p.resolution_rate
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="priority" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value, name, props) => [
                            `${value} complaints`,
                            name === 'complaints' ? 'Total Complaints' : 'Resolved'
                          ]}
                        />
                        <Bar dataKey="complaints" fill="#3b82f6" />
                        <Bar dataKey="resolved" fill="#10b981" />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No status data available</p>
                      <p className="text-xs mt-2">
                        Debug: {priorityAnalytics.length} status items found
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Locations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Top Locations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {geographicAnalytics.slice(0, 5).map((location, index) => (
                    <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{location.location}</div>
                          <div className="text-xs text-muted-foreground">
                            {location.resolved_count} resolved, {location.acknowledged_count} acknowledged
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary">{location.complaint_count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Community Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Community Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {communityAnalytics.map((community) => (
                    <div key={community.community_id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-medium">{community.community_name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {community.member_count} members
                          </p>
                        </div>
                        <Badge variant="outline">{community.complaint_count} complaints</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Avg complaints per member:</span>
                          <div className="font-medium">{community.avg_complaints_per_member}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Engagement:</span>
                          <div className="font-medium">
                            {community.avg_complaints_per_member > 1 ? 'High' : 
                             community.avg_complaints_per_member > 0.5 ? 'Medium' : 'Low'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                User Registration Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {registrationTrends.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" minWidth={300} minHeight={200}>
                    <RechartsLineChart data={registrationTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                        formatter={(value) => [value, 'New Users']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="user_count" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                      />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <LineChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No registration data available</p>
                      <p className="text-xs mt-2">
                        Run the SQL functions in Supabase to see trends
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">New users this week</span>
                    <Badge variant="secondary">{userAnalytics?.users_this_week || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">New users this month</span>
                    <Badge variant="secondary">{userAnalytics?.users_this_month || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total active users</span>
                    <Badge variant="secondary">{userAnalytics?.total_users || 0}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    +{userAnalytics?.users_this_week || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">New users this week</p>
                  <div className="mt-4">
                    <div className="text-2xl font-bold text-blue-600">
                      +{userAnalytics?.users_this_month || 0}
                    </div>
                    <p className="text-sm text-muted-foreground">This month</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Complaints Tab */}
        <TabsContent value="complaints" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Category Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                {categoryAnalytics.length > 0 ? (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%" minWidth={300} minHeight={200}>
                      <RechartsPieChart>
                        <Pie
                          data={categoryAnalytics.slice(0, 5).map(cat => ({
                            name: cat.category_name,
                            value: cat.complaint_count,
                            resolution_rate: cat.resolution_rate
                          }))}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${value}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {categoryAnalytics.slice(0, 5).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={`hsl(${index * 60}, 70%, 50%)`} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value, name, props) => [
                          `${value} complaints`,
                          'Complaints'
                        ]} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <PieChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No category data available</p>
                      <p className="text-xs mt-2">
                        Run the SQL functions in Supabase to see data
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Status Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                {priorityAnalytics.length > 0 ? (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%" minWidth={300} minHeight={200}>
                      <RechartsBarChart data={priorityAnalytics.map(p => ({
                        priority: p.priority || p.priority_name || 'Unknown',
                        complaints: p.complaint_count,
                        resolved: p.resolved_count,
                        resolution_rate: p.resolution_rate
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="priority" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value, name, props) => [
                            `${value} complaints`,
                            name === 'complaints' ? 'Total Complaints' : 'Resolved'
                          ]}
                        />
                        <Bar dataKey="complaints" fill="#3b82f6" />
                        <Bar dataKey="resolved" fill="#10b981" />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No status data available</p>
                      <p className="text-xs mt-2">
                        Debug: {priorityAnalytics.length} status items found
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Top Complaint Locations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topLocations.length > 0 ? (
                <div className="space-y-3">
                  {topLocations.map((location, index) => (
                    <div key={location.location} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{location.location}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>{location.complaint_count} complaints</span>
                            <span className="text-green-600">{location.resolved_count} resolved</span>
                            <span className="text-yellow-600">{location.pending_count} pending</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {location.complaint_count > 0 
                            ? Math.round((location.resolved_count / location.complaint_count) * 100)
                            : 0}% resolved
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No location data available</p>
                    <p className="text-xs mt-2">
                      Complaints need location addresses to appear here
                    </p>
                    <p className="text-xs mt-1 text-gray-400">
                      Debug: {topLocations.length} locations found
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Communities Tab */}
        <TabsContent value="communities" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Community Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {communityAnalytics.map((community) => (
                  <div key={community.community_id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-medium">{community.community_name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {community.member_count} members
                        </p>
                      </div>
                      <Badge variant="outline">{community.complaint_count} complaints</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Avg complaints per member:</span>
                        <div className="font-medium">{community.avg_complaints_per_member}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Engagement:</span>
                        <div className="font-medium">
                          {community.avg_complaints_per_member > 1 ? 'High' : 
                           community.avg_complaints_per_member > 0.5 ? 'Medium' : 'Low'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;