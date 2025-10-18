import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Shield, Building2, Users, BarChart3, FileText, Info } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  LeaderType, 
  LeaderCommunity, 
  isUserLeader, 
  getUserLeaderCommunities 
} from '@/lib/leaders';
import LeaderOverview from './LeaderOverview';
import LeaderComplaints from './LeaderComplaints';
import LeaderAnalytics from './LeaderAnalytics';
import LeaderCommunityInfo from './LeaderCommunityInfo';

interface LeaderDashboardProps {
  leaderType: LeaderType;
}

const LeaderDashboard: React.FC<LeaderDashboardProps> = ({ leaderType }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [communities, setCommunities] = useState<LeaderCommunity[]>([]);
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(null);
  const [selectedCommunity, setSelectedCommunity] = useState<LeaderCommunity | null>(null);

  const leaderTypeLabels = {
    mp: 'MP',
    mla: 'MLA', 
    councillor: 'Councillor'
  };

  const leaderTypeColors = {
    mp: 'bg-purple-100 text-purple-800',
    mla: 'bg-green-100 text-green-800',
    councillor: 'bg-blue-100 text-blue-800'
  };

  const leaderTypeIcons = {
    mp: Shield,
    mla: Users,
    councillor: Building2
  };

  useEffect(() => {
    checkLeaderAccess();
  }, [user, leaderType]);

  useEffect(() => {
    if (selectedCommunityId && communities.length > 0) {
      const community = communities.find(c => c.community_id === selectedCommunityId);
      setSelectedCommunity(community || null);
    }
  }, [selectedCommunityId, communities]);

  const checkLeaderAccess = async () => {
    if (!user) {
      navigate('/');
      return;
    }

    try {
      setLoading(true);
      
      // Get all communities where user is assigned as this leader type
      const { data: userCommunities, error } = await getUserLeaderCommunities(user.id, leaderType);
      
      if (error) {
        console.error('Error fetching leader communities:', error);
        toast({
          title: "Error",
          description: "Failed to fetch your assigned communities",
          variant: "destructive"
        });
        navigate('/');
        return;
      }

      if (!userCommunities || userCommunities.length === 0) {
        toast({
          title: "No Access",
          description: `You are not assigned as a ${leaderTypeLabels[leaderType]} for any community`,
          variant: "destructive"
        });
        navigate('/');
        return;
      }

      setCommunities(userCommunities);
      setHasAccess(true);
      
      // Auto-select first community if only one
      if (userCommunities.length === 1) {
        setSelectedCommunityId(userCommunities[0].community_id);
      }
      
    } catch (error) {
      console.error('Error checking leader access:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleCommunityChange = (communityId: string) => {
    setSelectedCommunityId(communityId);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Checking leader access...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return null; // Will redirect to home
  }

  const LeaderIcon = leaderTypeIcons[leaderType];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <LeaderIcon className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {leaderTypeLabels[leaderType]} Dashboard
              </h1>
              <p className="text-gray-600">
                Manage complaints and view analytics for your assigned communities
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </div>

        {/* Community Selector */}
        {communities.length > 1 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Select Community
              </CardTitle>
              <CardDescription>
                Choose which community to manage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedCommunityId || ''} onValueChange={handleCommunityChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a community" />
                </SelectTrigger>
                <SelectContent>
                  {communities.map((community) => (
                    <SelectItem key={community.community_id} value={community.community_id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{community.community_name}</span>
                        <Badge className={`ml-2 ${leaderTypeColors[leaderType]}`}>
                          {leaderTypeLabels[leaderType]}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}

        {/* Selected Community Info */}
        {selectedCommunity && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    {selectedCommunity.community_name}
                  </CardTitle>
                  <CardDescription>
                    {selectedCommunity.community_description}
                  </CardDescription>
                </div>
                <Badge className={leaderTypeColors[leaderType]}>
                  {leaderTypeLabels[leaderType]}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600">
                <p><strong>Location:</strong> {selectedCommunity.community_location}</p>
                <p><strong>Assigned:</strong> {new Date(selectedCommunity.assigned_at).toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        {selectedCommunityId ? (
          <div className="space-y-6">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="complaints" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Complaints
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Analytics
                </TabsTrigger>
                <TabsTrigger value="community" className="flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Community Info
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6">
                <LeaderOverview 
                  communityId={selectedCommunityId} 
                  leaderType={leaderType}
                />
              </TabsContent>

              <TabsContent value="complaints" className="mt-6">
                <LeaderComplaints 
                  communityId={selectedCommunityId} 
                  leaderType={leaderType}
                />
              </TabsContent>

              <TabsContent value="analytics" className="mt-6">
                <LeaderAnalytics 
                  communityId={selectedCommunityId} 
                  leaderType={leaderType}
                />
              </TabsContent>

              <TabsContent value="community" className="mt-6">
                <LeaderCommunityInfo 
                  communityId={selectedCommunityId} 
                  leaderType={leaderType}
                />
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <Card className="text-center py-8">
            <CardContent>
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Select a Community</h3>
              <p className="text-muted-foreground">
                Choose a community from the dropdown above to start managing complaints and viewing analytics.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default LeaderDashboard;
