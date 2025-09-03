import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThumbsUp, ThumbsDown, MapPin, Calendar, Eye, RefreshCw, AlertCircle } from 'lucide-react';
import { getPublicComplaints } from '@/lib/complaints';
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
    <div className="flex items-center space-x-2 text-sm text-muted-foreground bg-muted/30 rounded-md px-3 py-2">
      <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
      <span className="font-medium">
        {formattedLocation}
        {isLoading && (
          <span className="ml-2 text-xs text-muted-foreground">(loading...)</span>
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

const CommunityFeed: React.FC = () => {
  const [complaints, setComplaints] = useState<CommunityComplaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [likedComplaints, setLikedComplaints] = useState<Set<string>>(new Set());
  const [dislikedComplaints, setDislikedComplaints] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  const { toast } = useToast();

  // Essential logging for error tracking
  console.log('CommunityFeed: Component mounted');

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const { data, error: fetchError } = await getPublicComplaints();
      
      if (fetchError) {
        console.error('CommunityFeed: Fetch error:', fetchError);
        throw fetchError;
      }
      
      setComplaints(data || []);
      
      // Success toast for refresh
      if (isRefresh) {
        toast({
          title: "Feed Updated",
          description: `Found ${data?.length || 0} public complaints`,
        });
      }
      
    } catch (err: any) {
      console.error('CommunityFeed: Error in fetchComplaints:', err);
      const errorMessage = err.message || 'Failed to fetch complaints';
      setError(errorMessage);
      
      toast({
        title: "Error Loading Feed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
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
      console.error('CommunityFeed: Error formatting date:', dateString, error);
      return 'Invalid Date';
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    try {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    } catch (error) {
      console.error('CommunityFeed: Error getting initials for name:', name, error);
      return 'U';
    }
  };

  const handleRefresh = () => {
    fetchComplaints(true);
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
              <p className="text-muted-foreground">Loading community feed...</p>
              <p className="text-xs text-muted-foreground mt-2">
                Fetching public complaints from database...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center max-w-md mx-auto">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Feed</h1>
            <p className="text-muted-foreground mb-6">{error}</p>
            <div className="space-y-2">
              <Button onClick={handleRefresh} className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button variant="outline" onClick={() => window.location.reload()} className="w-full">
                Reload Page
              </Button>
            </div>
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-sm text-muted-foreground">
                Debug Information
              </summary>
              <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                {JSON.stringify({ error, timestamp: new Date().toISOString() }, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Community Feed</h1>
              <p className="text-muted-foreground">
                See what issues your neighbors are reporting and show your support
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{complaints.length}</div>
              <div className="text-sm text-muted-foreground">Total Complaints</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">
                {complaints.filter(c => c.status === 'pending').length}
              </div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">
                {complaints.filter(c => c.status === 'in_progress').length}
              </div>
              <div className="text-sm text-muted-foreground">In Progress</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">
                {complaints.filter(c => c.status === 'resolved').length}
              </div>
              <div className="text-sm text-muted-foreground">Resolved</div>
            </CardContent>
          </Card>
        </div>



        {/* Complaints Feed */}
        <div className="space-y-6">
          {complaints.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Public Complaints Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Be the first to share a complaint publicly and help build the community feed!
                </p>
                <Button onClick={() => window.location.href = '/'}>
                  File a Complaint
                </Button>
              </CardContent>
            </Card>
                       ) : (
               complaints.map((complaint) => (
                 <Card key={complaint.id} className="hover:shadow-lg transition-all duration-300 border-border/60 bg-card/50 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src="" />
                          <AvatarFallback>{getInitials(complaint.users?.full_name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">
                            {complaint.users?.full_name || 'Anonymous User'}
                          </CardTitle>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(complaint.created_at)}</span>
                          </div>
                        </div>
                      </div>
                      <Badge className={getStatusColor(complaint.status)}>
                        {getStatusText(complaint.status)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Category */}
                      <div>
                        <Badge variant="outline" className="mb-2 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors">
                          {complaint.category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Badge>
                      </div>

                      {/* Location */}
                      <LocationDisplay 
                        location_address={complaint.location_address}
                        latitude={complaint.latitude}
                        longitude={complaint.longitude}
                      />

                      {/* Description */}
                      <div className="bg-gradient-to-r from-muted/5 to-muted/10 border border-border/50 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 hover:border-primary/20">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-2 animate-pulse"></div>
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold text-muted-foreground mb-2">Complaint Description:</h4>
                            <p className="text-foreground text-base leading-relaxed font-medium">
                              {complaint.description}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Media Files */}
                      {complaint.complaint_files && complaint.complaint_files.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Attachments:</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {complaint.complaint_files.map((file) => (
                              <div key={file.id} className="relative">
                                {file.file_type.startsWith('image/') ? (
                                  <img
                                    src={file.file_url}
                                    alt={file.file_name}
                                    className="w-full h-24 object-cover rounded-md border"
                                    onError={(e) => {
                                      console.error('CommunityFeed: Image load error for file:', file.file_name);
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  <div className="w-full h-24 bg-muted rounded-md border flex items-center justify-center">
                                    <span className="text-xs text-muted-foreground">
                                      {file.file_name}
                                    </span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Like/Dislike Buttons */}
                                             <div className="flex items-center space-x-4 pt-4 border-t border-border/30">
                         <Button
                           variant="ghost"
                           size="sm"
                           onClick={() => handleLike(complaint.id)}
                           className={`flex items-center space-x-2 transition-all duration-200 ${
                             likedComplaints.has(complaint.id) 
                               ? 'text-green-600 bg-green-50 hover:bg-green-100' 
                               : 'hover:bg-green-50 hover:text-green-600'
                           }`}
                         >
                           <ThumbsUp className="h-4 w-4" />
                           <span>Like</span>
                         </Button>
                         <Button
                           variant="ghost"
                           size="sm"
                           onClick={() => handleDislike(complaint.id)}
                           className={`flex items-center space-x-2 transition-all duration-200 ${
                             dislikedComplaints.has(complaint.id) 
                               ? 'text-red-600 bg-red-50 hover:bg-red-100' 
                               : 'hover:bg-red-50 hover:text-red-600'
                           }`}
                         >
                           <ThumbsDown className="h-4 w-4" />
                           <span>Dislike</span>
                         </Button>
                       </div>
                    </div>
                  </CardContent>
                </Card>
            ))
          )}
        </div>

        {/* Load More Button */}
        {complaints.length > 0 && (
          <div className="text-center mt-8">
            <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh Feed'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityFeed;
