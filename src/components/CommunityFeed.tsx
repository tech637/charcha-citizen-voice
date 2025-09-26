import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { getAllCommunityComplaintsForUser } from '@/lib/complaints';
import { useNavigate } from 'react-router-dom';
import { 
  FileText,
  Clock, 
  CheckCircle, 
  AlertCircle,
  Users, 
  MessageSquare,
  ArrowRight,
  Loader2, 
  Inbox
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Complaint } from '@/lib/supabase';

const CommunityFeed = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchComplaints();
    }
  }, [user]);

  const fetchComplaints = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data, error } = await getAllCommunityComplaintsForUser(user.id);
        if (error) throw error;
      // Sort by newest first
      const sortedData = (data || []).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setComplaints(sortedData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Could not load the community feed.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-100 text-blue-800"><AlertCircle className="w-3 h-3 mr-1" />In Progress</Badge>;
      case "resolved":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Resolved</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };
  
  const getCommunityName = (complaint: Complaint) => {
      if (typeof complaint.communities === 'object' && complaint.communities !== null && 'name' in complaint.communities) {
          return complaint.communities.name;
      }
      return 'a community';
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

    return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
          <h1 className="text-2xl font-bold tracking-tight">Community Feed</h1>
          <p className="text-muted-foreground">Updates from all communities you've joined.</p>
                </div>
                </div>

      {complaints.length === 0 ? (
        <Card className="text-center p-8">
          <CardContent className="flex flex-col items-center gap-4">
            <Inbox className="h-12 w-12 text-muted-foreground" />
            <h3 className="text-xl font-semibold">Your Feed is Empty</h3>
            <p className="text-muted-foreground">
              Complaints from communities you join will appear here.
            </p>
            <Button onClick={() => navigate('/communities')}>
              <Users className="h-4 w-4 mr-2" />
              Explore Communities
                                          </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {complaints.map((complaint) => (
            <Card key={complaint.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-semibold text-primary">{getCommunityName(complaint)}</span>
                  {getStatusBadge(complaint.status)}
                                </div>
                <p className="font-semibold capitalize mb-2">{complaint.category.replace('-', ' ')}</p>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {complaint.description}
                </p>
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>by {complaint.users?.full_name || 'Anonymous'}</span>
                  <span>{new Date(complaint.created_at).toLocaleDateString()}</span>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
      )}
      </div>
    );
};

export default CommunityFeed;

