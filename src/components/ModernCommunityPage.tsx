import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ResponsiveContainer, ResponsiveSection, ResponsiveGrid, ResponsiveCard } from './responsive/ResponsiveLayout';
import { EmptyState } from './ui/empty-state';
import { FloatingActionButton } from './ui/floating-action-button';
import { StatusBadge } from './ui/status-badge';
import { ThumbsUp, ThumbsDown, MapPin, Calendar, Eye, RefreshCw, AlertCircle, ArrowLeft, Building2, Users, Flag, Crown, DollarSign, FileText, Clock, CheckCircle, Plus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getPublicComplaints, getCommunityComplaints, getAllCommunityComplaints, updateComplaintStatus, getComplaintVoteSummary, upsertComplaintVote, removeComplaintVote, listComplaintComments, addComplaintComment } from '@/lib/complaints';
import { getAllCommunities, getCommunityMembers, isUserMemberOfCommunity, isUserAdmin, getPendingMembershipRequests, updateMembershipStatus, updateCommunity } from '@/lib/communities';
import ComplaintForm from './ComplaintForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/lib/supabase';
import { getCommunityFinanceSummary, getCommunityTransactions, addCommunityTransaction } from '@/lib/finance';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { hasLocationData } from '@/lib/locationUtils';
import { useLocationFormat } from '@/hooks/useLocationFormat';
import Navigation from './Navigation';

// Location display component
const LocationDisplay: React.FC<{
  location_address?: string;
  latitude?: number;
  longitude?: number;
}> = ({ location_address, latitude, longitude }) => {
  const { formattedLocation, isLoading } = useLocationFormat(location_address, latitude, longitude);

  if (!hasLocationData(location_address, latitude, longitude)) {
    return null;
  }

  return (
    <div className="flex items-center space-x-2 text-xs text-muted-foreground bg-muted/30 rounded-md px-2 py-1">
      <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
      <span className="font-medium">
        {formattedLocation}
        {isLoading && (
          <span className="ml-1 text-xs text-muted-foreground">(loading...)</span>
        )}
      </span>
    </div>
  );
};

interface CommunityComplaint {
  id: string;
  category: string;
  description: string;
  location_address?: string;
  latitude?: number;
  longitude?: number;
  status: 'pending' | 'in_progress' | 'resolved' | 'rejected';
  created_at: string;
  community_id?: string;
  users: {
    full_name?: string;
  };
  complaint_files: Array<{
    id: string;
    file_url: string;
    file_name: string;
    file_type: string;
  }>;
}

interface Community {
  id: string;
  name: string;
  description: string;
  location: string;
  admin_id: string;
  is_active: boolean;
  created_at: string;
}

