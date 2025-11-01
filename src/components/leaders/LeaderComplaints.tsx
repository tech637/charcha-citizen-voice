import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  MapPin,
  Calendar,
  Eye,
  ThumbsUp,
  ThumbsDown,
  MessageSquare
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getCommunityComplaints, updateComplaintStatus, getComplaintVoteSummary, upsertComplaintVote, removeComplaintVote, listComplaintComments, addComplaintComment, getUserVoteForComplaint } from '@/lib/complaints';
import { LeaderType } from '@/lib/leaders';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useLocationFormat } from '@/hooks/useLocationFormat';

interface LeaderComplaintsProps {
  communityId: string;
  leaderType: LeaderType;
}

interface Complaint {
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
    email?: string;
  };
  complaint_files: Array<{
    id: string;
    file_url: string;
    file_name: string;
    file_type: string;
  }>;
}

const LeaderComplaints: React.FC<LeaderComplaintsProps> = ({ communityId, leaderType }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { formattedLocation } = useLocationFormat();
  
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [updatingComplaintId, setUpdatingComplaintId] = useState<string | null>(null);
  const [voteSummary, setVoteSummary] = useState<Record<string, { up: number; down: number }>>({});
  const [userVote, setUserVote] = useState<Record<string, 'up' | 'down' | null>>({});
  const [openComments, setOpenComments] = useState<Set<string>>(new Set());
  const [commentsById, setCommentsById] = useState<Record<string, Array<{ id: string; content: string; created_at: string; users?: { full_name?: string } }>>>({});
  const [commentDraft, setCommentDraft] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchComplaints();
  }, [communityId]);

  // Real-time subscription for complaint updates
  useEffect(() => {
    if (!communityId) return;

    const channel = supabase
      .channel(`complaint-updates-${communityId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'complaints',
          filter: `community_id=eq.${communityId}`
        },
        (payload) => {
          console.log('Complaint updated in leader dashboard:', payload);
          // Show a subtle notification that data was refreshed
          toast({
            title: "Complaint Updated",
            description: "Complaint status has been updated.",
            duration: 2000,
          });
          // Refresh complaints when any complaint in this community is updated
          fetchComplaints();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [communityId]);

  // Load vote summaries and user votes
  useEffect(() => {
    const loadVotes = async () => {
      if (!user || complaints.length === 0) return;
      
      const summaries: Record<string, { up: number; down: number }> = {};
      const votes: Record<string, 'up' | 'down' | null> = {};
      
      await Promise.all(complaints.map(async (complaint) => {
        const { data: summary } = await getComplaintVoteSummary(complaint.id);
        summaries[complaint.id] = summary || { up: 0, down: 0 };
        
        // Get user's vote
        const { data: myVote } = await getUserVoteForComplaint(complaint.id, user.id);
        votes[complaint.id] = myVote || null;
      }));
      
      setVoteSummary(summaries);
      setUserVote(votes);
    };
    
    loadVotes();
  }, [user, complaints]);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const { data, error } = await getCommunityComplaints(communityId);
      
      if (error) {
        throw error;
      }
      
      setComplaints(data || []);
    } catch (error) {
      console.error('Error fetching complaints:', error);
      toast({
        title: "Error",
        description: "Failed to fetch complaints",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (complaintId: string, newStatus: string) => {
    try {
      setUpdatingComplaintId(complaintId);
      console.log('Leader updating complaint status:', { complaintId, newStatus });
      
      const { error } = await updateComplaintStatus(complaintId, newStatus as any);
      
      if (error) {
        console.error('Failed to update complaint status:', error);
        throw error;
      }
      
      console.log('Complaint status updated successfully, updating local state');
      
      setComplaints(prev => 
        prev.map(c => c.id === complaintId ? { ...c, status: newStatus as any } : c)
      );
      
      toast({
        title: "Status Updated",
        description: `Complaint status changed to ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating complaint status:', error);
      toast({
        title: "Error",
        description: "Failed to update complaint status",
        variant: "destructive"
      });
    } finally {
      setUpdatingComplaintId(null);
    }
  };

  const handleVote = async (complaintId: string, vote: 'up' | 'down') => {
    if (!user) return;
    
    const current = userVote[complaintId] || null;
    try {
      if (current === vote) {
        // Remove vote
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
    } catch (error) {
      console.error('Error voting:', error);
      toast({
        title: "Error",
        description: "Failed to vote on complaint",
        variant: "destructive"
      });
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
    if (!user) return;
    const text = (commentDraft[complaintId] || '').trim();
    if (!text) return;
    
    try {
      const { data, error } = await addComplaintComment(complaintId, user.id, text);
      if (error) throw error;
      
      setCommentsById(prev => ({
        ...prev,
        [complaintId]: [data, ...(prev[complaintId] || [])],
      }));
      setCommentDraft(prev => ({ ...prev, [complaintId]: '' }));
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'in_progress':
        return <Badge className="bg-orange-500"><AlertCircle className="w-3 h-3 mr-1" />In Progress</Badge>;
      case 'resolved':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Resolved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500"><AlertCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const filteredComplaints = complaints.filter(complaint => 
    statusFilter === 'all' || complaint.status === statusFilter
  );

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading complaints...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Filter */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Complaints Management</h2>
          <p className="text-gray-600">Manage and update complaint statuses</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="acknowledged">Acknowledged</SelectItem>
              <SelectItem value="forwarded">Forwarded</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={fetchComplaints}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Complaints List */}
      <div className="space-y-4">
        {filteredComplaints.length === 0 ? (
          <Card className="text-center py-8">
            <CardContent>
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Complaints Found</h3>
              <p className="text-muted-foreground">
                {statusFilter === 'all' 
                  ? 'No complaints have been filed yet.' 
                  : `No complaints with status "${statusFilter}".`
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredComplaints.map((complaint) => (
            <Card key={complaint.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {getInitials(complaint.users?.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {complaint.users?.full_name || 'Anonymous User'}
                      </h3>
                      <p className="text-sm text-gray-600">{complaint.users?.email}</p>
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
                    <Select
                      value={complaint.status}
                      onValueChange={(value) => handleStatusUpdate(complaint.id, value)}
                      disabled={updatingComplaintId === complaint.id}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="acknowledged">Complaint Acknowledged</SelectItem>
                        <SelectItem value="forwarded">Forward to Concern Authority</SelectItem>
                        <SelectItem value="resolved">Complaint Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                {/* Location */}
                {complaint.location_address && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                    <MapPin className="h-3 w-3" />
                    <span>{complaint.location_address}</span>
                  </div>
                )}

                {/* Description */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">COMPLAINT DESCRIPTION</h4>
                  <p className="text-gray-900 leading-relaxed">{complaint.description}</p>
                </div>

                {/* Media Files */}
                {complaint.complaint_files && complaint.complaint_files.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">ATTACHMENTS</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {complaint.complaint_files.map((file) => (
                        <div key={file.id} className="relative">
                          {file.file_type.startsWith('image/') ? (
                            <img
                              src={file.file_url}
                              alt={file.file_name}
                              className="w-full h-20 object-cover rounded-md border"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-full h-20 bg-gray-100 rounded-md border flex items-center justify-center">
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
                      onClick={() => handleVote(complaint.id, 'up')}
                      className={`flex items-center space-x-1 text-xs ${
                        userVote[complaint.id] === 'up' 
                          ? 'text-green-600 bg-green-50' 
                          : 'text-gray-600 hover:bg-green-50 hover:text-green-600'
                      }`}
                    >
                      <ThumbsUp className="h-3 w-3" />
                      <span>{voteSummary[complaint.id]?.up || 0}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleVote(complaint.id, 'down')}
                      className={`flex items-center space-x-1 text-xs ${
                        userVote[complaint.id] === 'down' 
                          ? 'text-red-600 bg-red-50' 
                          : 'text-gray-600 hover:bg-red-50 hover:text-red-600'
                      }`}
                    >
                      <ThumbsDown className="h-3 w-3" />
                      <span>{voteSummary[complaint.id]?.down || 0}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleComments(complaint.id)}
                      className="text-xs text-gray-600 hover:bg-gray-50"
                    >
                      <MessageSquare className="h-3 w-3 mr-1" />
                      Comments
                    </Button>
                  </div>
                </div>

                {/* Comments Section */}
                {openComments.has(complaint.id) && (
                  <div className="mt-4 space-y-3 bg-gray-50 rounded-lg p-4">
                    <div className="flex gap-3">
                      <input
                        className="flex-1 border rounded px-3 py-2 text-sm"
                        placeholder="Write a comment..."
                        value={commentDraft[complaint.id] || ''}
                        onChange={(e) => setCommentDraft(prev => ({ ...prev, [complaint.id]: e.target.value }))}
                      />
                      <Button
                        size="sm"
                        onClick={() => submitComment(complaint.id)}
                        disabled={!(commentDraft[complaint.id] || '').trim()}
                      >
                        Post
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {(commentsById[complaint.id] || []).map((comment) => (
                        <div key={comment.id} className="bg-white border rounded p-3">
                          <div className="text-xs text-gray-600 mb-1">
                            {comment.users?.full_name || 'User'} • {formatDate(comment.created_at)}
                          </div>
                          <div className="text-sm text-gray-900">{comment.content}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default LeaderComplaints;
