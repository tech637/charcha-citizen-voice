import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { getPublicComplaints, getAllCommunityComplaints } from '@/lib/complaints';
import { getIndiaCommunityId } from '@/lib/india-community';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  MapPin, 
  Calendar,
  Flag,
  Users
} from 'lucide-react';
import { hasLocationData } from '@/lib/locationUtils';
import { useLocationFormat } from '@/hooks/useLocationFormat';

interface Complaint {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  location_address?: string;
  latitude?: number;
  longitude?: number;
  is_public: boolean;
  community_id?: string;
  created_at: string;
  updated_at: string;
  users: {
    full_name?: string;
    email: string;
  };
  categories: {
    name: string;
    icon: string;
  };
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
    <div className="flex items-center space-x-2 text-sm text-muted-foreground bg-muted/30 rounded-md px-3 py-2 mb-3">
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

const IndiaCommunityFeed = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [indiaCommunityId, setIndiaCommunityId] = useState<string | null>(null);

  useEffect(() => {
    fetchIndiaCommunityAndComplaints();
  }, []);

  const fetchIndiaCommunityAndComplaints = async () => {
    try {
      setLoading(true);
      
      // Get India community ID
      const communityId = await getIndiaCommunityId();
      setIndiaCommunityId(communityId);
      
      if (communityId) {
        // First try the new getAllCommunityComplaints function
        const { data: newData, error: newError } = await getAllCommunityComplaints();
        
        if (newError) {
          console.warn('New getAllCommunityComplaints failed, falling back to getPublicComplaints:', newError);
          
          // Fallback to old getPublicComplaints method
          const { data: fallbackData, error: fallbackError } = await getPublicComplaints();
          
          if (fallbackError) {
            console.error('Both new and fallback methods failed:', fallbackError);
            setComplaints([]);
            return;
          }
          
          // Filter complaints that belong to India community
          const indiaComplaints = (fallbackData || []).filter(complaint => 
            complaint.community_id === communityId
          );
          console.log('Using fallback method, found India complaints:', indiaComplaints.length);
          setComplaints(indiaComplaints);
        } else {
          // Use the new method - it already returns all community complaints
          console.log('Using new getAllCommunityComplaints method, found:', newData?.length || 0, 'complaints');
          setComplaints(newData || []);
        }
      } else {
        console.warn('India community not found');
        setComplaints([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "in_progress":
        return <Badge className="bg-orange-500"><AlertCircle className="w-3 h-3 mr-1" />In Progress</Badge>;
      case "resolved":
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Resolved</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "urgent":
        return <Badge variant="destructive">Urgent</Badge>;
      case "high":
        return <Badge className="bg-red-500">High</Badge>;
      case "medium":
        return <Badge className="bg-yellow-500">Medium</Badge>;
      case "low":
        return <Badge variant="secondary">Low</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading India community feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Flag className="h-8 w-8 text-orange-500" />
            <h1 className="text-3xl font-bold text-gray-900">India Community</h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Public complaints and civic issues shared by citizens across India. 
            Join the conversation and help make our communities better.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-primary">{complaints.length}</div>
              <p className="text-sm text-muted-foreground">Total Complaints</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-orange-500">
                {complaints.filter(c => c.status === 'pending').length}
              </div>
              <p className="text-sm text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-500">
                {complaints.filter(c => c.status === 'in_progress').length}
              </div>
              <p className="text-sm text-muted-foreground">In Progress</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-500">
                {complaints.filter(c => c.status === 'resolved').length}
              </div>
              <p className="text-sm text-muted-foreground">Resolved</p>
            </CardContent>
          </Card>
        </div>

        {/* Complaints Feed */}
        {complaints.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Public Complaints Yet</h3>
              <p className="text-muted-foreground mb-6">
                Be the first to share a public complaint in the India community.
              </p>
              <Button onClick={() => navigate('/')}>
                <FileText className="h-4 w-4 mr-2" />
                File a Complaint
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {complaints.map((complaint) => (
              <Card key={complaint.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">{complaint.title || 'Complaint'}</CardTitle>
                    </div>
                    <div className="flex gap-2">
                      {getStatusBadge(complaint.status)}
                      {getPriorityBadge(complaint.priority)}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{complaint.users.full_name || complaint.users.email}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(complaint.created_at)}</span>
                    </div>
                    {complaint.categories && (
                      <Badge variant="outline">{complaint.categories.name}</Badge>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <LocationDisplay
                    location_address={complaint.location_address}
                    latitude={complaint.latitude}
                    longitude={complaint.longitude}
                  />
                  
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg p-4 mb-4">
                    <h4 className="font-semibold text-blue-900 mb-2">Complaint Description:</h4>
                    <p className="text-gray-700 leading-relaxed">{complaint.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Call to Action */}
        <div className="text-center mt-12">
          <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
            <CardContent className="py-8">
              <h3 className="text-xl font-semibold mb-2 text-orange-900">Share Your Voice</h3>
              <p className="text-orange-700 mb-4">
                Have a civic issue to report? File a complaint and it will appear here if you choose to share it publicly.
              </p>
              <Button 
                onClick={() => navigate('/')}
                className="bg-orange-500 hover:bg-orange-600"
              >
                <FileText className="h-4 w-4 mr-2" />
                File a Complaint
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default IndiaCommunityFeed;
