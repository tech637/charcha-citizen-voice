import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ThumbsUp, ThumbsDown, MapPin, Calendar, Eye, RefreshCw, AlertCircle, ArrowLeft, Building2, Users, Flag } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getPublicComplaints, getCommunityComplaints, getAllCommunityComplaints } from '@/lib/complaints';
import { getAllCommunities, getCommunityMembers, isUserMemberOfCommunity, joinCommunity } from '@/lib/communities';
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
    <div className="flex items-center space-x-2 text-xs text-gray-600 bg-gray-50 rounded-md px-2 py-1">
      <MapPin className="h-3 w-3 text-gray-500 flex-shrink-0" />
      <span className="font-medium">
        {formattedLocation}
        {isLoading && (
          <span className="ml-1 text-xs text-gray-400">(loading...)</span>
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

const CommunityPage: React.FC = () => {
  const { communityName } = useParams<{ communityName: string }>();
  const navigate = useNavigate();
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
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (communityName) {
      fetchCommunityAndComplaints();
    }
  }, [communityName]);

  const fetchCommunityAndComplaints = async () => {
    try {
      setLoading(true);
      setError(null);

      // First, get all communities to find the one with matching name
      const { data: communities, error: communitiesError } = await getAllCommunities();
      
      if (communitiesError) {
        throw communitiesError;
      }

      // Find the community by name (case-insensitive)
      const foundCommunity = communities?.find(c => 
        c.name.toLowerCase() === communityName?.toLowerCase()
      );

      if (!foundCommunity) {
        const availableCommunities = communities?.map(c => c.name).join(', ') || 'None';
        setError(`Community "${communityName}" not found. Available communities: ${availableCommunities}`);
        setLoading(false);
        
        toast({
          title: "Community Not Found",
          description: `The community "${communityName}" does not exist. Available communities: ${availableCommunities}`,
          variant: "destructive",
        });
        return;
      }

      setCommunity(foundCommunity);

      // Get member count for this community
      try {
        const { data: members, error: membersError } = await getCommunityMembers(foundCommunity.id);
        if (membersError) {
          setMemberCount(0);
        } else {
          setMemberCount(members?.length || 0);
        }
      } catch (error) {
        setMemberCount(0);
      }

      // Check if current user is a member of this community
      if (user) {
        setMembershipLoading(true);
        try {
          const isMember = await isUserMemberOfCommunity(user.id, foundCommunity.id);
          setIsUserMember(isMember);
        } catch (error) {
          console.error('Error checking membership:', error);
          setIsUserMember(false);
        } finally {
          setMembershipLoading(false);
        }
      } else {
        setIsUserMember(false);
      }

      // Get complaints based on community type using new visibility system
      let communityComplaints;
      
      if (foundCommunity.name.toLowerCase() === 'india') {
        // India community shows ALL community complaints (visibility_type = 'community')
        const { data: allCommunityComplaints, error: complaintsError } = await getAllCommunityComplaints();
        
        if (complaintsError) {
          throw complaintsError;
        }
        
        communityComplaints = allCommunityComplaints || [];
      } else {
        // Other communities show only complaints specific to that community
        const { data: specificComplaints, error: complaintsError } = await getCommunityComplaints(foundCommunity.id);
        
        if (complaintsError) {
          throw complaintsError;
        }
        
        communityComplaints = specificComplaints || [];
      }

      setComplaints(communityComplaints);
      
    } catch (err: any) {
      console.error('Error fetching community data:', err);
      const errorMessage = err.message || 'Failed to fetch community data';
      setError(errorMessage);
      
      toast({
        title: "Error Loading Community",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchCommunityAndComplaints();
    setRefreshing(false);
    
    toast({
      title: "Feed Updated",
      description: `Found ${complaints.length} complaints in ${community?.name}`,
    });
  };

  const handleLike = (complaintId: string) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to like complaints",
        variant: "destructive",
      });
      return;
    }

    setLikedComplaints(prev => {
      const newSet = new Set(prev);
      const wasLiked = newSet.has(complaintId);
      
      if (wasLiked) {
        newSet.delete(complaintId);
      } else {
        newSet.add(complaintId);
        
        // Remove from disliked if it was there
        setDislikedComplaints(prevDisliked => {
          const newDislikedSet = new Set(prevDisliked);
          if (newDislikedSet.has(complaintId)) {
            newDislikedSet.delete(complaintId);
          }
          return newDislikedSet;
        });
      }
      return newSet;
    });

    toast({
      title: "Liked!",
      description: "Your feedback has been recorded",
    });
  };

  const handleDislike = (complaintId: string) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to dislike complaints",
        variant: "destructive",
      });
      return;
    }

    setDislikedComplaints(prev => {
      const newSet = new Set(prev);
      const wasDisliked = newSet.has(complaintId);
      
      if (wasDisliked) {
        newSet.delete(complaintId);
      } else {
        newSet.add(complaintId);
        
        // Remove from liked if it was there
        setLikedComplaints(prevLiked => {
          const newLikedSet = new Set(prevLiked);
          if (newLikedSet.has(complaintId)) {
            newLikedSet.delete(complaintId);
          }
          return newLikedSet;
        });
      }
      return newSet;
    });

    toast({
      title: "Disliked",
      description: "Your feedback has been recorded",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'in_progress':
        return 'In Progress';
      case 'resolved':
        return 'Resolved';
      case 'rejected':
        return 'Rejected';
      default:
        return status;
    }
  };

  // Join community function
  const handleJoinCommunity = async () => {
    if (!user || !community) {
      toast({
        title: "Login Required",
        description: "Please login to join communities",
        variant: "destructive",
      });
      return;
    }

    try {
      setMembershipLoading(true);
      
      const { data, error } = await joinCommunity(community.id, user.id);
      
      if (error) {
        throw error;
      }

      // Update membership status
      setIsUserMember(true);
      
      // Update member count
      setMemberCount(prev => prev + 1);

      toast({
        title: "Successfully Joined!",
        description: `You've joined the ${community.name} community`,
      });
    } catch (error: any) {
      console.error('Error joining community:', error);
      toast({
        title: "Error Joining Community",
        description: error.message || "Failed to join community. Please try again.",
        variant: "destructive",
      });
    } finally {
      setMembershipLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return 'Invalid Date';
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    try {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    } catch (error) {
      console.error('Error getting initials for name:', name, error);
      return 'U';
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading {communityName} community...</p>
              <p className="text-xs text-muted-foreground mt-2">
                Fetching community data and complaints...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !community) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center max-w-md mx-auto">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-red-600 mb-4">Community Not Found</h1>
            <p className="text-muted-foreground mb-6">
              {error || `The community "${communityName}" does not exist.`}
            </p>
            <div className="space-y-2">
              <Button onClick={() => navigate('/communities')} className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Communities
              </Button>
              <Button variant="outline" onClick={() => window.location.reload()} className="w-full">
                Reload Page
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <Navigation />
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Community Header */}
        <div className="bg-white rounded-lg shadow-sm border p-4 md:p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/communities')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div className="flex items-center gap-3">
                {community.name === 'India' ? (
                  <Flag className="h-8 w-8 text-orange-500" />
                ) : (
                  <Building2 className="h-8 w-8 text-primary" />
                )}
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                    {community.name} Community
                  </h1>
                  <p className="text-sm text-gray-600 mt-1">
                    {community.name.toLowerCase() === 'india' 
                      ? 'All public complaints from across India • Every citizen is automatically a member'
                      : community.description
                    }
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-sm text-gray-600">
                  {community.name.toLowerCase() === 'india' ? 'All Citizens' : 'Members'}
                </div>
                <div className="text-lg font-semibold text-gray-900">
                  {community.name.toLowerCase() === 'india' ? '∞' : memberCount}
                </div>
              </div>
              
              {/* Membership Status and Join Button */}
              {community.name.toLowerCase() !== 'india' && user && (
                <div className="flex items-center gap-2">
                  {membershipLoading ? (
                    <div className="text-sm text-gray-500">Checking...</div>
                  ) : isUserMember ? (
                    <div className="flex items-center gap-1 text-green-600 text-sm">
                      <Users className="h-4 w-4" />
                      <span>You're a Member</span>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      onClick={handleJoinCommunity}
                      disabled={membershipLoading}
                      className="flex items-center gap-2"
                    >
                      <Users className="h-4 w-4" />
                      Join Community
                    </Button>
                  )}
                </div>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
          <div className="bg-white rounded-lg border p-3 md:p-4">
            <div className="text-lg md:text-2xl font-bold text-gray-900">{complaints.length}</div>
            <div className="text-xs md:text-sm text-gray-600">
              {community.name.toLowerCase() === 'india' ? 'Public Complaints' : 'Total Complaints'}
            </div>
          </div>
          <div className="bg-white rounded-lg border p-3 md:p-4">
            <div className="text-lg md:text-2xl font-bold text-yellow-600">
              {complaints.filter(c => c.status === 'pending').length}
            </div>
            <div className="text-xs md:text-sm text-gray-600">Pending</div>
          </div>
          <div className="bg-white rounded-lg border p-3 md:p-4">
            <div className="text-lg md:text-2xl font-bold text-blue-600">
              {complaints.filter(c => c.status === 'in_progress').length}
            </div>
            <div className="text-xs md:text-sm text-gray-600">In Progress</div>
          </div>
          <div className="bg-white rounded-lg border p-3 md:p-4">
            <div className="text-lg md:text-2xl font-bold text-green-600">
              {complaints.filter(c => c.status === 'resolved').length}
            </div>
            <div className="text-xs md:text-sm text-gray-600">Resolved</div>
          </div>
        </div>

        {/* Tabs for filtering complaints */}
        <Tabs defaultValue="in_progress" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="in_progress">
              In Progress ({complaints.filter(c => c.status === 'pending' || c.status === 'in_progress').length})
            </TabsTrigger>
            <TabsTrigger value="resolved">
              Resolved ({complaints.filter(c => c.status === 'resolved').length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="in_progress">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {complaints.filter(c => c.status === 'pending' || c.status === 'in_progress').length === 0 ? (
                <div className="col-span-full bg-white rounded-lg border p-8 text-center">
                  <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2 text-gray-900">No In Progress Complaints</h3>
                  <p className="text-gray-600 mb-4">
                    No pending or in-progress complaints in {community.name} community.
                  </p>
                </div>
              ) : (
                complaints.filter(c => c.status === 'pending' || c.status === 'in_progress').map((complaint) => (
                  <div key={complaint.id} className="bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow">
                    <div className="p-4 md:p-6">
                      {/* Header Row */}
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {getInitials(complaint.users?.full_name)}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 text-sm md:text-base">
                              {complaint.users?.full_name || 'Anonymous User'}
                            </h3>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(complaint.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {complaint.category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Badge>
                          <Badge className={`${getStatusColor(complaint.status)} text-xs`}>
                            {getStatusText(complaint.status)}
                          </Badge>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="space-y-3">
                        {/* Location */}
                        <LocationDisplay 
                          location_address={complaint.location_address}
                          latitude={complaint.latitude}
                          longitude={complaint.longitude}
                        />

                        {/* Description */}
                        <div className="bg-gray-50 rounded-lg p-3 md:p-4">
                          <h4 className="text-xs font-medium text-gray-600 mb-2">COMPLAINT DESCRIPTION</h4>
                          <p className="text-sm text-gray-900 leading-relaxed">
                            {complaint.description}
                          </p>
                        </div>

                        {/* Media Files */}
                        {complaint.complaint_files && complaint.complaint_files.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-xs font-medium text-gray-600">ATTACHMENTS</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              {complaint.complaint_files.map((file) => (
                                <div key={file.id} className="relative">
                                  {file.file_type.startsWith('image/') ? (
                                    <img
                                      src={file.file_url}
                                      alt={file.file_name}
                                      className="w-full h-20 md:h-24 object-cover rounded-md border"
                                      onError={(e) => {
                                        console.error('Image load error for file:', file.file_name);
                                        e.currentTarget.style.display = 'none';
                                      }}
                                    />
                                  ) : (
                                    <div className="w-full h-20 md:h-24 bg-gray-100 rounded-md border flex items-center justify-center">
                                      <span className="text-xs text-gray-500">
                                        {file.file_name}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleLike(complaint.id)}
                              className={`flex items-center space-x-1 text-xs ${
                                likedComplaints.has(complaint.id) 
                                  ? 'text-green-600 bg-green-50' 
                                  : 'text-gray-600 hover:bg-green-50 hover:text-green-600'
                              }`}
                            >
                              <ThumbsUp className="h-3 w-3" />
                              <span>Like</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDislike(complaint.id)}
                              className={`flex items-center space-x-1 text-xs ${
                                dislikedComplaints.has(complaint.id) 
                                  ? 'text-red-600 bg-red-50' 
                                  : 'text-gray-600 hover:bg-red-50 hover:text-red-600'
                              }`}
                            >
                              <ThumbsDown className="h-3 w-3" />
                              <span>Dislike</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="resolved">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {complaints.filter(c => c.status === 'resolved').length === 0 ? (
                <div className="col-span-full bg-white rounded-lg border p-8 text-center">
                  <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2 text-gray-900">No Resolved Complaints</h3>
                  <p className="text-gray-600 mb-4">
                    No resolved complaints in {community.name} community.
                  </p>
                </div>
              ) : (
                complaints.filter(c => c.status === 'resolved').map((complaint) => (
                  <div key={complaint.id} className="bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow">
                    <div className="p-4 md:p-6">
                      {/* Header Row */}
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {getInitials(complaint.users?.full_name)}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 text-sm md:text-base">
                              {complaint.users?.full_name || 'Anonymous User'}
                            </h3>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(complaint.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {complaint.category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Badge>
                          <Badge className={`${getStatusColor(complaint.status)} text-xs`}>
                            {getStatusText(complaint.status)}
                          </Badge>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="space-y-3">
                        {/* Location */}
                        <LocationDisplay 
                          location_address={complaint.location_address}
                          latitude={complaint.latitude}
                          longitude={complaint.longitude}
                        />

                        {/* Description */}
                        <div className="bg-gray-50 rounded-lg p-3 md:p-4">
                          <h4 className="text-xs font-medium text-gray-600 mb-2">COMPLAINT DESCRIPTION</h4>
                          <p className="text-sm text-gray-900 leading-relaxed">
                            {complaint.description}
                          </p>
                        </div>

                        {/* Media Files */}
                        {complaint.complaint_files && complaint.complaint_files.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-xs font-medium text-gray-600">ATTACHMENTS</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              {complaint.complaint_files.map((file) => (
                                <div key={file.id} className="relative">
                                  {file.file_type.startsWith('image/') ? (
                                    <img
                                      src={file.file_url}
                                      alt={file.file_name}
                                      className="w-full h-20 md:h-24 object-cover rounded-md border"
                                      onError={(e) => {
                                        console.error('Image load error for file:', file.file_name);
                                        e.currentTarget.style.display = 'none';
                                      }}
                                    />
                                  ) : (
                                    <div className="w-full h-20 md:h-24 bg-gray-100 rounded-md border flex items-center justify-center">
                                      <span className="text-xs text-gray-500">
                                        {file.file_name}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleLike(complaint.id)}
                              className={`flex items-center space-x-1 text-xs ${
                                likedComplaints.has(complaint.id) 
                                  ? 'text-green-600 bg-green-50' 
                                  : 'text-gray-600 hover:bg-green-50 hover:text-green-600'
                              }`}
                            >
                              <ThumbsUp className="h-3 w-3" />
                              <span>Like</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDislike(complaint.id)}
                              className={`flex items-center space-x-1 text-xs ${
                                dislikedComplaints.has(complaint.id) 
                                  ? 'text-red-600 bg-red-50' 
                                  : 'text-gray-600 hover:bg-red-50 hover:text-red-600'
                              }`}
                            >
                              <ThumbsDown className="h-3 w-3" />
                              <span>Dislike</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CommunityPage;
