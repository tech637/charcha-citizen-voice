import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { getAllCommunities, getCommunityMembers, joinCommunity, getUserCommunities } from '@/lib/communities';
import { getPublicComplaints, getAllCommunityComplaints, getCommunityComplaints } from '@/lib/complaints';
import { getIndiaCommunityId } from '@/lib/india-community';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  MapPin, 
  Users, 
  Calendar, 
  Plus, 
  CheckCircle, 
  Loader2, 
  ThumbsUp, 
  ThumbsDown, 
  Eye, 
  RefreshCw,
  AlertCircle,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  PenTool,
  LogOut,
  Shield,
  Home,
  User
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { hasLocationData } from '@/lib/locationUtils';
import { useLocationFormat } from '@/hooks/useLocationFormat';
import Navigation from './Navigation';
import { useLocation } from 'react-router-dom';
import { LoginDialog } from './LoginDialog';
import { isUserAdmin } from '@/lib/communities';
import { useThoughts } from '@/contexts/ThoughtContext';

// Mobile Bottom Navigation Component
const MobileBottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden">
      <div className="bg-white border-t border-gray-200 shadow-lg">
        <div className="flex items-center justify-around py-2">
          <button
            onClick={() => navigate('/')}
            className={`flex flex-col items-center justify-center py-2 px-4 rounded-lg transition-colors ${
              isActive('/') ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Home className={`h-5 w-5 ${isActive('/') ? 'text-blue-600 fill-blue-600' : 'text-gray-500 fill-gray-500'}`} />
            <span className="text-xs mt-1 font-medium">Home</span>
          </button>
          
          <button
            onClick={() => navigate('/communities')}
            className={`flex flex-col items-center justify-center py-2 px-4 rounded-lg transition-colors ${
              isActive('/communities') ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Building2 className={`h-5 w-5 ${isActive('/communities') ? 'text-blue-600 fill-blue-600' : 'text-gray-500 fill-gray-500'}`} />
            <span className="text-xs mt-1 font-medium">Communities</span>
          </button>
          
          <button
            onClick={() => navigate('/dashboard')}
            className={`flex flex-col items-center justify-center py-2 px-4 rounded-lg transition-colors ${
              isActive('/dashboard') ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <User className={`h-5 w-5 ${isActive('/dashboard') ? 'text-blue-600 fill-blue-600' : 'text-gray-500 fill-gray-500'}`} />
            <span className="text-xs mt-1 font-medium">Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Custom Navigation component for Communities page
const CommunitiesNavigation = () => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user) {
        try {
          const adminStatus = await isUserAdmin(user.id);
          setIsAdmin(adminStatus);
        } catch (error) {
          console.error('Error checking admin status:', error);
        }
      } else {
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <nav className="hidden md:block sticky top-0 z-50 bg-[#001F3F] shadow-lg backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 md:h-18">
          {/* Logo */}
          <div className="flex-shrink-0">
            <button 
              onClick={() => navigate("/")}
              className="text-xl sm:text-2xl md:text-3xl font-black text-[#F5F5DC] hover:text-white transition-colors"
              style={{fontFamily: 'Montserrat-Black, Helvetica'}}
            >
              Charcha
            </button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <button 
                onClick={() => navigate("/")}
                className="text-white hover:text-gray-200 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Home
              </button>
              <a href="#how-it-works" className="text-gray-200 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                How It Works
              </a>
              <button 
                onClick={() => navigate("/join-communities")}
                className="text-gray-200 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Join Communities
              </button>
            </div>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:block">
            {user ? (
              <div className="flex items-center gap-2 lg:gap-4">
                {/* Dashboard icon button */}
                <Button 
                  variant="outline" 
                  onClick={() => navigate("/dashboard")}
                  size="icon"
                  className="h-8 w-8"
                  title="User Dashboard"
                >
                  <User className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleSignOut}
                  size="icon"
                  className="h-8 w-8"
                  title="Sign Out"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
                {isAdmin && (
                  <Button 
                    variant="outline"
                    onClick={() => navigate("/admin")}
                    className="flex items-center gap-1 lg:gap-2 text-xs lg:text-sm"
                    size="sm"
                  >
                    <Shield className="h-3 w-3 lg:h-4 lg:w-4" />
                    <span className="hidden lg:inline">Admin</span>
                  </Button>
                )}
              </div>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => setIsLoginOpen(true)}
                  className="mr-2 lg:mr-4 text-xs lg:text-sm"
                  size="sm"
                >
                  Login
                </Button>
                <Button 
                  onClick={() => document.getElementById('complaint-form')?.scrollIntoView({ behavior: 'smooth' })}
                  size="sm"
                  className="text-xs lg:text-sm"
                >
                  <span className="hidden lg:inline">File Complaint</span>
                  <span className="lg:hidden">File</span>
                </Button>
              </>
            )}
          </div>
          </div>
      </div>

      <LoginDialog open={isLoginOpen} onOpenChange={setIsLoginOpen} />
    </nav>
  );
};

interface Community {
  id: string;
  name: string;
  description: string;
  location: string;
  latitude?: number;
  longitude?: number;
  admin_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

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
  communities?: {
    name: string;
    location: string;
  };
  complaint_files: Array<{
    id: string;
    file_url: string;
    file_name: string;
    file_type: string;
  }>;
}

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

const CommunityFeed = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { thoughts, addThought, clearNewThoughts } = useThoughts();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});
  const [userCommunities, setUserCommunities] = useState<Set<string>>(new Set());
  const [memberships, setMemberships] = useState<Array<{ community_id: string; status: 'pending' | 'approved' | 'rejected'; community_name: string }>>([]);
  const [joiningCommunities, setJoiningCommunities] = useState<Set<string>>(new Set());
  const [requestedCommunities, setRequestedCommunities] = useState<Set<string>>(new Set());
  
  // Complaint-related state
  const [complaints, setComplaints] = useState<CommunityComplaint[]>([]);
  const [discoverComplaints, setDiscoverComplaints] = useState<CommunityComplaint[]>([]);
  const [complaintsLoading, setComplaintsLoading] = useState(false);
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [likedComplaints, setLikedComplaints] = useState<Set<string>>(new Set());
  const [dislikedComplaints, setDislikedComplaints] = useState<Set<string>>(new Set());
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const [showComplaints, setShowComplaints] = useState(false);
  const [statsExpanded, setStatsExpanded] = useState(false);
  const [mobileTab, setMobileTab] = useState<'communities' | 'feed'>('feed');
  const [thoughtText, setThoughtText] = useState('');
  const [isSubmittingThought, setIsSubmittingThought] = useState(false);
  const [showWritingModal, setShowWritingModal] = useState(false);
  const [isWritingMode, setIsWritingMode] = useState(false);

  useEffect(() => {
    fetchCommunities();
    if (user) {
      fetchUserCommunities();
    }
  }, [user]);

  // Fetch all complaints from joined communities
  useEffect(() => {
    if (communities.length > 0 && userCommunities.size > 0) {
      fetchAllJoinedCommunityComplaints();
    }
  }, [communities, userCommunities]);

  // Fetch complaints from unjoined communities for discover section
  useEffect(() => {
    if (communities.length > 0) {
      fetchDiscoverComplaints();
    }
  }, [communities, userCommunities]);

  const fetchCommunities = async () => {
    try {
      setLoading(true);
      const { data, error } = await getAllCommunities();
      if (error) {
        console.error('Error fetching communities:', error);
      } else {
        setCommunities(data || []);
        
        // Fetch member counts for each community
        const counts: Record<string, number> = {};
        for (const community of data || []) {
          try {
            const { data: members } = await getCommunityMembers(community.id);
            counts[community.id] = members?.length || 0;
          } catch (error) {
            console.error(`Error fetching members for ${community.name}:`, error);
            counts[community.id] = 0;
          }
        }
        setMemberCounts(counts);
      }
    } catch (error) {
      console.error('Error fetching communities:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserCommunities = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await getUserCommunities(user.id);
      if (error) {
        console.error('Error fetching user communities:', error);
      } else {
        const communityIds = new Set<string>((data || []).map((uc: any) => uc.community_id));
        setUserCommunities(communityIds);
        const mapped = (data || []).map((uc: any) => ({
          community_id: uc.community_id,
          status: (uc.status || 'pending') as 'pending' | 'approved' | 'rejected',
          community_name: uc.communities?.name || ''
        }));
        setMemberships(mapped);
      }
    } catch (error) {
      console.error('Error fetching user communities:', error);
    }
  };

  const fetchComplaints = async (communityId: string) => {
    try {
      setComplaintsLoading(true);
      let complaintsData;
      
      if (communityId === 'india' || communities.find(c => c.id === communityId)?.name.toLowerCase() === 'india') {
        // For India community, get all community complaints
        const { data, error } = await getAllCommunityComplaints();
        if (error) throw error;
        complaintsData = data;
      } else {
        // For specific community
        const { data, error } = await getCommunityComplaints(communityId);
        if (error) throw error;
        complaintsData = data;
      }
      
      setComplaints(complaintsData || []);
    } catch (error) {
      console.error('Error fetching complaints:', error);
      toast({
        title: "Error Loading Complaints",
        description: "Failed to load complaints. Please try again.",
        variant: "destructive",
      });
    } finally {
      setComplaintsLoading(false);
    }
  };

  const fetchAllJoinedCommunityComplaints = async () => {
    try {
      setComplaintsLoading(true);
      const allComplaints: CommunityComplaint[] = [];
      
      // Get complaints from all joined communities
      for (const communityId of userCommunities) {
        const community = communities.find(c => c.id === communityId);
        if (community) {
          let complaintsData;
          if (community.name.toLowerCase() === 'india') {
            const { data, error } = await getAllCommunityComplaints();
            if (error) throw error;
            complaintsData = data;
          } else {
            const { data, error } = await getCommunityComplaints(communityId);
            if (error) throw error;
            complaintsData = data;
          }
          if (complaintsData) {
            allComplaints.push(...complaintsData);
          }
        }
      }
      
      // Sort by creation date (newest first)
      allComplaints.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setComplaints(allComplaints);
    } catch (error) {
      console.error('Error fetching joined community complaints:', error);
      toast({
        title: "Error Loading Feed",
        description: "Failed to load your community feed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setComplaintsLoading(false);
    }
  };

  const fetchDiscoverComplaints = async () => {
    try {
      setDiscoverLoading(true);
      const allDiscoverComplaints: CommunityComplaint[] = [];
      
      // Get complaints from all unjoined communities
      const unjoinedCommunities = communities.filter(c => !userCommunities.has(c.id));
      
      for (const community of unjoinedCommunities) {
        let complaintsData;
        if (community.name.toLowerCase() === 'india') {
          const { data, error } = await getAllCommunityComplaints();
          if (error) throw error;
          complaintsData = data;
        } else {
          const { data, error } = await getCommunityComplaints(community.id);
          if (error) throw error;
          complaintsData = data;
        }
        if (complaintsData) {
          allDiscoverComplaints.push(...complaintsData);
        }
      }
      
      // Sort by creation date (newest first)
      allDiscoverComplaints.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setDiscoverComplaints(allDiscoverComplaints);
    } catch (error) {
      console.error('Error fetching discover complaints:', error);
      toast({
        title: "Error Loading Discover Feed",
        description: "Failed to load discover feed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDiscoverLoading(false);
    }
  };

  const handleRefreshComplaints = async () => {
    try {
      setRefreshing(true);
      await fetchAllJoinedCommunityComplaints();
      toast({
        title: "Feed Updated",
        description: "Your community feed has been refreshed",
      });
    } catch (error) {
      console.error('Error refreshing complaints:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSubmitThought = async () => {
    if (!thoughtText.trim() || !user) return;
    
    try {
      setIsSubmittingThought(true);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Add thought to context
      const authorName = user.user_metadata?.full_name || user.email || 'Anonymous';
      addThought(thoughtText.trim(), authorName);
      
      // Show success message only after thought is added
      toast({
        title: "Success!",
        description: "Your thought has been shared successfully.",
        variant: "default",
      });
      
      // Clear the form and close modals
      setThoughtText('');
      setShowWritingModal(false);
      setIsWritingMode(false);
      
    } catch (error) {
      console.error('Error submitting thought:', error);
      toast({
        title: "Error",
        description: "Failed to share your thought. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingThought(false);
    }
  };

  const handleFloatingButtonClick = () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to share your thoughts",
        variant: "destructive",
      });
      return;
    }
    
    if (isWritingMode) {
      // If in writing mode, submit the thought
      handleSubmitThought();
    } else {
      // If not in writing mode, open writing interface
      setShowWritingModal(true);
      setIsWritingMode(true);
    }
  };

  const handleCloseWritingModal = () => {
    setShowWritingModal(false);
    setIsWritingMode(false);
    setThoughtText('');
  };

  const handleStartWriting = () => {
    setShowWritingModal(false);
    setIsWritingMode(true);
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

  // Combine complaints and thoughts for the feed
  const getCombinedFeed = (complaintsList: CommunityComplaint[]) => {
    const combinedItems = [
      ...complaintsList.map(complaint => ({
        id: complaint.id,
        type: 'complaint' as const,
        data: complaint,
        timestamp: new Date(complaint.created_at)
      })),
      ...thoughts.map(thought => ({
        id: thought.id,
        type: 'thought' as const,
        data: thought,
        timestamp: thought.timestamp
      }))
    ];
    
    // Sort by timestamp (newest first)
    return combinedItems.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  };

  const handleJoinCommunity = async (communityId: string, communityName: string) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to join communities",
        variant: "destructive",
      });
      return;
    }

    try {
      setJoiningCommunities(prev => new Set(prev).add(communityId));
      
      const { data, error } = await joinCommunity({ communityId, userId: user.id, role: 'member' });
      
      if (error) {
        throw error;
      }

      // Mark as requested (pending). Do NOT add to approved membership set.
      setRequestedCommunities(prev => new Set(prev).add(communityId));

      toast({
        title: "Request Sent",
        description: `Your request to join ${communityName} was sent for approval.`,
      });
    } catch (error: any) {
      console.error('Error joining community:', error);
      toast({
        title: "Error Joining Community",
        description: error.message || "Failed to join community. Please try again.",
        variant: "destructive",
      });
    } finally {
      setJoiningCommunities(prev => {
        const newSet = new Set(prev);
        newSet.delete(communityId);
        return newSet;
      });
    }
  };

  const isUserMember = (communityId: string) => {
    return userCommunities.has(communityId);
  };

  const isJoining = (communityId: string) => {
    return joiningCommunities.has(communityId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <CommunitiesNavigation />
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-lg mb-6">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-200 border-t-blue-600"></div>
          </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Communities</h3>
            <p className="text-gray-600">Please wait while we fetch the latest communities...</p>
        </div>
        </div>
        <MobileBottomNavigation />
      </div>
    );
  }

    return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pb-20 md:pb-8">
        <CommunitiesNavigation />
      
      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-6">
            <Building2 className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Communities
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Join communities to connect with others and share local issues. India community is public and available to everyone.
          </p>
        </div>

        {/* Communities Grid */}
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {communities.map((community) => (
              <Card key={community.id} className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border-0 overflow-hidden">
                {/* Card Header */}
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                        <Building2 className="h-7 w-7 text-white" />
                </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-xl font-bold text-gray-900 mb-1 truncate">
                          {community.name}
                        </CardTitle>
                        <div className="flex items-center gap-1 text-gray-500">
                          <MapPin className="h-4 w-4 flex-shrink-0" />
                          <span className="text-sm truncate">{community.location || 'Location not specified'}</span>
                  </div>
                </div>
                    </div>
                    <Badge 
                      variant={community.is_active ? 'default' : 'secondary'}
                      className={`text-xs px-3 py-1 rounded-full font-medium ${
                        community.is_active 
                          ? 'bg-green-100 text-green-700 border border-green-200' 
                          : 'bg-gray-100 text-gray-600 border border-gray-200'
                      }`}
                    >
                      {community.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                      </div>
                </CardHeader>

                {/* Card Content */}
                <CardContent className="space-y-6">
                                      {/* Description */}
                  <p className="text-gray-600 leading-relaxed line-clamp-3">
                    {community.description || 'Join this community to connect with others and share local issues.'}
                  </p>

                  {/* Stats Row */}
                  <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Users className="h-4 w-4 text-blue-600" />
                                                  </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{memberCounts[community.id] || 0}</p>
                        <p className="text-xs text-gray-500">members</p>
                                              </div>
                                          </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <Calendar className="h-4 w-4 text-green-600" />
                                        </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {new Date(community.created_at).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </p>
                        <p className="text-xs text-gray-500">created</p>
                      </div>
                                </div>
                              </div>

                  {/* Action Button */}
                  <div className="pt-2">
                    {(community.name.toLowerCase() === 'india' || userCommunities.has(community.id)) ? (
                                    <Button
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                        onClick={() => navigate(`/communities/${encodeURIComponent(community.name)}`)}
                      >
                        <Eye className="h-5 w-5 mr-2" />
                        View Community
                                    </Button>
                    ) : (
                                    <Button
                        variant="outline"
                        className="w-full border-2 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 font-semibold py-3 rounded-xl transition-all duration-300"
                        onClick={() => handleJoinCommunity(community.id, community.name)}
                        disabled={!community.is_active || isJoining(community.id) || requestedCommunities.has(community.id)}
                      >
                        {isJoining(community.id) ? (
                          <>
                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                            Sending Request...
                          </>
                        ) : requestedCommunities.has(community.id) ? (
                          <>
                            <CheckCircle className="h-5 w-5 mr-2" />
                            Request Sent
                                        </>
                                      ) : (
                                        <>
                            <Users className="h-5 w-5 mr-2" />
                            Request to Join
                                        </>
                                      )}
                                    </Button>
                                  )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
            </div>
          </div>
        </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNavigation />
      </div>
    );
};

export default CommunityFeed;

