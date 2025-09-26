import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ResponsiveContainer, ResponsiveSection, ResponsiveGrid, ResponsiveCard } from './responsive/ResponsiveLayout';
import { EmptyState } from './ui/empty-state';
import { FloatingActionButton } from './ui/floating-action-button';
import { StatusBadge } from './ui/status-badge';
import { ThumbsUp, ThumbsDown, MapPin, Calendar, Eye, RefreshCw, AlertCircle, ArrowLeft, Building2, Users, Flag, Crown, DollarSign, FileText, Clock, CheckCircle } from 'lucide-react';
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
    navigate(`/join-communities?communityId=${community.id}`);
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
              
              {/* Membership Status and Request to Join Button */}
              {community.name.toLowerCase() !== 'india' && user && (
                <div className="flex items-center gap-2">
                  {membershipLoading ? (
                    <div className="text-sm text-gray-500">Checking...</div>
                  ) : membershipStatus === 'approved' ? (
                    <></>
                  ) : membershipStatus === 'pending' ? (
                    <div className="flex items-center gap-1 text-amber-600 text-sm">
                      <Users className="h-4 w-4" />
                      <span>Request Sent • Pending Approval</span>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      onClick={handleRequestToJoin}
                      disabled={membershipLoading}
                      className="flex items-center gap-2"
                    >
                      <Users className="h-4 w-4" />
                      Request to Join
                    </Button>
                  )}
                </div>
              )}
 
              {/* Raise Complaint (approved members only) */}
              {membershipStatus === 'approved' && (
                <Button
                  size="sm"
                  onClick={() => setComplaintOpen(true)}
                  className="flex items-center gap-2"
                >
                  File Complaint
                </Button>
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

        {/* President and Finance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg border p-4 md:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-800">President</h3>
              <Badge>President</Badge>
            </div>
            {president ? (
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>{getInitials(president.full_name || president.email || 'U')}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-sm font-medium text-gray-900">{president.full_name || 'N/A'}</div>
                  <div className="text-xs text-gray-600">{president.email || '—'}</div>
                  {president.phone && (
                    <div className="text-xs text-gray-600">{president.phone}</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500">Loading president details…</div>
            )}
          </div>
          <div className="bg-white rounded-lg border p-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">Finance</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span>Collected</span><span>₹ {finance.collected.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Spent</span><span>₹ {finance.spent.toLocaleString()}</span></div>
              <div className="flex justify-between font-semibold"><span>Balance</span><span>₹ {finance.balance.toLocaleString()}</span></div>
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

        {/* President Panel */}
        {isPresidentOrAdmin && (
          <div className="bg-white rounded-lg border p-4 md:p-6 mb-6">
            <h3 className="text-base font-semibold text-gray-900 mb-3">President Panel</h3>
            <Tabs defaultValue="requests" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-4">
                <TabsTrigger value="requests">Requests</TabsTrigger>
                <TabsTrigger value="complaints">Complaints</TabsTrigger>
                <TabsTrigger value="finance">Finance</TabsTrigger>
                <TabsTrigger value="profile">Profile</TabsTrigger>
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
                  <p className="text-gray-600 mb-4">No pending or in-progress complaints in {community.name} community.</p>
                </div>
              ) : (
                complaints
                  .filter(c => c.status === 'pending' || c.status === 'in_progress')
                  .map((complaint) => (
                    <div key={complaint.id} className="bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow">
                      <div className="p-4 md:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-primary">{getInitials(complaint.users?.full_name)}</span>
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 text-sm md:text-base">{complaint.users?.full_name || 'Anonymous User'}</h3>
                              <p className="text-xs text-gray-500 flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(complaint.created_at)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">{complaint.category.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}</Badge>
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
                              <Badge className={`${getStatusColor(complaint.status)} text-xs`}>{getStatusText(complaint.status)}</Badge>
                            )}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <LocationDisplay location_address={complaint.location_address} latitude={complaint.latitude} longitude={complaint.longitude} />
                          <div className="bg-gray-50 rounded-lg p-3 md:p-4">
                            <h4 className="text-xs font-medium text-gray-600 mb-2">COMPLAINT DESCRIPTION</h4>
                            <p className="text-sm text-gray-900 leading-relaxed">{complaint.description}</p>
                          </div>
                          {complaint.complaint_files && complaint.complaint_files.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="text-xs font-medium text-gray-600">ATTACHMENTS</h4>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {complaint.complaint_files.map((file) => (
                                  <div key={file.id} className="relative">
                                    {file.file_type.startsWith('image/') ? (
                                      <img src={file.file_url} alt={file.file_name} className="w-full h-20 md:h-24 object-cover rounded-md border" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                    ) : (
                                      <div className="w-full h-20 md:h-24 bg-gray-100 rounded-md border flex items-center justify-center"><span className="text-xs text-gray-500">{file.file_name}</span></div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                            <div className="flex items-center space-x-2">
                              <Button variant="ghost" size="sm" onClick={() => handleVote(complaint.id, 'up')} className={`flex items-center space-x-1 text-xs ${userVote[complaint.id] === 'up' ? 'text-green-600 bg-green-50' : 'text-gray-600 hover:bg-green-50 hover:text-green-600'}`}>
                                <ThumbsUp className="h-3 w-3" />
                                <span>{voteSummary[complaint.id]?.up || 0}</span>
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleVote(complaint.id, 'down')} className={`flex items-center space-x-1 text-xs ${userVote[complaint.id] === 'down' ? 'text-red-600 bg-red-50' : 'text-gray-600 hover:bg-red-50 hover:text-red-600'}`}>
                                <ThumbsDown className="h-3 w-3" />
                                <span>{voteSummary[complaint.id]?.down || 0}</span>
                              </Button>
                              <Button variant="ghost" size="sm" className="text-xs text-gray-600" onClick={() => toggleComments(complaint.id)}>Comments</Button>
                            </div>
                          </div>
                          {openComments.has(complaint.id) && (
                            <div className="mt-3 space-y-2">
                              <div className="flex gap-2">
                                <input className="flex-1 border rounded px-2 py-1 text-sm" placeholder="Write a comment" value={commentDraft[complaint.id] || ''} onChange={(e) => setCommentDraft((prev) => ({ ...prev, [complaint.id]: e.target.value }))} />
                                <Button size="sm" onClick={() => submitComment(complaint.id)} disabled={!(commentDraft[complaint.id] || '').trim()}>Post</Button>
                              </div>
                              <div className="space-y-2">
                                {(commentsById[complaint.id] || []).map((cm) => (
                                  <div key={cm.id} className="text-sm border rounded p-2">
                                    <div className="text-xs text-gray-600 mb-1">{cm.users?.full_name || 'User'} • {formatDate(cm.created_at)}</div>
                                    <div>{cm.content}</div>
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

      {/* Floating mobile compose button for filing complaint (approved only) */}
      {community && membershipStatus === 'approved' && (
        <button
          onClick={() => setComplaintOpen(true)}
          className="fixed md:hidden bottom-6 right-6 h-14 w-14 rounded-full bg-primary text-white shadow-lg flex items-center justify-center z-50"
          title="File Complaint"
        >
          <span className="text-3xl leading-none">+</span>
        </button>
      )}

      {/* Complaint modal/drawer reusing ComplaintForm */}
      {membershipStatus === 'approved' && (
        isMobile ? (
          <Drawer open={complaintOpen} onOpenChange={setComplaintOpen}>
            <DrawerContent className="max-h-[85vh] overflow-y-auto">
              <DrawerHeader>
                <DrawerTitle>File a Complaint</DrawerTitle>
              </DrawerHeader>
              <div className="px-4 pb-6">
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
            <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>File a Complaint</DialogTitle>
              </DialogHeader>
              <ComplaintForm
                stayOnPage
                onSubmitted={async () => {
                  setComplaintOpen(false);
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

export default CommunityPage;