const ModernCommunityPage: React.FC = () => {
  const { communityName } = useParams<{ communityName: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  // State
  const [complaints, setComplaints] = useState<CommunityComplaint[]>([]);
  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [likedComplaints, setLikedComplaints] = useState<Set<string>>(new Set());
  const [dislikedComplaints, setDislikedComplaints] = useState<Set<string>>(new Set());
  const [memberCount, setMemberCount] = useState(0);
  const [isUserMember, setIsUserMember] = useState<boolean | null>(null);
  const [membershipLoading, setMembershipLoading] = useState(false);
  const [president, setPresident] = useState<{ full_name?: string | null; email?: string | null; phone?: string | null } | null>(null);
  const [finance, setFinance] = useState<{ collected: number; spent: number; balance: number }>({ collected: 0, spent: 0, balance: 0 });
  const [recentTx, setRecentTx] = useState<Array<{ id: string; type: 'income'|'expense'; amount: number; note?: string|null; created_at: string }>>([]);
  const [isPresidentOrAdmin, setIsPresidentOrAdmin] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [updatingReqId, setUpdatingReqId] = useState<string | null>(null);
  const [updatingComplaintId, setUpdatingComplaintId] = useState<string | null>(null);
  const [isAddingTx, setIsAddingTx] = useState(false);
  const [txForm, setTxForm] = useState<{ type: 'income'|'expense'; amount: string; note: string }>({ type: 'income', amount: '', note: '' });
  const [voteSummary, setVoteSummary] = useState<Record<string, { up: number; down: number }>>({});
  const [showComplaintForm, setShowComplaintForm] = useState(false);
  const [membershipStatus, setMembershipStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none');

  // Load community data
  useEffect(() => {
    const loadCommunityData = async () => {
      if (!communityName) return;
      
      try {
        setLoading(true);
        setError(null);

        // Load community
        const { data: communities, error: communitiesError } = await getAllCommunities();
        if (communitiesError) throw communitiesError;

        const foundCommunity = communities?.find(c => 
          c.name.toLowerCase() === communityName.toLowerCase()
        );

        if (!foundCommunity) {
          setError(`Community "${communityName}" not found`);
          return;
        }

        setCommunity(foundCommunity);

        // Load complaints
        const { data: complaintsData, error: complaintsError } = await getAllCommunityComplaints(foundCommunity.id);
        if (complaintsError) throw complaintsError;
        setComplaints(complaintsData || []);

        // Load member count
        const { data: members } = await getCommunityMembers(foundCommunity.id);
        setMemberCount(members?.length || 0);

        // Load president info
        if (foundCommunity.admin_id) {
          const { data: presidentData } = await supabase
            .from('users')
            .select('full_name, email, phone')
            .eq('id', foundCommunity.admin_id)
            .single();
          setPresident(presidentData);
        }

        // Load finance data
        const financeData = await getCommunityFinanceSummary(foundCommunity.id);
        setFinance(financeData);

        // Check if user is president or admin
        if (user) {
          const isAdmin = await isUserAdmin(user.id);
          const isPresident = foundCommunity.admin_id === user.id;
          setIsPresidentOrAdmin(isAdmin || isPresident);
        }

      } catch (err: any) {
        console.error('Error loading community:', err);
        setError(err.message || 'Failed to load community');
      } finally {
        setLoading(false);
      }
    };

    loadCommunityData();
  }, [communityName, user]);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    // Reload all data
    window.location.reload();
  };

  // Handle vote
  const handleVote = async (complaintId: string, voteType: 'up' | 'down') => {
    if (!user) return;

    try {
      const isUpvote = voteType === 'up';
      const isDownvote = voteType === 'down';
      
      const currentlyLiked = likedComplaints.has(complaintId);
      const currentlyDisliked = dislikedComplaints.has(complaintId);

      if (isUpvote && currentlyLiked) {
        // Remove upvote
        await removeComplaintVote(complaintId, user.id);
        setLikedComplaints(prev => {
          const newSet = new Set(prev);
          newSet.delete(complaintId);
          return newSet;
        });
      } else if (isDownvote && currentlyDisliked) {
        // Remove downvote
        await removeComplaintVote(complaintId, user.id);
        setDislikedComplaints(prev => {
          const newSet = new Set(prev);
          newSet.delete(complaintId);
          return newSet;
        });
      } else {
        // Add vote
        await upsertComplaintVote(complaintId, user.id, voteType);
        
        if (isUpvote) {
          setLikedComplaints(prev => new Set(prev).add(complaintId));
          setDislikedComplaints(prev => {
            const newSet = new Set(prev);
            newSet.delete(complaintId);
            return newSet;
          });
        } else {
          setDislikedComplaints(prev => new Set(prev).add(complaintId));
          setLikedComplaints(prev => {
            const newSet = new Set(prev);
            newSet.delete(complaintId);
            return newSet;
          });
        }
      }

      // Refresh vote summary
      const summary = await getComplaintVoteSummary(complaintId);
      setVoteSummary(prev => ({
        ...prev,
        [complaintId]: summary
      }));

    } catch (error) {
      console.error('Error voting:', error);
      toast({
        title: "Error",
        description: "Failed to vote on complaint",
        variant: "destructive"
      });
    }
  };

  // Load pending requests
  const loadPendingRequests = async () => {
    if (!community) return;
    
    setRequestsLoading(true);
    try {
      const { data, error } = await getPendingMembershipRequests(community.id);
      if (error) throw error;
      setPendingRequests(data || []);
    } catch (error) {
      console.error('Error loading requests:', error);
      toast({
        title: "Error",
        description: "Failed to load pending requests",
        variant: "destructive"
      });
    } finally {
      setRequestsLoading(false);
    }
  };

  // Handle request update
  const handleRequestUpdate = async (requestId: string, status: 'approved' | 'rejected') => {
    setUpdatingReqId(requestId);
    try {
      const { error } = await updateMembershipStatus(requestId, status);
      if (error) throw error;
      
      toast({
        title: "Success",
        description: `Request ${status} successfully`,
      });
      
      // Reload requests
      await loadPendingRequests();
    } catch (error) {
      console.error('Error updating request:', error);
      toast({
        title: "Error",
        description: "Failed to update request",
        variant: "destructive"
      });
    } finally {
      setUpdatingReqId(null);
    }
  };

  // Loading state
  if (loading) {
    return (
      <ResponsiveContainer className="py-8">
        <ResponsiveSection spacing="lg">
          <EmptyState
            icon={<Building2 className="h-12 w-12" />}
            title={`Loading ${communityName} Community`}
            description="Fetching community data and complaints..."
            action={
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            }
          />
        </ResponsiveSection>
      </ResponsiveContainer>
    );
  }

  // Error state
  if (error || !community) {
    return (
      <ResponsiveContainer className="py-8">
        <ResponsiveSection spacing="lg">
          <EmptyState
            icon={<AlertCircle className="h-12 w-12" />}
            title="Community Not Found"
            description={error || `The community "${communityName}" does not exist.`}
            action={
              <Button onClick={() => navigate('/communities')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Communities
              </Button>
            }
          />
        </ResponsiveSection>
      </ResponsiveContainer>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Clean Header Card */}
        <Card className="mb-8 shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/communities')}
                  className="flex items-center gap-2 hover:bg-primary/5"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <div className="flex items-center gap-4">
                  {community.name === 'India' ? (
                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                      <Flag className="h-6 w-6 text-orange-600" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                  )}
                  <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                      {community.name} Community
                    </h1>
                    <p className="text-muted-foreground mt-1">
                      {community.name.toLowerCase() === 'india' 
                        ? 'All public complaints from across India • Every citizen is automatically a member'
                        : community.description
                      }
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-sm text-muted-foreground mb-1">
                    {community.name.toLowerCase() === 'india' ? 'All Citizens' : 'Members'}
                  </div>
                  <div className="text-3xl font-bold text-foreground">
                    {community.name.toLowerCase() === 'india' ? '∞' : memberCount}
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Button
                    onClick={handleRefresh}
                    variant="outline"
                    size="sm"
                    disabled={refreshing}
                    className="hover:bg-primary/5"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  
                  {user && (
                    <Button
                      onClick={() => setShowComplaintForm(true)}
                      size="sm"
                      className="font-medium"
                    >
                      <Flag className="h-4 w-4 mr-2" />
                      File Complaint
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* President Card */}
          <Card className="shadow-md hover:shadow-lg transition-all duration-300 border-0">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Crown className="h-4 w-4 text-yellow-600" />
                  </div>
                  <h3 className="font-semibold text-foreground">President</h3>
                </div>
                {president ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                          {president.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'P'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-foreground">{president.full_name || 'President'}</div>
                        <div className="text-sm text-muted-foreground">{president.email}</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No president assigned</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Finance Card */}
          <Card className="shadow-md hover:shadow-lg transition-all duration-300 border-0">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-foreground">Finance</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Collected</span>
                    <span className="font-semibold text-green-600">₹ {finance.collected}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Spent</span>
                    <span className="font-semibold text-red-600">₹ {finance.spent}</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-foreground">Balance</span>
                      <span className="font-bold text-lg text-foreground">₹ {finance.balance}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Complaints Stats Card */}
          <Card className="shadow-md hover:shadow-lg transition-all duration-300 border-0">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-4 w-4 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-foreground">Complaints</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total</span>
                    <span className="font-semibold text-foreground">{complaints.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Pending</span>
                    <span className="font-semibold text-yellow-600">{complaints.filter(c => c.status === 'pending').length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">In Progress</span>
                    <span className="font-semibold text-blue-600">{complaints.filter(c => c.status === 'in_progress').length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Resolved</span>
                    <span className="font-semibold text-green-600">{complaints.filter(c => c.status === 'resolved').length}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions Card */}
          <Card className="shadow-md hover:shadow-lg transition-all duration-300 border-0">
            <CardContent className="p-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">Quick Actions</h3>
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start hover:bg-primary/5"
                    onClick={() => setShowComplaintForm(true)}
                  >
                    <Flag className="h-4 w-4 mr-2" />
                    File Complaint
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start hover:bg-primary/5"
                    onClick={handleRefresh}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Data
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* President Panel */}
        {isPresidentOrAdmin && (
          <Card className="mb-8 shadow-lg border-0">
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Crown className="h-4 w-4 text-yellow-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">President Panel</h3>
                </div>
                
                <Tabs defaultValue="requests" className="w-full">
                  <TabsList className="grid w-full grid-cols-4 bg-muted/30">
                    <TabsTrigger value="requests" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      Requests
                    </TabsTrigger>
                    <TabsTrigger value="complaints" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      Complaints
                    </TabsTrigger>
                    <TabsTrigger value="finance" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      Finance
                    </TabsTrigger>
                    <TabsTrigger value="profile" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      Profile
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="requests" className="mt-6">
                    <div className="space-y-4">
                      <Button
                        onClick={loadPendingRequests}
                        disabled={requestsLoading}
                        size="sm"
                        className="font-medium"
                      >
                        {requestsLoading ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          <>
                            <Clock className="h-4 w-4 mr-2" />
                            Load Pending Requests
                          </>
                        )}
                      </Button>
                      
                      {pendingRequests.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                          <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Clock className="h-8 w-8" />
                          </div>
                          <p className="text-lg font-medium">0 pending requests</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {pendingRequests.map((req) => (
                            <Card key={req.id} className="border border-border/50">
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="font-medium text-foreground">{req.users?.full_name || req.users?.email || 'User'}</div>
                                    <div className="text-sm text-muted-foreground">
                                      Block: {req.block_name || req.blocks?.name || '—'} • Role: {req.role}
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      disabled={updatingReqId === req.id}
                                      onClick={() => handleRequestUpdate(req.id, 'rejected')}
                                      className="hover:bg-red-50 hover:border-red-200"
                                    >
                                      Reject
                                    </Button>
                                    <Button
                                      size="sm"
                                      disabled={updatingReqId === req.id}
                                      onClick={() => handleRequestUpdate(req.id, 'approved')}
                                      className="hover:bg-green-50"
                                    >
                                      Approve
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="complaints" className="mt-6">
                    <div className="text-center py-12 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4" />
                      <p className="text-lg font-medium">Complaint management features will be available here.</p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="finance" className="mt-6">
                    <div className="text-center py-12 text-muted-foreground">
                      <DollarSign className="h-12 w-12 mx-auto mb-4" />
                      <p className="text-lg font-medium">Finance management features will be available here.</p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="profile" className="mt-6">
                    <div className="text-center py-12 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4" />
                      <p className="text-lg font-medium">Profile management features will be available here.</p>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Complaints Section */}
        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-4 w-4 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">Recent Complaints</h3>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  className="hover:bg-primary/5"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
              
              {complaints.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No Complaints Yet</h3>
                  <p className="text-muted-foreground mb-6">Be the first to file a complaint in this community.</p>
                  {user ? (
                    <Button onClick={() => setShowComplaintForm(true)} className="font-medium">
                      <Flag className="h-4 w-4 mr-2" />
                      File First Complaint
                    </Button>
                  ) : (
                    <Button onClick={() => navigate('/auth')} className="font-medium">
                      Login to File Complaint
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {complaints.slice(0, 5).map((complaint) => (
                    <Card key={complaint.id} className="border border-border/50 hover:shadow-md transition-all duration-200">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant={complaint.status === 'resolved' ? 'default' : complaint.status === 'in_progress' ? 'secondary' : 'outline'}
                                className={`text-xs ${
                                  complaint.status === 'resolved' ? 'bg-green-100 text-green-700 border-green-200' :
                                  complaint.status === 'in_progress' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                  'bg-yellow-100 text-yellow-700 border-yellow-200'
                                }`}
                              >
                                {complaint.status.replace('_', ' ')}
                              </Badge>
                              <span className="text-sm font-medium text-foreground">{complaint.category}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleVote(complaint.id, 'up')}
                                className={`hover:bg-green-50 ${likedComplaints.has(complaint.id) ? 'text-green-600 bg-green-50' : ''}`}
                              >
                                <ThumbsUp className="h-4 w-4" />
                                <span className="ml-1 text-xs">{voteSummary[complaint.id]?.up || 0}</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleVote(complaint.id, 'down')}
                                className={`hover:bg-red-50 ${dislikedComplaints.has(complaint.id) ? 'text-red-600 bg-red-50' : ''}`}
                              >
                                <ThumbsDown className="h-4 w-4" />
                                <span className="ml-1 text-xs">{voteSummary[complaint.id]?.down || 0}</span>
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">{complaint.description}</p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>By {complaint.users?.full_name || 'Anonymous'}</span>
                            <span>{new Date(complaint.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modern Floating Action Button */}
      {user && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            size="lg"
            className="rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all duration-300 bg-primary hover:bg-primary/90"
            onClick={() => setShowComplaintForm(true)}
            title="File Complaint"
          >
            <Flag className="h-6 w-6" />
          </Button>
        </div>
      )}

      {/* Complaint Form Modal */}
      {showComplaintForm && (
        isMobile ? (
          <Drawer open={showComplaintForm} onOpenChange={setShowComplaintForm}>
            <DrawerContent className="max-h-[85vh] overflow-y-auto">
              <DrawerHeader>
                <DrawerTitle>File a Complaint</DrawerTitle>
              </DrawerHeader>
              <div className="px-4 pb-6">
                <ComplaintForm
                  stayOnPage
                  onSubmitted={async () => {
                    setShowComplaintForm(false);
                    await handleRefresh();
                  }}
                />
              </div>
            </DrawerContent>
          </Drawer>
        ) : (
          <Dialog open={showComplaintForm} onOpenChange={setShowComplaintForm}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>File a Complaint</DialogTitle>
              </DialogHeader>
              <ComplaintForm
                stayOnPage
                onSubmitted={async () => {
                  setShowComplaintForm(false);
                  await handleRefresh();
                }}
              />
            </DialogContent>
          </Dialog>
        )
      )}
    </div>
  );
};

export default ModernCommunityPage;
