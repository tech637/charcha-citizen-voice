import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { getAllCommunities, getCommunityMembers, joinCommunityLegacy, getUserCommunities } from '@/lib/communities';
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
  X,
  Menu,
  LogOut,
  Shield
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { hasLocationData } from '@/lib/locationUtils';
import { useLocationFormat } from '@/hooks/useLocationFormat';
import Navigation from './Navigation';
import { useLocation } from 'react-router-dom';
import { LoginDialog } from './LoginDialog';
import { isUserAdmin } from '@/lib/communities';
import { useThoughts } from '@/contexts/ThoughtContext';

// Custom Navigation component for Communities page
const CommunitiesNavigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

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
    <nav className="sticky top-0 z-50 bg-[#001F3F] shadow-lg backdrop-blur-sm">
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
                <span className="text-xs lg:text-sm text-gray-200 truncate max-w-32 lg:max-w-none">
                  {user.user_metadata?.full_name || user.email}
                </span>
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

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMenu}
              aria-label="Toggle menu"
              className="h-10 w-10 text-[#F5F5DC] hover:bg-white/20 hover:text-white transition-all duration-200 flex items-center justify-center"
            >
              {isMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-4 pt-4 pb-6 space-y-2 bg-[#001F3F]/95 border-t border-[#F5F5DC]/20 shadow-xl">
              <button 
                onClick={() => {
                  navigate("/");
                  setIsMenuOpen(false);
                }}
                className="text-[#F5F5DC] hover:text-white hover:bg-white/20 px-4 py-3 rounded-lg text-base font-semibold transition-all duration-200 w-full text-center flex items-center justify-center"
              >
                Home
              </button>
              <a 
                href="#how-it-works" 
                onClick={() => setIsMenuOpen(false)}
                className="text-[#F5F5DC]/90 hover:text-white hover:bg-white/20 px-4 py-3 rounded-lg text-base font-semibold transition-all duration-200 w-full text-center flex items-center justify-center"
              >
                How It Works
              </a>
              <button 
                onClick={() => {
                  navigate("/join-communities");
                  setIsMenuOpen(false);
                }}
                className="text-[#F5F5DC]/90 hover:text-white hover:bg-white/20 px-4 py-3 rounded-lg text-base font-semibold transition-all duration-200 w-full text-center flex items-center justify-center"
              >
                Join Communities
              </button>
              {user && (
                <button 
                  onClick={() => {
                    navigate("/dashboard");
                    setIsMenuOpen(false);
                  }}
                  className="text-[#F5F5DC]/90 hover:text-white hover:bg-white/20 px-4 py-3 rounded-lg text-base font-semibold transition-all duration-200 w-full text-center flex items-center justify-center"
                >
                  Track Complaint
                </button>
              )}
              <div className="pt-4 pb-2 border-t border-[#F5F5DC]/20">
                <div className="flex flex-col space-y-3">
                  {user ? (
                    <>
                      <div className="text-sm text-[#F5F5DC]/80 px-4 py-2 text-center bg-white/10 rounded-lg">
                        {user.user_metadata?.full_name || user.email}
                      </div>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          handleSignOut();
                          setIsMenuOpen(false);
                        }}
                        className="w-full text-sm h-10 bg-white/10 border-[#F5F5DC]/30 text-[#F5F5DC] hover:bg-white/20 hover:border-[#F5F5DC] justify-center"
                        size="sm"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </Button>
                      {isAdmin && (
                        <Button 
                          variant="outline"
                          onClick={() => {
                            navigate("/admin");
                            setIsMenuOpen(false);
                          }}
                          className="w-full flex items-center justify-center gap-2 text-sm h-10 bg-white/10 border-[#F5F5DC]/30 text-[#F5F5DC] hover:bg-white/20 hover:border-[#F5F5DC]"
                          size="sm"
                        >
                          <Shield className="h-4 w-4" />
                          Admin Panel
                        </Button>
                      )}
                    </>
                  ) : (
                    <>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setIsLoginOpen(true);
                          setIsMenuOpen(false);
                        }}
                        className="w-full text-sm h-10 bg-white/10 border-[#F5F5DC]/30 text-[#F5F5DC] hover:bg-white/20 hover:border-[#F5F5DC] justify-center"
                        size="sm"
                      >
                        Login / Sign Up
                      </Button>
                      <Button 
                        onClick={() => {
                          document.getElementById('complaint-form')?.scrollIntoView({ behavior: 'smooth' });
                          setIsMenuOpen(false);
                        }}
                        className="w-full text-sm h-10 bg-[#F5F5DC] text-[#001F3F] hover:bg-white font-semibold justify-center"
                        size="sm"
                      >
                        File Complaint
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
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
      
      const { data, error } = await joinCommunityLegacy(communityId, user.id);
      
      if (error) {
        throw error;
      }

      // Update user communities state
      setUserCommunities(prev => new Set(prev).add(communityId));
      
      // Update member count
      setMemberCounts(prev => ({
        ...prev,
        [communityId]: (prev[communityId] || 0) + 1
      }));

      // Set as selected community and show complaints
      const community = communities.find(c => c.id === communityId);
      if (community) {
        setSelectedCommunity(community);
        setShowComplaints(true);
        await fetchComplaints(communityId);
        // On mobile, switch to feed tab when joining community
        setMobileTab('feed');
      }

      toast({
        title: "Successfully Joined!",
        description: `You've joined the ${communityName} community`,
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
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading communities...</p>
          </div>
        </div>
      </div>
    );
  }

    return (
      <div className="min-h-screen bg-[#E2EEF9]">
        <CommunitiesNavigation />
        <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {/* Header - Mobile Optimized */}
        <div className="text-center mb-4 sm:mb-8">
          <h1 className="text-xl sm:text-3xl font-bold text-[#001F3F] mb-2 sm:mb-4" style={{fontFamily: 'Montserrat-Bold, Helvetica'}}>
            Communities
          </h1>
          <p className="text-[#001F3F]/80 max-w-2xl mx-auto text-sm sm:text-base px-2 mb-4">
            Join communities to connect with others and share local issues. India community is public and available to everyone.
          </p>
        </div>

        {/* Single Column Layout - Present Communities */}
        <div className="w-full max-w-6xl mx-auto">
          {/* Your Communities / Applications (removed as requested) */}

          {/* Communities Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {communities.map((community) => (
              <Card key={community.id} className="hover:shadow-xl transition-all duration-300 border border-[#001F3F]/20 shadow-lg hover:border-[#001F3F]/30">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#001F3F] to-[#001F3F]/80 rounded-full flex items-center justify-center shadow-md">
                    <Building2 className="h-6 w-6 text-white" />
                  </div>
                      <div>
                        <CardTitle className="text-lg text-[#001F3F]" style={{fontFamily: 'Montserrat-SemiBold, Helvetica'}}>
                          {community.name}
                        </CardTitle>
                        <p className="text-sm text-[#001F3F]/70 mt-1">
                          {community.location || '—'}
                  </p>
                </div>
                </div>
                    <Badge 
                      variant={community.is_active ? 'default' : 'secondary'}
                      className={`text-xs px-3 py-1 rounded-full ${
                        community.is_active 
                          ? 'bg-[#001F3F]/10 text-[#001F3F] border border-[#001F3F]/20' 
                          : 'bg-gray-100 text-gray-600 border border-gray-200'
                      }`}
                    >
                      {community.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                      </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-[#001F3F]/80 leading-relaxed">
                    {community.description || 'Join this community to connect with others and share local issues.'}
                  </p>
                  <div className="flex items-center justify-between text-sm text-[#001F3F]/60 bg-gray-50/50 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-[#001F3F]/70" />
                      <span className="font-medium">{memberCounts[community.id] || 0} members</span>
                                      </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-[#001F3F]/70" />
                      <span className="font-medium">{new Date(community.created_at).toLocaleDateString()}</span>
                                    </div>
                        </div>
                  <div className="pt-2">
                    <div className="flex gap-2">
                                    <Button
                        className="flex-1 bg-gradient-to-r from-[#001F3F] to-[#001F3F]/90 hover:from-[#001F3F]/90 hover:to-[#001F3F] text-white text-sm h-10 shadow-md hover:shadow-lg transition-all duration-200" 
                        onClick={() => navigate(`/communities/${encodeURIComponent(community.name)}`)}
                        style={{fontFamily: 'Montserrat-SemiBold, Helvetica'}}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Community
                                    </Button>
                      {!userCommunities.has(community.id) && (
                                    <Button
                          variant="outline"
                          className="flex-1 text-[#001F3F] border-[#001F3F]/30"
                          onClick={() => handleJoinCommunity(community.id, community.name)}
                          disabled={!community.is_active || isJoining(community.id)}
                        >
                          {isJoining(community.id) ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                          Joining...
                                        </>
                                      ) : (
                                        <>
                              <Users className="h-4 w-4 mr-2" />
                                          Join
                                        </>
                                      )}
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
              </div>
        </div>
      </div>
    );
};

export default CommunityFeed;
