import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ThumbsUp, ThumbsDown, MapPin, Calendar, Eye, RefreshCw, AlertCircle, ArrowLeft, Building2, Users, Flag, Home, User, ChevronDown, ChevronUp, Settings, CheckCircle, Landmark } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getPublicComplaints, getCommunityComplaints, getAllCommunityComplaints, updateComplaintStatus, getComplaintVoteSummary, upsertComplaintVote, removeComplaintVote, listComplaintComments, addComplaintComment } from '@/lib/complaints';
import { getAllCommunities, getCommunityMembers, isUserMemberOfCommunity, isUserAdmin, getPendingMembershipRequests, updateMembershipStatus, updateCommunity, withdrawCommunityMembership, leaveCommunityWithAdminCheck, getUserCommunities } from '@/lib/communities';
import ComplaintForm from './ComplaintForm';
import { LoginDialog } from './LoginDialog';
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

// Mobile Bottom Navigation Component
const MobileBottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [showLoginDialog, setShowLoginDialog] = useState(false);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleHomeClick = async () => {
    if (!user) {
      navigate('/');
      return;
    }

    // For logged-in users, redirect to their community if they have joined one
    try {
      const { data: communities } = await getUserCommunities(user.id);
      if (communities && communities.length > 0) {
        const communityName = communities[0].communities?.name;
        if (communityName) {
          navigate(`/communities/${encodeURIComponent(communityName)}`);
          return;
        }
      }
    } catch (error) {
      console.error('Error fetching user communities:', error);
    }

    // If no community joined or error, stay on home page
    navigate('/');
  };

  const handleCommunitiesClick = async () => {
    if (!user) {
      setShowLoginDialog(true);
      return;
    }

    // For logged-in users, redirect to their specific community
    try {
      const { data: communities } = await getUserCommunities(user.id);
      if (communities && communities.length > 0) {
        const communityName = communities[0].communities?.name;
        if (communityName) {
          navigate(`/communities/${encodeURIComponent(communityName)}`);
        } else {
          alert("Please join a community first. You can join a community from the home page.");
        }
      } else {
        alert("Please join a community first. You can join a community from the home page.");
      }
    } catch (error) {
      console.error('Error fetching user communities:', error);
      alert("Please join a community first. You can join a community from the home page.");
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden">
      <div className="bg-white border-t border-gray-200 shadow-lg">
        <div className="flex items-center justify-around py-2">
          {user ? (
            // Logged in user: Show Dashboard and Communities
            <>
              <button
                onClick={() => navigate('/dashboard')}
                className={`flex flex-col items-center justify-center py-2 px-4 rounded-lg transition-colors ${
                  isActive('/dashboard') ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <User className={`h-5 w-5 ${isActive('/dashboard') ? 'text-blue-600 fill-blue-600' : 'text-gray-500 fill-gray-500'}`} />
                <span className="text-xs mt-1 font-medium">Dashboard</span>
              </button>
              
              <button
                onClick={handleCommunitiesClick}
                className={`flex flex-col items-center justify-center py-2 px-4 rounded-lg transition-colors ${
                  isActive('/communities') ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Building2 className={`h-5 w-5 ${isActive('/communities') ? 'text-blue-600 fill-blue-600' : 'text-gray-500 fill-gray-500'}`} />
                <span className="text-xs mt-1 font-medium">Communities</span>
              </button>
            </>
          ) : (
            // Not logged in: Show Home, Communities, and Login
            <>
              <button
                onClick={handleHomeClick}
                className={`flex flex-col items-center justify-center py-2 px-4 rounded-lg transition-colors ${
                  isActive('/') ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Home className={`h-5 w-5 ${isActive('/') ? 'text-blue-600 fill-blue-600' : 'text-gray-500 fill-gray-500'}`} />
                <span className="text-xs mt-1 font-medium">Home</span>
              </button>
              
              <button
                onClick={handleCommunitiesClick}
                className={`flex flex-col items-center justify-center py-2 px-4 rounded-lg transition-colors ${
                  isActive('/communities') ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Building2 className={`h-5 w-5 ${isActive('/communities') ? 'text-blue-600 fill-blue-600' : 'text-gray-500 fill-gray-500'}`} />
                <span className="text-xs mt-1 font-medium">Communities</span>
              </button>
              
              <button
                onClick={() => setShowLoginDialog(true)}
                className={`flex flex-col items-center justify-center py-2 px-4 rounded-lg transition-colors ${
                  showLoginDialog ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <User className={`h-5 w-5 ${showLoginDialog ? 'text-blue-600 fill-blue-600' : 'text-gray-500 fill-gray-500'}`} />
                <span className="text-xs mt-1 font-medium">Login</span>
              </button>
            </>
          )}
        </div>
      </div>

      <LoginDialog 
        open={showLoginDialog}
        onOpenChange={setShowLoginDialog}
      />
    </div>
  );
};

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
  pincode?: string;
  locality_name?: string;
  locality_data?: {
    ward?: {
      ward_name: string;
      ward_number: number;
      councillor_name: string;
    };
    mla?: {
      mla_name: string;
      constituency: string;
      party_name: string;
    };
    mp?: {
      mp_name: string;
      constituency: string;
      party: string;
    };
  };
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
  const [profileForm, setProfileForm] = useState<{ description: string; location: string }>({ description: '', location: '' });
  const [showLocationUpdateDialog, setShowLocationUpdateDialog] = useState(false);
  const [locationUpdateLoading, setLocationUpdateLoading] = useState(false);
  const [manualFormData, setManualFormData] = useState({
    ward: {
      ward_name: '',
      ward_number: '',
      councillor_name: ''
    },
    mla: {
      mla_name: '',
      constituency: '',
      party_name: ''
    },
    mp: {
      mp_name: '',
      constituency: '',
      party: ''
    }
  });
  const { user } = useAuth();
  const { toast } = useToast();
  const [membershipStatus, setMembershipStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none');
  const isMobile = useIsMobile();
  const [complaintOpen, setComplaintOpen] = useState(false);
  const [voteSummary, setVoteSummary] = useState<Record<string, { up: number; down: number }>>({});
  const [userVote, setUserVote] = useState<Record<string, 'up' | 'down' | null>>({});
  const [openComments, setOpenComments] = useState<Set<string>>(new Set());
  const [commentsById, setCommentsById] = useState<Record<string, Array<{ id: string; content: string; created_at: string; users?: { full_name?: string } }>>>({});
  const [commentDraft, setCommentDraft] = useState<Record<string, string>>({});
  const [showDetails, setShowDetails] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (communityName) {
      fetchCommunityAndComplaints();
    }
  }, [communityName, user?.id]);

  // Realtime: refresh complaints when any record for this community changes
  useEffect(() => {
    if (!community) return;
    const channel = supabase
      .channel(`complaints_community_${community.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'complaints',
        filter: `community_id=eq.${community.id}`,
      }, () => {
        // Refresh complaints and counts
        fetchCommunityAndComplaints();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [community?.id]);

  // Load current user's vote state after complaints are loaded
  useEffect(() => {
    const loadMyVotes = async () => {
      if (!user || complaints.length === 0) return;
      const votes: Record<string, 'up' | 'down' | null> = {};
      const summaries: Record<string, { up: number; down: number }> = { ...voteSummary };
      const { getUserVoteForComplaint } = await import('@/lib/complaints');
      await Promise.all(
        complaints.map(async (c: any) => {
          const { data: myVote } = await getUserVoteForComplaint(c.id, user.id);
          votes[c.id] = myVote || null;
          // also ensure summary is present
          if (!summaries[c.id]) {
            const { data } = await getComplaintVoteSummary(c.id);
            summaries[c.id] = data || { up: 0, down: 0 };
          }
        })
      );
      setUserVote(votes);
      setVoteSummary(summaries);
    };
    loadMyVotes();
  }, [user?.id, complaints]);

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

      console.log('🔍 Found community with locality_data:', foundCommunity.locality_data);
      setCommunity(foundCommunity);
      // Seed president details from community profile fields so non-admin viewers still see info
      if (foundCommunity.leader_name || foundCommunity.leader_email || foundCommunity.leader_mobile) {
        setPresident({
          full_name: (foundCommunity as any).leader_name || null,
          email: (foundCommunity as any).leader_email || null,
          phone: (foundCommunity as any).leader_mobile || null,
        });
      }

      // Get member count for this community
      try {
        // Count only approved members
        const { data: approved, error: approvedErr } = await supabase
          .from('user_communities')
          .select('id')
          .eq('community_id', foundCommunity.id)
          .eq('status', 'approved');
        if (approvedErr) setMemberCount(0); else setMemberCount((approved || []).length);
      } catch (error) {
        setMemberCount(0);
      }

      // Load president user details (may be restricted by RLS for non-admins)
      try {
        const { data: presidentUser } = await supabase
          .from('users')
          .select('full_name, email, phone')
          .eq('id', foundCommunity.admin_id)
          .maybeSingle();
        if (presidentUser) {
          setPresident(presidentUser as any);
        }
      } catch {}

      // Load finance summary
      try {
        const { data: summary } = await getCommunityFinanceSummary(foundCommunity.id);
        if (summary) setFinance(summary);
      } catch {}

      // Check if current user is a member of this community
      if (user) {
        setMembershipLoading(true);
        try {
          const isMember = await isUserMemberOfCommunity(user.id, foundCommunity.id);
          setIsUserMember(isMember);
          // Fetch raw membership status to handle "pending" state
          const { data: membershipRow } = await supabase
            .from('user_communities')
            .select('status')
            .eq('user_id', user.id)
            .eq('community_id', foundCommunity.id)
            .maybeSingle();
          if (membershipRow?.status === 'approved' || isMember) setMembershipStatus('approved');
          else if (membershipRow?.status === 'pending') setMembershipStatus('pending');
          else if (membershipRow?.status === 'rejected') setMembershipStatus('rejected');
          else setMembershipStatus('none');
        } catch (error) {
          console.error('Error checking membership:', error);
          setIsUserMember(false);
          setMembershipStatus('none');
        } finally {
          setMembershipLoading(false);
        }
        // Determine president/global admin access
        try {
          const global = await isUserAdmin(user.id);
          setIsPresidentOrAdmin(global || user.id === foundCommunity.admin_id);
          setProfileForm({ description: foundCommunity.description, location: foundCommunity.location });
        } catch {
          setIsPresidentOrAdmin(user.id === foundCommunity.admin_id);
        }
      } else {
        setIsUserMember(false);
        setIsPresidentOrAdmin(false);
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
      // Fetch vote summaries and current user's vote for each complaint
      try {
        const summaries: Record<string, { up: number; down: number }> = {};
        const votes: Record<string, 'up' | 'down' | null> = {};
        await Promise.all((communityComplaints || []).map(async (c: any) => {
          const { data } = await getComplaintVoteSummary(c.id);
          summaries[c.id] = data || { up: 0, down: 0 };
          if (user) {
            const { getUserVoteForComplaint } = await import('@/lib/complaints');
            const { data: myVote } = await getUserVoteForComplaint(c.id, user.id);
            votes[c.id] = myVote || null;
          }
        }));
        setVoteSummary(summaries);
        if (user) setUserVote(votes);
      } catch (e) {
        // ignore
      }
      // Preload comments count by fetching first page if open later; optional
      
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

  // Request to Join navigation
  const handleRequestToJoin = () => {
    if (!community) return;
    navigate(`/`);
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

  // President Panel actions
  const loadPendingRequests = async () => {
    if (!community || !user) return;
    try {
      setRequestsLoading(true);
      const { data, error } = await getPendingMembershipRequests(community.id, user.id);
      if (!error) setPendingRequests(data || []);
    } finally {
      setRequestsLoading(false);
    }
  };

  const handleUpdateRequest = async (membershipId: string, status: 'approved'|'rejected') => {
    if (!user) return;
    try {
      setUpdatingReqId(membershipId);
      const { error } = await updateMembershipStatus(membershipId, status, user.id);
      if (error) throw error as any;
      setPendingRequests(prev => prev.filter(r => r.id !== membershipId));
      toast({ title: 'Request updated', description: `Set to ${status}` });
      await fetchCommunityAndComplaints();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to update request', variant: 'destructive' });
    } finally {
      setUpdatingReqId(null);
    }
  };

  const handleUpdateComplaintStatus = async (complaintId: string, status: 'pending'|'in_progress'|'resolved'|'rejected') => {
    try {
      setUpdatingComplaintId(complaintId);
      const { error } = await updateComplaintStatus(complaintId, status);
      if (error) throw error as any;
      setComplaints(prev => prev.map(c => c.id === complaintId ? { ...c, status } : c));
      toast({ title: 'Updated', description: 'Complaint status updated' });
      // Ensure all views (counts/tabs) reflect the latest state
      await fetchCommunityAndComplaints();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to update status', variant: 'destructive' });
    } finally {
      setUpdatingComplaintId(null);
    }
  };

  const handleLeaveCommunity = async () => {
    if (!user || !community) return;
    if (community.name.toLowerCase() === 'india') {
      toast({ title: 'Cannot leave India', description: 'India is public.', variant: 'destructive' });
      return;
    }
    
    // Enhanced confirmation message for admins
    const isAdmin = user.id === community.admin_id;
    const confirmMessage = isAdmin 
      ? `Leave ${community.name}? Admin privileges will be transferred to another member or removed. You'll need approval again to rejoin.`
      : `Leave ${community.name}? You'll need approval again to rejoin.`;
    
    const ok = window.confirm(confirmMessage);
    if (!ok) return;
    
    try {
      setLeaving(true);
      const { data, error } = await leaveCommunityWithAdminCheck(community.id, user.id);
      if (error) throw error as any;
      
      // Enhanced success message
      toast({ 
        title: 'Left community', 
        description: data?.message || `You left ${community.name}.`,
      });
      
      setMembershipStatus('none');
      setIsUserMember(false);
      navigate('/');
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to leave community', variant: 'destructive' });
    } finally {
      setLeaving(false);
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!community || !user) return;
    const amount = Number(txForm.amount);
    if (!amount || amount <= 0) {
      toast({ title: 'Invalid amount', variant: 'destructive' });
      return;
    }
    try {
      setIsAddingTx(true);
      const { error } = await addCommunityTransaction({ communityId: community.id, type: txForm.type, amount, note: txForm.note || undefined }, user.id);
      if (error) throw error as any;
      setTxForm({ type: 'income', amount: '', note: '' });
      const { data: summary } = await getCommunityFinanceSummary(community.id);
      if (summary) setFinance(summary);
      const { data: tx } = await getCommunityTransactions(community.id, 5);
      setRecentTx(tx || []);
      toast({ title: 'Transaction added' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to add transaction', variant: 'destructive' });
    } finally {
      setIsAddingTx(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!community || !user) return;
    try {
      const { error } = await updateCommunity(community.id, { description: profileForm.description, location: profileForm.location }, user.id);
      if (error) throw error as any;
      toast({ title: 'Profile updated' });
      await fetchCommunityAndComplaints();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to update profile', variant: 'destructive' });
    }
  };

  const handleManualLocationUpdate = async () => {
    if (!community || !user) return;
    
    setLocationUpdateLoading(true);
    try {
      console.log('🔍 Form data being submitted:', manualFormData);
      
      // Validate that at least one section has meaningful data
      const hasWardData = manualFormData.ward.ward_name.trim() || manualFormData.ward.councillor_name.trim();
      const hasMLAData = manualFormData.mla.mla_name.trim() || manualFormData.mla.constituency.trim();
      const hasMPData = manualFormData.mp.mp_name.trim() || manualFormData.mp.constituency.trim();
      
      console.log('🔍 Validation check:', { hasWardData, hasMLAData, hasMPData });
      console.log('🔍 Raw form data:', manualFormData);
      
      if (!hasWardData && !hasMLAData && !hasMPData) {
        toast({ title: 'No Data Entered', description: 'Please enter at least one representative information (name or constituency)', variant: 'destructive' });
        setLocationUpdateLoading(false);
        return;
      }

      // Prepare locality data (only include sections with data)
      const localityData: any = {};
      
      if (hasWardData) {
        localityData.ward = {
          ward_name: manualFormData.ward.ward_name.trim() || 'Not specified',
          ward_number: parseInt(manualFormData.ward.ward_number) || 0,
          councillor_name: manualFormData.ward.councillor_name.trim() || 'Not specified'
        };
      }
      
      if (hasMLAData) {
        localityData.mla = {
          mla_name: manualFormData.mla.mla_name.trim() || 'Not specified',
          constituency: manualFormData.mla.constituency.trim() || 'Not specified',
          party_name: manualFormData.mla.party_name.trim() || 'Not specified'
        };
      }
      
      if (hasMPData) {
        localityData.mp = {
          mp_name: manualFormData.mp.mp_name.trim() || 'Not specified',
          constituency: manualFormData.mp.constituency.trim() || 'Not specified',
          party: manualFormData.mp.party.trim() || 'Not specified'
        };
      }

      console.log('🔍 Prepared locality data:', localityData);

      // Update the community with locality data
      console.log('🔍 Calling updateCommunity with:', {
        communityId: community.id,
        updates: { locality_data: localityData },
        userId: user.id
      });
      
      const { error } = await updateCommunity(
        community.id, 
        { 
          locality_data: localityData
        }, 
        user.id
      );

      if (error) {
        console.error('❌ Update community error:', error);
        throw error as any;
      }

      console.log('✅ Community updated successfully');

      toast({ 
        title: 'Representative Information Updated', 
        description: 'MP/MLA/Ward Councillor information has been added successfully' 
      });
      
      console.log('🔍 Closing dialog and resetting form...');
      setShowLocationUpdateDialog(false);
      // Reset form
      setManualFormData({
        ward: { ward_name: '', ward_number: '', councillor_name: '' },
        mla: { mla_name: '', constituency: '', party_name: '' },
        mp: { mp_name: '', constituency: '', party: '' }
      });
      
      console.log('🔍 Refreshing community data...');
      await fetchCommunityAndComplaints();
      console.log('✅ Community data refreshed');
      console.log('🔍 Current community data after refresh:', community);
      
    } catch (e: any) {
      console.error('❌ Error in handleManualLocationUpdate:', e);
      toast({ title: 'Error', description: e.message || 'Failed to update representative information', variant: 'destructive' });
    } finally {
      setLocationUpdateLoading(false);
    }
  };

  const handleVote = async (complaintId: string, vote: 'up' | 'down') => {
    if (!user || membershipStatus !== 'approved') return;
    const current = userVote[complaintId] || null;
    try {
      if (current === vote) {
        // remove vote
        await removeComplaintVote(complaintId, user.id);
        setUserVote(prev => ({ ...prev, [complaintId]: null }));
        setVoteSummary(prev => ({
          ...prev,
          [complaintId]: {
            up: (prev[complaintId]?.up || 0) - (vote === 'up' ? 1 : 0),
            down: (prev[complaintId]?.down || 0) - (vote === 'down' ? 1 : 0),
          },
        }));
      } else {
        await upsertComplaintVote(complaintId, user.id, vote);
        setUserVote(prev => ({ ...prev, [complaintId]: vote }));
        setVoteSummary(prev => ({
          ...prev,
          [complaintId]: {
            up: (prev[complaintId]?.up || 0) + (vote === 'up' ? 1 : 0) - (current === 'up' ? 1 : 0),
            down: (prev[complaintId]?.down || 0) + (vote === 'down' ? 1 : 0) - (current === 'down' ? 1 : 0),
          },
        }));
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to vote', variant: 'destructive' });
    }
  };

  const toggleComments = async (complaintId: string) => {
    const open = new Set(openComments);
    if (open.has(complaintId)) {
      open.delete(complaintId);
      setOpenComments(open);
      return;
    }
    open.add(complaintId);
    setOpenComments(open);
    if (!commentsById[complaintId]) {
      const { data } = await listComplaintComments(complaintId);
      setCommentsById(prev => ({ ...prev, [complaintId]: data || [] }));
    }
  };

  const submitComment = async (complaintId: string) => {
    if (!user || membershipStatus !== 'approved') return;
    const text = (commentDraft[complaintId] || '').trim();
    if (!text) return;
    try {
      const { data, error } = await addComplaintComment(complaintId, user.id, text);
      if (error) throw error as any;
      setCommentsById(prev => ({
        ...prev,
        [complaintId]: [data, ...(prev[complaintId] || [])],
      }));
      setCommentDraft(prev => ({ ...prev, [complaintId]: '' }));
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to add comment', variant: 'destructive' });
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pb-20 md:pb-8">
        {/* Desktop Navigation Only */}
        <div className="hidden md:block">
        <Navigation />
        </div>
        <div className="container mx-auto px-4 py-16">
            <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-lg mb-6">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-200 border-t-blue-600"></div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Community</h3>
            <p className="text-gray-600">Please wait while we fetch {communityName} community data...</p>
          </div>
        </div>
        <MobileBottomNavigation />
      </div>
    );
  }

  // Error state
  if (error || !community) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pb-20 md:pb-8">
        {/* Desktop Navigation Only */}
        <div className="hidden md:block">
        <Navigation />
        </div>
        <div className="container mx-auto px-4 py-16">
          <div className="text-center max-w-md mx-auto">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Community Not Found</h1>
            <p className="text-gray-600 mb-8">
              {error || `The community "${communityName}" does not exist.`}
            </p>
            <div className="space-y-3">
              <Button onClick={() => navigate('/')} className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Home
              </Button>
              <Button variant="outline" onClick={() => window.location.reload()} className="w-full border-2 border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold py-3 rounded-xl transition-all duration-300">
                Reload Page
              </Button>
            </div>
          </div>
        </div>
        <MobileBottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pb-20 md:pb-8">
      {/* Desktop Navigation Only */}
      <div className="hidden md:block">
      <Navigation />
      </div>
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Simplified Community Header */}
        <div className="bg-white rounded-2xl shadow-lg border-0 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                {community.name === 'India' ? (
                  <Flag className="h-7 w-7 text-white" />
                ) : (
                  <Building2 className="h-7 w-7 text-white" />
                )}
              </div>
                <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {community.name} Community
                  </h1>
                  {/* Subtle Membership Status Indicator - Removed green tick */}
                  {community.name.toLowerCase() !== 'india' && user && !membershipLoading && (
                    <div className="flex items-center gap-1">
                      {membershipStatus === 'pending' ? (
                        <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center" title="Request Pending">
                          <Users className="h-3 w-3 text-amber-600" />
                        </div>
                      ) : membershipStatus !== 'approved' ? (
                        <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center" title="Not a Member">
                          <Users className="h-3 w-3 text-gray-500" />
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {community.name.toLowerCase() === 'india' 
                    ? 'All public complaints from across India'
                      : community.description
                    }
                  </p>
                </div>
              </div>
            
            {/* Interactive Details Toggle and Join Request */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Join Request Button for Non-Members */}
              {community.name.toLowerCase() !== 'india' && user && membershipStatus !== 'approved' && membershipStatus !== 'pending' && (
                    <Button
                      size="sm"
                  onClick={handleRequestToJoin}
                      disabled={membershipLoading}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-2 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto"
                    >
                      <Users className="h-4 w-4" />
                  Request to Join
                    </Button>
                  )}
              
              {/* Details Toggle */}
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl border-2 border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-300 w-full sm:w-auto"
              >
                <Settings className="h-4 w-4" />
                <span className="text-sm font-medium">Details</span>
                {showDetails ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
                </div>
          </div>
        </div>

        {/* Detailed Sections - Hidden by Default */}
        {showDetails && (
          <div className="space-y-6 mb-8">

            {/* President and Finance Cards */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2 bg-white rounded-2xl shadow-lg border-0 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">President</h3>
                  <Badge className="bg-blue-100 text-blue-700 border border-blue-200 px-3 py-1 rounded-full font-medium">President</Badge>
                </div>
                {president ? (
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold text-lg">{getInitials(president.full_name || president.email || 'U')}</span>
                    </div>
                    <div className="flex-1">
                      <div className="text-lg font-semibold text-gray-900 mb-1">{president.full_name || 'N/A'}</div>
                      <div className="text-sm text-gray-600 mb-1">{president.email || '—'}</div>
                      {president.phone && (
                        <div className="text-sm text-gray-600">{president.phone}</div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-2xl animate-pulse"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
                    </div>
                  </div>
                )}

                {/* Leave Community action for all members (non-India only) */}
                {membershipStatus === 'approved' && user && community.name.toLowerCase() !== 'india' && (
                  <div className="mt-5 p-4 border border-red-300 bg-red-50 rounded-xl bg-gradient-to-r from-red-50 to-red-100">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                        <span className="text-white text-sm font-bold">🚪</span>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-red-800">Leave Community</div>
                        <div className="text-xs text-red-600">You are currently a member</div>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={handleLeaveCommunity} 
                      disabled={leaving}
                      className="w-full bg-red-500 hover:bg-red-600 text-white border-red-500 hover:border-red-600 font-medium py-2 transition-all duration-200 hover:scale-[1.02] shadow-sm"
                    >
                      {leaving ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Leaving Community…
                        </div>
                      ) : (
                        `Leave ${community.name}`
                      )}
                    </Button>
                  </div>
                )}

              </div>
              
              <div className="bg-white rounded-2xl shadow-lg border-0 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Finance</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <span className="text-sm font-medium text-gray-600">Collected</span>
                    <span className="text-lg font-bold text-green-600">₹ {finance.collected.toLocaleString()}</span>
            </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <span className="text-sm font-medium text-gray-600">Spent</span>
                    <span className="text-lg font-bold text-red-600">₹ {finance.spent.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border-2 border-blue-200">
                    <span className="text-sm font-semibold text-gray-700">Balance</span>
                    <span className="text-xl font-bold text-blue-700">₹ {finance.balance.toLocaleString()}</span>
                  </div>
                </div>
          </div>
        </div>

            {/* Community Stats */}
            <div className="bg-white rounded-2xl shadow-lg border-0 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Community Stats</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {/* Member Count */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-xl font-bold text-gray-900 mb-1">{memberCount}</div>
                  <div className="text-xs text-gray-600">Members</div>
                </div>
                
                {/* Total Complaints */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 text-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <AlertCircle className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-xl font-bold text-gray-900 mb-1">{complaints.length}</div>
                  <div className="text-xs text-gray-600">
              {community.name.toLowerCase() === 'india' ? 'Public Complaints' : 'Total Complaints'}
            </div>
          </div>
                
                {/* Pending Complaints */}
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 text-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-xl font-bold text-yellow-600 mb-1">
              {complaints.filter(c => c.status === 'pending').length}
            </div>
                  <div className="text-xs text-gray-600">Pending</div>
          </div>
                
                {/* In Progress Complaints */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <RefreshCw className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-xl font-bold text-blue-600 mb-1">
              {complaints.filter(c => c.status === 'in_progress').length}
            </div>
                  <div className="text-xs text-gray-600">In Progress</div>
          </div>
                
                {/* Resolved Complaints */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 text-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <Eye className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-xl font-bold text-green-600 mb-1">
              {complaints.filter(c => c.status === 'resolved').length}
            </div>
                  <div className="text-xs text-gray-600">Resolved</div>
                </div>
          </div>
        </div>

            {/* MP/MLA/Ward Councillor Information */}
            {console.log('🔍 Rendering representative info section. Community:', community, 'Has locality_data:', !!community?.locality_data)}
            {community?.locality_data ? (
              <div className="bg-white rounded-2xl shadow-lg border-0 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center">
                    <Landmark className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Representative Information</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Ward Information */}
                  {community.locality_data.ward && (
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Building2 className="h-5 w-5 text-blue-600" />
                        <h4 className="font-semibold text-blue-900">Ward Information</h4>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="font-medium text-gray-700">Ward:</span>
                          <span className="ml-2 text-gray-600">
                            {community.locality_data.ward.ward_name} (Ward {community.locality_data.ward.ward_number})
                          </span>
                        </div>
                        <div className="text-sm">
                          <span className="font-medium text-gray-700">Councillor:</span>
                          <span className="ml-2 text-gray-600">{community.locality_data.ward.councillor_name}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* MLA Information */}
                  {community.locality_data.mla && (
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <User className="h-5 w-5 text-green-600" />
                        <h4 className="font-semibold text-green-900">MLA Information</h4>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="font-medium text-gray-700">Name:</span>
                          <span className="ml-2 text-gray-600">{community.locality_data.mla.mla_name}</span>
                        </div>
                        <div className="text-sm">
                          <span className="font-medium text-gray-700">Constituency:</span>
                          <span className="ml-2 text-gray-600">{community.locality_data.mla.constituency}</span>
                        </div>
                        <div className="text-sm">
                          <span className="font-medium text-gray-700">Party:</span>
                          <span className="ml-2 text-gray-600">{community.locality_data.mla.party_name}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* MP Information */}
                  {community.locality_data.mp && (
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Landmark className="h-5 w-5 text-purple-600" />
                        <h4 className="font-semibold text-purple-900">MP Information</h4>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="font-medium text-gray-700">Name:</span>
                          <span className="ml-2 text-gray-600">{community.locality_data.mp.mp_name}</span>
                        </div>
                        <div className="text-sm">
                          <span className="font-medium text-gray-700">Constituency:</span>
                          <span className="ml-2 text-gray-600">{community.locality_data.mp.constituency}</span>
                        </div>
                        <div className="text-sm">
                          <span className="font-medium text-gray-700">Party:</span>
                          <span className="ml-2 text-gray-600">{community.locality_data.mp.party}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Update Location Info Button for communities without locality data */
              <div className="bg-white rounded-2xl shadow-lg border-0 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-500 rounded-xl flex items-center justify-center">
                    <Landmark className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Representative Information</h3>
                </div>
                
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <MapPin className="h-8 w-8 text-gray-400" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">No Location Data Available</h4>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    This community doesn't have MP/MLA/Ward Councillor information yet. 
                    Community admins can manually add this information.
                  </p>
                  
                  {/* Show update button only for community admins */}
                  {isPresidentOrAdmin && (
                    <Button 
                      onClick={() => setShowLocationUpdateDialog(true)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium"
                    >
                      <Landmark className="h-4 w-4 mr-2" />
                      Add Representative Info
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* President Panel */}
            {isPresidentOrAdmin && (
              <div className="bg-white rounded-2xl shadow-lg border-0 p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">President Panel</h3>
                </div>
            <Tabs defaultValue="requests" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-6 bg-gray-100 rounded-xl p-1">
                <TabsTrigger value="requests" className="rounded-lg font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">Requests</TabsTrigger>
                <TabsTrigger value="complaints" className="rounded-lg font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">Complaints</TabsTrigger>
                <TabsTrigger value="finance" className="rounded-lg font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">Finance</TabsTrigger>
                <TabsTrigger value="profile" className="rounded-lg font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">Profile</TabsTrigger>
              </TabsList>

              <TabsContent value="requests">
                <div className="flex items-center justify-between mb-3">
                  <Button size="sm" variant="outline" onClick={loadPendingRequests}>
                    Load Pending Requests
                  </Button>
                  <div className="text-sm text-gray-600">{pendingRequests.length} pending</div>
                </div>
                {requestsLoading ? (
                  <div className="text-sm text-gray-500">Loading…</div>
                ) : pendingRequests.length === 0 ? (
                  <div className="text-sm text-gray-600">No pending requests.</div>
                ) : (
                  <div className="space-y-2">
                    {pendingRequests.map((req: any) => (
                      <div key={req.id} className="flex items-center justify-between border rounded-md p-3">
                        <div className="text-sm">
                          <div className="font-medium">{req.users?.full_name || req.users?.email || 'User'}</div>
                          <div className="text-gray-600 text-xs">Role: {req.role} • Block: {req.block_name || req.blocks?.name || '—'}</div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" disabled={updatingReqId===req.id} onClick={() => handleUpdateRequest(req.id, 'rejected')}>Reject</Button>
                          <Button size="sm" disabled={updatingReqId===req.id} onClick={() => handleUpdateRequest(req.id, 'approved')}>Approve</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="complaints">
                <div className="space-y-3">
                  {complaints.length === 0 ? (
                    <div className="text-sm text-gray-600">No complaints.</div>
                  ) : (
                    complaints.map(c => (
                      <div key={c.id} className="flex items-center justify-between border rounded-md p-3">
                        <div className="text-sm">
                          <div className="font-medium">{c.category.replace('-', ' ')}</div>
                          <div className="text-gray-600 text-xs">{c.description.slice(0,90)}{c.description.length>90?'…':''}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">{c.category.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}</Badge>
                          {isPresidentOrAdmin ? (
                            <select
                              className="border rounded px-2 py-1 text-xs"
                              value={c.status}
                              onChange={(e) => handleUpdateComplaintStatus(c.id, e.target.value as any)}
                              disabled={updatingComplaintId === c.id}
                            >
                              <option value="pending">Pending</option>
                              <option value="in_progress">In Progress</option>
                              <option value="resolved">Resolved</option>
                              <option value="rejected">Rejected</option>
                            </select>
                          ) : (
                            <Badge className={`${getStatusColor(c.status)} text-xs`}>{getStatusText(c.status)}</Badge>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="finance">
                <form onSubmit={handleAddTransaction} className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-4">
                  <select className="border rounded px-2 py-1 text-sm" value={txForm.type} onChange={e=>setTxForm(prev=>({...prev, type: e.target.value as any}))}>
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                  <input className="border rounded px-2 py-1 text-sm" type="number" step="0.01" placeholder="Amount" value={txForm.amount} onChange={e=>setTxForm(prev=>({...prev, amount: e.target.value}))} />
                  <input className="border rounded px-2 py-1 text-sm md:col-span-2" placeholder="Note (optional)" value={txForm.note} onChange={e=>setTxForm(prev=>({...prev, note: e.target.value}))} />
                  <Button type="submit" size="sm" disabled={isAddingTx}>Add</Button>
                </form>
                <div className="text-sm font-medium mb-2">Recent Transactions</div>
                {recentTx.length === 0 ? (
                  <div className="text-sm text-gray-600">No transactions yet.</div>
                ) : (
                  <div className="space-y-2">
                    {recentTx.map(tx => (
                      <div key={tx.id} className="flex items-center justify-between border rounded-md p-3 text-sm">
                        <div className="capitalize {tx.type==='expense'?'text-red-700':'text-green-700'}">{tx.type}</div>
                        <div>₹ {tx.amount.toLocaleString()}</div>
                        <div className="text-gray-600 truncate max-w-[50%]">{tx.note || '—'}</div>
                        <div className="text-gray-600">{new Date(tx.created_at).toLocaleDateString()}</div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="profile">
                <form onSubmit={handleUpdateProfile} className="space-y-2 max-w-xl">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Description</label>
                    <textarea className="w-full border rounded px-3 py-2 text-sm" rows={3} value={profileForm.description} onChange={e=>setProfileForm(prev=>({...prev, description: e.target.value}))} />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Location</label>
                    <input className="w-full border rounded px-3 py-2 text-sm" value={profileForm.location} onChange={e=>setProfileForm(prev=>({...prev, location: e.target.value}))} />
                  </div>
                  <Button type="submit" size="sm">Save</Button>
                </form>
              </TabsContent>
            </Tabs>
              </div>
            )}
          </div>
        )}

        {/* Main Complaints Feed - Primary Focus */}
        <div className="space-y-6">

        {/* Tabs for filtering complaints */}
        <Tabs defaultValue="in_progress" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-100 rounded-xl p-1">
              <TabsTrigger value="in_progress" className="rounded-lg font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">
              In Progress ({complaints.filter(c => c.status === 'pending' || c.status === 'in_progress').length})
            </TabsTrigger>
              <TabsTrigger value="resolved" className="rounded-lg font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Resolved ({complaints.filter(c => c.status === 'resolved').length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="in_progress">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {complaints.filter(c => c.status === 'pending' || c.status === 'in_progress').length === 0 ? (
                <div className="col-span-full bg-white rounded-2xl shadow-lg border-0 p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Eye className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-gray-900">No In Progress Complaints</h3>
                  <p className="text-gray-600 mb-6">No pending or in-progress complaints in {community.name} community.</p>
                </div>
              ) : (
                complaints
                  .filter(c => c.status === 'pending' || c.status === 'in_progress')
                  .map((complaint) => (
                    <div key={complaint.id} className="bg-white rounded-2xl shadow-lg border-0 hover:shadow-xl transition-all duration-300 overflow-hidden">
                    <div className="p-4 md:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                              <span className="text-white font-bold text-sm">{getInitials(complaint.users?.full_name)}</span>
                          </div>
                          <div>
                              <h3 className="font-bold text-gray-900 text-sm md:text-base mb-1">{complaint.users?.full_name || 'Anonymous User'}</h3>
                              <p className="text-xs text-gray-500 flex items-center gap-2"><Calendar className="h-3 w-3" />{formatDate(complaint.created_at)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs px-2 py-1 rounded-full border-gray-200">{complaint.category.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}</Badge>
                            {isPresidentOrAdmin ? (
                              <select
                                className="border-2 border-gray-200 rounded-lg px-2 py-1 text-xs font-medium focus:border-blue-500 focus:outline-none"
                                value={complaint.status}
                                onChange={(e) => handleUpdateComplaintStatus(complaint.id, e.target.value as any)}
                                disabled={updatingComplaintId === complaint.id}
                              >
                                <option value="pending">Pending</option>
                                <option value="in_progress">In Progress</option>
                                <option value="resolved">Resolved</option>
                                <option value="rejected">Rejected</option>
                              </select>
                            ) : (
                              <Badge className={`${getStatusColor(complaint.status)} text-xs px-2 py-1 rounded-full font-medium`}>{getStatusText(complaint.status)}</Badge>
                            )}
                        </div>
                      </div>

                      <div className="space-y-3">
                          <LocationDisplay location_address={complaint.location_address} latitude={complaint.latitude} longitude={complaint.longitude} />
                          <div className="bg-gray-50 rounded-xl p-3 md:p-4">
                            <h4 className="text-xs md:text-sm font-semibold text-gray-700 mb-2 md:mb-3">COMPLAINT DESCRIPTION</h4>
                            <p className="text-gray-900 leading-relaxed text-sm md:text-base">{complaint.description}</p>
                        </div>
                        {complaint.complaint_files && complaint.complaint_files.length > 0 && (
                            <div className="space-y-2 md:space-y-3">
                              <h4 className="text-xs md:text-sm font-semibold text-gray-700">ATTACHMENTS</h4>
                              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-3">
                              {complaint.complaint_files.map((file) => (
                                <div key={file.id} className="relative">
                                  {file.file_type.startsWith('image/') ? (
                                      <img src={file.file_url} alt={file.file_name} className="w-full h-20 md:h-24 xl:h-28 object-cover rounded-xl border-2 border-gray-200 shadow-sm" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                    ) : (
                                      <div className="w-full h-20 md:h-24 xl:h-28 bg-gray-100 rounded-xl border-2 border-gray-200 flex items-center justify-center shadow-sm"><span className="text-xs text-gray-500 font-medium">{file.file_name}</span></div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                            <div className="flex items-center space-x-2 md:space-x-3">
                              <Button variant="ghost" size="sm" onClick={() => handleVote(complaint.id, 'up')} className={`flex items-center space-x-1 md:space-x-2 text-xs md:text-sm px-3 md:px-4 py-2 rounded-xl font-medium transition-all duration-300 ${userVote[complaint.id] === 'up' ? 'text-green-600 bg-green-50 border border-green-200' : 'text-gray-600 hover:bg-green-50 hover:text-green-600 hover:border-green-200'}`}>
                                <ThumbsUp className="h-3 w-3 md:h-4 md:w-4" />
                                <span>{voteSummary[complaint.id]?.up || 0}</span>
                            </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleVote(complaint.id, 'down')} className={`flex items-center space-x-1 md:space-x-2 text-xs md:text-sm px-3 md:px-4 py-2 rounded-xl font-medium transition-all duration-300 ${userVote[complaint.id] === 'down' ? 'text-red-600 bg-red-50 border border-red-200' : 'text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200'}`}>
                                <ThumbsDown className="h-3 w-3 md:h-4 md:w-4" />
                                <span>{voteSummary[complaint.id]?.down || 0}</span>
                            </Button>
                              <Button variant="ghost" size="sm" className="text-xs md:text-sm text-gray-600 px-3 md:px-4 py-2 rounded-xl font-medium hover:bg-gray-50 transition-all duration-300" onClick={() => toggleComments(complaint.id)}>Comments</Button>
                          </div>
                        </div>
                          {openComments.has(complaint.id) && (
                            <div className="mt-6 space-y-4 bg-gray-50 rounded-xl p-4">
                              <div className="flex gap-3">
                                <input className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:border-blue-500 focus:outline-none" placeholder="Write a comment..." value={commentDraft[complaint.id] || ''} onChange={(e) => setCommentDraft((prev) => ({ ...prev, [complaint.id]: e.target.value }))} />
                                <Button size="sm" onClick={() => submitComment(complaint.id)} disabled={!(commentDraft[complaint.id] || '').trim()} className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">Post</Button>
                      </div>
                              <div className="space-y-3">
                                {(commentsById[complaint.id] || []).map((cm) => (
                                  <div key={cm.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                                    <div className="text-xs text-gray-600 mb-2 font-medium">{cm.users?.full_name || 'User'} • {formatDate(cm.created_at)}</div>
                                    <div className="text-sm text-gray-900">{cm.content}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="resolved">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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
                          {isPresidentOrAdmin ? (
                            <select
                              className="border rounded px-2 py-1 text-xs"
                              value={complaint.status}
                              onChange={(e) => handleUpdateComplaintStatus(complaint.id, e.target.value as any)}
                              disabled={updatingComplaintId === complaint.id}
                            >
                              <option value="pending">Pending</option>
                              <option value="in_progress">In Progress</option>
                              <option value="resolved">Resolved</option>
                              <option value="rejected">Rejected</option>
                            </select>
                          ) : (
                          <Badge className={`${getStatusColor(complaint.status)} text-xs`}>
                            {getStatusText(complaint.status)}
                          </Badge>
                          )}
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

      {/* Access gate: block non-members from full content except India */}
      {community && community.name.toLowerCase() !== 'india' && membershipStatus !== 'approved' && !loading && (
        <div className="mt-6 p-4 border rounded-md bg-white">
          <div className="text-sm text-gray-700">
            {membershipStatus === 'pending' && 'Your request is pending approval. You will get access once approved.'}
            {membershipStatus === 'rejected' && 'Your request was rejected. Contact the community president if you think this is a mistake.'}
            {membershipStatus === 'none' && 'You are not a member of this community.'}
          </div>
        </div>
      )}

      {/* Floating Action Button - Exclusive method for filing complaints */}
      {community && membershipStatus === 'approved' && (
        <button
          onClick={() => setComplaintOpen(true)}
          className="fixed bottom-20 right-6 h-16 w-16 rounded-2xl bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-xl hover:shadow-2xl flex items-center justify-center z-50 transition-all duration-300 group"
          title="File Complaint"
        >
          <span className="text-2xl font-bold leading-none group-hover:scale-110 transition-transform duration-300">+</span>
        </button>
      )}

      {/* Non-member floating button for join request */}
      {community && community.name.toLowerCase() !== 'india' && user && membershipStatus !== 'approved' && membershipStatus !== 'pending' && (
        <button
          onClick={handleRequestToJoin}
          disabled={membershipLoading}
          className="fixed bottom-20 right-6 h-16 w-16 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-xl hover:shadow-2xl flex items-center justify-center z-50 transition-all duration-300 group disabled:opacity-50 disabled:cursor-not-allowed"
          title="Request to Join"
        >
          <Users className="h-6 w-6 group-hover:scale-110 transition-transform duration-300" />
        </button>
      )}

      {/* Mobile Bottom Navigation */}
      <MobileBottomNavigation />

      {/* Complaint modal/drawer reusing ComplaintForm */}
      {membershipStatus === 'approved' && (
        isMobile ? (
          <Drawer open={complaintOpen} onOpenChange={setComplaintOpen}>
            <DrawerContent className="h-[95vh] flex flex-col">
              <DrawerHeader className="flex-shrink-0 pb-2">
                <DrawerTitle>File a Complaint</DrawerTitle>
              </DrawerHeader>
              <div className="flex-1 overflow-y-auto px-4 pb-6">
                <ComplaintForm
                  stayOnPage
                  onSubmitted={async () => {
                    setComplaintOpen(false);
                    await handleRefresh();
                  }}
                />
              </div>
            </DrawerContent>
          </Drawer>
        ) : (
          <Dialog open={complaintOpen} onOpenChange={setComplaintOpen}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
              <DialogHeader className="flex-shrink-0 pb-2">
                <DialogTitle>File a Complaint</DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto px-1">
                <ComplaintForm
                  stayOnPage
                  onSubmitted={async () => {
                    setComplaintOpen(false);
                    await handleRefresh();
                  }}
                />
              </div>
            </DialogContent>
          </Dialog>
        )
      )}

      {/* Manual Representative Information Dialog */}
      <Dialog open={showLocationUpdateDialog} onOpenChange={setShowLocationUpdateDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Landmark className="h-5 w-5 text-indigo-600" />
              Add Representative Information
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Ward Councillor Information */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Ward Councillor Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Ward Name</label>
                  <input
                    type="text"
                    value={manualFormData.ward.ward_name}
                    onChange={(e) => setManualFormData(prev => ({
                      ...prev,
                      ward: { ...prev.ward, ward_name: e.target.value }
                    }))}
                    placeholder="e.g., Civil Lines"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Ward Number</label>
                  <input
                    type="number"
                    value={manualFormData.ward.ward_number}
                    onChange={(e) => setManualFormData(prev => ({
                      ...prev,
                      ward: { ...prev.ward, ward_number: e.target.value }
                    }))}
                    placeholder="e.g., 15"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Councillor Name</label>
                  <input
                    type="text"
                    value={manualFormData.ward.councillor_name}
                    onChange={(e) => setManualFormData(prev => ({
                      ...prev,
                      ward: { ...prev.ward, councillor_name: e.target.value }
                    }))}
                    placeholder="e.g., Rajesh Kumar"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* MLA Information */}
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center gap-2">
                <User className="h-5 w-5" />
                MLA Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">MLA Name</label>
                  <input
                    type="text"
                    value={manualFormData.mla.mla_name}
                    onChange={(e) => setManualFormData(prev => ({
                      ...prev,
                      mla: { ...prev.mla, mla_name: e.target.value }
                    }))}
                    placeholder="e.g., Priya Sharma"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Constituency</label>
                  <input
                    type="text"
                    value={manualFormData.mla.constituency}
                    onChange={(e) => setManualFormData(prev => ({
                      ...prev,
                      mla: { ...prev.mla, constituency: e.target.value }
                    }))}
                    placeholder="e.g., Delhi Cantonment"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Party</label>
                  <input
                    type="text"
                    value={manualFormData.mla.party_name}
                    onChange={(e) => setManualFormData(prev => ({
                      ...prev,
                      mla: { ...prev.mla, party_name: e.target.value }
                    }))}
                    placeholder="e.g., BJP"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>
            </div>

            {/* MP Information */}
            <div className="bg-purple-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center gap-2">
                <Landmark className="h-5 w-5" />
                MP Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">MP Name</label>
                  <input
                    type="text"
                    value={manualFormData.mp.mp_name}
                    onChange={(e) => setManualFormData(prev => ({
                      ...prev,
                      mp: { ...prev.mp, mp_name: e.target.value }
                    }))}
                    placeholder="e.g., Amit Kumar"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Constituency</label>
                  <input
                    type="text"
                    value={manualFormData.mp.constituency}
                    onChange={(e) => setManualFormData(prev => ({
                      ...prev,
                      mp: { ...prev.mp, constituency: e.target.value }
                    }))}
                    placeholder="e.g., New Delhi"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Party</label>
                  <input
                    type="text"
                    value={manualFormData.mp.party}
                    onChange={(e) => setManualFormData(prev => ({
                      ...prev,
                      mp: { ...prev.mp, party: e.target.value }
                    }))}
                    placeholder="e.g., BJP"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowLocationUpdateDialog(false);
                  setManualFormData({
                    ward: { ward_name: '', ward_number: '', councillor_name: '' },
                    mla: { mla_name: '', constituency: '', party_name: '' },
                    mp: { mp_name: '', constituency: '', party: '' }
                  });
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleManualLocationUpdate}
                disabled={locationUpdateLoading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
              >
                {locationUpdateLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Updating...
                  </div>
                ) : (
                  'Save Representative Information'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CommunityPage;
